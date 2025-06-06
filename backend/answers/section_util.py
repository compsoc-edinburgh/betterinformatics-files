from ediauth import auth_check
from answers.models import Comment, Answer
from django.db.models import Count, F, Exists, OuterRef, Manager, Prefetch


def prepare_answer_objects(objects: Manager[Answer], request) -> Manager[Answer]:
    # Important optimization. Prevents amount of queries from
    # increasing quadratically ((N+1 problem)^2) and instead
    # results in a constant amount of queries.
    comments_query = Comment.objects.select_related("author").order_by("time", "id")
    return (
        objects.annotate(
            expert_count=Count("expertvotes", distinct=True),
            downvotes_count=Count("downvotes", distinct=True),
            upvotes_count=Count("upvotes", distinct=True),
            flagged_count=Count("flagged", distinct=True),
            is_upvoted=Exists(
                Answer.objects.filter(id=OuterRef("id"), upvotes=request.user)
            ),
            is_downvoted=Exists(
                Answer.objects.filter(id=OuterRef("id"), downvotes=request.user)
            ),
            is_expertvoted=Exists(
                Answer.objects.filter(id=OuterRef("id"), expertvotes=request.user)
            ),
            is_flagged=Exists(
                Answer.objects.filter(id=OuterRef("id"), flagged=request.user)
            ),
            delta_votes=F("upvotes_count") - F("downvotes_count"),
        )
        .prefetch_related(
            Prefetch(
                "comments",
                queryset=comments_query,
                to_attr="all_comments",
            )
        )
        .select_related("author")
    )


def get_answer_response(request, answer: Answer, ignore_exam_admin=False):
    """
    Call `prepare_answer_objects` on the answer objects beforehand to annotate
    them with the required aggregations. This function will fail otherwise.
    """
    if ignore_exam_admin:
        exam_admin = False
    else:
        exam_admin = auth_check.has_admin_rights_for_exam(
            request, answer.answer_section.exam
        )
    try:
        comments = [
            {
                "oid": comment.id,
                "longId": comment.long_id,
                "text": comment.text,
                "authorId": comment.author.username,
                "authorDisplayName": comment.author.profile.display_username,
                "canEdit": comment.author == request.user,
                "time": comment.time,
                "edittime": comment.edittime,
            }
            for comment in answer.all_comments
        ]
        
        # Handle anonymous answers
        # Check if user is an admin (either exam admin or global admin)
        is_admin = (ignore_exam_admin is False and exam_admin) or auth_check.has_admin_rights(request)
        
        if answer.is_anonymous:
            if is_admin:
                # Admins see the real username but with an indication it's anonymous
                author_id = answer.author.username
                author_display_name = answer.author.profile.display_username
            else:
                # Regular users see "Anonymous"
                author_id = "anonymous"
                author_display_name = "Anonymous"
        else:
            author_id = answer.author.username
            author_display_name = answer.author.profile.display_username
        
        return {
            "oid": answer.id,
            "longId": answer.long_id,
            "upvotes": answer.delta_votes,
            "expertvotes": answer.expert_count,
            "authorId": author_id,
            "authorDisplayName": author_display_name,
            "canEdit": answer.author == request.user,
            "isUpvoted": answer.is_upvoted,
            "isDownvoted": answer.is_downvoted,
            "isExpertVoted": answer.is_expertvoted,
            "isFlagged": answer.is_flagged,
            "flagged": answer.flagged_count,
            "comments": comments,
            "text": answer.text,
            "time": answer.time,
            "edittime": answer.edittime,
            "filename": answer.answer_section.exam.filename,
            "sectionId": answer.answer_section.id,
            "isAnonymous": answer.is_anonymous,
        }
    except AttributeError:
        raise ValueError(
            "The given answer has not been prepared with 'prepare_answer_objects'"
        )


def get_comment_response(request, comment: Comment):
    return {
        "oid": comment.id,
        "longId": comment.long_id,
        "answerId": comment.answer.long_id,
        "text": comment.text,
        "authorId": comment.author.username,
        "authorDisplayName": comment.author.profile.display_username,
        "time": comment.time,
        "edittime": comment.edittime,
        "exam_displayname": comment.answer.answer_section.exam.displayname,
        "filename": comment.answer.answer_section.exam.filename,
        "category_displayname": comment.answer.answer_section.exam.category.displayname,
        "category_slug": comment.answer.answer_section.exam.category.slug,
    }


def get_answersection_response(request, section):
    prepared_query = prepare_answer_objects(section.answer_set, request)

    answers = [
        get_answer_response(request, answer)
        for answer in sorted(
            prepared_query, key=lambda x: (-x.expert_count, -x.delta_votes, x.time)
        )
    ]
    return {
        "oid": section.id,
        "answers": answers,
        "allow_new_answer": not prepared_query.filter(author=request.user).exists(),
        "cutVersion": section.cut_version,
        "has_answers": section.has_answers,
    }


def get_answer_fields_to_preselect():
    return [
        "author",
        "answer_section",
        "answer_section__exam",
        "answer_section__exam__category",
    ]


def get_answer_fields_to_prefetch():
    return [
        "upvotes",
        "downvotes",
        "expertvotes",
        "flagged",
        "comments",
        "comments__author",
    ]


def get_comment_fields_to_preselect():
    return [
        "answer",
        "author",
        "answer__answer_section",
        "answer__answer_section__exam",
        "answer__answer_section__exam__category",
    ]


def get_comment_fields_to_prefetch():
    return []


def increase_section_version(section):
    section.cut_version += 1
    section.save()
