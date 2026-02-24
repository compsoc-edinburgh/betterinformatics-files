import subprocess
import os
import tempfile
from bs4 import BeautifulSoup
from backend import settings
from answers.models import (
    ExamPage as ExamPageModel,
)
import logging
import pypdfium2 as pdfium

logger = logging.getLogger(__name__)


def get_page_text(path_to_pdf, page, tmpdirname):
    with pdfium.PdfDocument(path_to_pdf) as pdf:
        if page > len(pdf):
            logger.warning(
                "Page number out of range when reading PDF text: {path_to_pdf} page {page}".format(
                    path_to_pdf=path_to_pdf, page=page
                )
            )
            return ""

        if page == 0:
            # Have a way to extract text from the entire PDF
            return "\n".join(
                page.get_textpage().get_text_bounded().replace("\r\n", "\n")
                for page in pdf
            )

        page = pdf[page - 1]

        # PDFium generates text with \r\n line breaks, but we want to use \n for
        # consistency with pdftotext and general text handling in Python
        return page.get_textpage().get_text_bounded().replace("\r\n", "\n")


def analyze_pdf(
    exam,
    path_to_pdf,
    ExamPage=ExamPageModel,
):
    base_path = settings.COMSOL_UPLOAD_FOLDER
    try:
        with tempfile.TemporaryDirectory(dir=base_path) as tmpdirname:
            ExamPage.objects.filter(exam=exam).delete()
            with pdfium.PdfDocument(path_to_pdf) as pdf:
                for page_number in range(1, len(pdf) + 1):
                    page = pdf[page_number - 1]
                    w, h = page.get_size()
                    page_text = get_page_text(path_to_pdf, page_number, tmpdirname)
                    exam_page = ExamPage(
                        exam=exam,
                        page_number=page_number,
                        width=w,
                        height=h,
                        text=page_text,
                    )
                    exam_page.save()

        return True
    except (FileNotFoundError, pdfium.PdfiumError) as e:
        return False
