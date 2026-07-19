import datetime
from typing import Optional

from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.decorators import decorate_view

import diff_match_patch as dmp_module

from categories.models import Category
from backend import settings
from ediauth import auth_check
from pages.models import Page, PageAuthor

router = Router()


class PageAuthorResponse(Schema):
    display_name: str
    anonymised: bool
    username: Optional[str]


class PageResponse(Schema):
    title: str
    slug: str
    kind: Page.Kind
    category: Optional[str]
    parents: list[str]
    created_at: datetime.datetime
    edited_at: datetime.datetime
    content: str
    author: PageAuthorResponse


def get_page_author_response(
    author: PageAuthor, request: HttpRequest
) -> PageAuthorResponse:
    if author.is_anonymous and not auth_check.has_admin_rights(request):
        display_name = "Anonymous"
    elif author.user:
        display_name = author.user.profile.display_username
    elif author.temp_user:
        display_name = f"Temporary User {author.temp_user.session_id}"
    else:
        display_name = "Deleted User"

    return PageAuthorResponse(
        display_name=display_name,
        anonymised=author.is_anonymous,
        username=author.user.username if author.user else None,
    )


@router.get("/{slug}")
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
        author=get_page_author_response(page.author, request),
    )


class PageCreateRequest(Schema):
    title: str
    category: Optional[str]
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


@router.post("/")
@decorate_view(auth_check.supports_temp_user)
def create_page(request, data: PageCreateRequest):
    slug = create_page_slug(data.title)

    if request.user:
        author, _created = PageAuthor.objects.get_or_create(
            user=request.user, is_anonymous=data.is_anonymous
        )
    elif request.temp_user:
        author, _created = PageAuthor.objects.get_or_create(
            temp_user=request.temp_user, is_anonymous=data.is_anonymous
        )
    else:
        return 400, "Illegal state: no user or temp user found in request"

    # Double check category exists
    if data.category:
        try:
            category = Category.objects.get(slug=data.category)
        except Category.DoesNotExist:
            return 400, f"Category {data.category} does not exist"

    # Double check parents exists
    parents = []
    if data.parents:
        for parent_slug in data.parents:
            try:
                parent = Page.objects.get(slug=parent_slug)
            except Page.DoesNotExist:
                return 400, f"Parent page {parent_slug} does not exist"
            parents.append(parent)

    page = Page(
        title=data.title,
        slug=slug,
        kind=Page.Kind.GUIDE,
        category=category,
        author=author,
    )
    page.save()

    for parent in parents:
        page.parents.add(parent)

    return {"slug": page.slug}
