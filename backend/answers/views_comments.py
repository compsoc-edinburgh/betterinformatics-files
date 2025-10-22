from util import response
from ediauth import auth_check
from answers.models import Answer, Comment
from answers import section_util
from notifications import notification_util
from django.shortcuts import get_object_or_404
from django.utils import timezone


@response.request_post('text')
@auth_check.require_login
def add_comment(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    new_comment = Comment(answer=answer, author=request.user, text=request.POST['text'])
    new_comment.save()
    notification_util.new_comment_to_answer(answer, new_comment)
    notification_util.new_comment_to_comment(answer, new_comment)
    section_util.increase_section_version(answer.answer_section)
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))


@response.request_post('text')
@auth_check.require_login
def set_comment(request, oid):
    comment = get_object_or_404(Comment, pk=oid)
    if comment.author != request.user:
        return response.not_allowed()
    comment.text = request.POST['text']
    comment.edittime = timezone.now()
    comment.save()
    section_util.increase_section_version(comment.answer.answer_section)
    return response.success(value=section_util.get_answersection_response(request, comment.answer.answer_section))


@response.request_post()
@auth_check.require_login
def remove_comment(request, oid):
    comment = get_object_or_404(Comment, pk=oid)
    if not (comment.author == request.user or auth_check.has_admin_rights(request)):
        return response.not_allowed()
    section = comment.answer.answer_section
    comment.delete()
    section_util.increase_section_version(comment.answer.answer_section)
    return response.success(value=section_util.get_answersection_response(request, section))


@response.request_post("flagged")
@auth_check.require_login
def set_flagged(request, oid):
    comment = get_object_or_404(Comment, pk=oid)
    flagged = request.POST["flagged"] != "false"
    old_flagged = comment.flagged.filter(pk=request.user.pk).exists()
    if flagged != old_flagged:
        if old_flagged:
            comment.flagged.remove(request.user)
        else:
            comment.flagged.add(request.user)
        comment.save()
    section_util.increase_section_version(comment.answer.answer_section)
    return response.success(value=section_util.get_answersection_response(request, comment.answer.answer_section))


@response.request_post()
@auth_check.require_admin
def reset_flagged(request, oid):
    comment = get_object_or_404(Comment, pk=oid)
    comment.flagged.clear()
    comment.save()
    section_util.increase_section_version(comment.answer.answer_section)
    return response.success(value=section_util.get_answersection_response(request, comment.answer.answer_section))