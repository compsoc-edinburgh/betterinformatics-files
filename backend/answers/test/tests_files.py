from django.core.files.uploadedfile import SimpleUploadedFile

from testing.tests import ComsolTest


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
        response = self.get(f"/api/exam/pdf/exam/{filename}/", as_json=False)
        self.assertEqual(response.status_code, 200)
        self.post(f"/api/exam/remove/exam/{filename}/", {})

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
        self.get(f"/api/exam/pdf/solution/{filename}/", as_json=False)
        self.post(f"/api/exam/remove/solution/{filename}/", {})
        self.post(f"/api/exam/remove/exam/{filename}/", {})


# TODO: test printonly (among others: check that only admins can see it)
# TODO: test zip export
# TODO: test printing (probably not possible locally)
# TODO: test access right checks
