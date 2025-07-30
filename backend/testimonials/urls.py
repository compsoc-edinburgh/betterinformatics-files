from django.urls import path
from testimonials import views
urlpatterns = [
     path("listcourses/", views.course_metadata, name="course_list"),
     path("listtestimonials/", views.testimonial_metadata, name="testimonial_list"),
     path('addtestimonial/', views.add_testimonial, name='add_testimonial'),
] 