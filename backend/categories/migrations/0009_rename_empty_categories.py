# Created by hand on the 17. May 2023

from django.db import migrations


def rename_categories(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    Category.objects.filter(displayname="").update(displayname="<empty name>")
    for category in Category.objects.all():
        if category.displayname.strip() == "":
            category.displayname = "<empty label>"
            category.save()
    Category.objects.filter(slug="").update(slug="invalid_name")


class Migration(migrations.Migration):
    dependencies = [
        ("categories", "0008_count_ignore_hidden"),
    ]

    operations = [
        migrations.RunPython(rename_categories)
    ]
