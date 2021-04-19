from util import response, func_cache
from myauth import auth_check
from myauth.models import MyUser, get_my_user
from answers.models import Answer
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, F, Q, Subquery, OuterRef


def get_user_scores(user, res):
    def count_answers(legacy):
        res = 0
        for answer in user.answer_set.all():
            if answer.is_legacy_answer == legacy:
                res += 1
        return res

    res.update({
        'score': user.scores.upvotes - user.scores.downvotes,
        'score_answers': count_answers(False),
        'score_comments': user.answers_comments.count(),
        'score_cuts': user.answersection_set.count(),
        'score_legacy': count_answers(True),
    })
    return res


@func_cache.cache(600)
def get_scoreboard_top(scoretype, limit):
    if scoretype == 'score':
        users = MyUser.objects.annotate(
            score=F('scores__upvotes') - F('scores__downvotes')
        )
    elif scoretype == 'score_answers':
        users = MyUser.objects.annotate(
            score=Count('answer', filter=Q(answer__is_legacy_answer=False))
        )
    elif scoretype == 'score_comments':
        users = MyUser.objects.annotate(
            score=Count('comment')
        )
    elif scoretype == 'score_cuts':
        users = MyUser.objects.annotate(
            score=Count('answersection')
        )
    elif scoretype == 'score_legacy':
        users = MyUser.objects.annotate(
            score=Count('answer', filter=Q(answer__is_legacy_answer=True))
        )
    else:
        return response.not_found()

    users = users.select_related('scores').prefetch_related('answer_set', 'answers_comments', 'answersection_set')

    res = [
        get_user_scores(user, {
            'username': user.username,
            'displayName': get_my_user(user).displayname(),
        }) for user in users.order_by('-score', 'first_name', 'last_name')[:limit]
    ]
    return res


@response.request_get()
@auth_check.require_login
def userinfo(request, username):
    user = get_object_or_404(MyUser, username=username)
    res = {
        'username': username,
        'displayName': user.displayname(),
    }
    get_user_scores(user, res)
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def scoreboard_top(request, scoretype):
    limit = int(request.GET.get('limit', "10"))
    return response.success(value=get_scoreboard_top(scoretype, limit))
