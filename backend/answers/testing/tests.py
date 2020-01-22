from testing.tests import ComsolTest
from answers.models import Exam, ExamType

class ComsolTestWithData(ComsolTest):

    def mySetUp(self):
        pass


class TestMetadata(ComsolTest):

    def test_metadata(self):
        exam = Exam(
            filename='abc.pdf',
            displayname='Test Displayname',
            exam_type = ExamType.objects.get(displayname='Exams'),
        )
        # TODO add more attributes
        exam.save()
        res = self.get('/api/exam/metadata/{}/'.format(exam.id))
        self.assertEqual(res['filename'], exam.filename)
        self.assertEqual(res['displayname'], exam.displayname)
        self.assertEqual(res['examtype'], exam.exam_type.displayname)

