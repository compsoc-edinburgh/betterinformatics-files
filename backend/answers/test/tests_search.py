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
    def test_search_page(self):
        location = join(dirname(__file__), "search_test.pdf")
        with open(location, "rb") as infile:
            filename = self.post(
                "/api/exam/upload/exam/",
                {"category": "default", "displayname": "Test", "file": infile},
            )["filename"]
            ExamPage.objects.update(search_vector=SearchVector("text"))
            res = self.post("/api/exam/search/", {"term": "uniqueidthatwecansearch"})

            logger.info(res)
