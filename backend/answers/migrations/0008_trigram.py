from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('answers', '0007_analyze_exams'),
    ]
    operations = [
        TrigramExtension(),
    ]
