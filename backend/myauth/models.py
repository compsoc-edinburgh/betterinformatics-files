from django.contrib.auth.models import User


class MyUser(User):

    class Meta:
        proxy = True

    @staticmethod
    def from_user(user):
        # TODO implement me
        return None

    def displayname(self):
        if not self.first_name:
            return self.last_name
        return self.first_name + ' ' + self.last_name
