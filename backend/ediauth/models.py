from django.db import models
from django.contrib.auth.models import User


class VerificationCode(models.Model):
    """Table to store verification codes for users while they are logging in.
    The verification code is sent to the user's email address, and afterwards stored in this table with an expiry of 1 hour.

    Parameters
    ----------
    models : _type_
        _description_
    """

    uun = models.CharField(
        primary_key=True, max_length=150
    )  # Same length as Django username field
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)  # UTC


class Profile(models.Model):
    display_username = models.CharField(max_length=256, primary_key=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )  # Delete this profile if the user is deleted
