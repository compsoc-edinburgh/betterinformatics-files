from util import response
from util import response
from django.views import View
from myauth import auth_check


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
