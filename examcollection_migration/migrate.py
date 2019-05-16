#!/usr/bin/env python3

import argparse
import requests
import getpass
import os
import difflib
import xml.etree.ElementTree as ET
import re


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

    def get(self, path, **kwargs):
        self.print('GET', self.username, path)
        r = requests.get('{}{}'.format(self.host, path), auth=(self.username, self.password), params=kwargs)
        self.print(r.status_code, r.text)
        return r

    def post(self, path, files=None, **kwargs):
        self.print('POST', self.username, path, kwargs)
        r = requests.post('{}{}'.format(self.host, path), auth=(self.username, self.password), data=kwargs, files=files)
        self.print(r.status_code, r.text)
        return r


class Exam:

    def __init__(self, filename, form, permission):
        self.filename = filename

        self.name = ""
        self.semester = None
        self.solutionPlatform = "wiki"
        self.form = form
        self.permission = permission
        self.old = None
        self.type = None
        self.number = None
        self.remark = []

        # readin flags of the filename
        self.readin_flags()

        # remark:  all remarks combined (for display)
        if self.old:
            self.remark.append("old")
        if self.form and self.form != form:
            self.remark.append(self.form)

    def readin_flags(self):
        """readin flags seperated by underline"""

        parts = ".".join(self.filename.split(".")[:-1]).split("_")

        # Insert space before Inner Uppercase chars
        def split_camel_case(to_split):
            # Catches the first part of the to_string if it starts lower case
            head_string = re.findall('^[^A-Z]+',to_split)
            # Catches all the parts of the string which start upper case, followed by lower case chars
            split_string = re.findall('[A-Z]+[^A-Z]*', to_split)
            return ' '.join(head_string + split_string)

        self.name = split_camel_case(parts[0])

        parts = parts[1:]

        # set default values
        self.form = self.form
        self.permission = self.permission
        self.old = False
        self.number = None

        for flag in parts:
            lowerFlag = flag.lower()

            if lowerFlag.isdigit():
                self.number = lowerFlag
            elif "hs" in lowerFlag or "fs" in lowerFlag:
                self.semester = lowerFlag.upper() # HS/FS is always caps
            elif lowerFlag in ["written", "oral"]:
                self.form = lowerFlag
            elif lowerFlag in ["wiki", "community-solutions"]:
                self.solutionPlatform = lowerFlag
            elif lowerFlag in ["public", "intern", "hidden", "none"]:
                self.permission = lowerFlag
            elif lowerFlag == "old":
                self.old = True
            elif lowerFlag in ["endterm", "midterm", "semesterend"]:
                self.type = lowerFlag
            elif lowerFlag.startswith('c-'):
                self.remark.append(split_camel_case(flag[2:]))
            elif not lowerFlag == 'sol':
                # Log an error if flag is also not equal to 'sol'
                print("Error")


def guess_category(client, foldername):
    categories = client.get('/api/listcategories').json()["value"]
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
    print("[2] Skip category")
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
        elif answer == "2":
            return None
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


def migrate_category(client, path):
    foldername = os.path.basename(os.path.abspath(path))
    print("Folder:", foldername)
    if not os.path.isfile(os.path.join(path, foldername + '.xml')):
        print("Could not find config file")
        return
    config = ET.parse(os.path.join(path, foldername + '.xml')).getroot()
    form = config.find('form').text
    permission = config.find('permission').text
    print("Form:", form)
    print("Permission:", permission)
    category = guess_category(client, foldername)
    if not category:
        print("Skip category")
        return
    print("Category:", category)
    exam_files = sorted(x for x in os.listdir(path) if x.endswith('.pdf') and not x.endswith('_sol.pdf'))
    exams = [Exam(exam, form, permission) for exam in exam_files]
    existing_full = client.get('/api/category/list', category=category).json()["value"]
    existing = [x["displayname"] for x in existing_full]
    for exam in exams:
        if exam.permission != 'public' and exam.form != 'oral':
            print("Skip exam {} with permission {}".format(exam.filename, exam.permission))
            continue
        if exam.semester in existing:
            print("Exam {} already exists for {}".format(exam.semester, exam.filename))
            if not yesno("Upload anyways?", default=False):
                continue
        print("Upload exam", exam.filename)
        fil = open(os.path.join(path, exam.filename), 'rb')
        r = client.post(
            '/api/uploadpdf/exam',
            files={'file': fil},
            category=category,
            displayname=exam.semester,
        )
        fil.close()
        newfilename = r.json()["filename"]
        solname = exam.filename.replace('.pdf', '_sol.pdf')
        if os.path.isfile(os.path.join(path, solname)):
            print("Upload solution", solname)
            fil = open(os.path.join(path, solname), 'rb')
            client.post(
                '/api/uploadpdf/solution',
                files={'file': fil},
                filename=newfilename,
            )
            fil.close()
        if exam.remark:
            print("Set remark")
            client.post(
                '/api/exam/' + newfilename + '/metadata',
                remark=exam.remark
            )
        if exam.form == 'oral':
            print("Set payment category")
            client.post(
                '/api/exam/' + newfilename + '/metadata',
                payment_category=category,
            )
        if exam.name.lower() != category.lower():
            print("Set examtype to other category")
            client.post(
                '/api/exam/' + newfilename + '/metadata',
                examtype=exam.name
            )
        if exam.type:
            print("Set examtype")
            client.post(
                '/api/exam/' + newfilename + '/metadata',
                examtype=exam.type.capitalize()
            )
        if exam.name.lower() != category.lower() and exam.type:
            print("Set examtype")
            client.post(
                '/api/exam/' + newfilename + '/metadata',
                examtype=exam.name + " " + exam.type.capitalize()
            )


def main():
    parser = argparse.ArgumentParser(description='Migrate exams from the old exam collection.')
    parser.add_argument('--debug', action='store_true', help='Print debug information.')
    parser.add_argument('--host', default='http://localhost:8080', help='Host to make requests against.')
    parser.add_argument('--username', default='schneij', help='Username for authentication.')
    parser.add_argument('--password', default='UOmtnC7{\'%G', help='Password for authentication. Set to - to query on terminal.')
    parser.add_argument('paths', nargs='+', help='Path to folder containing the exams and config file.')
    args = parser.parse_args()

    password = args.password
    if password == '-':
        password = getpass.getpass()
    client = Client(args.host, args.username, password, args.debug)

    for path in args.paths:
        while True:
            try:
                migrate_category(client, path)
                break
            except Exception as e:
                print(e)
                if not yesno("Try again?", False):
                    break


if __name__ == '__main__':
    main()
