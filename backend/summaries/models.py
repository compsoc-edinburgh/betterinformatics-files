from django.db import models
from django_prometheus.models import ExportModelOperationsMixin


class Summary(ExportModelOperationsMixin("summary"), models.Model):
    slug = models.CharField(max_length=256, unique=True)
    display_name = models.CharField(max_length=256)
    category = models.ForeignKey(
        "categories.Category", null=True, on_delete=models.SET_NULL
    )

    author = models.ForeignKey("auth.User", null=True, on_delete=models.SET_NULL)

    # Immutable, created when the summary is first uploaded
    filename = models.CharField(max_length=256, unique=True)
    # Can be changed
    mime_type = models.CharField(max_length=256)
