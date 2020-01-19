from django.db import models
from django.db.models import Exists, OuterRef
from answers.models import Answer, AnswerSection


class Category(models.Model):
    displayname = models.CharField(max_length=256)
    slug = models.CharField(max_length=256, unique=True)
    form = models.CharField(max_length=256, choices=[(x, x) for x in ['written', 'oral']], default='written')
    remark = models.TextField(default='')
    semester = models.CharField(max_length=2, choices=[(x, x) for x in ['--', 'FS', 'HS']], default='--')
    permission = models.CharField(max_length=64, choices=[(x, x) for x in ['public', 'intern', 'hidden', 'none']], default='public')
    more_exams_link = models.CharField(max_length=512, default='')
    has_payments = models.BooleanField(default=False)
    admins = models.ManyToManyField('auth.User', related_name='category_admin_set')
    experts = models.ManyToManyField('auth.User', related_name='category_expert_set')
    meta_categories = models.ManyToManyField('MetaCategory', related_name='category_set')

    def exam_count_answered(self):
        return self.exam_set.filter(public=True).filter(
            Exists(Answer.objects.filter(
                answer_section__exam=OuterRef('pk')
            ))
        ).count()

    def answer_progress(self):
        total_cuts = AnswerSection.objects.filter(
            exam__category=self, exam__public=True
        ).count()
        if total_cuts == 0:
            return 0
        answered_cuts = AnswerSection.objects.filter(
            exam__category=self, exam__public=True
        ).filter(
            Exists(Answer.objects.filter(answer_section=OuterRef('pk')))
        ).count()
        return answered_cuts / total_cuts


class MetaCategory(models.Model):
    displayname = models.CharField(max_length=256)
    parent = models.ForeignKey('MetaCategory', null=True, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
