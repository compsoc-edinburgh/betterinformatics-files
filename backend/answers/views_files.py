from util import response, minio_util, ethprint
from myauth import auth_check
from django.conf import settings
from answers.models import Exam, ExamType
from categories.models import Category
from django.shortcuts import get_object_or_404
import os
import io
import tempfile
import zipfile
from answers import pdf_utils


def prepare_exam_pdf_file(request):
    file = request.FILES.get('file')
    if not file:
        return response.missing_argument(), None
    orig_filename = file.name
    ext = minio_util.check_filename(orig_filename, settings.COMSOL_EXAM_ALLOWED_EXTENSIONS)
    if not ext:
        return response.not_possible('Invalid File Extension'), None
    return None, file


@response.request_post('category', 'displayname')
@auth_check.require_login
def upload_exam_pdf(request):
    err, file = prepare_exam_pdf_file(request)
    if err is not None:
        return err
    filename = minio_util.generate_filename(8, settings.COMSOL_EXAM_DIR, '.pdf')
    category = get_object_or_404(Category, slug=request.POST.get('category', 'default'))
    if not auth_check.has_admin_rights_for_category(request, category):
        return response.not_allowed()
    exam = Exam(
        filename=filename,
        displayname=request.POST['displayname'],
        exam_type=ExamType.objects.get(displayname='Exams'),
        category=category,
        resolve_alias=file.name,
    )
    exam.save()
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_EXAM_DIR, filename, file)
    pdf_utils.analyze_pdf(exam, os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename))
    return response.success(filename=filename)


@response.request_post('category')
@response.request_post('filename', optional=True)
@auth_check.require_login
def upload_transcript(request):
    err, file = prepare_exam_pdf_file(request)
    if err is not None:
        return err
    filename = minio_util.generate_filename(8, settings.COMSOL_EXAM_DIR, '.pdf')
    category = get_object_or_404(Category, slug=request.POST.get('category', 'default'))
    if not category.has_payments:
        return response.not_possible('Category is not valid')
    exam = Exam(
        filename=filename,
        displayname=request.POST.get('displayname', file.name),
        category=category,
        exam_type=ExamType.objects.get(displayname='Transcripts'),
        resolve_alias=file.name,
        needs_payment=True,
        is_oral_transcript=True,
        oral_transcript_uploader=request.user,
    )
    exam.save()
    pdf_utils.analyze_pdf(exam, os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename))
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_EXAM_DIR, filename, file)
    return response.success(filename=filename)


def get_existing_exam(request):
    err, file = prepare_exam_pdf_file(request)
    if err is not None:
        return err, None, None
    exam = get_object_or_404(Exam, filename=request.POST['filename'])
    if not auth_check.has_admin_rights_for_exam(request, exam):
        return response.not_allowed(), None, None
    return None, file, exam


@response.request_post('filename')
@auth_check.require_login
def upload_printonly(request):
    err, file, exam = get_existing_exam(request)
    if err is not None:
        return err
    exam.is_printonly = True
    exam.save()
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_PRINTONLY_DIR, request.POST['filename'], file)
    return response.success()


@response.request_post('filename')
@auth_check.require_login
def upload_solution(request):
    err, file, exam = get_existing_exam(request)
    if err is not None:
        return err
    exam.has_solution = True
    exam.save()
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_SOLUTION_DIR, request.POST['filename'], file)
    return response.success()


@response.request_post()
@auth_check.require_exam_admin
def remove_exam(request, filename, exam):
    exam.delete()
    minio_util.delete_file(settings.COMSOL_EXAM_DIR, filename)
    return response.success()


@response.request_post()
@auth_check.require_exam_admin
def remove_printonly(request, filename, exam):
    exam.is_printonly = False
    exam.save()
    minio_util.delete_file(settings.COMSOL_PRINTONLY_DIR, filename)
    return response.success()


@response.request_post()
@auth_check.require_exam_admin
def remove_solution(request, filename, exam):
    exam.has_solution = False
    exam.save()
    minio_util.delete_file(settings.COMSOL_SOLUTION_DIR, filename)
    return response.success()


@response.request_get()
@auth_check.require_login
def get_exam_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request):
        return response.not_allowed()
    return minio_util.send_file(settings.COMSOL_EXAM_DIR, filename, attachment_filename=exam.attachment_name(), as_attachment='download' in request.GET)


@response.request_get()
@auth_check.require_login
def get_solution_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request) or exam.solution_printonly:
        return response.not_allowed()
    if not exam.has_solution:
        return response.not_found()
    return minio_util.send_file(settings.COMSOL_SOLUTION_DIR, filename, attachment_filename=exam.attachment_name(), as_attachment='download' in request.GET)


@response.request_get()
@auth_check.require_login
def get_printonly_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request) or not auth_check.has_admin_rights_for_exam(request, exam):
        return response.not_allowed()
    if not exam.is_printonly:
        return response.not_found()
    return minio_util.send_file(settings.COMSOL_PRINTONLY_DIR, filename, attachment_filename=exam.attachment_name(), as_attachment='download' in request.GET)


def print_pdf(request, filename, minio_dir):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request):
        return response.not_allowed()
    try:
        pdfpath = os.path.join(settings.COMSOL_UPLOAD_FOLDER, filename)
        if not minio_util.save_file(minio_dir, filename, pdfpath):
            return response.internal_error()
        return_code = ethprint.start_job(request.user.username, request.POST['password'], filename, pdfpath)
        if return_code:
            return response.not_possible("Could not connect to the printer. Please check your password and try again.")
    except Exception:
        pass
    return response.success()


@response.request_post('password')
@auth_check.require_login
def print_exam(request, filename):
    return print_pdf(request, filename, settings.COMSOL_EXAM_DIR)


@response.request_post()
@auth_check.require_login
def print_solution(request, filename):
    return print_pdf(request, filename, settings.COMSOL_SOLUTION_DIR)


@response.request_post('filenames')
@auth_check.require_login
def zip_export(request):
    filenames = request.POST.getlist('filenames')
    exams = Exam.objects.filter(filename__in=filenames)
    if exams.count() != len(filenames) or not filenames:
        return response.not_found()
    base_path = settings.COMSOL_UPLOAD_FOLDER
    data = io.BytesIO()
    zip_is_empty = True
    used_names = set()
    with tempfile.TemporaryDirectory(dir=base_path) as tmpdirname:
        for exam in exams:
            if not exam.current_user_can_view(request):
                continue

            attachment_name = exam.attachment_name().rstrip('.pdf')
            if attachment_name in used_names:
                i = 0
                while '{}({})'.format(attachment_name, i) in used_names:
                    i += 1
                attachment_name = '{}({})'.format(attachment_name, i)
            used_names.add(attachment_name)
            attachment_path = os.path.join(tmpdirname, attachment_name + '.pdf')
            minio_util.save_file(settings.COMSOL_EXAM_DIR, exam.filename, attachment_path)

            if not exam.has_solution or exam.solution_printonly:
                continue

            sol_attachment_name = attachment_name + '_solution.pdf'
            sol_attachment_path = os.path.join(tmpdirname, sol_attachment_name)
            minio_util.save_file(settings.COMSOL_SOLUTION_DIR, exam.filename, sol_attachment_path)

        with zipfile.ZipFile(data, mode='w') as z:
            with os.scandir(tmpdirname) as it:
                for f_name in it:
                    z.write(f_name, os.path.basename(f_name))
                    zip_is_empty = False

    if zip_is_empty:
        return response.not_found()

    data.seek(0)
    attachment_name = exams[0].category.slug + '.zip'
    return response.send_file_obj(data, attachment_name, as_attachment=True)
