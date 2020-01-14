from util import response
from myauth import auth_check
from feedback.models import Feedback
from django.shortcuts import get_object_or_404


@auth_check.require_login
@response.args_post('text')
def submit(request):
    feedback = Feedback(author=request.user, text=request.POST['text'])
    feedback.save()
    return response.success()


@auth_check.require_admin
def list_all(request):
    objs = Feedback.objects.all()
    return response.success(value=[
        {
            'oid': obj.id,
            'text': obj.text,
            'author': obj.author.username,
            'author_displayname': obj.author.displayname(),
            'read': obj.read,
            'done': obj.done,
        } for obj in objs
    ])


@auth_check.require_admin
def flags(request, feedbackid):
    feedback = get_object_or_404(Feedback, feedbackid)
    for key in ['read', 'done']:
        if key in request.POST:
            setattr(feedback, key, request.POST[key] != '0')
    feedback.save()
