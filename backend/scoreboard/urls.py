from django.urls import path

from . import views

urlpatterns = [
    path('userinfo/<str:username>/', views.userinfo, name='userinfo'),
    path('top/<str:scoretype>/', views.scoreboard_top, name='top'),
]
