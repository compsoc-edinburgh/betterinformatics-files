from django.db import models


class Feedback(models.Model):
    text = models.TextField()
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    time = models.DateTimeField()
    read = models.BooleanField()
    done = models.BooleanField()
