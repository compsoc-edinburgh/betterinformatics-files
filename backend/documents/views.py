from django.http.response import (
    HttpResponse,
    HttpResponseForbidden,
)
from django.utils import timezone
from typing import Union

from django.views.decorators.csrf import csrf_exempt
from myauth.models import MyUser, get_my_user
from documents.models import Comment, Document, DocumentFile
from myauth import auth_check
from django.views import View
from django.conf import settings
from django.shortcuts import get_object_or_404
from util import response, s3_util
from django.db.models import Count
from categories.models import Category
import logging
from django.http import HttpRequest
from django.db.models import Q
import os.path
from django.core.signing import Signer, BadSignature

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


document_update_signer = Signer(salt="edit_document")


def get_file_obj(file: DocumentFile, include_key: bool = False):
    obj = {
        "oid": file.pk,
        "display_name": file.display_name,
        "filename": file.filename,
        "mime_type": file.mime_type,
    }

    if include_key:
        obj["key"] = document_update_signer.sign(file.pk)

    return obj


def get_document_obj(
    document: Document,
    request: HttpRequest,
    include_comments: bool = False,
    include_files: bool = False,
):
    obj = {
        "slug": document.slug,
        "display_name": document.display_name,
        "description": document.description,
        "category": document.category.slug,
        "category_display_name": document.category.displayname,
        "author": document.author.username,
        "can_edit": document.current_user_can_edit(request),
        "can_delete": document.current_user_can_delete(request),
    }
    if hasattr(document, "like_count"):
        obj["like_count"] = document.like_count
    if hasattr(document, "liked"):
        obj["liked"] = document.liked

    if include_comments:
        obj["comments"] = [
            get_comment_obj(comment, request) for comment in document.comments.all()
        ]

    if include_files:
        obj["files"] = [
            get_file_obj(file, document.current_user_can_edit(request))
            for file in document.files.all()
        ]

    return obj


def create_document_slug(
    document_name: str, author: MyUser, existing: Union[Document, None] = None
):
    """
    Create a valid and unique slug for the document display name
    :param document: display name
    :param author_name: author_name
    """
    oslug = "".join(
        filter(
            lambda x: x in settings.COMSOL_DOCUMENT_SLUG_CHARS,
            document_name.lower().replace(" ", "-"),
        )
    )
    if oslug == "":
        oslug = "🧠"

    def exists(aslug):
        objects = Document.objects.filter(slug=aslug, author=author)
        if existing is not None:
            objects = objects.exclude(pk=existing.pk)
        return objects.exists()

    slug = oslug
    cnt = 0
    while exists(slug):
        slug = oslug + "_" + str(cnt)
        cnt += 1

    return slug


def is_allowed(ext: str, mime_type: str):
    return (ext, mime_type) in settings.COMSOL_DOCUMENT_ALLOWED_EXTENSIONS


def prepare_document_file(request: HttpRequest):
    file = request.FILES.get("file")
    if not file:
        return response.missing_argument(), None, None
    _, ext = os.path.splitext(file.name)
    if not is_allowed(ext, file.content_type):
        return response.not_allowed(), None, None
    return None, file, ext


def user_liked(request):
    return Count("likes", filter=Q(likes__pk=request.user.pk))


like_count = Count("likes")


class DocumentRootView(View):
    http_method_names = ["get", "post"]

    @auth_check.require_login
    def get(self, request: HttpRequest):
        objects = Document.objects.annotate(
            like_count=like_count,
            liked=user_liked(request),
        ).prefetch_related("category", "author")

        category = request.GET.get("category", "author")
        if category is not None:
            objects = objects.filter(category__slug=category)

        include_comments = "include_comments" in request.GET
        if include_comments:
            objects = objects.prefetch_related("comments", "comments__author")

        include_files = "include_files" in request.GET
        if include_files:
            objects = objects.prefetch_related("files")

        res = [
            get_document_obj(document, request, include_comments, include_files)
            for document in objects.all()
        ]
        return response.success(value=res)

    @response.required_args("display_name", "category")
    @auth_check.require_login
    def post(self, request: HttpRequest):
        category = get_object_or_404(Category, slug=request.POST["category"])
        display_name = request.POST["display_name"]
        # description is optional
        description = request.POST.get("description", "")
        document = Document(
            slug=create_document_slug(display_name, request.user),
            display_name=display_name,
            description=description,
            category=category,
            author=request.user,
        )
        document.save()

        return response.success(value=get_document_obj(document, request))


class DocumentElementView(View):
    http_method_names = ["get", "delete", "put"]

    @auth_check.require_login
    def get(self, request: HttpRequest, username: str, slug: str):
        objects = Document.objects.prefetch_related("category", "author").annotate(
            like_count=like_count,
            liked=user_liked(request),
        )

        include_comments = "include_comments" in request.GET
        if include_comments:
            objects = objects.prefetch_related("comments", "comments__author")

        include_files = "include_files" in request.GET
        if include_files:
            objects = objects.prefetch_related("files")

        document = get_object_or_404(objects, author__username=username, slug=slug)
        return response.success(
            value=get_document_obj(document, request, include_comments, include_files)
        )

    @auth_check.require_login
    def put(self, request: HttpRequest, username: str, slug: str):
        document = get_object_or_404(Document, author__username=username, slug=slug)
        if not document.current_user_can_edit(request):
            return response.not_allowed()
        if "description" in request.DATA:
            document.description = request.DATA["description"]
        if "display_name" in request.DATA:
            document.display_name = request.DATA["display_name"]
            document.slug = create_document_slug(
                document.display_name, request.user, document
            )
        if "category" in request.DATA:
            category = get_object_or_404(Category, slug=request.DATA["category"])
            document.category = category
        if "liked" in request.DATA:
            if request.DATA["liked"] == "true":
                document.likes.add(request.user)
            else:
                document.likes.remove(request.user)
        document.save()
        return response.success(value=get_document_obj(document, request))

    @auth_check.require_login
    def delete(self, request: HttpRequest, username: str, slug: str):
        objects = Document.objects.prefetch_related("author")
        document = get_object_or_404(objects, author__username=username, slug=slug)
        if not document.current_user_can_delete(request):
            return response.not_allowed()
        document.delete()
        return response.success()


class DocumentCommentRootView(View):
    http_method_names = ["get", "post"]

    @auth_check.require_login
    def get(self, request: HttpRequest, username: str, document_slug: str):
        document = get_object_or_404(
            Document, author__username=username, slug=document_slug
        )
        objects = Comment.objects.filter(document=document).all()
        return response.success(
            value=[get_comment_obj(comment, request) for comment in objects]
        )

    @response.required_args("text")
    @auth_check.require_login
    def post(self, request: HttpRequest, username: str, document_slug: str):
        document = get_object_or_404(
            Document, author__username=username, slug=document_slug
        )
        comment = Comment(
            document=document, text=request.POST["text"], author=request.user
        )
        comment.save()
        return response.success(value=get_comment_obj(comment, request))


class DocumentCommentElementView(View):
    http_method_names = ["get", "delete", "put"]

    @auth_check.require_login
    def get(self, request: HttpRequest, username: str, document_slug: str, id: int):
        comment = get_object_or_404(
            Comment,
            pk=id,
            document__author__username=username,
            document__slug=document_slug,
        )
        return get_comment_obj(comment, request)

    @auth_check.require_login
    def put(self, request: HttpRequest, username: str, document_slug: str, id: int):
        objects = Comment.objects.prefetch_related("author")
        comment = get_object_or_404(
            objects,
            pk=id,
            document__author__username=username,
            document__slug=document_slug,
        )
        if not comment.current_user_can_edit(request):
            return response.not_allowed()
        comment.edittime = timezone.now()
        if "text" in request.DATA:
            comment.text = request.DATA["text"]
        comment.save()
        return response.success(value=get_comment_obj(comment, request))

    @auth_check.require_login
    def delete(self, request: HttpRequest, username: str, document_slug: str, id: int):
        objects = Comment.objects.prefetch_related("author")
        comment = get_object_or_404(
            objects,
            pk=id,
            document__author__username=username,
            document__slug=document_slug,
        )
        if not comment.current_user_can_delete(request):
            return response.not_allowed()
        comment.delete()
        return response.success()


class DocumentFileRootView(View):
    http_method_names = ["get", "post"]

    @auth_check.require_login
    def get(self, request: HttpRequest, username: str, document_slug: str):
        document = get_object_or_404(
            Document, author__username=username, slug=document_slug
        )
        objects = DocumentFile.objects.filter(document=document).all()
        return response.success(
            value=[get_document_file(file, request) for file in objects]
        )

    @response.required_args("display_name")
    @auth_check.require_login
    def post(self, request: HttpRequest, username: str, document_slug: str):
        document = get_object_or_404(
            Document, author__username=username, slug=document_slug
        )
        if not document.current_user_can_edit(request):
            return response.not_allowed()

        err, file, ext = prepare_document_file(request)
        if err is not None:
            return err

        filename = s3_util.generate_filename(16, settings.COMSOL_DOCUMENT_DIR, ext)
        document_file = DocumentFile(
            display_name=request.POST["display_name"],
            document=document,
            filename=filename,
            mime_type=file.content_type,
        )
        document_file.save()

        s3_util.save_uploaded_file_to_s3(
            settings.COMSOL_DOCUMENT_DIR, filename, file, file.content_type
        )

        # We know that the current user can edit the document and can therefore always include the key
        return response.success(value=get_file_obj(document_file, True))


class DocumentFileElementView(View):
    http_method_names = ["get", "delete", "put"]

    @auth_check.require_login
    def get(self, request: HttpRequest, username: str, document_slug: str, id: int):
        document_file = get_object_or_404(
            DocumentFile,
            pk=id,
            document__author__username=username,
            document__slug=document_slug,
        )
        return get_file_obj(
            document_file, document_file.document.current_user_can_edit(request)
        )

    @auth_check.require_login
    def put(self, request: HttpRequest, username: str, document_slug: str, id: int):
        document = get_object_or_404(
            Document, author__username=username, slug=document_slug
        )
        if not document.current_user_can_edit(request):
            return response.not_allowed()

        document_file = get_object_or_404(
            DocumentFile,
            pk=id,
            document=document,
        )
        document_file.edittime = timezone.now()

        if "display_name" in request.DATA:
            document_file.display_name = request.DATA["display_name"]

        if "file" in request.FILES:
            err, file, ext = prepare_document_file(request)
            if err is not None:
                return err
            if not document_file.filename.endswith(ext):
                s3_util.delete_file(
                    settings.COMSOL_DOCUMENT_DIR, document_file.filename
                )
                filename = s3_util.generate_filename(
                    16, settings.COMSOL_DOCUMENT_DIR, ext
                )
                document_file.filename = filename
                document_file.mime_type = file.content_type

            s3_util.save_uploaded_file_to_s3(
                settings.COMSOL_DOCUMENT_DIR,
                document_file.filename,
                file,
                document_file.mime_type,
            )

        document_file.save()
        # We know that the current user can edit the document and can therefore always include the key
        return response.success(value=get_file_obj(document_file, True))

    @auth_check.require_login
    def delete(self, request: HttpRequest, username: str, document_slug: str, id: int):
        document = get_object_or_404(
            Document, author__username=username, slug=document_slug
        )
        if not document.current_user_can_edit(request):
            return response.not_allowed()

        document_file = get_object_or_404(
            DocumentFile,
            pk=id,
            document=document,
        )

        document_file.delete()
        success = s3_util.delete_file(
            settings.COMSOL_DOCUMENT_DIR,
            document_file.filename,
        )

        return response.success(value=success)


@response.request_get()
def get_document_file(request, filename):
    document_file = get_object_or_404(DocumentFile, filename=filename)
    _, ext = os.path.splitext(document_file.filename)
    attachment_filename = document_file.display_name + ext
    return s3_util.send_file(
        settings.COMSOL_DOCUMENT_DIR,
        filename,
        as_attachment=True,
        attachment_filename=attachment_filename,
    )


@csrf_exempt
@response.request_post()
def update_file(request: HttpRequest):
    token = request.headers.get("Authorization", "")
    document_file_pk = 0
    try:
        document_file_pk = int(document_update_signer.unsign(token))
    except BadSignature:
        return HttpResponseForbidden("authorization token signature didn't match")
    except ValueError:
        return HttpResponseForbidden("invalid authorization token")

    document_file = get_object_or_404(
        DocumentFile,
        pk=document_file_pk,
    )
    document_file.edittime = timezone.now()

    err, file, ext = prepare_document_file(request)
    if err is not None:
        return err

    s3_util.save_uploaded_file_to_s3(
        settings.COMSOL_DOCUMENT_DIR,
        document_file.filename,
        file,
        document_file.mime_type,
    )

    document_file.save()

    return HttpResponse("updated")