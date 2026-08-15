import logging

from django.db import connection
from django.views.decorators.csrf import csrf_exempt

from util import response


@response.request_get()
@csrf_exempt
def long_running_db_query(request):
    logging.info("Sending Wait request")
    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_sleep(15)")
    return response.success(value="DB Query Success")
