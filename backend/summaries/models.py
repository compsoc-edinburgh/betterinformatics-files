from django.db import models
from django_prometheus.models import ExportModelOperationsMixin
from myauth import auth_check


class Summary(ExportModelOperationsMixin("summary"), models.Model):
    slug = models.CharField(max_length=256, unique=True)
    display_name = models.CharField(max_length=256)
    category = models.ForeignKey("categories.Category", on_delete=models.CASCADE)
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE)

    # Immutable, created when the summary is first uploaded
    filename = models.CharField(max_length=256, unique=True)
    # Can be changed
    mime_type = models.CharField(max_length=256)

    def current_user_can_delete(self, request):
        is_admin = auth_check.has_admin_rights_for_exam(request, self)
        if is_admin:
            return True
        if self.author.pk == request.user.pk:
            return True
        return False

    def current_user_can_edit(self, request):
        return self.author.pk == request.user.pk