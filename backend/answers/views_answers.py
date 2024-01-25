from util import response
from myauth import auth_check
from answers.models import AnswerSection, Answer
from answers import section_util
from notifications import notification_util
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.utils import timezone


@auth_check.require_login
def get_answer(request, long_id):
    try:
        answer = section_util.prepare_answer_objects(Answer.objects, request).get(long_id=long_id)
        return response.success(value=section_util.get_answer_response(request, answer))
    except Answer.DoesNotExist as e:
        raise Http404()
    except Answer.MultipleObjectsReturned as e:
        raise Http404()


@response.request_post("text", "legacy_answer")
@auth_check.require_login
def set_answer(request, oid):
    section = get_object_or_404(
        AnswerSection.objects.select_related("exam").prefetch_related(
            "answer_set",
            "answer_set__comments",
            "answer_set__upvotes",
            "answer_set__downvotes",
            "answer_set__expertvotes",
            "answer_set__flagged",
        ),
        pk=oid,
    )

    if not section.has_answers:
        return response.not_allowed()

    legacy_answer = request.POST["legacy_answer"] != "false"
    text = request.POST["text"]

    if legacy_answer and not auth_check.has_admin_rights_for_exam(
        request, section.exam
    ):
        return response.not_allowed()
    where = {"answer_section": section, "is_legacy_answer": legacy_answer}

    if not legacy_answer:
        where["author"] = request.user

    answer, created = None, False
    if not text:
        Answer.objects.filter(*where).delete()
    else:
        defaults = {
            "author": request.user,
            "text": text,
            "edittime": timezone.now(),
        }
        answer, created = Answer.objects.update_or_create(**where, defaults=defaults)
    if created and not legacy_answer:
        answer.upvotes.add(request.user)
        notification_util.new_answer_to_answer(answer)

    section_util.increase_section_version(section)
    return response.success(
        value=section_util.get_answersection_response(request, section)
    )


@response.request_post()
@auth_check.require_login
def remove_answer(request, oid):
    answer = get_object_or_404(
        Answer.objects.select_related("answer_section").all(),
        pk=oid
    )
    if not (answer.author == request.user or auth_check.has_admin_rights(request)):
        return response.not_allowed()
    section = answer.answer_section
    answer.delete()
    section_util.increase_section_version(section)
    return response.success(
        value=section_util.get_answersection_response(request, section)
    )


@response.request_post("like")
@auth_check.require_login
def set_like(request, oid):
    answer = get_object_or_404(
        Answer.objects.select_related("answer_section").all(),
        pk=oid
    )
    like = int(request.POST["like"])
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
    return response.success(
        value=section_util.get_answersection_response(request, answer.answer_section)
    )


@response.request_post("vote")
@auth_check.require_login
def set_expertvote(request, oid):
    answer = get_object_or_404(
        Answer.objects.select_related("answer_section").all(),
        pk=oid
    )
    if not auth_check.is_expert_for_exam(request, answer.answer_section.exam):
        return response.not_allowed()
    vote = request.POST["vote"] != "false"
    old_vote = answer.expertvotes.filter(pk=request.user.pk).exists()
    if vote != old_vote:
        if old_vote:
            answer.expertvotes.remove(request.user)
        else:
            answer.expertvotes.add(request.user)
        answer.save()
    section_util.increase_section_version(answer.answer_section)
    return response.success(
        value=section_util.get_answersection_response(request, answer.answer_section)
    )


@response.request_post("flagged")
@auth_check.require_login
def set_flagged(request, oid):
    answer = get_object_or_404(
        Answer.objects.select_related("answer_section").all(),
        pk=oid
    )
    flagged = request.POST["flagged"] != "false"
    old_flagged = answer.flagged.filter(pk=request.user.pk).exists()
    if flagged != old_flagged:
        if old_flagged:
            answer.flagged.remove(request.user)
        else:
            answer.flagged.add(request.user)
        answer.save()
    section_util.increase_section_version(answer.answer_section)
    return response.success(
        value=section_util.get_answersection_response(request, answer.answer_section)
    )


@response.request_post()
@auth_check.require_admin
def reset_flagged(request, oid):
    answer = get_object_or_404(
        Answer.objects.select_related("answer_section").all(),
        pk=oid
    )
    answer.flagged.clear()
    answer.save()
    section_util.increase_section_version(answer.answer_section)
    return response.success(
        value=section_util.get_answersection_response(request, answer.answer_section)
    )
