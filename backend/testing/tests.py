from django.test import TestCase, Client


class ComsolTest(TestCase):

    loginUsers = [
        {'username': 'schneij', 'password': "UOmtnC7{'%G", 'displayname': 'Jonas Schneider'},
        {'username': 'fletchz', 'password': "123456abc", 'displayname': 'Zoe Fletcher'},
        {'username': 'morica', 'password': "admin666", 'displayname': 'Carla Morin'},
    ]
    loginUser = 0
    user = {}

    def get(self, path, status_code=200):
        response = self.client.get(path)
        self.assertEqual(response.status_code, status_code)
        return response.json()

    def post(self, path, args, status_code=200):
        for arg in args:
            if isinstance(args[arg], bool):
                args[arg] = 'true' if args[arg] else 'false'
        response = self.client.post(path, args)
        self.assertEqual(response.status_code, status_code)
        return response.json()

    def setUp(self):
        self.client = Client()
        if self.loginUser >= 0:
            self.user = self.loginUsers[self.loginUser]
            self.client.post('/api/auth/login/', {'username': self.user['username'], 'password': self.user['password']})
        self.mySetUp()

    def mySetUp(self):
        pass

    def tearDown(self):
        if self.loginUser >= 0:
            self.client.post('/api/auth/logout/')
        self.myTearDown()

    def myTearDown(self):
        pass
