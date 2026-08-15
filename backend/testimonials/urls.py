from django.urls import path

from testimonials import views

urlpatterns = [
    path(
        "listtestimonialsbycourse/<slug:slug>/",
        views.testimonial_metadata,
        name="testimonial_list",
    ),
]
