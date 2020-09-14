from testing.tests import ComsolTestExamData
from answers.models import Answer, AnswerSection


class TestExistingAnswer(ComsolTestExamData):

    add_comments = False

    def test_set_answer(self):
        answer = self.answers[0]
        self.post(
            "/api/exam/setanswer/{}/".format(answer.answer_section.id),
            {"text": "New Answer Text", "legacy_answer": False,},
        )
        answer.refresh_from_db()
        self.assertEqual(answer.text, "New Answer Text")

    def test_remove_answer(self):
        answer = self.answers[0]
        id = answer.id
        self.post("/api/exam/removeanswer/{}/".format(answer.id), {})
        self.assertFalse(Answer.objects.filter(id=id).exists())

    def test_remove_all_answers(self):
        self.assertEqual(Answer.objects.count(), 16)
        for answer in self.answers:
            self.post("/api/exam/removeanswer/{}/".format(answer.id), {})
        self.assertEqual(Answer.objects.count(), 0)

    def test_like(self):
        answer = self.answers[1]
        self.assertEqual(answer.upvotes.count(), 0)
        self.assertEqual(answer.downvotes.count(), 0)
        self.post("/api/exam/setlike/{}/".format(answer.id), {"like": 1})
        answer.refresh_from_db()
        self.assertEqual(answer.upvotes.count(), 1)
        self.assertEqual(answer.downvotes.count(), 0)
        self.post("/api/exam/setlike/{}/".format(answer.id), {"like": -1})
        answer.refresh_from_db()
        self.assertEqual(answer.upvotes.count(), 0)
        self.assertEqual(answer.downvotes.count(), 1)
        self.post("/api/exam/setlike/{}/".format(answer.id), {"like": 1})
        answer.refresh_from_db()
        self.assertEqual(answer.upvotes.count(), 1)
        self.assertEqual(answer.downvotes.count(), 0)
        self.post("/api/exam/setlike/{}/".format(answer.id), {"like": 0})
        answer.refresh_from_db()
        self.assertEqual(answer.upvotes.count(), 0)
        self.assertEqual(answer.downvotes.count(), 0)

    def test_flag(self):
        answer = self.answers[1]
        self.assertEqual(answer.flagged.count(), 0)
        self.post("/api/exam/setflagged/{}/".format(answer.id), {"flagged": False})
        self.post("/api/exam/setflagged/{}/".format(answer.id), {"flagged": True})
        answer.refresh_from_db()
        self.assertEqual(answer.flagged.count(), 1)
        self.post("/api/exam/setflagged/{}/".format(answer.id), {"flagged": False})
        answer.refresh_from_db()
        self.assertEqual(answer.flagged.count(), 0)

    def test_expertvote_nonexpert(self):
        answer = self.answers[1]
        self.post(
            "/api/exam/setexpertvote/{}/".format(answer.id),
            {"vote": True},
            status_code=403,
        )

    def test_expertvote(self):
        answer = self.answers[1]
        answer.answer_section.exam.category.experts.add(self.get_my_user())
        answer.save()
        self.assertEqual(answer.expertvotes.count(), 0)
        self.post("/api/exam/setexpertvote/{}/".format(answer.id), {"vote": False})
        self.post("/api/exam/setexpertvote/{}/".format(answer.id), {"vote": True})
        answer.refresh_from_db()
        self.assertEqual(answer.expertvotes.count(), 1)
        self.post("/api/exam/setexpertvote/{}/".format(answer.id), {"vote": False})
        answer.refresh_from_db()
        self.assertEqual(answer.expertvotes.count(), 0)


class TestDeleteNonadmin(ComsolTestExamData):

    loginUser = 2
    add_comments = False

    def test_remove_answer(self):
        answer = self.answers[2]
        id = answer.id
        self.post("/api/exam/removeanswer/{}/".format(answer.id), {})
        self.assertFalse(Answer.objects.filter(id=id).exists())

    def test_remove_all_answers(self):
        self.assertEqual(Answer.objects.count(), 16)
        removed = 0
        for answer in self.answers:
            can_remove = answer.author.username == self.user["username"]
            if can_remove:
                removed += 1
            self.post(
                "/api/exam/removeanswer/{}/".format(answer.id),
                {},
                status_code=200 if can_remove else 403,
            )
        self.assertEqual(removed, 4)
        self.assertEqual(Answer.objects.count(), 16 - removed)


class TestNonexisting(ComsolTestExamData):

    add_comments = False

    def mySetUp(self):
        self.mysection = AnswerSection(
            exam=self.exam,
            author=self.get_my_user(),
            page_num=1,
            rel_height=0.8,
            name="Test",
        )
        self.mysection.save()

    def test_set_answer(self):
        self.assertEqual(self.mysection.answer_set.count(), 0)
        self.assertFalse(
            Answer.objects.filter(
                answer_section=self.mysection, author=self.get_my_user()
            ).exists()
        )
        self.post(
            "/api/exam/setanswer/{}/".format(self.mysection.id),
            {"text": "Test Answer 123", "legacy_answer": False,},
        )
        self.assertEqual(self.mysection.answer_set.count(), 1)
        self.assertTrue(
            Answer.objects.filter(
                answer_section=self.mysection, author=self.get_my_user()
            ).exists()
        )
