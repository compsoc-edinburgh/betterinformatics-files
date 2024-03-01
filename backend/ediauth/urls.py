from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.me_view, name="me"),
    path("update_name/", views.update_name, name="update_name"),
    path("login", views.login, name="login"),
    path("verify", views.verify, name="verify"),
    path("logout", views.logout, name="logout"),
]
