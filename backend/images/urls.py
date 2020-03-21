from django.urls import path

from . import views

urlpatterns = [
    path('list/', views.list_images, name='list'),
    path('upload/', views.upload_image, name='upload'),
    path('remove/<str:filename>/', views.remove_image, name='remove'),
    path('get/<str:filename>/', views.get_image, name='get'),
]
