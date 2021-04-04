from django.urls import path

from . import views


urlpatterns = [
    path("file/<filename>", views.get_summary_file, name="file"),
    path("", views.SummaryRootView.as_view(), name="root"),
    path(
        "<str:username>/<slug:slug>/",
        views.SummaryElementView.as_view(),
        name="element",
    ),
    path(
        "<str:username>/<slug:summary_slug>/comments/",
        views.SummaryCommentRootView.as_view(),
        name="comments_root",
    ),
    path(
        "<str:username>/<slug:summary_slug>/comments/<int:id>/",
        views.SummaryCommentElementView.as_view(),
        name="comments_element",
    ),
    path(
        "<str:username>/<slug:summary_slug>/files/",
        views.SummaryFileRootView.as_view(),
        name="files_root",
    ),
    path(
        "<str:username>/<slug:summary_slug>/files/<int:id>/",
        views.SummaryFileElementView.as_view(),
        name="files_element",
    ),
]
