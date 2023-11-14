# Created by hand on the 17. May 2023

from django.db import migrations, models


def remove_duplicates(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    slug_set = Document.objects.values("slug").annotate(
        dcount=models.Count("slug")).filter(dcount__gt=1)  # dcount > 1
    for odoc in slug_set:
        oslug = odoc["slug"]
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
        ("documents", "0008_rename_empty_documents"),
    ]

    operations = [
        migrations.RunPython(remove_duplicates),
    ]
