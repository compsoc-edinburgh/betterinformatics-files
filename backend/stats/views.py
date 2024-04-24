from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

from ediauth import auth_check
from util import response, func_cache
from answers.models import Answer, Exam, AnswerSection
from documents.models import Document


@func_cache.cache(3600 * 12)  # Cache for 12 hours
def get_stats(weeks: int, months: int):
    # Get user count over last 6 weeks together with date
    user_counts = []
    for i in range(weeks, -1, -1):
        date = timezone.now() - timedelta(weeks=i)
        user_count = User.objects.filter(date_joined__lte=date).count()
        user_counts.append({"date": date.strftime("%Y-%m-%d"), "count": user_count})

    # Get user count over last 6 months together with date
    user_counts_monthly = []
    for i in range(months, -1, -1):
        date = timezone.now() - timedelta(weeks=4 * i)
        user_count = User.objects.filter(date_joined__lte=date).count()
        user_counts_monthly.append(
            {"date": date.strftime("%Y-%m-%d"), "count": user_count}
        )

    # Get exam questions count and answered question count for last 6 weeks
    exam_counts = []
    for i in range(weeks, -1, -1):
        date = timezone.now() - timedelta(weeks=i)
        answered_count = (
            Answer.objects.filter(time__lte=date)
            .values("answer_section")
            .distinct()
            .count()
        )
        answers_count = Answer.objects.filter(time__lte=date).count()
        exam_counts.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "answered_count": answered_count,
                "answers_count": answers_count,
            }
        )

    # Get exam questions count and answered question count for last 6 months
    exam_counts_monthly = []
    for i in range(months, -1, -1):
        date = timezone.now() - timedelta(weeks=4 * i)
        answered_count = (
            Answer.objects.filter(time__lte=date)
            .values("answer_section")
            .distinct()
            .count()
        )
        answers_count = Answer.objects.filter(time__lte=date).count()
        exam_counts_monthly.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "answered_count": answered_count,
                "answers_count": answers_count,
            }
        )

    # Get document count for last 6 weeks
    document_counts = []
    for i in range(weeks, -1, -1):
        date = timezone.now() - timedelta(weeks=i)
        document_count = Document.objects.filter(
            Q(time__lte=date) | Q(time=None)
        ).count()
        document_counts.append(
            {"date": date.strftime("%Y-%m-%d"), "count": document_count}
        )

    # Get document count for last 6 months
    document_counts_monthly = []
    for i in range(months, -1, -1):
        date = timezone.now() - timedelta(weeks=4 * i)
        document_count = Document.objects.filter(
            Q(time__lte=date) | Q(time=None)
        ).count()
        document_counts_monthly.append(
            {"date": date.strftime("%Y-%m-%d"), "count": document_count}
        )

    return {
        "weekly_user_stats": user_counts,
        "monthly_user_stats": user_counts_monthly,
        "weekly_exam_stats": exam_counts,
        "monthly_exam_stats": exam_counts_monthly,
        "weekly_document_stats": document_counts,
        "monthly_document_stats": document_counts_monthly,
    }


@response.request_get()
@auth_check.require_login
def stats(request):
    weeks = 8
    months = 6

    # Allow overriding the default values via query parameters but only for admins
    if auth_check.has_admin_rights(request):
        if "weeks" in request.GET:
            weeks = int(request.GET["weeks"])
        if "months" in request.GET:
            months = int(request.GET["months"])

    return response.success(value=get_stats(weeks, months))
