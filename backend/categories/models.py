from django.db import models


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


class MetaCategory(models.Model):
    displayname = models.CharField(max_length=256)
    parent = models.ForeignKey('MetaCategory', null=True, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
