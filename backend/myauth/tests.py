from testing.tests import ComsolTest


class TestMyAuthAdmin(ComsolTest):

    loginUser = 0

    def test_me(self):
        res = self.get('/api/auth/me/')
        self.assertTrue(res['loggedin'])
        self.assertTrue(res['adminrights'])
        self.assertTrue(res['adminrightscat'])
        self.assertEqual(res['username'], self.user['username'])
        self.assertEqual(res['displayname'], self.user['displayname'])


class TestMyAuthNonadmin(ComsolTest):

    loginUser = 2

    def test_me(self):
        res = self.get('/api/auth/me/')
        self.assertTrue(res['loggedin'])
        self.assertFalse(res['adminrights'])
        self.assertFalse(res['adminrightscat'])
        self.assertEqual(res['username'], self.user['username'])
        self.assertEqual(res['displayname'], self.user['displayname'])


class TestMyAuthUnauthorized(ComsolTest):

    loginUser = -1

    def test_me(self):
        res = self.get('/api/auth/me/')
        self.assertFalse(res['loggedin'])
        self.assertFalse(res['adminrights'])
        self.assertFalse(res['adminrightscat'])
