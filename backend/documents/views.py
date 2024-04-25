import logging
import os.path
from typing import Union

from categories.models import Category
from django.conf import settings
from django.db.models import Count, Q
from django.http import HttpRequest
from django.http.response import HttpResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from myauth import auth_check
from myauth.models import MyUser, get_my_user
from util import s3_util, response

from documents.models import Comment, Document, DocumentType, DocumentFile, generate_api_key
from notifications import notification_util

logger = logging.getLogger(__name__)

@response.request_get()
@auth_check.require_login
def list_document_types(request):
    return response.success(
        value=list(DocumentType.objects.values_list("display_name", flat=True).order_by("order"))
    )

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


def get_file_obj(file: DocumentFile):
    return {
        "oid": file.pk,
        "display_name": file.display_name,
        "filename": file.filename,
        "mime_type": file.mime_type,
    }


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
        "document_type": document.document_type.display_name,
        "category_display_name": document.category.displayname,
        "author": document.author.username,
        "author_displayname": get_my_user(document.author).displayname(),
        "can_edit": document.current_user_can_edit(request),
        "can_delete": document.current_user_can_delete(request),
        "time": document.time,
        "edittime": document.edittime,
    }
    if hasattr(document, "like_count"):
        obj["like_count"] = document.like_count
    if hasattr(document, "liked"):
        obj["liked"] = document.liked
    if document.current_user_can_edit(request):
        obj["api_key"] = document.api_key

    if include_comments:
        obj["comments"] = [
            get_comment_obj(comment, request) for comment in document.comments.all()
        ]

    if include_files:
        obj["files"] = [get_file_obj(file) for file in document.files.all()]

    return obj


def is_allowed(ext: str, mime_type: str):
    return (ext, mime_type) in settings.COMSOL_DOCUMENT_ALLOWED_EXTENSIONS


def prepare_document_file(request: HttpRequest, override_allowed=False):
    file = request.FILES.get("file")
    if not file:
        return response.missing_argument(), None, None
    _, ext = os.path.splitext(file.name)
    if not is_allowed(ext, file.content_type):
        return response.unsupported_media_type(), None, None
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

        liked_by = request.GET.get("liked_by")
        username = request.GET.get("username")
        category = request.GET.get("category")
        document_type = request.GET.get("document_type")

        if document_type is not None:
            objects = objects.filter(document_type__display_name=document_type)

        if liked_by is not None:
            if liked_by == request.user.username:
                # to ensure one can only view their own liked documents
                objects = objects.filter(likes__username=request.user.username)
            else:
                return response.not_allowed()
        elif username is not None:
            objects = objects.filter(author__username=username)
        elif category is not None:
            objects = objects.filter(category__slug=category)
        else:  # if nothing is given, we return an empty result instead of giving back everything
            return response.success(value=[])

        include_comments = "include_comments" in request.GET
        if include_comments:
            objects = objects.prefetch_related("comments", "comments__author")

        include_files = "include_files" in request.GET
        if include_files:
            objects = objects.prefetch_related("files")

        res = [
            get_document_obj(document, request,
                             include_comments, include_files)
            for document in objects.all()
        ]
        return response.success(value=res)

    @response.required_args("display_name", "category")
    @auth_check.require_login
    def post(self, request: HttpRequest):
        category = get_object_or_404(Category, slug=request.POST["category"])
        if request.POST["display_name"].strip() == "":
            return response.not_possible("Invalid displayname")
        display_name = request.POST["display_name"]
        # description is optional
        description = request.POST.get("description", "")
        document = Document(
            display_name=display_name,
            description=description,
            category=category,
            author=request.user,
            document_type=DocumentType.objects.get(display_name="Documents")
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

        document = get_object_or_404(
            objects, author__username=username, slug=slug)

        return response.success(
            value=get_document_obj(
                document, request, include_comments, include_files)
        )

    @auth_check.require_login
    def put(self, request: HttpRequest, username: str, slug: str):
        document = get_object_or_404(
            Document, author__username=username, slug=slug)
        if "liked" in request.DATA:
            if request.DATA["liked"] == "true":
                document.likes.add(request.user)
            else:
                document.likes.remove(request.user)

        can_edit = document.current_user_can_edit(request)
        edited = False
        if "description" in request.DATA:
            if not can_edit:
                return response.not_allowed()
            document.description = request.DATA["description"]
            edited = True
        if "display_name" in request.DATA:
            if not can_edit:
                return response.not_allowed()
            # avoids empty or whitespaced displaynames
            if request.DATA["display_name"].strip() == "":
                return response.not_possible("Invalid displayname")
            document.display_name = request.DATA["display_name"]
            edited = True
        if "category" in request.DATA:
            if not can_edit:
                return response.not_allowed()
            category = get_object_or_404(
                Category, slug=request.DATA["category"])
            document.category = category
            edited = True
        if "document_type" in request.DATA:
            if not can_edit:
                return response.not_allowed()
            old_document_type = document.document_type
            document.document_type, _ = DocumentType.objects.get_or_create(display_name=request.DATA['document_type'])
            document.save()
            if old_document_type.id > 4 and not old_document_type.type_set.exists():
                old_document_type.delete()
            edited = True
        
        if edited:
            document.edittime = timezone.now()
            document.save()
            
        return response.success(value=get_document_obj(document, request))

    @auth_check.require_login
    def delete(self, request: HttpRequest, username: str, slug: str):
        objects = Document.objects.prefetch_related("author")
        document = get_object_or_404(
            objects, author__username=username, slug=slug)
        if not document.current_user_can_delete(request):
            return response.not_allowed()

        filenames = [
            document_file.filename for document_file in document.files.all()]
        success = s3_util.delete_files(settings.COMSOL_DOCUMENT_DIR, filenames)
        document.delete()
        return response.success(value=success)


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
        notification_util.new_comment_to_document(document, comment)
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
        

        if request.DATA["display_name"].strip() == "":
            return response.not_possible("Invalid displayname")

        err, file, ext = prepare_document_file(request)
        if err is not None:
            return err

        filename = s3_util.generate_filename(
            16, settings.COMSOL_DOCUMENT_DIR, ext)
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

        document.edittime = timezone.now()
        document.save()

        # We know that the current user can edit the document and can therefore always include the key
        return response.success(value=get_file_obj(document_file))


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
        return get_file_obj(document_file)

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

        if "display_name" in request.DATA:
            if request.DATA["display_name"].strip() == "":
                return response.not_possible("Invalid displayname")
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
        document.edittime = timezone.now()
        document.save()
        # We know that the current user can edit the document and can therefore always include the key
        return response.success(value=get_file_obj(document_file))

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

        document.edittime = timezone.now()
        document.save()

        return response.success(value=success)


@response.request_post()
@auth_check.require_login
def regenerate_api_key(request: HttpRequest, username: str, document_slug: str):
    document = get_object_or_404(
        Document, author__username=username, slug=document_slug
    )
    if not document.current_user_can_edit(request):
        return response.not_allowed()
    document.api_key = generate_api_key()
    document.save()
    return response.success(value=get_document_obj(document, request))


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
def update_file(request: HttpRequest, username: str, document_slug: str, id: int):
    token = request.headers.get("Authorization", "")
    document = get_object_or_404(
        Document, author__username=username, slug=document_slug
    )
    if document.api_key != token:
        return HttpResponseForbidden("invalid authorization token")

    document_file = get_object_or_404(
        DocumentFile,
        document__pk=document.pk,
        pk=id,
    )

    err, file, ext = prepare_document_file(request)
    if err is not None:
        return err

    changed = False

    if file.content_type != document_file.mime_type:
        document_file.mime_type = file.content_type
        changed = True

    if not document_file.filename.endswith(ext):
        s3_util.delete_file(settings.COMSOL_DOCUMENT_DIR,
                            document_file.filename)
        filename = s3_util.generate_filename(
            16, settings.COMSOL_DOCUMENT_DIR, ext)
        document_file.filename = filename
        changed = True

    if changed:
        document_file.save()

    s3_util.save_uploaded_file_to_s3(
        settings.COMSOL_DOCUMENT_DIR,
        document_file.filename,
        file,
        document_file.mime_type,
    )

    document.edittime = timezone.now()
    document.save()

    return HttpResponse("updated")
