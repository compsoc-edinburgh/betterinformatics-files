from django.conf import settings
from django.core.exceptions import PermissionDenied, SuspiciousOperation
from jwt import (
    InvalidTokenError,
    decode,
    DecodeError,
    InvalidSignatureError,
    ExpiredSignatureError,
    InvalidAlgorithmError,
)

from myauth.models import MyUser, Profile
from notifications.models import NotificationSetting, NotificationType
import logging

logger = logging.getLogger(__name__)


class NoUsernameException(Exception):
    def __init__(self, givenName, familyName, sub):
        super().__init__()
        self.givenName = givenName
        self.familyName = familyName
        self.sub = sub


def generate_unique_username(preferred_username):
    def exists(username):
        return MyUser.objects.filter(username=username).exists()

    if not exists(preferred_username):
        return preferred_username
    suffix = 0
    while exists(preferred_username + str(suffix)):
        suffix += 1
    return preferred_username + str(suffix)


def add_auth(request):
    request.user = None
    headers = request.headers
    request.simulate_nonadmin = "SimulateNonAdmin" in headers
    if "Authorization" in headers:
        auth = headers["Authorization"]
        if not auth.startswith("Bearer "):
            return None
        # auth.split(" ") is guaranteed to have at least two elements because
        # auth starts with "Bearer "
        encoded = auth.split(" ")[1]
        decoded = decode(
            encoded,
            settings.JWT_PUBLIC_KEY,
            verify=settings.JWT_VERIFY_SIGNATURE,
            algorithms=["RS256"],
        )
        request.decoded_token = decoded

        sub = decoded["sub"]
        if (
            not ("preferred_username" in decoded)
            or len(decoded["preferred_username"]) == 0
        ):
            raise NoUsernameException(
                decoded["given_name"], decoded["family_name"], sub
            )
        preferred_username = decoded["preferred_username"]
        roles = decoded["resource_access"][settings.JWT_RESOURCE_GROUP]["roles"]
        request.roles = roles

        try:
            user = MyUser.objects.get(profile__sub=sub)
            request.user = user
            changed = False

            if decoded["given_name"] != user.first_name:
                changed = True
                user.first_name = decoded["given_name"]

            if decoded["family_name"] != user.last_name:
                changed = True
                user.last_name = decoded["family_name"]

            if changed:
                user.save()
        except MyUser.DoesNotExist:
            user = MyUser()
            user.first_name = decoded["given_name"]
            user.last_name = decoded["family_name"]
            user.username = generate_unique_username(preferred_username)
            user.save()

            profile = Profile(user=user, sub=sub)
            profile.save()

            request.user = user

            for type_ in [
                NotificationType.NEW_COMMENT_TO_ANSWER,
                NotificationType.NEW_ANSWER_TO_ANSWER,
            ]:
                setting = NotificationSetting(user=user, type=type_.value)
                setting.save()
    return None


def AuthenticationMiddleware(get_response):
    def middleware(request):
        try:
            add_auth(request)
        except InvalidTokenError:
            raise PermissionDenied

        except DecodeError:
            raise PermissionDenied

        except InvalidSignatureError:
            raise SuspiciousOperation

        except ExpiredSignatureError:
            raise PermissionDenied

        except InvalidAlgorithmError:
            raise PermissionDenied

        except NoUsernameException as err:
            logger.warning(
                "received jwt without preferred_username set: givenName: %s, familyName: %s, sub: %s",
                err.givenName,
                err.familyName,
                err.sub,
            )
            raise PermissionDenied

        response = get_response(request)

        return response

    return middleware
