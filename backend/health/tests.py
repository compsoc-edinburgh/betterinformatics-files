from testing.tests import ComsolTest


class TestHealth(ComsolTest):
    def setUpLogin(self):
        self.login_as(None)

    def test_health(self):
        res = self.client.get("/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.content, b"Server is running")
