from django.urls import path

from . import views

urlpatterns = [
    path('submit/', views.submit, name='submit'),
    path('list/', views.list_all, name='list_all'),
    path('flags/<int:feedbackid>/', views.flags, name='flags'),
]
