from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db.utils import IntegrityError
from django.conf import settings
from datetime import datetime
from util import minio_util
from pymongo import MongoClient

import os

from myauth.models import MyUser
from answers.models import Answer, AnswerSection, Comment, Exam, ExamType
from categories.models import Category, MetaCategory
from feedback.models import Feedback
from filestore.models import Attachment
from images.models import Image
from notifications.models import Notification, NotificationSetting, NotificationType
from payments.models import Payment


class Command(BaseCommand):
    help = 'Creates some testdata'

    def add_arguments(self, parser):
        parser.add_argument('--add-dummy-files', action='store_true', help='Add dummy PDFs and images. Only use in local testing environment!')
        parser.add_argument('--flush-db', action='store_true', help='Flush the db before anything is imported.')


    def parse_iso_datetime(self, strval):
        return datetime.strptime(strval.replace("+00:00", "+0000"), '%Y-%m-%dT%H:%M:%S.%f%z')


    def flush_db(self):
        self.stdout.write('Drop old tables')
        call_command('flush', '--no-input')
        Category(displayname='default', slug='default').save()
        self.create_exam_types()

    def create_exam_types(self):
        self.stdout.write('Create exam types')
        ExamType(displayname='Exams', order=-100).save()
        ExamType(displayname='Transcripts', order=-99).save()
        ExamType(displayname='Midterms', order=-98).save()
        ExamType(displayname='Endterms', order=-97).save()
        ExamType(displayname='Finals', order=-96).save()

    def connect_mongodb(self):
        self.mongo_db = MongoClient(
            host=os.environ['RUNTIME_MONGO_DB_SERVER'],
            port=int(os.environ['RUNTIME_MONGO_DB_PORT']),
            username=os.environ['RUNTIME_MONGO_DB_USER'],
            password=os.environ['RUNTIME_MONGO_DB_PW'],
            connect=True,
            authSource=os.environ['RUNTIME_MONGO_DB_NAME'],
        )[os.environ['RUNTIME_MONGO_DB_NAME']]
        self.answer_sections = self.mongo_db.answersections
        self.user_data = self.mongo_db.userdata
        self.category_metadata = self.mongo_db.categorymetadata
        self.meta_category = self.mongo_db.metacategory
        self.exam_metadata = self.mongo_db.exammetadata
        self.image_metadata = self.mongo_db.imagemetadata
        self.payments = self.mongo_db.payments
        self.feedback = self.mongo_db.feedback

    def check_obj_keys(self, objtype, obj, required, optional):
        for key in required:
            if key not in obj:
                self.stdout.write('{} is missing key {}!'.format(objtype, key))
        all_keys = required + optional
        for key in obj:
            if key not in all_keys:
                self.stdout.write('{} has unexpected key {}!'.format(objtype, key))

    def get_or_create_user(self, username, displayname=None):
        user, created = MyUser.objects.get_or_create(username=username)
        if created:
            self.stdout.write('User {} not found, adding now.'.format(username))
            if displayname:
                splitted = displayname.split(' ', 1)
                user.first_name = splitted[0]
                user.last_name = splitted[1]
                user.save()
        return user

    def migrate_users(self):
        from myauth.people_auth import get_real_name
        self.stdout.write('Migrate users')
        for user in self.user_data.find({}):
            self.check_obj_keys(
                'User', user,
                required=[
                    '_id',
                    'username',
                    'displayName',
                    'score',
                    'score_answers',
                    'score_comments',
                    'score_cuts',
                    'score_legacy',
                    'notifications',
                    'enabled_notifications',
                ],
                optional=[]
            )
            realname = get_real_name(user['username'])
            # if not realname[0]:
                # TODO ignore users we did not find
                # self.stdout.write('User {} not found.'.format(user['username']))
            # TODO is this check valid for real nethz? There were a few weird users in the prod db
            if len(user['username']) > 15:
                self.stdout.write('Ignore user {}.'.format(user['username']))
                continue
            new_user = MyUser(
                username=user['username'],
                first_name=realname[0],
                last_name=realname[1],
            )
            try:
                new_user.save()
            except IntegrityError as e:
                if str(e).startswith('duplicate key value violates unique constraint "auth_user_username_key"'):
                    self.stdout.write('Duplicate user {}.'.format(user['username']))
                    continue
                else:
                    raise
            # TODO reenable this check
            """
            if new_user.displayname() != user['displayName']:
                self.stdout.write('User {} has now a different display name: {} vs {}!'.format(user['username'], new_user.displayname(), user['displayName']))
            """
            for enabled_notification in user['enabled_notifications']:
                NotificationSetting(
                    user=new_user,
                    type=enabled_notification
                ).save()

    def migrate_feedback(self):
        self.stdout.write('Migrate feedback')
        for feedback in self.feedback.find({}):
            self.check_obj_keys(
                'Feedback', feedback,
                required=[
                    '_id',
                    'authorId',
                    'authorDisplayName',
                    'text',
                    'time',
                    'done',
                    'read',
                ],
                optional=[]
            )
            new_feedback = Feedback(
                text=feedback['text'],
                author=self.get_or_create_user(feedback['authorId'], feedback['authorDisplayName']),
                time=self.parse_iso_datetime(feedback['time']),
                read=feedback['read'],
                done=feedback['done'],
            )
            new_feedback.save()

    def migrate_images(self):
        self.stdout.write('Migrate images')
        for image in self.image_metadata.find({}):
            self.stdout.write(str(image))
            self.check_obj_keys(
                'Image', image,
                required=[
                    '_id',
                    'filename',
                    'authorId',
                    'displayname',
                ],
                optional=[]
            )
            if self.add_dummy_files:
                minio_util.save_file_to_minio(settings.COMSOL_IMAGE_DIR, image['filename'], 'static/expert_active.svg')
            new_image = Image(
                filename=image['filename'],
                owner=self.get_or_create_user(image['authorId']),
                displayname=image['displayname'],
            )
            new_image.save()

    def migrate_exams(self):
        self.stdout.write('Migrate exams')
        for exam in self.exam_metadata.find({}):
            self.stdout.write(str(exam))
            self.check_obj_keys(
                'Exam', exam,
                required=[
                    '_id',
                    'filename',
                    'count_cuts',
                    'count_answers',
                    'count_answered',
                    'attachments',
                    'displayname',
                    'category',
                    'resolve_alias',
                    'public',
                    'finished_cuts',
                    'finished_wiki_transfer',
                ],
                optional=[
                    'examtype',
                    'legacy_solution',
                    'master_solution',
                    'remark',
                    'needs_payment',
                    'solution_printonly',
                    'has_solution',
                    'import_claim',
                    'import_claim_displayname',
                    'import_claim_time',
                ]
            )
            # TODO migrate exam, depneds on category

    def migrate_payments(self):
        self.stdout.write('Migrate payments')
        for payment in self.payments.find({}):
            self.check_obj_keys(
                'Payment', payment,
                required=[
                    '_id',
                    'username',
                    'active',
                    'payment_time',
                    'refund_time',
                    'uploaded_filename',
                    'check_time',
                ],
                optional=[]
            )
            new_payment = Payment(
                user=self.get_or_create_user(payment['username']),
                payment_time=self.parse_iso_datetime(payment['payment_time']),
                check_time=self.parse_iso_datetime(payment['check_time']) if payment['check_time'] else None,
                refund_time=self.parse_iso_datetime(payment['refund_time']) if payment['refund_time'] else None,
                uploaded_transcript=Exam.objects.get(filename=payment['uploaded_filename']) if payment['uploaded_filename'] else None,
            )
            new_payment.save()

    def migrate_notifications(self):
        self.stdout.write('Migrate notifications')
        for user in self.user_data.find({}):
            try:
                new_user = MyUser.objects.get(username=user['username'])
            except MyUser.DoesNotExist:
                # We did not migrate the user because it is not a real one
                continue
            for notification in user['notifications']:
                self.check_obj_keys(
                    'Notification', notification,
                    required=[
                        '_id',
                        'receiver',
                        'sender',
                        'senderDisplayName',
                        'title',
                        'message',
                        'time',
                        'read',
                        'link',
                        'type',
                    ],
                    optional=[]
                )
                answer_long_id = notification['link'].split('#')[-1]
                new_notification = Notification(
                    sender=self.get_or_create_user(notification['sender'], notification['senderDisplayName']),
                    receiver=new_user,
                    type=notification['type'],
                    time=self.parse_iso_datetime(notification['time']),
                    title=notification['title'],
                    text=notification['message'],
                    answer=Answer.objects.get(long_id=answer_long_id),
                    read=notification['read'],
                )
                new_notification.save()

    def handle(self, *args, **options):
        if options['flush_db']:
            self.flush_db()
        self.add_dummy_files = options['add_dummy_files']
        self.connect_mongodb()
        #self.migrate_users()
        #self.migrate_feedback()
        #self.migrate_images()
        self.migrate_exams()
        #self.migrate_payments()
        #self.migrate_notifications()
