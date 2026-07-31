import json
from pathlib import Path

from django.core.management.base import BaseCommand

from backend.urls import api


class Command(BaseCommand):
    help = "Exports the OpenAPI schema to a JSON file for Orval"

    def handle(self, *args, **options):
        schema = api.get_openapi_schema()
        static_directory = Path(__file__).parents[3] / "static"
        out_path = static_directory / "openapi.json"

        static_directory.mkdir(exist_ok=True)

        with out_path.open("w") as f:
            json.dump(schema, f, indent=2)

        self.stdout.write(self.style.SUCCESS(f"Successfully exported {out_path}"))
