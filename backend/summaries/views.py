from datetime import timezone
from myauth.models import get_my_user
import minio
from summaries.models import Comment, Summary
from myauth import auth_check
from django.views import View
from django.conf import settings
from django.shortcuts import get_object_or_404
from util import response, minio_util
from django.db.models import Count
from categories.models import Category
import logging
from django.http import HttpRequest

logger = logging.getLogger(__name__)


def get_comment_obj(comment: Comment, request: HttpRequest):
    return {
        "oid": comment.pk,
        "text": comment.text,
        "authorId": comment.author.username,
        "authorDisplayName": get_my_user(comment.author).displayname(),
        "canEdit": comment.current_user_can_edit(request),
        "time": comment.time,
        "edittime": comment.edittime,
    }


def get_summary_obj(
    summary: Summary, request: HttpRequest, include_comments: bool = False
):
    obj = {
        "slug": summary.slug,
        "display_name": summary.display_name,
        "category": summary.category.slug,
        "category_display_name": summary.category.displayname,
        "author": summary.author.username,
        "filename": summary.filename,
        "mime_type": summary.mime_type,
    }
    if include_comments:
        obj["comments"] = [
            get_comment_obj(comment, request) for comment in summary.comments.all()
        ]
    return obj


def create_summary_slug(summary_name: str, author_name: str):
    """
    Create a valid and unique slug for the summary display name
    :param summary: display name
    :param author_name: author_name
    """
    oslug = "".join(
        filter(
            lambda x: x in settings.COMSOL_SUMMARY_SLUG_CHARS,
            author_name.lower() + "-" + summary_name.lower(),
        )
    )

    def exists(aslug):
        return Summary.objects.filter(slug=aslug).exists()

    slug = oslug
    cnt = 0
    while exists(slug):
        cnt += 1
        slug = oslug + "_" + str(cnt)

    return slug


def prepare_summary_pdf_file(request):
    file = request.FILES.get("file")
    if not file:
        return response.missing_argument(), None
    orig_filename = file.name
    ext = minio_util.check_filename(
        orig_filename, settings.COMSOL_SUMMARY_ALLOWED_EXTENSIONS
    )
    if not ext:
        return response.not_possible("Invalid File Extension"), None
    return None, file, ext


def user_liked(request):
    return Count("likes", filter=Q(likes__pk=request.user.pk))


like_count = Count("likes")


class SummaryRootView(View):
    http_method_names = ["get", "post"]

    @auth_check.require_login
    def get(self, request: HttpRequest):
        objects = Summary.objects.annotate(
            like_count=like_count,
            liked=user_liked(request),
        )

        category = request.GET.get("category", "author")
        if category is not None:
            objects = objects.filter(category__slug=category)
        include_comments = "include_comments" in request.GET
        if include_comments:
            objects = objects.prefetch_related("comments", "comments__author")

        res = [
            get_summary_obj(summary, request, include_comments)
            for summary in objects.prefetch_related("category", "author").all()
        ]
        return response.success(value=res)

    @response.required_args("display_name", "category")
    @auth_check.require_login
    def post(self, request: HttpRequest):
        err, file, ext = prepare_summary_pdf_file(request)
        if err is not None:
            return err
        category = get_object_or_404(Category, slug=request.POST["category"])
        filename = minio_util.generate_filename(
            16, settings.COMSOL_SUMMARY_DIR, "." + ext
        )
        display_name = request.POST["display_name"]
        summary = Summary(
            slug=create_summary_slug(display_name, request),
            display_name=display_name,
            category=category,
            author=request.user,
            filename=filename,
            mime_type=file.content_type,
        )
        summary.save()
        minio_util.save_uploaded_file_to_minio(
            settings.COMSOL_SUMMARY_DIR, filename, file, file.content_type
        )

        return response.success(value=get_summary_obj(summary, request))


class SummaryElementView(View):
    http_method_names = ["get", "delete", "put"]

    @auth_check.require_login
    def get(self, request: HttpRequest, slug: str):
        objects = Summary.objects.prefetch_related("category", "author")

        include_comments = "include_comments" in request.GET
        if include_comments:
            objects = objects.prefetch_related("comments", "comments__author")
        summary = get_object_or_404(objects, slug=slug)
        return response.success(
            value=get_summary_obj(summary, request, include_comments)
        )

    @auth_check.require_login
    def put(self, request: HttpRequest, slug: str):
        summary = get_object_or_404(Summary, slug=slug)
        if not summary.current_user_can_edit(request):
            return response.not_allowed()
        if "display_name" in request.DATA:
            summary.display_name = request.DATA["display_name"]
        if "file" in request.FILES:
            err, file, ext = prepare_summary_pdf_file(request)
            if err is not None:
                return err
            if not summary.filename.endswith(ext):
                minio_util.delete_file(settings.COMSOL_SUMMARY_DIR, summary.filename)
                filename = minio_util.generate_filename(
                    16, settings.COMSOL_SUMMARY_DIR, "." + ext
                )
                summary.filename = filename
                summary.mime_type = file.content_type

            minio_util.save_uploaded_file_to_minio(
                settings.COMSOL_SUMMARY_DIR,
                summary.filename,
                file,
                summary.mime_type,
            )
        summary.save()
        return response.success(value=get_summary_obj(summary, request))

    @auth_check.require_login
    def delete(self, request: HttpRequest, slug: str):
        objects = Summary.objects.prefetch_related("author")
        summary = get_object_or_404(objects, slug=slug)
        if not summary.current_user_can_delete(request):
            return response.not_allowed()
        summary.delete()
        success = minio_util.delete_file(
            settings.COMSOL_SUMMARY_DIR,
            summary.filename,
        )
        return response.success(value=success)


class SummaryCommentRootView(View):
    http_method_names = ["get", "post"]

    @auth_check.require_login
    def get(self, request: HttpRequest, summary_slug: str):
        summary = get_object_or_404(Summary, slug=summary_slug)
        objects = Comment.objects.filter(summary=summary).all()
        return response.success(
            value=[get_comment_obj(comment, request) for comment in objects]
        )

    @response.required_args("text")
    @auth_check.require_login
    def post(self, request: HttpRequest, summary_slug: str):
        summary = get_object_or_404(Summary, slug=summary_slug)
        comment = Comment(
            summary=summary, text=request.POST["text"], author=request.user
        )
        comment.save()
        return response.success(value=get_comment_obj(comment, request))


class SummaryCommentElementView(View):
    http_method_names = ["get", "delete", "put"]

    @auth_check.require_login
    def get(self, request: HttpRequest, summary_slug: str, id: int):
        comment = get_object_or_404(Comment, pk=id, summary__slug=summary_slug)
        return get_comment_obj(comment, request)

    def put(self, request: HttpRequest, summary_slug: str, id: int):
        objects = Comment.objects.prefetch_related("author")
        comment = get_object_or_404(objects, pk=id, summary__slug=summary_slug)
        if not comment.current_user_can_edit(request):
            return response.not_allowed()
        comment.edittime = timezone.now()
        if "text" in request.DATA:
            comment.text = request.DATA["text"]
        comment.save()
        return response.success(value=get_comment_obj(comment, request))

    def delete(self, request: HttpRequest, summary_slug: str, id: int):
        objects = Comment.objects.prefetch_related("author")
        comment = get_object_or_404(objects, pk=id, summary__slug=summary_slug)
        if not comment.current_user_can_delete(request):
            return response.not_allowed()
        comment.delete()
        return response.success(value=True)


@response.request_get()
def get_summary_file(request, filename):
    get_object_or_404(Summary, filename=filename)
    return minio_util.send_file(
        settings.COMSOL_SUMMARY_DIR,
        filename,
        as_attachment=True,
        attachment_filename=filename,
    )
