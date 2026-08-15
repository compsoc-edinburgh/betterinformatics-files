import secrets

from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django_prometheus.models import ExportModelOperationsMixin

from ediauth import auth_check
from util.models import CommentMixin


def generate_api_key():
    return secrets.token_urlsafe(32)


class Document(ExportModelOperationsMixin("document"), models.Model):
    slug = models.CharField(max_length=256, unique=True)
    display_name = models.CharField(max_length=256)
    description = models.CharField(max_length=4096)
    category = models.ForeignKey("categories.Category", on_delete=models.CASCADE)
    document_type = models.ForeignKey(
        "DocumentType", on_delete=models.PROTECT, related_name="type_set"
    )
    time = models.DateTimeField(default=timezone.now, null=True)  # creation time
    edittime = models.DateTimeField(
        default=timezone.now, null=True
    )  # last modified time
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    likes = models.ManyToManyField("auth.User", related_name="liked_documents")
    anonymised = models.BooleanField(default=False)
    api_key = models.CharField(max_length=1024, default=generate_api_key)
    pending_transfer_user = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="pending_document_transfer_receive_requests",
    )

    def current_user_can_delete(self, request):
        is_admin = auth_check.has_admin_rights_for_document(request, self)
        is_owner = self.author.pk == request.user.pk
        return is_admin or is_owner

    def current_user_can_edit(self, request):
        return self.current_user_can_delete(request)

    def current_user_can_accept_transfer(self, request):
        if not self.pending_transfer_user:
            return False

        is_admin = auth_check.has_admin_rights_for_document(request, self)
        is_transferee = self.pending_transfer_user.pk == request.user.pk
        return is_admin or is_transferee

    def recompute_slug(self):
        oslug = slugify(self.display_name)

        def exists(aslug):
            objects = Document.objects.filter(slug=aslug)
            if self.pk is not None:
                objects = objects.exclude(pk=self.pk)
            return objects.exists()

        slug = oslug
        cnt = 1
        while exists(slug):
            slug = f"{oslug}-{cnt}"
            cnt += 1

        self.slug = slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.recompute_slug()

        super().save(*args, **kwargs)


class DocumentType(models.Model):
    display_name = models.CharField(max_length=256)
    order = models.IntegerField(default=0)


class Comment(ExportModelOperationsMixin("document_comment"), CommentMixin):
    document = models.ForeignKey(
        "Document", related_name="comments", on_delete=models.CASCADE
    )

    def current_user_can_delete(self, request):
        is_admin = auth_check.has_admin_rights_for_document(request, self.document)
        is_owner = self.author.pk == request.user.pk
        return is_admin or is_owner

    def current_user_can_edit(self, request):
        is_owner = self.author.pk == request.user.pk
        return is_owner


class DocumentFile(ExportModelOperationsMixin("document_file"), models.Model):
    document = models.ForeignKey(
        "Document", related_name="files", on_delete=models.CASCADE
    )
    display_name = models.CharField(max_length=256)
    # Immutable, created when the document is first uploaded
    filename = models.CharField(max_length=256, unique=True)
    # Can be changed
    mime_type = models.CharField(max_length=256)
    order = models.IntegerField(default=0)
