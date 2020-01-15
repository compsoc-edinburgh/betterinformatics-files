from django.contrib.auth.models import User


def get_my_user(user):
    return MyUser.objects.get(pk=user.pk)


class MyUser(User):

    class Meta:
        proxy = True

    def displayname(self):
        if not self.first_name:
            return self.last_name
        return self.first_name + ' ' + self.last_name
