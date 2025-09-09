from testing.tests import ComsolTestExamsData, ComsolTestExamData
from answers.models import Exam, ExamType
from categories.models import Category


class TestListings(ComsolTestExamsData):

    def test_exam_types(self):
        res = self.get('/api/exam/listexamtypes/')['value']
        self.assertEqual(len(res), 5)
        self.assertEqual(res[0], 'Exams')

    def test_list_exams(self):
        res = self.get('/api/exam/listexams/')['value']
        self.assertEqual(len(res), 3)

    def test_list_import_exams(self):
        # If all exams are public and cut, they should not show up as requiring action
        res = self.get('/api/exam/listimportexams/')['value']
        self.assertEqual(len(res), 0)

        # Test uncut exams show up in action list
        self.exams[0].finished_cuts = False
        self.exams[0].save()
        res = self.get('/api/exam/listimportexams/')['value']
        self.assertEqual(len(res), 1)

        # Test hidden exams don't show up as requiring action
        self.exams[1].public = False
        self.exams[1].save()
        res = self.get('/api/exam/listimportexams/')['value']
        self.assertEqual(len(res), 1)

        # Test hidden exams do show up if you explicitly request it
        res = self.get('/api/exam/listimportexams/?includehidden=true')['value']
        self.assertEqual(len(res), 2)

    def test_list_payment_check(self):
        res = self.get('/api/exam/listpaymentcheckexams/')['value']
        self.assertEqual(len(res), 0)
        self.exams[0].is_oral_transcript = True
        self.exams[0].oral_transcript_uploader = self.get_my_user()
        self.exams[0].save()
        res = self.get('/api/exam/listpaymentcheckexams/')['value']
        self.assertEqual(len(res), 1)
        self.exams[0].oral_transcript_checked = True
        self.exams[0].save()
        res = self.get('/api/exam/listpaymentcheckexams/')['value']
        self.assertEqual(len(res), 0)


class TestListingsWithContent(ComsolTestExamData):

    def test_flagged(self):
        res = self.get('/api/exam/listflagged/')['value']
        self.assertEqual(len(res), 0)
        self.answers[1].flagged.add(self.get_my_user())
        self.answers[1].save()
        self.answers[5].flagged.add(self.get_my_user())
        self.answers[5].save()
        res = self.get('/api/exam/listflagged/')['value']
        self.assertEqual(len(res), 2)

    def test_by_user(self):
        res = self.get('/api/exam/listbyuser/{}/'.format(self.user['username']))['value']
        self.assertEqual(len(res), 4)
