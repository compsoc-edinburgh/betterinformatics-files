from django.conf import settings
from django.shortcuts import get_object_or_404
from ninja import File, Router, Schema, UploadedFile

from images.models import Image
from myauth import auth_check
from util import s3_util
from util.response import ErrorSchema

router = Router()


class ImageList(Schema):
    # For backward compat it is a list of one-length lists
    value: list[tuple[str]]


@router.get("/list/", response=ImageList)
@auth_check.require_login
def list_images(request):
    return {
        "value": list(Image.objects.filter(owner=request.user).values_list("filename"))
    }


class ImageUploadResponse(Schema):
    filename: str


@router.post("/upload/", response={200: ImageUploadResponse, 400: ErrorSchema})
@auth_check.require_login
def upload_image(request, file: UploadedFile = File(...)):
    ext = s3_util.check_filename(file.name, settings.COMSOL_IMAGE_ALLOWED_EXTENSIONS)
    if not ext:
        return 400, {"err": "Invalid File Extensions"}

    filename = s3_util.generate_filename(16, settings.COMSOL_IMAGE_DIR, "." + ext)
    image = Image(filename=filename, owner=request.user, displayname=file.name)
    image.save()
    s3_util.save_uploaded_file_to_s3(settings.COMSOL_IMAGE_DIR, filename, file)
    return 200, {"filename": filename}


class ImageRemoveResponse(Schema):
    pass


@router.post(
    "/remove/{filename}/", response={200: ImageRemoveResponse, 403: ErrorSchema}
)
@auth_check.require_login
def remove_image(request, filename: str):
    image = get_object_or_404(Image, filename=filename)

    if image.owner != request.user and not auth_check.has_admin_rights(request):
        return 403, {"err": "Not allowed"}

    s3_util.delete_file(settings.COMSOL_IMAGE_DIR, filename)
    image.delete()
    return 200, {}


@router.get("/get/{filename}/")
def get_image(request, filename: str):
    return s3_util.send_file(settings.COMSOL_IMAGE_DIR, filename)
