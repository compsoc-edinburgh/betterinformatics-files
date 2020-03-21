from django.db import models


class Attachment(models.Model):
    displayname = models.CharField(max_length=256)
    filename = models.CharField(max_length=256, unique=True)
    exam = models.ForeignKey('answers.Exam', null=True, on_delete=models.SET_NULL)
    category = models.ForeignKey('categories.Category', null=True, on_delete=models.SET_NULL)
