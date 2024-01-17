# Written manually by Yuto Takano on 2024/01/17

# This migration is to remove the primary key from the display_username field
# in the Profile model. This is because the display_username field is not
# guaranteed to be unique (at least in the Edinburgh model, where it's fully
# cosmetic and customisable). We can't just remove the primary key constraint
# because if we try to do that, Django will attempt to add a new replacement
# "id" primary key AutoField but fail since there are data already (and it will
# request a default value, but providing that will create duplicate IDs).
#
# Our solution is to add a new IntegerField "id", fill it with incremental
# integers, and then make it AutoField and mark it as the primary key.

from django.db import migrations, models


def fill_incremental_id(apps, schema_editor):
    Profile = apps.get_model("ediauth", "Profile")
    db_alias = schema_editor.connection.alias
    profiles = Profile.objects.using(db_alias).all()
    for i, profile in enumerate(profiles):
        profile.id = i
    Profile.objects.using(db_alias).bulk_update(profiles, ["id"])


class Migration(migrations.Migration):
    dependencies = [
        ("ediauth", "0005_alter_default_for_verificationcode_created_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="id",
            field=models.IntegerField(null=True),
        ),
        migrations.RunPython(
            fill_incremental_id, reverse_code=migrations.RunPython.noop
        ),
        migrations.AlterField(
            model_name="profile",
            name="display_username",
            field=models.CharField(max_length=256),
        ),
        migrations.AlterField(
            model_name="profile",
            name="id",
            field=models.AutoField(
                primary_key=True,
                serialize=False,
                verbose_name="ID",
            ),
            preserve_default=False,
        ),
    ]
