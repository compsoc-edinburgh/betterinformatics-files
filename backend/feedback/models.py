from django.db import models
from django.utils import timezone


class Feedback(models.Model):
    text = models.TextField()
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    time = models.DateTimeField(default=timezone.now)
    read = models.BooleanField(default=False)
    done = models.BooleanField(default=False)
    reply = models.TextField(blank=True, default="")
    reply_time = models.DateTimeField(null=True, blank=True)
