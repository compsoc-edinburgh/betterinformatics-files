"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, re_path, include
from django.views.static import serve

from . import views

urlpatterns = [
    path('', include('health.urls')),
    path('', include('frontend.urls')),
    path('api/exam/', include('answers.urls')),
    path('api/faq/', include('faq.urls')),
    path('api/category/', include('categories.urls')),
    path('api/feedback/', include('feedback.urls')),
    path('api/filestore/', include('filestore.urls')),
    path('api/image/', include('images.urls')),
    path('api/auth/', include('myauth.urls')),
    path('api/notification/', include('notifications.urls')),
    path('api/payment/', include('payments.urls')),
    path('api/scoreboard/', include('scoreboard.urls')),
    re_path(r'^static/(?P<path>.*)$', views.cached_serve, {
       'document_root': 'static',
    }),
]

handler400 = views.handler400
handler403 = views.handler403
handler404 = views.handler404
handler500 = views.handler500
