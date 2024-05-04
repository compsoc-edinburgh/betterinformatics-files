from django.db import models


class FavouriteCategory(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    app_label = 'favourites'
    category = models.ForeignKey(
        "categories.Category", related_name="favourite_users", on_delete=models.CASCADE)
