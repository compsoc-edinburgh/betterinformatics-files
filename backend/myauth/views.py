from util import response
from django.contrib.auth import authenticate, login, logout
from util import response
from myauth import auth_check


@response.args_post()
def login_view(request):
    username = request.POST.get('username', '').lower()
    password = request.POST.get('password')
    if not username or not password:
        return response.missing_argument()
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        request.session['simulate_nonadmin'] = request.POST.get('simulate_nonadmin', 'false') != 'false'
        return response.success()
    else:
        return response.not_allowed()


@response.args_post()
def logout_view(request):
    logout(request)
    return response.success()


def me_view(request):
    if request.user.is_authenticated:
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
            username='',
            displayname='Not Authorized',
        )
