from util import response
from ediauth import auth_check
from testimonials.models import Testimonial, ApprovalStatus
from categories.models import EuclidCode
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from notifications.notification_util import update_to_testimonial_status
import ediauth.auth_check as auth_check

@response.request_get()
@auth_check.require_login
def testimonial_metadata(request):
    testimonials = Testimonial.objects.all()
    res = [
        {
            "authorId": testimonial.author.username,
            "authorDisplayName": testimonial.author.profile.display_username,
            "euclid_code": testimonial.euclid_code.code,
            "course_name": testimonial.euclid_code.category.displayname,
            "testimonial": testimonial.testimonial,
            "id": testimonial.id,
            "year_taken": testimonial.year_taken,
            "approval_status": testimonial.approval_status,
        }
        for testimonial in testimonials
    ]
    return response.success(value=res)

@response.request_post("course_code", "year_taken", optional=True)
@auth_check.require_login
def add_testimonial(request):
    author = request.user
    course_code = request.POST.get('course_code') #course code instead of course name
    year_taken = request.POST.get('year_taken')
    testimonial = request.POST.get('testimonial')

    if not author:
        return response.not_possible("Missing argument: author")
    if not year_taken:
        return response.not_possible("Missing argument: year_taken")
    if not testimonial:
        return response.not_possible("Missing argument: testimonial")

    testimonials = Testimonial.objects.all()
    euclid_code_obj = EuclidCode.objects.filter(code=course_code)

    for t in testimonials:
        if t.author == author and t.euclid_code.code == course_code and (t.approval_status == ApprovalStatus.APPROVED):
            return response.not_possible("You have written a testimonial for this course that has been approved.")
        elif t.author == author and t.euclid_code.code  == course_code and (t.approval_status == ApprovalStatus.PENDING):
            return response.not_possible("You have written a testimonial for this course that is currently pending approval.")
    
    testimonial = Testimonial.objects.create(
        author=author,
        euclid_code=euclid_code_obj[0],
        year_taken=year_taken,
        approval_status= ApprovalStatus.PENDING,
        testimonial=testimonial,
    )

    return response.success(value={"testimonial_id" : testimonial.id, "approved" : False})

@response.request_post("username", "course_code", 'testimonial_id', optional=True)
@auth_check.require_login
def remove_testimonial(request):
    username = request.POST.get('username')
    course_code = request.POST.get('course_code')
    testimonial_id = request.POST.get('testimonial_id')

    testimonial = Testimonial.objects.filter(id=testimonial_id) #Since id is primary key, always returns 1 or none.

    if not testimonial:
        return response.not_possible("Testimonial not found for author: " + username + " and course: " + course_code)

    if not (testimonial[0].author == request.user or auth_check.has_admin_rights(request)):
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
    testimonial_id = request.POST.get('testimonial_id')
    title = request.POST.get('title')
    message = request.POST.get('message')
    approval_status = request.POST.get('approval_status')
    course_name = request.POST.get('course_name')

    testimonial = Testimonial.objects.filter(id=testimonial_id)

    final_message = ""
    if has_admin_rights:
        testimonial.update(approval_status=approval_status)
        if approval_status == str(ApprovalStatus.APPROVED.value):
            final_message = f'Your Testimonial to {course_code} - {course_name}: \n"{testimonial[0].testimonial}" has been Accepted, it is now available to see in the Testimonials tab.'
            if (sender != receiver):
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Accepted and the notification has been sent to " + str(receiver) + ".")
        elif approval_status == str(ApprovalStatus.REJECTED.value):
            final_message = f'Your Testimonial to {course_code} - {course_name}: \n"{testimonial[0].testimonial}." has not been accepted due to: {message}'
            if (sender != receiver):
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Not Accepted " + "and the notification has been sent to " + str(receiver) + ".")
        else:
            return response.not_possible("Cannot Update the Testimonial to approval_status: " + str(approval_status))
    else:
        return response.not_possible("No permission to approve/disapprove this testimonial.")