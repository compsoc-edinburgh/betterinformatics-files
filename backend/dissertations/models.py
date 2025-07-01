from django.db import models
from django.conf import settings

class Dissertation(models.Model):
    STUDY_LEVEL_CHOICES = [
        ('UG4', 'UG4'),
        ('UG5', 'UG5'),
        ('MSc', 'MSc'),
    ]

    GRADE_BAND_CHOICES = [
        ('40-49', '40-49'),
        ('50-59', '50-59'),
        ('60-69', '60-69'),
        ('70-79', '70-79'),
        ('80-89', '80-89'),
        ('90-100', '90-100'),
    ]

    title = models.CharField(max_length=255)
    field_of_study = models.CharField(max_length=255)
    supervisors = models.CharField(max_length=255)  # Can be a comma-separated list
    notes = models.TextField(blank=True, null=True)
    file_path = models.CharField(max_length=512)  # Path to the PDF in Minio
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    study_level = models.CharField(max_length=3, choices=STUDY_LEVEL_CHOICES, default='UG4')
    grade_band = models.CharField(max_length=6, choices=GRADE_BAND_CHOICES, blank=True, null=True)
    year = models.IntegerField(default=2025) # New field for dissertation year

    def __str__(self):
        return self.title