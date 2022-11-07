from testing.tests import ComsolTest


class TestUploadRemove(ComsolTest):

    def test_upload_and_remove(self):
        images = self.get('/api/image/list/')['value']
        self.assertEqual(len(images), 0)
        with open('static/test_uploadrm.svg', 'rb') as f:
            res = self.post('/api/image/upload/', {
                'file': f,
            })
        images = self.get('/api/image/list/')['value']
        self.assertEqual(len(images), 1)
        self.get('/api/image/get/{}/'.format(res['filename']), as_json=False)
        self.post('/api/image/remove/{}/'.format(res['filename']), {})
        images = self.get('/api/image/list/')['value']
        self.assertEqual(len(images), 0)

    def test_wrong_file_extension(self):
        with open('exam10.pdf', 'rb') as f:
            res = self.post('/api/image/upload/', {
                'file': f,
            }, status_code=400)
