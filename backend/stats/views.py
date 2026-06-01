from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

from ediauth import auth_check
from util import response, func_cache
from answers.models import Answer
from documents.models import Document


@func_cache.cache(3600 * 12)  # Cache for 12 hours
def get_stats():
    stats = {}

    # Date of first user registration
    first_user = User.objects.order_by("date_joined").first()

    # Add a week of offset to show we had 0 before
    days = (timezone.now() - first_user.date_joined).days + 7 if first_user else 0

    # Get user count over the last period
    stats.setdefault("user_stats", {})
    stats["user_stats"] = []
    for i in range(days, -1, -1):
        date = timezone.now() - timedelta(days=i)
        user_count = User.objects.filter(date_joined__lte=date).count()
        stats["user_stats"].append(
            {"date": date.strftime("%Y-%m-%d"), "count": user_count}
        )

    # Get exam questions count and answered question count for the last period
    stats.setdefault("exam_stats", {})
    stats["exam_stats"] = []
    for i in range(days, -1, -1):
        date = timezone.now() - timedelta(days=i)
        answered_count = (
            Answer.objects.filter(time__lte=date)
            .values("answer_section")
            .distinct()
            .count()
        )
        answers_count = Answer.objects.filter(time__lte=date).count()
        stats["exam_stats"].append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "answered_count": answered_count,
                "answers_count": answers_count,
            }
        )

    # Get document count for the last period
    stats.setdefault("document_stats", {})
    stats["document_stats"] = []
    for i in range(days, -1, -1):
        date = timezone.now() - timedelta(days=i)
        document_count = Document.objects.filter(
            Q(time__lte=date) | Q(time=None)
        ).count()
        stats["document_stats"].append(
            {"date": date.strftime("%Y-%m-%d"), "count": document_count}
        )

    return stats


@response.request_get()
@auth_check.require_login
def stats(request):
    return response.success(value=get_stats())
