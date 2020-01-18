from util import response
from myauth import auth_check
from answers.models import Answer, Comment
from answers import section_util
from django.shortcuts import get_object_or_404
from django.utils import timezone


@response.args_post('text')
@auth_check.require_login
def add_comment(request, oid):
    answer = get_object_or_404(Answer, pk=oid)
    new_comment = Comment(answer=answer, author=request.user, text=request.POST['text'])
    new_comment.save()
    return response.success(value=section_util.get_answersection_response(request, answer.answer_section))


@response.args_post('text')
@auth_check.require_login
def set_comment(request, oid):
    comment = get_object_or_404(Comment, pk=oid)
    if comment.author != request.user:
        return response.not_allowed()
    comment.text = request.POST['text']
    comment.edittime = timezone.now()
    comment.save()
    return response.success(value=section_util.get_answersection_response(request, comment.answer.answer_section))


@response.args_post()
@auth_check.require_login
def remove_comment(request, oid):
    comment = get_object_or_404(Comment, pk=oid)
    if not (comment.author == request.user or auth_check.has_admin_rights(request)):
        return response.not_allowed()
    section = comment.answer.answer_section
    comment.delete()
    return response.success(value=section_util.get_answersection_response(request, section))
