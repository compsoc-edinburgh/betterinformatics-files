from util import response
from answers.models import Exam
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect, render
from django.http import HttpResponse, Http404
from django.views.decorators.csrf import ensure_csrf_cookie
import json


@ensure_csrf_cookie
def index(request):
    context = {
        "GLOB_ID": settings.COMSOL_FRONTEND_GLOB_ID,
        "KEYCLOAK_URL": settings.COMSOL_FRONTEND_KEYCLOAK_URL,
        "KEYCLOAK_REALM": settings.COMSOL_FRONTEND_KEYCLOAK_REALM,
        "KEYCLOAK_CLIENT_ID": settings.COMSOL_FRONTEND_KEYCLOAK_CLIENT_ID,
        "FAVICON_URL": settings.FAVICON_URL,
        "SERVER_DATA": json.dumps(settings.FRONTEND_SERVER_DATA)
    }
    return render(request, "index.html", context)


def favicon(request):
    return response.send_file("favicon.ico")


def manifest(request):
    return response.send_file("manifest.json")


def resolve(request, filename):
    exams = Exam.objects.filter(resolve_alias=filename)
    if not exams.exists():
        return Http404()
    return redirect("/exams/" + exams.first().filename + "/")

@ensure_csrf_cookie
def can_i_haz_csrf_cookie(request):
    return response.success(cookie="no")
