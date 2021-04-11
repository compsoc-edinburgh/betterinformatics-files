from django.utils import timezone
from django.db import models
from django_prometheus.models import ExportModelOperationsMixin
from myauth import auth_check
from util.models import CommentMixin


class Summary(ExportModelOperationsMixin("summary"), models.Model):
    slug = models.CharField(max_length=256, db_index=True)
    display_name = models.CharField(max_length=256)
    category = models.ForeignKey("categories.Category", on_delete=models.CASCADE)
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    likes = models.ManyToManyField("auth.User", related_name="liked_summaries")

    def current_user_can_delete(self, request):
        is_admin = auth_check.has_admin_rights_for_summary(request, self)
        is_owner = self.author.pk == request.user.pk
        return is_admin or is_owner

    def current_user_can_edit(self, request):
        is_owner = self.author.pk == request.user.pk
        return is_owner


class Comment(ExportModelOperationsMixin("summary_comment"), CommentMixin):
    summary = models.ForeignKey(
        "Summary", related_name="comments", on_delete=models.CASCADE
    )

    def current_user_can_delete(self, request):
        is_admin = auth_check.has_admin_rights_for_summary(request, self.summary)
        is_owner = self.author.pk == request.user.pk
        return is_admin or is_owner

    def current_user_can_edit(self, request):
        is_owner = self.author.pk == request.user.pk
        return is_owner


class SummaryFile(ExportModelOperationsMixin("summary_file"), models.Model):
    summary = models.ForeignKey(
        "Summary", related_name="files", on_delete=models.CASCADE
    )
    display_name = models.CharField(max_length=256)
    # Immutable, created when the summary is first uploaded
    filename = models.CharField(max_length=256, unique=True)
    # Can be changed
    mime_type = models.CharField(max_length=256)