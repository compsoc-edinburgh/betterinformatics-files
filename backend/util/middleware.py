from datetime import timedelta as delta
from datetime import datetime as dt
from django.utils import timezone
from django.contrib.auth.models import User
from io import BytesIO

from django.http.multipartparser import MultiPartParser


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
        if request.method == "PUT" or request.method == "PATCH":
            try:
                # Request.POST and FILES has been populated by Django Ninja's
                # middleware to behave like normal POST requests:
                # https://github.com/vitalik/django-ninja/blob/master/ninja/compatibility/files.py
                #
                # We copy these data into .DATA so that non-Ninja views can
                # access them in the same way too.
                request.DATA = request.POST
            except Exception as e:
                import traceback

                traceback.print_exc()
        elif request.method == "POST":
            request.DATA = request.POST
        return get_response(request)

    return middleware
