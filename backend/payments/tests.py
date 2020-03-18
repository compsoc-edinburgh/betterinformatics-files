from datetime import timedelta

from answers.models import Exam
from myauth.models import MyUser
from payments.models import Payment
from testing.tests import ComsolTest, ComsolTestExamsData


class TestPayment(ComsolTest):

    def mySetUp(self):
        self.testuser = MyUser(username='test')
        self.testuser.save()
        self.post('/api/payment/pay/', {'username': 'test'})
        self.payment = Payment.objects.get(user__username='test')

    def test_query(self):
        res = self.get('/api/payment/query/test/')['value']
        self.assertEqual(len(res), 1)

    def test_me(self):
        res = self.get('/api/payment/me/')['value']
        self.assertEqual(len(res), 0)
        self.post('/api/payment/pay/', {'username': self.user['username']})
        res = self.get('/api/payment/me/')['value']
        self.assertEqual(len(res), 1)

    def test_remove(self):
        self.post('/api/payment/remove/{}/'.format(self.payment.id), {})
        res = self.get('/api/payment/query/test/')['value']
        self.assertEqual(len(res), 0)

    def test_refund(self):
        self.post('/api/payment/refund/{}/'.format(self.payment.id), {})
        res = self.get('/api/payment/query/test/')['value']
        self.assertEqual(len(res), 1)
        self.assertTrue(res[0]['refund_time'])

    def test_refund_twice(self):
        self.post('/api/payment/refund/{}/'.format(self.payment.id), {})
        self.post('/api/payment/refund/{}/'.format(self.payment.id), {}, status_code=400)

    def test_payment_active(self):
        res = self.get('/api/payment/query/test/')['value']
        self.assertTrue(res[0]['active'])
        self.payment.payment_time -= timedelta(days=365)
        self.payment.save()
        res = self.get('/api/payment/query/test/')['value']
        self.assertFalse(res[0]['active'])


class TestMarkChecked(ComsolTestExamsData):

    def mySetUp(self):
        self.testuser = MyUser(username='test')
        self.testuser.save()
        self.post('/api/payment/pay/', {'username': 'test'})
        self.payment = Payment.objects.get(user__username='test')

    def test_mark_checked(self):
        exam = self.exams[0]
        exam.is_oral_transcript = True
        exam.oral_transcript_uploader = self.testuser
        exam.save()
        res = self.get('/api/payment/query/test/')['value']
        self.assertFalse(res[0]['check_time'])
        self.post('/api/payment/markexamchecked/{}/'.format(exam.filename), {})
        res = self.get('/api/payment/query/test/')['value']
        self.assertTrue(res[0]['check_time'])
