from django.shortcuts import get_object_or_404

from categories.models import Category
from ediauth import auth_check
from testimonials.models import Testimonial
from util import response


@response.request_get()
@auth_check.require_login
def testimonial_metadata(request, slug: str):
    res = []
    category_obj = get_object_or_404(
        Category,
        slug=slug,
    )
    testimonials = Testimonial.objects.filter(category=category_obj).select_related(
        "author", "category"
    )

    res = [
        {
            "author_id": testimonial.author.username,
            "author_display_name": testimonial.author.profile.display_username,
            "slug": testimonial.category.slug,
            "testimonial": testimonial.text,
            "year_taken": testimonial.year_taken,
            "approval_status": testimonial.approval_status,
        }
        for testimonial in testimonials
    ]

    return response.success(value=res)
