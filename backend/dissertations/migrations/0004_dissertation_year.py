# Generated by Django 4.1.13 on 2025-06-28 19:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dissertations', '0003_dissertation_grade_band'),
    ]

    operations = [
        migrations.AddField(
            model_name='dissertation',
            name='year',
            field=models.IntegerField(default=2025),
        ),
    ]
