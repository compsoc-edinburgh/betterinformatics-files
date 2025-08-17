from answers.models import Exam, ExamPage, ExamType
from testing.tests import ComsolTestExamsData
from categories.models import Category
import logging
from time import sleep
from django.contrib.postgres.search import SearchVector
from django.core.files.uploadedfile import SimpleUploadedFile
from os.path import dirname, join
from base64 import b64encode

logger = logging.getLogger(__name__)


class TestSearch(ComsolTestExamsData):
    def mySetUp(self, call_my_setup=True):
        """Upload a test PDF file and create a search vector for it."""
        location = join(dirname(__file__), "search_test.pdf")
        with open(location, "rb") as infile:
            filename = self.post(
                "/api/exam/upload/exam/",
                {"category": "default", "displayname": "Test", "file": infile},
            )["filename"]
            ExamPage.objects.update(search_vector=SearchVector("text"))

    def test_search_page(self):
        """Test searching for a specific term in an exam."""
        # First check that we get nothing if we don't include exams
        res = self.post(
            "/api/exam/search/",
            {"term": "uniqueidthatwecansearch", "include_exams": False},
        )["value"]
        self.assertEqual(len(res), 0)

        # Then check that we get a result if we include exams
        res = self.post("/api/exam/search/", {"term": "uniqueidthatwecansearch"})[
            "value"
        ]
        self.assertEqual(len(res), 1)

        # Check that the result is what we expect
        match = res[0]
        self.assertEqual(match["type"], "exam")
        self.assertEqual(len(match["headline"]), 1)
        self.assertEqual(match["category_displayname"], "default")
        self.assertEqual(match["category_slug"], "default")
        self.assertEqual(len(match["pages"]), 1)

    def test_search_with_category_filter(self):
        """Test that searching with a category filter works as expected when
        specifying a non-matching category vs a matching category.
        """
        res = self.post(
            "/api/exam/search/",
            {"term": "uniqueidthatwecansearch", "category": "not_default"},
        )["value"]
        self.assertEqual(len(res), 0)

        res = self.post(
            "/api/exam/search/",
            {"term": "uniqueidthatwecansearch", "category": "default"},
        )["value"]
        self.assertEqual(len(res), 1)
