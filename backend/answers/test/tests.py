from testing.tests import ComsolTestExamData
from datetime import timedelta


class TestMetadata(ComsolTestExamData):

    add_sections = False

    def test_metadata(self):
        res = self.get("/api/exam/metadata/{}/".format(self.exam.filename))["value"]
        self.assertEqual(res["filename"], self.exam.filename)
        self.assertEqual(res["displayname"], self.exam.displayname)
        self.assertEqual(res["examtype"], self.exam.exam_type.displayname)
        self.assertEqual(res["remark"], self.exam.remark)
        self.assertEqual(res["resolve_alias"], self.exam.resolve_alias)
        self.assertEqual(res["public"], self.exam.public)
        self.assertEqual(res["finished_cuts"], self.exam.finished_cuts)
        self.assertEqual(res["needs_payment"], self.exam.needs_payment)

    def test_set_metadata(self):
        self.post(
            "/api/exam/setmetadata/{}/".format(self.exam.filename),
            {
                "displayname": "New Displayname",
                "category": "default",
                "examtype": "Transcripts",
                "resolve_alias": "new_resolve_alias.pdf",
                "remark": "New remark",
                "public": False,
                "finished_cuts": False,
                "needs_payment": True,
                "solution_printonly": True,
            },
        )
        self.exam.refresh_from_db()
        self.test_metadata()
        self.post(
            "/api/exam/setmetadata/{}/".format(self.exam.filename),
            {"filename": "cannotchange.pdf",},
        )
        res = self.get("/api/exam/metadata/{}/".format(self.exam.filename))["value"]
        self.assertNotEqual(res["filename"], "cannotchange.pdf")


class TestClaim(ComsolTestExamData):

    add_sections = False

    def test_claim(self):
        self.assertEqual(self.exam.import_claim, None)
        self.post("/api/exam/claimexam/{}/".format(self.exam.filename), {"claim": True})
        self.exam.refresh_from_db()
        self.assertEqual(self.exam.import_claim.username, self.user["username"])
        self.post(
            "/api/exam/claimexam/{}/".format(self.exam.filename), {"claim": False}
        )
        self.exam.refresh_from_db()
        self.assertEqual(self.exam.import_claim, None)

    def test_claim_reset(self):
        self.post("/api/exam/claimexam/{}/".format(self.exam.filename), {"claim": True})
        self.exam.refresh_from_db()

        self.user = self.loginUsers[1]

        self.post(
            "/api/exam/claimexam/{}/".format(self.exam.filename),
            {"claim": True},
            status_code=400,
        )

        self.exam.import_claim_time = self.exam.import_claim_time - timedelta(hours=5)
        self.exam.save()
        self.post("/api/exam/claimexam/{}/".format(self.exam.filename), {"claim": True})

        self.exam.refresh_from_db()
        self.assertEqual(
            self.exam.import_claim.username, self.loginUsers[1]["username"]
        )

        self.user = self.loginUsers[1]
