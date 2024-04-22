from django.db.models import Count, Exists, OuterRef, Q

from answers.models import Answer
from util import response
from myauth import auth_check
from myauth.models import get_my_user, MyUser
from categories.models import Category, MetaCategory
from django.conf import settings
from django.shortcuts import get_object_or_404


@response.request_get()
def list_categories(request):
    return response.success(value=list(Category.objects.order_by('displayname').values_list('displayname', flat=True)))


@response.request_get()
def list_categories_with_meta(request):
    categories = Category.objects.select_related('meta').order_by('displayname').all()
    res = [
        {
            'displayname': cat.displayname,
            'slug': cat.slug,
            'documentcount': cat.meta.documentcount,
            'examcountpublic': cat.meta.examcount_public,
            'examcountanswered': cat.meta.examcount_answered,
            'answerprogress': cat.answer_progress(),
        } for cat in categories
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def list_categories_only_admin(request):
    categories = Category.objects.order_by('displayname').all()
    res = [
        {
            'displayname': cat.displayname,
            'slug': cat.slug,
        }
        for cat in categories
        if auth_check.has_admin_rights_for_category(request, cat)
    ]
    return response.success(value=res)


@response.request_get()
@auth_check.require_login
def list_categories_only_payment(request):
    res = [
        {
            'displayname': cat.displayname,
            'slug': cat.slug,
        }
        for cat in Category.objects.filter(has_payments=True).order_by('displayname')
    ]
    return response.success(value=res)


@response.request_post('category')
@auth_check.require_admin
def add_category(request):
    slug = create_category_slug(request.POST['category'])
    cat = Category(
        displayname=request.POST['category'],
        slug=slug,
    )
    cat.save()
    return response.success(slug=slug)


def create_category_slug(category, ignored_pk=None):
    """
    Create a valid and unique slug for the category name
    :param category: category name
    """
    oslug = "".join(
        filter(
            lambda x: x in settings.COMSOL_CATEGORY_SLUG_CHARS,
            category.lower().replace(" ", "_")
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


@response.request_post('slug')
@auth_check.require_admin
def remove_category(request):
    cat = get_object_or_404(Category, slug=request.POST['slug'])
    if cat.slug == 'default':
        return response.not_possible('Can not delete default category')
    cat.exam_set.update(category=Category.objects.get(slug='default'))
    cat.document_set.update(category=Category.objects.get(slug='default'))
    cat.delete()
    return response.success()


@response.request_get()
@auth_check.require_login
def list_exams(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    res = sorted([
        {
            'sort-key': ex.sort_key(),
            'displayname': ex.displayname,
            'filename': ex.filename,
            'category_displayname': cat.displayname,
            'needs_payment': ex.needs_payment,
            'examtype': ex.exam_type.displayname if ex.exam_type else '',
            'remark': ex.remark,
            'import_claim': ex.import_claim.username if ex.import_claim else None,
            'import_claim_displayname': get_my_user(ex.import_claim).displayname() if ex.import_claim else None,
            'import_claim_time': ex.import_claim_time,
            'public': ex.public,
            'has_solution': ex.has_solution,
            'is_printonly': ex.is_printonly,
            'finished_cuts': ex.finished_cuts,
            'canView': ex.current_user_can_view(request),
            'count_cuts': ex.counts.count_cuts,
            'count_answered': ex.counts.count_answered,
        } for ex in cat.exam_set.select_related('exam_type', 'import_claim', 'counts').all()
    ], key=lambda x: x['sort-key'], reverse=True)
    for ex in res:
        del ex['sort-key']
    return response.success(value=res)

def get_category_data(request, cat):
    res = {
        'displayname': cat.displayname,
        'slug': cat.slug,
        'admins': [],
        'experts': [],
        'semester': cat.semester,
        'form': cat.form,
        'permission': cat.permission,
        'remark': cat.remark,
        'has_payments': cat.has_payments,
        'catadmin': auth_check.has_admin_rights_for_category(request, cat),
        'more_exams_link': cat.more_exams_link,
        # These values are not needed in the frontend and are expensive to calculate
        # 'examcountpublic': cat.exam_set.filter(public=True).count(),
        # 'examcountanswered': cat.exam_count_answered(),
        # 'answerprogress': cat.answer_progress(),
        'attachments': sorted([
            {
                'displayname': att.displayname,
                'filename': att.filename,
            } for att in cat.attachment_set.all()
        ], key=lambda x: x['displayname']),
    }
    if auth_check.has_admin_rights_for_category(request, cat):
        res['admins'] = list(cat.admins.all().values_list('username', flat=True))
        res['experts'] = list(cat.experts.all().values_list('username', flat=True))
    return res

@response.request_get()
@auth_check.require_login
def get_metadata(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    res = get_category_data(request, cat)
    return response.success(value=res)


@response.request_post('displayname', 'semester', 'form', 'permission', 'remark', 'has_payments', 'more_exams_link', optional=True)
@auth_check.require_admin
def set_metadata(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    if 'displayname' in request.POST:
        if cat.slug == 'default':
            return response.not_possible('Can not rename default category')
        # prevent whitespaced or empty displaynames
        if request.POST['displayname'].strip() == '':
            return response.not_possible("Invalid displayname")
        cat.displayname = request.POST['displayname']
        cat.slug = create_category_slug(cat.displayname, cat.pk)
    for key in ['semester', 'form', 'permission', 'remark', 'more_exams_link']:
        if key in request.POST:
            setattr(cat, key, request.POST[key])
    if 'has_payments' in request.POST:
        cat.has_payments = request.POST['has_payments'] != 'false'
    cat.save()
    res = get_category_data(request, cat)
    return response.success(value=res)


@response.request_post('key', 'user')
@auth_check.require_admin
def add_user_to_set(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    user = get_object_or_404(MyUser, username=request.POST['user'])
    if request.POST['key'] == 'admins':
        if not cat.admins.filter(pk=user.pk).exists():
            cat.admins.add(user)
            cat.save()
    elif request.POST['key'] == 'experts':
        if not cat.experts.filter(pk=user.pk).exists():
            cat.experts.add(user)
            cat.save()
    else:
        return response.not_possible('Unknown key')
    return response.success()


@response.request_post('key', 'user')
@auth_check.require_admin
def remove_user_from_set(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    user = get_object_or_404(MyUser, username=request.POST['user'])
    if request.POST['key'] == 'admins':
        if cat.admins.filter(pk=user.pk).exists():
            cat.admins.remove(user)
            cat.save()
    elif request.POST['key'] == 'experts':
        if cat.experts.filter(pk=user.pk).exists():
            cat.experts.remove(user)
            cat.save()
    else:
        return response.not_possible('Unknown key')
    return response.success()


@response.request_get()
def list_metacategories(request):
    categories = MetaCategory.objects.select_related('parent').prefetch_related('metacategory_set', 'category_set').all()
    tree = {}
    for cat in categories:
        tree.setdefault(cat.parent, []).append(cat)

    res = []
    for parent, childs in sorted(
            filter(lambda x: x[0] and x[0].parent is None, tree.items()),
            key=lambda x: (x[0].order, x[0].displayname)):
        res.append({
            'displayname': parent.displayname,
            'meta2': [
                {
                    'displayname': mcat.displayname,
                    'categories': [
                        cat.slug
                        for cat in sorted(mcat.category_set.all(), key=lambda x: x.displayname)
                    ],
                } for mcat in sorted(childs, key=lambda x: (x.order, x.displayname))
            ]
        })
    return response.success(value=res)


@response.request_post('meta1', 'meta2', 'category')
@auth_check.require_admin
def add_metacategory(request):
    cat = get_object_or_404(Category, slug=request.POST['category'])
    meta1, _ = MetaCategory.objects.get_or_create(displayname=request.POST['meta1'], parent=None)
    meta2, _ = MetaCategory.objects.get_or_create(displayname=request.POST['meta2'], parent=meta1)
    if not meta2.category_set.filter(pk=cat.pk).exists():
        meta2.category_set.add(cat)
    return response.success()


@response.request_post('meta1', 'meta2', 'category')
@auth_check.require_admin
def remove_metacategory(request):
    cat = get_object_or_404(Category, slug=request.POST['category'])
    meta1 = get_object_or_404(MetaCategory, displayname=request.POST['meta1'], parent=None)
    meta2 = get_object_or_404(MetaCategory, displayname=request.POST['meta2'], parent=meta1)
    meta2.category_set.remove(cat)
    if not meta2.category_set.exists():
        meta2.delete()
    if not meta1.metacategory_set.exists():
        meta1.delete()
    return response.success()


@response.request_post('meta1', 'order')
@response.request_post('meta2', optional=True)
@auth_check.require_admin
def set_metacategory_order(request):
    meta1 = get_object_or_404(MetaCategory, displayname=request.POST['meta1'], parent=None)
    if 'meta2' in request.POST:
        meta2 = get_object_or_404(MetaCategory, displayname=request.POST['meta2'], parent=meta1)
        meta2.order = int(request.POST['order'])
        meta2.save()
    else:
        meta1.order = int(request.POST['order'])
        meta1.save()
    return response.success()
