# Written manually on 2026.08.20. *Should* be revertible...

# Changes the course_code field in CourseStats to an FK
# Adds a JSONB field for percentile course stats
# Some cleanup like adding uniqueness constraints and making field declarations
#   consistent


import django.db.models.deletion
from django.db import migrations, models

def convert_to_link(apps, schema_editor):
    CourseStats = apps.get_model("categories", "CourseStats")
    EuclidCode = apps.get_model("categories", "EuclidCode")

    for stats in CourseStats.objects.all():
        code = stats.course_code
        euclid_code = EuclidCode.objects.filter(code=code).first()
        if euclid_code is None:
            euclid_code = EuclidCode.objects.create(code=code, category=None)
        stats.course_code_link = euclid_code
        stats.save()

def unconvert_from_link(apps, schema_editor):
    CourseStats = apps.get_model("categories", "CourseStats")

    for stats in CourseStats.objects.all():
        stats.course_code = stats.course_code_link.code
        stats.save()


def delete_categoryless_codes(apps, schema_editor):
    EuclidCode = apps.get_model("categories", "EuclidCode")
    EuclidCode.objects.filter(category=None).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0020_examcounts_add_bitmask'),
    ]

    operations = [
        migrations.AddField(
            model_name='coursestats',
            name='percentiles',
            field=models.JSONField(default={}),
            preserve_default=False,
        ),
        # Enforce uniqueness
        migrations.AlterField(
            model_name='euclidcode',
            name='code',
            field=models.CharField(max_length=12, unique=True),
        ),
        # Add None to allow euclid code without a category
        # (Needed since some course stats are not categories, like minf thesis)
        migrations.AlterField(
            model_name='euclidcode',
            name='category',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='euclid_codes', to='categories.category'),
        ),

        # Reverse constraint flush in case we need to roll back the migration
        migrations.RunSQL(
            sql=migrations.RunSQL.noop,
            reverse_sql="SET CONSTRAINTS ALL IMMEDIATE",
        ),

        # On the reverse path, delete any EuclidCodes without a category
        migrations.RunPython(code=migrations.RunPython.noop, reverse_code=delete_categoryless_codes),

        # Change course_code to foreignkey
        # steps as described in https://stackoverflow.com/a/36000084
        migrations.AddField(
            model_name='coursestats',
            name='course_code_link',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='stats',
                to='categories.euclidcode',
                # Temporarily allow null during this migration
                null=True,
            ),
        ),
        # Reverse constraint flush in case we need to roll back the migration
        migrations.RunSQL(
            sql=migrations.RunSQL.noop,
            reverse_sql="SET CONSTRAINTS ALL IMMEDIATE",
        ),
        migrations.RunPython(code=convert_to_link, reverse_code=unconvert_from_link),
        # Need to flush the constraints before we can fiddle around with the
        # FK fields, otherwise Django complains about not wanting to alter table
        # with pending trigger events.
        migrations.RunSQL(
            sql="SET CONSTRAINTS ALL IMMEDIATE",
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Set a default value for the course_code field, which doesn't do much
        # in forward (since the field is removed in the next line) but is crucial
        # for backwards migration, otherwise un-RemoveField will try to create
        # a non-nullable field with no default value and fail
        migrations.AlterField(
            model_name='coursestats',
            name='course_code',
            field=models.CharField(max_length=12, db_index=True, default=''),
        ),
        migrations.RemoveField(
            model_name='coursestats',
            name='course_code',
        ),
        migrations.RenameField(
            model_name='coursestats',
            old_name='course_code_link',
            new_name='course_code',
        ),
        migrations.AlterField(
            model_name='coursestats',
            name='course_code',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='stats',
                to='categories.euclidcode',
                # Disallow nulls
                null=False,
            ),
        ),

        # Remove blank=True (which only affects Django's admin interface)
        migrations.AlterField(
            model_name='coursestats',
            name='course_organiser',
            field=models.CharField(max_length=256, null=True),
        ),
        migrations.AlterField(
            model_name='coursestats',
            name='mean_mark',
            field=models.FloatField(null=True),
        ),
        migrations.AlterField(
            model_name='coursestats',
            name='std_deviation',
            field=models.FloatField(null=True),
        ),
    ]
