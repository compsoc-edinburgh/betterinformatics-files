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
    flagged = models.ManyToManyField(
        'auth.User', related_name="flagged_%(app_label)s_comments_set")

    search_vector = SearchVectorField()

    class Meta:
        indexes = [GinIndex(fields=["search_vector"])]
        abstract = True
