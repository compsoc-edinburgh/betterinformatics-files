from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
from util import s3_util
from django.utils import timezone
from datetime import timedelta

from myauth.models import MyUser
from answers.models import Answer, AnswerSection, Comment, Exam, ExamType
from categories.models import Category, MetaCategory
from feedback.models import Feedback
from filestore.models import Attachment
from images.models import Image
from notifications.models import Notification, NotificationSetting, NotificationType
from payments.models import Payment
import os
from answers import pdf_utils


class Command(BaseCommand):
    help = "Creates some testdata"

    def add_arguments(self, parser):
        pass

    def flush_db(self):
        self.stdout.write("Drop old tables")
        call_command("flush", "--no-input")

    def create_users(self):
        self.stdout.write("Create users")
        for (first_name, last_name, username) in [
            ("Zoe", "Fletcher", "fletchz"),
            ("Ernst", "Meyer", "meyee"),
            ("Jonas", "Schneider", "schneij"),
            ("Julia", "Keller", "kellerju"),
            ("Sophie", "Baumann", "baumanso"),
            ("Hans", "Brunner", "brunh"),
            ("Carla", "Morin", "morica"),
            ("Paul", "Moser", "mosep"),
            ("Josef", "Widmer", "widmjo"),
            ("Werner", "Steiner", "steinewe"),
        ]:
            MyUser(first_name=first_name, last_name=last_name, username=username).save()

    def create_images(self):
        self.stdout.write("Create images")
        for user in MyUser.objects.all():
            for i in range(user.id % 10 + 5):
                filename = s3_util.generate_filename(
                    16, settings.COMSOL_IMAGE_DIR, ".svg"
                )
                s3_util.save_file_to_s3(
                    settings.COMSOL_IMAGE_DIR, filename, "static/test_image.svg"
                )
                Image(filename=filename, owner=user).save()

    def create_meta_categories(self):
        self.stdout.write("Create meta categories")
        metas = [MetaCategory(displayname="Bachelor " + str(i + 1)) for i in range(6)]
        for meta in metas:
            meta.save()
            for i in range(5):
                MetaCategory(
                    displayname="Subcategory {} of {}".format(i + 1, meta.displayname),
                    parent=meta,
                ).save()

    def create_categories(self):
        self.stdout.write("Create categories")
        Category(displayname="default", slug="default").save()
        for i in range(70):
            self.stdout.write("Creating category " + str(i + 1))
            category = Category(
                displayname="Category " + str(i + 1),
                slug="category" + str(i + 1),
                form=(["written"] * 5 + ["oral"])[i % 6],
                remark=[
                    "Test remark",
                    "Slightly longer remark",
                    "This is a very long remark.\nIt even has multiple lines.\nHowever, it is not useful at all.\n\nThank you for reading!",
                ][i % 3],
                semester=["HS", "FS"][i % 2],
                permission="public",
                has_payments=(i % 5 == 0),
            )
            category.save()
            for j, user in enumerate(MyUser.objects.all()):
                if (i + j) % 6 == 0:
                    category.admins.add(user)
                if (i + j) % 9 == 0:
                    category.experts.add(user)
            for j, meta in enumerate(MetaCategory.objects.all()):
                if (i + j) % 4 == 0:
                    category.meta_categories.add(meta)
            category.save()

    def create_exam_types(self):
        self.stdout.write("Create exam types")
        ExamType(displayname="Exams", order=-100).save()
        ExamType(displayname="Transcripts", order=-99).save()
        ExamType(displayname="Midterms", order=-98).save()
        ExamType(displayname="Endterms", order=-97).save()
        ExamType(displayname="Finals", order=-96).save()

    def create_exams(self):
        self.stdout.write("Create exams")
        for category in Category.objects.all():
            for i in range(6):
                filename = s3_util.generate_filename(
                    8, settings.COMSOL_EXAM_DIR, ".pdf"
                )
                s3_util.save_file_to_s3(
                    settings.COMSOL_EXAM_DIR, filename, "exam10.pdf"
                )
                needs_payment = category.has_payments and (i + category.id % 3 == 0)
                if needs_payment:
                    exam_type = ExamType.objects.get(displayname="Transcripts")
                else:
                    exam_type = (
                        ExamType.objects.get(displayname="Exams")
                        if (i + category.id % 4 != 0)
                        else ExamType.objects.get(displayname="Midterms")
                    )
                exam = Exam(
                    filename=filename,
                    displayname="Exam {} in {}".format(i + 1, category.displayname),
                    exam_type=exam_type,
                    category=category,
                    resolve_alias="resolve_" + filename,
                    public=(i + category.id % 7 != 0),
                    finished_cuts=(i + category.id % 5 != 0),
                    needs_payment=needs_payment,
                )
                exam.save()
                pdf_utils.analyze_pdf(
                    exam, os.path.join(settings.COMSOL_EXAM_DIR, "exam10.pdf")
                )

                if i + category.id % 3 == 0:
                    exam.has_solution = True
                    s3_util.save_file_to_s3(
                        settings.COMSOL_SOLUTION_DIR, filename, "exam10.pdf"
                    )
                    exam.save()

                if i + category.id % 5 == 0:
                    exam.is_printonly = True
                    s3_util.save_file_to_s3(
                        settings.COMSOL_PRINTONLY_DIR, filename, "exam10.pdf"
                    )
                    exam.save()

    def create_answer_sections(self):
        self.stdout.write("Create answer sections")
        users = MyUser.objects.all()
        objs = []
        for exam in Exam.objects.all():
            for page in range(3):
                for i in range(4):
                    objs.append(AnswerSection(
                        exam=exam,
                        author=users[(exam.id + page + i) % len(users)],
                        page_num=page,
                        rel_height=0.2 + 0.15 * i,
                        name="Aufgabe " + str(i),
                    ))
        AnswerSection.objects.bulk_create(objs)

    def create_answers(self):
        self.stdout.write("Create answers")
        users = MyUser.objects.all()
        objs = []
        for section in AnswerSection.objects.all():
            for i in range(section.id % 7):
                author = users[(section.id + i) % len(users)]
                answer = Answer(
                    answer_section=section,
                    author=author,
                    text=[
                        "This is a test answer.\n\nIt has multiple lines.",
                        "This is maths: $\pi = 3$\n\nHowever, it is wrong.",
                        "This is an image: ![Testimage]({})".format(
                            Image.objects.filter(owner=author).first().filename
                        ),
                    ][(section.id + i) % 3],
                )
                if i == 6:
                    answer.is_legacy_answer = True
                objs.append(answer)
        Answer.objects.bulk_create(objs)
        
        for answer in Answer.objects.all():
            i = answer.answer_section.id
            for user in users:
                if user == answer.author:
                    continue
                if (i + user.id) % 4 == 0:
                    answer.upvotes.add(user)
                elif (i + user.id) % 7 == 1:
                    answer.downvotes.add(user)
                elif (i + user.id) % 9 == 0:
                    answer.flagged.add(user)

    def create_comments(self):
        self.stdout.write("Create comments")
        users = MyUser.objects.all()
        objs = []
        for answer in Answer.objects.all():
            for i in range(answer.id % 17):
                author = users[(answer.id + i) % len(users)]
                comment = Comment(
                    answer=answer,
                    author=author,
                    text=[
                        "This is a comment ({}).".format(i + 1),
                        "This is a test image: ![Testimage]({})".format(
                            Image.objects.filter(owner=author).first().filename
                        ),
                    ][(answer.id + i) % 2],
                )
                objs.append(comment)
        Comment.objects.bulk_create(objs)

    def create_feedback(self):
        self.stdout.write("Create feedback")
        users = MyUser.objects.all()
        objs = [Feedback(
                text="Feedback " + str(i + 1),
                author=users[i % len(users)],
                read=i % 7 == 0,
                done=i % 17 == 0,
            )
         for i in range(122)]
        Feedback.objects.bulk_create(objs)

    def create_attachments(self):
        self.stdout.write("Create attachments")
        for exam in Exam.objects.all():
            if exam.id % 7 == 0:
                filename = s3_util.generate_filename(
                    16, settings.COMSOL_FILESTORE_DIR, ".pdf"
                )
                s3_util.save_file_to_s3(
                    settings.COMSOL_FILESTORE_DIR, filename, "exam10.pdf"
                )
                Attachment(
                    displayname="Attachment " + str(exam.id),
                    filename=filename,
                    exam=exam,
                ).save()
        for category in Category.objects.all():
            if category.id % 7 == 0:
                filename = s3_util.generate_filename(
                    16, settings.COMSOL_FILESTORE_DIR, ".pdf"
                )
                s3_util.save_file_to_s3(
                    settings.COMSOL_FILESTORE_DIR, filename, "exam10.pdf"
                )
                Attachment(
                    displayname="Attachment " + str(category.id),
                    filename=filename,
                    category=category,
                ).save()

    def create_notifications(self):
        self.stdout.write("Create notifications")
        users = MyUser.objects.all()
        answers = Answer.objects.all()
        for user in MyUser.objects.all():
            for i in range(user.id % 22):
                Notification(
                    sender=users[i % len(users)],
                    receiver=user,
                    type=[
                        NotificationType.NEW_ANSWER_TO_ANSWER,
                        NotificationType.NEW_COMMENT_TO_ANSWER,
                        NotificationType.NEW_COMMENT_TO_COMMENT,
                    ][i % 3].value,
                    title="Test Notification",
                    text="Test Notification",
                    answer=answers[(user.id + i) % len(answers)],
                ).save()

    def create_payments(self):
        self.stdout.write("Create payments")
        categories = Category.objects.all()
        for user in MyUser.objects.all():
            if user.id % 7 == 0:
                Payment(user=user).save()
                if user.id % 9 == 0:
                    filename = s3_util.generate_filename(
                        8, settings.COMSOL_EXAM_DIR, ".pdf"
                    )
                    s3_util.save_file_to_s3(
                        settings.COMSOL_EXAM_DIR, filename, "exam10.pdf"
                    )
                    exam_type = ExamType.objects.get(displayname="Transcripts")
                    exam = Exam(
                        filename=filename,
                        displayname="Transcript by {}".format(user.displayname()),
                        exam_type=exam_type,
                        category=categories[user.id % len(categories)],
                        resolve_alias="resolve_" + filename,
                        public=False,
                        finished_cuts=False,
                        needs_payment=True,
                        is_oral_transcript=True,
                        oral_transcript_uploader=user,
                    )
                    exam.save()
                if user.id % 14 == 0:
                    Payment(
                        user=user,
                        payment_time=timezone.now() - timedelta(days=365),
                    ).save()

    def handle(self, *args, **options):
        self.flush_db()
        self.create_users()
        self.create_images()
        self.create_meta_categories()
        self.create_categories()
        self.create_exam_types()
        self.create_exams()
        self.create_answer_sections()
        self.create_answers()
        self.create_comments()
        self.create_feedback()
        self.create_attachments()
        self.create_notifications()
        self.create_payments()
