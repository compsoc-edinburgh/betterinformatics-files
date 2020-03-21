#!/usr/bin/env python3

import argparse
import requests
import getpass
import os
import difflib


class Client:

    def __init__(self, host, username, password, debug):
        self.host = host
        self.username = username
        self.password = password
        self.debug = debug
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

def guess_category(client, foldername):
    categories = client.get('/api/category/list/').json()["value"]
    best_guess = difflib.get_close_matches(foldername, categories, n=10, cutoff=0.2)
    if best_guess:
        print("Which category do you want to use for", foldername)
        print("[0] Something else")
        for i, guess in enumerate(best_guess):
            print("[{}] {}".format(i+1, guess))
        answer = input("=> ")
        if answer.isdecimal() and 0 < int(answer) <= len(best_guess):
            return best_guess[int(answer)-1]
    else:
        print("Could not find any category for", foldername)
    print("What do you want to do?")
    print("[0] Create category and retry")
    print("[1] Enter name of category")
    while True:
        answer = input("=> ").strip()
        if answer == "0":
            print("Please confirm once the category was created")
            input()
            return guess_category(client, foldername)
        elif answer == "1":
            print("Please enter name of category")
            category = input("=> ")
            if category in categories:
                return category
            else:
                print("Category does not exist")
                return guess_category(client, foldername)
        else:
            print("Invalid choice")


def yesno(prompt, default):
    while True:
        answer = input(prompt + (" [Y/n]" if default else " [y/N]"))
        if answer.lower() == 'y':
            return True
        elif answer.lower() == 'n':
            return False
        elif answer == '':
            return default


def category_to_slug(client, category):
    categories = client.get('/api/category/listwithmeta/').json()["value"]
    for cat in categories:
        if cat['displayname'] == category:
            return cat['slug']


def upload(client, category, dummy, real, displayname):
    print("Category:", category)
    print("Upload exam", dummy)
    fil = open(dummy, 'rb')
    r = client.post(
        '/api/exam/upload/exam/',
        files={'file': fil},
        category=category_to_slug(client, category),
        displayname=displayname,
    )
    fil.close()
    newfilename = r.json()["filename"]
    print("Upload real pdf", real)
    fil = open(real, 'rb')
    client.post(
        '/api/exam/upload/printonly/',
        files={'file': fil},
        filename=newfilename,
    )
    fil.close()

def main():
    parser = argparse.ArgumentParser(description='Upload printonly exams.')
    parser.add_argument('--debug', action='store_true', help='Print debug information.')
    parser.add_argument('--host', default='http://localhost:8080', help='Host to make requests against.')
    parser.add_argument('--username', default='schneij', help='Username for authentication.')
    parser.add_argument('--password', default='UOmtnC7{\'%G', help='Password for authentication. Set to - to query on terminal.')
    parser.add_argument('category', help='Category to upload to')
    parser.add_argument('examfile', help='File with exams to upload')
    args = parser.parse_args()

    password = args.password
    if password == '-':
        password = getpass.getpass()
    client = Client(args.host, args.username, password, args.debug)
    client.login()

    category = guess_category(client, args.category)

    with open(args.examfile) as f:
        for line in f:
            dummy, real, display = line.split()
            print(dummy, real, display)
            upload(client, category, dummy, real, display)
    client.logout()


if __name__ == '__main__':
    main()
