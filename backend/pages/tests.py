import json
from http.cookies import SimpleCookie

from django.db import transaction

from categories.models import Category
from ediauth.models import TemporaryUser
from pages.models import Page, PageAuthor, PageRevision
from testing.tests import ComsolTest, get_token
from users.api import User

MATRIX = {
    "admin": {
        "create_guide": True,
        "create_static_html": True,
        "edit_guide": True,
        "edit_static_html": True,
        "delete_guide": True,
        "delete_guide_owned": True,
        "delete_static_html": True,
        "set_category": True,
        "change_slug": True,
        "change_slug_owned": True,
        "view_revisions": True,
        "redact_revision": True,
        "view_redacted_revisions": True,
        "view_author": True,
        "view_anonymised_author": True,
    },
    "user": {
        "create_guide": True,
        "create_static_html": False,
        "edit_guide": True,
        "edit_static_html": False,
        "delete_guide": False,
        "delete_guide_owned": True,
        "delete_static_html": False,
        "set_category": False,
        "change_slug": False,
        "change_slug_owned": True,
        "view_revisions": True,
        "redact_revision": False,
        "view_redacted_revisions": False,
        "view_author": True,
        "view_anonymised_author": False,
    },
    "guest": {
        "create_guide": True,
        "create_static_html": False,
        "edit_guide": True,
        "edit_static_html": False,
        "delete_guide": False,
        "delete_guide_owned": True,
        "delete_static_html": False,
        "set_category": False,
        "change_slug": False,
        "change_slug_owned": True,
        "view_revisions": False,
        "redact_revision": False,
        "view_redacted_revisions": False,
        "view_author": False,
        "view_anonymised_author": False,
    },
}


class TestPermissions(ComsolTest):
    def test_admin(self):
        self.login_as(self.adminUsers[0])

        # Attempt all actions as admin
        for action, allowed in MATRIX["admin"].items():
            with self.subTest("Admin Permissions for action: " + action):
                # Save point
                sid = transaction.savepoint()

                self.matrix_run(action, allowed)
                # Rollback
                transaction.savepoint_rollback(sid)

    def test_user(self):
        self.login_as(self.nonAdminUsers[1])

        # Attempt all actions as user
        for action, allowed in MATRIX["user"].items():
            with self.subTest("User Permissions for action: " + action):
                # Save point
                sid = transaction.savepoint()

                self.matrix_run(action, allowed)
                # Rollback
                transaction.savepoint_rollback(sid)

    def test_guest(self):
        self.user = None

        # Attempt all actions as guest
        for action, allowed in MATRIX["guest"].items():
            with self.subTest("Guest Permissions for action: " + action):
                # Save point
                sid = transaction.savepoint()

                self.matrix_run(action, allowed)
                # Rollback
                transaction.savepoint_rollback(sid)

    def matrix_run(self, action, allowed):
        if action == "create_guide":
            self.create_guide(allowed)
        if action == "create_static_html":
            self.create_static_html(allowed)
        if action == "edit_guide":
            self.edit_guide(allowed)
        if action == "edit_static_html":
            self.edit_static_html(allowed)
        if action == "delete_guide":
            self.delete_guide(allowed, owned=False)
        if action == "delete_guide_owned":
            self.delete_guide(allowed, owned=True)
        if action == "delete_static_html":
            self.delete_static_html(allowed)
        if action == "set_category":
            self.set_category(allowed)
        if action == "change_slug":
            self.change_slug(allowed, owned=False)
        if action == "change_slug_owned":
            self.change_slug(allowed, owned=True)
        if action == "view_revisions":
            self.view_revisions(allowed)
        if action == "redact_revision":
            self.redact_revision(allowed)
        if action == "view_redacted_revisions":
            self.view_redacted_revisions(allowed)
        if action == "view_redacted_revisions":
            self.view_redacted_revisions(allowed)
        if action == "view_author":
            self.view_author(allowed)
        if action == "view_anonymised_author":
            self.view_anonymised_author(allowed)

    def create_guide(self, allowed):
        self.post(
            "/api/page/",
            {
                "kind": "guide",
                "title": "Test Guide",
                "parents": [],
                "is_anonymous": False,
            },
            test_get=False,
            status_code=201 if allowed else 403,
            json_body=True,
        )

    def create_static_html(self, allowed):
        self.post(
            "/api/page/",
            {
                "kind": "static_html",
                "title": "Test Static HTML",
                "parents": [],
                "is_anonymous": False,
            },
            test_get=False,
            status_code=201 if allowed else 403,
            json_body=True,
        )

    def create_page_author(self, user):
        if user is None:
            temp_user = TemporaryUser.objects.create()
            return PageAuthor.objects.create(temp_user=temp_user)

        # Make sure user is created
        a = self.user
        self.login_as(user)
        self.login_as(a)
        return PageAuthor.objects.create(
            user=User.objects.get(username=user["username"])
        )

    def edit_guide(self, allowed):
        p = Page.objects.create(
            kind="guide",
            title="Test Guide",
            slug="test-guide",
            category=None,
            author=self.create_page_author(self.users[1]),
            anonymised=False,
            content="",
        )
        self.put(
            f"/api/page/{p.slug}",
            {
                "slug": p.slug,
                "title": "Updated Test Guide",
                "category": None,
                "parents": [],
                "content": "",
                "revision_message": "Updated Test Guide",
                "is_anonymous": False,
            },
            status_code=200 if allowed else 403,
            json_body=True,
        )

    def edit_static_html(self, allowed):
        p = Page.objects.create(
            kind="static_html",
            title="Test Static HTML",
            slug="test-static-html",
            category=None,
            author=self.create_page_author(self.users[1]),
            anonymised=False,
            content="",
        )
        self.put(
            f"/api/page/{p.slug}",
            {
                "slug": p.slug,
                "title": "Updated Test Static HTML",
                "category": None,
                "parents": [],
                "is_anonymous": False,
                "content": "",
                "revision_message": "Updated Test Static HTML",
            },
            status_code=200 if allowed else 403,
            json_body=True,
        )

    def delete_guide(self, allowed, owned=False):
        p = Page.objects.create(
            kind="guide",
            title="Test Guide",
            slug="test-guide",
            category=None,
            author=self.create_page_author(self.user if owned else self.users[1]),
            anonymised=False,
            content="",
        )

        # Manually construct cookies and use self.client.delete instead of
        # self.delete because temp user needs the session cookie to match that
        # of the page author if owned=True
        if self.user is None and owned:
            self.client.cookies = SimpleCookie(
                {"temp_session_id": str(p.author.temp_user.session_id)}
            )
        if self.user:
            self.client.cookies = SimpleCookie({"access_token": get_token(self.user)})
        elif self.user is None and owned:
            self.client.cookies = SimpleCookie(
                {"temp_session_id": str(p.author.temp_user.session_id)}
            )
        else:
            self.client.cookies = SimpleCookie()

        response = self.client.delete(f"/api/page/{p.slug}")
        self.assertEqual(response.status_code, 204 if allowed else 403)

    def delete_static_html(self, allowed):
        p = Page.objects.create(
            kind="static_html",
            title="Test Static HTML",
            slug="test-static-html",
            category=None,
            author=self.create_page_author(self.user),
            anonymised=False,
            content="",
        )
        self.delete(
            f"/api/page/{p.slug}",
            status_code=204 if allowed else 403,
            as_json=False,
        )

    def set_category(self, allowed):
        p = Page.objects.create(
            kind="guide",
            title="Test Guide",
            slug="test-guide",
            category=None,
            author=self.create_page_author(self.users[1]),
            anonymised=False,
            content="",
        )
        c = Category.objects.create(
            displayname="Test Category",
            slug="category-slug",
        )
        self.put(
            f"/api/page/{p.slug}",
            {
                "slug": p.slug,
                "title": "Test Guide",
                "category": c.slug,
                "parents": [],
                "content": "",
                "revision_message": "Set category",
                "is_anonymous": False,
            },
            status_code=200 if allowed else 403,
            json_body=True,
        )

    def change_slug(self, allowed, owned=False):
        p = Page.objects.create(
            kind="guide",
            title="Test Guide",
            slug="test-guide",
            category=None,
            author=self.create_page_author(self.user if owned else self.users[1]),
            anonymised=False,
            content="",
        )

        # Manually construct cookies and use self.client.delete instead of
        # self.delete because temp user needs the session cookie to match that
        # of the page author if owned=True
        if self.user is None and owned:
            self.client.cookies = SimpleCookie(
                {"temp_session_id": str(p.author.temp_user.session_id)}
            )
        if self.user:
            self.client.cookies = SimpleCookie({"access_token": get_token(self.user)})
        elif self.user is None and owned:
            self.client.cookies = SimpleCookie(
                {"temp_session_id": str(p.author.temp_user.session_id)}
            )
        else:
            self.client.cookies = SimpleCookie()

        body = json.dumps(
            {
                "slug": "new-slug",
                "title": "Test Guide",
                "category": None,
                "parents": [],
                "content": "",
                "revision_message": "Change slug",
                "is_anonymous": False,
            }
        )
        content_type = "application/json"
        response = self.client.put(
            f"/api/page/{p.slug}",
            body,
            content_type=content_type,
        )
        self.assertEqual(response.status_code, 200 if allowed else 403)

    def view_revisions(self, allowed):
        user = self.user
        not_allowed_status = 403 if user is not None else 401

        self.login_as(self.adminUsers[0])
        self.create_guide(True)

        self.user = user
        self.get(
            "/api/page/testguide/revisions/",
            status_code=200 if allowed else not_allowed_status,
        )

    def redact_revision(self, allowed):
        user = self.user
        not_allowed_status = 403 if user is not None else 401

        self.login_as(self.adminUsers[0])
        self.create_guide(True)
        revision_id = PageRevision.objects.get(page__slug="testguide").id

        self.user = user
        self.patch(
            f"/api/page/testguide/revisions/{revision_id}",
            {"redacted": True},
            status_code=204 if allowed else not_allowed_status,
            as_json=False,
            json_body=True,
        )

    def view_redacted_revisions(self, allowed):
        user = self.user

        self.login_as(self.adminUsers[0])
        self.create_guide(True)
        self.user = user

        rev = PageRevision.objects.get(page__slug="testguide")
        rev.redacted = True
        rev.save()

        if user is None:
            return self.view_revisions(allowed)

        data = self.get("/api/page/testguide/revisions/", status_code=200)
        revision = [r for r in data["revisions"] if r["id"] == rev.id][0]
        expected_message = "Created empty page" if allowed else "Redacted Revision"
        self.assertEqual(revision["message"], expected_message)

    def view_author(self, allowed):
        user = self.user

        self.login_as(self.adminUsers[0])
        self.create_guide(True)
        self.user = user

        data = self.get("/api/page/testguide", status_code=200)

        if allowed:
            self.assertNotEqual(data["author"]["display_name"], "Hidden")
        else:
            self.assertEqual(data["author"]["display_name"], "Hidden")

    def view_anonymised_author(self, allowed):
        user = self.user

        # Pick a user that is not the one to check
        self.login_as(self.adminUsers[1])
        self.post(
            "/api/page/",
            {
                "kind": "guide",
                "title": "Test Guide",
                "parents": [],
                "is_anonymous": True,
            },
            test_get=False,
            status_code=201,
            json_body=True,
        )
        self.user = user

        data = self.get("/api/page/testguide", status_code=200)

        if allowed:
            self.assertNotEqual(data["author"]["display_name"], "Anonymous")
        else:
            if self.user is None:
                self.assertEqual(data["author"]["display_name"], "Hidden")
            else:
                self.assertEqual(data["author"]["display_name"], "Anonymous")
