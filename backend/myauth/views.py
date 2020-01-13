from util import response
from django.contrib.auth import authenticate, login, logout


def login_view(request):
    username = request.POST.get('username', '').lower()
    password = request.POST.get('password')
    if not username or not password:
        return response.not_possible('Missing arguments')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        request.session['simulate_nonadmin'] = request.POST.get('simulate_nonadmin', '')[:1]
        return response.success()
    else:
        return response.not_allowed()


def logout_view(request):
    logout(request)
    return response.success()
