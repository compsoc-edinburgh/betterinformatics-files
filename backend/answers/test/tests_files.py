from testing.tests import ComsolTest
from answers.models import Exam
from categories.models import Category
from django.core.files.uploadedfile import SimpleUploadedFile


class TestFiles(ComsolTest):
    # As these tests will add files to minio,
    # we have to make sure we remove everything again

    def exam_file(self):
        return SimpleUploadedFile("file.pdf", b"file_content", content_type="application/pdf")

    def test_pdf(self):
        filename = self.post('/api/exam/upload/exam/', {
            'category': 'default',
            'displayname': 'Test',
            'file': self.exam_file(),
        })['filename']
        response = self.client.get('/api/exam/pdf/exam/{}/'.format(filename))
        self.assertEqual(response.status_code, 200)
        self.post('/api/exam/remove/exam/{}/'.format(filename), {})

    def test_transcript(self):
        self.post('/api/exam/upload/transcript/', {
            'category': 'default',
            'file': self.exam_file(),
        }, status_code=400)
        category = Category.objects.get(slug='default')
        category.has_payments = True
        category.save()
        filename = self.post('/api/exam/upload/transcript/', {
            'category': 'default',
            'file': self.exam_file(),
        })['filename']
        response = self.client.get('/api/exam/pdf/exam/{}/'.format(filename))
        self.assertEqual(response.status_code, 200)
        exam = Exam.objects.get(filename=filename)
        self.assertTrue(exam.is_oral_transcript)
        self.assertEqual(exam.exam_type.displayname, 'Transcripts')
        self.post('/api/exam/remove/exam/{}/'.format(filename), {})


# TODO: test everything related to files (in views_files.py).
# TODO: test printonly
# TODO: test solutions
# TODO: test zip export
# TODO: test printing (probably not possible locally)
# TODO: test access right checks
