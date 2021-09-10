from django.db import models
from django.utils import timezone
from datetime import datetime


class Payment(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    payment_time = models.DateTimeField(default=timezone.now)
    check_time = models.DateTimeField(null=True)
    refund_time = models.DateTimeField(null=True)
    uploaded_transcript = models.ForeignKey('answers.Exam', null=True, on_delete=models.SET_NULL)

    def valid(self):
        now = timezone.now()
        then = self.payment_time
        resetdates = [datetime(year, month, 1, tzinfo=now.tzinfo) for year in [now.year-1, now.year] for month in [3, 10]]
        for reset in resetdates:
            if now > reset > then:
                return False
        return True

    def valid_until(self):
        then = self.payment_time
        resetdates = [datetime(year, month, 1, tzinfo=then.tzinfo) for year in [then.year, then.year+1] for month in [3, 10]]
        for reset in resetdates:
            if reset > then:
                return reset
        return None

