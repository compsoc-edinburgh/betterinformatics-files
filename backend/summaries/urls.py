from django.urls import path

from . import views


urlpatterns = [
    path("", views.SummaryRootView.as_view(), name="root"),
    path("<slug:slug>/", views.SummaryElementView.as_view(), name="element"),
    path("file/<filename>", views.get_summary_file, name="file"),
    path(
        "<slug:summary_slug>/comments/",
        views.SummaryCommentRootView.as_view(),
        name="comments_root",
    ),
    path(
        "<slug:summary_slug>/comments/<int:id>/",
        views.SummaryCommentElementView.as_view(),
        name="comments_root",
    ),
]
