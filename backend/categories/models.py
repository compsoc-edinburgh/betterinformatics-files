from django.db import models


class Category(models.Model):
    displayname = models.CharField(max_length=256)
    slug = models.CharField(max_length=256)
    admins = models.ManyToManyField('auth.User', related_name='category_admin_set')
    experts = models.ManyToManyField('auth.User', related_name='category_expert_set')


class MetaCategory(models.Model):
    displayname = models.CharField(max_length=256)
    parent = models.ForeignKey('MetaCategory', null=True, on_delete=models.CASCADE)
