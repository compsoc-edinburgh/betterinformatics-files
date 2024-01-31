import logging
from typing import Union
import urllib.request
import json

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http.request import HttpRequest
from jwcrypto.jwk import JWKSet
from jwcrypto.jwt import JWT, JWTMissingKey
from notifications.models import NotificationSetting, NotificationType
from util.func_cache import cache

from myauth.models import MyUser, Profile
from jwcrypto.jws import InvalidJWSObject, InvalidJWSOperation, InvalidJWSSignature
from datetime import datetime, timezone
from django.db import transaction

logger = logging.getLogger(__name__)


@cache(60)
def get_key_set():
    """Returns a `JWKSet` object that is populated using the keys at the `settings.OIDC_JWKS_URL`
    url. The returned object will be cached to prevent loading the jwks on every request.

    Returns:
        JWKSet: Cached JWK set
    """
    json_data = urllib.request.urlopen(settings.OIDC_JWKS_URL).read()
    key_set = JWKSet.from_json(json_data)

    return key_set


class NoUsernameException(Exception):
    def __init__(self, givenName, familyName, sub):
        super().__init__()
        self.givenName = givenName
        self.familyName = familyName
        self.sub = sub


class InvalidHomeOrganizationException(Exception):
    pass


def generate_unique_username(preferred_username):
    def exists(username):
        return MyUser.objects.filter(username=username).exists()

    if not exists(preferred_username):
        return preferred_username
    suffix = 0
    while exists(preferred_username + str(suffix)):
        suffix += 1
    return preferred_username + str(suffix)


def add_auth(request: HttpRequest):
    request.user = None
    headers = request.headers
    request.simulate_nonadmin = "SimulateNonAdmin" in headers

    encoded: Union[str, None] = None

    if "Authorization" in headers:
        auth = headers["Authorization"]
        if not auth.startswith("Bearer "):
            return None
        # auth.split(" ") is guaranteed to have at least two elements because
        # auth starts with "Bearer "
        encoded = auth.split(" ")[1]

    # Auth header takes preference over cookie
    if encoded is None and "access_token" in request.COOKIES:
        encoded = request.COOKIES["access_token"]

    if encoded is not None:

        token = JWT()
        key_set = get_key_set()
        # deserialize will raise an error if the encoded token is not valid / isn't signed correctly
        # it does however not validate any claims
        token.deserialize(encoded, key_set)
        claims = token.claims
        # claims can be a string - we ensure that it is a parsed json object here
        if type(claims) is str:
            claims = json.loads(claims)

        request.claims = claims

        now = datetime.now().replace(tzinfo=timezone.utc).timestamp()
        # Validate "nbf" (Not Before) Claim if present
        if "exp" in claims and claims["exp"] < now:
            raise PermissionDenied("Expired")
        # Valdiate "exp" (Expiration Time) Claim if present
        if "nbf" in claims and claims["nbf"] > now:
            raise PermissionDenied("Not before invalid")

        sub = claims["sub"]
        if (
            not ("preferred_username" in claims)
            or len(claims["preferred_username"]) == 0
        ):
            raise NoUsernameException(claims["given_name"], claims["family_name"], sub)
        preferred_username = claims["preferred_username"]
        if preferred_username in settings.BANNED_USERS:
            raise PermissionDenied("User is banned")
        home_organization = claims["home_organization"]
        if home_organization != "ethz.ch":
            raise InvalidHomeOrganizationException()
        roles = (
            claims["resource_access"][settings.JWT_RESOURCE_GROUP]["roles"]
            if "resource_access" in claims
            else []
        )
        if settings.IS_PREVIEW:
            roles = ["admin"]
        request.roles = roles

        with transaction.atomic():
            existing_user = MyUser.objects.filter(profile__sub=sub).first()
            if existing_user != None:
                request.user = existing_user
                changed = False

                if claims["given_name"] != existing_user.first_name:
                    changed = True
                    existing_user.first_name = claims["given_name"]

                if claims["family_name"] != existing_user.last_name:
                    changed = True
                    existing_user.last_name = claims["family_name"]

                if changed:
                    existing_user.save()
            else:
                old_existing_user = MyUser.objects.filter(
                    username=preferred_username
                ).first()
                if old_existing_user != None:
                    Profile.objects.create(user=old_existing_user, sub=sub)
                    request.user = old_existing_user

                else:

                    user = MyUser()
                    user.first_name = claims["given_name"]
                    user.last_name = claims["family_name"]
                    user.username = generate_unique_username(preferred_username)
                    user.save()

                    Profile.objects.create(user=user, sub=sub)

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
            logger.warning("invalid jws signature detected")

        except InvalidJWSObject:
            logger.warning("invalid jws object detected")

        except InvalidJWSOperation:
            logger.warning("invalid jws operation detected")

        except JWTMissingKey:
            logger.warning("jwt missing key detected")

        except InvalidHomeOrganizationException:
            logger.warning("invalid home organization detected")

        except NoUsernameException as err:
            logger.warning(
                "received jwt without preferred_username set: givenName: %s, familyName: %s, sub: %s",
                err.givenName,
                err.familyName,
                err.sub,
            )
            raise PermissionDenied("no username set")
        except PermissionDenied as err:
            logger.warning("permission denied: %s", err)
        except Exception:
            pass

        response = get_response(request)

        return response

    return middleware
