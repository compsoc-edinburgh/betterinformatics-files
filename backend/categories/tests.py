from testing.tests import ComsolTest
from categories.models import Category


class TestAddRemove(ComsolTest):

    def test_add_remove(self):
        self.post('/api/category/add/', {'category': 'Test Category'})
        res = self.get('/api/category/list/')['value']
        self.assertEqual(res, ['Test Category', 'default'])
        res = self.get('/api/category/listwithmeta/')['value'][0]
        self.assertEqual(res['displayname'], 'Test Category')
        self.post('/api/category/remove/', {'slug': res['slug']})
        res = self.get('/api/category/list/')['value']
        self.assertEqual(res, ['default'])

    def test_remove_not_existing(self):
        self.post('/api/category/remove/', {'slug': 'nonexistant'}, status_code=404)

    def test_remove_default(self):
        self.post('/api/category/remove/', {'slug': 'default'}, status_code=400)

    def test_add_twice(self):
        self.post('/api/category/add/', {'category': 'Test Category'})
        self.post('/api/category/add/', {'category': 'Test Category'})
        res = self.get('/api/category/listwithmeta/')['value']
        self.assertEqual(len(res), 3)
        self.assertEqual(res[2]['slug'], 'default')
        self.assertNotEqual(res[0]['slug'], res[1]['slug'])
        self.assertEqual(res[0]['displayname'], res[1]['displayname'])


class TestList(ComsolTest):

    loginUser = 2

    def mySetUp(self):
        self.cat1 = Category(displayname='Test 1', slug='test1', has_payments=True)
        self.cat1.save()
        self.cat2 = Category(displayname='Test 2', slug='test2')
        self.cat2.save()
        self.cat2.admins.add(self.get_my_user())
        self.cat2.save()

    def test_list(self):
        res = self.get('/api/category/list/')['value']
        self.assertEqual(len(res), 3)

    def test_listwithmeta(self):
        res = self.get('/api/category/listwithmeta/')['value']
        self.assertEqual(len(res), 3)

    def test_admin(self):
        res = self.get('/api/category/listonlyadmin/')['value']
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]['displayname'], self.cat2.displayname)
        self.assertEqual(res[0]['slug'], self.cat2.slug)

    def test_payment(self):
        res = self.get('/api/category/listonlypayment/')['value']
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]['displayname'], self.cat1.displayname)
        self.assertEqual(res[0]['slug'], self.cat1.slug)


# TODO: test list_exams, checking whether all counts are correct
# TODO: test withmeta, checking whether all counts are correct
# TODO: test setting and getting metadata
# TODO: test adding and removing users to sets (admin, experts)
# TODO: test adding, removing, and retrieving meta categories
