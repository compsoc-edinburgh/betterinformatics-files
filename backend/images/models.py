from django.db import models


class Image(models.Model):
    filename = models.CharField(max_length=256)
    owner = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    displayname = models.CharField(max_length=256)
