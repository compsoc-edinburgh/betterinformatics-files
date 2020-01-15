from django.urls import path

from . import views

urlpatterns = [
    path('upload/', views.upload, name='upload'),
    path('remove/<str:filename>/', views.remove, name='remove'),
    path('get/<str:filename>/', views.get, name='get'),
]
