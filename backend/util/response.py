from ninja import Schema
from datetime import datetime
from functools import wraps

from django.core.handlers.wsgi import WSGIRequest
from django.http import (
    FileResponse,
    HttpResponseNotAllowed,
    JsonResponse,
)


def request_method(methods: "tuple[str] | list[str]"):
    def request_method(*req_args, optional=False):
        def wrap_func(f):
            @wraps(f)
            def wrapper(request: WSGIRequest, *args, **kwargs):
                if request.method not in methods:
                    return HttpResponseNotAllowed(methods)

                if not optional:
                    for arg in req_args:
                        if arg not in request.POST:
                            return missing_argument()

                return f(request, *args, **kwargs)

            return wrapper

        return wrap_func

    return request_method


request_post = request_method(["POST"])
request_put = request_method(["PUT"])
request_patch = request_method(["PATCH"])
request_delete = request_method(["DELETE"])
request_get = request_method(["GET"])


# Used in class based views
def required_args(*req_args, optional=False):
    def wrap_func(f):
        @wraps(f)
        def wrapper(self, request: WSGIRequest, *args, **kwargs):
            if not optional:
                for arg in req_args:
                    if arg not in request.POST:
                        return missing_argument()
            return f(self, request, *args, **kwargs)

        return wrapper

    return wrap_func


def data_dumper(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj


class ErrorSchema(Schema):
    err: str


def success(**obj):
    return JsonResponse(obj, json_dumps_params={"default": data_dumper})


def unauthorized():
    return JsonResponse({"err": "Unauthorized"}, status=401)


def not_allowed():
    return JsonResponse({"err": "Not allowed"}, status=403)


def not_found():
    return JsonResponse({"err": "Not found"}, status=404)


def not_possible(msg):
    return JsonResponse({"err": msg}, status=400)


def unsupported_media_type():
    return JsonResponse({"err": "Unsupported Media Type"}, status=415)


def internal_error():
    return JsonResponse({"err": "Internal Server Error"}, status=500)


def missing_argument():
    return not_possible("Missing argument")


def send_file(file_, **kwargs):
    return FileResponse(open(file_, "rb"), **kwargs)


def send_file_obj(file_obj, filename, as_attachment=False, **kwargs):
    return FileResponse(
        file_obj, filename=filename, as_attachment=as_attachment, **kwargs
    )
