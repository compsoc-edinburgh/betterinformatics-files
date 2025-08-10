#!/usr/bin/env python3
"""Django's command-line utility for administrative tasks."""

import os
import sys

from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


import logging

# Enable debug logging for OpenTelemetry
logging.getLogger("opentelemetry").setLevel(logging.DEBUG)
logging.basicConfig(level=logging.DEBUG)


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

    otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        DjangoInstrumentor().instrument()

        resource = Resource.create(attributes={"service.name": "api-service"})

        trace.set_tracer_provider(TracerProvider(resource=resource))
        span_processor = BatchSpanProcessor(
            OTLPSpanExporter(endpoint="http://alloy:4317")
        )  # otlp_endpoint))
        trace.get_tracer_provider().add_span_processor(span_processor)
        Psycopg2Instrumentor().instrument()

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
