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
import time
from django.conf import settings

"""
Search function that uses the full text search capabilities to search for a given query in
the collection of exams, comments and answers. To make full text search performant the full
text search vector is stored in the db. When one of the fields from which the ts_vector is 
derived is updated the vector is automatically updated using the trigger. During the search
process itself a GIN (Generailzed Inverted Index) is used to find matching model instances.
Postgresql also provides us with two rank functions so that the documents can be sorted by
how relevant they are. Django uses `ts_rank` by default which as documented does the following:

> Ranks vectors based on the frequency of their matching lexemes.

(https://www.postgresql.org/docs/9.1/textsearch-controls.html)

Once we have the matching model instances we also want to highlight the matches so that a
user can see whether something is really the document they were looking for. PSQL gives us 
`ts_headline` which by default surrounds matches with <b>match</b>. Because we would like to
render to HTML on the client we parse the result of ts_headline again and instead of inserting
<b> we insert random strings so that it becomes highly unlikely that the user can accidentally
(there might also be security implications) highlight some text.

The results of the different document types are merged and sorted again on the server (It's
find in this case because only very few documents will be left)
"""

logger = logging.getLogger(__name__)
flatten = lambda l: [item for sublist in l for item in sublist]
flatten_and_filter = lambda l: (
    [item for sublist in l for item in sublist if isinstance(sublist, list)]
)


def parse_recursive(text, start_re, end_re, i, start_len, end_len):
    """
    Recursively parses `text` into an area where list elements correspond to sections
    in `text` which were surrounded by `start_re` and `end_re`. `start_len`end `end_len`
    can be used to remove the separators. `i` is the index from which the function starts
    matching. The function assumes that the string is well formed. In the case that `end_re`
    occurs more times then `end_re` the returned `i` can be used to include the rest
    of `text`. 

    Returns:
        `list, number`: The parsing result and the index where parsing stopped
    """
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


def parse_nested(text, start_re, end_re, start_len, end_len):
    """
    Uses `parse_recursive` but handles strings that are not well formed.

    Returns:
        `list`: The parsing result
    """

    res, i = parse_recursive(text, start_re, end_re, 0, start_len, end_len)
    if i < len(text):
        res += text[i:]
    return res


def parse_headline(text, start, end, frag):
    """
    Returns the parsed result of a psql headline function where `start`, `end`and
    `frag` are the psql parameters and `text` is the text result. 
    """
    start_re = re.compile(".*?(" + re.escape(str(start)) + ")", flags=re.DOTALL)
    end_re = re.compile(".*?(" + re.escape(str(end)) + ")", flags=re.DOTALL)

    return [
        parse_nested(frag, start_re, end_re, len(start), len(end))
        for frag in text.split(frag)
    ]


def generate_boundary():
    """
    Generates a random boundary that can be used for finding matches using psql
    headline 
    """
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
    """A function that can be used in django queries to call the psql ts_headline
    function. Given a text field and  a full text search query it returns a string
    that contains the highlighted matches that should be shown as search results. 

    Args:
        text (F): F object of the column / expression that should be highlighted
        query (SearchQuery): The query which should be used during highlighting
        start_boundary (str): string that should be inserted at the beginning of a match
        end_boundary (str): string that should be inserted at the end of a match
        fragment_delimeter (str): string that is inserted between two fragments by psql
        min_words (int, optional): minimum number of words per fragment. Defaults to 15.
        max_words (int, optional): maximum number of words per fragment. Defaults to 35.

    Returns:
        Func: A django ORM function expression compiling to a ts_headline function call
    """
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
    query = SearchQuery(term)

    start_boundary = generate_boundary()
    end_boundary = generate_boundary()
    fragment_delimeter = generate_boundary()

    can_view = Q(public=True) | Q(category__in=user_admin_categories)
    if not has_payed:
        can_view = can_view & Q(needs_payment=False)

    exams = (
        Exam.objects.filter(
            id__in=ExamPage.objects.filter(search_vector=term).values("exam_id")
        )
        | Exam.objects.filter(search_vector=term)
    ).annotate(
        rank=SearchRank(F("search_vector"), query),
        headline=headline(
            F("displayname"), query, start_boundary, end_boundary, fragment_delimeter,
        ),
        category_displayname=F("category__displayname"),
        category_slug=F("category__slug"),
    )
    if not is_admin:
        exams = exams.filter(can_view)
    exams = exams.only("filename")[:amount]

    exam_pages_query = (
        ExamPage.objects.filter(
            exam__in=list(exams.values_list("id", flat=True)), search_vector=term
        )
        .annotate(
            rank=SearchRank(F("search_vector"), query),
            headline=headline(
                F("text"), query, start_boundary, end_boundary, fragment_delimeter,
            ),
        )
        .order_by("page_number")
        .only("page_number", "exam_id")
    )

    examDict = dict()
    examScore = dict()
    examPages = dict()
    for exam in exams:
        examScore[exam.id] = exam.rank
        examPages[exam.id] = []
    for examPage in exam_pages_query:
        if examPage.exam_id not in examScore:
            continue
        examScore[examPage.exam_id] = max(examPage.rank, examScore[examPage.exam_id])
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
            "category_displayname": exam.category_displayname,
            "category_slug": exam.category_slug,
            "rank": examScore[exam.id],
            "pages": examPages[exam.id],
        }
        for exam in exams
    ]


def search_answers(term, has_payed, is_admin, user_admin_categories, amount):
    query = SearchQuery(term)

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
            author_username=F("author__username"),
            author_displayname=Case(
                When(Q(author__first_name__isnull=True), "author__last_name",),
                default=Concat("author__first_name", V(" "), "author__last_name"),
            ),
            highlighted_words=headline(
                F("text"), query, start_boundary, end_boundary, fragment_delimeter, 1, 2
            ),
            # Exam
            exam_displayname=F("answer_section__exam__displayname"),
            filename=F("answer_section__exam__filename"),
            # Category
            category_displayname=F("answer_section__exam__category__displayname"),
            category_slug=F("answer_section__exam__category__slug"),
        )
        .values(
            "author_username",
            "author_displayname",
            "text",
            "highlighted_words",
            "rank",
            "long_id",
            # Exam
            "exam_displayname",
            "filename",
            # Category
            "category_displayname",
            "category_slug",
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
    query = SearchQuery(term)

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
            author_username=F("author__username"),
            author_displayname=Case(
                When(Q(author__first_name__isnull=True), "author__last_name",),
                default=Concat("author__first_name", V(" "), "author__last_name"),
            ),
            highlighted_words=headline(
                F("text"), query, start_boundary, end_boundary, fragment_delimeter, 1, 2
            ),
            # Exam
            exam_displayname=F("answer__answer_section__exam__displayname"),
            filename=F("answer__answer_section__exam__filename"),
            # Category
            category_displayname=F(
                "answer__answer_section__exam__category__displayname"
            ),
            category_slug=F("answer__answer_section__exam__category__slug"),
        )
        .values(
            "author_username",
            "author_displayname",
            "text",
            "highlighted_words",
            "rank",
            "long_id",
            # Exam
            "exam_displayname",
            "filename",
            # Category
            "category_displayname",
            "category_slug",
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
    include_exams = request.POST.get("include_exams", "true") == "true"
    include_answers = request.POST.get("include_answers", "true") == "true"
    include_comments = request.POST.get("include_comments", "true") == "true"

    user = request.user
    user_admin_categories = user.category_admin_set.values_list("id", flat=True)
    has_payed = user.has_payed()
    is_admin = has_admin_rights(request)
    exams_start = time.time()
    exams = (
        search_exams(term, has_payed, is_admin, user_admin_categories, amount)
        if include_exams
        else []
    )
    answers_start = time.time()
    answers = (
        search_answers(term, has_payed, is_admin, user_admin_categories, amount)
        if include_answers
        else []
    )
    comments_start = time.time()
    comments = (
        search_comments(term, has_payed, is_admin, user_admin_categories, amount)
        if include_comments
        else []
    )
    start_merge = time.time()
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
    res = sorted(res, key=lambda x: -x["rank"])
    end = time.time()
    if settings.DEBUG:
        logger.info(
            "Found: {exam_count} exams, {answer_count} answers, {comment_count} comments".format(
                exam_count=len(exams),
                answer_count=len(answers),
                comment_count=len(comments),
            )
        )
        logger.info(
            "Time spent: exams: {a} ms, answers: {b} ms, comments: {c} ms, sorting: {d} ms".format(
                a=(answers_start - exams_start) * 1000,
                b=(comments_start - answers_start) * 1000,
                c=(start_merge - comments_start) * 1000,
                d=(end - start_merge) * 1000,
            )
        )
    return response.success(value=res)
