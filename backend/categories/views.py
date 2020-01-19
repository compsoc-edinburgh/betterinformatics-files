from util import response
from myauth import auth_check
from myauth.models import get_my_user, MyUser
from categories.models import Category, MetaCategory
from django.conf import settings
from django.shortcuts import get_object_or_404


@auth_check.require_login
def list_categories(request):
    return response.success(value=list(Category.objects.values_list('displayname', flat=True)))


@auth_check.require_login
def list_categories_with_meta(request):
    categories = Category.objects.all()
    res = sorted([
        {
            'displayname': cat.displayname,
            'slug': cat.slug,
            'examcountpublic': 0, # TODO implement
            'examcountanswered': 0, # TODO implement
            'answerprogress': 0, # TODO implement
        } for cat in categories
    ], key=lambda x: x['displayname'])
    return response.success(value=res)


@auth_check.require_login
def list_categories_only_admin(request):
    categories = Category.objects.all()
    res = sorted([
        {
            'displayname': cat.displayname,
            'slug': cat.slug,
        }
        for cat in categories
        if auth_check.has_admin_rights_for_category(request, cat)
    ], key=lambda x: x['displayname'])
    return response.success(value=res)


@auth_check.require_login
def list_categories_only_payment(request):
    res = sorted([
        {
            'displayname': cat.displayname,
            'slug': cat.slug,
        }
        for cat in Category.objects.filter(has_payments=True)
    ], key=lambda x: x['displayname'])
    return response.success(value=res)


def create_category_slug(category):
    """
    Create a valid and unique slug for the category name
    :param category: category name
    """
    oslug = ''.join(filter(lambda x: x in settings.COMSOL_CATEGORY_SLUG_CHARS, category))

    def exists(aslug):
        return Category.objects.filter(slug=aslug).exists()

    slug = oslug
    cnt = 0
    while exists(slug):
        cnt += 1
        slug = oslug + "_" + str(cnt)

    return slug


@auth_check.require_admin
@response.args_post('category')
def add_category(request):
    slug = create_category_slug(request.POST['category'])
    cat = Category(
        displayname=request.POST['category'],
        slug=slug,
    )
    cat.save()
    return response.success(slug=slug)


@auth_check.require_admin
@response.args_post('slug')
def remove_category(request):
    cat = get_object_or_404(Category, slug=request.POST['slug'])
    if cat.slug == 'default':
        return response.not_possible('Can not delete default category')
    cat.exam_set.update(category=Category.objects.get(slug='default'))
    cat.delete()
    return response.success()


@auth_check.require_login
def list_exams(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    res = sorted([
        {
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
            'finished_wiki_transfer': ex.finished_wiki_transfer,
            'canView': ex.current_user_can_view(request),
            'count_cuts': 0, # TODO implement
            'count_answered': 0 # TODO implement
        } for ex in cat.exam_set.all()
    ], key=lambda x: x['displayname'])
    return response.success(value=res)


@auth_check.require_login
def get_metadata(request, slug):
    cat = get_object_or_404(Category, slug=slug)
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
        'examcountpublic': 0, # TODO implement
        'examcountanswered': 0, # TODO implement
        'answerprogress': 0, # TODO implement
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
    return response.success(value=res)


@response.args_post('semester', 'form', 'permission', 'remark', 'has_payments', 'more_exams_link', optional=True)
@auth_check.require_admin
def set_metadata(request, slug):
    cat = get_object_or_404(Category, slug=slug)
    for key in ['semester', 'form', 'permission', 'remark', 'more_exams_link']:
        if key in request.POST:
            setattr(cat, key, request.POST[key])
    if 'has_payments' in request.POST:
        cat.has_payments = request.POST['has_payments'] != 'false'
    cat.save()
    return response.success()


@response.args_post('key', 'user')
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


@response.args_post('key', 'user')
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


@auth_check.require_login
def list_metacategories(request):
    categories = MetaCategory.objects.all()
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


@response.args_post('meta1', 'meta2', 'category')
@auth_check.require_admin
def add_metacategory(request):
    cat = get_object_or_404(Category, slug=request.POST['category'])
    meta1, _ = MetaCategory.objects.get_or_create(displayname=request.POST['meta1'], parent=None)
    meta2, _ = MetaCategory.objects.get_or_create(displayname=request.POST['meta2'], parent=meta1)
    if not meta2.category_set.filter(pk=cat.pk).exists():
        meta2.category_set.add(cat)
    return response.success()


@response.args_post('meta1', 'meta2', 'category')
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


@response.args_post('meta1', 'order')
@response.args_post('meta2', optional=True)
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
