import os
import random
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.http import FileResponse

from util import response

if "SIP_S3_FILES_HOST" in os.environ:
    endpoint = (
        ("https://" if os.environ["SIP_S3_FILES_USE_SSL"] == "true" else "http://")
        + os.environ["SIP_S3_FILES_HOST"]
        + ":"
        + os.environ["SIP_S3_FILES_PORT"]
    )
    options = {
        "endpoint_url": endpoint,
        "aws_access_key_id": os.environ["SIP_S3_FILES_ACCESS_KEY"],
        "aws_secret_access_key": os.environ["SIP_S3_FILES_SECRET_KEY"],
        "config": Config(signature_version="s3v4"),
        "region_name": "vis-is-great-1",
    }
    s3 = boto3.resource("s3", **options)
    s3_client = boto3.client("s3", **options)
    s3_bucket_name = os.environ["SIP_S3_FILES_BUCKET"]
    s3_bucket = s3.Bucket(s3_bucket_name)


def save_uploaded_file_to_disk(dest: str, uploaded_file: UploadedFile):
    with open(dest, "wb+") as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)


def save_uploaded_file_to_s3(
    directory: str,
    filename: str,
    uploaded_file: UploadedFile,
    content_type: Optional[str] = None,
):
    temp_file_path = os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename)
    save_uploaded_file_to_disk(temp_file_path, uploaded_file)
    if content_type is None:
        content_type = uploaded_file.content_type
    with open(temp_file_path, "rb") as temp_file:
        s3_bucket.put_object(
            Body=temp_file, Key=directory + filename, ContentType=content_type
        )


def save_file_to_s3(
    directory: str,
    filename: str,
    path: str,
    content_type: str = "application/octet-stream",
):
    with open(path, "rb") as file:
        s3_bucket.put_object(
            Body=file, Key=directory + filename, ContentType=content_type
        )


def delete_file(directory, filename):
    try:
        s3_client.delete_object(Bucket=s3_bucket_name, Key=directory + filename)
    except ClientError:
        return False
    return True


def delete_files(directory: str, filenames):
    try:
        objects_to_delete = [{"Key": directory + filename} for filename in filenames]
        s3_client.delete_objects(
            Bucket=s3_bucket_name, Delete={"Objects": objects_to_delete}
        )
    except ClientError:
        return False
    return True


def save_file(directory: str, filename: str, destination: str):
    try:
        s3_bucket.download_file(directory + filename, destination)
        return True
    except ClientError:
        return False


def presigned_get_object(
    directory: str,
    filename: str,
    inline: bool = True,
    content_type: Optional[str] = None,
    display_name: Optional[str] = None,
):
    if display_name is None:
        display_name = filename

    if inline:
        content_disposition = "inline; filename=" + display_name
    else:
        content_disposition = "attachment; filename=" + display_name
    return s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": s3_bucket_name,
            "Key": directory + filename,
            "ResponseContentDisposition": content_disposition,
            "ResponseContentType": content_type,
        },
        ExpiresIn=60 * 60 * 24,
        HttpMethod="GET",
    )


def send_file(
    directory: str,
    filename: str,
    as_attachment: bool = False,
    attachment_filename: Optional[str] = None,
):
    try:
        attachment_filename = attachment_filename or filename
        data = s3_client.get_object(
            Bucket=s3_bucket_name,
            Key=directory + filename,
        )
        return FileResponse(
            data["Body"], as_attachment=as_attachment, filename=attachment_filename
        )
    except ClientError:
        return response.not_found()


def is_file_in_s3(directory, filename):
    try:
        s3_client.head_object(Bucket=s3_bucket_name, Key=directory + filename)
        return True
    except ClientError:
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
    if is_file_in_s3(directory, res + extension):
        return generate_filename(length, directory, extension)
    return res + extension


def check_filename(filename, exts):
    for aext in exts:
        if filename.lower().endswith(aext):
            return aext
    return None
