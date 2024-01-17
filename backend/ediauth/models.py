import datetime

from django.db import models
from django.contrib.auth.models import User


# The 'default' parameter of a field has to be a callable (for it to be run on
# row insert and not when evaluated in code), so either a lambda or a function
# name. But Django can't serialize lambdas for making database migration files,
# (https://docs.djangoproject.com/en/dev/topics/migrations/#serializing-values)
# so we use a small proxy function instead.
def current_time():
    return datetime.datetime.now(datetime.timezone.utc)


class VerificationCode(models.Model):
    """Table to store verification codes for users while they are logging in.
    The verification code is sent to the user's email address, and afterwards stored in this table with an expiry of 1 hour.

    Parameters
    ----------
    models : _type_
        _description_
    """

    # UUN is primary key so there will only be one row per UUN at any point
    uun = models.CharField(
        primary_key=True, max_length=150
    )  # Same length as Django username field
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(
        # Automatically set the time to now when the row is created, if it isn't
        # explicitly passed in, just in case
        default=current_time
    )


class Profile(models.Model):
    display_username = models.CharField(max_length=256)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )  # Delete this profile if the user is deleted
