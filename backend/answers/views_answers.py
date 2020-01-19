from util import response
from myauth import auth_check
from answers.models import AnswerSection, Answer
from answers import section_util
from notifications import notification_util
from django.shortcuts import get_object_or_404
from django.utils import timezone


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
            notification_util.new_answer_to_answer(answer)
    answer.text = request.POST['text']
    answer.edittime = timezone.now()
    answer.save()
    if not answer.text:
        answer.delete()
    section_util.increase_section_version(section)
    return response.success(value=section_util.get_answersection_response(request, section))


@response.args_post()
@auth_check.require_login
def remove_answer(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    if not (answer.author == request.user or auth_check.has_admin_rights(request)):
        return response.not_allowed()
    section = answer.answer_section
    answer.delete()
    section_util.increase_section_version(section)
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
    section_util.increase_section_version(answer.answer_section)
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
    section_util.increase_section_version(answer.answer_section)
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
    section_util.increase_section_version(answer.answer_section)
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))


@response.args_post()
@auth_check.require_admin
def reset_flagged(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    answer.flagged.clear()
    answer.save()
    section_util.increase_section_version(answer.answer_section)
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))
