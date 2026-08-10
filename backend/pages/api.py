import datetime

import diff_match_patch as dmp_module
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.decorators import decorate_view

from backend import settings
from categories.models import Category
from ediauth import auth_check
from pages.models import Page, PageAuthor, PageRevision
from util.response import ErrorSchema, not_allowed, not_possible

router = Router(tags=["Pages"])


class PageAuthorResponse(Schema):
    display_name: str
    anonymised: bool
    username: str | None


class PageResponse(Schema):
    title: str
    slug: str
    kind: Page.Kind
    category: str | None
    parents: list[str]
    created_at: datetime.datetime
    edited_at: datetime.datetime
    content: str
    author: PageAuthorResponse


class PageListResponseItem(Schema):
    title: str
    slug: str
    kind: Page.Kind
    category: str | None
    parents: list[str]
    created_at: datetime.datetime
    edited_at: datetime.datetime


class PageListResponse(Schema):
    pages: list[PageListResponseItem]


class PageCreateResponse(Schema):
    slug: str


class PageUpdateResponse(Schema):
    slug: str


class PageRevisionResponseItem(Schema):
    id: int
    created_at: datetime.datetime
    author: PageAuthorResponse
    message: str
    content_delta: str
    title_delta: str


class PageRevisionListResponse(Schema):
    revisions: list[PageRevisionResponseItem]


def get_page_author_response(
    author: PageAuthor, anonymised: bool, request: HttpRequest
) -> PageAuthorResponse:
    if not request.user:
        return PageAuthorResponse(
            display_name="Hidden",
            anonymised=True,
            username=None,
        )

    if anonymised and not auth_check.has_admin_rights(request):
        display_name = "Anonymous"
    elif author.user:
        display_name = author.user.profile.display_username
    elif author.temp_user:
        display_name = f"Temporary User {author.temp_user.session_id}"
    else:
        display_name = "Deleted User"

    return PageAuthorResponse(
        display_name=display_name,
        anonymised=anonymised,
        username=author.user.username if author.user else None,
    )


def get_page_author(request) -> PageAuthor:
    if request.user:
        author, _created = PageAuthor.objects.get_or_create(user=request.user)
    elif request.temp_user:
        author, _created = PageAuthor.objects.get_or_create(temp_user=request.temp_user)
    else:
        raise ValueError("No user or temp user found in request")
    return author


@router.get(
    "/", response={200: PageListResponse, 404: ErrorSchema}, operation_id="list_pages"
)
def list_pages(
    request,
    child_of: str | None = None,
    category: str | None = None,
):
    query = Page.objects.all()

    if child_of and child_of != "":
        parent_page = get_object_or_404(Page, slug=child_of)
        query = query.filter(parents=parent_page)
    elif child_of == "":
        query = query.filter(parents=None)

    if category and category != "":
        category_obj = get_object_or_404(Category, slug=category)
        query = query.filter(category=category_obj)
    elif category == "":
        query = query.filter(category=None)

    pages = (
        query.select_related("author", "category")
        .prefetch_related("parents")
        .order_by("title")
    )

    page_list = []
    for page in pages:
        page_list.append(
            {
                "title": page.title,
                "slug": page.slug,
                "kind": page.kind,
                "category": page.category.slug if page.category else None,
                "parents": [parent.slug for parent in page.parents.all()],
                "created_at": page.created_at.isoformat(),
                "edited_at": page.edited_at.isoformat(),
                "author": get_page_author_response(
                    page.author, page.anonymised, request
                ),
            }
        )
    return {"pages": page_list}


@router.get(
    "/{slug}", operation_id="get_page", response={200: PageResponse, 404: ErrorSchema}
)
def get_page(request, slug: str):
    page = get_object_or_404(Page, slug=slug)

    return PageResponse(
        title=page.title,
        slug=page.slug,
        kind=Page.Kind(page.kind),
        category=page.category.slug if page.category else None,
        parents=[parent.slug for parent in page.parents.all()],
        created_at=page.created_at,
        edited_at=page.edited_at,
        content=page.content,
        author=get_page_author_response(page.author, page.anonymised, request),
    )


class PageCreateRequest(Schema):
    title: str
    category: str | None
    parents: list[str]
    is_anonymous: bool


def create_page_slug(title: str):
    """
    Create a valid and unique slug for the page title
    :param title: page title
    """
    oslug = "".join(
        filter(
            lambda x: x in settings.COMSOL_DOCUMENT_SLUG_CHARS,
            title.lower().replace(" ", "_"),
        )
    )
    if oslug == "":
        oslug = "invalid_name"

    def exists(aslug):
        return Page.objects.filter(slug=aslug).exists()

    slug = oslug
    cnt = 0
    while exists(slug):
        slug = oslug + "-" + str(cnt)
        cnt += 1

    return slug


def calculate_patch(old_content: str, new_content: str) -> str:
    dmp = dmp_module.diff_match_patch()
    (oldChars, newChars, lines) = dmp.diff_linesToChars(old_content, new_content)
    diffs = dmp.diff_main(oldChars, newChars, False)
    dmp.diff_charsToLines(diffs, lines)
    dmp.diff_cleanupSemantic(diffs)

    patch = dmp.patch_make(diffs)
    return dmp.patch_toText(patch)


@router.post(
    "/",
    response={
        201: PageCreateResponse,
        400: ErrorSchema,
        403: ErrorSchema,
    },
    operation_id="create_page",
)
@decorate_view(auth_check.supports_temp_user)
def create_page(request, data: PageCreateRequest):
    slug = create_page_slug(data.title)
    author = get_page_author(request)

    # Only admins can assign it a category - since they are category pages
    if data.category and not auth_check.has_admin_rights(request):
        return not_allowed()

    # Double check category exists
    category = None
    if data.category:
        try:
            category = Category.objects.get(slug=data.category)
        except Category.DoesNotExist:
            return not_possible(f"Category {data.category} does not exist")

    # Double check parents exists
    parents = []
    if data.parents:
        for parent_slug in data.parents:
            try:
                parent = Page.objects.get(slug=parent_slug)
            except Page.DoesNotExist:
                return not_possible(f"Parent page {parent_slug} does not exist")
            parents.append(parent)

    page = Page(
        title=data.title,
        slug=slug,
        kind=Page.Kind.GUIDE,
        category=category,
        author=author,
        anonymised=data.is_anonymous,
        content="",
    )
    page.save()

    page.parents.set(parents)

    content_patch = calculate_patch("", page.content)
    title_patch = calculate_patch("", page.title)

    PageRevision.objects.create(
        page=page,
        author=author,
        anonymised=data.is_anonymous,
        content_delta=content_patch,
        title_delta=title_patch,
        message="Created empty page",
    )

    return {"slug": page.slug}


class PageUpdateRequest(Schema):
    title: str
    category: str | None
    parents: list[str]
    content: str
    revision_message: str
    is_anonymous: bool


@router.put(
    "/{slug}",
    response={
        200: PageUpdateResponse,
        403: ErrorSchema,
        400: ErrorSchema,
        404: ErrorSchema,
    },
    operation_id="update_page",
)
@decorate_view(auth_check.supports_temp_user)
def update_page(request, slug: str, data: PageUpdateRequest):
    page = get_object_or_404(Page, slug=slug)
    author = get_page_author(request)

    # Only admins can assign it a category - since they are category pages
    if data.category and not auth_check.has_admin_rights(request):
        return not_allowed()

    if data.category:
        try:
            category = Category.objects.get(slug=data.category)
            page.category = category
        except Category.DoesNotExist:
            return not_possible(f"Category {data.category} does not exist")

    title_patch = calculate_patch(page.title, data.title)
    content_patch = calculate_patch(page.content, data.content)

    if title_patch == "" and content_patch == "":
        return not_possible("No changes detected")

    page.title = data.title
    page.content = data.content

    # Update parents
    parents = []
    for parent_slug in data.parents:
        try:
            parent = Page.objects.get(slug=parent_slug)
            parents.append(parent)
        except Page.DoesNotExist:
            return not_possible(f"Parent page {parent_slug} does not exist")

    page.parents.set(parents)
    page.edited_at = datetime.datetime.now()
    page.save()

    # Create new revision
    PageRevision.objects.create(
        page=page,
        author=author,
        anonymised=data.is_anonymous,
        content_delta=content_patch,
        title_delta=title_patch,
        message=data.revision_message,
    )

    return {"slug": page.slug}


@router.get(
    "/{slug}/revisions/",
    response={200: PageRevisionListResponse, 404: ErrorSchema},
    operation_id="list_revisions",
)
@auth_check.require_login
def list_revisions(request, slug: str):
    page = get_object_or_404(Page, slug=slug)
    revisions = page.revisions.select_related("author").all().order_by("-created_at")

    revision_list = []
    for rev in revisions:
        revision_list.append(
            {
                "id": rev.id,
                "created_at": rev.created_at.isoformat(),
                "author": get_page_author_response(rev.author, rev.anonymised, request),
                "message": rev.message,
                "content_delta": rev.content_delta,
                "title_delta": rev.title_delta,
            }
        )

    return {"revisions": revision_list}


@router.delete(
    "/{slug}",
    response={204: None, 403: ErrorSchema, 404: ErrorSchema},
    operation_id="delete_page",
)
def delete_page(request, slug: str):
    page = get_object_or_404(Page, slug=slug)

    if not auth_check.has_admin_rights(request) and page.author != get_page_author(
        request
    ):
        return not_allowed()

    page.delete()
    return 204, None
