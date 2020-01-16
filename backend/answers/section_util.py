from myauth.models import get_my_user
from myauth import auth_check


def get_answer_response(request, answer):
    exam_admin = auth_check.has_admin_rights_for_exam(request, answer.section.exam)
    comments = [
        {
            'oid': comment.id,
            'longId': comment.long_id,
            'text': comment.text,
            'authorId': comment.author.username,
            'authorDisplayName': get_my_user(comment.author).displayname(),
            'canEdit': comment.author == request.author,
            'time': comment.time,
            'edittime': comment.edittime,
        } for comment in answer.comment_set.all()
    ]
    return {
        'oid': answer.id,
        'longId': answer.long_id,
        'upvotes': len(answer.upvotes) - len(answer.downvotes),
        'expertvotes': len(answer.expertvotes),
        'authorId': answer.author.username,
        'authorDisplayName': 'Old VISki Solution' if answer.is_legacy_answer else get_my_user(answer.author).displayname(),
        'canEdit': answer.author == request.author or (answer.is_legacy_answer and exam_admin),
        'isUpvoted': request.user in answer.upvotes,
        'isDownvoted': request.user in answer.downvotes,
        'isExpertVoted': request.user in answer.expertvotes,
        'isFlagged': request.user in answer.flagged,
        'flagged': len(answer.flagged),
        'comments': comments,
        'text': answer.text,
        'time': answer.time,
        'edittime': answer.edittime,
        'filename': answer.exam.filename,
        'sectionId': answer.section.id,
    }


def get_ansersection_response(request, section):
    answers = [
        get_answer_response(request, answer)
        for answer in section.answer_set.all()
        if len(answer.text) > 0
    ]
    return {
        'oid': section.id,
        'answers': answers,
        'allow_new_answer': not section.answer_set.filter(author=request.user).exists(),
        'allow_new_legacy_answer': not section.answer_set.filter(is_legacy_answer=True).exists(),
        'cutVersion': section.cut_version,
    }
