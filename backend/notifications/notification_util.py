from notifications.models import Notification, NotificationType, NotificationSetting
from answers.models import Answer, Comment as AnswerComment
from documents.models import Document, Comment as DocumentComment
from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from typing import overload, Literal, Union


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
    type_: Literal[NotificationType.NEW_COMMENT_TO_DOCUMENT],
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
    associated_data: Union[Answer, Document],
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
    data: Union[Document, Answer],
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
        f"BetterInformatics: {title} / {data.display_name if isinstance(data, Document) else data.answer_section.exam.displayname}",
        (
            f"Hello {receiver.profile.display_username}!\n"
            f"{message}\n\n"
            f"View it in context here: {get_absolute_notification_url(data)}"
        ),
        f"{sender.username} (BetterInformatics) <{settings.VERIF_CODE_FROM_EMAIL_ADDRESS}>",
        [receiver.email],
        fail_silently=False,
    )


def get_absolute_notification_url(data: Union[Document, Answer]):
    if isinstance(data, Answer):
        return f"https://{settings.DEPLOYMENT_DOMAINS[0]}/exams/{data.answer_section.exam.filename}#{data.long_id}"
    else:
        return f"https://{settings.DEPLOYMENT_DOMAINS[0]}/user/{data.author.username}/document/{data.slug}"


def new_comment_to_answer(answer: Answer, new_comment: AnswerComment):
    send_notification(
        new_comment.author,
        answer.author,
        NotificationType.NEW_COMMENT_TO_ANSWER,
        "New comment",
        "A new comment to your answer was added.\n\n{}".format(new_comment.text),
        answer,
    )


def _new_comment_to_comment(old_comment: AnswerComment, new_comment: AnswerComment):
    send_notification(
        new_comment.author,
        old_comment.author,
        NotificationType.NEW_COMMENT_TO_COMMENT,
        "New comment",
        "A new comment to an answer you commented was added.\n\n{}".format(
            new_comment.text
        ),
        old_comment.answer,
    )


def new_comment_to_comment(answer: Answer, new_comment: AnswerComment):
    done = set()
    for comment in answer.comments.all():
        if comment != new_comment and comment.author not in done:
            done.add(comment.author)
            _new_comment_to_comment(comment, new_comment)


def _new_answer_to_answer(old_answer: Answer, new_answer: Answer):
    send_notification(
        new_answer.author,
        old_answer.author,
        NotificationType.NEW_COMMENT_TO_ANSWER,
        "New answer",
        "A new answer was posted to a question you answered.",
        new_answer,
    )


def new_answer_to_answer(new_answer: Answer):
    for other_answer in Answer.objects.filter(answer_section=new_answer.answer_section):
        if other_answer != new_answer:
            _new_answer_to_answer(other_answer, new_answer)


def new_comment_to_document(document: Document, new_comment: DocumentComment):
    send_notification(
        new_comment.author,
        document.author,
        NotificationType.NEW_COMMENT_TO_DOCUMENT,
        "New comment",
        "A new comment was added to your document.\n\n{}".format(new_comment.text),
        document,
    )
