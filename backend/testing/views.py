from util import response
from django.db import connection
import logging
from django.views.decorators.csrf import csrf_exempt

@response.request_get()
@csrf_exempt
def long_running_db_query(request):
    logging.info("Sending Wait request")
    with connection.cursor() as cursor:
        cursor.execute('SELECT pg_sleep(15)')
    return response.success(value='DB Query Success')
