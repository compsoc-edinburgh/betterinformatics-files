import datetime
import os
import re
import tempfile
from typing import Generic, List, Optional, TypeVar, Union

from django.shortcuts import get_object_or_404
from django.conf import settings
from categories.models import Category
from util import response, s3_util
from ediauth import auth_check
from .models import Dissertation
from .pdf_redactor import redactor, RedactorOptions
from django.db.models import Q
from ninja import (
    File,
    Form,
    ModelSchema,
    Router,
    Schema,
    Field,
    UploadedFile,
)

bucket_name = "dissertations"
router = Router()

T = TypeVar("T")


class ValueWrapped(Schema, Generic[T]):
    value: T


class SlugDisplayNameSchema(Schema):
    slug: str
    displayname: str


class DissertationSchema(ModelSchema):
    uploaded_by: Optional[str] = Field(None, alias="uploaded_by.username")
    upload_date: str = Field(..., alias="upload_date.isoformat")
    relevant_categories: List[SlugDisplayNameSchema]
    can_edit: bool

    @staticmethod
    def resolve_relevant_categories(
        dissertation: Dissertation,
    ) -> List[SlugDisplayNameSchema]:
        return [
            SlugDisplayNameSchema(slug=category.slug, displayname=category.displayname)
            for category in dissertation.relevant_categories.all()
        ]

    @staticmethod
    def resolve_can_edit(dissertation: Dissertation, context) -> bool:
        is_admin = auth_check.has_admin_rights(context["request"])
        is_owner = dissertation.uploaded_by == context["request"].user
        return is_admin or is_owner

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
    words_to_redact: Optional[str] = (
        None  # comma separated, since our frontend doesn't explode arrays
    )
    title: str
    field_of_study: str
    supervisors: str
    notes: str = ""
    study_level: str
    grade_band: Optional[str] = None
    year: int
    relevant_categories: str  # comma separated list of category slugs


class DissertationEditSchema(Schema):
    """It would be nice if this could just be PatchDict[DissertationUploadSchema]
    but that doesn't seem to work when combined with Form[]."""

    words_to_redact: Optional[str] = (
        None  # comma separated, since our frontend doesn't explode arrays
    )
    title: Optional[str] = None
    field_of_study: Optional[str] = None
    supervisors: Optional[str] = None
    notes: Optional[str] = None
    study_level: Optional[str] = None
    grade_band: Optional[str] = None
    year: Optional[int] = None
    relevant_categories: Optional[str] = None  # comma separated list of category slugs


def redact_file(file: UploadedFile, words_to_redact: List[str]) -> str:
    """Perform text redaction on a file and write to a temporary file in the
    ComSol upload folder.

    Parameters
    ----------
    file : UploadedFile
    words_to_redact : List[str]
        List of non-empty trimmed words to redact.

    Returns
    -------
    str
        Filepath of redacted file.
    """
    handle, temp_file_path = tempfile.mkstemp(dir=settings.COMSOL_UPLOAD_FOLDER)

    options = RedactorOptions()
    options.content_filters = [
        # Replace each phrase with some periods.
        # If the replacement character doesn't exist in the PDF's glyph
        # table, the redaction will not look good. Periods are prooooobably
        # guaranteed to exist in a dissertation so we use that rather than
        # Xs, spaces, hyphens etc or words like 'Redacted'.
        (re.compile(w, re.IGNORECASE), lambda m: "." * len(m.group()))
        for w in words_to_redact
    ]
    options.input_stream = file.file
    options.output_stream = handle
    redactor(options)

    return temp_file_path


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

    temp_file_path = redact_file(
        pdf_file,
        [w.strip() for w in (data.words_to_redact or "").split(",") if w.strip()],
    )

    # Upload PDF to Minio
    # Assuming the bucket already exists or is created by Minio setup
    file_name = f"{title.replace(' ', '_')}_{pdf_file.name}"
    s3_util.save_file_to_s3(
        bucket_name + "/",
        file_name,
        temp_file_path,
        pdf_file.content_type or "application/pdf",
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

    categories = Category.objects.filter(slug__in=data.relevant_categories.split(","))
    if len(categories) != len(data.relevant_categories.split(",")):
        return response.not_possible("One or more categories not found.")
    dissertation.relevant_categories.set(categories)

    return {"value": dissertation}


class DissertationRedactionSchema(Schema):
    words: str  # comma separated, since our frontend doesn't explode arrays


@router.post("/redact/", response=ValueWrapped[str])
@auth_check.require_login
def redact_dissertation(
    request, pdf_file: File[UploadedFile], data: Form[DissertationRedactionSchema]
):
    # Make sure all words don't have RegEx bombs
    for word in data.words.split(","):
        word = word.strip()
        if not word:
            continue
        if not re.match(r"^[a-zA-Z0-9\s\-\=\.\&]+$", word):
            return response.not_possible(
                f"Redaction phrase has to be alphanumeric: {word}"
            )

    temp_file_path = redact_file(
        pdf_file, [w.strip() for w in data.words.split(",") if w.strip()]
    )

    s3_util.save_file_to_s3(
        bucket_name + "_temp_redacted/",
        f"redacted_{pdf_file.name}",
        temp_file_path,
    )

    os.remove(temp_file_path)

    # Delete any existing redacted files older than 5 minutes: ideally we should
    # do this kind of churn in a scheduled celery task or something)
    s3_util.delete_files_older_than(
        bucket_name + "_temp_redacted/",
        "redacted_",
        cutoff_time=datetime.datetime.now(datetime.timezone.utc)
        - datetime.timedelta(minutes=5),
    )

    # Generate a presigned URL for direct access from Minio
    presigned_url = s3_util.presigned_get_object(
        bucket_name + "_temp_redacted/",
        f"redacted_{pdf_file.name}",
        inline=True,  # For inline viewing
        content_type="application/pdf",
        display_name=f"{pdf_file.name}.pdf",
    )
    return {"value": presigned_url}


@router.get("/", response=ValueWrapped[List[DissertationSchema]])
@auth_check.require_login
def list_dissertations(
    request,
    query: Union[str, int] = "",
    field: str = "",
    category: Optional[str] = None,
):
    dissertations = Dissertation.objects.all()

    if query:
        if field == "title" and isinstance(query, str):
            dissertations = dissertations.filter(title__icontains=query)
        elif field == "field_of_study" and isinstance(query, str):
            # Split the search query by comma and search for each subfield
            subfields = [s.strip() for s in query.split(",") if s.strip()]
            q_objects = Q()
            for subfield in subfields:
                q_objects |= Q(field_of_study__icontains=subfield)
            dissertations = dissertations.filter(q_objects)
        elif field == "supervisors" and isinstance(query, str):
            dissertations = dissertations.filter(supervisors__icontains=query)
        elif field == "year" and isinstance(query, int):
            dissertations = dissertations.filter(year=query)
        else:
            # Default to searching all fields if no specific field is provided or recognized
            dissertations = dissertations.filter(
                Q(title__icontains=query)
                | Q(field_of_study__icontains=query)
                | Q(supervisors__icontains=query)
                | Q(year__icontains=query)
            )

    if category:
        dissertations = dissertations.filter(relevant_categories__slug=category)

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


@router.put("/{dissertation_id}/", response=ValueWrapped[DissertationSchema])
@auth_check.require_login
def update_dissertation(
    request,
    dissertation_id: int,
    data: Form[DissertationEditSchema],
    pdf_file: Optional[File[UploadedFile]] = None,
):
    dissertation = get_object_or_404(Dissertation, id=dissertation_id)

    # Only allow the user who uploaded the dissertation to update it
    # Or admins
    if dissertation.uploaded_by != request.user and not auth_check.has_admin_rights(
        request
    ):
        return response.not_allowed()

    for attr, value in data.model_dump(exclude_unset=True).items():
        if attr == "relevant_categories":
            categories = Category.objects.filter(slug__in=value.split(","))
            if len(categories) != len(value.split(",")):
                return response.not_possible("One or more categories not found.")
            dissertation.relevant_categories.set(categories)
            continue
        setattr(dissertation, attr, value)

    if pdf_file:
        # Delete old file from Minio if it exists
        if dissertation.file_path:
            old_path_parts = dissertation.file_path.split("/")
            old_bucket_name = old_path_parts[1]
            old_file_name = "/".join(old_path_parts[2:])
            s3_util.delete_file(old_bucket_name + "/", old_file_name)

        # Upload PDF to Minio
        # Assuming the bucket already exists or is created by Minio setup
        file_name = f"{dissertation.title.replace(' ', '_')}_{pdf_file.name}"
        s3_util.save_uploaded_file_to_s3(
            bucket_name + "/", file_name, pdf_file, pdf_file.content_type
        )
        file_path = f"/{bucket_name}/{file_name}"

        dissertation.file_path = file_path

    dissertation.save()

    return {"value": dissertation}


@router.delete("/{dissertation_id}/")
@auth_check.require_login
def delete_dissertation(request, dissertation_id: int):
    dissertation = get_object_or_404(Dissertation, id=dissertation_id)

    # Only allow the user who uploaded the dissertation to delete it
    # Or admins
    if dissertation.uploaded_by != request.user and not auth_check.has_admin_rights(
        request
    ):
        return response.not_allowed()

    # Delete file from Minio if it exists
    if dissertation.file_path:
        path_parts = dissertation.file_path.split("/")
        bucket_name = path_parts[1]
        file_name = "/".join(path_parts[2:])
        s3_util.delete_file(bucket_name + "/", file_name)

    dissertation.delete()

    return response.success()
