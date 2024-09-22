from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

from ediauth import auth_check
from util import response, func_cache
from answers.models import Answer, Exam, AnswerSection
from documents.models import Document

month_in_weeks = 4
semester_in_weeks = 26  # 52 weeks in a year, 2 semesters in a year


@func_cache.cache(3600 * 12)  # Cache for 12 hours
def get_stats(weeks: int, months: int, semesters: int):
    stats = {}
    for granularity in ["weekly", "monthly", "semesterly"]:
        # Get last period for this granularity
        if granularity == "weekly":
            period = weeks
            weeks_in_period = 1
        elif granularity == "monthly":
            period = months
            weeks_in_period = month_in_weeks
        elif granularity == "semesterly":
            period = semesters
            weeks_in_period = semester_in_weeks

        # Get user count over the last period
        stats.setdefault("user_stats", {})
        stats["user_stats"][granularity] = []
        for i in range(period * weeks_in_period, -weeks_in_period, -weeks_in_period):
            date = timezone.now() - timedelta(weeks=i)
            user_count = User.objects.filter(date_joined__lte=date).count()
            stats["user_stats"][granularity].append(
                {"date": date.strftime("%Y-%m-%d"), "count": user_count}
            )

        # Get exam questions count and answered question count for the last period
        stats.setdefault("exam_stats", {})
        stats["exam_stats"][granularity] = []
        for i in range(period * weeks_in_period, -weeks_in_period, -weeks_in_period):
            date = timezone.now() - timedelta(weeks=i)
            answered_count = (
                Answer.objects.filter(time__lte=date)
                .values("answer_section")
                .distinct()
                .count()
            )
            answers_count = Answer.objects.filter(time__lte=date).count()
            stats["exam_stats"][granularity].append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "answered_count": answered_count,
                    "answers_count": answers_count,
                }
            )

        # Get document count for the last period
        stats.setdefault("document_stats", {})
        stats["document_stats"][granularity] = []
        for i in range(period * weeks_in_period, -weeks_in_period, -weeks_in_period):
            date = timezone.now() - timedelta(weeks=i)
            document_count = Document.objects.filter(
                Q(time__lte=date) | Q(time=None)
            ).count()
            stats["document_stats"][granularity].append(
                {"date": date.strftime("%Y-%m-%d"), "count": document_count}
            )

    return stats


@response.request_get()
@auth_check.require_login
def stats(request):
    weeks = 8
    months = 6
    semesters = 6

    # Allow overriding the default values via query parameters but only for admins
    if auth_check.has_admin_rights(request):
        if "weeks" in request.GET:
            weeks = int(request.GET["weeks"])
        if "months" in request.GET:
            months = int(request.GET["months"])
        if "semesters" in request.GET:
            semesters = int(request.GET["semesters"])

    return response.success(value=get_stats(weeks, months, semesters))
