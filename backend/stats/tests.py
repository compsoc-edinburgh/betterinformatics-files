from datetime import datetime, time, timedelta
from time import perf_counter

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from answers.models import Answer, AnswerSection, Exam, ExamType
from categories.models import Category
from documents.models import Document, DocumentType
from stats.views import get_stats


class TestStats(TestCase):
    def test_get_stats_cumulative_counts(self):
        today = timezone.now().date()
        day_one = today - timedelta(days=3)
        day_two = today - timedelta(days=1)
        dt_one = timezone.make_aware(datetime.combine(day_one, time(10, 0)))
        dt_two = timezone.make_aware(datetime.combine(day_two, time(12, 0)))

        user_one = User.objects.create(username="user_one", date_joined=dt_one)
        user_two = User.objects.create(username="user_two", date_joined=dt_two)

        category = Category.objects.create(displayname="Test Category", slug="test")
        exam_type = ExamType.objects.create(displayname="Exams", order=0)
        exam = Exam.objects.create(
            filename="exam-1.pdf",
            displayname="Exam 1",
            category=category,
            exam_type=exam_type,
            remark="Remark",
            resolve_alias="alias.pdf",
            public=True,
            finished_cuts=True,
        )

        section_one = AnswerSection.objects.create(
            exam=exam,
            author=user_one,
            page_num=1,
            rel_height=0.1,
            name="Section 1",
        )
        section_two = AnswerSection.objects.create(
            exam=exam,
            author=user_one,
            page_num=1,
            rel_height=0.2,
            name="Section 2",
        )
        Answer.objects.create(
            answer_section=section_one,
            author=user_one,
            text="Answer one",
            time=dt_one,
            edittime=dt_one,
        )
        Answer.objects.create(
            answer_section=section_two,
            author=user_two,
            text="Answer two",
            time=dt_two,
            edittime=dt_two,
        )

        document_type = DocumentType.objects.create(display_name="Documents", order=0)
        Document.objects.create(
            display_name="Doc 1",
            description="Doc 1",
            category=category,
            document_type=document_type,
            author=user_one,
            time=dt_one,
            edittime=dt_one,
        )
        Document.objects.create(
            display_name="Doc 2",
            description="Doc 2",
            category=category,
            document_type=document_type,
            author=user_one,
            time=dt_two,
            edittime=dt_two,
        )
        Document.objects.create(
            display_name="Doc 3",
            description="Doc 3",
            category=category,
            document_type=document_type,
            author=user_one,
            time=None,
            edittime=dt_two,
        )

        stats = get_stats()

        self.assertEqual(stats["user_stats"][-1]["date"], today.strftime("%Y-%m-%d"))
        self.assertEqual(stats["user_stats"][-1]["count"], 2)
        self.assertEqual(stats["exam_stats"][-1]["answers_count"], 2)
        self.assertEqual(stats["exam_stats"][-1]["answered_count"], 2)
        self.assertEqual(stats["document_stats"][-1]["count"], 3)

    def test_performance(self):
        # Test that with 4000 users, 200 exams, 10 sections per exam and 2
        # answers per section, the get_stats function runs in under 5 seconds
        today = timezone.now().date()
        base_date = today - timedelta(days=365 * 4)  # Start 4 years ago

        users = []
        for i in range(4000):
            join_day = base_date + timedelta(days=i % (365 * 4))
            join_time = timezone.make_aware(datetime.combine(join_day, time(9, 0)))
            users.append(
                User(
                    username="perf_user_{:04d}".format(i),
                    date_joined=join_time,
                )
            )
        User.objects.bulk_create(users)
        users = list(User.objects.order_by("username"))

        category = Category.objects.create(displayname="Perf Category", slug="perf")
        exam_type = ExamType.objects.create(displayname="Exams", order=0)

        exams = []
        for i in range(500):
            exams.append(
                Exam(
                    filename="perf-{:03d}.pdf".format(i),
                    displayname="Perf Exam {:03d}".format(i),
                    category=category,
                    exam_type=exam_type,
                    remark="Remark",
                    resolve_alias="alias-{:03d}.pdf".format(i),
                    public=True,
                    finished_cuts=True,
                )
            )
        Exam.objects.bulk_create(exams)
        exams = list(Exam.objects.order_by("filename"))

        sections = []
        for exam_index, exam in enumerate(exams):
            author = users[exam_index % len(users)]
            for section_index in range(10):
                sections.append(
                    AnswerSection(
                        exam=exam,
                        author=author,
                        page_num=1,
                        rel_height=0.05 * (section_index + 1),
                        name="Section {:03d}-{:02d}".format(exam_index, section_index),
                    )
                )
        AnswerSection.objects.bulk_create(sections)
        sections = list(AnswerSection.objects.order_by("id"))

        answers = []
        for index, section in enumerate(sections):
            author_one = users[index % len(users)]
            author_two = users[(index + 1) % len(users)]
            answer_day = base_date + timedelta(days=index % (365 * 4))
            answer_time = timezone.make_aware(datetime.combine(answer_day, time(12, 0)))
            answers.append(
                Answer(
                    answer_section=section,
                    author=author_one,
                    text="Perf answer one",
                    time=answer_time,
                    edittime=answer_time,
                )
            )
            answers.append(
                Answer(
                    answer_section=section,
                    author=author_two,
                    text="Perf answer two",
                    time=answer_time,
                    edittime=answer_time,
                )
            )
        Answer.objects.bulk_create(answers)

        start_time = perf_counter()
        get_stats()
        duration = perf_counter() - start_time

        self.assertLess(duration, 5.0)
