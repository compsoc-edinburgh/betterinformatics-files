from django.urls import path

from . import views

urlpatterns = [
    path('list/', views.list_faq, name='list'),
    path('add/', views.add_faq, name='add'),
    path('set/<int:id>/', views.set_faq, name='set'),
    path('remove/<int:id>/', views.remove_faq, name='remove'),
]
