from django.db import models
from django.utils import timezone
import enum


class NotificationType(enum.Enum):
    NEW_COMMENT_TO_ANSWER = 1
    NEW_COMMENT_TO_COMMENT = 2
    NEW_ANSWER_TO_ANSWER = 3
    NEW_COMMENT_TO_DOCUMENT = 4


class Notification(models.Model):
    sender = models.ForeignKey('auth.User', related_name='notification_sender_set', null=True, on_delete=models.SET_NULL)
    receiver = models.ForeignKey('auth.User', related_name='notification_receiver_set', on_delete=models.CASCADE)
    type = models.IntegerField()
    time = models.DateTimeField(default=timezone.now)
    title = models.CharField(max_length=256)
    text = models.TextField()
    answer = models.ForeignKey('answers.Answer', null=True, on_delete=models.SET_NULL)
    document = models.ForeignKey('documents.Document', null=True, on_delete=models.SET_NULL)
    read = models.BooleanField(default=False)


class NotificationSetting(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    type = models.IntegerField()
    enabled = models.BooleanField(default=True)
