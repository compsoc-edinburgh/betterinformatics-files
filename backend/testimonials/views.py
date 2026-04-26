from util import response
from ediauth import auth_check
from testimonials.models import Testimonial, ApprovalStatus
from categories.models import Category
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from notifications.notification_util import update_to_testimonial_status
import ediauth.auth_check as auth_check
from django.core.exceptions import ValidationError

@response.request_get("slug", optional=True)
@auth_check.require_login
def testimonial_metadata(request, slug: str = ""):
    res = []
    if slug != "":
        slug = request.GET.get('slug')
        try:
            category_obj = Category.objects.get(slug=slug)
        except Category.DoesNotExist:
            return response.not_possible(f"The category with slug {slug} does not exist in the database.")
        testimonials = Testimonial.objects.prefetch_related("category__euclid_codes").filter(category=category_obj)
        res = [
            {
                "author_id": testimonial.author.username,
                "author_diplay_name": testimonial.author.profile.display_username,
                "slug": testimonial.category.slug,
                "euclid_codes": [euclidcode.code for euclidcode in testimonial.category.euclid_codes.all()],
                "course_name": testimonial.category.displayname,
                "testimonial": testimonial.testimonial,
                "testimonial_id": testimonial.id,
                "year_taken": testimonial.year_taken,
                "approval_status": testimonial.approval_status,
            }
            for testimonial in testimonials
        ]
    else:
        testimonials = Testimonial.objects.prefetch_related("category__euclid_codes")
        res = [
            {
                "author_id": testimonial.author.username,
                "author_diplay_name": testimonial.author.profile.display_username,
                "slug": testimonial.category.slug,
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

@response.request_post("slug", "year_taken", optional=True)
@auth_check.require_login
def add_testimonial(request):
    author = request.user
    slug = request.POST.get('slug')
    year_taken = request.POST.get('year_taken')
    testimonial = request.POST.get('testimonial')
    
    if not author:
        return response.not_possible("Missing argument: author")
    if not year_taken:
        return response.not_possible("Missing argument: year_taken")
    if not testimonial:
        return response.not_possible("Missing argument: testimonial")

    category_obj = Category.objects.get(slug=slug)
    try:
        testimonial = Testimonial(
            author=author,
            category=category_obj,
            year_taken=year_taken,
            approval_status= ApprovalStatus.PENDING,
            testimonial=testimonial,
        )
        testimonial.validate_constraints()
        testimonial.save()
    except ValidationError:
        return response.not_possible(
            "You already have a testimonial for this course that is pending or approved."
        )
    return response.success(value={"testimonial_id" : testimonial.id})

@response.request_post("username", 'testimonial_id', optional=True)
@auth_check.require_login
def remove_testimonial(request):
    username = request.POST.get('username')
    testimonial_id = request.POST.get('testimonial_id')

    testimonial = Testimonial.objects.filter(id=testimonial_id).first() #Since id is primary key, always returns 1 or none.


    if not testimonial:
        return response.not_possible("Testimonial not found for author: " + username + " with id " + testimonial_id)

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
            final_message = (
                f"Your testimonial for {course_name} has been accepted 🎉\n\n"
                f"Testimonial:\n"
                f"\"{testimonial[0].testimonial}\"\n\n"
                f"It is now available to view in the Testimonials tab."
            )
            if (sender != receiver):
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Accepted and the notification has been sent to " + str(receiver) + ".")
        elif approval_status == str(ApprovalStatus.REJECTED.value):
            final_message = (
                f"Your testimonial for {course_name} has not been accepted.\n\n"
                f"Testimonial:\n"
                f"\"{testimonial[0].testimonial}\"\n\n"
                f"Reason for rejection:\n"
                f"\"{message}\"\n\n"
                f"You're welcome to submit another testimonial for the same course after making corrections and we will review it again."
            )

            if (sender != receiver):
                update_to_testimonial_status(sender, receiver, title, final_message) #notification
            return response.success(value="Testimonial Not Accepted " + "and the notification has been sent to " + str(receiver) + ".")
        else:
            return response.not_possible("Cannot Update the Testimonial to approval_status: " + str(approval_status))
    else:
        return response.not_possible("No permission to approve/disapprove this testimonial.")