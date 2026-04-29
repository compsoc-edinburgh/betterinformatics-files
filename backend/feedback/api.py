from util.schemas import ValueWrapped
from typing import Optional

from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Field, Form, ModelSchema, Router, Schema

from feedback.models import Feedback
from ediauth import auth_check
from notifications.notification_util import new_feedback_reply

router = Router()


class FeedbackSchema(Schema):
    text: str


@router.post("/submit/")
@auth_check.require_login
def submit(request, data: Form[FeedbackSchema]):
    feedback = Feedback(author=request.user, text=data.text)
    feedback.save()
    return None


class FeedbackOut(ModelSchema):
    oid: int = Field(..., alias="id")
    author: str = Field(..., alias="author.username")
    authorDisplayName: str
    reply_time: Optional[str]

    class Meta:
        model = Feedback
        fields = ["text", "time", "read", "done", "reply"]

    @staticmethod
    def resolve_authorDisplayName(obj):
        return obj.author.profile.display_username

    @staticmethod
    def resolve_time(obj):
        return obj.time.isoformat()

    @staticmethod
    def resolve_reply_time(obj):
        return obj.reply_time.isoformat() if obj.reply_time else None


class FeedbackList(ValueWrapped[list[FeedbackOut]]):
    pass


@router.get("/list/", response=FeedbackList)
@auth_check.require_admin
def list_all(request):
    return {"value": Feedback.objects.select_related("author").all()}


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
