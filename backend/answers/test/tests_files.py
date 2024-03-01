from testing.tests import ComsolTest
from answers.models import Exam
from categories.models import Category
from django.core.files.uploadedfile import SimpleUploadedFile


class TestFiles(ComsolTest):
    # As these tests will add files to s3,
    # we have to make sure we remove everything again

    def exam_file(self):
        return SimpleUploadedFile(
            "file.pdf", b"file_content", content_type="application/pdf"
        )

    def test_upload_exam(self):
        filename = self.post(
            "/api/exam/upload/exam/",
            {
                "category": "default",
                "displayname": "Test",
                "file": self.exam_file(),
            },
        )["filename"]
        response = self.get("/api/exam/pdf/exam/{}/".format(filename), as_json=False)
        self.assertEqual(response.status_code, 200)
        self.post("/api/exam/remove/exam/{}/".format(filename), {})

    def test_upload_solution(self):
        filename = self.post(
            "/api/exam/upload/exam/",
            {
                "category": "default",
                "displayname": "Test",
                "file": self.exam_file(),
            },
        )["filename"]
        self.post(
            "/api/exam/upload/solution/",
            {
                "filename": filename,
                "file": self.exam_file(),
            },
        )
        response = self.get(
            "/api/exam/pdf/solution/{}/".format(filename), as_json=False
        )
        self.post("/api/exam/remove/solution/{}/".format(filename), {})
        self.post("/api/exam/remove/exam/{}/".format(filename), {})


# TODO: test printonly (among others: check that only admins can see it)
# TODO: test zip export
# TODO: test printing (probably not possible locally)
# TODO: test access right checks
