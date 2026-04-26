# Written manually by Nikhen Sanjaya Nyo on 2025/10/20

# What is the reason for this migration?
# This migration is meant to be part of the "Course Testimonials" new feature. When a user's testimonial
# is approved/rejected, a notification is sent to this user. This notification setting can be enabled/disabled
# by the user themselves. But we wanted to automatically enable this setting for existing users so that they are
# informed if a testimonial they added has been accepted/rejected.

# What does this migration do?
# For every user, this migration will add a new NotificationSetting record for this user for 
# NotificationType.UPDATE_TO_TESTIMONIAL_STATUS such that it is enabled for the user.

from django.db import migrations, models
from notifications.models import NotificationType

def add_testimonial_status_notificating_setting_existing_users(apps, schema_editor):
    Profile = apps.get_model("ediauth", "Profile")
    NotificationSetting = apps.get_model("notifications", "NotificationSetting")

    db_alias = schema_editor.connection.alias
    profiles = Profile.objects.using(db_alias).all()

    NotificationSetting.objects.using(db_alias).bulk_create(
        NotificationSetting(user=profile.user, type=NotificationType.UPDATE_TO_TESTIMONIAL_APPROVAL_STATUS.value) for profile in profiles
    )

def reverse_migration(apps, schema_editor):
    NotificationSetting = apps.get_model("notifications", "NotificationSetting")

    db_alias = schema_editor.connection.alias

    NotificationSetting.objects.using(db_alias).filter(
        type=NotificationType.UPDATE_TO_TESTIMONIAL_APPROVAL_STATUS.value
    ).delete()

class Migration(migrations.Migration):
    dependencies = [
        ("ediauth", "0006_profile_remove_primary_key_from_display_username"),
        ("notifications", "0003_notificationsetting_email_enabled"),
    ]

    operations = [
        migrations.RunPython(
            add_testimonial_status_notificating_setting_existing_users, reverse_code=reverse_migration
        )
    ]
