from functools import wraps

from django.conf import settings
from django.shortcuts import get_object_or_404

from util import func_cache, response

from ediauth.models import TemporaryUser


def check_api_key(request):
    api_key = request.headers.get("X-COMMUNITY-SOLUTIONS-API-KEY")
    return bool(api_key and api_key == settings.API_KEY)


# Wrapper for declaring that a view supports temporary user.
def supports_temp_user(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        temp_session_id = request.COOKIES.get("temp_session_id")

        if request.user:
            # If authenticated, remove temp session if it exists
            request.temp_user = None
            response = f(request, *args, **kwargs)
            response.delete_cookie("temp_session_id")
            return response

        try:
            if temp_session_id:
                temp_user = TemporaryUser.objects.get(session_id=temp_session_id)
                request.temp_user = temp_user
                return f(request, *args, **kwargs)
        finally:
            # If temporary session couldn't be found or wasn't given, create new
            temp_user = TemporaryUser.objects.create()
            request.temp_user = temp_user
            response = f(request, *args, **kwargs)
            response.set_cookie(
                "temp_session_id",
                str(temp_user.session_id),
                httponly=True,
                samesite="Lax",
            )
            return response

    return wrapper


def user_authenticated(request):
    if request.user is not None:
        return True
    if check_api_key(request):
        return True
    return False


def has_admin_rights(request):
    if check_api_key(request):
        return True
    if getattr(request, "simulate_nonadmin", False):
        return False
    return "admin" in getattr(request, "roles", [])


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


def has_admin_rights_for_document(request, document):
    return has_admin_rights_for_category(request, document.category)


def is_expert_for_category(request, category):
    return request.user.category_expert_set.filter(pk=category.pk).exists()


def is_expert_for_exam(request, exam):
    return is_expert_for_category(request, exam.category)


def _is_class_method(f):
    """
    Checks whether the function f is a class method
    (and thus the first argument has to be the object on which the method was called).
    This allows us to define a decorator which can decorate both normal functions and class methods.
    To do this, we check the name of the first argument. If it is self, f is a class method.
    This assumes that the naming conventions are followed. In particular, all class methods need a first
    argument called self and all other functions are not allowed to have an argument called self.
    :param f: The function to check.
    :return: True if the function is probably a class method.
    """
    return f.__code__.co_varnames[0] == "self"


def require_login(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not user_authenticated(request):
            return response.unauthorized()
        return f(request, *args, **kwargs)

    @wraps(f)
    def wrapper_class(self, request, *args, **kwargs):
        if not user_authenticated(request):
            return response.unauthorized()
        return f(self, request, *args, **kwargs)

    return wrapper_class if _is_class_method(f) else wrapper


def require_exam_admin(f):
    from answers.models import Exam

    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not user_authenticated(request):
            return response.unauthorized()
        exam = get_object_or_404(Exam, filename=kwargs["filename"])
        if not has_admin_rights_for_exam(request, exam):
            return response.not_allowed()
        return f(request, *args, exam=exam, **kwargs)

    return wrapper


def require_admin(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not user_authenticated(request):
            return response.unauthorized()
        if not has_admin_rights(request):
            return response.not_allowed()
        return f(request, *args, **kwargs)

    @wraps(f)
    def wrapper_class(self, request, *args, **kwargs):
        if not user_authenticated(request):
            return response.unauthorized()
        if not has_admin_rights(request):
            return response.not_allowed()
        return f(self, request, *args, **kwargs)

    return wrapper_class if _is_class_method(f) else wrapper
