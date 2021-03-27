from io import BytesIO

from django.http.multipartparser import MultiPartParser


def parse_request_middleware(get_response):
    def middleware(request):
        if request.method == "PUT":
            try:
                parser = MultiPartParser(
                    request.META, BytesIO(request.body), request.upload_handlers
                )
                request.DATA, files = parser.parse()
                request.FILES.update(files)
            except Exception as e:
                import traceback

                traceback.print_exc()
        elif request.method == "POST":
            request.DATA = request.POST
        return get_response(request)

    return middleware
