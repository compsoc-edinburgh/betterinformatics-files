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


"""
MyDict allows to check that we used all keys and that we only get keys that were initially specified.
We have to make sure, all migrations follow these rules:
 - Use check_obj_keys to ensure we know about all keys and that all expected keys are there
 - Only use the returned MyDict object to retrieve values
 - Call .check() after we read all values
 - Ensure that all created objects are saved
"""



class BuggyCodeException(Exception):
    pass


class MyDict:

    def __init__(self, stdout, all_keys, obj):
        self.stdout = stdout
        self.all_keys = set(all_keys)
        self.obj = obj
        self.retrieved = {'_id'} if '_id' in all_keys else set()

    def __getitem__(self, item):
        if item in self.all_keys:
            self.retrieved.add(item)
            return self.obj[item]
        self.stdout.write('Getting unknown key {}!'.format(item))
        raise BuggyCodeException()

    def __contains__(self, item):
        return item in self.obj

    def __str__(self):
        return str(self.obj)

    def ignore(self, *items):
        for item in items:
            if item in self.all_keys:
                self.retrieved.add(item)
            else:
                raise BuggyCodeException()

    def safe_get(self, key, default):
        if key in self.all_keys:
            self.retrieved.add(key)
            return self.obj.get(key, default)
        self.stdout.write('Getting unknown key {}!'.format(key))
        raise BuggyCodeException()

    def check(self):
        if len(self.retrieved) != len(self.all_keys):
            self.stdout.write('Not all keys retrieved: {}'.format(self.all_keys - self.retrieved))
            raise BuggyCodeException()


class Command(BaseCommand):
    help = 'Creates some testdata'

    def add_arguments(self, parser):
        parser.add_argument('--add-dummy-files', action='store_true', help='Add dummy PDFs and images. Only use in local testing environment!')
        parser.add_argument('--flush-db', action='store_true', help='Flush the db before anything is imported.')
        parser.add_argument('--no-people', action='store_true', help='The people API is not available, ignore errors there.')

    def parse_iso_datetime(self, strval):
        return datetime.strptime(strval.replace("+00:00", "+0000"), '%Y-%m-%dT%H:%M:%S.%f%z')

    def flush_db(self):
        self.stdout.write('Drop old tables')
        call_command('flush', '--no-input')
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
                raise BuggyCodeException()
        all_keys = required + optional
        for key in obj:
            if key not in all_keys:
                self.stdout.write('{} has unexpected key {}!'.format(objtype, key))
                raise BuggyCodeException()

        return MyDict(self.stdout, all_keys, obj)

    def get_or_create_user(self, username, displayname=None):
        if username is None:
            return None
        from myauth.people_auth import get_real_name
        user, created = MyUser.objects.get_or_create(username=username)
        if created:
            self.stdout.write('User {} not found, adding now.'.format(username))
            realname = get_real_name(username)
            if not realname[0]:
                if displayname:
                    splitted = displayname.split(' ', 1)
                    user.first_name = splitted[0]
                    user.last_name = splitted[1]
                    user.save()
            else:
                user.first_name = realname[0]
                user.last_name = realname[1]
                user.save()
        return user

    def migrate_users(self):
        from myauth.people_auth import get_real_name
        self.stdout.write('Migrate users')
        for user in self.user_data.find({}):
            user = self.check_obj_keys(
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
            user.ignore('score_cuts', 'score', 'score_answers', 'score_answers', 'score_comments', 'score_legacy')
            user.ignore('notifications')  # will be handled later
            realname = get_real_name(user['username'])
            if not self.no_people and not realname[0]:
                self.stdout.write('User {} not found, ignore.'.format(user['username']))
                continue
            # There were a few weird users in the prod db
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
            if self.no_people:
                user.ignore('displayName')
            else:
                if new_user.displayname() != user['displayName']:
                    self.stdout.write('User {} has now a different display name: {} vs {}!'.format(user['username'], new_user.displayname(), user['displayName']))
            for enabled_notification in user['enabled_notifications']:
                NotificationSetting(
                    user=new_user,
                    type=enabled_notification
                ).save()
            user.check()

    def migrate_feedback(self):
        self.stdout.write('Migrate feedback')
        for feedback in self.feedback.find({}):
            feedback = self.check_obj_keys(
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
            feedback.check()

    def migrate_images(self):
        self.stdout.write('Migrate images')
        for image in self.image_metadata.find({}):
            image = self.check_obj_keys(
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
            image.check()

    def migrate_categories(self):
        self.stdout.write('Migrate categories')
        for category in self.category_metadata.find({}):
            category = self.check_obj_keys(
                'Category', category,
                required=[
                    '_id',
                    'category',
                    'slug',
                    'admins',
                ],
                optional=[
                    'semester',
                    'form',
                    'permission',
                    'remark',
                    'has_payments',
                    'more_exams_link',
                    'experts',
                    'attachments',
                ]
            )
            new_category = Category(
                displayname=category['category'],
                slug=category['slug'],
                form=category.safe_get('form', 'written'),
                remark=category.safe_get('remark', ''),
                semester=category.safe_get('semester', '--'),
                permission=category.safe_get('permission', 'public'),
                more_exams_link=category.safe_get('more_exams_link', ''),
                has_payments=category.safe_get('has_payments', False),
            )
            new_category.save()
            for username in category['admins']:
                new_category.admins.add(self.get_or_create_user(username))
            for username in category.safe_get('experts', []):
                new_category.experts.add(self.get_or_create_user(username))
            for attachment in category.safe_get('attachments', []):
                self.stdout.write('Category {} has attachments!'.format(category['category']))
                raise BuggyCodeException()
            new_category.save()
            category.check()

    def migrate_meta_categories(self):
        self.stdout.write('Migrate meta categories')
        for meta_category in self.meta_category.find({}):
            meta_category = self.check_obj_keys(
                'Meta Category', meta_category,
                required=[
                    '_id',
                    'meta2',
                    'displayname',
                    'order',
                ],
                optional=[]
            )
            new_meta_category = MetaCategory(
                displayname=meta_category['displayname'],
                order=meta_category['order'],
                parent=None
            )
            new_meta_category.save()
            for meta2 in meta_category['meta2']:
                meta2 = self.check_obj_keys(
                    'Meta2 Category', meta2,
                    required=[
                        'displayname',
                        'order',
                        'categories'
                    ],
                    optional=[]
                )
                new_meta2_category = MetaCategory(
                    displayname=meta2['displayname'],
                    order=meta2['order'],
                    parent=new_meta_category,
                )
                new_meta2_category.save()
                for category in meta2['categories']:
                    if category == 'Cryptographic Foundations':
                        category = 'Cryptography Foundations'
                    new_category = Category.objects.get(displayname=category)
                    new_meta2_category.category_set.add(new_category)
                new_meta2_category.save()
                meta2.check()
            meta_category.check()

    def migrate_exams(self):
        self.stdout.write('Migrate exams')
        for exam in self.exam_metadata.find({}):
            if exam.get('needs_payment') in ['true', '']:
                # WTF how did this happen???
                self.stdout.write('Exam {} has invalid needs_payment: "{}", changed to {}'.format(exam['resolve_alias'], exam['needs_payment'], exam['needs_payment'] == 'true'))
                exam['needs_payment'] = exam['needs_payment'] == 'true'
            exam = self.check_obj_keys(
                'Exam', exam,
                required=[
                    '_id',
                    'filename',
                    'count_cuts',
                    'count_answers',
                    'count_answered',
                    'displayname',
                    'category',
                ],
                optional=[
                    'public',
                    'finished_cuts',
                    'finished_wiki_transfer',
                    'resolve_alias',
                    'examtype',
                    'legacy_solution',
                    'master_solution',
                    'remark',
                    'attachments',
                    'needs_payment',
                    'solution_printonly',
                    'has_solution',
                    'has_printonly',
                    'import_claim',
                    'import_claim_displayname',
                    'import_claim_time',
                    'is_payment_exam',
                    'payment_exam_checked',
                    'payment_uploader',
                    'payment_uploader_displayname',
                ]
            )
            exam.ignore('count_cuts', 'count_answers', 'count_answered')

            exam_type_translation = {
                '': 'Exams',
                'Midterm': 'Midterms',
                'Oral Exam Report': 'Transcripts',
            }

            exam_type, created = ExamType.objects.get_or_create(
                displayname=exam_type_translation.get(
                    exam.safe_get('examtype', 'Exams'),
                    exam.safe_get('examtype', 'Exams')
                )
            )

            if created:
                self.stdout.write('Created new exam type {}.'.format(exam_type.displayname))
            new_exam = Exam(
                filename=exam['filename'],
                displayname=exam['displayname'],
                category=Category.objects.get(displayname=exam['category']),
                exam_type=exam_type,
                remark=exam.safe_get('remark', ''),
                resolve_alias=exam.safe_get('resolve_alias', ''),
                public=exam.safe_get('public', False),
                finished_cuts=exam.safe_get('finished_cuts', False),
                finished_wiki_transfer=exam.safe_get('finished_wiki_transfer', False),
                needs_payment=exam.safe_get('needs_payment', False),
                is_printonly=exam.safe_get('has_printonly', False),
                has_solution=exam.safe_get('has_solution', False),
                solution_printonly=exam.safe_get('solution_printonly', False),
                master_solution=exam.safe_get('master_solution', ''),
                legacy_solution=exam.safe_get('legacy_solution', ''),
                is_oral_transcript=exam.safe_get('is_payment_exam', False),
                oral_transcript_uploader=self.get_or_create_user(exam.safe_get('payment_uploader', None), exam.safe_get('payment_uploader_displayname', None)),
                oral_transcript_checked=exam.safe_get('payment_exam_checked', False),
            )
            if exam.safe_get('import_claim', None):
                new_exam.import_claim = self.get_or_create_user(
                    exam['import_claim'],
                    exam['import_claim_displayname']
                )
                new_exam.import_claim_time = self.parse_iso_datetime(exam['import_claim_time'])
            else:
                exam.ignore('import_claim_displayname', 'import_claim_time')
            new_exam.save()
            for attachment in exam.safe_get('attachments', []):
                attachment = self.check_obj_keys(
                    'Attachment', attachment,
                    required=[
                        'displayname',
                        'filename'
                    ],
                    optional=[]
                )
                new_attachment = Attachment(
                    displayname=attachment['displayname'],
                    filename=attachment['filename'],
                )
                new_attachment.save()
                new_attachment.exam = new_exam
                new_attachment.save()
                attachment.check()
                if self.add_dummy_files:
                    minio_util.save_file_to_minio(settings.COMSOL_FILESTORE_DIR, new_attachment.filename, 'exam10.pdf')

            if self.add_dummy_files:
                minio_util.save_file_to_minio(settings.COMSOL_EXAM_DIR, new_exam.filename, 'exam10.pdf')
                if new_exam.has_solution:
                    minio_util.save_file_to_minio(settings.COMSOL_SOLUTION_DIR, new_exam.filename, 'exam10.pdf')
                if new_exam.is_printonly:
                    minio_util.save_file_to_minio(settings.COMSOL_PRINTONLY_DIR, new_exam.filename, 'exam10.pdf')

            exam.check()

    def migrate_answers_and_comments(self):
        self.stdout.write('Migrate answers and comments')
        for section in self.answer_sections.find({}):
            section = self.check_obj_keys(
                'Section', section,
                required=[
                    '_id',
                    'answersection',
                    'relHeight',
                    'pageNum',
                    'filename',
                    'cutVersion',
                ],
                optional=[]
            )
            answer_section = self.check_obj_keys(
                'Answer Section', section['answersection'],
                required=[
                    'asker',
                    'askerDisplayName',
                    'answers'
                ],
                optional=[]
            )
            new_answer_section = AnswerSection(
                exam=Exam.objects.get(filename=section['filename']),
                author=self.get_or_create_user(answer_section['asker'], answer_section['askerDisplayName']),
                page_num=section['pageNum'],
                rel_height=section['relHeight'],
                cut_version=section['cutVersion']
            )
            new_answer_section.save()
            for answer in answer_section['answers']:
                answer = self.check_obj_keys(
                    'Answer', answer,
                    required=[
                        '_id',
                        'authorId',
                        'authorDisplayName',
                        'text',
                        'comments',
                        'upvotes',
                        'downvotes',
                        'expertvotes',
                        'flagged',
                        'time',
                        'edittime',
                    ],
                    optional=[]
                )
                if answer['text'] == '':
                    continue
                if answer['authorId'] == '__legacy__':
                    # We do not know the exact author, so we just assume it was the one who set the cuts
                    is_legacy_answer = True
                    author = self.get_or_create_user(answer_section['asker'], answer_section['askerDisplayName'])
                    answer.ignore('authorDisplayName')
                else:
                    is_legacy_answer = False
                    author = self.get_or_create_user(answer['authorId'], answer['authorDisplayName'])
                new_answer = Answer(
                    answer_section=new_answer_section,
                    author=author,
                    text=answer['text'],
                    time=self.parse_iso_datetime(answer['time']),
                    edittime=self.parse_iso_datetime(answer['edittime']),
                    is_legacy_answer=is_legacy_answer,
                    long_id=str(answer['_id']),
                )
                new_answer.save()
                for upvote in answer['upvotes']:
                    new_answer.upvotes.add(self.get_or_create_user(upvote))
                for downvote in answer['downvotes']:
                    new_answer.downvotes.add(self.get_or_create_user(downvote))
                for expertvote in answer['expertvotes']:
                    new_answer.expertvotes.add(self.get_or_create_user(expertvote))
                for flag in answer['flagged']:
                    new_answer.flagged.add(self.get_or_create_user(flag))
                new_answer.save()

                for comment in answer['comments']:
                    comment = self.check_obj_keys(
                        'Comment', comment,
                        required=[
                            '_id',
                            'authorId',
                            'authorDisplayName',
                            'text',
                            'time',
                        ],
                        optional=[
                            'edittime',
                        ]
                    )
                    new_comment = Comment(
                        answer=new_answer,
                        author=self.get_or_create_user(comment['authorId'], comment['authorDisplayName']),
                        text=comment['text'],
                        time=self.parse_iso_datetime(comment['time']),
                        edittime=self.parse_iso_datetime(comment.safe_get('edittime', comment['time'])),
                        long_id=str(comment['_id'])
                    )
                    new_comment.save()
                    comment.check()

                answer.check()
            answer_section.check()
            section.check()

    def migrate_payments(self):
        self.stdout.write('Migrate payments')
        for payment in self.payments.find({}):
            payment = self.check_obj_keys(
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
            payment.ignore('active')
            new_payment = Payment(
                user=self.get_or_create_user(payment['username']),
                payment_time=self.parse_iso_datetime(payment['payment_time']),
                check_time=self.parse_iso_datetime(payment['check_time']) if payment['check_time'] else None,
                refund_time=self.parse_iso_datetime(payment['refund_time']) if payment['refund_time'] else None,
                uploaded_transcript=Exam.objects.get(filename=payment['uploaded_filename']) if payment['uploaded_filename'] else None,
            )
            new_payment.save()
            payment.check()

    def migrate_notifications(self):
        self.stdout.write('Migrate notifications')
        for user in self.user_data.find({}):
            try:
                new_user = MyUser.objects.get(username=user['username'])
            except MyUser.DoesNotExist:
                # We did not migrate the user because it is not a real one
                continue
            for notification in user['notifications']:
                notification = self.check_obj_keys(
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
                if notification['receiver'] != new_user.username:
                    self.stdout.write('Notification receiver is not current user.')
                    raise BuggyCodeException()
                answer_long_id = notification['link'].split('#')[-1]
                linked_answer = Answer.objects.filter(long_id=answer_long_id).first()
                if not linked_answer:
                    self.stdout.write('Linked answer ({}) of notification deleted, ignore notification'.format(notification['link']))
                    continue
                new_notification = Notification(
                    sender=self.get_or_create_user(notification['sender'], notification['senderDisplayName']),
                    receiver=new_user,
                    type=notification['type'],
                    time=self.parse_iso_datetime(notification['time']),
                    title=notification['title'],
                    text=notification['message'],
                    answer=linked_answer,
                    read=notification['read'],
                )
                new_notification.save()
                notification.check()

    def handle(self, *args, **options):
        if options['flush_db']:
            self.flush_db()
        self.add_dummy_files = options['add_dummy_files']
        self.no_people = options['no_people']

        self.connect_mongodb()
        if options['flush_db']:
            self.migrate_users()
            self.migrate_feedback()
            self.migrate_images()
            self.migrate_categories()
            self.migrate_meta_categories()
            self.migrate_exams()
            self.migrate_answers_and_comments()
            self.migrate_payments()
        self.migrate_notifications()

        self.stdout.write('Finished migration!')
        self.stdout.write('{} Users'.format(MyUser.objects.count()))
        self.stdout.write('{} Categories'.format(Category.objects.count()))
        self.stdout.write('{} Answer Sections'.format(AnswerSection.objects.count()))
        self.stdout.write('{} Exams'.format(Exam.objects.count()))
        self.stdout.write('{} Answers'.format(Answer.objects.count()))
        self.stdout.write('{} Comments'.format(Comment.objects.count()))
