from django.db import models
from django.db.models import Q, UniqueConstraint


class ApprovalStatus(models.IntegerChoices):
    APPROVED = 0, "Approved"
    PENDING = 1, "Pending"
    REJECTED = 2, "Rejected"

class Testimonial(models.Model):
    id = models.AutoField(primary_key=True)
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE, default="")
    euclid_code = models.ForeignKey(  # Link Testimonial to a Course
        "categories.EuclidCode",
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
                fields=["author", "euclid_code"],
                condition=Q(approval_status__in=[ApprovalStatus.APPROVED, ApprovalStatus.PENDING]),
                name="unique_approved_or_pending_per_author_course",
            ),
        ]