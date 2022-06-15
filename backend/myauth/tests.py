import logging
from testing.tests import ComsolTest, get_token
from jwcrypto.jwt import JWT
from jwcrypto.jwk import JWK

private_key_data = open("testing/jwtRS256.key", "rb").read()
key = JWK()
key.import_from_pem(private_key_data)

invalid_private_key_data = open("myauth/invalid.key", "rb").read()
invalid_key = JWK()
invalid_key.import_from_pem(invalid_private_key_data)


class TestMyAuthAdmin(ComsolTest):

    loginUser = 0

    def test_me(self):
        res = self.get("/api/auth/me/")
        self.assertTrue(res["loggedin"])
        self.assertTrue(res["adminrights"])
        self.assertTrue(res["adminrightscat"])
        self.assertEqual(res["username"], self.user["username"])
        self.assertEqual(res["displayname"], self.user["displayname"])


class TestMyAuthNonadmin(ComsolTest):

    loginUser = 2

    def test_me(self):
        res = self.get("/api/auth/me/")
        self.assertTrue(res["loggedin"])
        self.assertFalse(res["adminrights"])
        self.assertFalse(res["adminrightscat"])
        self.assertEqual(res["username"], self.user["username"])
        self.assertEqual(res["displayname"], self.user["displayname"])


class TestMyAuthUnauthorized(ComsolTest):

    loginUser = -1

    def test_me(self):
        res = self.get("/api/auth/me/")
        self.assertFalse(res["loggedin"])
        self.assertFalse(res["adminrights"])
        self.assertFalse(res["adminrightscat"])


class TestJWT(ComsolTest):
    loginUser = -1

    def test_no_token(self):
        response = self.client.get("/api/notification/unreadcount/")
        self.assertEqual(response.status_code, 403)

    def test_empty_auth_header(self):
        token = ""
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
        )
        self.assertEqual(response.status_code, 403)

    def test_non_bearer_token(self):
        token = "Basic QWxhZGRpbjpPcGVuU2VzYW1l"
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
        )
        self.assertEqual(response.status_code, 403)

    def test_incorrectly_formatted_token(self):
        token = "Bearer 42 42 12"
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
        )
        self.assertEqual(response.status_code, 403)

    def test_token_with_wrong_key(self):
        user = self.loginUsers[0]
        sub = user["sub"] + "42"
        username = user["username"] + "42"
        given_name = user["given_name"]
        family_name = user["family_name"]
        admin = user["admin"]
        roles = ["admin"] if admin else []
        token = JWT(
            header={"alg": "RS256", "typ": "JWT", "kid": invalid_key.key_id},
            claims={
                "sub": sub,
                "resource_access": {"group": {"roles": roles}},
                "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": given_name + " " + family_name,
                "preferred_username": username,
                "given_name": given_name,
                "family_name": family_name,
            },
        )
        token.make_signed_token(invalid_key)
        token_str = "Bearer " + token.serialize()
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token_str
        )
        self.assertEqual(response.status_code, 403)

    def test_token_with_wrong_algorithm(self):
        user = self.loginUsers[0]
        sub = user["sub"] + "42"
        username = user["username"] + "42"
        given_name = user["given_name"]
        family_name = user["family_name"]
        admin = user["admin"]
        roles = ["admin"] if admin else []
        token = JWT(
            header={"alg": "PS256", "typ": "JWT", "kid": key.key_id},
            claims={
                "sub": sub,
                "resource_access": {"group": {"roles": roles}},
                "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": given_name + " " + family_name,
                "preferred_username": username,
                "given_name": given_name,
                "family_name": family_name,
            },
        )
        token.make_signed_token(key)
        token_str = "Bearer " + token.serialize()
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token_str
        )
        self.assertEqual(response.status_code, 200)

    def test_correct_token(self):
        user = self.loginUsers[0]
        sub = user["sub"] + "42"
        username = user["username"] + "42"
        given_name = user["given_name"]
        family_name = user["family_name"]
        admin = user["admin"]
        roles = ["admin"] if admin else []
        token = JWT(
            header={"alg": "RS256", "typ": "JWT", "kid": key.key_id},
            claims={
                "sub": sub,
                "resource_access": {"group": {"roles": roles}},
                "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": given_name + " " + family_name,
                "preferred_username": username,
                "given_name": given_name,
                "family_name": family_name,
            },
        )
        token.make_signed_token(key)
        token_str = "Bearer " + token.serialize()
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token_str
        )
        self.assertEqual(response.status_code, 200)


class TestAuth(ComsolTest):
    def test_empty_preferred_username(self):
        token = get_token(
            {
                "sub": "42",
                "username": "",
                "given_name": "Jonas",
                "family_name": "Schneider",
                "admin": True,
                "displayname": "Jonas Schneider",
            }
        )
        logging.disable(logging.CRITICAL)
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
        )
        logging.disable(logging.NOTSET)
        self.assertEqual(response.status_code, 403)

    def test_no_preferred_username(self):
        token = JWT(
            header={"alg": "RS256", "typ": "JWT", "kid": key.key_id},
            claims={
                "sub": "424242",
                "resource_access": {"group": {"roles": ["admin"]}},
                "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": "Given Family",
                "given_name": "given_name",
                "family_name": "family_name",
            },
        )
        token.make_signed_token(key)
        token_str = "Bearer " + token.serialize()
        logging.disable(logging.CRITICAL)
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token_str
        )
        logging.disable(logging.NOTSET)
        self.assertEqual(response.status_code, 403)
