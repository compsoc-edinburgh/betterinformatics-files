import logging
import sys

from django.utils.cache import patch_cache_control
from django.views.static import serve

from util import response

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
