from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.me_view, name="me"),
    path("login", views.login, name="login"),
    path("callback", views.callback, name="callback"),
    path("refresh", views.refresh, name="refresh"),
    path("logout", views.logout, name="logout"),
]
