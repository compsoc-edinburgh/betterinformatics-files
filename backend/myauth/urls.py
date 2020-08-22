from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.me_view, name="me"),
]
