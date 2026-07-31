from datetime import datetime as dt
from datetime import timedelta as delta

from django.contrib.auth.models import User
from django.utils import timezone


def last_user_activity_middleware(get_response):
    KEY = "last-activity"

    def middleware(request):
        if request.user:
            if request.user.is_authenticated:
                if request.session.has_key(KEY):
                    last_activity = dt.fromisoformat(request.session[KEY])
                else:
                    last_activity = None

                # If key is old enough, update database.
                too_old_time = timezone.now() - delta(seconds=3600)
                if not last_activity or last_activity < too_old_time:
                    User.objects.filter(id=request.user.id).update(
                        last_login=timezone.now()
                    )

                request.session[KEY] = timezone.now().isoformat()

        response = get_response(request)

        return response

    return middleware


def parse_request_middleware(get_response):
    def middleware(request):
        if request.method in ("POST", "PUT", "PATCH"):
            # For PUT/PATCH, request.POST is populated by django-ninja because
            # fix_request_files_middleware runs before this middleware
            request.DATA = request.POST
        return get_response(request)

    return middleware
