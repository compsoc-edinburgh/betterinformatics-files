from util import response
from ediauth import auth_check
from testimonials.models import Course, Testimonial
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.http import JsonResponse
import requests
from django.views.decorators.csrf import csrf_exempt
from notifications.notification_util import update_to_testimonial_status
import spacy
import json
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
            "approved": testimonial.approved,
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
    #grade_band = request.POST.get('grade_band', None) # Added grade_band, optional

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

    api_key = os.environ.get('PERSPECTIVE_API_KEY')
    url = f"https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key={api_key}"

    headers = {
        "Content-Type": "application/json"
    }

    requested_atributtes = ["TOXICITY", "IDENTITY_ATTACK", "INSULT", "PROFANITY"]

    data = {
        "comment": {
            "text": testimonial
        },
        "languages": ["en"],
        "requestedAttributes": {attr: {} for attr in requested_atributtes}
    }

    toxicity_response = requests.post(url, headers=headers, json=data)
    toxicity_response_json = toxicity_response.json()


    scores = [toxicity_response_json["attributeScores"][attr]["summaryScore"]["value"] for attr in requested_atributtes]

    nlp = spacy.load("en_core_web_sm")
    doc = nlp(testimonial)
    names = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]


    approved_flag = True
    if names == []:
        for score in scores:
            if score > 0.3: #if score is below 0.3, add it as a review
                approved_flag = False
                break
    else:
        approved_flag = False

    scores_dict = {requested_atributtes[i]: scores[i] for i in range(len(requested_atributtes))}
    
    testimonial = Testimonial.objects.create(
        author=author,
        course=course,
        year_taken=year_taken,
        approved= approved_flag,
        testimonial=testimonial,
    )

    return response.success(value={"testimonial_id" : testimonial.id, "approved" : approved_flag, "scores": scores_dict, "names_found": names})

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
    testimonial_author = request.POST.get('author')
    receiver = get_object_or_404(User, username=testimonial_author)
    course_code = request.POST.get('course_code')
    title = request.POST.get('title')
    message = request.POST.get('message')
    approval_status = request.POST.get('approval_status')
    approve_status = True if approval_status == "true" else False
    course = get_object_or_404(Course, code=course_code)

    testimonial = Testimonial.objects.filter(author=receiver, course=course)

    final_message = ""
    
    if approval_status == True:
        testimonial.update(approved=approve_status)
        final_message = "Your Testimonial has been Accepted, it is now available to see in the Testimonials tab."
        update_to_testimonial_status(sender, receiver, title, final_message) #notification
        return response.success(value="Testimonial Accepted and the notification has been sent to " + str(receiver) + ".")
    else:
        final_message = f'Your Testimonial to {course_code} - {course.name}: \n"{testimonial.testimonial}." has not been accepted due to: {message}'
        testimonial.delete()
        update_to_testimonial_status(sender, receiver, title, final_message) #notification
        return response.success(value="Testimonial Not Accepted " + "and the notification has been sent to " + str(receiver) + ".")


    
