from django.contrib.postgres.search import (
    SearchQuery,
    SearchRank,
    SearchVector,
    TrigramSimilarity,
)
from django.db.models import Q, F, Count

from answers import section_util
from answers.models import Answer, Comment, Exam, ExamPage, ExamType
from ediauth import auth_check
from ediauth.auth_check import has_admin_rights
from util import response


@response.request_get()
@auth_check.require_login
def list_exam_types(request):
    return response.success(
        value=list(ExamType.objects.values_list("displayname", flat=True))
    )


@response.request_get()
@auth_check.require_login
def list_exams(request):
    return response.success(value=list(Exam.objects.values_list("filename", flat=True)))


@response.request_get()
@auth_check.require_login
def list_import_exams(request):
    condition = Q(finished_cuts=False) | Q(finished_wiki_transfer=False)
    if request.GET.get("includehidden", "false") != "false":
        condition = condition | Q(public=False)

    def filter_exams(exams):
        if auth_check.has_admin_rights(request):
            return exams
        return [
            exam
            for exam in exams
            if auth_check.has_admin_rights_for_exam(request, exam)
        ]

    res = [
        {
            "filename": exam.filename,
            "displayname": exam.displayname,
            "category_displayname": exam.category.displayname,
            "remark": exam.remark,
            "import_claim": exam.import_claim.username if exam.import_claim else None,
            "import_claim_displayname": exam.import_claim.profile.display_username
            if exam.import_claim
            else None,
            "import_claim_time": exam.import_claim_time,
            "public": exam.public,
            "finished_cuts": exam.finished_cuts,
            "finished_wiki_transfer": exam.finished_wiki_transfer,
        }
        for exam in filter_exams(
            Exam.objects.filter(condition)
            .select_related("import_claim", "category")
            .order_by("category__displayname", "displayname")
        )
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_admin
def list_payment_check_exams(request):
    res = [
        {
            "filename": exam.filename,
            "displayname": exam.displayname,
            "category_displayname": exam.category.displayname,
            "payment_uploader_displayname": exam.oral_transcript_uploader.profile.display_username,
        }
        for exam in Exam.objects.filter(
            is_oral_transcript=True, oral_transcript_checked=False
        ).order_by("category__displayname", "displayname")
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_admin
def list_flagged(request):
    answers = Answer.objects.exclude(flagged=None)
    return response.success(
        value=[
            "/exams/" + answer.answer_section.exam.filename + "#" + answer.long_id
            for answer in answers
        ]
    )


@response.request_get()
@auth_check.require_login
def get_by_user(request, username, page=-1):
    sorted_answers = Answer.objects \
        .filter(
            author__username=username,
            is_legacy_answer=False) \
        .select_related(*section_util.get_answer_fields_to_preselect()) \
        .prefetch_related(*section_util.get_answer_fields_to_prefetch()) \
        .annotate(
            expert_count=Count("expertvotes"),
            downvotes_count=Count("downvotes"),
            upvotes_count=Count("upvotes"),
            delta_votes=F("downvotes_count")-F("upvotes_count")) \
        .order_by("-expert_count", "delta_votes", "time")

    if page >= 0:
        PAGE_SIZE = 20
        sorted_answers = sorted_answers[page*PAGE_SIZE: (page+1)*PAGE_SIZE]

    res = [
        section_util.get_answer_response(
            request, answer, ignore_exam_admin=True)
        for answer in sorted_answers
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def get_comments_by_user(request, username, page=-1):
    sorted_comments = Comment.objects \
        .filter(author__username=username) \
        .select_related(*section_util.get_comment_fields_to_preselect()) \
        .prefetch_related(*section_util.get_comment_fields_to_prefetch()) \
        .order_by("-time", "id")

    if page >= 0:
        PAGE_SIZE = 20
        sorted_comments = sorted_comments[page*PAGE_SIZE: (page+1)*PAGE_SIZE]

    res = [section_util.get_comment_response(request, comment)
           for comment in sorted_comments]
    return response.success(value=res)
