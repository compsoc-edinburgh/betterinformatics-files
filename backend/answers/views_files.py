from util import response, s3_util, ethprint
from myauth import auth_check
from django.conf import settings
from answers.models import Exam, ExamType
from categories.models import Category
from django.shortcuts import get_object_or_404
import os
from answers import pdf_utils


def prepare_exam_pdf_file(request):
    file = request.FILES.get("file")
    if not file:
        return response.missing_argument(), None
    orig_filename = file.name
    ext = s3_util.check_filename(orig_filename, settings.COMSOL_EXAM_ALLOWED_EXTENSIONS)
    if not ext:
        return response.not_possible("Invalid File Extension"), None
    return None, file


@response.request_post("category", "displayname")
@auth_check.require_login
def upload_exam_pdf(request):
    err, file = prepare_exam_pdf_file(request)
    if err is not None:
        return err
    filename = s3_util.generate_filename(8, settings.COMSOL_EXAM_DIR, ".pdf")
    category = get_object_or_404(Category, slug=request.POST.get("category", "default"))
    if not auth_check.has_admin_rights_for_category(request, category):
        return response.not_allowed()
    exam = Exam(
        filename=filename,
        displayname=request.POST["displayname"],
        exam_type=ExamType.objects.get(displayname="Exams"),
        category=category,
        resolve_alias=file.name,
    )
    exam.save()
    s3_util.save_uploaded_file_to_s3(
        settings.COMSOL_EXAM_DIR, filename, file, "application/pdf"
    )
    pdf_utils.analyze_pdf(exam, os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename))
    return response.success(filename=filename)


@response.request_post("category")
@response.request_post("filename", optional=True)
@auth_check.require_login
def upload_transcript(request):
    err, file = prepare_exam_pdf_file(request)
    if err is not None:
        return err
    filename = s3_util.generate_filename(8, settings.COMSOL_EXAM_DIR, ".pdf")
    category = get_object_or_404(Category, slug=request.POST.get("category", "default"))
    if not category.has_payments:
        return response.not_possible("Category is not valid")
    exam = Exam(
        filename=filename,
        displayname=request.POST.get("displayname", file.name),
        category=category,
        exam_type=ExamType.objects.get(displayname="Transcripts"),
        resolve_alias=file.name,
        needs_payment=True,
        is_oral_transcript=True,
        oral_transcript_uploader=request.user,
    )
    exam.save()
    s3_util.save_uploaded_file_to_s3(
        settings.COMSOL_EXAM_DIR, filename, file, "application/pdf"
    )
    pdf_utils.analyze_pdf(exam, os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename))
    return response.success(filename=filename)


def get_existing_exam(request):
    err, file = prepare_exam_pdf_file(request)
    if err is not None:
        return err, None, None
    exam = get_object_or_404(Exam, filename=request.POST["filename"])
    if not auth_check.has_admin_rights_for_exam(request, exam):
        return response.not_allowed(), None, None
    return None, file, exam


@response.request_post("filename")
@auth_check.require_login
def upload_printonly(request):
    err, file, exam = get_existing_exam(request)
    if err is not None:
        return err
    exam.is_printonly = True
    exam.save()
    s3_util.save_uploaded_file_to_s3(
        settings.COMSOL_PRINTONLY_DIR, request.POST["filename"], file, "application/pdf"
    )
    return response.success()


@response.request_post("filename")
@auth_check.require_login
def upload_solution(request):
    err, file, exam = get_existing_exam(request)
    if err is not None:
        return err
    exam.has_solution = True
    exam.save()
    s3_util.save_uploaded_file_to_s3(
        settings.COMSOL_SOLUTION_DIR, request.POST["filename"], file, "application/pdf"
    )
    return response.success()


@response.request_post()
@auth_check.require_exam_admin
def remove_exam(request, filename, exam):
    exam.delete()
    s3_util.delete_file(settings.COMSOL_EXAM_DIR, filename)
    return response.success()


@response.request_post()
@auth_check.require_exam_admin
def remove_printonly(request, filename, exam):
    exam.is_printonly = False
    exam.save()
    s3_util.delete_file(settings.COMSOL_PRINTONLY_DIR, filename)
    return response.success()


@response.request_post()
@auth_check.require_exam_admin
def remove_solution(request, filename, exam):
    exam.has_solution = False
    exam.save()
    s3_util.delete_file(settings.COMSOL_SOLUTION_DIR, filename)
    return response.success()


def get_presigned_url_exam(exam: Exam):
    return s3_util.presigned_get_object(
        settings.COMSOL_EXAM_DIR,
        exam.filename,
        content_type="application/pdf",
        display_name=exam.category.displayname + " " + exam.displayname + ".pdf",
    )


@response.request_get()
@auth_check.require_login
def get_exam_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request):
        return response.not_allowed()
    return response.success(value=get_presigned_url_exam(exam))


def get_presigned_url_solution(exam: Exam):
    return s3_util.presigned_get_object(
        settings.COMSOL_SOLUTION_DIR,
        exam.filename,
        content_type="application/pdf",
        display_name=exam.category.displayname
        + " "
        + exam.displayname
        + " (Solution).pdf",
    )


@response.request_get()
@auth_check.require_login
def get_solution_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request) or exam.solution_printonly:
        return response.not_allowed()
    if not exam.has_solution:
        return response.not_found()
    return response.success(value=get_presigned_url_solution(exam))


def get_presigned_url_printonly(exam: Exam):
    return s3_util.presigned_get_object(
        settings.COMSOL_PRINTONLY_DIR,
        exam.filename,
        content_type="application/pdf",
        display_name=exam.category.displayname + " " + exam.displayname + ".pdf",
    )

@response.request_get()
@auth_check.require_login
def get_printonly_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(
        request
    ) or not auth_check.has_admin_rights_for_exam(request, exam):
        return response.not_allowed()
    if not exam.is_printonly:
        return response.not_found()
    return response.success(value=get_presigned_url_printonly(exam))


def print_pdf(exam, request, filename, s3_dir):
    if not exam.current_user_can_view(request):
        return response.not_allowed()
    try:
        pdfpath = os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename)
        if not s3_util.save_file(s3_dir, filename, pdfpath):
            return response.internal_error()
        return_code = ethprint.start_job(
            request.user.username, request.POST["password"], filename, pdfpath
        )
        if return_code:
            return response.not_possible(
                "Could not connect to the printer. Please check your password and try again."
            )
    except Exception:
        pass
    return response.success()


@response.request_post("password")
@auth_check.require_login
def print_exam(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    s3_dir = (
        settings.COMSOL_PRINTONLY_DIR if exam.is_printonly else settings.COMSOL_EXAM_DIR
    )
    return print_pdf(exam, request, filename, s3_dir)


@response.request_post("password")
@auth_check.require_login
def print_solution(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    return print_pdf(exam, request, filename, settings.COMSOL_SOLUTION_DIR)
