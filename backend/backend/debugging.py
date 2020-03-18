import logging
import time
from django.db import connection


def db_profiling_middleware(get_response):
    def middleware(request):
        start = time.time()
        response = get_response(request)
        end = time.time()
        logging.info('Request to %s took %s ms with %s queries.', request.get_full_path(), (end - start) * 1000, len(connection.queries))

        if len(connection.queries) > 100:
            for query in connection.queries[:20]:
                logging.info(query)

        return response
    return middleware
