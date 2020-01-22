#!/usr/bin/env python3

import argparse
import requests
import getpass
import os


class Client:

    def __init__(self, host, username, password, debug):
        self.host = host
        self.username = username
        self.password = password
        self.debug = debug
        self.cookies = None
        if debug:
            self.print = print
        else:
            def dummy_print(*args, **kwargs):
                pass
            self.print = dummy_print

    def login(self):
        self.print('Login with user', self.username)
        r = requests.post('{}/api/auth/login/'.format(self.host), data={'username': self.username, 'password': self.password})
        self.cookies = r.cookies

    def logout(self):
        self.post('/api/auth/logout/')

    def get(self, path, **kwargs):
        self.print('GET', self.username, path)
        r = requests.get('{}{}'.format(self.host, path), cookies=self.cookies, params=kwargs)
        self.print(r.status_code, r.text)
        return r

    def post(self, path, files=None, **kwargs):
        self.print('POST', self.username, path, kwargs)
        r = requests.post('{}{}'.format(self.host, path), cookies=self.cookies, data=kwargs, files=files)
        self.print(r.status_code, r.text)
        return r

def just_do_it(client, users, action):
    categories = client.get('/api/category/listwithmeta/').json()["value"]
    if action not in ['add', 'remove']:
        return
    for user in users:
        for cat in categories:
            path = '/api/category/addusertoset/{}/' if action == 'add' else '/api/category/removeuserfromset/{}/'
            client.post(path.format(cat['slug']), key='admins', user=user)

def main():
    parser = argparse.ArgumentParser(description='Add or remove users as admins of all categories.')
    parser.add_argument('--debug', action='store_true', help='Print debug information.')
    parser.add_argument('--host', default='http://localhost:8080', help='Host to make requests against.')
    parser.add_argument('--username', default='schneij', help='Username for authentication.')
    parser.add_argument('--password', default='UOmtnC7{\'%G', help='Password for authentication. Set to - to query on terminal.')
    parser.add_argument('action', choices=['add', 'remove'], help='Action to take.')
    parser.add_argument('userfile', help='File containing list of users.')
    args = parser.parse_args()

    password = args.password
    if password == '-':
        password = getpass.getpass()
    client = Client(args.host, args.username, password, args.debug)

    client.login()
    with open(args.userfile) as f:
        users = [u.strip() for u in f.readlines()]
        just_do_it(client, users, args.action)
    client.logout()


if __name__ == '__main__':
    main()
