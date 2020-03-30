from util import response, legacy_importer
from answers.models import Exam
from django.shortcuts import get_object_or_404, redirect
from django.http import HttpResponse, Http404
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def index(request):
    return response.send_file('index.html')


def favicon(request):
    return response.send_file('favicon.ico')


def manifest(request):
    return response.send_file('manifest.json')


def resolve(request, filename):
    exams = Exam.objects.filter(resolve_alias=filename)
    if not exams.exists():
        return Http404()
    return redirect('/exams/' + exams.first().filename + '/')


def legacy_wiki_transform(request, examname):
    return HttpResponse(legacy_importer.transform_wiki(examname), content_type='text/plain', charset='utf-8')


@ensure_csrf_cookie
def can_i_haz_csrf_cookie(request):
    return response.success(cookie="no")
