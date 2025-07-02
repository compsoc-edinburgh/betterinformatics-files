from util import response
from ediauth import auth_check
from testimonials.models import Course, Testimonial
from django.shortcuts import get_object_or_404
from datetime import timedelta

@response.request_get()
@auth_check.require_login
def course_metadata(request):
    courses = Course.objects.all()
    res = [
        {
            "course_code": course.code,
            "course_name": course.name,
            "course_delivery": course.delivery,
            "course_credits": course.credits,
            "course_work_exam_ratio": course.work_exam_ratio,
            "course_level": course.level,
            "course_dpmt_link": course.dpmt_link
        }
        for course in courses
    ]
    return response.success(value=res)

@response.request_get()
@auth_check.require_login
def testimonial_metadata(request):
    testimonials = Testimonial.objects.all()
    res = [
        {
            "author": testimonial.author.username,
            "course": testimonial.course.code,
            "testimonial": testimonial.testimonial,
            "year_taken": testimonial.year_taken,
            "recommendability_rating": testimonial.recommendability_rating,
            "workload_rating": testimonial.workload_rating,
            "difficulty_rating": testimonial.difficulty_rating,
        }
        for testimonial in testimonials
    ]
    return response.success(value=res)
