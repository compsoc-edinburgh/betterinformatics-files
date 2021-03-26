from django.urls import path

from . import views


urlpatterns = [
    path("", views.SummaryRootView.as_view(), name="root"),
    path("<int:id>/", views.SummaryElementView.as_view(), name="element"),
    path("file/<string:slug>/", views.get_summary_file, name="file"),
]
