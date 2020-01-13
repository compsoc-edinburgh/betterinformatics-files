from util import response

def health(request):
    return "Server is running"

def favicon(request):
    return response.send_file('favicon.ico')
