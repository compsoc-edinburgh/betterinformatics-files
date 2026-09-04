import logging
import sys

import yaml
from botocore.exceptions import ClientError
from django.http import JsonResponse
from django.utils.cache import patch_cache_control
from django.views.static import serve

from util import response, s3_util

logger = logging.getLogger(__name__)


def handler400(request, exception):
    return response.not_possible("Not possible")


def handler403(request, exception):
    return response.not_allowed()


def handler404(request, exception):
    return response.not_found()


def handler500(request):
    logger.exception("Internal server error", exc_info=sys.exc_info())
    return response.internal_error()


def cached_serve(request, path, document_root=None, show_indexes=False):
    res = serve(request, path, document_root, show_indexes)
    DAY = 60 * 60 * 24
    patch_cache_control(res, public=True, max_age=30 * DAY)
    return res


def courses_json(request):
    try:
        # Get courses.yaml from S3
        data = s3_util.s3_client.get_object(
            Bucket=s3_util.s3_bucket_name,
            Key="courses.yaml",
        )
    except ClientError:
        return response.not_found()

    try:
        # Convert YAML to JSON
        converted = yaml.safe_load(data["Body"].read())
    except yaml.YAMLError as e:
        logger.error("Error parsing courses.yaml: %s", e)
        return response.internal_error()

    res = JsonResponse(converted, safe=False)
    patch_cache_control(res, public=True, max_age=60 * 60 * 24)
    res["Access-Control-Allow-Origin"] = "*"
    return res
