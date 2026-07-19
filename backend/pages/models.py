from django.utils import timezone
from django.db import models


class Page(models.Model):
    class Kind(models.TextChoices):
        GUIDE = "guide"
        STATIC_HTML = "static_html"

    title = models.CharField(max_length=256)
    slug = models.CharField(max_length=256, unique=True)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.GUIDE)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.SET_NULL,
        null=True,
        related_name="pages",
    )
    parents = models.ManyToManyField("self", symmetrical=False, related_name="children")
    created_at = models.DateTimeField(default=timezone.now)  # creation time
    edited_at = models.DateTimeField(default=timezone.now)  # last modified time
    content = models.TextField(default="")
    author = models.ForeignKey(
        "pages.PageAuthor", on_delete=models.CASCADE, related_name="authored_pages"
    )
    anonymised = models.BooleanField(
        default=False
    )  # To users not logged in, author will be hidden regardless of this choice

    # Related objects typehints
    revisions: models.QuerySet["PageRevision"]
    resources: models.QuerySet["Resource"]


class PageRevision(models.Model):
    page = models.ForeignKey("Page", on_delete=models.CASCADE, related_name="revisions")
    created_at = models.DateTimeField(default=timezone.now)  # edit time
    title_delta = models.TextField(default="")  # diff from before to after
    content_delta = models.TextField(default="")  # diff from before to after
    author = models.ForeignKey(
        "pages.PageAuthor", on_delete=models.CASCADE, related_name="authored_revisions"
    )


class PageAuthor(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True)
    temp_user = models.ForeignKey(
        "ediauth.TemporaryUser", on_delete=models.SET_NULL, null=True
    )
    is_anonymous = models.BooleanField(default=False)

    # Related objects typehints
    authored_pages: models.QuerySet["Page"]
    authored_revisions: models.QuerySet["PageRevision"]


class Resource(models.Model):
    class Kind(models.TextChoices):
        FILE = "file"

    page = models.ForeignKey("Page", on_delete=models.PROTECT, related_name="resources")
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.FILE)

    display_name = models.CharField(max_length=256)
    filename = models.CharField(max_length=256, unique=True)
    # Can be changed
    mime_type = models.CharField(max_length=256)
    order = models.IntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)  # upload time
