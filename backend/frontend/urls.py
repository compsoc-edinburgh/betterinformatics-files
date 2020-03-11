from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('uploadpdf/', views.index, name='uploadpdf'),
    path('submittranscript/', views.index, name='submittranscript'),
    path('feedback/', views.index, name='feedback'),
    path('scoreboard/', views.index, name='scoreboard'),
    path('modqueue/', views.index, name='modqueue'),
    re_path('^exams/.*$', views.index, name='exams'),
    re_path('^user/.*$', views.index, name='user'),
    re_path('^category/.*$', views.index, name='category'),
    path('tutorial/', views.index, name='tutorial'),
    path('favicon.ico', views.favicon, name='favicon'),
    path('manifest.json', views.manifest, name='manifest'),
    path('resolve/<str:filename>/', views.resolve, name='resolve'),
    path('legacy/transformwiki/<str:examname>/', views.legacy_wiki_transform, name='transformwiki')
]
