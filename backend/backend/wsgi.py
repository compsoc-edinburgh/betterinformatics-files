"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application
from gevent.monkey import is_module_patched

# When running under gevent (and therefore under Gunicorn with `--worker-class gevent`),
# we should patch psycopg to ensure correctness.
# This must be disabled when not using gevent (e.g. Django's runserver
# command) to avoid file descriptor leakage.
# Django runs each request in an unbounded amount of thread and gevent opens
# a new epoll per thread if this patch is (incorrectly) applied, which leads to leakage.
# To distinguish these two scenarios, we can use the fact that Gunicorn
# calls gevent.monkey.patch_all() on init, and check if stdlib modules are
# patched at this point.
if is_module_patched("socket"):
    from psycogreen.gevent import patch_psycopg

    patch_psycopg()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

application = get_wsgi_application()
