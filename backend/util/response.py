from datetime import datetime, timezone, timedelta
from functools import wraps
from django.http import JsonResponse, FileResponse, QueryDict
from django.http import HttpResponseNotAllowed
from django.http.multipartparser import MultiPartParser
from io import BytesIO


def request_post(*req_args, optional=False):
    def wrap_func(f):
        @wraps(f)
        def wrapper(request, *args, **kwargs):
            if request.method != 'POST':
                return HttpResponseNotAllowed(['POST'])
            if not optional:
                for arg in req_args:
                    if arg not in request.POST:
                        return missing_argument()
            return f(request, *args, **kwargs)
        return wrapper
    return wrap_func


def request_get(*req_args, optional=False):
    def wrap_func(f):
        @wraps(f)
        def wrapper(request, *args, **kwargs):
            if request.method != 'GET':
                return HttpResponseNotAllowed(['GET'])
            if not optional:
                for arg in req_args:
                    if arg not in request.GET:
                        return missing_argument()
            return f(request, *args, **kwargs)
        return wrapper
    return wrap_func


# Used in class based views
def required_args(*req_args, optional=False):
    def wrap_func(f):
        @wraps(f)
        def wrapper(self, request, *args, **kwargs):
            if not optional:
                for arg in req_args:
                    if arg not in request.DATA:
                        return missing_argument()
            return f(self, request, *args, **kwargs)
        return wrapper
    return wrap_func


def data_dumper(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj


def success(**obj):
    return JsonResponse(obj, json_dumps_params={'default': data_dumper})

def unauthorized():
    return JsonResponse({'err': 'Unauthorized'}, status=401)

def not_allowed():
    return JsonResponse({'err': 'Not allowed'}, status=403)


def not_found():
    return JsonResponse({'err': 'Not found'}, status=404)


def not_possible(msg):
    return JsonResponse({"err": msg}, status=400)


def unsupported_media_type():
    return JsonResponse({"err": "Unsupported Media Type"}, status=415)


def internal_error():
    return JsonResponse({'err': 'Internal Server Error'}, status=500)


def missing_argument():
    return not_possible('Missing argument')


def send_file(file_, **kwargs):
    return FileResponse(open(file_, 'rb'), **kwargs)


def send_file_obj(file_obj, filename, as_attachment=False, **kwargs):
    return FileResponse(file_obj, filename=filename, as_attachment=as_attachment, **kwargs)