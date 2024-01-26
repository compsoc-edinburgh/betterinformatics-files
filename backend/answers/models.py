from django.db import models
from django.utils import timezone
from myauth import auth_check
from django.db.models import Exists, OuterRef
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from util.models import CommentMixin
from django_prometheus.models import ExportModelOperationsMixin

import random


class Exam(ExportModelOperationsMixin('exam'), models.Model):
    filename = models.CharField(max_length=256, unique=True)
    displayname = models.CharField(max_length=256)
    category = models.ForeignKey(
        'categories.Category', null=True, on_delete=models.SET_NULL)
    exam_type = models.ForeignKey('ExamType', on_delete=models.PROTECT)
    remark = models.TextField()
    resolve_alias = models.CharField(max_length=256)

    public = models.BooleanField(default=False)
    finished_cuts = models.BooleanField(default=False)
    needs_payment = models.BooleanField(default=False)

    import_claim = models.ForeignKey(
        'auth.User', related_name='import_claim_set', null=True, on_delete=models.SET_NULL)
    import_claim_time = models.DateTimeField(null=True)

    is_printonly = models.BooleanField(default=False)

    has_solution = models.BooleanField(default=False)
    solution_printonly = models.BooleanField(default=False)
    master_solution = models.CharField(max_length=512)

    is_oral_transcript = models.BooleanField(default=False)
    oral_transcript_uploader = models.ForeignKey(
        'auth.User', related_name='oral_transcript_set', null=True, on_delete=models.SET_NULL)
    oral_transcript_checked = models.BooleanField(default=False)

    search_vector = SearchVectorField()

    class Meta:
        indexes = [GinIndex(fields=["search_vector"])]

    def current_user_can_view(self, request):
        is_admin = auth_check.has_admin_rights_for_exam(request, self)
        if is_admin:
            return True
        if not self.public:
            return False
        if self.needs_payment and not request.user.has_payed():
            return False
        if (
            self.oral_transcript_uploader is not None
            and self.oral_transcript_uploader.pk == request.user.pk
        ):
            return True
        return True

    def attachment_name(self):
        return (self.category.displayname + '__' + self.displayname + '.pdf').replace(' ', '_')

    def sort_key(self):
        end = 0
        while end + 1 < len(self.displayname) and self.displayname[-end-1:].isdigit():
            end += 1
        if end == 0:
            return 0, self.displayname
        return int(self.displayname[-end:]), self.displayname

    def count_answered(self):
        return self.answersection_set.filter(
            Exists(Answer.objects.filter(answer_section=OuterRef('pk')))
        ).count()


class ExamPage(models.Model):
    exam = models.ForeignKey(
        'Exam', on_delete=models.CASCADE, related_name='pages')
    page_number = models.IntegerField()
    width = models.FloatField()
    height = models.FloatField()
    text = models.TextField()

    search_vector = SearchVectorField()

    class Meta:
        indexes = [GinIndex(fields=["search_vector"])]


class ExamPageFlow(models.Model):
    page = models.ForeignKey(
        'ExamPage', on_delete=models.CASCADE, related_name='flows')
    order = models.IntegerField(default=0)


class ExamWord(models.Model):
    flow = models.ForeignKey(
        'ExamPageFlow', on_delete=models.CASCADE, related_name='words')
    order = models.IntegerField(default=0)
    content = models.TextField()
    x_min = models.FloatField()
    y_min = models.FloatField()
    x_max = models.FloatField()
    y_max = models.FloatField()


class ExamType(models.Model):
    displayname = models.CharField(max_length=256)
    order = models.IntegerField(default=0)


class AnswerSection(models.Model):
    exam = models.ForeignKey('Exam', on_delete=models.CASCADE)
    author = models.ForeignKey(
        'auth.User', null=True, on_delete=models.SET_NULL)
    page_num = models.IntegerField()
    rel_height = models.FloatField()
    cut_version = models.IntegerField(default=1)
    name = models.CharField(max_length=256, default="")
    hidden = models.BooleanField(default=False)
    has_answers = models.BooleanField(default=True)


def generate_long_id():
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    res = ""
    while len(res) < 16:
        res += random.choice(chars)
    if Answer.objects.filter(long_id=res).exists():
        return generate_long_id()
    return res


class Answer(ExportModelOperationsMixin('answer'), models.Model):
    answer_section = models.ForeignKey(
        'AnswerSection', on_delete=models.CASCADE)
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    text = models.TextField()
    time = models.DateTimeField(default=timezone.now)
    edittime = models.DateTimeField(default=timezone.now)
    upvotes = models.ManyToManyField(
        'auth.User', related_name='upvoted_answer_set')
    downvotes = models.ManyToManyField(
        'auth.User', related_name='downvoted_answer_set')
    expertvotes = models.ManyToManyField(
        'auth.User', related_name='expertvote_answer_set')
    flagged = models.ManyToManyField(
        'auth.User', related_name='flagged_answer_set')
    is_legacy_answer = models.BooleanField(default=False)
    long_id = models.CharField(
        max_length=256, default=generate_long_id, unique=True)

    search_vector = SearchVectorField()

    class Meta:
        indexes = [GinIndex(fields=["search_vector"])]

class Comment(ExportModelOperationsMixin('comment'), CommentMixin):
    answer = models.ForeignKey('Answer', on_delete=models.CASCADE, related_name="comments")
    long_id = models.CharField(
        max_length=256, default=generate_long_id, unique=True)
