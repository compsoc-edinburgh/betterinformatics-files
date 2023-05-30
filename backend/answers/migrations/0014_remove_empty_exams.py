# Created by hand on the 17. May 2023

from django.db import migrations


def rename_exams(apps, schema_editor):
    Exam = apps.get_model("answers", "Exam")
    Exam.objects.filter(displayname="").update(displayname="<empty label>")


class Migration(migrations.Migration):
    dependencies = [
        ("answers", "0013_alter_comment_answer"),
    ]

    operations = [
        migrations.RunPython(rename_exams)
    ]
