from django.urls import path
from testimonials import views
urlpatterns = [
     path("listtestimonials/", views.testimonial_metadata, name="testimonial_list"),
     path("gettestimonial/", views.get_testimonial_metadata_by_code, name="get_testimonial"),
     path('addtestimonial/', views.add_testimonial, name='add_testimonial'),
     path('removetestimonial/', views.remove_testimonial, name='remove_testimonial'),
     path('updatetestimonialapproval/', views.update_testimonial_approval_status, name="update_testimonial_approval_status")
]