from typing import Optional

from django.shortcuts import get_object_or_404
from django.utils import timezone
from myauth import auth_check
from myauth.models import get_my_user
from ninja import Form, Router, Schema

from feedback.models import Feedback

router = Router()


class FeedbackSchema(Schema):
    text: str


@router.post("/submit/")
@auth_check.require_login
def submit(request, data: Form[FeedbackSchema]):
    feedback = Feedback(author=request.user, text=data.text)
    feedback.save()
    return None


@router.get("/list/")
@auth_check.require_admin
def list_all(request):
    objs = Feedback.objects.select_related("author").all()
    return {
        # TODO: Make this a schema as well?
        "value": [
            {
                "oid": obj.id,
                "text": obj.text,
                "author": obj.author.username,
                "authorDisplayName": get_my_user(obj.author).displayname(),
                "time": obj.time.isoformat(),
                "read": obj.read,
                "done": obj.done,
                "reply": obj.reply,
                "reply_time": obj.reply_time.isoformat() if obj.reply_time else None
            }
            for obj in objs
        ]
    }


class FeedbackFlagsSchema(Schema):
    read: Optional[bool] = None
    done: Optional[bool] = None

class FeedbackReplySchema(Schema):
    reply: str

@router.post("/reply/{feedbackid}/")
@auth_check.require_admin
def replies(request, feedbackid: int, data: Form[FeedbackReplySchema]):
    feedback = get_object_or_404(Feedback, pk=feedbackid)
    new_reply = data.reply
    has_prev_reply = bool(feedback.reply)
    feedback.reply = new_reply
    feedback.reply_time = timezone.now() if new_reply else None
    feedback.save()
    if new_reply and not has_prev_reply:
        from notifications.notification_util import new_feedback_reply
        new_feedback_reply(request.user, feedback)
    return None

@router.post("/flags/{feedbackid}/")
@auth_check.require_admin
def flags(request, feedbackid: int, data: Form[FeedbackFlagsSchema]):
    feedback = get_object_or_404(Feedback, pk=feedbackid)
    for key in data.__fields__.keys():
        if data.__dict__[key] is not None:
            setattr(feedback, key, data.__dict__[key])
    feedback.save()
    return None
