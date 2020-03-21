from django.urls import path

from . import views

urlpatterns = [
    path('pay/', views.pay, name='pay'),
    path('remove/<int:oid>/', views.remove, name='remove'),
    path('refund/<int:oid>/', views.refund, name='refund'),
    path('query/<str:username>/', views.query, name='query'),
    path('me/', views.get_me, name='me'),
    path('markexamchecked/<str:filename>/', views.mark_exam_checked, name='markexamchecked'),
]
