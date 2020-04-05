from util import response, minio_util
from myauth import auth_check
from images.models import Image
from django.conf import settings
from django.shortcuts import get_object_or_404


@response.request_get()
@auth_check.require_login
def list_images(request):
    return response.success(value=list(Image.objects.filter(owner=request.user).values_list('filename')))


@response.request_post()
@auth_check.require_login
def upload_image(request):
    file = request.FILES.get('file')
    if not file:
        return response.missing_argument()
    ext = minio_util.check_filename(file.name, settings.COMSOL_IMAGE_ALLOWED_EXTENSIONS)
    if not ext:
        return response.not_possible('Invalid File Extensions')
    filename = minio_util.generate_filename(16, settings.COMSOL_IMAGE_DIR, '.' + ext)
    image = Image(filename=filename, owner=request.user, displayname=file.name)
    image.save()
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_IMAGE_DIR, filename, file)
    return response.success(filename=filename)


@response.request_post()
@auth_check.require_login
def remove_image(request, filename):
    image = get_object_or_404(Image, filename=filename)
    minio_util.delete_file(settings.COMSOL_IMAGE_DIR, filename)
    image.delete()
    return response.success()


@response.request_get()
@auth_check.require_login
def get_image(request, filename):
    return minio_util.send_file(settings.COMSOL_IMAGE_DIR, filename)
