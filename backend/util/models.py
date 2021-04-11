from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.utils import timezone


class CommentMixin(models.Model):
    author = models.ForeignKey(
        "auth.User", related_name="%(app_label)s_comments", on_delete=models.CASCADE
    )
    text = models.TextField()
    time = models.DateTimeField(default=timezone.now)
    edittime = models.DateTimeField(default=timezone.now)

    search_vector = SearchVectorField()

    class Meta:
        indexes = [GinIndex(fields=["search_vector"])]
        abstract = True
