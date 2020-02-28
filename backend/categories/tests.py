from answers.models import Exam
from myauth.models import MyUser
from testing.tests import ComsolTest, ComsolTestExamsData
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


class TestMetadata(ComsolTest):

    def mySetUp(self):
        self.cat1 = Category(
            displayname='Test 1',
            slug='test1',
            remark='Test remark',
            semester='HS',
            has_payments=True
        )
        self.cat1.save()

    def test_get_metadata(self):
        res = self.get('/api/category/metadata/test1/')['value']
        self.assertEqual(res['displayname'], self.cat1.displayname)
        self.assertEqual(res['slug'], self.cat1.slug)
        self.assertEqual(res['remark'], self.cat1.remark)
        self.assertEqual(res['semester'], self.cat1.semester)
        self.assertEqual(res['has_payments'], self.cat1.has_payments)

    def test_set_metadata(self):
        self.post('/api/category/setmetadata/test1/', {
            'remark': 'New test remark',
            'semester': 'FS',
            'has_payments': False,
        })
        self.cat1.refresh_from_db()
        self.assertEqual(self.cat1.remark, 'New test remark')
        self.assertEqual(self.cat1.semester, 'FS')
        self.assertEqual(self.cat1.has_payments, False)

    def test_set_slug(self):
        self.post('/api/category/setmetadata/test1/', {
            'slug': 'newslug'
        })
        self.cat1.refresh_from_db()
        self.assertEqual(self.cat1.slug, 'test1')

    def test_add_remove_user(self):
        user, _ = MyUser.objects.get_or_create(username='morica')
        self.post('/api/category/addusertoset/test1/', {
            'key': 'admins',
            'user': 'morica',
        })
        self.cat1.refresh_from_db()
        self.assertTrue(user in self.cat1.admins.all())
        self.assertFalse(user in self.cat1.experts.all())
        self.post('/api/category/removeuserfromset/test1/', {
            'key': 'admins',
            'user': 'morica',
        })
        self.cat1.refresh_from_db()
        self.assertFalse(user in self.cat1.admins.all())
        self.assertFalse(user in self.cat1.experts.all())
        self.post('/api/category/addusertoset/test1/', {
            'key': 'experts',
            'user': 'morica',
        })
        self.cat1.refresh_from_db()
        self.assertFalse(user in self.cat1.admins.all())
        self.assertTrue(user in self.cat1.experts.all())
        self.post('/api/category/removeuserfromset/test1/', {
            'key': 'experts',
            'user': 'morica',
        })
        self.cat1.refresh_from_db()
        self.assertFalse(user in self.cat1.admins.all())
        self.assertFalse(user in self.cat1.experts.all())


class TestListExams(ComsolTestExamsData):

    def test_list_exams(self):
        self.exams[1].public = False
        self.exams[1].save()
        res = self.get('/api/category/listexams/TestCategory/')['value']
        self.assertEqual(len(res), 3)
        self.assertTrue(res[0]['public'])
        self.assertFalse(res[1]['public'])
        self.assertTrue(res[2]['public'])


class TestMetaCategories(ComsolTest):
    pass


# TODO: test whether the counts returned in list_exams and withmeta are correct

# TODO: test adding, removing, and retrieving meta categories
