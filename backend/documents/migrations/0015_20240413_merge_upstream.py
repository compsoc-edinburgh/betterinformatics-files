# Generated by Django 4.1.13 on 2024-03-14 16:29

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    replaces = [("documents", "0014_document_edittime_document_time")]

    dependencies = [
        ('documents', '0014_document_anonymised'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='edittime',
            field=models.DateTimeField(default=None, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='time',
            field=models.DateTimeField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name='document',
            name='edittime',
            field=models.DateTimeField(default=django.utils.timezone.now, null=True),
        ),
        migrations.AlterField(
            model_name='document',
            name='time',
            field=models.DateTimeField(default=django.utils.timezone.now, null=True),
        ),
    ]
