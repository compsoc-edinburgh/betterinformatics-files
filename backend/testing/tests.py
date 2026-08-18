import datetime
import json
import logging
from http.cookies import SimpleCookie

import jwt
from django.conf import settings
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart

from answers.models import Answer, AnswerSection, Comment, Exam, ExamType
from categories.models import Category


def get_token(user):
    jwt_claims = {
        "uun": user["username"],
        "email": user["username"] + "@sms.ed.ac.uk",
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(weeks=4),
        "admin": user["admin"],
    }

    token = jwt.encode(
        jwt_claims,
        settings.JWT_PRIVATE_KEY,
        algorithm="RS256",
    )

    return token


class ComsolTest(TestCase):
    test_http_methods = True

    def get(self, path, status_code=200, test_post=True, as_json=True):
        if self.user:
            self.client.cookies = SimpleCookie({"access_token": get_token(self.user)})
        else:
            self.client.cookies = SimpleCookie()

        if test_post and self.test_http_methods:
            response = self.client.post(path)
            self.assertEqual(response.status_code, 405)
        response = self.client.get(path)
        self.assertEqual(response.status_code, status_code)
        if as_json:
            return response.json()
        return response

    def post(
        self, path, args, status_code=200, test_get=True, as_json=True, json_body=False
    ):
        if self.user:
            self.client.cookies = SimpleCookie({"access_token": get_token(self.user)})
        else:
            self.client.cookies = SimpleCookie()

        if test_get and self.test_http_methods:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 405)
        if json_body:
            body = json.dumps(args)
            content_type = "application/json"
        else:
            for arg in args:
                if isinstance(args[arg], bool):
                    args[arg] = "true" if args[arg] else "false"
            body = args
            content_type = MULTIPART_CONTENT
        response = self.client.post(path, body, content_type=content_type)
        self.assertEqual(response.status_code, status_code)
        if as_json:
            return response.json()
        return response

    def put(self, path, args, status_code=200, as_json=True, json_body=False):
        if self.user:
            self.client.cookies = SimpleCookie({"access_token": get_token(self.user)})
        else:
            self.client.cookies = SimpleCookie()

        if json_body:
            body = json.dumps(args)
            content_type = "application/json"
        else:
            for arg in args:
                if isinstance(args[arg], bool):
                    args[arg] = "true" if args[arg] else "false"
            body = encode_multipart(BOUNDARY, args)
            content_type = MULTIPART_CONTENT
        response = self.client.put(
            path,
            body,
            content_type=content_type,
        )
        self.assertEqual(response.status_code, status_code)
        if as_json:
            return response.json()
        return response

    def patch(self, path, args, status_code=200, as_json=True, json_body=False):
        if self.user:
            self.client.cookies = SimpleCookie({"access_token": get_token(self.user)})
        else:
            self.client.cookies = SimpleCookie()

        if json_body:
            body = json.dumps(args)
            content_type = "application/json"
        else:
            for arg in args:
                if isinstance(args[arg], bool):
                    args[arg] = "true" if args[arg] else "false"
            body = encode_multipart(BOUNDARY, args)
            content_type = MULTIPART_CONTENT
        response = self.client.patch(
            path,
            body,
            content_type=content_type,
        )
        self.assertEqual(response.status_code, status_code)
        if as_json:
            return response.json()
        return response

    def delete(self, path, status_code=200, as_json=True):
        if self.user:
            self.client.cookies = SimpleCookie({"access_token": get_token(self.user)})
        else:
            self.client.cookies = SimpleCookie()

        response = self.client.delete(path)
        self.assertEqual(response.status_code, status_code)
        if as_json:
            return response.json()
        return response

    def login_as(self, user):
        if user is None:
            self.user = None
            return
        self.user = user
        self.get("/api/auth/me/")

    def get_my_user(self):
        return User.objects.get(username=self.user["username"])

    def setUp(self, call_my_setup=True):
        logger = logging.getLogger("django.request")
        logger.setLevel(logging.ERROR)

        self.adminUsers = [
            {
                "sub": "42",
                "username": "schneij",
                "given_name": "Jonas",
                "family_name": "Schneider",
                "admin": True,
                "displayname": "schneij",
            },
            {
                "sub": "42-1",
                "username": "fletchz",
                "given_name": "Zoe",
                "family_name": "Fletcher",
                "admin": True,
                "displayname": "fletchz",
            },
        ]
        self.nonAdminUsers = [
            {
                "sub": "42-2",
                "username": "morica",
                "given_name": "Carla",
                "family_name": "Morin",
                "admin": False,
                "displayname": "morica",
            },
            {
                "sub": "42-3",
                "username": "meyeral",
                "given_name": "Alex",
                "family_name": "Meyer",
                "admin": False,
                "displayname": "meyeral",
            },
        ]

        self.users = self.adminUsers + self.nonAdminUsers

        self.client = Client()
        self.setUpLogin()
        if call_my_setup:
            self.mySetUp()

    def setUpLogin(self):
        self.login_as(self.adminUsers[0])

    def mySetUp(self):
        pass

    def tearDown(self):
        self.myTearDown()

    def myTearDown(self):
        pass


class ComsolTestExamData(ComsolTest):
    add_sections = True
    add_answers = True
    add_comments = True

    def setUp(self, call_my_setup=True):
        super().setUp(call_my_setup=False)
        saved = self.user
        for user in self.users:
            self.user = user
            self.get("/api/notification/unreadcount/")
        self.user = saved

        self.category = Category(
            displayname="Test Category",
            slug="TestCategory",
        )
        self.category.save()

        self.exam = Exam(
            filename="abc.pdf",
            displayname="Test Displayname",
            category=self.category,
            exam_type=ExamType.objects.get(displayname="Exams"),
            remark="Test Remark",
            resolve_alias="resolve.pdf",
            public=True,
            finished_cuts=True,
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
                    rel_height=0.25 * i,
                    name="Aufgabe " + str(i),
                )
            )
        for section in self.sections:
            section.save()
            if not self.add_answers:
                continue
            for i in range(4):
                self.answers.append(
                    Answer(
                        answer_section=section,
                        author=User.objects.get(username=self.users[i]["username"]),
                        text=f"Test Answer {section.id}/{i}",
                    )
                )
        for answer in self.answers:
            answer.save()
            if not self.add_comments:
                continue
            for i in range(4):
                self.comments.append(
                    Comment(
                        answer=answer,
                        author=User.objects.get(username=self.users[i]["username"]),
                        text=f"Comment {answer.id}/{i}",
                    )
                )
        for comment in self.comments:
            comment.save()

        if call_my_setup:
            self.mySetUp()


class ComsolTestExamsData(ComsolTest):
    def setUp(self, call_my_setup=True):
        super().setUp(call_my_setup=False)
        self.category = Category(
            displayname="Test Category",
            slug="TestCategory",
        )
        self.category.save()
        self.exams = []
        for i in range(3):
            self.exams.append(
                Exam(
                    filename=f"test{i}.pdf",
                    category=self.category,
                    displayname=f"test{i}",
                    exam_type=ExamType.objects.get(displayname="Exams"),
                    finished_cuts=True,
                    public=True,
                )
            )
        for exam in self.exams:
            exam.save()

        if call_my_setup:
            self.mySetUp()
