from testing.tests import ComsolTest
from django.conf import settings


class TestUploadRemove(ComsolTest):

    def test_upload_and_remove(self):
        images = self.get('/api/image/list/')['value']
        self.assertEqual(len(images), 0)
        with open(f"{settings.COMSOL_ASSETS_FOLDER}/static/test_uploadrm.svg", 'rb') as f:
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
        with open(f"{settings.COMSOL_ASSETS_FOLDER}/exam10.pdf", 'rb') as f:
            res = self.post('/api/image/upload/', {
                'file': f,
            }, status_code=400)


class TestRemoveImage(ComsolTest):
    filename = None

    def mySetUp(self):
        # Upload an image as user 0
        self.user = self.loginUsers[0]
        with open(f"{settings.COMSOL_ASSETS_FOLDER}/static/test_uploadrm.svg", "rb") as f:
            res = self.post(
                "/api/image/upload/",
                {
                    "file": f,
                },
            )

        self.get(f"/api/image/get/{res['filename']}/", as_json=False, status_code=200)

        self.filename = res["filename"]

    def test_cannot_remove_non_owned_image(self):
        # If different non-admin user, shouldn't be able to remove image
        self.user = self.loginUsers[1]
        self.user["admin"] = False

        self.post(f"/api/image/remove/{self.filename}/", {}, status_code=403)
        self.get(f"/api/image/get/{self.filename}/", as_json=False, status_code=200)

    def test_can_delete_owned_image(self):
        # If same user, should be able to remove image
        self.user = self.loginUsers[0]
        self.user["admin"] = False

        self.post(f"/api/image/remove/{self.filename}/", {}, status_code=200)
        self.get(f"/api/image/get/{self.filename}/", as_json=False, status_code=404)

    def test_admin_can_delete_non_owned_image(self):
        # If admin, should be able to delete other people's images too
        self.user = self.loginUsers[1]
        self.user["admin"] = True

        self.post(f"/api/image/remove/{self.filename}/", {}, status_code=200)
        self.get(f"/api/image/get/{self.filename}/", as_json=False, status_code=404)
