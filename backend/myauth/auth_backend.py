from jwt import decode
import logging
from myauth.models import MyUser
from django.conf import settings


def add_auth(request):
    request.user = None
    headers = request.headers
    request.simulate_nonadmin = "Simulatenonadmin" in headers
    if "Authorization" in headers:
        auth = headers["Authorization"]
        if not auth.startswith("Bearer "):
            return None
        encoded = auth.split(" ")[1]
        decoded = decode(
            encoded, settings.JWT_PUBLIC_KEY, verify=settings.JWT_VERIFY_SIGNATURE
        )
        request.decoded_token = decoded

        username = decoded["preferred_username"]
        roles = decoded["resource_access"][settings.JWT_RESOURCE_GROUP]["roles"]
        request.roles = roles

        try:
            user = MyUser.objects.get(username=username)
            request.user = user
        except MyUser.DoesNotExist:
            user = MyUser(username=username)
            user.first_name = decoded["given_name"]
            user.last_name = decoded["family_name"]
            user.save()
            request.user = user
    return None


def AuthenticationMiddleware(get_response):
    def middleware(request):
        # TODO: Add error checks
        add_auth(request)
        response = get_response(request)

        return response

    return middleware
