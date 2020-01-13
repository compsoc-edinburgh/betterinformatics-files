from util import response


def index(request):
    return response.send_file('index.html')
