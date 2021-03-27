from summaries.models import Summary
from myauth import auth_check
from django.views import View
from django.conf import settings
from django.shortcuts import get_object_or_404
from util import response, minio_util
from categories.models import Category


def get_summary_obj(summary: Summary):
    return {
        "slug": summary.slug,
        "display_name": summary.display_name,
        "category": summary.category.slug,
        "category_display_name": summary.category.displayname,
        "author": summary.author.username,
        "filename": summary.filename,
        "mime_type": summary.mime_type,
    }


def create_summary_slug(summary_name: str, author_name: str):
    """
    Create a valid and unique slug for the summary display name
    :param summary: display name
    :param author_name: author_name
    """
    oslug = "".join(
        filter(
            lambda x: x in settings.COMSOL_SUMMARY_SLUG_CHARS,
            author_name.lower() + "-" + summary_name.lower(),
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
    http_method_names = ["get", "post", "put"]

    @auth_check.require_login
    def get(self, request):
        category = request.GET.get("category")

        objects = Summary.objects
        if category != "":
            objects = objects.filter(category__slug=category)
        res = [
            get_summary_obj(summary)
            for summary in objects.prefetch_related("category", "author").all()
        ]
        return response.success(value=res)

    @response.required_args("display_name", "category")
    @auth_check.require_login
    def post(self, request):
        err, file, ext = prepare_summary_pdf_file(request)
        category = get_object_or_404(Category, slug=request.POST["category"])
        if err is not None:
            return err
        filename = minio_util.generate_filename(
            16, settings.COMSOL_SUMMARY_DIR, "." + ext
        )
        display_name = request.POST["display_name"]
        summary = Summary(
            slug=create_summary_slug(display_name, request.user.username),
            display_name=display_name,
            category=category,
            author=request.user,
            filename=filename,
            mime_type=file.content_type,
        )
        summary.save()
        minio_util.save_uploaded_file_to_minio(
            settings.COMSOL_SUMMARY_DIR, filename, file, file.content_type
        )

        return response.success(value=get_summary_obj(summary))


class SummaryElementView(View):
    http_method_names = ["get", "delete"]

    @auth_check.require_login
    def get(self, request, slug):
        summary = get_object_or_404(Summary, slug=slug)
        return response.success(value=get_summary_obj(summary))

    @auth_check.require_login
    def delete(self, request, slug):
        summary = get_object_or_404(Summary, slug=slug)
        if not summary.current_user_can_delete(request):
            return response.not_allowed()
        summary.delete()
        return response.success(value=True)


@response.request_get()
def get_summary_file(request, filename):
    summary = get_object_or_404(Summary, filename=filename)
    return minio_util.send_file(
        settings.COMSOL_SUMMARY_DIR,
        filename,
        as_attachment=True,
        attachment_filename=filename,
    )
