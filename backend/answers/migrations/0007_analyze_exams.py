from django.db import migrations
import tempfile
from backend import settings
from util import minio_util
from answers import pdf_utils
from answers.models import Exam


def forwards_func(apps, schema_editor):
    all_exams = Exam.objects.all()
    base_path = settings.COMSOL_UPLOAD_FOLDER
    with tempfile.TemporaryDirectory(dir=base_path) as tmpdirname:
        for exam in all_exams:
            print("Analyzing {exam}".format(exam=exam))
            filename = exam.filename
            minio_util.save_file(settings.COMSOL_EXAM_DIR,
                                 filename, tmpdirname + filename)
            res = pdf_utils.analyze_pdf(exam, tmpdirname + filename)
            print(
                "Analyzed {filename} - {res}".format(filename=exam.filename, res=res))
def reverse_func(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('answers', '0006_auto_20200602_1436'),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
