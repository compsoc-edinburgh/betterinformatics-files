from faq.models import FAQuestion
from testing.tests import ComsolTest


class TestFAQ(ComsolTest):

    test_http_methods = False

    def test_add_remove(self):
        faq = {
            'question': 'Test Question',
            'answer': 'Test Answer',
            'order': 42,
        }
        new_id = self.post('/api/faq/', {
            'question': 'Test Question',
            'answer': 'Test Answer',
            'order': 42,
        })['value']['oid']
        res = self.get('/api/faq/')['value']
        self.assertEqual(1, len(res))
        self.assertEqual(faq['question'], res[0]['question'])
        self.assertEqual(faq['answer'], res[0]['answer'])
        self.delete('/api/faq/{}/'.format(new_id))
        res = self.get('/api/faq/')['value']
        self.assertEqual(0, len(res))

    def test_set(self):
        faq = FAQuestion(
            question='Test',
            answer='Test',
            order=0
        )
        faq.save()
        new_faq = {
            'question': 'Test Question',
            'answer': 'Test Answer',
            'order': 42,
        }
        self.put('/api/faq/{}/'.format(faq.pk), new_faq)
        faq.refresh_from_db()
        self.assertEqual(faq.question, new_faq['question'])
        self.assertEqual(faq.answer, new_faq['answer'])
        self.assertEqual(faq.order, new_faq['order'])

    def test_order(self):
        perm = [5, 2, 4, 1, 8, 3]
        for x in perm:
            self.post('/api/faq/', {
                'question': str(x),
                'answer': str(x),
                'order': x,
            })
        res = self.get('/api/faq/')['value']
        self.assertEqual(len(perm), len(res))
        for re, x in zip(res, sorted(perm)):
            self.assertEqual(re['question'], str(x))
            self.assertEqual(re['answer'], str(x))
