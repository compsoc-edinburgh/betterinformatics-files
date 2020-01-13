import datetime
from django.http import JsonResponse, FileResponse


def data_dumper(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj


def success(**obj):
    return JsonResponse(obj, json_dumps_params={'default': data_dumper})


def not_allowed():
    return JsonResponse({'err': 'Not allowed'}, status=403)


def not_found():
    return JsonResponse({'err': 'Not found'}, status=404)


def not_possible(msg):
    return JsonResponse({"err": msg}, status=400)


def send_file(file_):
    return FileResponse(open(file_, 'rb'))