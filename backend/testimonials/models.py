from django.db import models
from django.db.models import Q, UniqueConstraint

class Course(models.Model):
    name = models.TextField()
    code = models.CharField(max_length=256, primary_key = True) #Course Code is the Primary Key
    level =  models.IntegerField() #Difficulty Level of Course
    credits = models.IntegerField()
    delivery = models.TextField() #SEM1, SEM2, YEAR
    work_exam_ratio = models.TextField()
    dpmt_link = models.TextField()

    def __str__(self):
        return self.code  # Use only a field of the model
    #add a testimonial data type to courses


class ApprovalStatus(models.IntegerChoices):
    APPROVED = 0, "Approved"
    PENDING = 1, "Pending"
    REJECTED = 2, "Rejected"

class Testimonial(models.Model):
    id = models.AutoField(primary_key=True)
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE, default="")
    course = models.ForeignKey(  # Link Testimonial to a Course
        "testimonials.Course",
        on_delete=models.CASCADE,  # Delete testimonials if course is deleted
    ) #Course_id, author_id, id (testimonial_id)
    testimonial = models.TextField()
    year_taken = models.IntegerField()
    approval_status = models.IntegerField(
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )

    class Meta:
        #Only one row with (author, course) where approval_status is APPROVED or PENDING can exist.
        #Multiple rejected rows can exist for (author, course) combination.
        constraints = [
            UniqueConstraint(
                fields=["author", "course"],
                condition=Q(approval_status__in=[ApprovalStatus.APPROVED, ApprovalStatus.PENDING]),
                name="unique_approved_or_pending_per_author_course",
            ),
        ]