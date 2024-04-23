from django.shortcuts import get_object_or_404
from ediauth import auth_check
from util import response

from notifications.models import (Notification, NotificationSetting,
                                  NotificationType)


@response.request_get()
@auth_check.require_login
def getenabled(request):
    settings = NotificationSetting.objects.filter(user=request.user)
    res = [
        {
            "type": setting.type,
            "enabled": setting.enabled,
            "email_enabled": setting.email_enabled,
        }
        for setting in settings if setting.enabled or setting.email_enabled
    ]
    return response.success(value=res)


@response.request_post('type')
@auth_check.require_login
def setenabled(request):
    type_ = int(request.POST['type'])
    if type_ < 1 or type_ > len(NotificationType.__members__):
        return response.not_possible('Invalid Type')
    setting, _ = NotificationSetting.objects.get_or_create(user=request.user, type=type_)
    if 'enabled' in request.POST:
        setting.enabled = request.POST['enabled'] != 'false'
    if 'email_enabled' in request.POST:
        setting.email_enabled = request.POST['email_enabled'] != 'false'
    setting.save()
    return response.success()


@response.request_get()
@auth_check.require_login
def get_notifications(request, unread):
    notifications = Notification.objects.filter(receiver=request.user).select_related('receiver', 'sender', 'answer', 'document','answer__answer_section', 'answer__answer_section__exam')
    if unread:
        notifications = notifications.filter(read=False)
    notifications = notifications.order_by('-time')
    res = [
        {
            'oid': notification.id,
            'receiver': notification.receiver.username,
            'type': notification.type,
            'time': notification.time,
            'sender': notification.sender.username,
            'senderDisplayName': notification.sender.profile.display_username,
            'title': notification.title,
            'message': notification.text,
            'link': _get_notification_link(notification), 
            'read': notification.read,
        } for notification in notifications
    ]
    return response.success(value=res)

def _get_notification_link(notification):
    if notification.answer:
        return f'/exams/{notification.answer.answer_section.exam.filename}#{notification.answer.long_id}'
    elif notification.document:
        return f'/user/{notification.receiver.username}/document/{notification.document.slug}'
    return ''


@response.request_get()
@auth_check.require_login
def unread(request):
    return get_notifications(request, True)


@response.request_get()
@auth_check.require_login
def unreadcount(request):
    return response.success(value=Notification.objects.filter(receiver=request.user, read=False).count())


@response.request_get()
@auth_check.require_login
def all(request):
    return get_notifications(request, False)


@response.request_post('read')
@auth_check.require_login
def setread(request, oid):
    notification = get_object_or_404(Notification, pk=oid)
    notification.read = request.POST['read'] != 'false'
    notification.save()
    return response.success()
