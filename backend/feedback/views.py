from util import response
from ediauth import auth_check
from feedback.models import Feedback
from django.shortcuts import get_object_or_404


@response.request_post('text')
@auth_check.require_login
def submit(request):
    feedback = Feedback(author=request.user, text=request.POST['text'])
    feedback.save()
    return response.success()


@response.request_get()
@auth_check.require_admin
def list_all(request):
    objs = Feedback.objects.select_related('author').all()
    return response.success(value=[
        {
            'oid': obj.id,
            'text': obj.text,
            'author': obj.author.username,
            'authorDisplayName': obj.author.profile.display_username,
            'time': obj.time.isoformat(),
            'read': obj.read,
            'done': obj.done,
        } for obj in objs
    ])


@response.request_post('read', 'done', optional=True)
@auth_check.require_admin
def flags(request, feedbackid):
    feedback = get_object_or_404(Feedback, pk=feedbackid)
    for key in ['read', 'done']:
        if key in request.POST:
            setattr(feedback, key, request.POST[key] != 'false')
    feedback.save()
    return response.success()
