from typing import Generic, List, Optional, TypeVar

from django.shortcuts import get_object_or_404
from util import s3_util
from ediauth import auth_check
from .models import Dissertation
from django.db.models import Q
from ninja import File, Form, ModelSchema, Router, Schema, Field, UploadedFile

router = Router()

T = TypeVar("T")


class ValueWrapped(Schema, Generic[T]):
    value: T


class DissertationSchema(ModelSchema):
    uploaded_by: Optional[str] = Field(None, alias="uploaded_by.username")
    upload_date: str = Field(..., alias="upload_date.isoformat")

    class Meta:
        model = Dissertation
        fields = [
            "id",
            "title",
            "field_of_study",
            "supervisors",
            "notes",
            "file_path",
            "study_level",
            "grade_band",
            "year",
        ]


class DissertationUploadSchema(Schema):
    title: str
    field_of_study: str
    supervisors: str
    notes: str = ""
    study_level: str
    grade_band: Optional[str] = None
    year: str


@router.post("/", response=ValueWrapped[DissertationSchema])
@auth_check.require_login
def upload_dissertation(
    request, data: Form[DissertationUploadSchema], pdf_file: File[UploadedFile]
):
    title = data.title
    field_of_study = data.field_of_study
    supervisors = data.supervisors
    notes = data.notes
    study_level = data.study_level
    grade_band = data.grade_band
    year = data.year

    # Upload PDF to Minio
    bucket_name = "dissertations"
    # Assuming the bucket already exists or is created by Minio setup
    # s3_util.create_bucket_if_not_exists(bucket_name) # This function does not exist
    file_name = f"{title.replace(' ', '_')}_{pdf_file.name}"
    # Use save_uploaded_file_to_s3 which is available in s3_util
    s3_util.save_uploaded_file_to_s3(
        bucket_name + "/", file_name, pdf_file, pdf_file.content_type
    )
    file_path = f"/{bucket_name}/{file_name}"

    # Create Dissertation entry in DB
    dissertation = Dissertation.objects.create(
        title=title,
        field_of_study=field_of_study,
        supervisors=supervisors,
        notes=notes,
        file_path=file_path,
        uploaded_by=request.user,
        study_level=study_level,
        grade_band=grade_band,
        year=year,
    )
    return {"value": dissertation}


@router.get("/", response=ValueWrapped[List[DissertationSchema]])
@auth_check.require_login
def list_dissertations(request, query: str = "", field: str = ""):
    dissertations = Dissertation.objects.all()

    if query:
        if field == "title":
            dissertations = dissertations.filter(title__icontains=query)
        elif field == "field_of_study":
            # Split the search query by comma and search for each subfield
            subfields = [s.strip() for s in query.split(",") if s.strip()]
            q_objects = Q()
            for subfield in subfields:
                q_objects |= Q(field_of_study__icontains=subfield)
            dissertations = dissertations.filter(q_objects)
        elif field == "supervisors":
            dissertations = dissertations.filter(supervisors__icontains=query)
        elif field == "year":
            dissertations = dissertations.filter(year=query)
        else:
            # Default to searching all fields if no specific field is provided or recognized
            dissertations = dissertations.filter(
                Q(title__icontains=query)
                | Q(field_of_study__icontains=query)
                | Q(supervisors__icontains=query)
                | Q(year__icontains=query)
            )

    dissertations = dissertations.order_by("-upload_date")
    dissertations = dissertations.prefetch_related("uploaded_by")
    return {"value": dissertations}


@router.get("/{dissertation_id}/", response=ValueWrapped[DissertationSchema])
@auth_check.require_login
def get_dissertation_detail(request, dissertation_id: int):
    dissertation = get_object_or_404(Dissertation, id=dissertation_id)
    return {"value": dissertation}


@router.get("/{dissertation_id}/download/", response=ValueWrapped[str])
@auth_check.require_login
def download_dissertation(request, dissertation_id: int):
    dissertation = get_object_or_404(Dissertation, id=dissertation_id)

    # Extract bucket name and file name from file_path
    path_parts = dissertation.file_path.split("/")
    bucket_name = path_parts[1]
    file_name = "/".join(path_parts[2:])

    # Generate a presigned URL for direct access from Minio
    presigned_url = s3_util.presigned_get_object(
        bucket_name + "/",
        file_name,
        inline=True,  # For inline viewing
        content_type="application/pdf",
        display_name=f"{dissertation.title}.pdf",
    )
    return {"value": presigned_url}
