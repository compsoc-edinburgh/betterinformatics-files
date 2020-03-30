from util import response
from myauth import auth_check
from answers.models import Exam, ExamType, AnswerSection, Answer
from categories.models import Category
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta


@auth_check.require_login
def exam_metadata(request, filename):
    exam = get_object_or_404(Exam, filename=filename)
    res = {
        'filename': exam.filename,
        'displayname': exam.displayname,
        'category': exam.category.slug,
        'category_displayname': exam.category.displayname,
        'examtype': exam.exam_type.displayname,
        'legacy_solution': exam.legacy_solution,
        'master_solution': exam.master_solution,
        'resolve_alias': exam.resolve_alias,
        'remark': exam.remark,
        'public': exam.public,
        'finished_cuts': exam.finished_cuts,
        'finished_wiki_transfer': exam.finished_wiki_transfer,
        'needs_payment': exam.needs_payment,
        'is_printonly': exam.is_printonly,
        'has_solution': exam.has_solution,
        'solution_printonly': exam.solution_printonly,
        'is_oral_transcript': exam.is_oral_transcript,
        'oral_transcript_checked': exam.oral_transcript_checked,
        # 'count_cuts': exam.answersection_set.count(),
        # 'count_answered': exam.count_answered(),
        'attachments': sorted([
            {
                'displayname': att.displayname,
                'filename': att.filename,
            } for att in exam.attachment_set.all()
        ], key=lambda x: x['displayname']),
        'canEdit': auth_check.has_admin_rights_for_exam(request, exam),
        'isExpert': auth_check.is_expert_for_exam(request, exam),
        'canView': exam.current_user_can_view(request),
        'hasPayed': request.user.has_payed(),
    }
    return response.success(value=res)


@response.args_post(
    'displayname',
    'category',
    'examtype',
    'legacy_solution',
    'master_solution',
    'resolve_alias',
    'remark',
    'public',
    'finished_cuts',
    'finished_wiki_transfer',
    'needs_payment',
    'solution_printonly',
    optional=True
)
@auth_check.require_exam_admin
def exam_set_metadata(request, filename, exam):
    for key in ['displayname', 'legacy_solution', 'master_solution', 'resolve_alias', 'remark']:
        if key in request.POST:
            setattr(exam, key, request.POST[key])
    for key in ['public', 'finished_cuts', 'finished_wiki_transfer', 'needs_payment', 'solution_printonly']:
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


@response.args_post('claim')
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
