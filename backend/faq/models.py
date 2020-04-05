from django.db import models


class FAQuestion(models.Model):
    question = models.TextField()
    answer = models.TextField()
    order = models.IntegerField()
