from answers.models import Exam, ExamPage, ExamType
from testing.tests import ComsolTestExamData
from categories.models import Category
import logging
from time import sleep
from django.contrib.postgres.search import SearchVector
from django.core.files.uploadedfile import SimpleUploadedFile
from os.path import dirname, join
from base64 import b64encode

logger = logging.getLogger(__name__)


class TestSearch(ComsolTestExamData):
    add_answers = True
    add_comments = True

    def mySetUp(self, call_my_setup=True):
        """Upload a test PDF file and create a search vector for it."""
        location = join(dirname(__file__), "search_test.pdf")
        with open(location, "rb") as infile:
            filename = self.post(
                "/api/exam/upload/exam/",
                {"category": "default", "displayname": "Test", "file": infile},
            )["filename"]
            ExamPage.objects.update(search_vector=SearchVector("text"))

            # Edit the first answer to have a unique text that we can search
            self.answers[0].text = "mywacky answer"
            self.answers[0].save()
            # This is in category self.answers[0].answer_section.exam.category.slug

            # Edit the first comment to have a unique text that we can search
            self.comments[0].text = "mywacky comment"
            self.comments[0].save()

    def test_search_exam(self):
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

    def test_search_exam_with_category_filter(self):
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

    def test_search_answer(self):
        """Test searching for a specific term in an answer."""
        res = self.post(
            "/api/exam/search/",
            {"term": "mywacky answer", "include_answers": False},
        )["value"]
        self.assertEqual(len(res), 0)

        res = self.post(
            "/api/exam/search/",
            {"term": "mywacky answer"},
        )["value"]
        self.assertEqual(len(res), 1)

        match = res[0]
        self.assertEqual(match["type"], "answer")
        self.assertEqual(
            match["category_displayname"],
            self.answers[0].answer_section.exam.category.displayname,
        )
        self.assertEqual(
            match["category_slug"], self.answers[0].answer_section.exam.category.slug
        )

    def test_search_answer_with_category_filter(self):
        """Test that searching for an answer with a category filter works as
        expected when specifying a non-matching category vs a matching category.
        """
        res = self.post(
            "/api/exam/search/",
            {"term": "mywacky answer", "category": "something"},
        )["value"]
        self.assertEqual(len(res), 0)

        res = self.post(
            "/api/exam/search/",
            {
                "term": "mywacky answer",
                "category": self.answers[0].answer_section.exam.category.slug,
            },
        )["value"]
        self.assertEqual(len(res), 1)

    def test_search_comment(self):
        """Test searching for a specific term in a comment."""
        res = self.post(
            "/api/exam/search/",
            {"term": "mywacky comment", "include_comments": False},
        )["value"]
        self.assertEqual(len(res), 0)

        res = self.post(
            "/api/exam/search/",
            {"term": "mywacky comment"},
        )["value"]
        self.assertEqual(len(res), 1)

        match = res[0]
        self.assertEqual(match["type"], "comment")
        self.assertEqual(
            match["category_displayname"],
            self.comments[0].answer.answer_section.exam.category.displayname,
        )
        self.assertEqual(
            match["category_slug"],
            self.comments[0].answer.answer_section.exam.category.slug,
        )

    def test_search_comment_with_category_filter(self):
        """Test that searching for a comment with a category filter works as
        expected when specifying a non-matching category vs a matching category.
        """
        res = self.post(
            "/api/exam/search/",
            {"term": "mywacky comment", "category": "something"},
        )["value"]
        self.assertEqual(len(res), 0)

        res = self.post(
            "/api/exam/search/",
            {
                "term": "mywacky comment",
                "category": self.comments[0].answer.answer_section.exam.category.slug,
            },
        )["value"]
        self.assertEqual(len(res), 1)

    def test_search_answer_comment(self):
        """Test searching for a specific term in both answers and comments."""
        res = self.post(
            "/api/exam/search/",
            {"term": "mywacky", "include_comments": True, "include_answers": True},
        )["value"]
        self.assertEqual(len(res), 2)

        # Specifying category shouldn't change result - they are both in it
        res = self.post(
            "/api/exam/search/",
            {
                "term": "mywacky",
                "include_comments": True,
                "include_answers": True,
                "category": self.comments[0].answer.answer_section.exam.category.slug,
            },
        )["value"]
        self.assertEqual(len(res), 2)

        # Specifying a non-matching category should return no results
        res = self.post(
            "/api/exam/search/",
            {
                "term": "mywacky",
                "include_comments": True,
                "include_answers": True,
                "category": "something",
            },
        )["value"]
        self.assertEqual(len(res), 0)
