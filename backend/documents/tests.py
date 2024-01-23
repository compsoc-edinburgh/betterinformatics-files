from django.contrib.auth.models import User
from documents.models import Document, DocumentType
from categories.models import Category
from testing.tests import ComsolTest


class TestDocument(ComsolTest):
    loginUser = 0

    def mySetUp(self):
        self.category = Category(
            displayname="Test Category",
            slug="TestCategory",
        )
        self.category.save()
        self.documents = []
        for i in range(2):
            self.documents.append(
                Document(
                    display_name="document{}".format(i),
                    description="description{}".format(i),
                    category=self.category,
                    author=User.objects.get_or_create(
                        username=self.loginUsers[i]["username"]
                    )[0],
                    anonymised=False,
                    document_type=DocumentType.objects.get(display_name="Documents"),
                )
            )
        for document in self.documents:
            document.save()

    def test_owner_can_set_metadata(self):
        document = self.documents[0]
        self.put(
            "/api/document/{}/".format(document.slug),
            {"description": "New Description"},
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
            "/api/document/{}/".format(document.slug),
        )
        self.assertEqual(current_document_count, Document.objects.count())
        self.get("/api/document/{}/".format(document.slug), status_code=404)

    def test_nonowner_cannot_set_metadata(self):
        self.user = self.loginUsers[2]  # non-admin user
        document = self.documents[1]
        self.put(
            "/api/document/{}/".format(document.slug),
            {"description": "New Description"},
            status_code=403,
        )

    def test_nonowner_cannot_see_anonymised_author(self):
        self.user = self.loginUsers[2]  # non-admin user
        document = self.documents[1]
        document.anonymised = True
        document.save()
        res = self.get(
            "/api/document/{}/".format(document.slug),
        )["value"]
        self.assertEqual(res["author"], "anonymous")
        self.assertEqual(res["anonymised"], True)

    def test_nonowner_admin_can_see_anonymised_author(self):
        # Admins should see that it is anonymised but also know who the real author is
        self.user = self.loginUsers[0]  # admin user
        document = self.documents[1]
        document.anonymised = True
        document.save()
        res = self.get(
            "/api/document/{}/".format(document.slug),
        )["value"]
        self.assertEqual(res["author"], self.loginUsers[1]["username"])
        self.assertEqual(res["anonymised"], True)

    def test_owner_can_see_anonymised_author(self):
        document = self.documents[0]
        document.anonymised = True
        document.save()
        res = self.get(
            "/api/document/{}/".format(document.slug),
        )["value"]
        self.assertEqual(res["author"], self.user["username"])
        self.assertEqual(res["anonymised"], True)
