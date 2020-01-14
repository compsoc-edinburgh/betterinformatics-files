import os
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User
from util import func_cache

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
    if username == '__legacy__':
        return ('', 'Old VISki Solution')
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


class PeopleAuthBackend(BaseBackend):

    def authenticate(self, request, username=None, password=None):
        if not username or not password:
            return False
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
            user = User.objects.get(username=username.lower())
        except User.DoesNotExist:
            user = User(username=username.lower())
            user.save()
        real_name = get_real_name(username.lower())
        if user.first_name != real_name[0] or user.last_name != real_name[1]:
            user.first_name, user.last_name = real_name
            user.save()
        return user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
