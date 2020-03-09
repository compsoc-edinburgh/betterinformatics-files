from testing.tests import ComsolTestExamData

class TestScoreboard(ComsolTestExamData):

    def test_userinfo(self):
        for user in self.loginUsers:
            res = self.get('/api/scoreboard/userinfo/{}/'.format(user['username']))['value']
            self.assertEqual(res['username'], user['username'])

    def test_top(self):
        for ty in ['score', 'score_answers', 'score_comments', 'score_cuts', 'score_legacy']:
            res = self.get('/api/scoreboard/top/{}/'.format(ty))['value']
            self.assertEqual(len(res), min(10, len(self.loginUsers)))

# TODO check whether the returned values make sense (i.e. the scores are calculated correctly
