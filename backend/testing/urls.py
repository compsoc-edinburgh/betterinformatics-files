from django.urls import path

from . import views

urlpatterns = [
    path('long_running_db/', views.long_running_db_query, name='long_running_db')
]
