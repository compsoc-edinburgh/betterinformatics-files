from util import response
from myauth import auth_check
from answers.models import Exam, AnswerSection
from django.shortcuts import get_object_or_404
from answers import section_util


@auth_check.require_login
def get_cuts(request, filename):
    sections = get_object_or_404(Exam, filename=filename).answersection_set.all()
    pages = {}
    for sec in sections:
        pages.setdefault(sec.page_num, []).append({
            'oid': sec.id,
            'relHeight': sec.rel_height,
            'cutVersion': sec.cut_version,
        })
    for page in pages.values():
        page.sort(key=lambda x: x['relHeight'])
    return response.success(value=pages)


@response.args_post('pageNum', 'relHeight')
@auth_check.require_exam_admin
def add_cut(request, filename, exam):
    section = AnswerSection(
        exam=exam,
        author=request.user,
        page_num=int(request.POST['pageNum']),
        rel_height=float(request.POST['relHeight']),
    )
    if not 0 <= section.rel_height <= 1:
        return response.not_possible('Invalid relative height')
    section.save()
    return response.success()


@response.args_post()
@auth_check.require_login
def remove_cut(request, oid):
    section = get_object_or_404(AnswerSection, pk=oid)
    if not auth_check.has_admin_rights_for_exam(request, section.exam):
        return response.not_allowed()
    section.delete()
    return response.success()


@auth_check.require_login
def get_cut_versions(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    res = {}
    for section in exam.answersection_set.all():
        res[section.id] = section.cut_version
    return response.success(value=res)


@auth_check.require_login
def get_answersection(request, oid):
    section = get_object_or_404(AnswerSection, pk=oid)
    return response.success(value=section_util.get_answersection_response(request, section))
