from testing.tests import ComsolTest
from feedback.models import Feedback


class TestSubmit(ComsolTest):

    def test_submit(self):
        self.post('/api/feedback/submit/', {'text': 'test'})
        res = self.get('/api/feedback/list/')['value'][0]
        self.assertEqual(res['text'], 'test')
        self.assertEqual(res['author'], self.user['username'])
        self.assertEqual(res['authorDisplayName'], self.user['displayname'])

    def test_list(self):
        for i in range(11):
            Feedback(
                author=self.get_my_user(),
                text='Test ' + str(i),
            ).save()
        res = self.get('/api/feedback/list/')['value']
        self.assertEqual(len(res), 11)

    def check_flags(self, read, done):
        res = self.get('/api/feedback/list/')['value'][0]
        self.assertEqual(res['read'], read)
        self.assertEqual(res['done'], done)

    def test_flags(self):
        feedback = Feedback(
            author=self.get_my_user(),
            text='Test'
        )
        feedback.save()
        self.check_flags(False, False)
        self.post('/api/feedback/flags/{}/'.format(feedback.id), {
            'read': True
        })
        self.check_flags(True, False)
        self.post('/api/feedback/flags/{}/'.format(feedback.id), {
            'done': True
        })
        self.check_flags(True, True)
        self.post('/api/feedback/flags/{}/'.format(feedback.id), {
            'read': False,
            'done': False,
        })
        self.check_flags(False, False)
