# Created by hand on the 17. May 2023

import django.contrib.postgres.indexes
from django.db import migrations, models


def rename_categories(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    Document.objects.filter(display_name="").update(
        display_name="<empty label>")
    cnt = 0
    for document in Document.objects.filter(slug__startswith="🧠"):
        slug = "invalid_name"
        while Document.objects.filter(slug=slug).exists():
            slug = f"invalid_name_{cnt}"
            cnt += 1
        document.slug = slug
        document.save()


def remove_duplicates(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    slug_set = Document.objects.values("slug").annotate(
        dcount=models.Count("slug")).filter(dcount__gt=1)  # dcount > 1
    for oslug in slug_set:
        similar_set = Document.objects.filter(slug=oslug)
        cnt = 0
        for document in similar_set:
            slug = oslug
            while Document.objects.filter(slug=slug).exists():
                slug = f"{oslug}_{cnt}"
                cnt += 1
            document.slug = slug
            document.save()


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0007_auto_20210513_1321"),
    ]

    operations = [
        migrations.RunPython(rename_categories),
        migrations.RunPython(remove_duplicates),
        migrations.RemoveIndex(
            model_name='comment',
            name='documents_c_search__02d77d_gin',
        ),
        migrations.AlterField(
            model_name='document',
            name='slug',
            field=models.CharField(max_length=256, unique=True),
        ),
        migrations.AddIndex(
            model_name='comment',
            index=django.contrib.postgres.indexes.GinIndex(
                fields=['search_vector'], name='documents_c_search__fb153e_gin'),
        ),
    ]
