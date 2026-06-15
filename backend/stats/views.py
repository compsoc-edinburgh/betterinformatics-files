from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import (
    Count,
    DateField,
    ExpressionWrapper,
    Min,
    OuterRef,
    Subquery,
)
from django.db.models.functions import Coalesce, TruncDate

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
        .values("day", "cnt")
        .order_by("day")
    )
    user_counts = {row["day"]: row["cnt"] for row in user_rows}

    disabled_user_rows = (
        # Based on their last login date, add 250 days to it and annotate the
        # day that they get disabled. Group by this date, filter out anything
        # in the future, and count how many users were considered no  longer
        # active on each day.
        # For those with last login set to NULL, use their date joined instead.
        # (250 was chosen as a slightly arbitrary cutoff that isn't as long as
        # a full year but is long enough to cover two semesters)
        User.objects.annotate(
            day=TruncDate(
                ExpressionWrapper(
                    Coalesce("last_login", "date_joined") + timedelta(days=250),
                    output_field=DateField(),
                )
            )
        )
        .filter(day__lte=timezone.now().date())
        .values("day")
        .annotate(cnt=Count("id"))
        .values("day", "cnt")
        .order_by("day")
    )
    disabled_user_counts = {row["day"]: row["cnt"] for row in disabled_user_rows}

    stats["user_stats"] = []
    last_user_count = 0
    last_disabled_user_count = 0
    for day in days:
        if day in user_counts:
            last_user_count += user_counts[day]
        if day in disabled_user_counts:
            last_disabled_user_count += disabled_user_counts[day]
        stats["user_stats"].append(
            {
                "date": day.strftime("%Y-%m-%d"),
                "count": last_user_count,
                "active_count": last_user_count - last_disabled_user_count,
            }
        )

    answer_rows = (
        # Annotate each answer with the day it was created
        Answer.objects.annotate(day=TruncDate("time"))
        # Group by day and count number of answers per day
        .values("day")
        .annotate(cnt=Count("id"))
        .values("day", "cnt")
        .order_by("day")
    )
    answers_counts = {row["day"]: row["cnt"] for row in answer_rows}

    earliest_answer_subquery = (
        AnswerSection.objects.filter(pk=OuterRef("pk"))
        .annotate(min_time=Min("answer__time"))
        .values(first_day=TruncDate("min_time"))
    )

    # 2. Main query: Annotate each section with its first day, then group by that day and count
    answered_rows = (
        AnswerSection.objects.annotate(first_day=Subquery(earliest_answer_subquery))
        .values("first_day")
        .annotate(cnt=Count("id"))
        .order_by("first_day")
    )

    answered_counts = {row["first_day"]: row["cnt"] for row in answered_rows}

    stats["exam_stats"] = []
    last_answers_count = 0
    last_answered_count = 0
    for day in days:
        if day in answers_counts:
            last_answers_count += answers_counts[day]
        if day in answered_counts:
            last_answered_count += answered_counts[day]
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
        .values("day", "cnt")
        .order_by("day")
    )
    document_counts = {row["day"]: row["cnt"] for row in document_rows}

    stats["document_stats"] = []
    last_document_count = 0
    for day in days:
        if day in document_counts:
            last_document_count += document_counts[day]
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
