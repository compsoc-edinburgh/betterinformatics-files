from typing_extensions import Concatenate

from django.db.models.expressions import Case, When
from util import response, func_cache
from myauth import auth_check
from myauth.models import MyUser, get_my_user
from documents.models import Document
from answers.models import Answer
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, F, Q, Value as V


def get_user_scores(user, res):
    document_likes = (
        Document.objects.filter(author=user)
        .annotate(num_likes=Count("likes"))
        .aggregate(Sum("num_likes"))["num_likes__sum"]
    ) or 0
    res.update(
        {
            "score": document_likes + user.scores.upvotes - user.scores.downvotes,
            "score_answers": user.answer_set.filter(is_legacy_answer=False).count(),
            "score_comments": user.answers_comments.count(),
            "score_cuts": user.answersection_set.count(),
            "score_legacy": user.answer_set.filter(is_legacy_answer=True).count(),
            "score_documents": user.document_set.count(),
        }
    )
    return res


@func_cache.cache(600)
def get_scoreboard_top(scoretype, limit):
    users = MyUser.objects.annotate(
        displayName=Case(
            When(
                Q(first_name__isnull=True),
                "last_name",
            ),
            default=Concatenate("first_name", V(" "), "last_name"),
        ),
        score=F("scores__document_likes")
        + F("scores__upvotes")
        - F("scores__downvotes"),
        score_answers=Count("answer", filter=Q(answer__is_legacy_answer=False)),
        score_comments=Count("comment"),
        score_documents=Count("document"),
        score_cuts=MyUser.objects.annotate(score=Count("answersection")),
        score_legacy=Count("answer", filter=Q(answer__is_legacy_answer=True)),
    )

    if scoretype == "score":
        users = users.order_by("-score")
    elif scoretype == "score_answers":
        users = users.order_by("-score_answers")
    elif scoretype == "score_comments":
        users = users.order_by("-score_comments")
    elif scoretype == "score_documents":
        users = users.order_by("-score_documents")
    elif scoretype == "score_cuts":
        users = users.order_by("-score_cuts")
    elif scoretype == "score_legacy":
        users = users.order_by("-score_legacy")
    else:
        return response.not_found()

    return users[:limit].values(
        "username",
        "displayName",
        "score",
        "score_answers",
        "score_comments",
        "score_cuts",
        "score_legacy",
        "score_documents",
    )


@response.request_get()
@auth_check.require_login
def userinfo(request, username):
    user = get_object_or_404(MyUser, username=username)
    res = {
        "username": username,
        "displayName": user.displayname(),
    }
    get_user_scores(user, res)
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def scoreboard_top(request, scoretype):
    limit = int(request.GET.get("limit", "10"))
    return response.success(value=get_scoreboard_top(scoretype, limit))
