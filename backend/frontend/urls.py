from django.urls import path, re_path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("uploadpdf/", views.index, name="uploadpdf"),
    path("search/", views.index, name="search"),
    path("submittranscript/", views.index, name="submittranscript"),
    path("feedback/", views.index, name="feedback"),
    path("faq/", views.index, name="faq"),
    path("privacy/", views.index, name="privacy"),
    path("disclaimer/", views.index, name="disclaimer"),
    path("scoreboard/", views.index, name="scoreboard"),
    path("stats/", views.index, name="stats"),
    path("login/", views.index, name="login"),
    path("modqueue/", views.index, name="modqueue"),
    path("upload-dissertation/", views.index, name="upload_dissertation"),
    path("dissertations/", views.index, name="dissertations_list"),
    re_path("^dissertations/.*$", views.index, name="dissertations_detail"),
    re_path("^exams/.*$", views.index, name="exams"),
    re_path("^user/.*$", views.index, name="user"),
    re_path("^category/.*$", views.index, name="category"),
    re_path("^document/.*$", views.index, name="document"),
    path("favicon.ico", views.favicon, name="favicon"),
    path("manifest.json", views.manifest, name="manifest"),
    path("resolve/<str:filename>/", views.resolve, name="resolve"),
    path(
        "api/can_i_haz_csrf_cookie/",
        views.can_i_haz_csrf_cookie,
        name="can_i_haz_csrf_cookie",
    ),
]
