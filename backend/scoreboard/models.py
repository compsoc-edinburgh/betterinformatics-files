from django.db import models


class Scoreboard(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE)
    score_legacy = models.IntegerField(default=0)
