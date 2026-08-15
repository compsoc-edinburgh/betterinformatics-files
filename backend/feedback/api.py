from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Field, Form, ModelSchema, Router, Schema

from ediauth import auth_check
from feedback.models import Feedback
from notifications.notification_util import new_feedback_reply
from util.schemas import ValueWrapped

router = Router(tags=["Feedback"])


class FeedbackSchema(Schema):
    text: str


@router.post("/submit/", operation_id="submitFeedback")
@auth_check.require_login
def submit(request, data: Form[FeedbackSchema]):
    feedback = Feedback(author=request.user, text=data.text)
    feedback.save()
    return None


class FeedbackOut(ModelSchema):
    class Meta:
        model = Feedback
        # Fields that can be automatically resolved from SQL columns.
        fields = ["reply", "text"]

    # Other fields need custom resolutions.
    oid: int = Field(..., alias="id")
    author: str = Field(..., alias="author.username")
    authorDisplayName: str
    reply_time: str | None = None

    # These fields have default values in SQL. If we list them in fields[] or use `Field`
    # Pydantic generates them as nullable. But in practice they will always be
    # set, so by explicitly listing them here we can get what we want.
    time: str
    read: bool
    done: bool

    @staticmethod
    def resolve_authorDisplayName(obj):
        return obj.author.profile.display_username

    @staticmethod
    def resolve_reply_time(obj):
        return obj.reply_time.isoformat() if obj.reply_time else None

    @staticmethod
    def resolve_time(obj):
        return obj.time.isoformat()

    @staticmethod
    def resolve_done(obj):
        return obj.done

    @staticmethod
    def resolve_read(obj):
        return obj.read


class FeedbackList(ValueWrapped[list[FeedbackOut]]):
    pass


@router.get("/list/", response=FeedbackList, operation_id="listFeedback")
@auth_check.require_admin
def list_all(request):
    return {"value": Feedback.objects.select_related("author").all()}


class FeedbackFlagsSchema(Schema):
    read: bool | None = None
    done: bool | None = None


class FeedbackReplySchema(Schema):
    reply: str


@router.post("/reply/{feedbackid}/", operation_id="createFeedbackReply")
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


@router.post("/flags/{feedbackid}/", operation_id="setFeedbackFlags")
@auth_check.require_admin
def flags(request, feedbackid: int, data: Form[FeedbackFlagsSchema]):
    feedback = get_object_or_404(Feedback, pk=feedbackid)
    for key in data.__fields__.keys():
        if data.__dict__[key] is not None:
            setattr(feedback, key, data.__dict__[key])
    feedback.save()
    return None
