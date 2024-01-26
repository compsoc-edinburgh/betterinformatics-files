from util import response
from myauth import auth_check
from answers.models import Exam, ExamType
from categories.models import Category
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import answers.views_files as files 


@response.request_get()
@auth_check.require_login
def exam_metadata(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    admin_rights = auth_check.has_admin_rights_for_exam(request, exam)
    can_view = exam.current_user_can_view(request)
    res = {
        'filename': exam.filename,
        'displayname': exam.displayname,
        'category': exam.category.slug,
        'category_displayname': exam.category.displayname,
        'examtype': exam.exam_type.displayname,
        'master_solution': exam.master_solution,
        'resolve_alias': exam.resolve_alias,
        'remark': exam.remark,
        'public': exam.public,
        'finished_cuts': exam.finished_cuts,
        'needs_payment': exam.needs_payment,
        'is_printonly': exam.is_printonly,
        'has_solution': exam.has_solution,
        'solution_printonly': exam.solution_printonly,
        'is_oral_transcript': exam.is_oral_transcript,
        'oral_transcript_checked': exam.oral_transcript_checked,
        'attachments': [
            {
                'displayname': att.displayname,
                'filename': att.filename,
            } for att in exam.attachment_set.order_by('displayname').all()
        ],
        'canEdit': admin_rights,
        'isExpert': auth_check.is_expert_for_exam(request, exam),
        'canView': can_view,
        'hasPayed': request.user.has_payed(),
    }

    if can_view:
        res["exam_file"] = files.get_presigned_url_exam(exam)

    if can_view and exam.has_solution:
        res["solution_file"] = files.get_presigned_url_solution(exam)

    if can_view and admin_rights and exam.is_printonly:
        res["printonly_file"] = files.get_presigned_url_printonly(exam)

    return response.success(value=res)


@response.request_post(
    'displayname',
    'category',
    'examtype',
    'master_solution',
    'resolve_alias',
    'remark',
    'public',
    'finished_cuts',
    'needs_payment',
    'solution_printonly',
    optional=True
)
@auth_check.require_exam_admin
def exam_set_metadata(request, filename, exam):
    for key in ['displayname', 'master_solution', 'resolve_alias', 'remark']:
        if key in request.POST:
            # prevent whitespaced or empty displaynames
            if key == "displayname" and request.POST['displayname'].strip() == '':
                return response.not_possible("Invalid displayname")
            setattr(exam, key, request.POST[key])
    for key in ['public', 'finished_cuts', 'needs_payment', 'solution_printonly']:
        if key in request.POST:
            setattr(exam, key, request.POST[key] != 'false')
    if 'category' in request.POST:
        new_category = get_object_or_404(Category, slug=request.POST['category'])
        if not auth_check.has_admin_rights_for_category(request, new_category):
            return response.not_allowed()
        exam.category = new_category
    if 'examtype' in request.POST:
        old_exam_type = exam.exam_type
        exam.exam_type, _ = ExamType.objects.get_or_create(displayname=request.POST['examtype'])
        exam.save()
        if old_exam_type.id > 5 and not old_exam_type.exam_set.exists():
            old_exam_type.delete()
    exam.save()
    return response.success()


@response.request_post('claim')
@auth_check.require_exam_admin
def claim_exam(request, filename, exam):
    add_claim = request.POST['claim'] != 'false'
    if add_claim:
        if exam.import_claim and exam.import_claim != request.user:
            if timezone.now() - exam.import_claim_time < timedelta(hours=4):
                return response.not_possible('Exam is already claimed by different user')
        exam.import_claim = request.user
        exam.import_claim_time = timezone.now()
    else:
        if exam.import_claim == request.user:
            exam.import_claim = None
        else:
            return response.not_allowed()
    exam.save()
    return response.success()
