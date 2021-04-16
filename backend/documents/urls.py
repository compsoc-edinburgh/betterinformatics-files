from django.urls import path

from . import views


urlpatterns = [
    path("update", views.update_file, name="update_file"),
    path("file/<filename>", views.get_document_file, name="file"),
    path("", views.DocumentRootView.as_view(), name="root"),
    path(
        "<str:username>/<str:slug>/",
        views.DocumentElementView.as_view(),
        name="element",
    ),
    path(
        "<str:username>/<str:document_slug>/comments/",
        views.DocumentCommentRootView.as_view(),
        name="comments_root",
    ),
    path(
        "<str:username>/<str:document_slug>/comments/<int:id>/",
        views.DocumentCommentElementView.as_view(),
        name="comments_element",
    ),
    path(
        "<str:username>/<str:document_slug>/files/",
        views.DocumentFileRootView.as_view(),
        name="files_root",
    ),
    path(
        "<str:username>/<str:document_slug>/files/<int:id>/",
        views.DocumentFileElementView.as_view(),
        name="files_element",
    ),
]
