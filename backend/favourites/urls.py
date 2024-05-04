from django.urls import path

from . import views

urlpatterns = [
    path("", views.get_favourites, name="get_favourites"),
    path("add/<str:slug>/",
         views.add_favorite, name="add_favorite"),
    path("remove/<str:slug>/",
         views.remove_favorite, name="remove_favorite"),
]
