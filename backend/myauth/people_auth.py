import os
from django.contrib.auth.backends import BaseBackend
from util import func_cache
from myauth.models import MyUser
from notifications.models import NotificationSetting, NotificationType

import grpc
import sys
sys.path.insert(0, os.path.join(os.getcwd(), 'servis'))
import people_pb2
import people_pb2_grpc

people_channel = grpc.insecure_channel(
    os.environ["RUNTIME_SERVIS_PEOPLE_API_SERVER"] + ":" +
    os.environ["RUNTIME_SERVIS_PEOPLE_API_PORT"])
people_client = people_pb2_grpc.PeopleStub(people_channel)
people_metadata = [("authorization",
                    os.environ["RUNTIME_SERVIS_PEOPLE_API_KEY"])]


@func_cache.cache(600)
def get_real_name(username):
    req = people_pb2.GetPersonRequest(username=username)
    try:
        res = people_client.GetEthPerson(req, metadata=people_metadata)
        return (res.first_name, res.last_name)
    except grpc.RpcError as e:
        pass
    try:
        res = people_client.GetVisPerson(req, metadata=people_metadata)
        return (res.first_name, res.last_name)
    except grpc.RpcError as e:
        pass
    return ('', username)


@func_cache.cache(600)
def get_vis_groups(username):
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = people_client.GetVisPerson(req, metadata=people_metadata)
    except grpc.RpcError as e:
        return []
    return res.vis_groups


class PeopleAuthBackend(BaseBackend):

    def authenticate(self, request, username=None, password=None):
        if not username or not password:
            return None
        req = people_pb2.AuthPersonRequest(password=password, username=username)
        try:
            res = people_client.AuthEthPerson(req, metadata=people_metadata, timeout=3)
            if res.ok:
                return self.get_or_create_user(username)
        except grpc.RpcError as e:
            pass
        try:
            res = people_client.AuthVisPerson(req, metadata=people_metadata, timeout=3)
            if res.ok:
                return self.get_or_create_user(username)
        except grpc.RpcError as e:
            pass
        return None

    def get_or_create_user(self, username):
        try:
            user = MyUser.objects.get(username=username.lower())
        except MyUser.DoesNotExist:
            user = MyUser(username=username.lower())
            user.save()
        real_name = get_real_name(username.lower())
        if user.first_name != real_name[0] or user.last_name != real_name[1]:
            user.first_name, user.last_name = real_name
            user.save()
            for type_ in [NotificationType.NEW_COMMENT_TO_ANSWER, NotificationType.NEW_ANSWER_TO_ANSWER]:
                setting = NotificationSetting(user=user, type=type_.value)
                setting.save()
        return user

    def get_user(self, user_id):
        try:
            return MyUser.objects.get(pk=user_id)
        except MyUser.DoesNotExist:
            return None
