import datetime
import random
import jwt
import typing

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.http import HttpRequest
from django.http.response import HttpResponseRedirect, JsonResponse
from email_validator import EmailNotValidError, validate_email
from ipware import IpWare

import ediauth.auth_check as auth_check
from ediauth.models import VerificationCode
from util import response

ipw = IpWare()


@response.request_get()
def me_view(request: HttpRequest) -> JsonResponse:
    if request.user != None:
        # There is a user logged in
        return response.success(
            loggedin=True,
            adminrights=auth_check.has_admin_rights(request),
            adminrightscat=auth_check.has_admin_rights_for_any_category(request),
            username=request.user.username,
            displayname=request.user.profile.display_username,
        )
    else:
        # No user logged in
        return response.success(
            loggedin=False,
            adminrights=False,
            adminrightscat=False,
            username="",
            displayname="Not Authorized",
        )


@response.request_post()
def login(request: HttpRequest):
    uun = request.POST.get("uun", "")
    try:
        email_info = validate_email(uun + "@ed.ac.uk", check_deliverability=True)
        email = email_info.normalized
    except EmailNotValidError as e:
        return response.not_possible(str(e))

    if email_info.domain not in settings.COMSOL_AUTH_ACCEPTED_DOMAINS:
        return JsonResponse({"err": "The email domain is not accepted"}, status=403)

    # Check if there is a verification code for this UUN that is not expired,
    # if there is, return that code instead of generating a new one.
    try:
        codeRow = VerificationCode.objects.get(
            uun=uun,
            created_at__gt=datetime.datetime.now(datetime.timezone.utc)
            - datetime.timedelta(hours=1),
        )
    except VerificationCode.DoesNotExist:
        newCode = "".join(map(str, random.choices(range(0, 10), k=6)))

        codeRow = VerificationCode(uun=uun, code=newCode)
        codeRow.save()

    ip, _ = ipw.get_client_ip(request.META)

    send_mail(
        "Your Verification Code for CompSoc BI Exam Collection",
        (
            f"Thank you for using CompSoc BetterInformatics. \n\n"
            f"There is a new sign-in request from IP: "
            f"{ip.exploded if ip else 'unknown'} to access the "
            f"BetterInformatics Exam Collection (exams.betterinformatics.com).\n\n"
            f"If this is you, please confirm your identity using the following "
            f"verification code when prompted:\n\n{codeRow.code}\n\n"
            f"If you did not request this verification, please ignore this email.\n"
            f"If you notice suspicious behaviour, please contact us at "
            f"admin@betterinformatics.com"
        ),
        "yuto@comp-soc.com",
        [email],
        fail_silently=False,
    )

    return response.success()


@response.request_post()
def verify(request: HttpRequest):
    # TODO: Add rate-limiting or something to prevent brute-force attacks.

    uun = request.POST.get("uun", "")
    code = request.POST.get("code", "")

    try:
        codeRow = VerificationCode.objects.get(
            uun=uun,
            created_at__gt=datetime.datetime.now(datetime.timezone.utc)
            - datetime.timedelta(hours=1),
        )

        if codeRow.code != code:
            return JsonResponse({"err": "Incorrect code."}, status=401)

    except VerificationCode.DoesNotExist:
        return response.not_allowed()

    # Make the code one-time-use
    codeRow.delete()

    # Create a JWT token with the user's UUN and email address -- this is signed
    # with the server's private key to prevent tampering.
    jwt_claims = {
        "uun": uun,
        "email": uun + "@ed.ac.uk",
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(weeks=4),
        "admin": uun in settings.COMSOL_AUTH_ADMIN_UUNS,
    }

    token = jwt.encode(
        jwt_claims,
        settings.JWT_PRIVATE_KEY,
        algorithm="RS256",
    )

    success_response = JsonResponse(data={})
    success_response.set_cookie(
        "access_token",
        token,
        httponly=True,
        samesite="Strict",
        secure=settings.SECURE,
    )
    return success_response


@response.request_get()
def logout(request: HttpRequest):
    redirect_url = request.GET.get("rd", "/")
    response = HttpResponseRedirect(redirect_url)
    response.delete_cookie("access_token")
    return response
