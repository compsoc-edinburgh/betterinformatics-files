from django.contrib.auth.models import User
from django.core import mail

from documents.models import Document, DocumentType
from notifications.models import Notification
from testing.tests import ComsolTest, ComsolTestExamData


class TestNotificationSettings(ComsolTest):
    def test_get_enabled(self):
        self.get("/api/notification/getenabled/")

    def test_set_enabled(self):
        types = self.get("/api/notification/getenabled/")["value"]
        self.assertGreater(len(types), 0)
        for val in types:
            # Disable all notifications that are enabled
            if val["enabled"]:
                self.post(
                    "/api/notification/setenabled/",
                    {
                        "type": val["type"],
                        "enabled": "false",
                    },
                )
            if val["email_enabled"]:
                self.post(
                    "/api/notification/setenabled/",
                    {
                        "type": val["type"],
                        "email_enabled": "false",
                    },
                )
        res = self.get("/api/notification/getenabled/")["value"]
        self.assertEqual(len(res), 0)

        # Enable all notifications for in-app and email
        for val in types:
            self.post(
                "/api/notification/setenabled/",
                {
                    "type": val["type"],
                    "enabled": "true",
                    "email_enabled": "true",
                },
            )
        res = self.get("/api/notification/getenabled/")["value"]
        self.assertEqual(len(res), len(types))


class TestNotifications(ComsolTestExamData):
    def test_notification_lifecycle(self):
        res = self.get("/api/notification/unread/")["value"]
        self.assertEqual(len(res), 0)
        res = self.get("/api/notification/all/")["value"]
        self.assertEqual(len(res), 0)
        res = self.get("/api/notification/unreadcount/")["value"]
        self.assertEqual(res, 0)

        notification = Notification(
            sender=self.get_my_user(),
            receiver=self.get_my_user(),
            type=1,
            title="Test Notification",
            text="Test Text",
        )
        notification.save()

        res1 = self.get("/api/notification/unread/")["value"]
        self.assertEqual(len(res1), 1)
        res2 = self.get("/api/notification/all/")["value"]
        self.assertEqual(len(res2), 1)
        self.assertEqual(res1, res2)
        self.assertEqual(res1[0]["title"], notification.title)
        self.assertEqual(res1[0]["message"], notification.text)
        res = self.get("/api/notification/unreadcount/")["value"]
        self.assertEqual(res, 1)

        self.post(f"/api/notification/setread/{notification.id}/", {"read": "true"})

        res = self.get("/api/notification/unread/")["value"]
        self.assertEqual(len(res), 0)
        res = self.get("/api/notification/all/")["value"]
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["title"], notification.title)
        self.assertEqual(res[0]["message"], notification.text)
        res = self.get("/api/notification/unreadcount/")["value"]
        self.assertEqual(res, 0)

    def test_email_notification(self):
        self.login_as(self.users[0])
        # Create a document owned by user 0
        document = Document(
            display_name="document",
            description="description",
            category=self.category,
            author=self.get_my_user(),
            anonymised=False,
            document_type=DocumentType.objects.get(display_name="Documents"),
        )
        document.save()

        # Setup default notification settings
        for val in range(1, 5):
            self.post(
                "/api/notification/setenabled/",
                {
                    "type": val,
                    "enabled": "true",
                    "email_enabled": "true",
                },
            )

        # Let user 1 comment on the document
        self.login_as(self.users[1])
        self.post(
            f"/api/document/{document.slug}/comments/",
            {"text": "Comment"},
            test_get=False,
        )

        # Check that user 0 received an in-app and email notification
        self.login_as(self.users[0])
        res = self.get("/api/notification/unread/")["value"]
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["type"], 4)  # New comment on Document

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(
            mail.outbox[0].to, [f"{self.users[0]['username']}@sms.ed.ac.uk"]
        )

    def test_no_duplicate_when_comment_on_answer(self):
        # Test that no duplicate notification is sent when user A has previously
        # commented on their own answer and now user B leaves a comment. It
        # should just sent a New comment on Answer notification, not a New
        # comment on Comment notification as well.

        # Setup default notification settings for user 0
        # Set up only in-app notifications for user 2
        self.login_as(self.users[0])
        for val in range(1, 6):
            self.post(
                "/api/notification/setenabled/",
                {
                    "type": val,
                    "enabled": "true",
                    "email_enabled": "true",
                },
            )
        self.login_as(self.users[2])
        for val in range(1, 6):
            self.post(
                "/api/notification/setenabled/",
                {
                    "type": val,
                    "enabled": "true",
                    "email_enabled": "false",
                },
            )

        # self.answers[0] is made by user 0 and has comments by users 0,1,2,3
        # Let user 1 comment additionally on the answer
        self.login_as(self.users[1])
        self.post(
            f"/api/exam/addcomment/{self.answers[0].id}/",
            {"text": "Comment"},
        )

        # Check that user 0 received only one notification (comment on answer)
        self.login_as(self.users[0])
        res = self.get("/api/notification/unread/")["value"]
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["type"], 1)

        # Check that user 2 received one notification (comment on comment)
        self.login_as(self.users[2])
        res = self.get("/api/notification/unread/")["value"]
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["type"], 2)

        # Check that user 3 also received one notification (comment on comment)
        self.login_as(self.users[3])
        res = self.get("/api/notification/unread/")["value"]
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["type"], 2)

        # Check that two emails were sent:
        # - One for user 0 (comment on answer)
        # - One for user 3 (comment on comment)
        self.assertEqual(len(mail.outbox), 2)
        self.assertIn([f"{self.users[0]['username']}@sms.ed.ac.uk"], list(map(lambda x: x.to, mail.outbox)))
        self.assertIn([f"{self.users[3]['username']}@sms.ed.ac.uk"], list(map(lambda x: x.to, mail.outbox)))
