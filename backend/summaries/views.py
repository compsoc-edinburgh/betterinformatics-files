from summaries.models import Summary
from myauth import auth_check
from django.views import View
from django.conf import settings
from django.shortcuts import get_object_or_404
from util import response, minio_util
from categories.models import Category


def get_summary_obj(summary):
    return {
        "slug": summary.pk,
        "displayName": summary.display_name,
        "category": summary.category.slug,
    }


def create_summary_slug(summary_name, author_name):
    """
    Create a valid and unique slug for the summary display name
    :param summary: display name
    :param author_name: author_name
    """
    oslug = "".join(
        filter(
            lambda x: x in settings.COMSOL_SUMMARY_SLUG_CHARS,
            author_name + " " + summary_name,
        )
    )

    def exists(aslug):
        return Summary.objects.filter(slug=aslug).exists()

    slug = oslug
    cnt = 0
    while exists(slug):
        cnt += 1
        slug = oslug + "_" + str(cnt)

    return slug


def prepare_summary_pdf_file(request):
    file = request.FILES.get("file")
    if not file:
        return response.missing_argument(), None
    orig_filename = file.name
    ext = minio_util.check_filename(
        orig_filename, settings.COMSOL_SUMMARY_ALLOWED_EXTENSIONS
    )
    if not ext:
        return response.not_possible("Invalid File Extension"), None
    return None, file, ext


class SummaryRootView(View):
    http_method_names = ["get", "post"]

    @auth_check.require_login
    def get(self, request):
        res = [
            get_summary_obj(summary)
            for summary in Summary.objects.prefetch_related("category").all()
        ]
        return response.success(value=res)

    @response.required_args("display_name", "category", "file")
    @auth_check.require_admin
    def post(self, request):
        err, file, ext = prepare_summary_pdf_file(request)
        category = get_object_or_404(Category, slug=request.POST["category"])
        if err is not None:
            return err
        filename = minio_util.generate_filename(16, settings.COMSOL_SUMMARY_DIR, ext)
        summary = Summary(
            question=request.DATA["question"],
            answer=request.DATA["answer"],
            order=int(request.DATA["order"]),
            filename=filename,
            category=category,
        )
        summary.save()
        minio_util.save_uploaded_file_to_minio(
            settings.COMSOL_SUMMARY_DIR, filename, file
        )

        return response.success(value=get_summary_obj(summary))


class SummaryElementView(View):
    http_method_names = ["get"]

    @auth_check.require_login
    def get(self, request, id):
        summary = get_object_or_404(Summary, pk=id)
        return response.success(value=get_summary_obj(summary))


@response.request_get()
@auth_check.require_login
def get_summary_file(request, slug):
    summary = get_object_or_404(Summary, slug=slug)
    return minio_util.send_file(settings.COMSOL_SUMMARY_DIR, summary.filename)