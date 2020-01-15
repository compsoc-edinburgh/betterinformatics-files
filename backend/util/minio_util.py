import random
import os
from util import response
from minio import Minio
from minio.error import ResponseError, BucketAlreadyExists, BucketAlreadyOwnedByYou, NoSuchKey
from django.conf import settings
from django.http import FileResponse


if settings.IN_ENVIRON:
    # Minio seems to run unsecured on port 80 in the debug environment
    minio_client = Minio(
        os.environ['RUNTIME_MINIO_SERVER'],
        access_key=os.environ['RUNTIME_MINIO_ACCESS_KEY'],
        secret_key=os.environ['RUNTIME_MINIO_SECRET_KEY'],
        secure=not settings.DEBUG)
    minio_bucket = os.environ['RUNTIME_MINIO_BUCKET_NAME']


def save_uploaded_file_to_disk(dest, uploaded_file):
    with open(dest, 'wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)


def save_uploaded_file_to_minio(directory, filename, uploaded_file):
    temp_file_path = os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename)
    save_uploaded_file_to_disk(temp_file_path, uploaded_file)
    minio_client.fput_object(minio_bucket, directory + filename, temp_file_path)


def delete_file(directory, filename):
    try:
        minio_client.remove_object(minio_bucket, directory + filename)
    except NoSuchKey:
        return False
    return True


def send_file(directory, filename, as_attachment=False, attachment_filename=None):
    try:
        attachment_filename = attachment_filename or filename
        data = minio_client.get_object(minio_bucket, directory + filename)
        return FileResponse(
            data,
            as_attachment=as_attachment,
            filename=attachment_filename,
        )
    except NoSuchKey as n:
        return response.not_found()


def is_file_in_minio(directory, filename):
    """
    Check whether the file exists in minio
    :param directory: directory to check
    :param filename: filename
    """
    try:
        minio_client.stat_object(minio_bucket, directory + filename)
        return True
    except NoSuchKey:
        return False


def generate_filename(length, directory, extension):
    """
    Generates a random filename
    :param length: length of the generated filename
    :param directory: directory to check for file existance
    :param extension: extension of the filename
    """
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    res = ""
    while len(res) < length:
        res += random.choice(chars)
    if is_file_in_minio(directory, res + extension):
        return generate_filename(length, directory, extension)
    return res + extension
