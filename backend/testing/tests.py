from django.test import TestCase, Client
from answers.models import Exam, ExamType, AnswerSection, Answer, Comment
from categories.models import Category
from myauth.models import MyUser
import logging


class ComsolTest(TestCase):

    loginUsers = [
        {'username': 'schneij', 'password': "UOmtnC7{'%G", 'displayname': 'Jonas Schneider'},
        {'username': 'fletchz', 'password': "123456abc", 'displayname': 'Zoe Fletcher'},
        {'username': 'morica', 'password': "admin666", 'displayname': 'Carla Morin'},
    ]
    loginUser = 0
    user = {}

    def get(self, path, status_code=200, as_json=True):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status_code)
        if as_json:
            return response.json()
        return response

    def post(self, path, args, status_code=200, test_get=True, as_json=True):
        if test_get:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 405)
        for arg in args:
            if isinstance(args[arg], bool):
                args[arg] = 'true' if args[arg] else 'false'
        response = self.client.post(path, args)
        self.assertEqual(response.status_code, status_code)
        if as_json:
            return response.json()
        return response

    def get_my_user(self):
        return MyUser.objects.get(username=self.user['username'])

    def setUp(self, call_my_setup=True):
        logger = logging.getLogger('django.request')
        logger.setLevel(logging.ERROR)

        self.client = Client()
        if self.loginUser >= 0:
            self.user = self.loginUsers[self.loginUser]
            self.post('/api/auth/login/', {'username': self.user['username'], 'password': self.user['password']})
        if call_my_setup:
            self.mySetUp()

    def mySetUp(self):
        pass

    def tearDown(self):
        if self.loginUser >= 0:
            self.post('/api/auth/logout/', {})
        self.myTearDown()

    def myTearDown(self):
        pass


class ComsolTestExamData(ComsolTest):

    add_sections = True
    add_answers = True
    add_comments = True

    def setUp(self, call_my_setup=True):
        super(ComsolTestExamData, self).setUp(call_my_setup=False)
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
                    rel_height=0.25*i,
                    name='Aufgabe ' + str(i),
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

        if call_my_setup:
            self.mySetUp()


class ComsolTestExamsData(ComsolTest):

    def setUp(self, call_my_setup=True):
        super(ComsolTestExamsData, self).setUp(call_my_setup=False)
        self.category = Category(
            displayname='Test Category',
            slug='TestCategory',
        )
        self.category.save()
        self.exams = []
        for i in range(3):
            self.exams.append(
                Exam(
                    filename='test{}.pdf'.format(i),
                    category=self.category,
                    displayname='test',
                    exam_type = ExamType.objects.get(displayname='Exams'),
                    finished_cuts=True,
                    finished_wiki_transfer=True,
                    public=True
                )
            )
        for exam in self.exams:
            exam.save()

        if call_my_setup:
            self.mySetUp()

