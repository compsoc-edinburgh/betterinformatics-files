from testing.tests import ComsolTestExamData


class TestScoreboard(ComsolTestExamData):
    def test_userinfo(self):
        for user in self.users:
            res = self.get("/api/scoreboard/userinfo/{}/".format(user["username"]))[
                "value"
            ]
            self.assertEqual(res["username"], user["username"])

    def test_top(self):
        for ty in ["score", "score_answers", "score_comments", "score_cuts"]:
            res = self.get(f"/api/scoreboard/top/{ty}/")["value"]
            self.assertEqual(len(res), min(10, len(self.users)))


# TODO check whether the returned values make sense (i.e. the scores are calculated correctly
