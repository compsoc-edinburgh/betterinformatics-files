from django.urls import path

from . import views

urlpatterns = [
    path('', views.FaqRootView.as_view(), name='root'),
    path('<int:id>/', views.FaqElementView.as_view(), name='element'),
]
