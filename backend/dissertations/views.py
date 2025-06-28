from django.shortcuts import get_object_or_404
from django.conf import settings
from util import s3_util, response
from ediauth import auth_check
from .models import Dissertation
from django.http import JsonResponse
from django.db.models import Q

def get_dissertation_obj(dissertation: Dissertation):
    return {
        'id': dissertation.id,
        'title': dissertation.title,
        'field_of_study': dissertation.field_of_study,
        'supervisors': dissertation.supervisors,
        'notes': dissertation.notes,
        'file_path': dissertation.file_path,
        'uploaded_by': dissertation.uploaded_by.username if dissertation.uploaded_by else None,
        'upload_date': dissertation.upload_date.isoformat(),
        'study_level': dissertation.study_level,
        'grade_band': dissertation.grade_band, # Added grade_band
        'year': dissertation.year, # Added year
    }

@response.request_post("title", "field_of_study", "supervisors", "study_level", "year", optional=True)
@auth_check.require_login
def upload_dissertation(request):
    title = request.POST.get('title')
    field_of_study = request.POST.get('field_of_study')
    supervisors = request.POST.get('supervisors')
    notes = request.POST.get('notes', '') # notes is optional
    pdf_file = request.FILES.get('pdf_file')
    study_level = request.POST.get('study_level')
    grade_band = request.POST.get('grade_band', None) # Added grade_band, optional
    year = request.POST.get('year') # Added year

    if not pdf_file:
        return response.not_possible("Missing argument: pdf_file")
    if not title:
        return response.not_possible("Missing argument: title")
    if not field_of_study:
        return response.not_possible("Missing argument: field_of_study")
    if not supervisors:
        return response.not_possible("Missing argument: supervisors")
    if not study_level:
        return response.not_possible("Missing argument: study_level")
    if not year:
        return response.not_possible("Missing argument: year")

    # Upload PDF to Minio
    try:
        bucket_name = "dissertations"
        # Assuming the bucket already exists or is created by Minio setup
        # s3_util.create_bucket_if_not_exists(bucket_name) # This function does not exist
        file_name = f"{title.replace(' ', '_')}_{pdf_file.name}"
        # Use save_uploaded_file_to_s3 which is available in s3_util
        s3_util.save_uploaded_file_to_s3(bucket_name + '/', file_name, pdf_file, pdf_file.content_type)
        file_path = f"/{bucket_name}/{file_name}"
    except Exception as e:
        # Use internal_error for server-side issues like Minio upload failure
        return response.internal_error()

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
    return response.success(value=get_dissertation_obj(dissertation))

@response.request_get()
@auth_check.require_login
def list_dissertations(request):
    dissertations = Dissertation.objects.all()

    search_query = request.GET.get('query', '')
    search_field = request.GET.get('field', '')

    if search_query:
        if search_field == 'title':
            dissertations = dissertations.filter(title__icontains=search_query)
        elif search_field == 'field_of_study':
            # Split the search query by comma and search for each subfield
            subfields = [s.strip() for s in search_query.split(',') if s.strip()]
            q_objects = Q()
            for subfield in subfields:
                q_objects |= Q(field_of_study__icontains=subfield)
            dissertations = dissertations.filter(q_objects)
        elif search_field == 'supervisors':
            dissertations = dissertations.filter(supervisors__icontains=search_query)
        elif search_field == 'year':
            dissertations = dissertations.filter(year=search_query)
        else:
            # Default to searching all fields if no specific field is provided or recognized
            dissertations = dissertations.filter(
                Q(title__icontains=search_query) |
                Q(field_of_study__icontains=search_query) |
                Q(supervisors__icontains=search_query) |
                Q(year__icontains=search_query)
            )

    dissertations = dissertations.order_by('-upload_date')
    return response.success(value=[get_dissertation_obj(d) for d in dissertations])

@response.request_get()
@auth_check.require_login
def get_dissertation_detail(request, dissertation_id):
    dissertation = get_object_or_404(Dissertation, id=dissertation_id)
    return response.success(value=get_dissertation_obj(dissertation))

@response.request_get()
@auth_check.require_login
def download_dissertation(request, dissertation_id):
    dissertation = get_object_or_404(Dissertation, id=dissertation_id)

    try:
        # Extract bucket name and file name from file_path
        path_parts = dissertation.file_path.split('/')
        bucket_name = path_parts[1]
        file_name = '/'.join(path_parts[2:])

        # Generate a presigned URL for direct access from Minio
        presigned_url = s3_util.presigned_get_object(
            bucket_name + '/',
            file_name,
            inline=True, # For inline viewing
            content_type='application/pdf',
            display_name=f"{dissertation.title}.pdf"
        )
        return response.success(value=presigned_url)
    except Exception as e:
        return response.internal_error()