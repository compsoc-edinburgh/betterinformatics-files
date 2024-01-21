from django.urls import path

from . import views

urlpatterns = [
    path("list/", views.list_categories, name="list"),
    path("listwithmeta/", views.list_categories_with_meta, name="listwithmeta"),
    path("listonlyadmin/", views.list_categories_only_admin, name="listonlyadmin"),
    path("add/", views.add_category, name="add"),
    path("remove/", views.remove_category, name="remove"),
    path("metadata/<slug:slug>/", views.get_metadata, name="metadata"),
    path("setmetadata/<slug:slug>/", views.set_metadata, name="setmetadata"),
    path("addusertoset/<slug:slug>/", views.add_user_to_set, name="addusertoset"),
    path(
        "removeuserfromset/<slug:slug>/",
        views.remove_user_from_set,
        name="removeuserfromset",
    ),
    path("listexams/<slug:slug>/", views.list_exams, name="listexams"),
    path("listmetacategories/", views.list_metacategories, name="list_metacategories"),
    path("addmetacategory/", views.add_metacategory, name="addmetacategory"),
    path("removemetacategory/", views.remove_metacategory, name="removemetacategory"),
    path(
        "setmetacategoryorder/",
        views.set_metacategory_order,
        name="setmetacategoryorder",
    ),
    path("addeuclidcode/<slug:slug>/", views.add_euclid_code, name="addeuclidcode"),
    path(
        "removeeuclidcode/<slug:slug>/",
        views.remove_euclid_code,
        name="removeeuclidcode",
    ),
    path(
        "slugfromeuclidcode",
        views.get_category_from_euclid_code,
        name="slugfromeuclidcode",
    ),
    path("listeuclidcodes/", views.list_euclid_codes, name="listeuclidcodes"),
]
