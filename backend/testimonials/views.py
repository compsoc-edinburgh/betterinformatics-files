from util import response
from ediauth import auth_check
from testimonials.models import Testimonial, ApprovalStatus
from categories.models import Category
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
            "author_id": testimonial.author.username,
            "author_diplay_name": testimonial.author.profile.display_username,
            "category_id": testimonial.category.id,
            "euclid_codes": [euclidcode.code for euclidcode in testimonial.category.euclid_codes.all()],
            "course_name": testimonial.category.displayname,
            "testimonial": testimonial.testimonial,
            "testimonial_id": testimonial.id,
            "year_taken": testimonial.year_taken,
            "approval_status": testimonial.approval_status,
        }
        for testimonial in testimonials
    ]
    return response.success(value=res)

@response.request_get("category_id")
@auth_check.require_login
def get_testimonial_metadata_by_code(request):
    category_id = request.POST.get('category_id')
    try:
        category_obj = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return response.not_possible(f"The category with id {category_id} does not exist in the database.")
    testimonials = Testimonial.objects.filter(category=category_obj)
    res = [
        {
            "author_id": testimonial.author.username,
            "author_diplay_name": testimonial.author.profile.display_username,
            "category_id": testimonial.category.id,
            "euclid_codes": testimonial.category.euclid_codes,
            "course_name": testimonial.category.displayname,
            "testimonial": testimonial.testimonial,
            "testimonial_id": testimonial.id,
            "year_taken": testimonial.year_taken,
            "approval_status": testimonial.approval_status,
        }
        for testimonial in testimonials
    ]
    return response.success(value=res)

@response.request_post("category_id", "year_taken", optional=True)
@auth_check.require_login
def add_testimonial(request):
    author = request.user
    category_id = request.POST.get('category_id') #course code instead of course name
    year_taken = request.POST.get('year_taken')
    testimonial = request.POST.get('testimonial')

    if not author:
        return response.not_possible("Missing argument: author")
    if not year_taken:
        return response.not_possible("Missing argument: year_taken")
    if not testimonial:
        return response.not_possible("Missing argument: testimonial")

    testimonials = Testimonial.objects.all()
    category_obj = Category.objects.get(id=category_id)

    for t in testimonials:
        if t.author == author and t.category == category_obj and (t.approval_status == ApprovalStatus.APPROVED):
            return response.not_possible("You have written a testimonial for this course that has been approved.")
        elif t.author == author and t.category == category_obj and (t.approval_status == ApprovalStatus.PENDING):
            return response.not_possible("You have written a testimonial for this course that is currently pending approval.")
    
    testimonial = Testimonial.objects.create(
        author=author,
        category=category_obj,
        year_taken=year_taken,
        approval_status= ApprovalStatus.PENDING,
        testimonial=testimonial,
    )

    return response.success(value={"testimonial_id" : testimonial.id, "approved" : False})

@response.request_post("username", 'testimonial_id', optional=True)
@auth_check.require_login
def remove_testimonial(request):
    username = request.POST.get('username')
    testimonial_id = request.POST.get('testimonial_id')

    testimonial = Testimonial.objects.filter(id=testimonial_id) #Since id is primary key, always returns 1 or none.

    if not testimonial:
        return response.not_possible("Testimonial not found for author: " + username + " with id " + testimonial_id)

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
            final_message = f'Your Testimonial to {course_name}: \n"{testimonial[0].testimonial}" has been Accepted, it is now available to see in the Testimonials tab.'
            if (sender != receiver):
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Accepted and the notification has been sent to " + str(receiver) + ".")
        elif approval_status == str(ApprovalStatus.REJECTED.value):
            final_message = f'Your Testimonial to {course_name}: \n"{testimonial[0].testimonial}" has not been accepted due to: {message}'
            if (sender != receiver):
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Not Accepted " + "and the notification has been sent to " + str(receiver) + ".")
        else:
            return response.not_possible("Cannot Update the Testimonial to approval_status: " + str(approval_status))
    else:
        return response.not_possible("No permission to approve/disapprove this testimonial.")