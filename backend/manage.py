#!/usr/bin/env python3
"""Django's command-line utility for administrative tasks."""

import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

    # Only import instrumentation if we have pyroscope installed.
    # Pyroscope is not available on Windows, so this workaround is necessary
    # to be able to develop ComSol on Windows.
    try:
        from util import instrumentation  # type: ignore

        instrumentation.initialize()
    except ImportError:
        pass

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc    
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
