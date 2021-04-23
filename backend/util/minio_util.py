import os
import random

from django.conf import settings
from django.http import FileResponse
from minio import Minio, S3Error

from util import response

if settings.IN_ENVIRON:
    # Minio seems to run unsecured on port 80 in the debug environment
    minio_client = Minio(
        os.environ["SIP_S3_FILES_HOST"] + ":" + os.environ["SIP_S3_FILES_PORT"],
        access_key=os.environ["SIP_S3_FILES_ACCESS_KEY"],
        secret_key=os.environ["SIP_S3_FILES_SECRET_KEY"],
        secure=not settings.DEBUG and not settings.TESTING,
    )
    minio_bucket = os.environ["SIP_S3_FILES_BUCKET"]


def save_uploaded_file_to_disk(dest, uploaded_file):
    with open(dest, "wb+") as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)


def save_uploaded_file_to_minio(
    directory, filename, uploaded_file, content_type="application/octet-stream"
):
    temp_file_path = os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename)
    save_uploaded_file_to_disk(temp_file_path, uploaded_file)
    minio_client.fput_object(
        minio_bucket, directory + filename, temp_file_path, content_type=content_type
    )


def save_file_to_minio(directory, filename, path):
    minio_client.fput_object(minio_bucket, directory + filename, path)


def delete_file(directory, filename):
    try:
        minio_client.remove_object(minio_bucket, directory + filename)
    except S3Error:
        return False
    return True


def save_file(directory, filename, destination):
    try:
        minio_client.fget_object(minio_bucket, directory + filename, destination)
        return True
    except S3Error:
        return False


def send_file(directory, filename, as_attachment=False, attachment_filename=None):
    try:
        attachment_filename = attachment_filename or filename
        data = minio_client.get_object(minio_bucket, directory + filename)
        return FileResponse(
            data, as_attachment=as_attachment, filename=attachment_filename
        )
    except S3Error:
        return response.not_found()


def is_file_in_minio(directory, filename):
    try:
        minio_client.stat_object(minio_bucket, directory + filename)
        return True
    except S3Error:
        return False


def generate_filename(length, directory, extension):
    """
    Generates a random filename
    :param length: length of the generated filename
    :param directory: directory to check for file existence
    :param extension: extension of the filename
    """
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    res = ""
    while len(res) < length:
        res += random.choice(chars)
    if is_file_in_minio(directory, res + extension):
        return generate_filename(length, directory, extension)
    return res + extension


def check_filename(filename, exts):
    for aext in exts:
        if filename.lower().endswith(aext):
            return aext
    return None
