from util import response
from myauth import auth_check
from myauth.models import get_my_user
from answers.models import Answer, Comment, Exam, ExamPage, ExamType
from django.db.models.functions import Concat
from django.db.models import Q, F, When, Case, Value as V
from django.contrib.postgres.search import (
    SearchQuery,
    SearchRank,
    SearchVector,
    TrigramSimilarity
)
from answers import section_util
from myauth.auth_check import has_admin_rights


@response.request_post("term")
@auth_check.require_login
def search(request):
    term = request.POST["term"]
    user = request.user

    user_admin_category_set = user.category_admin_set.values_list(
        "id", flat=True)
    query = SearchQuery(term, config="english")
    trigram_similarity = TrigramSimilarity("text", term)

    answer_answer_section_exam_can_view = Q(
        answer__answer_section__exam__public=True
    ) | Q(answer__answer_section__exam__category__in=user_admin_category_set)
    answer_section_exam_can_view = Q(answer_section__exam__public=True) | Q(
        answer_section__exam__category__in=user_admin_category_set
    )
    exam_can_view = Q(exam__public=True) | Q(
        exam__category__in=user_admin_category_set)
    can_view = Q(public=True) | Q(category__in=user_admin_category_set)
    if not user.has_payed():
        answer_answer_section_exam_can_view = answer_answer_section_exam_can_view & Q(
            answer__answer_section__exam__needs_payment=False
        )
        answer_section_exam_can_view = answer_section_exam_can_view & Q(
            answer_section__exam__needs_payment=False
        )
        exam_can_view = exam_can_view & Q(exam__needs_payment=False)
        can_view = can_view & Q(needs_payment=False)

    exam_pages_query = ExamPage.objects
    if not has_admin_rights(request):
        exam_pages_query = exam_pages_query.filter(exam_can_view)
    exam_pages_query = exam_pages_query.filter(search_vector=term).annotate(
        rank=SearchRank(F("search_vector"), query) + trigram_similarity
    )[:15]

    exams = (Exam.objects.filter(
        id__in=[examPage.exam_id for examPage in exam_pages_query]
    ) | Exam.objects.filter(search_vector=term)).annotate(
        rank=SearchRank(F("search_vector"), query)
    )
    if not has_admin_rights(request):
        exams = exams.filter(can_view)

    examDict = dict()
    examScore = dict()
    examPages = dict()
    for exam in exams:
        examScore[exam.id] = exam.rank
        examPages[exam.id] = []
    for examPage in exam_pages_query:
        examScore[examPage.exam_id] += examPage.rank
        examPages[examPage.exam_id].append(
            (examPage.page_number, examPage.rank))

    answers = Answer.objects
    if not has_admin_rights(request):
        answers = answers.filter(answer_section_exam_can_view)
    answers = (
        answers.filter(search_vector=term)
        .annotate(
            rank=SearchRank(F("search_vector"), query),
            filename=F("answer_section__exam__filename"),
            author_username=F("author__username"),
            headline=SearchHeadline('text', query, options={
                'StartSel': '<b>',
                'StopSel': '</b>'
            }),
            author_displayname=Case(
                When(
                    Q(author__first_name__isnull=True),
                    "author__first_name",
                ),
                default=Concat(
                    "author__first_name",
                    V(" "),
                    "author__last_name"
                ),
            ),
        )
        .values("headline", "author_username", "author_displayname", "filename", "rank", "long_id")[:15]
    )

    comments = Comment.objects
    if not has_admin_rights(request):
        comments = comments.filter(answer_answer_section_exam_can_view)
    comments = (
        comments.filter(search_vector=term)
        .annotate(
            rank=SearchRank(F("search_vector"), query),
            filename=F("answer__answer_section__exam__filename"),
            author_username=F("author__username"),
            author_displayname=Case(
                When(
                    Q(author__first_name__isnull=True),
                    "author__first_name",
                ),
                default=Concat(
                    "author__first_name",
                    V(" "),
                    "author__last_name"
                ),
            ),
        ).values("text", "author_username", "author_displayname", "filename", "rank", "long_id")[:15]
    )

    res = []
    for exam in exams:
        res.append(
            {
                "type": "exam",
                "filename": exam.filename,
                "displayname": exam.displayname,
                "rank": examScore[exam.id],
                "pages": examPages[exam.id],
            }
        )
    for answer in answers:
        answer["type"] = "answer"
        res.append(answer)
    for comment in comments:
        comment["type"] = "comment"
        res.append(comment)
    return response.success(value=sorted(res, key=lambda x: -x["rank"]))


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
            "import_claim_displayname": get_my_user(exam.import_claim).displayname()
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
            "payment_uploader_displayname": get_my_user(
                exam.oral_transcript_uploader
            ).displayname(),
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
def get_by_user(request, username):
    res = [
        section_util.get_answer_response(
            request, answer, ignore_exam_admin=True)
        for answer in sorted(
            Answer.objects.filter(
                author__username=username, is_legacy_answer=False)
            .select_related(*section_util.get_answer_fields_to_preselect())
            .prefetch_related(*section_util.get_answer_fields_to_prefetch()),
            key=lambda x: (
                -x.expertvotes.count(),
                x.downvotes.count() - x.upvotes.count(),
                x.time,
            ),
        )
    ]
    return response.success(value=res)
