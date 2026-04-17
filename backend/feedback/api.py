from typing import Optional

from django.shortcuts import get_object_or_404
from ninja import Field, Form, ModelSchema, Router, Schema

from feedback.models import Feedback
from myauth import auth_check
from myauth.models import get_my_user

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
    author: str
    authorDisplayName: str

    class Meta:
        model = Feedback
        fields = ["text", "time", "read", "done"]

    @staticmethod
    def resolve_author(obj):
        return obj.author.username

    @staticmethod
    def resolve_authorDisplayName(obj):
        return get_my_user(obj.author).displayname()

    @staticmethod
    def resolve_time(obj):
        return obj.time.isoformat()


class FeedbackListOut(Schema):
    value: list[FeedbackOut]


@router.get("/list/", response=FeedbackListOut)
@auth_check.require_admin
def list_all(request):
    return {"value": Feedback.objects.select_related("author").all()}


class FeedbackFlagsSchema(Schema):
    read: Optional[bool] = None
    done: Optional[bool] = None


@router.post("/flags/{feedbackid}/")
@auth_check.require_admin
def flags(request, feedbackid: int, data: Form[FeedbackFlagsSchema]):
    feedback = get_object_or_404(Feedback, pk=feedbackid)
    for key in data.__fields__.keys():
        if data.__dict__[key] is not None:
            setattr(feedback, key, data.__dict__[key])
    feedback.save()
    return None
