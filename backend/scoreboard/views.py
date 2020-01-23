from util import response
from myauth import auth_check
from myauth.models import MyUser, get_my_user
from answers.models import Answer
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, F, Q, Subquery, OuterRef


def get_user_scores(user, res):
    def get_votes(field):
        return user.answer_set.filter(
            is_legacy_answer=False
        ).annotate(
            votes=Count(field)
        ).aggregate(
            score=Sum('votes')
        )['score'] or 0

    res.update({
        'score': get_votes('upvotes') - get_votes('downvotes'),
        'score_answers': user.answer_set.filter(is_legacy_answer=False).count(),
        'score_comments': user.comment_set.count(),
        'score_cuts': user.answersection_set.count(),
        'score_legacy': user.answer_set.filter(is_legacy_answer=True).count(),
    })
    return res


@auth_check.require_login
def userinfo(request, username):
    user = get_object_or_404(MyUser, username=username)
    res = {
        'username': username,
        'displayName': user.displayname(),
    }
    get_user_scores(user, res)
    return response.success(value=res)


@auth_check.require_login
def scoreboard_top(request, scoretype):
    limit = int(request.GET.get('limit', "10"))

    if scoretype == 'score':
        # It's a bit wtf...
        # There is probably a nicer way to do this
        # We just calculate the score for each user
        # by counting the upvotes and downvotes for all
        # answers by this user
        users = MyUser.objects.annotate(
            score=Subquery(
                Answer.objects.filter(
                    author=OuterRef('pk'),
                    is_legacy_answer=False,
                ).annotate(
                    upvote_cnt=Subquery(
                        Answer.objects.filter(
                            pk=OuterRef('pk')
                        ).annotate(
                            votes=Count('upvotes')
                        ).values('votes')
                    ),
                    downvote_cnt=Subquery(
                        Answer.objects.filter(
                            pk=OuterRef('pk')
                        ).annotate(
                            votes=Count('downvotes')
                        ).values('votes')
                    )
                ).values('author__pk').annotate(
                    votes=Sum('upvote_cnt')-Sum('downvote_cnt')
                ).values('votes')
            )
        ).exclude(score__isnull=True).prefetch_related('answer_set', 'comment_set', 'answersection_set')
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

    res = [
        get_user_scores(user, {
            'username': user.username,
            'displayName': get_my_user(user).displayname(),
        }) for user in users.order_by('-score', 'first_name', 'last_name')[:limit]
    ]
    return response.success(value=res)
