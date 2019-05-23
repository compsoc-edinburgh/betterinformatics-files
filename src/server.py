import sys
from flask import Flask, g, request, redirect, url_for, send_from_directory, jsonify, Response
from flask_httpauth import HTTPBasicAuth
import json
from pymongo import MongoClient
from functools import wraps
from flask import send_file, send_from_directory, render_template
from minio import Minio
from minio.error import ResponseError, BucketAlreadyExists, BucketAlreadyOwnedByYou, NoSuchKey
from bson.objectid import ObjectId

from datetime import datetime, timezone, timedelta
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
import legacy_importer

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
PRINTONLY_DIR = 'printonly/'
SOLUTION_DIR = 'solutions/'
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
PDF_DIR = {
    'exam': EXAM_DIR,
    'payment_exam': EXAM_DIR,
    'printonly': PRINTONLY_DIR,
    'solution': SOLUTION_DIR,
}
EXAM_METADATA = [
    "displayname",
    "category",
    "examtype",
    "legacy_solution",
    "master_solution",
    "resolve_alias",
    "remark",
    "import_claim",
    "import_claim_displayname",
    "import_claim_time",
    "public",
    "finished_cuts",
    "finished_wiki_transfer",
    "payment_category",
    "has_printonly",
    "has_solution",
    "solution_printonly",
    "is_payment_exam",
    "payment_uploader",
    "payment_uploader_displayname",
    "payment_exam_checked",
    "count_cuts",
    "count_answers",
    "count_answered",
]
EXAM_METADATA_INTERNAL = [
    "import_claim",
    "import_claim_displayname",
    "import_claim_time",
    "has_printonly",
    "has_solution",
    "is_payment_exam",
    "payment_uploader",
    "payment_uploader_displayname",
    "payment_exam_checked",
    "count_cuts",
    "count_answers",
    "count_answered",
]
CATEGORY_METADATA = [
    "semester",
    "form",
    "permission",
    "remark",
    "has_payments",
    "more_exams_link",
]
CATEGORY_SLUG_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

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
meta_category = mongo_db.metacategory
exam_metadata = mongo_db.exammetadata
image_metadata = mongo_db.imagemetadata
payments = mongo_db.payments
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


def parse_iso_datetime(strval):
    return datetime.strptime(strval.replace("+00:00", "+0000"), '%Y-%m-%dT%H:%M:%S.%f%z')


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


user_cache = {}
user_cache_last_update = 0


def check_user_cache():
    global user_cache, user_cache_last_update
    if False and time.time() - user_cache_last_update > 60:
        print("Clear user cache", file=sys.stderr)
        user_cache = {}
        user_cache_last_update = time.time()


@auth.verify_password
def verify_pw(username, password):
    if not username or not password:
        return False
    check_user_cache()
    if user_cache.get((username, password)):
        print("Login from cache", file=sys.stderr)
        return True
    print("Login cache miss", file=sys.stderr)
    req = people_pb2.AuthPersonRequest(
        password=password, username=username)
    try:
        res = people_client.AuthEthPerson(req, metadata=people_metadata, timeout=3)
        if res.ok:
            user_cache[(username, password)] = True
            return True
    except grpc.RpcError as e:
        # print("Verify Password throws:", e, file=sys.stderr)
        pass
    try:
        res = people_client.AuthVisPerson(req, metadata=people_metadata, timeout=3)
        if res.ok:
            user_cache[(username, password)] = True
            return True
    except grpc.RpcError as e:
        # print("Verify Password throws:", e, file=sys.stderr)
        pass
    return False


def get_real_name(username):
    if username == '__legacy__':
        return "Old VISki Solution"
    req = people_pb2.GetPersonRequest(username=username)
    try:
        res = people_client.GetEthPerson(req, metadata=people_metadata)
        return res.first_name + " " + res.last_name
    except grpc.RpcError as e:
        pass
    try:
        res = people_client.GetVisPerson(req, metadata=people_metadata)
        return res.first_name + " " + res.last_name
    except grpc.RpcError as e:
        pass
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
admin_any_category_cache = {}
admin_category_cache = {}
admin_cache_last_update = 0


def check_admin_cache():
    global admin_cache, admin_any_category_cache, admin_category_cache, admin_cache_last_update
    if time.time() - admin_cache_last_update > 60:
        print("Clear admin cache", file=sys.stderr)
        admin_cache = {}
        admin_any_category_cache = {}
        admin_category_cache = {}
        admin_cache_last_update = time.time()


def has_admin_rights(username):
    """
    Check whether the given user should have global admin rights.
    :param username: the user to check
    :return: True iff the user has global admin rights
    """
    check_admin_cache()
    if username in admin_cache:
        return admin_cache[username]
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = people_client.GetVisPerson(req, metadata=people_metadata)
    except grpc.RpcError as e:
        # print("RPC error while checking admin rights", e)
        return False
    res = any(("vorstand" == group or "cat" == group or "luk" == group or "serviceaccounts" == group) for group in res.vis_groups)
    admin_cache[username] = res
    return res


def has_admin_rights_for_any_category(username):
    """
    Check whether the given user has admin rights for some category.
    :param username: the user to check
    :return: True iff there exists some category for which the user is admin
    """
    check_admin_cache()
    if username in admin_any_category_cache:
        return admin_any_category_cache[username]
    maybe_admin = category_metadata.find({
        "admins": username
    })
    res = bool(list(maybe_admin))
    admin_any_category_cache[username] = res
    return res


def has_admin_rights_for_category(username, category):
    """
    Check whether the given user has admin rights in the given category.
    :param username: the user to check
    :param category: the category for which to check
    :return: True iff the user has category admin rights
    """
    if has_admin_rights(username):
        return True

    check_admin_cache()
    if (username, category) in admin_category_cache:
        return admin_category_cache[(username, category)]

    admins = category_metadata.find_one({
        "category": category
    }, {
        "admins": 1
    })["admins"]
    res = username in admins
    admin_category_cache[(username, category)] = res
    return res


def has_admin_rights_for_exam(username, filename):
    """
    Check whether the given user has admin rights for the given exam.
    :param username: the user to check
    :param filename: the exam for which to check
    :return: True iff the user has exam admin rights
    """
    examinfo = exam_metadata.find_one({
        "filename": filename
    }, {"category": 1})
    if not examinfo:
        return False
    category = examinfo["category"]
    return has_admin_rights_for_category(username, category)


def can_view_exam(username, filename, metadata=None):
    """
    Check whether a user is allowed to look at an exam
    :param username: user to check
    :param filename: exam to check
    """
    if not metadata:
        metadata = exam_metadata.find_one({
            "filename": filename
        })
    if has_admin_rights_for_category(username, metadata.get("category")):
        return True
    if not metadata.get("public"):
        return False
    if metadata.get("payment_category") and not has_payed(username, metadata.get("payment_category")):
        return False
    return True


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
@app.route("/submittranscript")
@app.route("/feedback")
@app.route("/scoreboard")
@app.route("/importqueue")
@auth.login_required
def index():
    return render_template("index.html")


@app.route('/exams/<argument>')
@app.route('/user/<argument>')
@app.route('/category/<argument>')
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


@app.route('/legacy/transformwiki/<examname>')
def legacy_transform_wiki(examname):
    return Response(legacy_importer.transform_wiki(examname), mimetype='text/plain')


@app.errorhandler(404)
def not_found_handler(e):
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


def category_exists(category):
    """
    Check whether the given category exists.
    :param category: Name of the category
    """
    maybe_category = category_metadata.find_one({"category": category})
    return bool(maybe_category)


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


@app.route("/api/listimportexams")
@auth.login_required
def list_import_exams():
    username = auth.username()
    conditions = [
        {"finished_cuts": False},
        {"finished_wiki_transfer": False},
        {"finished_cuts": None},
        {"finished_wiki_transfer": None},
    ]
    if request.args.get("includehidden", "0") != "0":
        conditions.append({"public": False})
        conditions.append({"public": None})
    exams = exam_metadata.find({
        "$or": conditions
    }, {
        "filename": 1,
        "displayname": 1,
        "category": 1,
        "remark": 1,
        "import_claim": 1,
        "import_claim_displayname": 1,
        "import_claim_time": 1,
        "public": 1,
        "finished_cuts": 1,
        "finished_wiki_transfer": 1,
    })

    catres = {}

    def check(ex):
        cat = ex["category"]
        if cat not in catres:
            catres[cat] = has_admin_rights_for_category(username, cat)
        return catres[cat]

    if has_admin_rights(username):
        exams = list(exams)
    else:
        exams = [exam for exam in exams if check(exam)]
    return success(value=list(sorted(exams, key=lambda x: (x["category"], x["displayname"]))))


@app.route("/api/listpaymentcheckexams")
@auth.login_required
@require_admin
def list_payment_check_exams():
    exams = exam_metadata.find({
        "is_payment_exam": True,
        "payment_exam_checked": False,
    }, {
        "filename": 1,
        "displayname": 1,
        "category": 1,
        "payment_uploader": 1,
        "payment_uploader_displayname": 1,
    })
    return success(value=list(sorted(exams, key=lambda x: (x["category"], x["displayname"]))))


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


@app.route("/api/exam/<filename>/newanswersection", methods=['POST'])
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
    })
    if result:
        return not_possible("Answer section already exists")
    new_doc = {
        "filename": filename,
        "pageNum": page_num,
        "relHeight": rel_height,
        "cutVersion": 1,
        "answersection": {"answers": [], "asker": username, "askerDisplayName": get_real_name(username)},
        "_id": ObjectId()
    }
    answer_sections.insert_one(new_doc)
    adjust_exam_count({
        "filename": filename
    }, count_cuts=1)
    adjust_user_score(username, "score_cuts", 1)
    return success(value=new_doc)


@app.route("/api/exam/<filename>/removeanswersection", methods=['POST'])
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
    if section and section["answersection"] and section["answersection"]["asker"]:
        adjust_user_score(section["answersection"]["asker"], "score_cuts", -1)
    adjust_exam_count({
        "filename": filename
    }, count_cuts=-1)
    if answer_sections.delete_one({"_id": oid}).deleted_count > 0:
        return success()
    else:
        return not_possible("Could not delete answersection")


@app.route("/api/exam/<filename>/setlike/<sectionoid>/<answeroid>", methods=['POST'])
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
    adjust_user_score(section["answersection"]["answers"][0]["authorId"], "score", like - old_like)
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/addanswer/<sectionoid>", methods=['POST'])
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
    adjust_user_score(username, "score", 1)
    adjust_user_score(username, "score_answers", 1)
    adjust_exam_count({
        "_id": answer_section_oid
    }, count_answers=1, count_answered=lambda x: 1 if x == 1 else 0)

    if username == "__legacy__":
        adjust_user_score(auth.username(), "score_legacy", 1)
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/setanswer/<sectionoid>", methods=['POST'])
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


@app.route("/api/exam/<filename>/removeanswer/<sectionoid>", methods=['POST'])
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
    adjust_user_score(section["answersection"]["answers"][0]["authorId"], "score", len(section["answersection"]["answers"][0]["downvotes"]) - len(section["answersection"]["answers"][0]["upvotes"]))
    adjust_user_score(section["answersection"]["answers"][0]["authorId"], "score_answers", -1)
    for comment in section["answersection"]["answers"][0]["comments"]:
        adjust_user_score(comment["authorId"], "score_comments", -1)
    adjust_exam_count({
        "answersection.answers._id": answeroid
    }, count_answers=-1, count_answered=lambda x: -1 if x == 1 else 0)
    answer_sections.update_one({
        "_id": section["_id"]
    }, {"$pull": {
        'answersection.answers': {
            '_id': answeroid
        }
    }, '$inc': {
        "cutVersion": 1
    }})


@app.route("/api/exam/<filename>/addcomment/<sectionoid>/<answeroid>", methods=['POST'])
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
    adjust_user_score(username, "score_comments", 1)
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/setcomment/<sectionoid>/<answeroid>", methods=['POST'])
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


@app.route("/api/exam/<filename>/removecomment/<sectionoid>/<answeroid>", methods=['POST'])
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
    adjust_user_score(maybe_comment["answersection"]["answers"][0]["comments"][0]["authorId"], "score_comments", -1)
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/claim", methods=['POST'])
@auth.login_required
@require_exam_admin
def claim_exam_api(filename):
    """
    Claims an exam for importing
    POST Parameter 'claim' is 0/1 to add/remove claim
    """
    username = auth.username()
    metadata = exam_metadata.find_one({
        "filename": filename,
    }, {
        "import_claim": 1,
        "import_claim_time": 1,
    })
    if not metadata:
        return not_found()
    claim = request.form.get("claim", "1") != "0"
    if claim:
        if metadata.get("import_claim") and metadata["import_claim"] != username:
            now = datetime.now(timezone.utc)
            then = parse_iso_datetime(metadata["import_claim_time"])
            if now - then < timedelta(hours=4):
                return not_possible("Exam is already claimed by different user")
        claim_exam(filename, username)
    else:
        if metadata["import_claim"] == username:
            release_exam_claim(filename)
        else:
            return not_possible("Exam not claimed by current user")
    return success()


def claim_exam(filename, username):
    exam_metadata.update_one({
        "filename": filename
    }, {
        "$set": {
            "import_claim": username,
            "import_claim_displayname": get_real_name(username),
            "import_claim_time": datetime.now(timezone.utc).isoformat()
        }
    })


def release_exam_claim(filename):
    exam_metadata.update_one({
        "filename": filename
    }, {
        "$set": {
            "import_claim": "",
            "import_claim_displayname": "",
            "import_claim_time": "",
        }
    })


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
    for key in EXAM_METADATA:
        if key not in metadata:
            metadata[key] = ""
    username = auth.username()
    metadata["canEdit"] = has_admin_rights_for_category(username, metadata.get("category"))
    metadata["hasPayed"] = has_payed(username, metadata.get("payment_category"))
    metadata["canView"] = can_view_exam(username, filename, metadata=metadata)
    return success(value=metadata)


@app.route("/api/exam/<filename>/metadata", methods=['POST'])
@auth.login_required
@require_exam_admin
def set_exam_metadata_api(filename):
    """
    Sets the metadata for the given exam file
    POST Parameters are the values to set
    """
    metadata = request.form.copy()
    if "category" in metadata:
        if not has_admin_rights_for_category(auth.username(), metadata["category"]):
            return not_allowed()
        if not category_exists(metadata["category"]):
            return not_possible("Category does not exist")
    if metadata.get("payment_category"):
        maybe_category = category_metadata.find_one({
            "category": metadata["payment_category"]
        }, {
            "has_payments": 1
        })
        if not maybe_category or not maybe_category.get("has_payments"):
            return not_possible("Payment Category does not exist")
    for key in EXAM_METADATA_INTERNAL:
        if key in metadata:
            del metadata[key]
    set_exam_metadata(filename, metadata)
    return success()


def init_exam_metadata(filename):
    """
    Inserts new metadata for the given exam file
    :param filename: filename of the exam
    """
    exam_metadata.insert_one({
        "filename": filename,
        "count_cuts": 0,
        "count_answers": 0,
        "count_answered": 0,
    })


def set_exam_metadata(filename, metadata):
    """
    Set the metadata for the given exam file
    :param filename: filename of the exam
    :param metadata: dictionary of values to set
    """
    filtered = filter_dict(metadata, EXAM_METADATA)
    for key in ["public", "has_printonly", "has_solution", "finished_cuts", "finished_wiki_transfer", "solution_printonly"]:
        if key in filtered:
            filtered[key] = filtered[key] not in [None, False, "", "false", "False", "0"]
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


@app.route("/api/listexamtypes")
@auth.login_required
def get_examtypes():
    types = list(exam_metadata.distinct("examtype", {}))
    return success(value=types)


@app.route("/api/exam/<filename>/markpaymentchecked", methods=['POST'])
@auth.login_required
@require_admin
def payment_exam_mark_checked(filename):
    metadata = exam_metadata.find_one({
        "filename": filename
    })
    if not metadata.get("is_payment_exam"):
        return not_possible("Exam is not a paid exam")
    if metadata.get("payment_exam_checked"):
        return not_possible("Exam was already checked")
    set_exam_metadata(filename, {
        "payment_exam_checked": True,
        "finished_wiki_transfer": True,
        "public": True,
    })
    payment = payments.find({
        "username": metadata["payment_uploader"],
        "category": metadata["payment_category"],
        "check_time": "",
    }).sort([("payment_time", -1)]).limit(1)
    payment = list(payment)
    if not payment:
        payment = payments.find({
            "username": metadata["payment_uploader"],
            "category": "__payment_all__",
            "check_time": "",
        }).sort([("payment_time", -1)]).limit(1)
        payment = list(payment)
    if payment:
        payments.update_one({
            "_id": payment[0]["_id"]
        }, {
            "$set": {
                "check_time": datetime.now(timezone.utc).isoformat(),
                "uploaded_filename": filename,
            }
        })

    return success()


@app.route("/api/exam/<filename>/remove", methods=['POST'])
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
        for dir_ in [SOLUTION_DIR, PRINTONLY_DIR]:
            if is_file_in_minio(dir_, filename):
                minio_client.remove_object(minio_bucket, dir_ + filename)
        return success()
    else:
        return not_possible("Could not delete exam metadata")


def adjust_exam_count(find, **keys):
    assert all(key in ["count_cuts", "count_answers", "count_answered"] for key in keys)
    section = answer_sections.find_one(find, {
        "filename": 1,
        "answersection.answers": 1
    })
    for key in keys:
        if not isinstance(keys[key], int):
            keys[key] = keys[key](len(section["answersection"]["answers"]))
    exam_metadata.update_one({
        "filename": section["filename"],
    }, {
        "$inc": keys
    })


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


@app.route("/api/listcategories/onlypayment")
@auth.login_required
def list_categories_only_payment():
    """
    Lists all available categories sorted by name
    """
    return success(value=list(sorted(
        map(lambda x: x["category"], category_metadata.find({
            "has_payments": True
        }, {
            "category": 1
        }))
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


@app.route("/api/listcategories/withmeta")
@auth.login_required
def list_categories_with_meta():
    categories = list(sorted(
        category_metadata.find({}, {
            "category": 1,
            "slug": 1,
        }),
        key=lambda x: x["category"]
    ))
    for category in categories:
        exams = get_category_exams(category["category"])
        category["examcountpublic"] = sum(x.get("public", False) for x in exams)
        category["examcountanswered"] = sum(1 for x in exams if x["count_answered"] > 0 and x.get("public", False))
        totalcuts = sum(x["count_cuts"] for x in exams if x.get("public", False))
        category["answerprogress"] = sum(x["count_answered"] for x in exams if x.get("public", False)) / totalcuts if totalcuts > 0 else 0
    return success(value=categories)


def exam_sort_key(displayname):
    end = 0
    while end + 1 < len(displayname) and displayname[-end-1:].isdigit():
        end += 1
    if end == 0:
        return (0, displayname)
    return (int(displayname[-end:]), displayname)


def get_category_exams(category):
    """
    Returns list of exams in the given category, sorted by displayname
    :param category: name of the category
    :return: list of exams with metadata
    """
    exams = list(exam_metadata.find({
        "category": category
    }, {
        "filename": 1,
        "displayname": 1,
        "category": 1,
        "examtype": 1,
        "payment_category": 1,
        "remark": 1,
        "import_claim": 1,
        "import_claim_displayname": 1,
        "import_claim_time": 1,
        "public": 1,
        "has_solution": 1,
        "has_printonly": 1,
        "finished_cuts": 1,
        "finished_wiki_transfer": 1,
        "count_cuts": 1,
        "count_answered": 1,
    }))

    for exam in exams:
        exam["canView"] = can_view_exam(auth.username(), exam["filename"], metadata=exam)
    exams.sort(key=lambda x: exam_sort_key(x["displayname"]), reverse=True)
    return exams


def create_category_slug(category):
    """
    Create a valid and unique slug for the category name
    :param category: category name
    """
    oslug = "".join(filter(lambda x: x in CATEGORY_SLUG_CHARS, category))

    def exists(aslug):
        return bool(category_metadata.find_one({"slug": aslug}))

    slug = oslug
    cnt = 0
    while exists(slug):
        cnt += 1
        slug = oslug + "_" + str(cnt)

    return slug


def resolve_category_slug(slug):
    """
    Find category name of category belonging to slug
    """
    if not slug:
        return None
    maybe = category_metadata.find_one({
        "slug": slug
    }, {
        "category": 1
    })
    if maybe:
        return maybe["category"]
    return None


@app.route("/api/category/add", methods=['POST'])
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
    if category_exists(category):
        return not_possible("Category already exists")
    slug = create_category_slug(category)
    category_metadata.insert_one({
        "category": category,
        "slug": slug,
        "admins": []
    })
    return success(slug=slug)


@app.route("/api/category/remove", methods=['POST'])
@auth.login_required
@require_admin
def remove_category():
    """
    Remove a category and move all exams to the default category
    POST Parameter 'category' or 'slug'
    """
    category = request.form.get("category") or resolve_category_slug(request.form.get("slug"))
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


@app.route("/api/category/addadmin", methods=['POST'])
@auth.login_required
@require_admin
def add_category_admin():
    """
    Add an admin to a category.
    POST Parameter 'category' or 'slug'
    POST Parameter 'username'
    """
    category = request.form.get("category") or resolve_category_slug(request.form.get("slug"))
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


@app.route("/api/category/removeadmin", methods=['POST'])
@auth.login_required
@require_admin
def remove_category_admin():
    """
    Remove an admin from a category.
    POST Parameter 'category' or 'slug'
    POST Parameter 'username'
    """
    category = request.form.get("category") or resolve_category_slug(request.form.get("slug"))
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
    GET Parameter 'category' or 'slug'
    """
    category = request.args.get("category") or resolve_category_slug(request.args.get("slug"))
    if not category:
        return not_possible("Missing argument")
    return success(value=get_category_exams(category))


@app.route("/api/category/metadata")
@auth.login_required
def get_category_metadata():
    """
    Returns all stored metadata for the given category
    GET Parameter 'category' or 'slug'
    """
    category = request.args.get("category") or resolve_category_slug(request.args.get("slug"))
    if not category:
        return not_possible("Missing argument")
    metadata = category_metadata.find_one({
        "category": category
    })
    if not metadata:
        return not_found()
    if not has_admin_rights_for_category(auth.username(), category):
        del metadata["admins"]
    for key in CATEGORY_METADATA + ['admins', 'offered_in']:
        if key not in metadata:
            metadata[key] = ""
    metadata["catadmin"] = auth.username() in metadata["admins"]
    if not metadata["admins"]:
        metadata["admins"] = []
    return success(value=metadata)


@app.route("/api/category/metadata", methods=['POST'])
@auth.login_required
@require_admin
def set_category_metadata_api():
    """
    Sets the metadata for the given category
    POST Parameter 'category' or 'slug'
    POST Parameters are the values to set
    """
    category = request.form.get("category") or resolve_category_slug(request.form.get("slug"))
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
    filtered = filter_dict(metadata, CATEGORY_METADATA)
    for key in ["has_payments"]:
        if key in filtered:
            filtered[key] = filtered[key] not in [None, False, "", "false", "False", "0"]
    if filtered:
        category_metadata.update_one({
            "category": category
        }, {"$set": filtered})


########################################################################################################################
# META CATEGORY # META CATEGORY # META CATEGORY # META CATEGORY # META CATEGORY # META CATEGORY # META CATEGORY # META #
########################################################################################################################

@app.route("/api/listmetacategories")
@auth.login_required
def list_meta_categories():
    """
    List all meta categories with all categories belonging to them.
    """
    meta_categories = list(sorted(meta_category.find({}), key=lambda x: (x["order"], x["displayname"])))
    for meta in meta_categories:
        meta["meta2"].sort(key=lambda x: (x["order"], x["displayname"]))
        for meta2 in meta["meta2"]:
            meta2["categories"].sort()
    return success(value=meta_categories)


def meta_category_ensure_existence(meta1, meta2):
    """
    Ensure the given meta category exists and add it if not.
    """
    maybe = meta_category.find_one({
        "displayname": meta1
    })
    if not maybe:
        meta_category.insert_one({
            "displayname": meta1,
            "order": 50,
            "meta2": []
        })
    if meta2:
        maybe = meta_category.find_one({
            "displayname": meta1,
            "meta2.displayname": meta2,
        })
        if not maybe:
            meta_category.update_one({
                "displayname": meta1
            }, {
                "$push": {
                    "meta2": {
                        "displayname": meta2,
                        "order": 50,
                        "categories": [],
                    }
                }
            })


@app.route("/api/metacategory/setorder", methods=['POST'])
@auth.login_required
@require_admin
def meta_category_set_order():
    """
    Set the sorting order for a meta category.
    This is currently not available in the frontend
    POST Parameter 'meta1': level 1 name of meta category
    POST Parameter 'meta2': level 2 name of meta category. If this is not set the order for meta1 will be set
    POST Parameter 'order': order to set
    """
    meta1 = request.form.get("meta1")
    meta2 = request.form.get("meta2")
    order = request.form.get("order")
    if not meta1 or order is None:
        return not_possible("Missing argument")
    order = int(order)
    meta_category_ensure_existence(meta1, meta2)
    if not meta2:
        meta_category.update_one({
            "displayname": meta1,
        }, {
            "$set": {
                "order": order,
            }
        })
    else:
        meta_category.update_one({
            "displayname": meta1,
            "meta2.displayname": meta2,
        }, {
            "$set": {
                "meta2.$.order": order,
            }
        })
    return success()


@app.route("/api/metacategory/addcategory", methods=['POST'])
@auth.login_required
@require_admin
def meta_category_add_category():
    """
    Add a category to a meta category,
    POST Parameter 'meta1': level 1 name of meta category
    POST Parameter 'meta2': level 2 name of meta category
    POST Parameter 'category': category to add
    """
    meta1 = request.form.get("meta1")
    meta2 = request.form.get("meta2")
    category = request.form.get("category")
    if not meta1 or not meta2 or not category:
        return not_possible("Missing argument")
    meta_category_ensure_existence(meta1, meta2)
    meta_category.update_one({
        "displayname": meta1,
        "meta2.displayname": meta2,
    }, {
        "$addToSet": {
            "meta2.$.categories": category
        }
    })
    return success()


@app.route("/api/metacategory/removecategory", methods=['POST'])
@auth.login_required
@require_admin
def meta_category_remove_category():
    """
    Remove a category from a meta category
    POST Parameter 'meta1': level 1 name of meta category
    POST Parameter 'meta2': level 2 name of meta category
    POST Parameter 'category': category to remove
    """
    meta1 = request.form.get("meta1")
    meta2 = request.form.get("meta2")
    category = request.form.get("category")
    if not meta1 or not meta2 or not category:
        return not_possible("Missing argument")
    meta_category_ensure_existence(meta1, meta2)
    meta_category.update_one({
        "displayname": meta1,
        "meta2.displayname": meta2,
    }, {
        "$pull": {
            "meta2.$.categories": category
        }
    })
    remaining_meta2 = meta_category.find_one({
        "displayname": meta1,
        "meta2.displayname": meta2,
    }, {
        "meta2.$.categories": 1
    })
    if not remaining_meta2["meta2"][0]["categories"]:
        meta_category.update_one({
            "displayname": meta1,
            "meta2.displayname": meta2,
        }, {
            "$pull": {
                "meta2": {
                    "displayname": meta2
                }
            }
        })
        remaining_meta1 = meta_category.find_one({
            "displayname": meta1
        })
        if not remaining_meta1["meta2"]:
            meta_category.delete_one({
                "displayname": meta1
            })
    return success()


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
        "score_answers": 1,
        "score_comments": 1,
        "score_cuts": 1,
        "score_legacy": 1,
    })
    if not user:
        return not_found()
    return success(value=user)


@app.route("/api/scoreboard/<scoretype>")
@auth.login_required
def get_user_scoreboard(scoretype):
    if scoretype not in ["score", "score_answers", "score_comments", "score_cuts", "score_legacy"]:
        return not_found()
    limit = int(request.args.get('limit', "10"))
    users = user_data.find({}, {
        "username": 1,
        "displayName": 1,
        "score": 1,
        "score_answers": 1,
        "score_comments": 1,
        "score_cuts": 1,
        "score_legacy": 1,
    }).sort([
        (scoretype, -1)
    ]).limit(limit)
    return success(value=list(users))


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
        "score_answers": 0,
        "score_comments": 0,
        "score_cuts": 0,
        "score_legacy": 0,
        "notifications": [],
        "enabled_notifications": [
            NotificationType.NEW_COMMENT_TO_ANSWER.value,
            NotificationType.NEW_ANSWER_TO_ANSWER.value,
        ],
    })


def adjust_user_score(username, key, score):
    assert key in ["score", "score_answers", "score_comments", "score_cuts", "score_legacy"]
    init_user_data_if_not_found(username)
    user_data.update_one({
        "username": username
    }, {
        "$inc": {
            key: score
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


@app.route("/api/notifications/setenabled", methods=['POST'])
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


@app.route("/api/notifications/setread", methods=['POST'])
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
# PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT # PAYMENT#
########################################################################################################################

@app.route("/api/payment/pay", methods=['POST'])
@auth.login_required
@require_admin
def add_payment_api():
    """
    Record a payment of a user for some category.
    POST Parameter 'username'
    POST Parameter 'category'
    """
    category = request.form.get('category')
    if not category_exists(category):
        return not_possible("Category does not exist")
    username = request.form.get('username')
    if not username:
        return not_possible("No username given")
    catdata = category_metadata.find_one({
        "category": category
    }, {
        "has_payments": 1
    })
    if not catdata.get("has_payments"):
        return not_possible("Category does not have any payments")
    return add_payment(category, username)


@app.route("/api/payment/payall", methods=['POST'])
@auth.login_required
@require_admin
def add_all_payment_api():
    """
    Record a payment of a user for all categories (represented as __payment_all__)
    POST Parameter 'username'
    """
    username = request.form.get('username')
    if not username:
        return not_possible("No username given")
    return add_payment("__payment_all__", username)


def add_payment(category, username):
    """
    Record a payment of a user for some category.
    """
    maybe_payment = payments.find_one({
        "username": username,
        "category": category,
        "active": True
    })
    if maybe_payment and payment_still_valid(maybe_payment):
        return success()
    payments.insert_one({
        "_id": ObjectId(),
        "username": username,
        "category": category,
        "active": True,
        "payment_time": datetime.now(timezone.utc).isoformat(),
        "uploaded_filename": "",
        "check_time": "",
        "refund_time": "",
    })
    return success()


@app.route("/api/payment/remove", methods=['POST'])
@auth.login_required
@require_admin
def remove_payment():
    oid = request.form.get('oid')
    if not oid:
        return not_possible("Missing argument")
    oid = ObjectId(oid)
    removed = payments.delete_one({
        "_id": oid
    })
    if removed.deleted_count == 0:
        return not_possible("Could not delete payment")
    return success()


@app.route("/api/payment/refund", methods=['POST'])
@auth.login_required
@require_admin
def refund_payment():
    oid = request.form.get('oid')
    if not oid:
        return not_possible("Missing ID")
    payment = payments.find_one({
        "_id": ObjectId(oid)
    })
    if not payment:
        return not_found()
    if payment.get("refund_time"):
        return not_possible("Payment was already refunded")
    payments.update_one({
        "_id": ObjectId(oid)
    }, {
        "$set": {
            "refund_time": datetime.now(timezone.utc).isoformat(),
        }
    })
    return success()


def payment_still_valid(payment):
    """
    Check whether a payment is still valid.
    """
    now = datetime.now(timezone.utc)
    then = parse_iso_datetime(payment["payment_time"])
    resetdates = [datetime(year, month, 1, tzinfo=now.tzinfo) for year in [now.year-1, now.year] for month in [3, 9]]
    for reset in resetdates:
        if now > reset > then:
            return False
    return True


def payment_valid_until(payment):
    then = parse_iso_datetime(payment["payment_time"])
    resetdates = [datetime(year, month, 1, tzinfo=then.tzinfo) for year in [then.year, then.year+1] for month in [3, 9]]
    for reset in resetdates:
        if reset > then:
            return reset
    return None


def get_user_payments(username):
    """
    List all payments for a user.
    :param username: Name of the user.
    """
    user_payments = list(payments.find({
        "username": username,
    }, {
        "_id": 1,
        "active": 1,
        "category": 1,
        "payment_time": 1,
        "uploaded_filename": 1,
        "check_time": 1,
        "refund_time": 1,
    }))
    for payment in user_payments:
        if not payment_still_valid(payment):
            payments.update_one({
                "_id": payment["_id"]
            }, {
                "$set": {
                    "active": False
                }
            })
            payment["active"] = False
        payment["valid_until"] = payment_valid_until(payment).isoformat()
        payment["oid"] = payment["_id"]
        del payment["_id"]
    return list(sorted(user_payments, key=lambda x: (not x["active"], x["category"])))


def has_payed(username, category):
    """
    Check whether the user payed for the category.
    :param username: Name of the user
    :param category: Name of the category
    """
    maybe_payments = payments.find({
        "username": username,
        "category": category,
        "active": True
    }, {
        "payment_time": 1
    })
    for payment in maybe_payments:
        if payment_still_valid(payment):
            return True
    if category != "__payment_all__":
        return has_payed(username, "__payment_all__")
    return False


@app.route("/api/payment/query/<username>")
@auth.login_required
@require_admin
def payment_query(username):
    """
    List all payed categories for some user.
    """
    return success(value=get_user_payments(username))


@app.route("/api/payment/queryall")
@auth.login_required
@require_admin
def payment_queryall(username):
    """
    Check whether the user has a valid payment for all categories
    """
    payments = [x for x in get_user_payments(username) if x["category"] == "__payment_all__"]
    return success(value=len(payments) > 0)


@app.route("/api/payment/me")
@auth.login_required
def payment_query_me():
    """
    List all categories the current user payed for.
    """
    return success(value=get_user_payments(auth.username()))


########################################################################################################################
# FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBACK # FEEDBAC#
########################################################################################################################

@app.route("/api/feedback/submit", methods=['POST'])
@auth.login_required
def submit_feedback():
    """
    Add new feedback.
    POST Parameter 'text'
    """
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
    """
    List all feedback.
    """
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
    """
    Set flags (read, done) for feedback.
    """
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


@app.route("/api/uploadpdf/<pdftype>", methods=['POST'])
@auth.login_required
def uploadpdf(pdftype):
    """
    Allows uploading a new pdf or replacing an existing one.
    File as 'file'.
    Optional POST Parameter 'displayname' with displayname to use for new exams.
    Optional POST Parameter 'category' with category of new exam.
    Optional POST Parameter 'filename' of the exam this file is associated. Is ignored for new exams.
    Optional POST Parameter 'replace' which should be 1 if the file should be replaced.
    """
    if pdftype not in ['exam', 'printonly', 'solution', 'payment_exam']:
        return not_possible('Unknown pdf type')
    username = auth.username()

    file = request.files.get('file', None)
    orig_filename = file.filename
    if not file or not orig_filename or not allowed_exam_file(orig_filename):
        return not_possible("No valid file found")

    is_replace = request.form.get('replace', '0') != '0'
    if is_replace or (pdftype != 'exam' and pdftype != 'payment_exam'):
        filename = request.form.get('filename')
        if not filename:
            return not_possible("Missing filename")
        if not has_admin_rights_for_exam(username, filename):
            return not_allowed()
    else:
        assert pdftype in ['exam', 'payment_exam']
        filename = generate_filename(8, EXAM_DIR, ".pdf")
        if is_file_in_minio(EXAM_DIR, filename):
            # This should not happen!
            return not_possible("File already exists")

        category = request.form.get("category", "") or "default"
        if not category_exists(category):
            return not_possible("Category does not exist")
        if pdftype == 'exam':
            if not has_admin_rights_for_category(username, category):
                return not_possible("No permission for category")
        elif pdftype == 'payment_exam':
            maybe_category = category_metadata.find_one({
                "category": category
            }, {
                "has_payments": 1
            })
            if not maybe_category.get('has_payments'):
                return not_possible("Category is not valid")
        else:
            assert False

        init_exam_metadata(filename)
        displayname = request.form.get("displayname", "") or orig_filename
        if pdftype == 'exam':
            new_metadata = {
                "category": category,
                "displayname": displayname,
                "resolve_alias": orig_filename
            }
        elif pdftype == 'payment_exam':
            new_metadata = {
                "category": category,
                "displayname": displayname,
                "payment_category": category,
                "is_payment_exam": True,
                "payment_uploader": username,
                "payment_uploader_displayname": get_real_name(username),
                "payment_exam_checked": False,
                "examtype": "Transcripts",
            }
        else:
            assert False
        set_exam_metadata(filename, new_metadata)

    if not is_replace and is_file_in_minio(PDF_DIR[pdftype], filename):
        return not_possible("File already exists")

    if pdftype in ['printonly', 'solution']:
        set_exam_metadata(filename, {
            "has_" + pdftype: True
        })

    temp_file_path = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename)
    file.save(temp_file_path)
    minio_client.fput_object(minio_bucket, PDF_DIR[pdftype] + filename, temp_file_path)
    os.remove(temp_file_path)
    return success(filename=filename)


@app.route("/api/removepdf/<pdftype>", methods=['POST'])
@auth.login_required
def removepdf(pdftype):
    """
    Removes the pdf from storage.
    Exams should be removed via remove_exam
    POST Parameter 'filename' of file to delete
    """
    if pdftype not in ['printonly', 'solution']:
        return not_possible('Unknown pdf type')
    username = auth.username()
    filename = request.form.get('filename')
    if not filename or not has_admin_rights_for_exam(username, filename):
        return not_allowed()
    minio_client.remove_object(minio_bucket, PDF_DIR[pdftype] + filename)
    set_exam_metadata(filename, {
        "has_" + pdftype: False
    })
    return success()


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


@app.route("/api/pdf/<pdftype>/<filename>")
@auth.login_required
def pdf(pdftype, filename):
    """
    Get the pdf for the filename of the given type
    Type is one of exam, printonly, solution
    """
    if pdftype not in ['exam', 'printonly', 'solution']:
        return not_possible('Unknown pdf type')
    metadata = exam_metadata.find_one({
        "filename": filename
    }, {
        "public": 1,
        "solution_printonly": 1,
    })
    if not metadata:
        return not_found()
    is_printonly = pdftype in ['printonly'] or (pdftype in ['solution'] and metadata.get("solution_printonly"))
    username = auth.username()
    if is_printonly and not has_admin_rights_for_exam(username, filename):
        return not_allowed()
    if not can_view_exam(username, filename):
        return not_allowed()
    try:
        data = minio_client.get_object(minio_bucket, PDF_DIR[pdftype] + filename)
        return send_file(data, mimetype="application/pdf")
    except NoSuchKey as n:
        return not_found()


@app.route("/api/printpdf/<pdftype>/<filename>", methods=['POST'])
@auth.login_required
def print_pdf(pdftype, filename):
    """
    Print the pdf
    :param pdftype: type of pdf to print
    :param filename: pdf to print
    """
    if pdftype not in ['printonly', 'solution']:
        return not_possible('Unknown pdf type')
    metadata = exam_metadata.find_one({
        "filename": filename
    }, {
        "public": 1,
        "payment_category": 1,
    })
    if not metadata:
        return not_found()
    username = auth.username()
    if not metadata.get("public", False) and not has_admin_rights_for_exam(username, filename):
        return not_allowed()
    if metadata.get("payment_category") and not has_admin_rights_for_exam(username, filename):
        if not has_payed(username, metadata.get("payment_category")):
            return not_allowed()
    if not request.form.get('password'):
        return not_allowed()
    try:
        pdfpath = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename)
        minio_client.fget_object(minio_bucket, PDF_DIR[pdftype] + filename, pdfpath)
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
