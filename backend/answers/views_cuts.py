from util import response
from myauth import auth_check
from answers.models import Exam, Answer, AnswerSection
from django.shortcuts import get_object_or_404
from answers import section_util


@response.request_get()
@auth_check.require_login
def get_cuts(request, filename):
    sections = get_object_or_404(
        Exam, filename=filename).answersection_set.all()
    pages = {}
    for sec in sections:
        pages.setdefault(sec.page_num, []).append({
            'oid': sec.id,
            'relHeight': sec.rel_height,
            'cutVersion': sec.cut_version,
            'name': sec.name,
            'hidden': sec.hidden,
            'has_answers': sec.has_answers
        })
    for page in pages.values():
        page.sort(key=lambda x: x['relHeight'])
    return response.success(value=pages)


@response.request_post('pageNum', 'relHeight')
@auth_check.require_exam_admin
def add_cut(request, filename, exam):
    section = AnswerSection(
        exam=exam,
        author=request.user,
        page_num=int(request.POST['pageNum']),
        rel_height=float(request.POST['relHeight']),
        name=request.POST['name'] if 'name' in request.POST else '',
        hidden=request.POST['hidden'] == 'true' if 'hidden' in request.POST else False,
        has_answers=request.POST['has_answers'] == 'true' if 'has_answers' in request.POST else False,
    )
    if not 0 <= section.rel_height <= 1:
        return response.not_possible('Invalid relative height')
    section.save()
    return response.success()


@response.request_post('name', 'pageNum', 'relHeight', optional=True)
@auth_check.require_login
def edit_cut(request, oid):
    section = get_object_or_404(AnswerSection, pk=oid)
    if not auth_check.has_admin_rights_for_exam(request, section.exam):
        return response.not_allowed()

    if 'name' in request.POST:
        section.name = request.POST['name']
    if 'pageNum' in request.POST:
        section.page_num = int(request.POST['pageNum'])
    if 'relHeight' in request.POST:
        section.rel_height = float(request.POST['relHeight'])
    if 'hidden' in request.POST:
        section.hidden = request.POST['hidden'] == 'true'
    if 'has_answers' in request.POST:
        section.has_answers = request.POST['has_answers'] == 'true'
        if not section.has_answers:
            answers = Answer.objects.filter(answer_section=oid)
            answers.delete()

    section.cut_version += 1
    section.save()
    return response.success()
    


@response.request_post()
@auth_check.require_login
def remove_cut(request, oid):
    section = get_object_or_404(AnswerSection, pk=oid)
    if not auth_check.has_admin_rights_for_exam(request, section.exam):
        return response.not_allowed()
    section.delete()
    return response.success()


@response.request_get()
@auth_check.require_login
def get_cut_versions(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    res = {}
    for section in exam.answersection_set.all():
        res[section.id] = section.cut_version
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def get_answersection(request, oid):
    section = get_object_or_404(
        AnswerSection.objects.select_related('exam').prefetch_related(
            'answer_set', 'answer_set__comments', 'answer_set__upvotes', 'answer_set__downvotes', 'answer_set__expertvotes', 'answer_set__flagged'),
        pk=oid)
    return response.success(value=section_util.get_answersection_response(request, section))
