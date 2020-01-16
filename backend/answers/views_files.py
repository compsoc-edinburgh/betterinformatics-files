from util import response, minio_util
from myauth import auth_check
from django.conf import settings
from answers.models import Exam, ExamType
from categories.models import Category
from django.shortcuts import get_object_or_404


def prepare_exam_pdf_file(request):
    file = request.FILES.get('file')
    if not file:
        return response.missing_argument(), None
    orig_filename = file.name
    ext = minio_util.check_filename(orig_filename, settings.COMSOL_EXAM_ALLOWED_EXTENSIONS)
    if not ext:
        return response.not_possible('Invalid File Extension'), None
    return None, file


@response.args_post('category', 'displayname')
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
        category=category,
        resolve_alias=file.name,
    )
    exam.save()
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_EXAM_DIR, filename, file)
    return response.success(filename=filename)


@response.args_post('category')
@response.args_post('filename', optional=True)
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


@response.args_post('filename')
@auth_check.require_login
def upload_printonly(request):
    err, file, exam = get_existing_exam(request)
    if err is not None:
        return err
    exam.is_printonly = True
    exam.save()
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_PRINTONLY_DIR, request.POST['filename'], file)
    return response.success()


@response.args_post('filename')
@auth_check.require_login
def upload_solution(request):
    err, file, exam = get_existing_exam(request)
    if err is not None:
        return err
    exam.has_solution = True
    exam.save()
    minio_util.save_uploaded_file_to_minio(settings.COMSOL_SOLUTION_DIR, request.POST['filename'], file)
    return response.success()


@response.args_post()
@auth_check.require_exam_admin
def remove_exam(request, filename, exam):
    exam.delete()
    minio_util.delete_file(settings.COMSOL_EXAM_DIR, filename)
    return response.success()


@response.args_post()
@auth_check.require_exam_admin
def remove_printonly(request, filename, exam):
    exam.is_printonly = False
    exam.save()
    minio_util.delete_file(settings.COMSOL_PRINTONLY_DIR, filename)
    return response.success()


@response.args_post()
@auth_check.require_exam_admin
def remove_solution(request, filename, exam):
    exam.has_solution = False
    exam.save()
    minio_util.delete_file(settings.COMSOL_SOLUTION_DIR, filename)
    return response.success()


@auth_check.require_login
def get_exam_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request):
        return response.not_allowed()
    attachment_name = exam.resolve_alias or (exam.category.displayname + '_' + exam.displayname + '.pdf').replace(' ', '_')
    return minio_util.send_file(settings.COMSOL_EXAM_DIR, filename, attachment_filename=attachment_name, as_attachment='download' in request.GET)


@auth_check.require_login
def get_solution_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request) or exam.solution_printonly:
        return response.not_allowed()
    if not exam.has_solution:
        return response.not_found()
    attachment_name = exam.resolve_alias or (exam.category.displayname + '_' + exam.displayname + '.pdf').replace(' ', '_')
    return minio_util.send_file(settings.COMSOL_SOLUTION_DIR, filename, attachment_filename=attachment_name, as_attachment='download' in request.GET)


@auth_check.require_login
def get_printonly_pdf(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    if not exam.current_user_can_view(request) or not auth_check.has_admin_rights_for_exam(request, exam):
        return response.not_allowed()
    if not exam.is_printonly:
        return response.not_found()
    attachment_name = exam.resolve_alias or (exam.category.displayname + '_' + exam.displayname + '.pdf').replace(' ', '_')
    return minio_util.send_file(settings.COMSOL_PRINTONLY_DIR, filename, attachment_filename=attachment_name, as_attachment='download' in request.GET)
