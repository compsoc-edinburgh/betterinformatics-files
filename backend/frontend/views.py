from util import response


def index(request):
    return response.send_file('index.html')


def favicon(request):
    return response.send_file('favicon.ico')


def manifest(request):
    return response.send_file('manifest.json')
