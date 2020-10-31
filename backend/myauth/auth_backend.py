import logging
import urllib.request
import json

from django.conf import settings
from django.core.exceptions import PermissionDenied
from jwcrypto.jwk import JWKSet
from jwcrypto.jwt import JWT, JWTMissingKey
from notifications.models import NotificationSetting, NotificationType
from util.func_cache import cache

from myauth.models import MyUser, Profile
from jwcrypto.jws import InvalidJWSObject, InvalidJWSOperation, InvalidJWSSignature

logger = logging.getLogger(__name__)


@cache(60)
def get_key_set():
    json_data = urllib.request.urlopen(settings.OIDC_JWKS_URL).read()
    key_set = JWKSet.from_json(json_data)

    return key_set


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

        token = JWT()
        key_set = get_key_set()
        token.deserialize(encoded, key_set)
        claims = token.claims
        if type(claims) is str:
            claims = json.loads(claims)

        request.claims = claims

        sub = claims["sub"]
        if (
            not ("preferred_username" in claims)
            or len(claims["preferred_username"]) == 0
        ):
            raise NoUsernameException(claims["given_name"], claims["family_name"], sub)
        preferred_username = claims["preferred_username"]
        roles = claims["resource_access"][settings.JWT_RESOURCE_GROUP]["roles"]
        request.roles = roles

        try:
            user = MyUser.objects.get(profile__sub=sub)
            request.user = user
            changed = False

            if claims["given_name"] != user.first_name:
                changed = True
                user.first_name = claims["given_name"]

            if claims["family_name"] != user.last_name:
                changed = True
                user.last_name = claims["family_name"]

            if changed:
                user.save()
        except MyUser.DoesNotExist:
            user = MyUser()
            user.first_name = claims["given_name"]
            user.last_name = claims["family_name"]
            user.username = generate_unique_username(preferred_username)
            user.save()

            profile = Profile.objects.create(user=user, sub=sub)

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
        except InvalidJWSSignature:
            raise PermissionDenied

        except InvalidJWSObject:
            raise PermissionDenied

        except InvalidJWSOperation:
            raise PermissionDenied

        except JWTMissingKey:
            raise PermissionDenied

        except ValueError:
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
