from util import response
from ediauth import auth_check
from testimonials.models import Course, Testimonial
from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.http import JsonResponse

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

@response.request_post("course", "year_taken", optional=True)
@auth_check.require_login
def add_testimonial(request):
    author = request.user

    course_code = request.POST.get('course') #course code instead of course name
    course = Course.objects.get(code=course_code)
    year_taken = request.POST.get('year_taken')
    recommendability_rating = float(request.POST.get('recommendability_rating'))
    workload_rating = request.POST.get('workload_rating') # notes is optional
    difficulty_rating = request.POST.get('difficulty_rating')
    testimonial = request.POST.get('testimonial')
    #grade_band = request.POST.get('grade_band', None) # Added grade_band, optional
    if not author:
        return response.not_possible("Missing argument: author")
    if not course:
        return response.not_possible("Missing argument: course")
    if not year_taken:
        return response.not_possible("Missing argument: year_taken")
    if not recommendability_rating:
        return response.not_possible("Missing argument: recommendability_rating")
    if not workload_rating:
        return response.not_possible("Missing argument: workload_rating")
    if not difficulty_rating:
        return response.not_possible("Missing argument: difficulty_rating")
    if not testimonial:
        return response.not_possible("Missing argument: testimonial")

    # Create Dissertation entry in DB

    testimonials = Testimonial.objects.all()

    for t in testimonials:
        if t.author == author and t.course.code == course_code:
            return response.not_possible("You can only add 1 testimonial for each course.")
        
    testimonial = Testimonial.objects.create(
        author=author,
        course=course,
        year_taken=year_taken,
        recommendability_rating=recommendability_rating,
        workload_rating=workload_rating,
        difficulty_rating=difficulty_rating,
        testimonial=testimonial,
    )

    return response.success(value=testimonial.id)
