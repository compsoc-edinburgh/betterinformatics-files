from django.db import migrations
import tempfile
from backend import settings
from util import s3_util
from answers import pdf_utils
import logging

logger = logging.getLogger(__name__)


def forwards_func(apps, schema_editor):
    Exam = apps.get_model("answers", "Exam")
    ExamPage = apps.get_model("answers", "ExamPage")
    ExamPageFlow = apps.get_model("answers", "ExamPageFlow")
    ExamWord = apps.get_model("answers", "ExamWord")
    all_exams = Exam.objects.all()
    base_path = settings.COMSOL_UPLOAD_FOLDER
    total = len(all_exams)
    finished = 0
    with tempfile.TemporaryDirectory(dir=base_path) as tmpdirname:
        for exam in all_exams:
            filename = exam.filename
            s3_util.save_file(settings.COMSOL_EXAM_DIR, filename, tmpdirname + filename)
            res = pdf_utils.analyze_pdf(
                exam,
                tmpdirname + filename,
                ExamPage=ExamPage,
                ExamPageFlow=ExamPageFlow,
                ExamWord=ExamWord,
            )
            finished += 1
            logger.info(
                "({finished}/{total}) {res}    {displayname}".format(
                    displayname=exam.displayname,
                    res=u"[+]" if res else u"[-]",
                    finished=finished,
                    total=total,
                )
            )


# Empty reverse func is required so that django sees that the
# RunPython migration is reversible
def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("answers", "0006_auto_20200602_1436"),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_func),
    ]
