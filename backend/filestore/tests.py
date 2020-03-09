from categories.models import Category
from testing.tests import ComsolTest


class TestUploadDownload(ComsolTest):

    def test_upload_and_download(self):
        category = Category(
            displayname='Test Category',
            slug='TestCategory',
        )
        category.save()
        with open('exam10.pdf', 'rb') as f:
            res = self.post('/api/filestore/upload/', {
                'displayname': 'Test',
                'category': category.slug,
                'file': f,
            })
        self.get('/api/filestore/get/{}/'.format(res['filename']), as_json=False)
        self.post('/api/filestore/remove/{}/'.format(res['filename']), {})
