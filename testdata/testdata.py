#!/usr/bin/env python3

import argparse
import requests


class Client:

    def __init__(self, host, username, password):
        self.host = host
        self.username = username
        self.password = password

    def get(self, path):
        print('GET', self.username, path)
        r = requests.get('http://{}{}'.format(self.host, path), auth=(self.username, self.password))
        print(r.status_code, r.text)
        return r

    def post(self, path, **kwargs):
        print('POST', self.username, path, kwargs)
        r = requests.post('http://{}{}'.format(self.host, path), auth=(self.username, self.password), data=kwargs)
        print(r.status_code, r.text)
        return r


class Creator:

    def __init__(self, host):
        self.host = host
        self.board = [
            Client(host, 'fletchz', '123456abc'),
            Client(host, 'meyee', 'Ub5JBim39HC'),
        ]
        self.cat = [
            Client(host, 'schneij', 'UOmtnC7{\'%G'),
            Client(host, 'kellerju', '1234561'),
        ]
        self.ordinary = [
            Client(host, 'baumanso', 'hLsfTvWz5J'),
            Client(host, 'brunh', 'test'),
            Client(host, 'morica', 'admin666'),
            Client(host, 'mosep', 'schemes gallery busty'),
            Client(host, 'widmjo', 'designed latest wax'),
            Client(host, 'steinewe', '1234561'),
        ]
        self.categories = [
            'Analysis',
            'Algorithmen Und Datenstrukturen',
            'Numerical Methods for CSE',
            'Visual Computing',
        ]

    def all(self):
        self.create_categories()
        self.remove_categories()
        self.add_category_admins()
        self.remove_category_admins()
        self.add_metacategories()
        self.remove_metacategories()
        self.set_notification_settings()
        self.reset_notification_settings()

    def user_info(self):
        for user in self.board + self.cat + self.ordinary:
            user.get('/api/me')

    def create_categories(self):
        for cat in self.categories:
            for i in range(10):
                self.board[0].post(
                    '/api/category/add',
                    category=cat + ' ' + str(i+1),
                )

    def remove_categories(self):
        for cat in self.categories:
            self.cat[1].post(
                '/api/category/remove',
                category=cat + ' 10',
            )

    def add_category_admins(self):
        for cat in self.categories:
            for i in range(6):
                for j in range(2):
                    self.cat[0].post(
                        '/api/category/addadmin',
                        category=cat + ' ' + str(i+1),
                        username=self.ordinary[i % 2 + j * 2].username,
                    )

    def remove_category_admins(self):
        for cat in self.categories:
            self.board[1].post(
                '/api/category/removeadmin',
                category=cat + ' 1',
                username=self.ordinary[0].username,
            )

    def category_metadata(self):
        idx = 0
        for cat in self.categories:
            for i in range(9):
                self.board[0].post(
                    '/api/category/metadata',
                    category=cat + ' ' + str(i+1),
                    semester=["HS", "FS"][idx % 2],
                    form=["written", "oral"][idx % 2],
                    permission="public",
                    remark="This is a test " + str(idx),
                    has_payments=[False, False, False, True][idx % 4],
                    nonsense="nonsense",
                )
                idx += 1

    def add_metacategories(self):
        meta1 = ["Bachelor"] * 6 + ["Master"] * 3
        meta2 = ["Semester " + str(i+1) for i in range(10)]
        for cat in self.categories:
            for i in range(9):
                self.cat[0].post(
                    '/api/metacategory/addcategory',
                    meta1=meta1[i],
                    meta2=meta2[i],
                    category=cat + ' ' + str(i+1),
                )
                self.cat[0].post(
                    '/api/metacategory/addcategory',
                    meta1='Delete Me',
                    meta2='Really!',
                    category=cat + ' ' + str(i+1),
                )
            self.cat[1].post(
                '/api/metacategory/addcategory',
                meta1='General',
                meta2='GESS',
                category=cat + ' 2',
            )
        self.cat[0].post(
            '/api/metacategory/setorder',
            meta1='General',
            order=100,
        )

    def remove_metacategories(self):
        for cat in self.categories:
            for i in range(9):
                self.board[0].post(
                    '/api/metacategory/removecategory',
                    meta1='Delete Me',
                    meta2='Really!',
                    category=cat + ' ' + str(i+1),
                )

    def set_notification_settings(self):
        for lst in self.board, self.cat, self.ordinary:
            lst[1].post(
                '/api/notifications/setenabled',
                enabled=1,
                type=2,
            )
            lst[1].post(
                '/api/notifications/setenabled',
                enabled=0,
                type=3,
            )

    def reset_notification_settings(self):
        for lst in self.board, self.cat, self.ordinary:
            lst[1].post(
                '/api/notifications/setenabled',
                enabled=1,
                type=3,
            )


def main():
    parser = argparse.ArgumentParser(description='Create testdata by issuing requests to the API.')
    parser.add_argument('--host', default='localhost:8080', help='Host to make requests to.')
    parser.add_argument('method', help='Method to execute')
    args = parser.parse_args()
    creator = Creator(args.host)
    getattr(creator, args.method)()


if __name__ == '__main__':
    main()
