from django.urls import path
from testimonials import views
urlpatterns = [
     path("listcourses/", views.course_metadata, name="course_list"),
     path("listtestimonials/", views.testimonial_metadata, name="testimonial_list"),
     path('addtestimonial/', views.add_testimonial, name='add_testimonial'),
     path('removetestimonial/', views.remove_testimonial, name='remove_testimonial'),
     path('updatetestimonialapproval/', views.update_testimonial_approval_status, name="update_testimonial_approval_status")
]