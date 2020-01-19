from util import response
from myauth import auth_check
from myauth.models import MyUser
from django.shortcuts import get_object_or_404


@auth_check.require_login
def userinfo(request, username):
    user = get_object_or_404(MyUser, username=username)
    res = {
        'username': username,
        'displayname': user.displayname(),
        'score': 0, # TODO implement
        'score_answers': 0, # TODO implement
        'score_comments': 0, # TODO implement
        'score_cuts': 0, # TODO implement
        'score_legacy': 0, # TODO implement
    }
    return response.success(value=res)


@auth_check.require_login
def scoreboard_top(request, scoretype):
    # TODO implement
    return response.success()
