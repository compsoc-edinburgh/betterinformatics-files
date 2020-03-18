from util import response


def handler400(request, exception):
    return response.not_possible('Not possible')


def handler403(request, exception):
    return response.not_allowed()


def handler404(request, exception):
    return response.not_found()


def handler500(request):
    return response.internal_error()
