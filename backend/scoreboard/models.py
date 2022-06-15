from django.db import models


class UserScore(models.Model):
    user = models.OneToOneField(
        "auth.User", related_name="scores", on_delete=models.DO_NOTHING
    )
    upvotes = models.IntegerField()
    downvotes = models.IntegerField()
    document_likes = models.IntegerField()

    class Meta:
        managed = False
