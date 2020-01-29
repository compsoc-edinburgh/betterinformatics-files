from answers.test.tests import ComsolTestWithData
from answers.models import Answer, AnswerSection
from myauth.models import MyUser


class TestExistingAnswer(ComsolTestWithData):

    def test_set_answer(self):
        answer = self.answers[0]
        self.post('/api/exam/setanswer/{}/'.format(answer.answer_section.id), {
            'text': 'New Answer Text',
            'legacy_answer': False,
        })
        answer.refresh_from_db()
        self.assertEqual(answer.text, 'New Answer Text')

    def test_remove_answer(self):
        answer = self.answers[0]
        id = answer.id
        self.post('/api/exam/removeanswer/{}/'.format(answer.id), {})
        self.assertFalse(Answer.objects.filter(id=id).exists())

    def test_remove_all_answers(self):
        self.assertEqual(Answer.objects.count(), 16)
        for answer in self.answers:
            self.post('/api/exam/removeanswer/{}/'.format(answer.id), {})
        self.assertEqual(Answer.objects.count(), 0)


class TestDeleteNonadmin(ComsolTestWithData):

    loginUser = 2

    def test_remove_answer(self):
        answer = self.answers[2]
        id = answer.id
        self.post('/api/exam/removeanswer/{}/'.format(answer.id), {})
        self.assertFalse(Answer.objects.filter(id=id).exists())

    def test_remove_all_answers(self):
        self.assertEqual(Answer.objects.count(), 16)
        removed = 0
        for answer in self.answers:
            can_remove = answer.author.username == self.user['username']
            if can_remove:
                removed += 1
            self.post('/api/exam/removeanswer/{}/'.format(answer.id), {}, status_code=200 if can_remove else 403)
        self.assertEqual(removed, 4)
        self.assertEqual(Answer.objects.count(), 16 - removed)


class TestNonexisting(ComsolTestWithData):

    def mySetUp(self):
        super(TestNonexisting, self).mySetUp()
        self.mysection = AnswerSection(
            exam=self.exam,
            author=MyUser.objects.get(username=self.user['username']),
            page_num=1,
            rel_height=0.8,
        )
        self.mysection.save()

    def test_set_answer(self):
        self.assertEqual(self.mysection.answer_set.count(), 0)
        self.assertFalse(Answer.objects.filter(answer_section=self.mysection, author=MyUser.objects.get(username=self.user['username'])).exists())
        self.post('/api/exam/setanswer/{}/'.format(self.mysection.id), {
            'text': 'Test Answer 123',
            'legacy_answer': False,
        })
        self.assertEqual(self.mysection.answer_set.count(), 1)
        self.assertTrue(Answer.objects.filter(answer_section=self.mysection, author=MyUser.objects.get(username=self.user['username'])).exists())


# TODO: test likes
# TODO: test expertvotes
# TODO: test flagging
