from functools import wraps
from django.shortcuts import get_object_or_404
from django.conf import settings

from util import response, func_cache

if settings.IN_ENVIRON:
    from myauth.people_auth import get_vis_groups


def check_api_key(request):
    api_key = request.headers.get('X-COMMUNITY-SOLUTIONS-API-KEY')
    return bool(api_key and api_key == settings.API_KEY)


def user_authenticated(request):
    if request.user.is_authenticated:
        return True
    if check_api_key(request):
        return True
    return False


def is_user_in_admin_group(user):
    vis_groups = get_vis_groups(user.username)
    return any(("vorstand" == group or "cat" == group or "luk" == group or "serviceaccounts" == group) for group in vis_groups)


def has_admin_rights(request):
    if check_api_key(request):
        return True
    if request.session['simulate_nonadmin']:
        return False
    return is_user_in_admin_group(request.user)


@func_cache.cache(60)
def _has_admin_rights_for_any_category(user):
    return user.category_admin_set.exists()


def has_admin_rights_for_any_category(request):
    if has_admin_rights(request):
        return True
    return _has_admin_rights_for_any_category(request.user)


@func_cache.cache(60)
def _has_admin_rights_for_category(user, category):
    return user.category_admin_set.filter(pk=category.pk).exists()


def has_admin_rights_for_category(request, category):
    if has_admin_rights(request):
        return True
    return _has_admin_rights_for_category(request.user, category)


def has_admin_rights_for_exam(request, exam):
    return has_admin_rights_for_category(request, exam.category)


def is_expert_for_category(request, category):
    return request.user.category_expert_set.filter(pk=category.pk).exists()


def is_expert_for_exam(request, exam):
    return is_expert_for_category(request, exam.category)


def require_login(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not user_authenticated(request):
            return response.not_allowed()
        return f(request, *args, **kwargs)
    return wrapper


def require_exam_admin(f):
    from answers.models import Exam
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not user_authenticated(request):
            return response.not_allowed()
        exam = get_object_or_404(Exam, filename=kwargs['filename'])
        if not has_admin_rights_for_exam(request, exam):
            return response.not_allowed()
        return f(request, exam=exam, *args, **kwargs)
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
