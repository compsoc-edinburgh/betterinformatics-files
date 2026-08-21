# Written manually on 2020.08.21

from django.db import migrations, models
import datetime

def populate_sources(apps, schema_editor):
    CourseStats = apps.get_model("categories", "CourseStats")
    for stat in CourseStats.objects.all():

        if stat.academic_year == "2017-18":
            stat.source_name = "web.inf.ed.ac.uk"
            stat.source_date = datetime.date(2018, 10, 18)

        elif stat.academic_year == "2018-19":
            stat.source_name = "web.inf.ed.ac.uk"
            stat.source_date = datetime.date(2019, 7, 10)

        elif stat.academic_year == "2019-20":
            stat.source_name = "web.inf.ed.ac.uk"
            stat.source_date = datetime.date(2020, 8, 5)

        elif stat.academic_year == "2020-21":
            stat.source_name = "web.inf.ed.ac.uk"
            stat.source_date = datetime.date(2021, 7, 8)

        elif stat.academic_year == "2021-22":
            stat.source_name = "web.inf.ed.ac.uk"
            stat.source_date = datetime.date(2022, 7, 4)

        elif stat.academic_year == "2022-23":
            stat.source_name = "web.inf.ed.ac.uk"
            stat.source_date = datetime.date(2023, 7, 11)

        elif stat.academic_year == "2023-24":
            stat.source_name = "sharepoint"
            stat.source_date = datetime.date(2025, 9, 14)

        elif stat.academic_year == "2024-25":
            stat.source_name = "sharepoint"
            stat.source_date = datetime.date(2025, 9, 14)

        stat.save()

class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0022_coursestats_add_student_count'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='coursestats',
            options={'ordering': ['course_code__code', 'academic_year', 'source_date']},
        ),
        migrations.AddField(
            model_name='coursestats',
            name='source_date',
            field=models.DateField(null=True),
        ),
        migrations.AddField(
            model_name='coursestats',
            name='source_name',
            field=models.CharField(null=True, max_length=256),
        ),
        migrations.RunPython(
            code=populate_sources,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='coursestats',
            name='source_date',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='coursestats',
            name='source_name',
            field=models.CharField(max_length=256),
        ),
        migrations.AddConstraint(
            model_name='coursestats',
            constraint=models.UniqueConstraint(fields=('course_code', 'academic_year', 'source_name', 'source_date'), name='unique_course_stats'),
        ),
    ]
