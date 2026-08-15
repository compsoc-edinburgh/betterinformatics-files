from answers.models import AnswerSection
from testing.tests import ComsolTestExamData


class TestCuts(ComsolTestExamData):
    add_answers = False

    def test_get_cuts(self):
        res = self.get(f"/api/exam/cuts/{self.exam.filename}/")["value"]["1"]
        self.assertEqual(len(res), 4)
        for i in range(1, 5):
            self.assertEqual(res[i - 1]["relHeight"], i * 0.25)

    def test_adding_cut(self):
        self.assertEqual(AnswerSection.objects.count(), 4)
        self.post(
            f"/api/exam/addcut/{self.exam.filename}/",
            {"pageNum": 1, "relHeight": 0.4, "name": "Test"},
        )
        self.assertEqual(AnswerSection.objects.count(), 5)

    def test_removing_cut(self):
        self.assertEqual(AnswerSection.objects.count(), 4)
        cut = self.sections[0]
        self.post(f"/api/exam/removecut/{cut.id}/", {})
        self.assertEqual(AnswerSection.objects.count(), 3)

    def test_edit_cut(self):
        cut = self.sections[0]
        pageNum = cut.page_num
        relHeight = cut.rel_height
        name = cut.name
        self.post(
            f"/api/exam/editcut/{cut.id}/",
            {
                "name": "Test Name > 42",
                "pageNum": 42,
                "relHeight": 0.42,
            },
        )
        cut.refresh_from_db()
        self.assertEqual(cut.name, "Test Name > 42")
        self.assertEqual(cut.page_num, 42)
        self.assertEqual(cut.rel_height, 0.42)
        self.post(
            f"/api/exam/editcut/{cut.id}/",
            {
                "name": name,
                "pageNum": pageNum,
                "relHeight": relHeight,
            },
        )
        cut.refresh_from_db()
        self.assertEqual(cut.name, name)
        self.assertEqual(cut.page_num, pageNum)
        self.assertEqual(cut.rel_height, relHeight)


class TestCutVersion(ComsolTestExamData):
    def check_versions(self):
        res = self.get(f"/api/exam/cutversions/{self.exam.filename}/")["value"]
        for section in self.sections:
            section.refresh_from_db()
            self.assertEqual(res[str(section.id)], section.cut_version)

    def test_get_versions(self):
        self.check_versions()

    def test_set_answer(self):
        section = self.sections[0]
        oldversion = section.cut_version
        self.post(
            f"/api/exam/setanswer/{section.id}/",
            {
                "text": "New Test Answer",
                "kind": "personal",
            },
        )
        section.refresh_from_db()
        self.assertGreater(section.cut_version, oldversion)
        self.check_versions()

    def test_remove_answer(self):
        answer = self.answers[0]
        section = answer.answer_section
        oldversion = section.cut_version
        self.post(f"/api/exam/removeanswer/{answer.id}/", {})
        section.refresh_from_db()
        self.assertGreater(section.cut_version, oldversion)
        self.check_versions()

    def test_add_comment(self):
        answer = self.answers[0]
        section = answer.answer_section
        oldversion = section.cut_version
        self.post(
            f"/api/exam/addcomment/{answer.id}/",
            {
                "text": "New Test Comment",
            },
        )
        section.refresh_from_db()
        self.assertGreater(section.cut_version, oldversion)
        self.check_versions()

    def test_remove_comment(self):
        comment = self.comments[0]
        section = comment.answer.answer_section
        oldversion = section.cut_version
        self.post(f"/api/exam/removecomment/{comment.id}/", {})
        section.refresh_from_db()
        self.assertGreater(section.cut_version, oldversion)
        self.check_versions()

    def test_upvote(self):
        answer = self.answers[1]
        section = answer.answer_section
        oldversion = section.cut_version
        self.post(
            f"/api/exam/setlike/{answer.id}/",
            {
                "like": 1,
            },
        )
        section.refresh_from_db()
        self.assertGreater(section.cut_version, oldversion)
        self.check_versions()


class TestAnswerSection(ComsolTestExamData):
    def test_get_section(self):
        for section in self.sections:
            res = self.get(f"/api/exam/answersection/{section.id}/")["value"]
            self.assertEqual(len(res["answers"]), 4)
            self.assertEqual(len(res["answers"][0]["comments"]), 4)

            # TODO test whether the content makes any sense
            # TODO test whether upvoting adjusts the score correctly
