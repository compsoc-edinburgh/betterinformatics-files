from django.shortcuts import render
from util import response
from ediauth import auth_check
from testimonials.models import Testimonial
from categories.models import Category

@response.request_get()
@auth_check.require_login
def testimonial_metadata(request, slug: str):
    res = []
    
    try:
        category_obj = Category.objects.get(slug=slug)
    except Category.DoesNotExist:
        return response.not_possible(f"Category with slug: '{slug}' does not exist")
    testimonials = Testimonial.objects.filter(category=category_obj)
    print(f"TESTIMONIALS: {testimonials}")
    res = [
        {
            "author_id": testimonial.author.username,
            "author_diplay_name": testimonial.author.profile.display_username,
            "slug": testimonial.category.slug,
            "testimonial": testimonial.testimonial,
            "year_taken": testimonial.year_taken,
            "approval_status": testimonial.approval_status,
        }
        for testimonial in testimonials
        ]
    print(f"RESULT: {res}")
    return response.success(value=res)
