from django.db import models
from django.utils import timezone


class Payment(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    active = models.BooleanField(default=True)
    payment_time = models.DateTimeField(default=timezone.now)
    check_time = models.DateTimeField()
    refund_time = models.DateTimeField()
    uploaded_transcript = models.ForeignKey('answers.Exam', null=True, on_delete=models.SET_NULL)
