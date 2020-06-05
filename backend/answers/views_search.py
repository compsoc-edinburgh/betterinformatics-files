import re
import random
from django.db.models.functions import Concat
from django.db.models import Q, F, When, Case, Value as V, Func, TextField
from myauth import auth_check
from myauth.models import get_my_user
from util import response
from answers.models import Answer, Comment, Exam, ExamPage, ExamType
from myauth.auth_check import has_admin_rights
from django.contrib.postgres.search import (
    SearchQuery,
    SearchRank,
    SearchVector,
    TrigramSimilarity,
)
import logging

logger = logging.getLogger(__name__)
flatten = lambda l: [item for sublist in l for item in sublist]
flatten_and_filter = lambda l: (
    [item for sublist in l for item in sublist if isinstance(sublist, list)]
)


def parse_recursive(text, start_re, end_re, i, start_len, end_len):
    start_re
    parts = []
    s = text[i:]
    while i < len(text):
        start_match = start_re.match(s)
        end_match = end_re.match(s)
        start_pos = start_match.end(0) if start_match else float("inf")
        end_pos = end_match.end(0) if end_match else float("inf")
        if not start_match and not end_match:
            parts.append(s)
            i += len(s)
            return parts, i
        elif start_pos < end_pos:
            p = s[: start_pos - start_len]
            if len(p) > 0:
                parts.append(p)
            i += start_pos
            child, newI = parse_recursive(text, start_re, end_re, i, start_len, end_len)
            i = newI
            parts.append(child)
        else:
            i += end_pos
            parts.append(s[: end_pos - end_len])
            return parts, i
        s = text[i:]
    return parts, i


def parse_nested(text, start_re, end_re, i, start_len, end_len):
    res, i = parse_recursive(text, start_re, end_re, 0, start_len, end_len)
    if i < len(text):
        res += text[i:]
    return res


def parse_headline(text, start, end, frag):
    start_re = re.compile(".*?(" + re.escape(str(start)) + ")", flags=re.DOTALL)
    end_re = re.compile(".*?(" + re.escape(str(end)) + ")", flags=re.DOTALL)

    return [
        parse_nested(frag, start_re, end_re, 0, len(start), len(end))
        for frag in text.split(frag)
    ]


def generate_boundary():
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    res = ""
    while len(res) < 8:
        res += random.choice(chars)
    return res


def headline(
    text,
    query,
    start_boundary,
    end_boundary,
    fragment_delimeter,
    min_words=15,
    max_words=35,
):
    return Func(
        text,
        query,
        V(
            'StartSel="{start_sel}", '
            'StopSel="{stop_sel}", '
            'FragmentDelimiter="{fragment_delimeter}", '
            "MaxFragments=5, "
            "MinWords={min_words}, "
            "MaxWords={max_words}".format(
                start_sel=start_boundary,
                stop_sel=end_boundary,
                fragment_delimeter=fragment_delimeter,
                min_words=min_words,
                max_words=max_words,
            )
        ),
        function="ts_headline",
        output_field=TextField(),
    )


def search_exams(term, has_payed, is_admin, user_admin_categories, amount):
    query = SearchQuery(term, config="english")
    trigram_similarity = TrigramSimilarity("text", term)

    start_boundary = generate_boundary()
    end_boundary = generate_boundary()
    fragment_delimeter = generate_boundary()

    can_view = Q(public=True) | Q(category__in=user_admin_categories)
    if not has_payed:
        can_view = can_view & Q(needs_payment=False)

    exam_pages_query = ExamPage.objects
    if not is_admin:
        exam_pages_query = exam_pages_query.filter(can_view)
    exam_pages_query = (
        exam_pages_query.filter(search_vector=term)
        .annotate(
            rank=SearchRank(F("search_vector"), query) + trigram_similarity,
            headline=headline(
                F("text"), query, start_boundary, end_boundary, fragment_delimeter,
            ),
        )
        .order_by("page_number")[: (amount * 10)]
    )

    exams = (
        Exam.objects.filter(id__in=[examPage.exam_id for examPage in exam_pages_query])
        | Exam.objects.filter(search_vector=term)[:amount]
    ).annotate(
        rank=SearchRank(F("search_vector"), query),
        headline=headline(
            F("displayname"), query, start_boundary, end_boundary, fragment_delimeter,
        ),
    )[
        :amount
    ]
    if not is_admin:
        exams = exams.filter(can_view)

    examDict = dict()
    examScore = dict()
    examPages = dict()
    for exam in exams:
        examScore[exam.id] = exam.rank
        examPages[exam.id] = []
    for examPage in exam_pages_query:
        if examPage.exam_id not in examScore:
            continue
        examScore[examPage.exam_id] += examPage.rank
        examPages[examPage.exam_id].append(
            (
                examPage.page_number,
                examPage.rank,
                parse_headline(
                    examPage.headline, start_boundary, end_boundary, fragment_delimeter
                ),
            )
        )
    return [
        {
            "type": "exam",
            "filename": exam.filename,
            "headline": parse_headline(
                exam.headline, start_boundary, end_boundary, fragment_delimeter
            ),
            "displayname": exam.displayname,
            "rank": examScore[exam.id],
            "pages": examPages[exam.id],
        }
        for exam in exams
    ]


def search_answers(term, has_payed, is_admin, user_admin_categories, amount):
    query = SearchQuery(term, config="english")
    trigram_similarity = TrigramSimilarity("text", term)

    start_boundary = generate_boundary()
    end_boundary = generate_boundary()
    fragment_delimeter = generate_boundary()

    answer_section_exam_can_view = Q(answer_section__exam__public=True) | Q(
        answer_section__exam__category__in=user_admin_categories
    )
    if not has_payed:
        answer_section_exam_can_view = answer_section_exam_can_view & Q(
            answer_section__exam__needs_payment=False
        )
    answers = Answer.objects
    if not is_admin:
        answers = answers.filter(answer_section_exam_can_view)
    answers = (
        answers.filter(search_vector=term)
        .annotate(
            rank=SearchRank(F("search_vector"), query),
            filename=F("answer_section__exam__filename"),
            author_username=F("author__username"),
            author_displayname=Case(
                When(Q(author__first_name__isnull=True), "author__first_name",),
                default=Concat("author__first_name", V(" "), "author__last_name"),
            ),
            highlighted_words=headline(
                F("text"), query, start_boundary, end_boundary, fragment_delimeter, 1, 2
            ),
        )
        .values(
            "author_username",
            "author_displayname",
            "text",
            "highlighted_words",
            "filename",
            "rank",
            "long_id",
        )[:amount]
    )
    for answer in answers:
        answer["highlighted_words"] = list(
            flatten(
                map(
                    flatten_and_filter,
                    parse_headline(
                        answer["highlighted_words"],
                        start_boundary,
                        end_boundary,
                        fragment_delimeter,
                    ),
                )
            )
        )
    return answers


def search_comments(term, has_payed, is_admin, user_admin_categories, amount):
    query = SearchQuery(term, config="english")
    trigram_similarity = TrigramSimilarity("text", term)

    start_boundary = generate_boundary()
    end_boundary = generate_boundary()
    fragment_delimeter = generate_boundary()

    answer_answer_section_exam_can_view = Q(
        answer__answer_section__exam__public=True
    ) | Q(answer__answer_section__exam__category__in=user_admin_categories)
    if not has_payed:
        answer_answer_section_exam_can_view = answer_answer_section_exam_can_view & Q(
            answer__answer_section__exam__needs_payment=False
        )
    comments = Comment.objects
    if not is_admin:
        comments = comments.filter(answer_answer_section_exam_can_view)
    comments = (
        comments.filter(search_vector=term)
        .annotate(
            rank=SearchRank(F("search_vector"), query),
            filename=F("answer__answer_section__exam__filename"),
            author_username=F("author__username"),
            author_displayname=Case(
                When(Q(author__first_name__isnull=True), "author__first_name",),
                default=Concat("author__first_name", V(" "), "author__last_name"),
            ),
            highlighted_words=headline(
                F("text"), query, start_boundary, end_boundary, fragment_delimeter, 1, 2
            ),
        )
        .values(
            "author_username",
            "author_displayname",
            "text",
            "highlighted_words",
            "filename",
            "rank",
            "long_id",
        )[:amount]
    )
    for comment in comments:
        comment["highlighted_words"] = list(
            flatten(
                map(
                    flatten_and_filter,
                    parse_headline(
                        comment["highlighted_words"],
                        start_boundary,
                        end_boundary,
                        fragment_delimeter,
                    ),
                )
            )
        )
    return comments


@response.request_post("term")
@auth_check.require_login
def search(request):
    term = request.POST["term"]
    amount = min(request.POST.get("amount", 15), 30)
    include_exams = request.POST.get("include_exams", "true") != "false"
    include_answers = request.POST.get("include_answers", "true") != "false"
    include_comments = request.POST.get("include_comments", "true") != "false"

    user = request.user
    user_admin_categories = user.category_admin_set.values_list("id", flat=True)
    query = SearchQuery(term, config="english")
    has_payed = user.has_payed()
    is_admin = has_admin_rights(request)
    exams = (
        search_exams(term, has_payed, is_admin, user_admin_categories, amount)
        if include_exams
        else []
    )
    answers = (
        search_answers(term, has_payed, is_admin, user_admin_categories, amount)
        if include_answers
        else []
    )
    comments = (
        search_comments(term, has_payed, is_admin, user_admin_categories, amount)
        if include_comments
        else []
    )

    logger.info(
        "Found: {exam_count} exams, {answer_count} answers, {comment_count} comments".format(
            exam_count=len(exams),
            answer_count=len(answers),
            comment_count=len(comments),
        )
    )

    res = []
    for exam in exams:
        exam["type"] = "exam"
        res.append(exam)
    for answer in answers:
        answer["type"] = "answer"
        res.append(answer)
    for comment in comments:
        comment["type"] = "comment"
        res.append(comment)
    return response.success(value=sorted(res, key=lambda x: -x["rank"]))
