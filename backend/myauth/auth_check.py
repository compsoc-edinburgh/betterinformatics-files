from functools import wraps
from django.conf import settings

from util import response


def check_api_key(request):
    api_key = request.headers.get('X-COMMUNITY-SOLUTIONS-API-KEY')
    return bool(api_key and api_key == settings.API_KEY)


def login_required(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        def allowed():
            if request.user.is_authenticated:
                return True
            if check_api_key(request):
                return True
        if not allowed():
            return response.not_allowed()
        return f(*args, **kwargs)
    return wrapper
