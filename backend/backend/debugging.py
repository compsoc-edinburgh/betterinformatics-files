import logging
import time

from django.conf import settings
from django.db import connection


def db_profiling_middleware(get_response):
    def middleware(request):
        start = time.time()
        response = get_response(request)
        end = time.time()
        if request.get_full_path() != '/health/':
            logging.info('Request to %s took %s ms with %s queries.', request.get_full_path(), (end - start) * 1000, len(connection.queries))

            if settings.DEBUG:
                if len(connection.queries) > 20:
                    for query in connection.queries[:20]:
                        logging.info(query)

        return response
    return middleware
