from notifications.models import Notification
from testing.tests import ComsolTest

class TestNotificationSettings(ComsolTest):

    def test_get_enabled(self):
        self.get('/api/notification/getenabled/')

    def test_set_enabled(self):
        types = self.get('/api/notification/getenabled/')['value']
        self.assertGreater(len(types), 0)
        for val in types:
            self.post('/api/notification/setenabled/', {
                'type': val,
                'enabled': 'false',
            })
        res = self.get('/api/notification/getenabled/')['value']
        self.assertEqual(len(res), 0)

        for val in types:
            self.post('/api/notification/setenabled/', {
                'type': val,
                'enabled': 'true',
            })
        res = self.get('/api/notification/getenabled/')['value']
        self.assertEqual(len(res), len(types))

class TestNotifications(ComsolTest):

    def test_notification_lifecycle(self):
        res = self.get('/api/notification/unread/')['value']
        self.assertEqual(len(res), 0)
        res = self.get('/api/notification/all/')['value']
        self.assertEqual(len(res), 0)
        res = self.get('/api/notification/unreadcount/')['value']
        self.assertEqual(res, 0)

        notification = Notification(
            sender=self.get_my_user(),
            receiver=self.get_my_user(),
            type=1,
            title='Test Notification',
            text='Test Text',
        )
        notification.save()

        res1 = self.get('/api/notification/unread/')['value']
        self.assertEqual(len(res1), 1)
        res2 = self.get('/api/notification/all/')['value']
        self.assertEqual(len(res2), 1)
        self.assertEqual(res1, res2)
        self.assertEqual(res1[0]['title'], notification.title)
        self.assertEqual(res1[0]['message'], notification.text)
        res = self.get('/api/notification/unreadcount/')['value']
        self.assertEqual(res, 1)

        self.post('/api/notification/setread/{}/'.format(notification.id), {'read': 'true'})

        res = self.get('/api/notification/unread/')['value']
        self.assertEqual(len(res), 0)
        res = self.get('/api/notification/all/')['value']
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]['title'], notification.title)
        self.assertEqual(res[0]['message'], notification.text)
        res = self.get('/api/notification/unreadcount/')['value']
        self.assertEqual(res, 0)
