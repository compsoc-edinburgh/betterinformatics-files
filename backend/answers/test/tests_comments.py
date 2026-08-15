from answers.models import Comment
from testing.tests import ComsolTestExamData


class TestComment(ComsolTestExamData):
    def test_flag(self):
        comment = self.comments[1]
        self.assertEqual(comment.flagged.count(), 0)
        self.post(f"/api/exam/setcommentflagged/{comment.id}/", {"flagged": False})
        self.post(f"/api/exam/setcommentflagged/{comment.id}/", {"flagged": True})
        comment.refresh_from_db()
        self.assertEqual(comment.flagged.count(), 1)
        self.post(f"/api/exam/setcommentflagged/{comment.id}/", {"flagged": False})
        comment.refresh_from_db()
        self.assertEqual(comment.flagged.count(), 0)

    def test_mark_as_ai(self):
        comment = self.comments[1]
        self.assertEqual(comment.marked_as_ai.count(), 0)
        self.post(
            f"/api/exam/setcommentmarkedasai/{comment.id}/",
            {"marked_as_ai": False},
        )
        self.post(
            f"/api/exam/setcommentmarkedasai/{comment.id}/",
            {"marked_as_ai": True},
        )
        comment.refresh_from_db()
        self.assertEqual(comment.marked_as_ai.count(), 1)
        self.post(
            f"/api/exam/setcommentmarkedasai/{comment.id}/",
            {"marked_as_ai": False},
        )
        comment.refresh_from_db()
        self.assertEqual(comment.marked_as_ai.count(), 0)

    def test_add_comment(self):
        answer = self.answers[0]
        self.assertEqual(answer.comments.count(), 4)
        self.post(f"/api/exam/addcomment/{answer.id}/", {"text": "New Test Comment"})
        answer.refresh_from_db()
        self.assertEqual(answer.comments.count(), 5)

    def test_set_comment(self):
        comment = self.comments[0]
        self.post(
            f"/api/exam/setcomment/{comment.id}/",
            {"text": "New Comment content"},
        )
        comment.refresh_from_db()
        self.assertEqual(comment.text, "New Comment content")

    def test_set_comment_not_me(self):
        comment = self.comments[1]
        self.post(
            f"/api/exam/setcomment/{comment.id}/",
            {"text": "New Comment content"},
            status_code=403,
        )
        comment.refresh_from_db()
        self.assertNotEqual(comment.text, "New Comment content")

    def test_remove_comment(self):
        self.assertEqual(Comment.objects.count(), 64)
        for comment in self.comments:
            self.post(f"/api/exam/removecomment/{comment.id}/", {})
        self.assertEqual(Comment.objects.count(), 0)


class TestCommentNonadmin(ComsolTestExamData):
    def setUpLogin(self):
        self.login_as(self.nonAdminUsers[0])

    def test_remove_all_comments(self):
        self.assertEqual(Comment.objects.count(), 64)
        removed = 0
        for comment in self.comments:
            can_remove = comment.author.username == self.user["username"]
            if can_remove:
                removed += 1
            self.post(
                f"/api/exam/removecomment/{comment.id}/",
                {},
                status_code=200 if can_remove else 403,
            )
        self.assertEqual(removed, 16)
        self.assertEqual(Comment.objects.count(), 64 - removed)
