from django.db import models


class Payment(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    active = models.BooleanField()
    payment_time = models.DateTimeField()
    check_time = models.DateTimeField()
    refund_time = models.DateTimeField()
    uploaded_transcript = models.ForeignKey('answers.Exam', null=True, on_delete=models.SET_NULL)
