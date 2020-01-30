from testing.tests import ComsolTest
from answers.models import Exam, ExamType, AnswerSection, Answer, Comment
from myauth.models import MyUser
from categories.models import Category
from datetime import timedelta


class ComsolTestWithData(ComsolTest):

    add_sections = True
    add_answers = True
    add_comments = True

    def mySetUp(self):
        for user in self.loginUsers:
            if user['username'] != self.user['username']:
                MyUser(username=user['username']).save()

        self.category = Category(
            displayname='Test Category',
            slug='TestCategory',
        )
        self.category.save()

        self.exam = Exam(
            filename='abc.pdf',
            displayname='Test Displayname',
            category=self.category,
            exam_type = ExamType.objects.get(displayname='Exams'),
            remark = 'Test Remark',
            resolve_alias='resolve.pdf',
            public=True,
            finished_cuts=True,
            finished_wiki_transfer=True,
            needs_payment=False,
        )
        self.exam.save()
        self.sections = []
        self.answers = []
        self.comments = []
        if not self.add_sections:
            return
        for i in range(1, 5):
            self.sections.append(
                AnswerSection(
                    exam=self.exam,
                    author=self.get_my_user(),
                    page_num=1,
                    rel_height=0.25*i
                )
            )
        for section in self.sections:
            section.save()
            if not self.add_answers:
                continue
            for i in range(3):
                self.answers.append(
                    Answer(
                        answer_section=section,
                        author=MyUser.objects.get(username=self.loginUsers[i]['username']),
                        text='Test Answer {}/{}'.format(section.id, i),
                    )
                )
            self.answers.append(
                Answer(
                    answer_section=section,
                    author=MyUser.objects.get(username=self.loginUsers[0]['username']),
                    text='Legacy Answer {}'.format(section.id),
                    is_legacy_answer=True,
                )
            )
        for answer in self.answers:
            answer.save()
            if not self.add_comments:
                continue
            for i in range(3):
                self.comments.append(
                    Comment(
                        answer=answer,
                        author=MyUser.objects.get(username=self.loginUsers[i]['username']),
                        text='Comment {}/{}'.format(answer.id, i),
                    )
                )
        for comment in self.comments:
            comment.save()


class TestMetadata(ComsolTestWithData):

    add_sections = False

    def test_metadata(self):
        res = self.get('/api/exam/metadata/{}/'.format(self.exam.filename))['value']
        self.assertEqual(res['filename'], self.exam.filename)
        self.assertEqual(res['displayname'], self.exam.displayname)
        self.assertEqual(res['examtype'], self.exam.exam_type.displayname)
        self.assertEqual(res['remark'], self.exam.remark)
        self.assertEqual(res['resolve_alias'], self.exam.resolve_alias)
        self.assertEqual(res['public'], self.exam.public)
        self.assertEqual(res['finished_cuts'], self.exam.finished_cuts)
        self.assertEqual(res['finished_wiki_transfer'], self.exam.finished_wiki_transfer)
        self.assertEqual(res['needs_payment'], self.exam.needs_payment)

    def test_set_metadata(self):
        self.post('/api/exam/setmetadata/{}/'.format(self.exam.filename), {
            'displayname': 'New Displayname',
            'category': 'default',
            'examtype': 'Transcripts',
            'legacy_solution': 'New legacy solution',
            'resolve_alias': 'new_resolve_alias.pdf',
            'remark': 'New remark',
            'public': False,
            'finished_cuts': False,
            'finished_wiki_transfer': False,
            'needs_payment': True,
            'solution_printonly': True,
        })
        self.exam.refresh_from_db()
        self.test_metadata()
        self.post('/api/exam/setmetadata/{}/'.format(self.exam.filename), {
            'filename': 'cannotchange.pdf',
        })
        res = self.get('/api/exam/metadata/{}/'.format(self.exam.filename))['value']
        self.assertNotEqual(res['filename'], 'cannotchange.pdf')


class TestClaim(ComsolTestWithData):

    add_sections = False

    def test_claim(self):
        self.assertEqual(self.exam.import_claim, None)
        self.post('/api/exam/claimexam/{}/'.format(self.exam.filename), {'claim': True})
        self.exam.refresh_from_db()
        self.assertEqual(self.exam.import_claim.username, self.user['username'])
        self.post('/api/exam/claimexam/{}/'.format(self.exam.filename), {'claim': False})
        self.exam.refresh_from_db()
        self.assertEqual(self.exam.import_claim, None)

    def test_claim_reset(self):
        self.post('/api/exam/claimexam/{}/'.format(self.exam.filename), {'claim': True})
        self.exam.refresh_from_db()

        self.post('/api/auth/logout/', {})
        self.post('/api/auth/login/', {'username': self.loginUsers[1]['username'], 'password': self.loginUsers[1]['password']})
        self.post('/api/exam/claimexam/{}/'.format(self.exam.filename), {'claim': True}, status_code=400)

        self.exam.import_claim_time = self.exam.import_claim_time - timedelta(hours=5)
        self.exam.save()
        self.post('/api/exam/claimexam/{}/'.format(self.exam.filename), {'claim': True})

        self.exam.refresh_from_db()
        self.assertEqual(self.exam.import_claim.username, self.loginUsers[1]['username'])

        self.post('/api/auth/logout/', {})
        self.post('/api/auth/login/', {'username': self.loginUsers[0]['username'], 'password': self.loginUsers[0]['password']})
