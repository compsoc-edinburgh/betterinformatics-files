from django.urls import path

from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('simulate_nonadmin/', views.SimulateNonAdminView.as_view(),
         name='simulate_nonadmin')
]
