import logging
import jwt

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.http.request import HttpRequest
from django.contrib.auth.models import User
from notifications.models import NotificationSetting, NotificationType
from ediauth.models import Profile

logger = logging.getLogger(__name__)


def add_auth_to_request(request: HttpRequest):
    request.user = None  # type: ignore
    headers = request.headers
    request.simulate_nonadmin = "SimulateNonAdmin" in headers  # type: ignore

    try:
        jwt_claims = jwt.decode(
            request.COOKIES["access_token"],
            settings.JWT_PUBLIC_KEY,
            algorithms=["RS256"],
        )
    except (
        jwt.ExpiredSignatureError,
        jwt.InvalidSignatureError,
        jwt.InvalidTokenError,
    ):
        # For these errors, don't let the user know of the exact reason, because
        # it could just be that the user's session expired.
        return None

    if "uun" not in jwt_claims or "email" not in jwt_claims:
        return None

    # Check if the UUN claimed in the token is banned
    if jwt_claims["uun"] in settings.COMSOL_AUTH_BANNED_USERS:
        # make it explicit that the user is banned (don't just pretend
        # they're not logged in)
        raise PermissionDenied("User is banned")

    # Add admin role if it's a preview deployment or if the user is an admin
    if settings.IS_PREVIEW or jwt_claims.get("admin", False):
        request.roles = ["admin"]  # type: ignore

    with transaction.atomic():
        # Try finding an existing user with the given UUN, or create a new one.
        # get_or_create is better than filter().first() followed by .save()
        # because it handles concurrency properly and avoids duplicate entries
        # during race conditions.
        (user, created) = User.objects.get_or_create(
            username=jwt_claims["uun"], email=jwt_claims["email"]
        )
        if not created:
            request.user = user
        else:
            # Create a one-to-one profile storing app-specific data (since the
            # User model is from Django). From now, we can get the preferred
            # username from a User by doing `user.profile.display_username`.
            Profile.objects.create(user=user, display_username=jwt_claims["uun"])

            request.user = user

            for type_ in [
                NotificationType.NEW_COMMENT_TO_ANSWER,
                NotificationType.NEW_ANSWER_TO_ANSWER,
            ]:
                setting = NotificationSetting(user=user, type=type_.value)
                setting.save()


def AuthenticationMiddleware(get_response):
    def middleware(request):
        try:
            add_auth_to_request(request)
        except PermissionDenied as err:
            logger.warning("permission denied: %s", err)
            raise err
        except Exception as err:
            pass

        response = get_response(request)

        return response

    return middleware
