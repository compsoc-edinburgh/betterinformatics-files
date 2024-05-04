from django.shortcuts import render
from ediauth import auth_check
from util import response
from categories.models import Category
from favourites.models import FavouriteCategory


@auth_check.require_login
def get_favourites(request):
    favourites = FavouriteCategory.objects.filter(user=request.user)

    return response.success(
        value=[f.category.slug for f in favourites]
    )


@response.request_post()
@auth_check.require_login
def add_favorite(request, slug):
    new_favourite = FavouriteCategory(
        user=request.user, category=Category.objects.get(slug=slug))

    new_favourite.save()
    return response.success()


@response.request_post()
@auth_check.require_login
def remove_favorite(request, slug):
    favourite = FavouriteCategory.objects.get(
        user=request.user, category__slug=slug)
    favourite.delete()
    return response.success()
