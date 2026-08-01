from django.conf import settings
from django.shortcuts import get_object_or_404
from ninja import File, Router, Schema, UploadedFile

from ediauth import auth_check
from images.models import Image
from util import s3_util
from util.response import ErrorSchema, not_allowed, not_possible
from util.schemas import ValueWrapped

router = Router(tags=["Images"])


class ImageList(ValueWrapped[list[str]]):
    pass


@router.get("/list/", response=ImageList, operation_id="listImages")
@auth_check.require_login
def list_images(request):
    return {
        "value": Image.objects.filter(owner=request.user).values_list(
            "filename", flat=True
        )
    }


class ImageUploadResponse(Schema):
    filename: str


@router.post(
    "/upload/",
    response={200: ImageUploadResponse, 400: ErrorSchema},
    operation_id="uploadImage",
)
@auth_check.require_login
def upload_image(request, file: File[UploadedFile]):
    ext = s3_util.check_filename(file.name, settings.COMSOL_IMAGE_ALLOWED_EXTENSIONS)
    if not ext:
        return not_possible("Invalid File Extensions")

    filename = s3_util.generate_filename(16, settings.COMSOL_IMAGE_DIR, "." + ext)
    image = Image(filename=filename, owner=request.user, displayname=file.name)
    image.save()
    s3_util.save_uploaded_file_to_s3(settings.COMSOL_IMAGE_DIR, filename, file)
    return {"filename": filename}


class ImageRemoveResponse(Schema):
    pass


@router.post(
    "/remove/{filename}/",
    response={200: ImageRemoveResponse, 403: ErrorSchema},
    operation_id="removeImage",
)
@auth_check.require_login
def remove_image(request, filename: str):
    image = get_object_or_404(Image, filename=filename)

    if image.owner != request.user and not auth_check.has_admin_rights(request):
        return not_allowed()

    s3_util.delete_file(settings.COMSOL_IMAGE_DIR, filename)
    image.delete()
    return {}


@router.get("/get/{filename}/", operation_id="getImage")
def get_image(request, filename: str):
    return s3_util.send_file(settings.COMSOL_IMAGE_DIR, filename)
