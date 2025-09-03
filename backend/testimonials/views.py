from util import response
from ediauth import auth_check
from testimonials.models import Course, Testimonial, ApprovalStatus
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.http import JsonResponse
import requests
from django.views.decorators.csrf import csrf_exempt
from notifications.notification_util import update_to_testimonial_status
import ediauth.auth_check as auth_check
import os

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
            "authorId": testimonial.author.username,
            "authorDisplayName": testimonial.author.profile.display_username,
            "course_code": testimonial.course.code,
            "course_name": testimonial.course.name,
            "testimonial": testimonial.testimonial,
            "year_taken": testimonial.year_taken,
            "approval_status": testimonial.approval_status,
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
    testimonial = request.POST.get('testimonial')

    if not author:
        return response.not_possible("Missing argument: author")
    if not course:
        return response.not_possible("Missing argument: course")
    if not year_taken:
        return response.not_possible("Missing argument: year_taken")
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
        approval_status= ApprovalStatus.PENDING,
        testimonial=testimonial,
    )

    return response.success(value={"testimonial_id" : testimonial.id, "approved" : False})

@response.request_post("username", "course_code", optional=True)
@auth_check.require_login
def remove_testimonial(request):
    username = request.POST.get('username')
    course_code = request.POST.get('course_code')

    testimonials = Testimonial.objects.all()

    testimonial = None

    for t in testimonials:
        if t.author.username == username and t.course.code == course_code:
            testimonial = t
    
    if not testimonial:
        return response.not_possible("Testimonial not found for author: " + username + " and course: " + course_code)

    if not (testimonial.author == request.user or auth_check.has_admin_rights(request)):
        return response.not_possible("No permission to delete this.")
    
    testimonial.delete()
    return response.success(value="Deleted Testimonial " + str(testimonial))

@response.request_post("title", "message", optional=True)
@auth_check.require_login
def update_testimonial_approval_status(request):
    sender = request.user
    has_admin_rights = auth_check.has_admin_rights(request)
    testimonial_author = request.POST.get('author')
    receiver = get_object_or_404(User, username=testimonial_author)    
    course_code = request.POST.get('course_code')
    title = request.POST.get('title')
    message = request.POST.get('message')
    approval_status = request.POST.get('approval_status')
    course = get_object_or_404(Course, code=course_code)

    testimonial = Testimonial.objects.filter(author=receiver, course=course)

    final_message = ""
    print("TESTING===========")
    print(has_admin_rights)
    print(approval_status)
    print(sender)
    print(receiver)
    if has_admin_rights:
        testimonial.update(approval_status=approval_status)
        print("test")
        if approval_status == str(ApprovalStatus.APPROVED.value):
            print("test2")
            final_message = "Your Testimonial has been Accepted, it is now available to see in the Testimonials tab."
            if (sender != receiver):
                print("test3")
                print("========USERNAME===========")
                print(sender.username)
                print(receiver.username)
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Accepted and the notification has been sent to " + str(receiver) + ".")
        elif approval_status == str(ApprovalStatus.REJECTED.value):
            print("test4")
            final_message = f'Your Testimonial to {course_code} - {course.name}: \n"{testimonial}." has not been accepted due to: {message}'
            if (sender != receiver):
                print("test5")
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Not Accepted " + "and the notification has been sent to " + str(receiver) + ".")
    else:
        return response.not_possible("No permission to approve/disapprove this testimonial.")