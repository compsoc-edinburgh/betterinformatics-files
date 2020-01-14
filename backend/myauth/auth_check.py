from functools import wraps
from django.conf import settings

from util import response


def check_api_key(request):
    api_key = request.headers.get('X-COMMUNITY-SOLUTIONS-API-KEY')
    return bool(api_key and api_key == settings.API_KEY)


def user_authenticated(request):
    if request.user.is_authenticated:
        return True
    if check_api_key(request):
        return True
    return False


def has_admin_rights(request):
    """
    Check whether the given user should have global admin rights.
    :param username: the user to check
    :return: True iff the user has global admin rights
    """
    if request.session['simulate_nonadmin'] == '1':
        return False
    if check_api_key(request):
        return True
    from myauth.people_auth import get_vis_groups
    vis_groups = get_vis_groups(request.user.username)
    return any(("vorstand" == group or "cat" == group or "luk" == group or "serviceaccounts" == group) for group in vis_groups)


def require_login(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not user_authenticated(request):
            return response.not_allowed()
        return f(request, *args, **kwargs)
    return wrapper


def require_admin(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not user_authenticated(request):
            return response.not_allowed()
        if not has_admin_rights(request):
            return response.not_allowed()
        return f(request, *args, **kwargs)
    return wrapper
