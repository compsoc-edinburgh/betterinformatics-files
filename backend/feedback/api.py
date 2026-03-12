from typing import Optional

from django.shortcuts import get_object_or_404
from ediauth import auth_check
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
                "authorDisplayName": obj.author.profile.display_username,
                "time": obj.time.isoformat(),
                "read": obj.read,
                "done": obj.done,
            }
            for obj in objs
        ]
    }


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
