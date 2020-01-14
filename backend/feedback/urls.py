from django.urls import path

from . import views

urlpatterns = [
    path('submit/', views.submit, name='submit'),
    path('list/', views.list_all, name='list_all'),
    path('<int:feedbackid>/flags/', views.flags, name='flags'),
]
