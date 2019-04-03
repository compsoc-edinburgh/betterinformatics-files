import sys
from flask import Flask, g, request, redirect, url_for, send_from_directory, jsonify
from flask_httpauth import HTTPBasicAuth
import json
from pymongo import MongoClient
from functools import wraps
from flask import send_file, send_from_directory, render_template
from minio import Minio
from minio.error import ResponseError, BucketAlreadyExists, BucketAlreadyOwnedByYou, NoSuchKey
from bson.objectid import ObjectId

from datetime import datetime, timezone
import os
import traceback
import inspect
import time
import random
import enum

import grpc
import people_pb2
import people_pb2_grpc

import dbmigrations
import ethprint

people_channel = grpc.insecure_channel(
    os.environ["RUNTIME_SERVIS_PEOPLE_API_SERVER"] + ":" +
    os.environ["RUNTIME_SERVIS_PEOPLE_API_PORT"])
people_client = people_pb2_grpc.PeopleStub(people_channel)
people_metadata = [("authorization",
                    os.environ["RUNTIME_SERVIS_PEOPLE_API_KEY"])]

app = Flask(__name__, static_url_path="/static")
auth = HTTPBasicAuth()

UPLOAD_FOLDER = 'intermediate_pdf_storage'
EXAM_DIR = 'exams/'
IMAGE_DIR = 'imgs/'
EXAM_ALLOWED_EXTENSIONS = {'pdf'}
IMAGE_ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'svg', 'gif'}
IMAGE_MIME_TYPES = {
    'jpg': "image/jpeg",
    'jpeg': "image/jpeg",
    'png': "image/png",
    'svg': "image/svg+xml",
    'gif': "image/gif",
}
app.config['INTERMEDIATE_PDF_STORAGE'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # MAX FILE SIZE IS 32 MB
app.config['SECRET_KEY'] = 'VERY SAFE SECRET KEY'
# Minio seems to run unsecured on port 80
minio_is_https = os.environ.get('RUNTIME_MINIO_URL', '').startswith('https') and \
                 not os.environ.get('RUNTIME_MINIO_HOST', '') == 'visdev-minio'
# visdev sets RUNTIME_MINIO_HOST but CIT sets RUNTIME_MINIO_SERVER
minio_client = Minio(
    os.environ.get('RUNTIME_MINIO_SERVER', os.environ.get('RUNTIME_MINIO_HOST')),
    access_key=os.environ['RUNTIME_MINIO_ACCESS_KEY'],
    secret_key=os.environ['RUNTIME_MINIO_SECRET_KEY'],
    secure=minio_is_https)
minio_bucket = os.environ['RUNTIME_MINIO_BUCKET_NAME']

try:
    minio_client.make_bucket(minio_bucket)
except BucketAlreadyOwnedByYou as err:
    pass
except BucketAlreadyExists as err:
    pass
except ResponseError as err:
    print(err)

# this works in staging
# mongo_url = "mongodb://{}:{}@{}:{}/{}".format(
#     os.environ['RUNTIME_MONGO_DB_USER'], os.environ['RUNTIME_MONGO_DB_PW'],
#     os.environ['RUNTIME_MONGO_DB_SERVER'], os.environ['RUNTIME_MONGO_DB_PORT'],
#     os.environ['RUNTIME_MONGO_DB_NAME'])
# mongo_db = MongoClient(mongo_url).get_database()

# this works locally
mongo_db = MongoClient(
    host=os.environ['RUNTIME_MONGO_DB_SERVER'],
    port=int(os.environ['RUNTIME_MONGO_DB_PORT']),
    username=os.environ['RUNTIME_MONGO_DB_USER'],
    password=os.environ['RUNTIME_MONGO_DB_PW'],
    connect=True,
    authSource=os.environ['RUNTIME_MONGO_DB_NAME'],
)[os.environ['RUNTIME_MONGO_DB_NAME']]

answer_sections = mongo_db.answersections
user_data = mongo_db.userdata
category_metadata = mongo_db.categorymetadata
exam_metadata = mongo_db.exammetadata
image_metadata = mongo_db.imagemetadata
feedback = mongo_db.feedback


class NotificationType(enum.Enum):
    NEW_COMMENT_TO_ANSWER = 1
    NEW_COMMENT_TO_COMMENT = 2
    NEW_ANSWER_TO_ANSWER = 3


def get_argument_value(argument, func, args, kwargs):
    """
    Figure out the value of the given argument for a method call.
    :param argument: the name of the argument
    :param func: the function object
    :param args: the arguments of the call
    :param kwargs: the keyword arguments of the call
    :return: the value of the argument or None if not found
    """
    if argument in kwargs:
        return kwargs[argument]
    for i, param in enumerate(inspect.signature(func).parameters):
        if param.name == argument:
            return args[i]
    return None


def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = auth.username()
        if not has_admin_rights(username):
            return not_allowed()
        return f(*args, **kwargs)

    return wrapper


def require_exam_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = auth.username()
        filename = get_argument_value("filename", f, args, kwargs)
        if not filename:
            if not has_admin_rights(username):
                return not_allowed()
        else:
            if not has_admin_rights_for_exam(username, filename):
                return not_allowed()
        return f(*args, **kwargs)

    return wrapper


def date_handler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj


def make_json_response(obj):
    return json.dumps(obj, default=date_handler)


def not_allowed():
    return make_json_response({"err": "Not allowed"}), 403


def not_found():
    return make_json_response({"err": "Not found"}), 404


def not_possible(msg):
    return make_json_response({"err": msg}), 400


def internal_error(msg):
    print(msg)
    return make_json_response({"err": "Internal error"}), 500


def success(**kwargs):
    return make_json_response(kwargs)


def filter_dict(dictionary, whitelist):
    filtered = {}
    for white in whitelist:
        if white in dictionary:
            filtered[white] = dictionary[white]
    return filtered


@auth.verify_password
def verify_pw(username, password):
    if not username or not password:
        return False
    try:
        req = people_pb2.AuthPersonRequest(
            password=password, username=username)
        res = people_client.AuthEthPerson(req, metadata=people_metadata)
    except grpc.RpcError as e:
        print("Verify Password throws:", e, file=sys.stderr)
        return False
    return res.ok


def get_real_name(username):
    if username == '__legacy__':
        return "Old VISki Solution"
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = people_client.GetEthPerson(req, metadata=people_metadata)
        return res.first_name + " " + res.last_name
    except grpc.RpcError as e:
        return username


def get_username_or_legacy(filename):
    """
    Checks whether the POST Parameter 'legacyuser' is set and if so, returns '__legacy__',
    otherwise returns the real username
    :param filename: filename of current exam
    :return: username or '__legacy__' or None if legacy was requested but is not admin
    """
    if 'legacyuser' in request.form and 'legacyuser' != '0' and has_admin_rights_for_exam(auth.username(), filename):
        return '__legacy__'
    return auth.username()


admin_cache = {}
admin_cache_last_update = 0


def has_admin_rights(username):
    """
    Check whether the given user should have global admin rights.
    :param username: the user to check
    :return: True iff the user has global admin rights
    """
    global admin_cache, admin_cache_last_update
    if time.time() - admin_cache_last_update > 60:
        admin_cache = {}
    if username in admin_cache:
        return admin_cache[username]
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = people_client.GetVisPerson(req, metadata=people_metadata)
    except grpc.RpcError as e:
        print("RPC error while checking admin rights", e)
        return False
    res = any(("vorstand" == group or "cat" == group or "luk" == group) for group in res.vis_groups)
    admin_cache[username] = res
    return res


def has_admin_rights_for_any_category(username):
    """
    Check whether the given user has admin rights for some category.
    :param username: the user to check
    :return: True iff there exists some category for which the user is admin
    """
    maybe_admin = category_metadata.find({
        "admins": username
    })
    if list(maybe_admin):
        return True
    return False


def has_admin_rights_for_category(username, category):
    """
    Check whether the given user has admin rights in the given category
    and its subcategories. This corresponds to checking whether the user
    is in the list of admins of the category or one of its parent categories.
    :param username: the user to check
    :param category: the category for which to check
    :return: True iff the user has category admin rights
    """
    if has_admin_rights(username):
        return True

    def check(cat):
        admins = category_metadata.find_one({
            "category": cat
        }, {
            "admins": 1
        })["admins"]
        if username in admins:
            return True

        parts = cat.split("/")
        if len(parts) > 1:
            return check("/".join(parts[:-1]))
        return False

    return check(category)


def has_admin_rights_for_exam(username, filename):
    """
    Check whether the given user has admin rights for the given exam.
    :param username: the user to check
    :param filename: the exam for which to check
    :return: True iff the user has exam admin rights
    """
    category = exam_metadata.find_one({
        "filename": filename
    }, {"category": 1})["category"]
    return has_admin_rights_for_category(username, category)


def make_answer_section_response(oid):
    """
    Generates a json response containing all information for the given answer section.
    This includes all answers and comments to this answers.
    """
    username = auth.username()
    section = answer_sections.find_one({"_id": oid}, {
        "_id": 1,
        "filename": 1,
        "answersection": 1
    })
    if not section:
        return not_found()
    exam_admin = has_admin_rights_for_exam(auth.username(), section["filename"])
    section["oid"] = section["_id"]
    del section["_id"]
    for answer in section["answersection"]["answers"]:
        answer["oid"] = answer["_id"]
        del answer["_id"]
        answer["canEdit"] = answer["authorId"] == auth.username() or \
                            (answer["authorId"] == '__legacy__' and exam_admin)
        answer["isUpvoted"] = auth.username() in answer["upvotes"]
        answer["isDownvoted"] = auth.username() in answer["downvotes"]
        answer["upvotes"] = len(answer["upvotes"]) - len(answer["downvotes"])
        del answer["downvotes"]
        for comment in answer["comments"]:
            comment["oid"] = comment["_id"]
            del comment["_id"]
            comment["canEdit"] = comment["authorId"] == auth.username()
    section["answersection"]["answers"] = sorted(
        filter(
            lambda x: len(x["text"]) > 0 or x["canEdit"],
            section["answersection"]["answers"]
        ), key=lambda x: -x["upvotes"])
    section["answersection"]["allow_new_answer"] = len([a for a in section["answersection"]["answers"] if a["authorId"] == username]) == 0
    section["answersection"]["allow_new_legacy_answer"] = exam_admin and len([a for a in section["answersection"]["answers"] if a["authorId"] == '__legacy__']) == 0
    return success(value=section)


@app.route("/health")
def test():
    return "Server is running"


@app.route("/")
@app.route("/uploadpdf")
@app.route("/categorize")
@app.route("/feedback")
@auth.login_required
def index():
    return render_template("index.html")


@app.route('/exams/<argument>')
@app.route('/user/<argument>')
@auth.login_required
def index_with_argument(argument):
    return index()


@app.route('/resolve/<filename>')
@auth.login_required
def resolve(filename):
    result = get_resolved_filename(filename)
    if not result:
        return not_found()
    return redirect('/exams/' + result)


@app.errorhandler(404)
def not_found(e):
    return "404 page not found", 404


@app.route("/favicon.ico")
def favicon():
    return send_from_directory('.', 'favicon.ico')


def allowed_exam_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in EXAM_ALLOWED_EXTENSIONS


def allowed_img_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in IMAGE_ALLOWED_EXTENSIONS


def is_file_in_minio(directory, name):
    """
    Check whether the file exists in minio
    :param directory: directory to check
    :param name: filename
    """
    try:
        minio_client.stat_object(minio_bucket, directory + name)
        return True
    except NoSuchKey:
        return False


@app.route("/api/me")
@auth.login_required
def get_user():
    """
    Returns information about the currently logged in user.
    """
    username = auth.username()
    admin = has_admin_rights(username)
    admincat = has_admin_rights_for_any_category(username)
    return success(
        adminrights=admin,
        adminrightscat=admin or admincat,
        username=auth.username(),
        displayname=get_real_name(auth.username())
    )


########################################################################################################################
# EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS # EXAMS#
########################################################################################################################


@app.route("/api/listexams")
@auth.login_required
def list_exams():
    """
    Returns a list of all exams
    """
    return success(value=[obj.object_name for obj in minio_client.list_objects(minio_bucket, EXAM_DIR)])


@app.route("/api/exam/<filename>/cuts")
@auth.login_required
def get_cuts(filename):
    """
    Returns all cuts for the file 'filename'.
    Dictionary of 'pageNum', each a list of ('relHeight', '_id') of the cuts for the page sorted by relHeight.
    """
    results = answer_sections.find({
        "filename": filename
    }, {
        "_id": 1,
        "relHeight": 1,
        "pageNum": 1,
        "cutVersion": 1,
    })
    pages = {}
    for cut in results:
        pages.setdefault(cut["pageNum"], []).append({
            "relHeight": cut["relHeight"],
            "oid": str(cut["_id"]),
            "cutVersion": cut["cutVersion"]
        })
    for page in pages.values():
        page.sort(key=lambda x: float(x["relHeight"]))
    return success(value=pages)


@app.route("/api/exam/<filename>/answersection/<oid>")
@auth.login_required
def get_answer_section(filename, oid):
    """
    Returns the answersection with the given oid.
    Dictionary of 'oid' and 'answersection'.
    """
    return make_answer_section_response(ObjectId(oid))


@app.route("/api/exam/<filename>/cutversions")
@auth.login_required
def get_answer_section_cutversions(filename):
    results = answer_sections.find({
        "filename": filename
    }, {
        "_id": 1,
        "cutVersion": 1
    })
    res = {}
    for cut in results:
        res[str(cut["_id"])] = cut["cutVersion"]
    return success(value=res)


@app.route("/api/exam/<filename>/newanswersection", methods=["POST"])
@auth.login_required
@require_exam_admin
def new_answer_section(filename):
    """
    Adds a new answersection to 'filename'.
    POST Parameters 'pageNum' and 'relHeight'.
    """
    username = auth.username()
    page_num = request.form.get("pageNum", None)
    rel_height = request.form.get("relHeight", None)
    if page_num is None or rel_height is None:
        return not_possible("Missing argument")
    rel_height = float(rel_height)
    # it would be nice to check that page_num is valid, but then we
    # would have to load the pdf to know how many pages it has.
    # Just trust the client...
    if not 0 <= rel_height <= 1:
        return not_possible("Invalid relative height")
    result = answer_sections.find_one({
        "pageNum": page_num,
        "filename": filename,
        "relHeight": rel_height,
        "cutVersion": 1,
    })
    if result:
        return not_possible("Answer section already exists")
    new_doc = {
        "filename": filename,
        "pageNum": page_num,
        "relHeight": rel_height,
        "answersection": {"answers": [], "asker": username, "askerDisplayName": get_real_name(username)},
        "_id": ObjectId()
    }
    answer_sections.insert_one(new_doc)
    return success(value=new_doc)


@app.route("/api/exam/<filename>/removeanswersection", methods=["POST"])
@auth.login_required
@require_exam_admin
def remove_answer_section(filename):
    """
    Delete the answersection with the given oid.
    POST Parameter 'oid'.
    """
    oid_str = request.form.get("oid", None)
    if oid_str is None:
        return not_possible("Missing argument")
    oid = ObjectId(oid_str)
    section = answer_sections.find_one({
        "_id": oid
    }, {
        "answersection": 1
    })
    if section:
        for answer in section["answersection"]["answers"]:
            remove_answer(answer["_id"])
    if answer_sections.delete_one({"_id": oid}).deleted_count > 0:
        return success()
    else:
        return not_possible("Could not delete answersection")


@app.route("/api/exam/<filename>/setlike/<sectionoid>/<answeroid>", methods=["POST"])
@auth.login_required
def set_like(filename, sectionoid, answeroid):
    """
    Sets the like for the given answer in the given section.
    POST Parameter 'like' is -1/0/1.
    """
    answer_section_oid = ObjectId(sectionoid)
    answer_oid = ObjectId(answeroid)
    username = auth.username()
    like = int(request.form.get("like", "0"))
    section = answer_sections.find_one({
        "answersection.answers._id": answer_oid
    }, {
        "answersection.answers.$": 1
    })
    old_like = 0
    if username in section["answersection"]["answers"][0]["upvotes"]:
        old_like = 1
    elif username in section["answersection"]["answers"][0]["downvotes"]:
        old_like = -1
    if like == 1:
        answer_sections.update_one({
            'answersection.answers._id': answer_oid
        }, {'$addToSet': {
            'answersection.answers.$.upvotes': username
        }, '$pull': {
            'answersection.answers.$.downvotes': username
        }, '$inc': {
            "cutVersion": 1
        }})
    elif like == -1:
        answer_sections.update_one({
            'answersection.answers._id': answer_oid
        }, {'$addToSet': {
            'answersection.answers.$.downvotes': username
        }, '$pull': {
            'answersection.answers.$.upvotes': username
        }, '$inc': {
            "cutVersion": 1
        }})
    else:
        like = 0
        answer_sections.update_one({
            'answersection.answers._id': answer_oid
        }, {'$pull': {
            'answersection.answers.$.upvotes': username,
            'answersection.answers.$.downvotes': username
        }, '$inc': {
            "cutVersion": 1
        }})
    adjust_user_score(section["answersection"]["answers"][0]["authorId"], like - old_like)
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/addanswer/<sectionoid>", methods=["POST"])
@auth.login_required
def add_answer(filename, sectionoid):
    """
    Adds an empty answer for the given section for the current user.
    This enforces that each user can only have one answer.
    POST Parameter 'legacyuser' if the answer should be posted by the special user '__legacy__', is 0/1
    """
    answer_section_oid = ObjectId(sectionoid)

    username = get_username_or_legacy(filename)
    if not username:
        return not_allowed()
    maybe_answer = answer_sections.find_one({
        "_id": answer_section_oid,
        "answersection.answers.authorId": username
    }, {
        "answersection.answers.$": 1
    })
    if maybe_answer:
        return not_possible("Answer already exists")
    answer = {
        "_id": ObjectId(),
        "authorId": username,
        "authorDisplayName": get_real_name(username),
        "text": "",
        "comments": [],
        "upvotes": [username],
        "downvotes": [],
        "time": datetime.now(timezone.utc).isoformat()
    }
    answer_sections.update_one({
        "_id": answer_section_oid
    }, {'$push': {
        "answersection.answers": answer
    }, '$inc': {
        "cutVersion": 1
    }})
    adjust_user_score(username, 1)
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/setanswer/<sectionoid>", methods=["POST"])
@auth.login_required
def set_answer(filename, sectionoid):
    """
    Sets the answer for the given section for the current user.
    This enforces that each user can only have one answer.
    POST Parameter 'text'.
    POST Parameter 'legacyuser' if the answer should be posted by the special user '__legacy__', is 0/1
    """
    answer_section_oid = ObjectId(sectionoid)

    username = get_username_or_legacy(filename)
    if not username:
        return not_allowed()
    text = request.form.get("text", None)
    if text is None:
        return not_possible("Missing argument")
    maybe_answer = answer_sections.find_one({
        "_id": answer_section_oid,
        "answersection.answers.authorId": username
    }, {
        "answersection.answers.$": 1
    })
    if not maybe_answer:
        return not_possible("Answer does not yet exist")
    if not maybe_answer["answersection"]["answers"][0]["text"] and text:
        other_answers = answer_sections.find_one({
            "_id": answer_section_oid
        }, {
            "answersection.answers": 1
        })
        for other_answer in other_answers["answersection"]["answers"]:
            if other_answer["_id"] != maybe_answer["answersection"]["answers"][0]["_id"]:
                send_user_notification(
                    other_answer["authorId"],
                    NotificationType.NEW_ANSWER_TO_ANSWER,
                    username,
                    "New answer",
                    "A new answer was posted to a question you answered.",
                    "/exams/{}#{}".format(filename, maybe_answer["answersection"]["answers"][0]["_id"])
                )
    answer_sections.update_one({
        'answersection.answers._id': maybe_answer["answersection"]["answers"][0]["_id"]
    }, {"$set": {
        'answersection.answers.$.text': text
    }, '$inc': {
        "cutVersion": 1
    }})
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/removeanswer/<sectionoid>", methods=["POST"])
@auth.login_required
def remove_answer_api(filename, sectionoid):
    """
    Delete the answer for the current user for the section.
    POST Parameter 'legacyuser' if the answer should be posted by the special user '__legacy__', is 0/1
    """
    answer_section_oid = ObjectId(sectionoid)
    username = get_username_or_legacy(filename)
    if not username:
        return not_allowed()
    section = answer_sections.find_one({
        "_id": answer_section_oid,
        "answersection.answers.authorId": username
    }, {
        "answersection.answers.$._id": 1
    })
    remove_answer(ObjectId(section["answersection"]["answers"][0]["_id"]))
    return make_answer_section_response(answer_section_oid)


def remove_answer(answeroid):
    section = answer_sections.find_one({
        "answersection.answers._id": answeroid
    }, {
        "_id": 1,
        "answersection.answers.$": 1,
    })
    if not section:
        return
    adjust_user_score(section["answersection"]["answers"][0]["authorId"], len(section["answersection"]["answers"][0]["downvotes"]) - len(section["answersection"]["answers"][0]["upvotes"]))
    answer_sections.update_one({
        "_id": section["_id"]
    }, {"$pull": {
        'answersection.answers': {
            '_id': answeroid
        }
    }, '$inc': {
        "cutVersion": 1
    }})


@app.route("/api/exam/<filename>/addcomment/<sectionoid>/<answeroid>", methods=["POST"])
@auth.login_required
def add_comment(filename, sectionoid, answeroid):
    """
    Add comment to given answer.
    POST Parameter 'text'.
    """
    answer_section_oid = ObjectId(sectionoid)
    answer_oid = ObjectId(answeroid)
    username = auth.username()
    text = request.form.get("text", None)
    if not text:
        return not_possible("Missing argument")

    answer = answer_sections.find_one({
        "answersection.answers._id": answer_oid
    }, {
        "answersection.answers.$": 1,
    })["answersection"]["answers"][0]
    answer_author = answer["authorId"]
    send_user_notification(
        answer_author,
        NotificationType.NEW_COMMENT_TO_ANSWER,
        username,
        "New comment",
        "A new comment to your answer was added.\n\n{}".format(text),
        "/exams/{}#{}".format(filename, answer_oid)
    )
    for comment in answer["comments"]:
        sent_notifications = {answer_author}
        if comment["authorId"] not in sent_notifications:
            send_user_notification(
                comment["authorId"],
                NotificationType.NEW_COMMENT_TO_COMMENT,
                username,
                "New comment",
                "A new comment to an answer you commented was added.\n\n{}".format(text),
                "/exams/{}#{}".format(filename, answer_oid)
            )
            sent_notifications.add(comment["authorId"])

    comment = {
        "_id": ObjectId(),
        "text": text,
        "authorId": username,
        "authorDisplayName": get_real_name(username),
        "time": datetime.now(timezone.utc).isoformat()
    }
    answer_sections.update_one({
        "answersection.answers._id": answer_oid
    }, {
        "$push": {
            "answersection.answers.$.comments": comment
        }, '$inc': {
            "cutVersion": 1
        }
    })
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/setcomment/<sectionoid>/<answeroid>", methods=["POST"])
@auth.login_required
def set_comment(filename, sectionoid, answeroid):
    """
    Set the text for the comment with the given id.
    POST Parameter 'commentoid' and 'text'
    """
    answer_section_oid = ObjectId(sectionoid)
    answer_oid = ObjectId(answeroid)
    oid_str = request.form.get("commentoid", None)
    if not oid_str:
        return not_possible("Missing argument")
    comment_oid = ObjectId(oid_str)
    text = request.form.get("text", None)
    if text is None:
        return not_possible("Missing argument")
    username = auth.username()
    maybe_comment = answer_sections.find_one({
        'answersection.answers._id': answer_oid
    }, {
        'answersection.answers.$.comments': 1
    })
    idx = -1
    for i, comment in enumerate(maybe_comment["answersection"]["answers"][0]["comments"]):
        if comment["_id"] == comment_oid:
            idx = i
            if comment["authorId"] != username:
                return not_possible("Comment can not be edited")
    if idx < 0:
        return not_possible("Comment does not exist")
    answer_sections.update_one({
        'answersection.answers.comments._id': comment_oid
    }, {
        "$set": {
            'answersection.answers.$.comments.{}.text'.format(idx): text
        }, '$inc': {
            "cutVersion": 1
        }
    })
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/removecomment/<sectionoid>/<answeroid>", methods=["POST"])
@auth.login_required
def remove_comment(filename, sectionoid, answeroid):
    """
    Remove the comment with the given id.
    POST Parameter 'commentoid'.
    """
    answer_section_oid = ObjectId(sectionoid)
    answer_oid = ObjectId(answeroid)
    oid_str = request.form.get("commentoid", None)
    if not oid_str:
        return not_possible("Missing argument")
    comment_oid = ObjectId(oid_str)

    username = auth.username()
    maybe_comment = answer_sections.find_one({
        'answersection.answers.comments._id': comment_oid
    }, {
        'answersection.answers.comments.$': 1
    })
    if not maybe_comment:
        return not_possible("Comment does not exist")
    if maybe_comment["answersection"]["answers"][0]["comments"][0]["authorId"] != username:
        return not_possible("Comment can not be removed")
    answer_sections.update_one({
        "answersection.answers._id": answer_oid
    }, {
        "$pull": {
            "answersection.answers.$.comments": {
                "_id": comment_oid
            }
        }, '$inc': {
            "cutVersion": 1
        }
    })
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/metadata")
@auth.login_required
def get_exam_metadata(filename):
    """
    Returns all stored metadata for the given exam file
    """
    metadata = exam_metadata.find_one({
        "filename": filename
    })
    if not metadata:
        return not_found()
    metadata["canEdit"] = has_admin_rights_for_exam(auth.username(), filename)
    return success(value=metadata)


@app.route("/api/exam/<filename>/metadata", methods=["POST"])
@auth.login_required
@require_exam_admin
def set_exam_metadata_api(filename):
    """
    Sets the metadata for the given exam file
    POST Parameters are the values to set
    """
    if "category" in request.form:
        if not has_admin_rights_for_category(auth.username(), request.form["category"]):
            return not_allowed()
    set_exam_metadata(filename, request.form)
    return success()


def init_exam_metadata(filename):
    """
    Inserts new metadata for the given exam file
    :param filename: filename of the exam
    """
    exam_metadata.insert_one({
        "filename": filename
    })


def set_exam_metadata(filename, metadata):
    """
    Set the metadata for the given exam file
    :param filename: filename of the exam
    :param metadata: dictionary of values to set
    """
    whitelist = [
        "displayname",
        "category",
        "legacy_solution",
        "master_solution",
        "resolve_alias",
        "remark",
        "public",
        "print_only",
        "payment_category"
    ]
    filtered = filter_dict(metadata, whitelist)
    if "public" in filtered:
        filtered["public"] = filtered["public"] not in ["false", "0"]
    if "print_only" in filtered:
        filtered["print_only"] = filtered["print_only"] not in ["false", "0"]
    if filtered:
        exam_metadata.update_one({
            "filename": filename
        }, {"$set": filtered})


def get_resolved_filename(resolve_alias):
    result = exam_metadata.find_one({
        "resolve_alias": resolve_alias
    }, {
        "filename": 1
    })
    if result:
        return result["filename"]
    return None


@app.route("/api/exam/<filename>/remove", methods=["POST"])
@auth.login_required
@require_admin
def remove_exam(filename):
    answer_sections.delete_many({
        "filename": filename
    })
    if exam_metadata.delete_one({
        "filename": filename
    }).deleted_count > 0:
        minio_client.remove_object(minio_bucket, EXAM_DIR + filename)
        return success()
    else:
        return not_possible("Could not delete exam metadata")


########################################################################################################################
# CATEGORIES # CATEGORIES # CATEGORIES # CATEGORIES # CATEGORIES # CATEGORIES # CATEGORIES # CATEGORIES # CATEGORIES # #
########################################################################################################################

@app.route("/api/listcategories")
@auth.login_required
def list_categories():
    """
    Lists all available categories sorted by name
    """
    return success(value=list(sorted(
        map(lambda x: x["category"], category_metadata.find({}, {"category": 1}))
    )))


@app.route("/api/listcategories/onlyadmin")
@auth.login_required
def list_categories_only_admin():
    """
    Lists all available categories sorted by name filtered for admin permission by current user
    """
    username = auth.username()
    return success(value=list(sorted(
        filter(lambda x: has_admin_rights_for_category(username, x),
            map(lambda x: x["category"], category_metadata.find({}, {"category": 1}))
    ))))


@app.route("/api/listcategories/withexams")
@auth.login_required
def list_categories_with_exams():
    categories = list(sorted(
        map(lambda x: {"name": x["category"]}, category_metadata.find({}, {"category": 1})),
        key=lambda x: x["name"]
    ))
    for category in categories:
        category["exams"] = get_category_exams(category["name"])
    return success(value=categories)


@app.route("/api/listcategories/withadmins")
@auth.login_required
@require_admin
def list_categories_with_admins():
    categories = list(sorted(
        map(lambda x: {"name": x["category"], "admins": x["admins"]}, category_metadata.find({}, {"category": 1, "admins": 1})),
        key=lambda x: x["name"]
    ))
    return success(value=categories)


def enhance_exam_dictionary(exam):
    """
    Enhance an exam dictionary with useful metadata
    :param exam: The exam dictionary to enhance
    """
    exam["displayname"] = exam_metadata.find_one({
        "filename": exam["filename"]
    }, {"displayname": 1})["displayname"]
    return exam


def get_category_exams(category):
    """
    Returns list of exams in the given category, sorted by displayname
    :param category: name of the category
    :return: list of exams with metadata
    """
    exams = list(map(lambda x: enhance_exam_dictionary({"filename": x["filename"]}), exam_metadata.find({
        "category": category
    }, {
        "filename": 1
    })))
    exams.sort(key=lambda x: x["displayname"])
    return exams


@app.route("/api/category/add", methods=["POST"])
@auth.login_required
@require_admin
def add_category():
    """
    Add a new category.
    POST Parameter 'category'
    """
    category = request.form.get("category")
    if not category:
        return not_possible("Missing argument")
    maybe_category = category_metadata.find_one({"category": category})
    if maybe_category:
        return not_possible("Category already exists")
    category_metadata.insert_one({
        "category": category,
        "admins": []
    })
    return success()


@app.route("/api/category/remove", methods=["POST"])
@auth.login_required
@require_admin
def remove_category():
    """
    Remove a category and move all exams to the default category
    POST Parameter 'category'
    """
    # TODO delete child categories
    category = request.form.get("category")
    if not category:
        return not_possible("Missing argument")
    if category == "default":
        return not_possible("Can not delete default category")
    exams = get_category_exams(category)
    for exam in exams:
        set_exam_metadata(exam["filename"], {"category": "default"})
    if category_metadata.delete_one({"category": category}).deleted_count > 0:
        return success()
    else:
        return not_possible("Could not delete category")


@app.route("/api/category/addadmin", methods=["POST"])
@auth.login_required
@require_admin
def add_category_admin():
    """
    Add an admin to a category.
    POST Parameter 'category'
    POST Parameter 'username'
    """
    category = request.form.get("category")
    username = request.form.get("username")
    if not category or not username:
        return not_possible("Missing argument")
    category_metadata.update_one({
        "category": category
    }, {
        "$addToSet": {
            "admins": username
        }
    })
    return success()


@app.route("/api/category/removeadmin", methods=["POST"])
@auth.login_required
@require_admin
def remove_category_admin():
    """
    Remove an admin from a category.
    POST Parameter 'category'
    POST Parameter 'username'
    """
    category = request.form.get("category")
    username = request.form.get("username")
    if not category or not username:
        return not_possible("Missing argument")
    category_metadata.update_one({
        "category": category
    }, {
        "$pull": {
            "admins": username
        }
    })
    return success()


@app.route("/api/category/list")
@auth.login_required
def list_category():
    """
    Lists all exams belonging to the category
    GET Parameter 'category'
    """
    category = request.args.get("category")
    if not category:
        return not_possible("Missing argument")
    return success(value=get_category_exams(category))


@app.route("/api/category/metadata")
@auth.login_required
def get_category_metadata():
    """
    Returns all stored metadata for the given category
    GET Paramter 'category'
    """
    category = request.args.get("category")
    if not category:
        return not_possible("Missing argument")
    metadata = category_metadata.find_one({
        "category": category.lower()
    })
    if not metadata:
        return not_found()
    return success(value=metadata)


@app.route("/api/category/metadata", methods=["POST"])
@auth.login_required
@require_admin
def set_category_metadata_api():
    """
    Sets the metadata for the given category
    POST Parameter 'category'
    POST Parameters are the values to set
    """
    category = request.form.get("category")
    if not category:
        return not_possible("Missing argument")
    set_category_metadata(category, request.form)
    return success()


def set_category_metadata(category, metadata):
    """
    Set the metadata for the given category
    :param category: name of category
    :param metadata: dictionary of values to set
    """
    whitelist = [
        "admins",
        "semester",
        "form",
        "permission",
        "offered_in",
    ]
    filtered = filter_dict(metadata, whitelist)
    if filtered:
        category_metadata.update_one({
            "category": category.lower()
        }, {"$set": filtered})


########################################################################################################################
# IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # IMAGES # #
########################################################################################################################

def check_image_author(filename):
    author = image_metadata.find_one({
        "filename": filename
    }, {
        "authorId": 1
    })
    if not author or author["authorId"] != auth.username():
        return False
    return True


@app.route("/api/image/list")
@auth.login_required
def list_images():
    """
    Lists the images for the current user
    """
    username = auth.username()
    results = image_metadata.find({
        "authorId": username
    }, {
        "filename": 1
    })
    return success(value=[x["filename"] for x in results])


@app.route("/api/image/<filename>/remove", methods=['POST'])
@auth.login_required
def remove_image(filename):
    """
    Delete the image with the given filename
    """
    if not check_image_author(filename):
        return not_allowed()
    if image_metadata.delete_one({"filename": filename}).deleted_count > 0:
        minio_client.remove_object(minio_bucket, IMAGE_DIR + filename)
        return success()
    else:
        return not_possible("Could not delete image metadata")


@app.route("/api/image/<filename>/metadata")
@auth.login_required
def get_image_metadata(filename):
    """
    Returns all stored metadata for the given image file
    """
    metadata = image_metadata.find_one({
        "filename": filename
    })
    if not metadata:
        return not_found()
    return success(value=metadata)


def init_image_metadata(filename):
    """
    Inserts new metadata for the given image file
    :param filename: filename of the image
    """
    image_metadata.insert_one({
        "filename": filename
    })


@app.route("/api/image/<filename>/metadata", methods=['POST'])
@auth.login_required
def set_image_metadata_api(filename):
    """
    Set the metadata for the given image file
    POST Parameters are the values to set
    """
    if not check_image_author(filename):
        return not_allowed()
    set_image_metadata(filename, request.form)
    return success()


def set_image_metadata(filename, metadata):
    """
    Set the metadata for the given image fileal

    :param filename: filename of the image
    :param metadata: dictionary of values to set
    """
    whitelist = ["authorId", "displayname"]
    filtered = filter_dict(metadata, whitelist)
    if filtered:
        image_metadata.update_one({
            "filename": filename
        }, {"$set": filtered})


########################################################################################################################
# USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS # USERS#
########################################################################################################################

@app.route("/api/userinfo/<username>")
@auth.login_required
def get_user_info(username):
    init_user_data_if_not_found(username)
    user = user_data.find_one({
        "username": username
    }, {
        "username": 1,
        "displayName": 1,
        "score": 1,
    })
    if not user:
        return not_found()
    return success(value=user)


def init_user_data_if_not_found(username):
    user = user_data.find_one({
        "username": username
    })
    if user:
        return
    user_data.insert_one({
        "username": username,
        "displayName": get_real_name(username),
        "score": 0,
        "notifications": [],
        "enabled_notifications": [
            NotificationType.NEW_COMMENT_TO_ANSWER.value,
            NotificationType.NEW_ANSWER_TO_ANSWER.value,
        ],
    })


def adjust_user_score(username, score):
    init_user_data_if_not_found(username)
    user_data.update_one({
        "username": username
    }, {
        "$inc": {
            "score": score
        }
    })


def is_notification_enabled(username, type):
    init_user_data_if_not_found(username)
    enabled = user_data.find_one({
        "username": username
    }, {
        "enabled_notifications": 1
    })["enabled_notifications"]
    return type.value in enabled


@app.route("/api/notifications/getenabled")
@auth.login_required
def get_notification_enabled():
    username = auth.username()
    init_user_data_if_not_found(username)
    enabled = user_data.find_one({
        "username": username
    }, {
        "enabled_notifications": 1
    })
    if not enabled:
        return not_found()
    return success(value=enabled["enabled_notifications"])


@app.route("/api/notifications/setenabled", methods=["POST"])
@auth.login_required
def set_notification_enabled():
    username = auth.username()
    init_user_data_if_not_found(username)
    enabled = request.form.get("enabled", "0") != "0"
    type = int(request.form.get("type", -1))
    if type < 1 or type > len(NotificationType.__members__):
        return not_possible("type not valid")
    user_data.update_one({
        "username": username
    }, {
        ("$addToSet" if enabled else "$pull"): {
            "enabled_notifications": type
        }
    })
    return success()


def get_notifications(only_unread):
    username = auth.username()
    query = {
        "username": username
    }
    notifications = user_data.find_one(query, {
        "notifications": 1
    })
    if not notifications:
        return []
    notifications = notifications["notifications"]
    if only_unread:
        notifications = list(filter(lambda x: x["read"] == False, notifications))
    for notification in notifications:
        notification["oid"] = notification["_id"]
        del notification["_id"]
    return notifications


@app.route("/api/notifications/unread")
@auth.login_required
def get_notifications_unread():
    return success(value=get_notifications(True))


@app.route("/api/notifications/unreadcount")
@auth.login_required
def get_notifications_unread_count():
    return success(value=len(get_notifications(True)))


@app.route("/api/notifications/all")
@auth.login_required
def get_notifications_all():
    return success(value=get_notifications(False))


@app.route("/api/notifications/setread", methods=["POST"])
@auth.login_required
def set_notification_read():
    username = auth.username()
    read = request.form.get("read", "0") != "0"
    user_data.update_one({
        "username": username,
        "notifications._id": ObjectId(request.form.get("notificationoid", ""))
    }, {
        "$set": {
            "notifications.$.read": read
        }
    })
    return success()


def send_user_notification(username, type, sender, title, message, link):
    if username == sender:
        return
    if not is_notification_enabled(username, type):
        return
    init_user_data_if_not_found(username)
    notification = {
        "_id": ObjectId(),
        "receiver": username,
        "type": type.value,
        "time": datetime.now(timezone.utc).isoformat(),
        "sender": sender,
        "senderDisplayName": get_real_name(sender),
        "title": title,
        "message": message,
        "link": link,
        "read": False,
    }
    user_data.update_one({
        "username": username
    }, {
        "$push": {
            "notifications": notification
        }
    })


########################################################################################################################
# FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBAC#
########################################################################################################################

@app.route("/api/feedback/submit", methods=['POST'])
@auth.login_required
def submit_feedback():
    text = request.form["text"]
    username = auth.username()
    feedback.insert_one({
        "_id": ObjectId(),
        "text": text,
        "authorId": username,
        "authorDisplayName": get_real_name(username),
        "time": datetime.now(timezone.utc).isoformat(),
        "read": False,
        "done": False,
    })
    return success()


@app.route("/api/feedback/list")
@auth.login_required
@require_admin
def get_feedback():
    results = feedback.find()

    def transform(fb):
        fb["oid"] = fb["_id"]
        del fb["_id"]
        return fb
    return success(value=[transform(res) for res in results])


@app.route("/api/feedback/<feedbackid>/flags", methods=['POST'])
@auth.login_required
@require_admin
def set_feedback_flags(feedbackid):
    update = {}
    for key in ["read", "done"]:
        if key in request.form:
            update[key] = request.form[key] != "0"
    feedback.update_one({
        "_id": ObjectId(feedbackid)
    }, {"$set": update})
    return success()


########################################################################################################################
# FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES # FILES#
########################################################################################################################

def generate_filename(length, directory, extension):
    """
    Generates a random filename
    :param length: length of the generated filename
    :param directory: directory to check for file existance
    :param extension: extension of the filename
    """
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    res = ""
    while len(res) < length:
        res += random.choice(chars)
    if is_file_in_minio(directory, res + extension):
        return generate_filename(length, directory, extension)
    return res + extension


@app.route("/api/uploadpdf", methods=['POST'])
@auth.login_required
def uploadpdf():
    """
    Allows uploading a new pdf.
    File as 'file'.
    Optional POST Parameter 'displayname' with displayname to use.
    """
    username = auth.username()

    file = request.files.get('file', None)
    orig_filename = file.filename
    if not file or not orig_filename or not allowed_exam_file(orig_filename):
        return not_possible("No valid file found")

    category = request.form.get("category", "") or "default"
    maybe_category = category_metadata.find_one({"category": category})
    if not maybe_category:
        return not_possible("Category does not exist")
    if not has_admin_rights_for_category(username, category):
        return not_possible("No permission for category")

    filename = generate_filename(8, EXAM_DIR, ".pdf")
    if is_file_in_minio(EXAM_DIR, filename):
        # This should not happen!
        return not_possible("File already exists")

    temp_file_path = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename)
    file.save(temp_file_path)
    minio_client.fput_object(minio_bucket, EXAM_DIR + filename, temp_file_path)
    os.remove(temp_file_path)

    init_exam_metadata(filename)
    displayname = request.form.get("displayname", "") or orig_filename
    new_metadata = {"category": category, "displayname": displayname}
    if "_HS" in orig_filename or "_FS" in orig_filename:
        new_metadata["resolve_alias"] = orig_filename
    set_exam_metadata(filename, new_metadata)
    return success(href="/exams/" + filename)


@app.route("/api/uploadimg", methods=['POST'])
@auth.login_required
def uploadimg():
    """
    Allows uploading an image.
    """
    file = request.files.get('file', None)
    if not file or not file.filename or not allowed_img_file(file.filename):
        return not_possible("No valid file found")
    filename = generate_filename(8, IMAGE_DIR, "." + file.filename.split(".")[-1])
    if is_file_in_minio(EXAM_DIR, filename):
        # This should not happen!
        return not_possible("File already exists")
    temp_file_path = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename)
    file.save(temp_file_path)
    minio_client.fput_object(minio_bucket, IMAGE_DIR + filename, temp_file_path)
    init_image_metadata(filename)
    set_image_metadata(filename, {"authorId": auth.username(), "displayname": file.filename})
    return success(filename=filename)


@app.route("/api/pdf/<filename>")
@auth.login_required
def pdf(filename):
    """
    Get the pdf for the filename
    """
    metadata = exam_metadata.find_one({
        "filename": filename
    }, {
        "public": 1,
        "print_only": 1,
        "payment_category": 1,
    })
    username = auth.username()
    if metadata.get("print_only", True) and not has_admin_rights(username):
        return not_allowed()
    if not metadata.get("public", False) and not has_admin_rights_for_exam(username, filename):
        return not_allowed()
    # TODO check payment category
    try:
        data = minio_client.get_object(minio_bucket, EXAM_DIR + filename)
        return send_file(data, mimetype="application/pdf")
    except NoSuchKey as n:
        # move objects still in the root to the correct folder
        # a previous version of the app stored the exams in the root
        if is_file_in_minio("", filename):
            minio_client.copy_object(minio_bucket, EXAM_DIR + filename, filename)
            minio_client.remove_object(minio_bucket, filename)
        return not_found()


@app.route("/api/printpdf/<filename>", methods=["POST"])
@auth.login_required
def print_pdf(filename):
    """
    Print the pdf
    :param filename: pdf to print
    """
    metadata = exam_metadata.find_one({
        "filename": filename
    }, {
        "public": 1,
        "payment_category": 1,
    })
    username = auth.username()
    if not metadata.get("public", False) and not has_admin_rights_for_exam(username, filename):
        return not_allowed()
    # TODO check payment category
    if 'password' not in request.form:
        return not_allowed()
    try:
        pdfpath = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename)
        minio_client.fget_object(minio_bucket, EXAM_DIR + filename, pdfpath)
        return_code = ethprint.start_job(username, request.form['password'], filename, pdfpath)
        if return_code:
            return not_possible("Could not connect to the printer. Please check your password and try again.")
    except NoSuchKey as n:
        return not_found()
    except Exception:
        pass
    return success()


@app.route("/api/img/<filename>")
@auth.login_required
def image(filename):
    """
    Get the image for the filename
    """
    try:
        data = minio_client.get_object(minio_bucket, IMAGE_DIR + filename)
        return send_file(data, IMAGE_MIME_TYPES[filename.split(".")[-1]])
    except NoSuchKey as n:
        return not_found()


@app.errorhandler(Exception)
def unhandled_exception(e):
    print('Unhandled Exception', e, traceback.format_exc(), file=sys.stderr)
    return "Sadly, we experienced an internal Error!", 500


# we perform migrations only now so all functions are available
dbmigrations.migrate(mongo_db)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=80)
