from django.urls import path

from . import views
from . import views_files

urlpatterns = [
    path('upload/exam/', views_files.upload_exam_pdf, name='upload_exam_pdf'),
    path('upload/transcript/', views_files.upload_transcript, name='upload_transcript'),
    path('upload/printonly/', views_files.upload_printonly, name='upload_printonly'),
    path('upload/solution/', views_files.upload_solution, name='upload_solution'),
    path('remove/exam/<str:filename>/', views_files.remove_exam, name='remove_exam'),
    path('remove/printonly/<str:filename>/', views_files.remove_printonly, name='remove_printonly'),
    path('remove/solution/<str:filename>/', views_files.remove_solution, name='remove_solution'),
    path('pdf/exam/<str:filename>/', views_files.get_exam_pdf, name='get_exam_pdf'),
    path('pdf/solution/<str:filename>/', views_files.get_solution_pdf, name='get_solution_pdf'),
    path('pdf/printonly/<str:filename>/', views_files.get_printonly_pdf, name='get_printonly_pdf'),
]
