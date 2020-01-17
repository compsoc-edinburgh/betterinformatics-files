from util import response, minio_util
from myauth import auth_check
from django.conf import settings
from answers.models import Exam, ExamType, AnswerSection, Answer
from answers import section_util
from categories.models import Category
from django.shortcuts import get_object_or_404
from django.utils import timezone


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
        'attachments': sorted([
            {
                'displayname': att.displayname,
                'filename': att.filename,
            } for att in exam.attachment_set.all()
        ], key=lambda x: x['displayname']),
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
    return response.success(value=section_util.get_answersection_response(request, section))


@response.args_post('text', 'legacy_answer')
@auth_check.require_login
def set_answer(request, oid):
    section = get_object_or_404(AnswerSection, pk=oid)
    legacy_answer = request.POST['legacy_answer'] != 'false'
    if legacy_answer:
        if not auth_check.has_admin_rights_for_exam(request, section.exam):
            return response.not_allowed()
        answer, created = Answer.objects.get_or_create(answer_section=section, is_legacy_answer=True)
    else:
        answer, created = Answer.objects.get_or_create(answer_section=section, author=request.user, is_legacy_answer=False)
        if created:
            answer.upvotes.add(request.user)
    answer.text = request.POST['text']
    answer.edittime = timezone.now()
    answer.save()
    if not answer.text:
        answer.delete()
    return response.success(value=section_util.get_answersection_response(request, section))


@response.args_post()
@auth_check.require_login
def remove_answer(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    if not (answer.author == request.user or auth_check.has_admin_rights(request)):
        return response.not_allowed()
    section = answer.answer_section
    answer.delete()
    return response.success(value=section_util.get_answersection_response(request, section))


@response.args_post('like')
@auth_check.require_login
def set_like(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    like = int(request.POST['like'])
    old_like = 0
    if answer.upvotes.filter(pk=request.user.pk).exists():
        old_like = 1
    elif answer.downvotes.filter(pk=request.user.pk).exists():
        old_like = -1
    if like != old_like:
        if old_like == 1:
            answer.upvotes.remove(request.user)
        elif old_like == -1:
            answer.downvotes.remove(request.user)
        if like == 1:
            answer.upvotes.add(request.user)
        elif like == -1:
            answer.downvotes.add(request.user)
        answer.save()
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))


@response.args_post('vote')
@auth_check.require_login
def set_expertvote(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    if not auth_check.is_expert_for_exam(request, answer.answer_section.exam):
        return response.not_allowed()
    vote = request.POST['vote'] != 'false'
    old_vote = answer.expertvotes.filter(pk=request.user.pk).exists()
    if vote != old_vote:
        if old_vote:
            answer.expertvotes.remove(request.user)
        else:
            answer.expertvotes.add(request.user)
        answer.save()
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))


@response.args_post('flagged')
@auth_check.require_login
def set_flagged(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    flagged = request.POST['flagged'] != 'false'
    old_flagged = answer.flagged.filter(pk=request.user.pk).exists()
    if flagged != old_flagged:
        if old_flagged:
            answer.flagged.remove(request.user)
        else:
            answer.flagged.add(request.user)
        answer.save()
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))


@response.args_post()
@auth_check.require_admin
def reset_flagged(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    answer.flagged.clear()
    answer.save()
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))


@auth_check.require_login
def list_exam_types(request):
    return response.success(value=list(ExamType.objects.values_list('displayname', flat=True)))