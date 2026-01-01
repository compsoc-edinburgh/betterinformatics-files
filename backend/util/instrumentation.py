import os

import pyroscope

from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from pyroscope.otel import PyroscopeSpanProcessor


def initialize():
    otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    pyroscope_endpoint = os.environ.get("PYROSCOPE_ENDPOINT")

    if otlp_endpoint:
        DjangoInstrumentor().instrument()

        resource = Resource.create(
            attributes={"service.name": "community-solutions-backend"}
        )

        trace.set_tracer_provider(TracerProvider(resource=resource))
        span_processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint))
        provider = trace.get_tracer_provider()
        provider.add_span_processor(span_processor)

        if pyroscope_endpoint:
            provider.add_span_processor(PyroscopeSpanProcessor())

        Psycopg2Instrumentor().instrument()

    if pyroscope_endpoint:
        pyroscope.configure(
            application_name="community-solutions-backend",
            server_address=pyroscope_endpoint,
        )
