from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_dissertation, name='upload_dissertation'),
    path('list/', views.list_dissertations, name='list_dissertations'),
    path('<int:dissertation_id>/', views.get_dissertation_detail, name='dissertation_detail'),
    path('<int:dissertation_id>/download/', views.download_dissertation, name='download_dissertation'),
]