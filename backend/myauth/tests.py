from testing.tests import ComsolTest, get_token
from jwt import encode
import logging

invalid_key = open("myauth/invalid.key", "rb").read()
private_key = open("testing/jwtRS256.key", "rb").read()


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
        encoded = encode(
            {
                "sub": sub,
                "resource_access": {"group": {"roles": roles}},
                "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": given_name + " " + family_name,
                "preferred_username": username,
                "given_name": given_name,
                "family_name": family_name,
            },
            invalid_key,
            algorithm="RS256",
        )
        token = "Bearer " + encoded.decode("utf-8")
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
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
        encoded = encode(
            {
                "sub": sub,
                "resource_access": {"group": {"roles": roles}},
                "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": given_name + " " + family_name,
                "preferred_username": username,
                "given_name": given_name,
                "family_name": family_name,
            },
            private_key,
            algorithm="PS256",
        )
        token = "Bearer " + encoded.decode("utf-8")
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
        )
        self.assertEqual(response.status_code, 403)

    def test_correct_token(self):
        user = self.loginUsers[0]
        sub = user["sub"] + "42"
        username = user["username"] + "42"
        given_name = user["given_name"]
        family_name = user["family_name"]
        admin = user["admin"]
        roles = ["admin"] if admin else []
        encoded = encode(
            {
                "sub": sub,
                "resource_access": {"group": {"roles": roles}},
                "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": given_name + " " + family_name,
                "preferred_username": username,
                "given_name": given_name,
                "family_name": family_name,
            },
            private_key,
            algorithm="RS256",
        )
        token = "Bearer " + encoded.decode("utf-8")
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
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
        encoded = encode(
            {
                "sub": "12-42-13-90",
                "resource_access": {"group": {"roles": ["admin"]}},
            cloc    "scope": "openid profile",
                "website": "https://www.vis.ethz.ch",
                "name": "A B",
                "given_name": "Given",
                "family_name": "Family",
            },
            private_key,
            algorithm="RS256",
        )
        token = "Bearer " + encoded.decode("utf-8")
        logging.disable(logging.CRITICAL)
        response = self.client.get(
            "/api/notification/unreadcount/", HTTP_AUTHORIZATION=token
        )
        logging.disable(logging.NOTSET)
        self.assertEqual(response.status_code, 403)
