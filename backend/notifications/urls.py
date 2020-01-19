from django.urls import path

from . import views

urlpatterns = [
    path('getenabled/', views.getenabled, name='getenabled'),
    path('setenabled/', views.setenabled, name='setenabled'),
    path('unread/', views.unread, name='unread'),
    path('unreadcount/', views.unreadcount, name='unreadcount'),
    path('all/', views.all, name='all'),
    path('setread/<int:oid>/', views.setread, name='setread'),
]
