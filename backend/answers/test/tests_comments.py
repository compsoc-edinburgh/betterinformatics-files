from testing.tests import ComsolTestExamData
from answers.models import Comment


class TestComment(ComsolTestExamData):

    def test_flag(self):
        comment = self.comments[1]
        self.assertEqual(comment.flagged.count(), 0)
        self.post(
            "/api/exam/setcommentflagged/{}/".format(comment.id), {"flagged": False}
        )
        self.post(
            "/api/exam/setcommentflagged/{}/".format(comment.id), {"flagged": True}
        )
        comment.refresh_from_db()
        self.assertEqual(comment.flagged.count(), 1)
        self.post(
            "/api/exam/setcommentflagged/{}/".format(comment.id), {"flagged": False}
        )
        comment.refresh_from_db()
        self.assertEqual(comment.flagged.count(), 0)

    def test_mark_as_ai(self):
        comment = self.comments[1]
        self.assertEqual(comment.marked_as_ai.count(), 0)
        self.post(
            "/api/exam/setcommentmarkedasai/{}/".format(comment.id),
            {"marked_as_ai": False},
        )
        self.post(
            "/api/exam/setcommentmarkedasai/{}/".format(comment.id),
            {"marked_as_ai": True},
        )
        comment.refresh_from_db()
        self.assertEqual(comment.marked_as_ai.count(), 1)
        self.post(
            "/api/exam/setcommentmarkedasai/{}/".format(comment.id),
            {"marked_as_ai": False},
        )
        comment.refresh_from_db()
        self.assertEqual(comment.marked_as_ai.count(), 0)

    def test_add_comment(self):
        answer = self.answers[0]
        self.assertEqual(answer.comments.count(), 3)
        self.post('/api/exam/addcomment/{}/'.format(answer.id), {
            'text': 'New Test Comment'
        })
        answer.refresh_from_db()
        self.assertEqual(answer.comments.count(), 4)

    def test_set_comment(self):
        comment = self.comments[0]
        self.post('/api/exam/setcomment/{}/'.format(comment.id), {
            'text': 'New Comment content'
        })
        comment.refresh_from_db()
        self.assertEqual(comment.text, 'New Comment content')

    def test_set_comment_not_me(self):
        comment = self.comments[1]
        self.post('/api/exam/setcomment/{}/'.format(comment.id), {
            'text': 'New Comment content'
        }, status_code=403)
        comment.refresh_from_db()
        self.assertNotEqual(comment.text, 'New Comment content')

    def test_remove_comment(self):
        self.assertEqual(Comment.objects.count(), 36)
        for comment in self.comments:
            self.post('/api/exam/removecomment/{}/'.format(comment.id), {})
        self.assertEqual(Comment.objects.count(), 0)


class TestCommentNonadmin(ComsolTestExamData):

    loginUser = 2

    def test_remove_all_comments(self):
        self.assertEqual(Comment.objects.count(), 36)
        removed = 0
        for comment in self.comments:
            can_remove = comment.author.username == self.user['username']
            if can_remove:
                removed += 1
            self.post('/api/exam/removecomment/{}/'.format(comment.id), {}, status_code=200 if can_remove else 403)
        self.assertEqual(removed, 12)
        self.assertEqual(Comment.objects.count(), 36 - removed)
