from django.contrib.auth.models import User

from categories.models import Category
from documents.models import Document, DocumentType
from notifications.models import Notification, NotificationSetting, NotificationType
from testing.tests import ComsolTest


class TestDocument(ComsolTest):
    def setUpLogin(self):
        self.login_as(self.nonAdminUsers[0])

    def mySetUp(self):
        self.category = Category(
            displayname="Test Category",
            slug="TestCategory",
        )
        self.category.save()
        self.documents = []
        for i in range(4):
            self.login_as(self.users[i])  # Log in as the user to create the document
            # Create the document owned by that user
            self.documents.append(
                Document(
                    display_name=f"document{i}",
                    description=f"description{i}",
                    category=self.category,
                    author=self.get_my_user(),
                    anonymised=False,
                    document_type=DocumentType.objects.get(display_name="Documents"),
                )
            )
        for document in self.documents:
            document.save()
        self.login_as(self.nonAdminUsers[0])  # Log back in as the first user

    def test_owner_can_set_metadata(self):
        document = self.documents[2]
        self.put(
            f"/api/document/{document.slug}/",
            {"description": "New Description"},
            json_body=True,
        )
        document.refresh_from_db()
        self.assertEqual(document.description, "New Description")

    def test_owner_can_delete_document(self):
        # Keep track of the number of documents
        current_document_count = Document.objects.count()
        document = Document(
            display_name="temp_document",
            description="some description",
            category=self.category,
            author=self.get_my_user(),
            anonymised=False,
            document_type=DocumentType.objects.get(display_name="Documents"),
        )
        document.save()

        # Check that the number of documents has increased by one on backend
        self.assertEqual(current_document_count + 1, Document.objects.count())

        # Delete the document using API and check that it is deleted
        self.delete(
            f"/api/document/{document.slug}/",
        )
        self.assertEqual(current_document_count, Document.objects.count())
        self.get(f"/api/document/{document.slug}/", status_code=404)

    def test_nonowner_cannot_set_metadata(self):
        self.login_as(self.nonAdminUsers[0])
        document = self.documents[1]
        self.put(
            f"/api/document/{document.slug}/",
            {"description": "New Description"},
            json_body=True,
            status_code=403,
        )

    def test_nonowner_cannot_see_anonymised_author(self):
        self.login_as(self.nonAdminUsers[0])
        document = self.documents[1]
        document.anonymised = True
        document.save()
        res = self.get(
            f"/api/document/{document.slug}/",
        )["value"]
        self.assertEqual(res["author"]["username"], "anonymous")
        self.assertEqual(res["anonymised"], True)

    def test_nonowner_admin_can_see_anonymised_author(self):
        # Admins should see that it is anonymised but also know who the real author is
        self.login_as(self.adminUsers[0])
        document = self.documents[1]
        document.anonymised = True
        document.save()
        res = self.get(
            f"/api/document/{document.slug}/",
        )["value"]
        self.assertEqual(res["author"]["username"], self.users[1]["username"])
        self.assertEqual(res["anonymised"], True)

    def test_owner_can_see_anonymised_author(self):
        self.login_as(self.nonAdminUsers[1])
        document = self.documents[3]
        document.anonymised = True
        document.save()
        res = self.get(
            f"/api/document/{document.slug}/",
        )["value"]
        self.assertEqual(res["author"]["username"], self.users[3]["username"])
        self.assertEqual(res["anonymised"], True)


class ComsolTestDocumentData(ComsolTest):
    def setUp(self, call_my_setup=True):
        super().setUp(call_my_setup=False)
        for user in self.users:
            self.user = user
            self.get("/api/notification/unreadcount/")

        self.category = Category(
            displayname="Test Category",
            slug="TestCategory",
        )
        self.category.save()

        self.document_type = DocumentType(display_name="Documents")
        self.document_type.save()

        self.documents = []

        author = User.objects.get(username=self.nonAdminUsers[0]["username"])
        for i in range(3):
            document = Document(
                display_name=f"Document {i}",
                category=self.category,
                document_type=self.document_type,
                author=author,
            )
            document.save()
            self.documents.append(document)

        if call_my_setup:
            self.mySetUp()


class TestDocumentTransfer(ComsolTestDocumentData):
    def setUp(self, call_my_setup=True):
        super().setUp(call_my_setup=False)

        for user in self.users:
            NotificationSetting(
                user=User.objects.get(username=user["username"]),
                type=NotificationType.DOCUMENT_TRANSFER.value,
                enabled=True,
            ).save()

        if call_my_setup:
            self.mySetUp()

    def test_put_transfer_as_owner(self):
        target_username = self.nonAdminUsers[1]["username"]

        document = self.documents[0]
        self.login_as(self.nonAdminUsers[0])

        res = self.put(
            f"/api/document/{document.slug}/",
            {"pending_transfer_user": target_username},
            json_body=True,
        )["value"]

        self.assertEqual(res["pending_transfer_user"]["username"], target_username)
        document.refresh_from_db()
        self.assertEqual(document.pending_transfer_user.username, target_username)

        notification = Notification.objects.filter(
            receiver__username=target_username,
            type=NotificationType.DOCUMENT_TRANSFER.value,
        ).get()
        self.assertEqual(notification.sender.id, document.author.id)
        self.assertTrue(
            "transfer" in notification.title,
            msg=f'{notification.title=} must contain keyword "transfer".',
        )
        self.assertTrue(
            "transfer" in notification.text,
            msg=f'{notification.text=} must contain keyword "transfer".',
        )

    def test_put_transfer_as_admin(self):
        target_username = self.nonAdminUsers[1]["username"]

        document = self.documents[0]
        self.login_as(self.adminUsers[0])

        res = self.put(
            f"/api/document/{document.slug}/",
            {"pending_transfer_user": target_username},
            json_body=True,
        )["value"]

        self.assertEqual(res["pending_transfer_user"]["username"], target_username)
        document.refresh_from_db()
        self.assertEqual(document.pending_transfer_user.username, target_username)

    def test_put_transfer_as_unprivileged_user(self):
        target_username = self.nonAdminUsers[1]["username"]

        document = self.documents[0]
        self.login_as(self.nonAdminUsers[1])

        res = self.put(
            f"/api/document/{document.slug}/",
            {"pending_transfer_user": target_username},
            json_body=True,
            status_code=403,
        )["err"]

        self.assertGreater(len(res), 0)
        document.refresh_from_db()
        self.assertEqual(document.pending_transfer_user, None)

    def test_unset_transfer_as_owner(self):
        old_transfer_target = User.objects.get(
            username=self.nonAdminUsers[1]["username"]
        )

        document = self.documents[0]
        document.pending_transfer_user = old_transfer_target
        document.save()

        self.login_as(self.nonAdminUsers[0])

        res = self.put(
            f"/api/document/{document.slug}/",
            {"pending_transfer_user": None},
            json_body=True,
        )["value"]

        self.assertFalse(
            "pending_transfer_user" in res,
            'res["pending_transfer_user"] must be unset.',
        )
        document.refresh_from_db()
        self.assertEqual(document.pending_transfer_user, None)

    def test_unset_transfer_as_admin(self):
        old_transfer_target = User.objects.get(
            username=self.nonAdminUsers[1]["username"]
        )

        document = self.documents[0]
        document.pending_transfer_user = old_transfer_target
        document.save()

        self.login_as(self.adminUsers[0])

        res = self.put(
            f"/api/document/{document.slug}/",
            {"pending_transfer_user": None},
            json_body=True,
        )["value"]

        self.assertFalse(
            "pending_transfer_user" in res,
            'res["pending_transfer_user"] must be unset.',
        )
        document.refresh_from_db()
        self.assertEqual(document.pending_transfer_user, None)

    def test_unset_transfer_as_unprivileged_user(self):
        old_transfer_target = User.objects.get(
            username=self.nonAdminUsers[1]["username"]
        )

        document = self.documents[0]
        document.pending_transfer_user = old_transfer_target
        document.save()

        self.login_as(self.nonAdminUsers[1])

        res = self.put(
            f"/api/document/{document.slug}/",
            {"pending_transfer_user": None},
            json_body=True,
            status_code=403,
        )["err"]

        self.assertGreater(len(res), 0)
        document.refresh_from_db()
        self.assertEqual(document.pending_transfer_user.id, old_transfer_target.id)

    def test_accept_transfer_as_target(self):
        transfer_target = User.objects.get(username=self.nonAdminUsers[1]["username"])

        document = self.documents[0]
        document.pending_transfer_user = transfer_target
        document.save()

        original_owner = document.author

        self.login_as(self.nonAdminUsers[1])

        res = self.put(
            f"/api/document/{document.slug}/transfer/accept",
            {},
            json_body=True,
        )["value"]

        self.assertEqual(res["author"]["id"], transfer_target.id)
        self.assertFalse(
            "pending_transfer_user" in res,
            'res["pending_transfer_user"] must be unset.',
        )

        document.refresh_from_db()
        self.assertEqual(document.author.id, transfer_target.id)
        self.assertEqual(document.pending_transfer_user, None)

        notification = Notification.objects.filter(
            receiver=original_owner, type=NotificationType.DOCUMENT_TRANSFER.value
        ).get()
        self.assertEqual(notification.sender.id, transfer_target.id)
        self.assertTrue(
            "accepted" in notification.title,
            msg=f'{notification.title=} must contain keyword "accepted".',
        )
        self.assertTrue(
            "accepted" in notification.text,
            msg=f'{notification.text=} must contain keyword "accepted".',
        )

    def test_accept_transfer_as_admin(self):
        transfer_target = User.objects.get(username=self.nonAdminUsers[1]["username"])

        document = self.documents[0]
        document.pending_transfer_user = transfer_target
        document.save()

        self.login_as(self.adminUsers[0])

        res = self.put(
            f"/api/document/{document.slug}/transfer/accept",
            {},
            json_body=True,
        )["value"]

        self.assertEqual(res["author"]["id"], transfer_target.id)
        self.assertFalse(
            "pending_transfer_user" in res,
            'res["pending_transfer_user"] must be unset.',
        )

        document.refresh_from_db()
        self.assertEqual(document.author.id, transfer_target.id)
        self.assertEqual(document.pending_transfer_user, None)

    def test_accept_transfer_as_original_author(self):
        transfer_target = User.objects.get(username=self.nonAdminUsers[1]["username"])

        document = self.documents[0]
        document.pending_transfer_user = transfer_target
        document.save()
        original_owner_id = document.author.id

        self.login_as(self.nonAdminUsers[0])

        res = self.put(
            f"/api/document/{document.slug}/transfer/accept",
            {},
            json_body=True,
            status_code=403,
        )["err"]

        self.assertGreater(len(res), 0)
        document.refresh_from_db()
        self.assertEqual(document.author.id, original_owner_id)
        self.assertEqual(document.pending_transfer_user.id, transfer_target.id)

    def test_reject_transfer_as_target(self):
        transfer_target = User.objects.get(username=self.nonAdminUsers[1]["username"])

        document = self.documents[0]
        document.pending_transfer_user = transfer_target
        document.save()

        original_owner = document.author

        self.login_as(self.nonAdminUsers[1])

        res = self.put(
            f"/api/document/{document.slug}/transfer/reject",
            {},
            json_body=True,
        )["value"]

        self.assertEqual(res["author"]["id"], original_owner.id)
        self.assertFalse(
            "pending_transfer_user" in res,
            'res["pending_transfer_user"] must be unset.',
        )

        document.refresh_from_db()
        self.assertEqual(document.author.id, original_owner.id)
        self.assertEqual(document.pending_transfer_user, None)

        notification = Notification.objects.filter(
            receiver=original_owner, type=NotificationType.DOCUMENT_TRANSFER.value
        ).get()
        self.assertEqual(notification.sender.id, transfer_target.id)
        self.assertTrue(
            "rejected" in notification.title,
            msg=f'{notification.title=} must contain keyword "rejected".',
        )
        self.assertTrue(
            "rejected" in notification.text,
            msg=f'{notification.text=} must contain keyword "rejected".',
        )

    def test_reject_transfer_as_admin(self):
        transfer_target = User.objects.get(username=self.nonAdminUsers[1]["username"])

        document = self.documents[0]
        document.pending_transfer_user = transfer_target
        document.save()

        original_owner = document.author

        self.login_as(self.adminUsers[1])

        res = self.put(
            f"/api/document/{document.slug}/transfer/reject",
            {},
            json_body=True,
        )["value"]

        self.assertEqual(res["author"]["id"], original_owner.id)
        self.assertFalse(
            "pending_transfer_user" in res,
            'res["pending_transfer_user"] must be unset.',
        )

        document.refresh_from_db()
        self.assertEqual(document.author.id, original_owner.id)
        self.assertEqual(document.pending_transfer_user, None)

    def test_reject_transfer_as_original_author(self):
        transfer_target = User.objects.get(username=self.nonAdminUsers[1]["username"])

        document = self.documents[0]
        document.pending_transfer_user = transfer_target
        document.save()

        original_owner_id = document.author.id

        self.login_as(self.nonAdminUsers[0])

        res = self.put(
            f"/api/document/{document.slug}/transfer/reject",
            {},
            json_body=True,
        )["value"]

        self.assertEqual(res["author"]["id"], original_owner_id)
        self.assertFalse(
            "pending_transfer_user" in res,
            'res["pending_transfer_user"] must be unset.',
        )

        document.refresh_from_db()
        self.assertEqual(document.author.id, original_owner_id)
        self.assertEqual(document.pending_transfer_user, None)

    def test_transfer_to_same_user(self):
        target_username = self.nonAdminUsers[0]["username"]

        self.login_as(self.nonAdminUsers[0])
        document = self.documents[0]

        res = self.put(
            f"/api/document/{document.slug}/",
            {"pending_transfer_user": target_username},
            json_body=True,
            status_code=400,
        )["err"]

        self.assertTrue("same user" in res, f'{res=} must contain "same user".')
