import subprocess
import os
import tempfile
from bs4 import BeautifulSoup
from backend import settings
from answers.models import (
    ExamPage as ExamPageModel,
    ExamPageFlow as ExamPageFlowModel,
    ExamWord as ExamWordModel,
)
import logging

logger = logging.getLogger(__name__)


def get_page_text(path_to_pdf, page, tmpdirname):
    text_path = os.path.join(tmpdirname, "temp.txt")
    DEVNULL = open(os.devnull, "w")
    return_code = subprocess.call(
        [
            "pdftotext",
            "-f",
            str(page),
            "-l",
            str(page),
            u"{pdf_path}".format(pdf_path=path_to_pdf),
            u"{text_path}".format(text_path=text_path),
        ],
        stdout=DEVNULL,
        stderr=subprocess.STDOUT,
        close_fds=True,
    )
    if return_code:
        logger.warning(
            "Failed reading PDF text: {path_to_pdf} page {page}".format(
                path_to_pdf=path_to_pdf, page=page
            )
        )
        return ""
    with open(text_path, "r") as file:
        return file.read()


def analyze_pdf(
    exam,
    path_to_pdf,
    ExamPage=ExamPageModel,
    ExamPageFlow=ExamPageFlowModel,
    ExamWord=ExamWordModel,
):
    base_path = settings.COMSOL_UPLOAD_FOLDER
    with tempfile.TemporaryDirectory(dir=base_path) as tmpdirname:
        html_path = os.path.join(tmpdirname, "temp.html")
        DEVNULL = open(os.devnull, "w")
        return_code = subprocess.call(
            [
                "pdftotext",
                "-htmlmeta",
                "-bbox-layout",
                u"{pdf_path}".format(pdf_path=path_to_pdf),
                u"{html_path}".format(html_path=html_path),
            ],
            stdout=DEVNULL,
            stderr=subprocess.STDOUT,
            close_fds=True,
        )
        if return_code:
            return False
        textdoc = BeautifulSoup(open(html_path), "html.parser")
        pages = []
        page_number = 1
        ExamPage.objects.filter(exam=exam).delete()
        exam_word_objects = []
        for page in textdoc.find_all("page"):
            w = float(page["width"])
            h = float(page["height"])
            page_text = get_page_text(path_to_pdf, page_number, tmpdirname)
            exam_page = ExamPage(
                exam=exam, page_number=page_number, width=w, height=h, text=page_text
            )
            exam_page.save()
            flow_order = 0
            for flow in page.find_all("flow"):
                page_flow = ExamPageFlow(page=exam_page, order=flow_order)
                page_flow.save()
                flow_order += 1

                word_order = 0
                for block in flow.find_all("block"):
                    for line in block.find_all("line"):
                        for word in line.find_all("word"):
                            # Convert to relative coordinates
                            x_min = float(word["xmin"]) / w
                            y_min = float(word["ymin"]) / h
                            x_max = float(word["xmax"]) / w
                            y_max = float(word["ymax"]) / h
                            exam_word = ExamWord(
                                flow=page_flow,
                                order=word_order,
                                content=word.string,
                                x_min=x_min,
                                y_min=y_min,
                                x_max=x_max,
                                y_max=y_max,
                            )
                            exam_word_objects.append(exam_word)
                            word_order += 1
            pages.append((page_number, page_text))
            page_number += 1
        ExamWord.objects.bulk_create(exam_word_objects)
        return True
