from util import response, minio_util
from myauth import auth_check
from django.conf import settings
from answers.models import Exam, ExamType, AnswerSection
from answers import section_util
from categories.models import Category
from django.shortcuts import get_object_or_404


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
def exam_metadata(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    res = {
        'filename': exam.filename,
        'displayname': exam.displayname,
        'category': exam.category.slug,
        'category_displayname': exam.category.displayname,
        'examtype': exam.exam_type.displayname,
        'legacy_solution': exam.legacy_solution,
        'master_solution': exam.master_solution,
        'resolve_alias': exam.resolve_alias,
        'remark': exam.remark,
        'public': exam.public,
        'finished_cuts': exam.finished_cuts,
        'finished_wiki_transfer': exam.finished_wiki_transfer,
        'needs_payment': exam.needs_payment,
        'is_printonly': exam.is_printonly,
        'has_solution': exam.has_solution,
        'solution_printonly': exam.solution_printonly,
        'is_oral_transcript': exam.is_oral_transcript,
        'oral_transcript_checked': exam.oral_transcript_checked,
        'count_cuts': 0, # TODO implement
        'count_answered': 0, # TODO implement
        'attachments': [], # TODO implement
        'canEdit': auth_check.has_admin_rights_for_exam(request, exam),
        'isExpert': auth_check.is_expert_for_exam(request, exam),
        'canView': exam.current_user_can_view(request),
        'hasPayed': False, # TODO implement
    }
    return response.success(value=res)


@auth_check.require_exam_admin
def exam_set_metadata(request, filename, exam):
    # TODO implement
    return response.success()


@auth_check.require_login
def get_answersection(request, oid):
    section = get_object_or_404(AnswerSection, pk=oid)
    return response.success(value=section_util.get_ansersection_response(request, section))


@auth_check.require_login
def list_exam_types(request):
    return response.success(value=list(ExamType.objects.values_list('displayname', flat=True)))