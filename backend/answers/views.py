from util import response
from myauth import auth_check
from answers.models import Exam, ExamType, AnswerSection
from answers import section_util
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
        'count_cuts': 0, # TODO implement
        'count_answered': 0, # TODO implement
        'attachments': sorted([
            {
                'displayname': att.displayname,
                'filename': att.filename,
            } for att in exam.attachment_set.all()
        ], key=lambda x: x['displayname']),
        'canEdit': auth_check.has_admin_rights_for_exam(request, exam),
        'isExpert': auth_check.is_expert_for_exam(request, exam),
        'canView': exam.current_user_can_view(request),
        'hasPayed': False, # TODO implement
    }
    return response.success(value=res)


@auth_check.require_exam_admin
def exam_set_metadata(request, filename, exam):
    # TODO implement
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
