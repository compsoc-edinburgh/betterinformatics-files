from util import response
from myauth import auth_check
from categories.models import Category, MetaCategory


@auth_check.require_login
def list_metacategories(request):
    categories = MetaCategory.objects.all()
    tree = {}
    for cat in categories:
        tree.setdefault(cat.parent, []).append(cat)

    res = []
    for parent, childs in sorted(tree.items(), key=lambda x: (x.order, x.displayname)):
        if parent.parent is None:
            res.append({
                'displayname': parent.displayname,
                'meta2': sorted([
                    {
                        'displayname': mcat.displayname,
                        'categories': [
                            cat.slug
                            for cat in sorted(mcat.category_set, key=lambda x: x.displayname)
                        ],
                    } for mcat in sorted(childs, key=lambda x: (x.order, x.displayname))
                ])
            })
    return response.success(value=res)
