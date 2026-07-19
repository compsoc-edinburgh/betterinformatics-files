import datetime
from typing import Optional

from django.shortcuts import get_object_or_404
from ninja import Router, Schema

from pages.models import Page, PageAuthor

router = Router()


class PageAuthorResponse(Schema):
    display_name: str
    anonymised: bool
    registered_username: Optional[str]


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


def get_page_author_response(author: PageAuthor) -> PageAuthorResponse:
    if author.is_anonymous:
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
        registered_username=author.user.username if author.user else None,
    )


@router.get("/{slug}")
def get_page(request, slug: str):
    page = get_object_or_404(Page, slug=slug)

    return PageResponse(
        title=page.title,
        slug=page.slug,
        kind=Page.Kind(page.kind),
        category=page.category.name if page.category else None,
        parents=[parent.slug for parent in page.parents.all()],
        created_at=page.created_at,
        edited_at=page.edited_at,
        content=page.content,
        author=get_page_author_response(page.author),
    )
