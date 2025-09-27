from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Count, Exists, OuterRef, Q
from django.shortcuts import get_object_or_404

from answers.models import Answer
from categories.models import Category, MetaCategory, EuclidCode, CourseStats
from ediauth import auth_check
from util import response, func_cache


@response.request_get()
def list_categories(request):
    categories = Category.objects.order_by("displayname").all()
    res = [
        {
            "displayname": cat.displayname,
            "slug": cat.slug,
        }
        for cat in categories
    ]
    return response.success(value=res)


@response.request_get()
def list_categories_with_meta(request):
    categories = Category.objects.select_related("meta").order_by("displayname").all()
    res = [
        {
            "displayname": cat.displayname,
            "slug": cat.slug,
            "examcountpublic": cat.meta.examcount_public,
            "examcountanswered": cat.meta.examcount_answered,
            "documentcount": cat.meta.documentcount,
            "answerprogress": cat.answer_progress(),
        }
        for cat in categories
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def list_categories_only_admin(request):
    categories = Category.objects.order_by("displayname").all()
    res = [
        {
            "displayname": cat.displayname,
            "slug": cat.slug,
        }
        for cat in categories
        if auth_check.has_admin_rights_for_category(request, cat)
    ]
    return response.success(value=res)


@response.request_post("category")
@auth_check.require_admin
def add_category(request):
    slug = create_category_slug(
        request.POST["slug"]
        if "slug" in request.POST  # Use slug if provided, but still sanitise it
        else request.POST["category"]
    )
    cat = Category(
        displayname=request.POST["category"],
        slug=slug,
    )
    cat.save()
    return response.success(slug=slug)


def create_category_slug(category, ignored_pk=None):
    """
    Create a valid and unique slug for the category name
    :param category: category name
    :param ignored_pk: pk of category to ignore when checking for uniqueness (used for renaming categories without changing the slug)
    """
    oslug = "".join(
        filter(
            lambda x: x in settings.COMSOL_CATEGORY_SLUG_CHARS,
            category.lower().replace(" ", "_"),
        )
    )
    if oslug == "":
        oslug = "invalid_name"

    def exists(aslug):
        categories = Category.objects.filter(slug=aslug)
        if ignored_pk is not None:
            categories = categories.exclude(pk=ignored_pk)
        return categories.exists()

    slug = oslug
    cnt = 0
    while exists(slug):
        slug = oslug + "_" + str(cnt)
        cnt += 1

    return slug


@response.request_post("slug")
@auth_check.require_admin
def remove_category(request):
    cat = get_object_or_404(Category, slug=request.POST["slug"])
    if cat.slug == "default":
        return response.not_possible("Can not delete default category")
    cat.exam_set.update(category=Category.objects.get(slug="default"))
    cat.document_set.update(category=Category.objects.get(slug="default"))
    cat.delete()
    return response.success()


@response.request_get()
@auth_check.require_login
def list_exams(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    res = sorted(
        [
            {
                "sort-key": ex.sort_key(),
                "displayname": ex.displayname,
                "filename": ex.filename,
                "category_displayname": cat.displayname,
                "examtype": ex.exam_type.displayname if ex.exam_type else "",
                "remark": ex.remark,
                "import_claim": ex.import_claim.username if ex.import_claim else None,
                "import_claim_displayname": (
                    ex.import_claim.profile.display_username
                    if ex.import_claim
                    else None
                ),
                "import_claim_time": ex.import_claim_time,
                "public": ex.public,
                "has_solution": ex.has_solution,
                "finished_cuts": ex.finished_cuts,
                "canView": ex.current_user_can_view(request),
                "count_cuts": ex.counts.count_cuts,
                "count_answered": ex.counts.count_answered,
            }
            for ex in cat.exam_set.select_related(
                "exam_type", "import_claim", "counts"
            ).all()
        ],
        key=lambda x: x["sort-key"],
        reverse=True,
    )
    for ex in res:
        del ex["sort-key"]
    return response.success(value=res)


def get_category_data(request, cat):
    res = {
        "displayname": cat.displayname,
        "slug": cat.slug,
        "admins": [],
        "experts": [],
        "semester": cat.semester,
        "form": cat.form,
        "permission": cat.permission,
        "remark": cat.remark,
        "catadmin": auth_check.has_admin_rights_for_category(request, cat),
        "more_exams_link": cat.more_exams_link,
        "more_markdown_link": cat.more_markdown_link,
        "euclid_codes": list(cat.euclid_codes.all().values_list("code", flat=True)),
        # These values are not needed in the frontend and are expensive to calculate
        # 'examcountpublic': cat.exam_set.filter(public=True).count(),
        # 'examcountanswered': cat.exam_count_answered(),
        # 'answerprogress': cat.answer_progress(),
        "attachments": sorted(
            [
                {
                    "displayname": att.displayname,
                    "filename": att.filename,
                }
                for att in cat.attachment_set.all()
            ],
            key=lambda x: x["displayname"],
        ),
    }
    if auth_check.has_admin_rights_for_category(request, cat):
        res["admins"] = list(cat.admins.all().values_list("username", flat=True))
        res["experts"] = list(cat.experts.all().values_list("username", flat=True))
    return res


@response.request_get()
@auth_check.require_login
def get_metadata(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    res = get_category_data(request, cat)
    return response.success(value=res)


@response.request_post(
    "displayname",
    "semester",
    "form",
    "permission",
    "remark",
    "more_exams_link",
    "more_markdown_link",
    optional=True,
)
@auth_check.require_admin
def set_metadata(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    if "displayname" in request.POST:
        if cat.slug == "default":
            return response.not_possible("Can not rename default category")
        # prevent whitespaced or empty displaynames
        if request.POST["displayname"].strip() == "":
            return response.not_possible("Invalid displayname")
        cat.displayname = request.POST["displayname"]
    if "slug" in request.POST:
        # Use slug if provided, but still sanitise it. Make sure that it is
        # unique barring the current category when checking uniqueness.
        cat.slug = create_category_slug(request.POST["slug"], cat.pk)
    if "more_markdown_link" in request.POST:
        # verify that the link is CSP-compliant, since the frontend will be
        # fetch-ing and rendering it
        if (
            not any(
                [
                    request.POST["more_markdown_link"].startswith(x)
                    for x in settings.CSP_CONNECT_SRC
                ]
            )
            and request.POST["more_markdown_link"].strip() != ""
        ):
            return response.not_possible("Markdown link violates CSP")
    for key in [
        "semester",
        "form",
        "permission",
        "remark",
        "more_exams_link",
        "more_markdown_link",
    ]:
        if key in request.POST:
            setattr(cat, key, request.POST[key])
    cat.save()
    res = get_category_data(request, cat)
    return response.success(value=res)


@response.request_post("key", "user")
@auth_check.require_admin
def add_user_to_set(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    user = get_object_or_404(User, username=request.POST["user"])
    if request.POST["key"] == "admins":
        if not cat.admins.filter(pk=user.pk).exists():
            cat.admins.add(user)
            cat.save()
    elif request.POST["key"] == "experts":
        if not cat.experts.filter(pk=user.pk).exists():
            cat.experts.add(user)
            cat.save()
    else:
        return response.not_possible("Unknown key")
    return response.success()


@response.request_post("key", "user")
@auth_check.require_admin
def remove_user_from_set(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    user = get_object_or_404(User, username=request.POST["user"])
    if request.POST["key"] == "admins":
        if cat.admins.filter(pk=user.pk).exists():
            cat.admins.remove(user)
            cat.save()
    elif request.POST["key"] == "experts":
        if cat.experts.filter(pk=user.pk).exists():
            cat.experts.remove(user)
            cat.save()
    else:
        return response.not_possible("Unknown key")
    return response.success()


@response.request_get()
def list_metacategories(request):
    categories = (
        MetaCategory.objects.select_related("parent")
        .prefetch_related("metacategory_set", "category_set")
        .all()
    )
    tree = {}
    for cat in categories:
        tree.setdefault(cat.parent, []).append(cat)

    res = []
    for parent, childs in sorted(
        filter(lambda x: x[0] and x[0].parent is None, tree.items()),
        key=lambda x: (x[0].order, x[0].displayname),
    ):
        res.append(
            {
                "displayname": parent.displayname,
                "meta2": [
                    {
                        "displayname": mcat.displayname,
                        "categories": [
                            cat.slug
                            for cat in sorted(
                                mcat.category_set.all(), key=lambda x: x.displayname
                            )
                        ],
                    }
                    for mcat in sorted(childs, key=lambda x: (x.order, x.displayname))
                ],
            }
        )
    return response.success(value=res)


@response.request_post("meta1", "meta2", "category")
@auth_check.require_admin
def add_metacategory(request):
    cat = get_object_or_404(Category, slug=request.POST["category"])
    meta1, _ = MetaCategory.objects.get_or_create(
        displayname=request.POST["meta1"], parent=None
    )
    meta2, _ = MetaCategory.objects.get_or_create(
        displayname=request.POST["meta2"], parent=meta1
    )
    if not meta2.category_set.filter(pk=cat.pk).exists():
        meta2.category_set.add(cat)
    return response.success()


@response.request_post("meta1", "meta2", "category")
@auth_check.require_admin
def remove_metacategory(request):
    cat = get_object_or_404(Category, slug=request.POST["category"])
    meta1 = get_object_or_404(
        MetaCategory, displayname=request.POST["meta1"], parent=None
    )
    meta2 = get_object_or_404(
        MetaCategory, displayname=request.POST["meta2"], parent=meta1
    )
    meta2.category_set.remove(cat)
    if not meta2.category_set.exists():
        meta2.delete()
    if not meta1.metacategory_set.exists():
        meta1.delete()
    return response.success()


@response.request_post("meta1", "order")
@response.request_post("meta2", optional=True)
@auth_check.require_admin
def set_metacategory_order(request):
    meta1 = get_object_or_404(
        MetaCategory, displayname=request.POST["meta1"], parent=None
    )
    if "meta2" in request.POST:
        meta2 = get_object_or_404(
            MetaCategory, displayname=request.POST["meta2"], parent=meta1
        )
        meta2.order = int(request.POST["order"])
        meta2.save()
    else:
        meta1.order = int(request.POST["order"])
        meta1.save()
    return response.success()


@response.request_post("code")
@auth_check.require_admin
def add_euclid_code(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    code = request.POST["code"].upper().strip()
    if len(code) > 12:
        return response.not_possible("Code too long")

    # Check if code is already assigned to another category, if so return the name of it
    if cat.euclid_codes.filter(code=code).exists():
        return response.not_possible(
            "Code already assigned to category {}".format(
                cat.euclid_codes.get(code=code).category.displayname
            )
        )
    cat.euclid_codes.create(code=code)
    return response.success()


@response.request_post("code")
@auth_check.require_admin
def remove_euclid_code(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    code = request.POST["code"].upper()
    cat.euclid_codes.filter(code=code).delete()
    return response.success()


@response.request_get("code")
def get_category_from_euclid_code(request):
    code = request.GET["code"].upper()
    cat = get_object_or_404(Category, euclid_codes__code=code)
    return response.success(value=cat.slug)


@response.request_get()
def list_euclid_codes(request):
    codes = EuclidCode.objects.all()
    res = [
        {
            "code": code.code,
            "category": code.category.slug,
        }
        for code in codes
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def get_course_stats(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    
    # Get all Euclid codes for this category
    euclid_codes = list(cat.euclid_codes.all().values_list("code", flat=True))
    
    if not euclid_codes:
        return response.success(value=[])
    
    # Get course stats for all Euclid codes associated with this category
    stats = CourseStats.objects.filter(course_code__in=euclid_codes).order_by('course_code', 'academic_year')
    
    res = [
        {
            "course_name": stat.course_name,
            "course_code": stat.course_code,
            "mean_mark": stat.mean_mark,
            "std_deviation": stat.std_deviation,
            "academic_year": stat.academic_year,
            "course_organiser": stat.course_organiser,
        }
        for stat in stats
    ]
    
    return response.success(value=res)
