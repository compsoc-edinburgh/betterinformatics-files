from jwt import decode
import logging
from myauth.models import MyUser

# TODO: Read from env
public_key = b"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtP+L+6HuC6g/d6xJxjdSgTMYusm9HehmbfB/NKbjKPBVQ7ebnoMuvPDI8MMRsQS4/vx5bdkofxD1qresiCJukBFZoZ25r7/WyPLv09VgaHiwevO+Ygy7pb2aySO9ByDrWTfwj2mN4N80GyNXJbH452vYXNdETPmBpawEp5O4uRs08tqxMYq0C4mWSTnAWZazuijmfA0FXUi7juVUEqtqfJYGMWtj5nEOhjvv3u7uNpMPRjz/pk+Ffb+qQZ6PBymCx+jrBm1ThEtRAeSEauXlxHvsfsCEt8fAr1YUR9Xu/16VbA/phZ5gzSrv8D+wdFdEB4BqvI0PpR1TJHzvdD82JQIDAQAB\n-----END PUBLIC KEY-----"


def add_auth(request):
    request.simulate_nonadmin = False
    request.user = None
    headers = request.headers
    if "Authorization" in headers:
        auth = headers["Authorization"]
        if not auth.startswith("Bearer "):
            return None
        encoded = auth.split(" ")[1]
        # TODO: Disable verification when flag is enabled and the application is running locally
        decoded = decode(encoded, public_key)
        request.decoded_token = decoded

        username = decoded["preferred_username"]
        roles = decoded["resource_access"]["vis-community-solutions"]["roles"]
        request.roles = roles
        logging.info("roles: %s", roles)

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
        logging.info("request.user: %s", request.user)
        response = get_response(request)

        return response

    return middleware
