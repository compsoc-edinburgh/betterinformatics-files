import logging
from django.core import mail
from testing.tests import ComsolTest
import re
from django.contrib.auth.models import User


class TestEdiAuth(ComsolTest):

    loginUser = -1

    code_finder = re.compile(r"\b\d{6}\b")

    def test_sign_in(self):

        # Check that the user cannot access the unreadcount endpoint
        self.get("/api/notification/unreadcount/", 401)

        # Send login request
        self.post(
            "/api/auth/login",
            {
                "uun": "s123456",
            },
            200,
        )

        # Check that we received a 6-digit code in the email
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["s123456@sms.ed.ac.uk"])

        # Find the 6-digit integer sequence somewhere in the email subject
        finds = self.code_finder.findall(mail.outbox[0].subject)
        self.assertEqual(len(finds), 1)
        code = finds[0]

        # Use the verification code
        self.post(
            "/api/auth/verify",
            {
                "uun": "s123456",
                "code": code,
            },
            200,
        )

        # Check that the same client can now access the me endpoint
        response = self.client.get("/api/notification/unreadcount/")
        self.assertEqual(response.status_code, 200)

    def test_cannot_sign_in_with_wrong_code(self):

        # Send login request
        self.post(
            "/api/auth/login",
            {
                "uun": "s123456",
            },
            200,
        )

        # Check that we received a 6-digit code in the email
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["s123456@sms.ed.ac.uk"])

        # Find the 6-digit integer sequence somewhere in the email subject
        finds = self.code_finder.findall(mail.outbox[0].subject)
        self.assertEqual(len(finds), 1)
        code = finds[0]

        # Use the wrong verification code
        wrongCode = "000000" if code != "000000" else "000001"

        self.post(
            "/api/auth/verify",
            {
                "uun": "s123456",
                "code": wrongCode,
            },
            401,
        )

    def test_cannot_reuse_same_code(self):

        # Send login request
        self.post(
            "/api/auth/login",
            {
                "uun": "s123456",
            },
            200,
        )

        # Check that we received a 6-digit code in the email
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["s123456@sms.ed.ac.uk"])

        # Find the 6-digit integer sequence somewhere in the email subject
        # and store as text. Make sure that preceding zeros don't get removed.
        finds = self.code_finder.findall(mail.outbox[0].subject)
        self.assertEqual(len(finds), 1)
        code = finds[0]

        # Use the verification code
        self.post(
            "/api/auth/verify",
            {
                "uun": "s123456",
                "code": code,
            },
            200,
        )

        # Try to use the same verification code again and get Forbidden
        self.post(
            "/api/auth/verify",
            {
                "uun": "s123456",
                "code": code,
            },
            403,
        )

    def test_logout_works(self):
        # Set the user for future requests to an arbitrary user
        User.objects.get_or_create(username="s123456")
        self.user = {
            "username": "s123456",
            "admin": False,
        }

        # Check that the user can access the me endpoint -- this also creates
        # the Profile and NotificationSetting objects
        response = self.get("/api/notification/unreadcount/")

        # Log out using the same HTTP client (NOT using self.post as that resets
        # the cookies)
        response = self.client.get("/api/auth/logout")
        self.assertEqual(response.status_code, 302)
        self.assertNotIn("access_token", response.client.cookies.items())

        # Check that the client user cannot access the me endpoint
        response = self.client.get("/api/notification/unreadcount/")
        self.assertEqual(response.status_code, 401)
