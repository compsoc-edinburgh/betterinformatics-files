from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, F, Min, Sum, Window
from django.db.models.functions import TruncDate

from ediauth import auth_check
from util import response, func_cache
from answers.models import Answer, AnswerSection
from documents.models import Document


@func_cache.cache(3600 * 12)  # Cache for 12 hours
def get_stats():
    stats = {}

    # Date of first user registration
    first_user = User.objects.order_by("date_joined").first()

    # Add a week of offset to show we had 0 before
    start_date = (
        first_user.date_joined.date() - timedelta(days=7)
        if first_user
        else timezone.now().date()
    )
    end_date = timezone.now().date()

    # Generate all days
    days = []
    current_day = start_date
    while current_day <= end_date:
        days.append(current_day)
        current_day += timedelta(days=1)

    user_rows = (
        # Annotate each user with the day they  joined
        User.objects.annotate(day=TruncDate("date_joined"))
        # Group by day and count number of joined users per day
        .values("day")
        .annotate(cnt=Count("id"))
        # Add a cumulative count column
        .annotate(total=Window(expression=Sum("cnt"), order_by=F("day").asc()))
        # Only select the day and cumulative total for output
        .values("day", "total")
        .order_by("day")
    )
    user_counts = {row["day"]: row["total"] for row in user_rows}
    stats["user_stats"] = []
    last_user_count = 0
    for day in days:
        if day in user_counts:
            last_user_count = user_counts[day]
        stats["user_stats"].append(
            {"date": day.strftime("%Y-%m-%d"), "count": last_user_count}
        )

    answer_rows = (
        # Annotate each answer with the day it was created
        Answer.objects.annotate(day=TruncDate("time"))
        # Group by day and count number of answers per day
        .values("day")
        .annotate(cnt=Count("id"))
        # Add a cumulative count column
        .annotate(total=Window(expression=Sum("cnt"), order_by=F("day").asc()))
        # Only select the day and cumulative total for output
        .values("day", "total")
        .order_by("day")
    )
    answers_counts = {row["day"]: row["total"] for row in answer_rows}

    answered_rows = (
        # Use AnswerSection and find the earliest answer time for each section
        AnswerSection.objects.annotate(first_day=TruncDate(Min("answer__time")))
        # Group by the first answer day and count how many sections were answered
        .values("first_day")
        .annotate(cnt=Count("id"))
        # Add a cumulative count column
        .annotate(total=Window(expression=Sum("cnt"), order_by=F("first_day").asc()))
        # Only select the first answer day and cumulative total for output
        .values("first_day", "total")
        .order_by("first_day")
    )
    answered_counts = {row["first_day"]: row["total"] for row in answered_rows}

    stats["exam_stats"] = []
    last_answers_count = 0
    last_answered_count = 0
    for day in days:
        if day in answers_counts:
            last_answers_count = answers_counts[day]
        if day in answered_counts:
            last_answered_count = answered_counts[day]
        stats["exam_stats"].append(
            {
                "date": day.strftime("%Y-%m-%d"),
                "answered_count": last_answered_count,
                "answers_count": last_answers_count,
            }
        )

    # Filter out documents made before time feature was added - add them as a
    # const at the end
    null_documents = Document.objects.filter(time__isnull=True).count()
    document_rows = (
        # Annotate each document with the day it was created
        Document.objects.filter(time__isnull=False)
        .annotate(day=TruncDate("time"))
        # Group by day and count number of documents per day
        .values("day")
        .annotate(cnt=Count("id"))
        # Add a cumulative count column
        .annotate(total=Window(expression=Sum("cnt"), order_by=F("day").asc()))
        # Only select the day and cumulative total for output
        .values("day", "total")
        .order_by("day")
    )
    document_counts = {row["day"]: row["total"] for row in document_rows}

    stats["document_stats"] = []
    last_document_count = 0
    for day in days:
        if day in document_counts:
            last_document_count = document_counts[day]
        stats["document_stats"].append(
            {
                "date": day.strftime("%Y-%m-%d"),
                "count": last_document_count + null_documents,
            }
        )

    return stats


@response.request_get()
@auth_check.require_login
def stats(request):
    return response.success(value=get_stats())
