from django.db import models


class Scoreboard(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    score_legacy = models.IntegerField()
