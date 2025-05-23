from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
from util import s3_util
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from ediauth.models import Profile
from answers.models import Answer, AnswerSection, Comment, Exam, ExamType
from documents.models import DocumentType, Document, DocumentFile
from categories.models import Category, MetaCategory, EuclidCode
from feedback.models import Feedback
from filestore.models import Attachment
from images.models import Image
from notifications.models import Notification, NotificationSetting, NotificationType
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
        for first_name, last_name, uun in [
            ("Zoe", "Fletcher", "s1111111"),
            ("Ernst", "Meyer", "s2222232"),
            ("Jonas", "Schneider", "s3333433"),
            ("Julia", "Keller", "s4444444"),
            ("Sophie", "Baumann", "s5555555"),
            ("Hans", "Brunner", "s6666666"),
            ("Carla", "Morin", "s7777777"),
            ("Paul", "Moser", "s8888888"),
            ("Josef", "Widmer", "s9999999"),
            ("Werner", "Steiner", "s0000000"),
        ]:
            User(
                first_name=first_name,
                last_name=last_name,
                username=uun,
                email=uun + "@sms.ed.ac.uk",
            ).save()
            Profile(
                user=User.objects.get(username=uun),
                display_username=first_name + " " + last_name,
            ).save()

    def create_images(self):
        self.stdout.write("Create images")
        for user in User.objects.all():
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
        metas = [MetaCategory(displayname="SCQF " + str(i + 1)) for i in range(8, 12)]
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
                semester=["sem1", "sem2", "full", "none"][i % 4],
                permission="public",
            )
            category.save()

            # Assign some EUCLID codes
            for j in range(2 if i % 5 == 0 else 1):
                category.euclid_codes.create(code="INFR100" + str(i) + str(j))

            for j, user in enumerate(User.objects.all()):
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

    def create_answer_sections(self):
        self.stdout.write("Create answer sections")
        users = User.objects.all()
        objs = []
        for exam in Exam.objects.all():
            for page in range(3):
                for i in range(4):
                    objs.append(
                        AnswerSection(
                            exam=exam,
                            author=users[(exam.id + page + i) % len(users)],
                            page_num=page,
                            rel_height=0.2 + 0.15 * i,
                            name="Aufgabe " + str(i),
                        )
                    )
        AnswerSection.objects.bulk_create(objs)

    def create_answers(self):
        self.stdout.write("Create answers")
        users = User.objects.all()
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
        users = User.objects.all()
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
        users = User.objects.all()
        objs = [
            Feedback(
                text="Feedback " + str(i + 1),
                author=users[i % len(users)],
                read=i % 7 == 0,
                done=i % 17 == 0,
            )
            for i in range(122)
        ]
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
        users = User.objects.all()
        answers = Answer.objects.all()
        for user in User.objects.all():
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

    def create_document_types(self):
        self.stdout.write("Create document types")
        DocumentType(display_name="Documents", order=-100).save()
        DocumentType(display_name="Summaries", order=-99).save()
        DocumentType(display_name="Cheat Sheets", order=-98).save()
        DocumentType(display_name="Flashcards", order=-97).save()

    def create_documents(self):
        self.stdout.write("Create documents")
        users = User.objects.all()
        for i, category in enumerate(Category.objects.all()):
            for document_type in DocumentType.objects.all():
                document = Document(
                    display_name=document_type.display_name
                    + " in "
                    + str(category.displayname),
                    description="This is a test document.",
                    category=category,
                    author=users[i % len(users)],
                    anonymised=i % 3 == 0,
                    document_type=document_type,
                )
                document.save()

                # Add some files
                for j in range(2):
                    filename = s3_util.generate_filename(
                        16, settings.COMSOL_DOCUMENT_DIR, ".pdf"
                    )
                    s3_util.save_file_to_s3(
                        settings.COMSOL_DOCUMENT_DIR, filename, "exam10.pdf"
                    )
                    DocumentFile(
                        display_name="File " + str(j + 1),
                        document=document,
                        filename=filename,
                        mime_type="application/pdf",
                    ).save()

                # Make users like it
                for user in users:
                    if (i + user.id) % 4 == 0:
                        document.likes.add(user)

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
        self.create_document_types()
        self.create_documents()
