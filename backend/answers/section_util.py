from myauth.models import get_my_user
from myauth import auth_check
from answers.models import Comment


def get_answer_response(request, answer, ignore_exam_admin=False):
    if ignore_exam_admin:
        exam_admin = False
    else:
        exam_admin = auth_check.has_admin_rights_for_exam(request, answer.answer_section.exam)
    comments = [
        {
            'oid': comment.id,
            'longId': comment.long_id,
            'text': comment.text,
            'authorId': comment.author.username,
            'authorDisplayName': get_my_user(comment.author).displayname(),
            'canEdit': comment.author == request.user,
            'time': comment.time,
            'edittime': comment.edittime,
        } for comment in answer.comments.order_by('time', 'id').all()
    ]
    return {
        'oid': answer.id,
        'longId': answer.long_id,
        'upvotes': answer.upvotes.count() - answer.downvotes.count(),
        'expertvotes': answer.expertvotes.count(),
        'authorId': '' if answer.is_legacy_answer else answer.author.username,
        'authorDisplayName': 'Old VISki Solution' if answer.is_legacy_answer else get_my_user(answer.author).displayname(),
        'canEdit': answer.author == request.user or (answer.is_legacy_answer and exam_admin),
        'isUpvoted': request.user in answer.upvotes.all(),
        'isDownvoted': request.user in answer.downvotes.all(),
        'isExpertVoted': request.user in answer.expertvotes.all(),
        'isFlagged': request.user in answer.flagged.all(),
        'flagged': answer.flagged.count(),
        'comments': comments,
        'text': answer.text,
        'time': answer.time,
        'edittime': answer.edittime,
        'filename': answer.answer_section.exam.filename,
        'sectionId': answer.answer_section.id,
        'isLegacyAnswer': answer.is_legacy_answer,
    }


def get_comment_response(request, comment: Comment):
    return {
        'oid': comment.id,
        'longId': comment.long_id,
        'answerId': comment.answer.long_id,
        'text': comment.text,
        'authorId': comment.author.username,
        'authorDisplayName': get_my_user(comment.author).displayname(),
        'time': comment.time,
        'edittime': comment.edittime,
        'exam_displayname': comment.answer.answer_section.exam.displayname,
        'filename': comment.answer.answer_section.exam.filename,
        'category_displayname': comment.answer.answer_section.exam.category.displayname,
        'category_slug': comment.answer.answer_section.exam.category.slug
    }


def get_answersection_response(request, section):
    answers = [
        get_answer_response(request, answer)
        for answer in sorted(
            section.answer_set.all(),
            key=lambda x: (-x.expertvotes.count(), x.downvotes.count() - x.upvotes.count(), x.time)
        )
    ]
    return {
        'oid': section.id,
        'answers': answers,
        'allow_new_answer': not section.answer_set.filter(author=request.user, is_legacy_answer=False).exists(),
        'allow_new_legacy_answer': not section.answer_set.filter(is_legacy_answer=True).exists(),
        'cutVersion': section.cut_version,
        'has_answers': section.has_answers,
    }


def get_answer_fields_to_preselect():
    return [
        'author',
        'answer_section',
        'answer_section__exam',
        'answer_section__exam__category',
    ]


def get_answer_fields_to_prefetch():
    return [
        'upvotes',
        'downvotes',
        'expertvotes',
        'flagged',
        'comments',
        'comments__author',
    ]


def increase_section_version(section):
    section.cut_version += 1
    section.save()
