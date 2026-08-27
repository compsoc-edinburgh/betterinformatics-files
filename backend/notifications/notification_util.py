from typing import Literal, overload

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail

from answers.models import Answer
from answers.models import Comment as AnswerComment
from documents.models import Comment as DocumentComment
from documents.models import Document
from notifications.models import Notification, NotificationSetting, NotificationType


def is_notification_enabled(receiver, notification_type):
    return NotificationSetting.objects.filter(
        user=receiver, type=notification_type.value, enabled=True
    ).exists()


def is_notification_email_enabled(receiver: User, notification_type: NotificationType):
    return NotificationSetting.objects.filter(
        user=receiver, type=notification_type.value, email_enabled=True
    ).exists()


@overload
def send_notification(
    sender: User,
    receiver: User,
    type_: Literal[
        NotificationType.NEW_COMMENT_TO_ANSWER,
        NotificationType.NEW_ANSWER_TO_ANSWER,
        NotificationType.NEW_COMMENT_TO_COMMENT,
    ],
    title: str,
    message: str,
    associated_data: Answer,
) -> None: ...


@overload
def send_notification(
    sender: User,
    receiver: User,
    type_: Literal[
        NotificationType.NEW_COMMENT_TO_DOCUMENT, NotificationType.DOCUMENT_TRANSFER
    ],
    title: str,
    message: str,
    associated_data: Document,
) -> None: ...


def send_notification(
    sender: User,
    receiver: User,
    type_: NotificationType,
    title: str,
    message: str,
    associated_data: Answer | Document,
):
    if sender == receiver:
        return
    if is_notification_enabled(receiver, type_):
        send_inapp_notification(
            sender, receiver, type_, title, message, associated_data
        )
    if is_notification_email_enabled(receiver, type_):
        send_email_notification(
            sender, receiver, type_, title, message, associated_data
        )


def send_inapp_notification(sender, receiver, type_, title, message, data):
    # In the case a user has a comment on their own answer, this prevents them from getting
    # 2 notifications if they have both notification options on.
    # "new comment to answer" will be shown instead of "new comment to comment"
    # the only time we want to prevent this is when the receiver is the answer author AND
    # the receiver has both settings turned on
    if (
        isinstance(data, Answer)
        and data.author == receiver
        and type_ == NotificationType.NEW_COMMENT_TO_COMMENT
        and is_notification_enabled(receiver, NotificationType.NEW_COMMENT_TO_ANSWER)
    ):
        return

    notification = Notification(
        sender=sender,
        receiver=receiver,
        type=type_.value,
        title=title,
        text=message,
        answer=data if isinstance(data, Answer) else None,
        document=data if isinstance(data, Document) else None,
    )
    notification.save()


def send_email_notification(
    sender: User,
    receiver: User,
    type_: NotificationType,
    title: str,
    message: str,
    data: Document | Answer,
):
    """If the user has email notifications enabled, send an email notification.

    Parameters
    ----------
    notification : Notification
    """
    if (
        isinstance(data, Answer)
        and data.author == receiver
        and type_ == NotificationType.NEW_COMMENT_TO_COMMENT
        and is_notification_email_enabled(
            receiver, NotificationType.NEW_COMMENT_TO_ANSWER
        )
    ):
        return

    send_mail(
        f"Better Informatics: {title} / {data.display_name if isinstance(data, Document) else data.answer_section.exam.displayname}",
        (
            f"Hello {receiver.profile.display_username}!\n"
            f"{message}\n\n"
            f"View it in context here: {get_absolute_notification_url(data)}"
        ),
        f'"{sender.username} (via Better Informatics)" <{settings.VERIF_CODE_FROM_EMAIL_ADDRESS}>',
        [receiver.email],
        fail_silently=False,
    )


def send_feedback_notification(sender, receiver, type_, title, message, feedback):
    if sender == receiver:
        return
    if not is_notification_enabled(receiver, type_):
        return
    notification = Notification(
        sender=sender,
        receiver=receiver,
        type=type_.value,
        title=title,
        text=message,
        feedback=feedback,
        answer=None,
    )
    notification.save()


def get_absolute_notification_url(data: Document | Answer):
    return (
        f"https://{settings.DEPLOYMENT_DOMAINS[0]}{get_relative_notification_url(data)}"
    )


def get_relative_notification_url(data: Document | Answer):
    if isinstance(data, Answer):
        return f"/exams/{data.answer_section.exam.filename}#{data.long_id}"
    elif isinstance(data, Document):
        return f"/document/{data.slug}"
    # Feedback Page is admin-only, so makes no sense to link it since notification contains reply anyway.
    return ""


def new_comment_to_answer(answer: Answer, new_comment: AnswerComment):
    if answer.kind != Answer.Kind.PERSONAL:
        return
    send_notification(
        new_comment.author,
        answer.author,
        NotificationType.NEW_COMMENT_TO_ANSWER,
        "New comment",
        f"A new comment to your answer was added.\n\n{new_comment.text}",
        answer,
    )


def _new_comment_to_comment(old_comment: AnswerComment, new_comment: AnswerComment):
    send_notification(
        new_comment.author,
        old_comment.author,
        NotificationType.NEW_COMMENT_TO_COMMENT,
        "New comment",
        f"A new comment was added to an answer you commented on.\n\n{new_comment.text}",
        old_comment.answer,
    )


def new_comment_to_comment(answer: Answer, new_comment: AnswerComment):
    done = set()
    for comment in answer.comments.all():
        if comment != new_comment and comment.author not in done:
            done.add(comment.author)
            _new_comment_to_comment(comment, new_comment)


def _new_answer_to_answer(old_answer: Answer, new_answer: Answer):
    if old_answer.kind != Answer.Kind.PERSONAL:
        return
    send_notification(
        new_answer.author,
        old_answer.author,
        NotificationType.NEW_COMMENT_TO_ANSWER,
        "New answer",
        "A new answer was posted to a question you answered.",
        new_answer,
    )


def new_answer_to_answer(new_answer: Answer):
    for other_answer in Answer.objects.filter(
        answer_section=new_answer.answer_section,
        kind=Answer.Kind.PERSONAL,
    ):
        if other_answer != new_answer:
            _new_answer_to_answer(other_answer, new_answer)


def new_comment_to_document(document: Document, new_comment: DocumentComment):
    send_notification(
        new_comment.author,
        document.author,
        NotificationType.NEW_COMMENT_TO_DOCUMENT,
        "New comment",
        f"A new comment was added to your document.\n\n{new_comment.text}",
        document,
    )


def new_feedback_reply(admin_user, feedback):
    send_feedback_notification(
        admin_user,
        feedback.author,
        NotificationType.NEW_COMMENT_TO_FEEDBACK,
        "Reply to your feedback",
        f"An admin has replied to your feedback.\n\n{feedback.reply}",
        feedback=feedback,
    )


def new_document_transfer_request(document: Document):
    sender_displayname = document.author.profile.display_username
    target_user = document.pending_transfer_user
    if not target_user:
        raise ValueError("Received document with pending_transfer_user=None.")

    send_notification(
        sender=document.author,
        receiver=target_user,
        type_=NotificationType.DOCUMENT_TRANSFER,
        title="New document transfer request",
        message=f"{sender_displayname} wants to transfer a document to you.",
        associated_data=document,
    )


# Invariant: Document has already been transferred
def accepted_document_transfer_request(document: Document, old_owner: User):
    target_user_displayname = document.author.profile.display_username

    send_notification(
        sender=document.author,
        receiver=old_owner,
        type_=NotificationType.DOCUMENT_TRANSFER,
        title="Document transfer request accepted",
        message=f"{target_user_displayname} has accepted your document transfer.",
        associated_data=document,
    )


def rejected_document_transfer_request(document: Document, target: User):
    target_user_displayname = target.profile.display_username

    send_notification(
        sender=target,
        receiver=document.author,
        type_=NotificationType.DOCUMENT_TRANSFER,
        title="Document transfer request rejected",
        message=f"{target_user_displayname} has rejected your document transfer.",
        associated_data=document,
    )
