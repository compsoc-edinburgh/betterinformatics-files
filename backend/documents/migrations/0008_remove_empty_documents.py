# Created by hand on the 17. May 2023

import django.contrib.postgres.indexes
from django.db import migrations, models


def rename_categories(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    Document.objects.filter(display_name="").update(
        display_name="<empty label>")
    Document.objects.filter(slug__startswith="🧠").update(slug="invalid_name")


def remove_duplicates(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    slug_set = Document.objects.values("slug").annotate(
        dcount=models.Count("slug")).filter(dcount__gt=1)  # dcount > 1
    for oslug in slug_set:
        similar_set = Document.objects.filter(slug=oslug)
        for cnt, document in enumerate(similar_set):
            if cnt == 0:
                continue
            document.slug = f"{oslug}_{cnt-1}"
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
