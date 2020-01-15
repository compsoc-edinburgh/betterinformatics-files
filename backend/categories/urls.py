from django.urls import path

from . import views

urlpatterns = [
    path('listmetacategories', views.list_metacategories, name='list_metacategories'),
]
