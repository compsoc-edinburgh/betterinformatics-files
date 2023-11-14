# Created by hand on the 17. May 2023

from django.db import migrations


def rename_categories(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    for document in Document.objects.all():
        if document.display_name.strip() == "":
            document.display_name = "<empty label>"
            document.save()

    # additionally renames files with the brain emoji as a slug
    cnt = 0
    for document in Document.objects.filter(slug__startswith="🧠"):
        slug = "invalid_name"
        while Document.objects.filter(slug=slug).exists():
            slug = f"invalid_name_{cnt}"
            cnt += 1
        document.slug = slug
        document.save()


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0007_auto_20210513_1321"),
    ]

    operations = [
        migrations.RunPython(rename_categories),
    ]
