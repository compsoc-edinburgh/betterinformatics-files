from django.db.models import Q, Count
from answers import section_util
from answers.models import Answer, Comment, Exam, ExamType
from documents.models import Comment as DocumentComment
from myauth import auth_check
from myauth.models import get_my_user
from util import response
from django.db.models import Count, Exists, OuterRef


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
    condition = Q(finished_cuts=False)
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
            "import_claim_displayname": get_my_user(exam.import_claim).displayname()
            if exam.import_claim
            else None,
            "import_claim_time": exam.import_claim_time,
            "public": exam.public,
            "finished_cuts": exam.finished_cuts,
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
            "payment_uploader_displayname": get_my_user(
                exam.oral_transcript_uploader
            ).displayname(),
            "payment_uploader": exam.oral_transcript_uploader.username if exam.oral_transcript_uploader else None,
        }
        for exam in Exam.objects.filter(
            is_oral_transcript=True, oral_transcript_checked=False
        ).order_by("category__displayname", "displayname")
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_admin
def list_flagged(request):
    answers = Answer.objects.exclude(flagged=None).select_related(
        "author", "answer_section__exam"
    ).annotate(
        flagged_count=Count("flagged", distinct=True)
    )

    exam_comments = Comment.objects.exclude(flagged=None).select_related(
        "author", "answer__answer_section__exam"
    ).annotate(
        flagged_count=Count("flagged", distinct=True)
    )

    document_comments = DocumentComment.objects.exclude(flagged=None).select_related(
        "author", "document__author"
    ).annotate(
        flagged_count=Count("flagged", distinct=True)
    )

    answer_list = [
        {
            "link": "/exams/" + answer.answer_section.exam.filename + "?answer=" + answer.long_id,
            "flaggedCount": answer.flagged_count,
            "author": answer.author.username,
            "flagType": False
        }
        for answer in answers
    ]

    exam_comment_list = [
        {
            "link": "/exams/" + comment.answer.answer_section.exam.filename + "?comment=" + comment.long_id + "&answer=" + comment.answer.long_id,
            "flaggedCount": comment.flagged_count,
            "author": comment.author.username,
            "flagType": True
        }
        for comment in exam_comments
    ]

    document_comment_list = [
        {
            "link": "/user/" + comment.document.author.username + "/document/"  + comment.document.display_name.lower().replace(' ', '-') + "?comment=" + str(comment.id),
            "flaggedCount": comment.flagged_count,
            "author": comment.author.username,
            "flagType": True
        }
        for comment in document_comments
    ]

    combined = answer_list + exam_comment_list + document_comment_list
    return response.success(
        value=combined
    )


@response.request_get()
@auth_check.require_login
def get_by_user(request, username, page=-1):
    sorted_answers = Answer.objects \
        .filter(
            author__username=username,
            is_legacy_answer=False) \
        .select_related(*section_util.get_answer_fields_to_preselect()) \

    sorted_answers = section_util.prepare_answer_objects(sorted_answers, request) \
        .order_by("-expert_count", "-delta_votes", "time")

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
        .annotate(
            flagged_count=Count("flagged", distinct=True),
            is_flagged=Exists(Comment.objects.filter(id=OuterRef("id"), flagged=request.user)),
        ) \
        .order_by("-time", "id")

    if page >= 0:
        PAGE_SIZE = 20
        sorted_comments = sorted_comments[page*PAGE_SIZE: (page+1)*PAGE_SIZE]

    res = [section_util.get_comment_response(request, comment)
           for comment in sorted_comments]
    return response.success(value=res)
