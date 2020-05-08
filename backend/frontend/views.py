from util import response, legacy_importer
from answers.models import Exam
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from django.http import HttpResponse, Http404
from django.views.decorators.csrf import ensure_csrf_cookie
import json

@ensure_csrf_cookie
def index(request):
    with open('index.html') as f:
        html = f.read()
        html = html.replace('__SERVER_DATA__', json.dumps({
            'globID': settings.COMSOL_FRONTEND_GLOB_ID
        }))
        html = html.replace('https://static.vseth.ethz.ch/assets/vseth-0000-vseth/theme.css',
                            'https://static.vseth.ethz.ch/assets/{}/theme.css'.format(globID))
    return HttpResponse(html, content_type='text/html', charset='utf-8')


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
