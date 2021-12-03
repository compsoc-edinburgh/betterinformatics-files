import datetime
from base64 import b64decode, b64encode, urlsafe_b64encode
from secrets import token_bytes
from urllib.parse import urlencode
from hashlib import sha256
import logging

import requests
from django.conf import settings
from django.http import HttpRequest
from django.http.response import (
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseNotAllowed,
)
from util import response
from myauth import auth_check
from django.utils.http import url_has_allowed_host_and_scheme

logger = logging.getLogger(__name__)

# Whether the id_token should be stored as a cookie
user_id_token = False


@response.request_get()
def me_view(request):
    if request.user != None:
        return response.success(
            loggedin=True,
            adminrights=auth_check.has_admin_rights(request),
            adminrightscat=auth_check.has_admin_rights_for_any_category(request),
            username=request.user.username,
            displayname=request.user.displayname(),
        )
    else:
        return response.success(
            loggedin=False,
            adminrights=False,
            adminrightscat=False,
            username="",
            displayname="Not Authorized",
        )


def redirect_url_from_host(host: str):
    return ("http://" if settings.DEBUG else "https://") + host + "/api/auth/callback"


# https://gist.github.com/cameronmaske/f520903ade824e4c30ab
def base64url_encode(data: bytes):
    """
    Removes any `=` used as padding from the encoded string.
    """
    encoded = str(urlsafe_b64encode(data), "utf-8")
    return encoded.rstrip("=")


state_delimeter = ":"

# We encode our state params as b64(nonce):rd_url
def encode_state(nonce: bytes, redirect_url: str):
    return str(b64encode(nonce), "utf-8") + state_delimeter + redirect_url


# Decode callback state into nonce and rd_url
def decode_state(state: str):
    parts = state.split(state_delimeter)
    if len(parts) != 2:
        raise ValueError("invalid state format")
    nonce = b64decode(bytes(parts[0], "utf-8"))
    redirect_url = parts[1]
    return nonce, redirect_url


def compute_hash(value: bytes):
    m = sha256()
    m.update(value)
    return base64url_encode(m.digest())


def login(request: HttpRequest):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    # The url we redirect to after successful authentication
    redirect_url = request.GET.get("rd", "/")
    scope = request.GET.get("scope", "profile")
    # Check whether the redirect url is allowed: Only allow redirects to the same application
    if not url_has_allowed_host_and_scheme(
        redirect_url, settings.REAL_ALLOWED_HOSTS, settings.SECURE
    ):
        return HttpResponseBadRequest("invalid redirect url")
    scope = request.GET.get("scope", "")

    # We generate a random nonce and store it encrypted as a httpOnly cookie
    # In the callback endpoint. we then check whether it matches the state we get
    # from the server to prevent CSRF attacks
    nonce = token_bytes(32)

    state = encode_state(nonce, redirect_url)
    query_params = {
        "response_type": "code",
        "client_id": settings.OAUTH2_CLIENT_ID,
        "redirect_uri": redirect_url_from_host(request.get_host()),
        "scope": scope,
        "state": state,
    }

    # We only need to store the nonce in the cookie, we can trust the AP to correctly
    # give us the redirect_url once we verified the nonce
    nonce_cookie = compute_hash(nonce)

    # The base URL of our redirect
    url = settings.OAUTH2_AUTH_URL

    response = HttpResponse()
    response.status_code = 302
    # We need the nonce in a request which comes back from the AP - thus we have to
    # use sameSite=Lax to have the cookie included in that request
    # httponly doesn't really matter - this is only used by us (RP) to verify that the callback
    # comes from our chosen OP
    response.set_cookie("nonce", nonce_cookie, httponly=True, samesite="Lax")
    response.headers["Location"] = url + "?" + urlencode(query_params)

    return response


# set_token_cookies extracts the tokens from token_response and saves them
# in cookies
def set_token_cookies(response: HttpResponse, token_response):
    token_type: str = token_response["token_type"]

    if token_type.lower() != "bearer":
        return ValueError("OP returned unexpected token_type")

    # Extract expiration time without decoding the token - this is only used by the
    # client and thus isn't relevant for security
    if "expires_in" in token_response:
        expires_in: str = token_response["expires_in"]
        now = datetime.datetime.now()
        expires = now + datetime.timedelta(seconds=expires_in)
        response.set_cookie(
            "token_expires", expires.timestamp(), httponly=False, samesite="Lax"
        )

    access_token = token_response["access_token"]
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        samesite="Strict",
        secure=settings.SECURE,
    )

    # Per OAuth2 spec a refresh response doesn't necessarily include a new refresh_token
    # If that is not the case we assume the refresh_token is still valid.
    if "refresh_token" in token_response:
        refresh_token: str = token_response["refresh_token"]
        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            samesite="Strict",
            secure=settings.SECURE,
        )

    # id_tokens aren't necessarily refreshed, thus we check that here and leave it as is
    # if it already exists
    if user_id_token and "id_token" in token_response:
        id_token: str = token_response["id_token"]
        response.set_cookie(
            "id_token", id_token, httponly=True, samesite="Lax", secure=settings.SECURE
        )


def callback(request: HttpRequest):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    code = request.GET.get("code")
    state = request.GET.get("state")
    nonce_cookie = request.COOKIES.get("nonce")
    # Check whether all relevant parameters exist
    if code is None or state is None or nonce_cookie is None:
        return HttpResponseBadRequest("code, state or nonce cookie not provided")

    # Reverse encoding, check validity of nonce
    query_nonce, redirect_url = decode_state(state)
    query_nonce_hash = compute_hash(query_nonce)
    if nonce_cookie != query_nonce_hash:
        return HttpResponseBadRequest("nonce didn't match")

    # Use the code + client_secret to get our tokens
    r = requests.post(
        settings.OAUTH2_TOKEN_URL,
        data={
            "client_id": settings.OAUTH2_CLIENT_ID,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_url_from_host(request.get_host()),
            "client_secret": settings.OAUTH2_CLIENT_SECRET,
        },
        headers={"Accept": "application/json"},
    )

    res = r.json()

    if "error" in res:
        logger.error("Unable to request token: %s", res["error"])
        response = HttpResponse()
        response.status_code = 500
        response.content = res["error"]
        return

    response = HttpResponse()
    response.status_code = 302
    set_token_cookies(response, res)
    response.delete_cookie("nonce")

    # redirect back to the location that was used in login
    response.headers["Location"] = redirect_url

    return response


def refresh(request: HttpRequest):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    refresh_token = request.COOKIES.get("refresh_token")
    scope = request.GET.get("scope", "")
    if refresh_token is None:
        return HttpResponseBadRequest("refresh_token not found")

    # Get new tokens
    r = requests.post(
        settings.OAUTH2_TOKEN_URL,
        data={
            "client_id": settings.OAUTH2_CLIENT_ID,
            "client_secret": settings.OAUTH2_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
            "scope": scope,
        },
        headers={"Accept": "application/json"},
    )
    # A non 200 status code implies that the request was not successful
    if r.status_code != 200:
        response = HttpResponse("refresh failed")
        response.status_code = 403
        return response

    res = r.json()

    if "error" in res:
        logger.error("Unable to request token: %s", res["error"])
        response = HttpResponse()
        response.status_code = 500
        response.content = res["error"]
        return

    response = HttpResponse()
    set_token_cookies(response, res)
    return response


def logout(request: HttpRequest):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    redirect_url = request.GET.get("rd", "/")
    # Check whether the redirect url is allowed: Only allow redirects to the same application
    if not url_has_allowed_host_and_scheme(
        redirect_url, settings.REAL_ALLOWED_HOSTS, settings.SECURE
    ):
        return HttpResponseBadRequest("invalid redirect url")

    response = HttpResponse()
    response.status_code = 302

    response.delete_cookie("id_token")
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    response.delete_cookie("token_expires")

    # redirect back to the location that was used in login
    response.headers["Location"] = redirect_url

    return response
