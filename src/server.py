import sys
from flask import Flask, g, request, redirect, url_for, send_from_directory, jsonify
from flask_httpauth import HTTPBasicAuth
from werkzeug.utils import secure_filename as make_secure_filename
import json, re
import pymongo
from pymongo import MongoClient
from datetime import datetime
import os
from functools import wraps
from flask import send_file, send_from_directory, render_template
from minio import Minio
from minio.error import ResponseError, BucketAlreadyExists, BucketAlreadyOwnedByYou, NoSuchKey
from bson.objectid import ObjectId
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer,
                          BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
import traceback

import grpc
import people_pb2
import people_pb2_grpc

import dbmigrations

people_channel = grpc.insecure_channel(
    os.environ["RUNTIME_SERVIS_PEOPLE_API_SERVER"] + ":" +
    os.environ["RUNTIME_SERVIS_PEOPLE_API_PORT"])
people_client = people_pb2_grpc.PeopleStub(people_channel)
people_metadata = [("authorization",
                    os.environ["RUNTIME_SERVIS_PEOPLE_API_KEY"])]

app = Flask(__name__, static_url_path="/static")
auth = HTTPBasicAuth()

UPLOAD_FOLDER = 'intermediate_pdf_storage'
ALLOWED_EXTENSIONS = set(['pdf'])
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

mongo_url = "mongodb://{}:{}@{}:{}/{}".format(
    os.environ['RUNTIME_MONGO_DB_USER'], os.environ['RUNTIME_MONGO_DB_PW'],
    os.environ['RUNTIME_MONGO_DB_SERVER'], os.environ['RUNTIME_MONGO_DB_PORT'],
    os.environ['RUNTIME_MONGO_DB_NAME'])
mongo_db = MongoClient(mongo_url).get_database()

dbmigrations.migrate(mongo_db)

answer_sections = mongo_db.answersections
exam_categories = mongo_db.examcategories
category_metadata = mongo_db.categorymetadata
exam_metadata = mongo_db.exammetadata


def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        username = auth.username()
        if not has_admin_rights(username):
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


def make_answer_section_response(oid):
    username = auth.username()
    section = answer_sections.find_one({"_id": oid}, {
        "_id": 1,
        "answersection": 1
    })
    if not section:
        return not_found()
    section["oid"] = section["_id"]
    del section["_id"]
    for answer in section["answersection"]["answers"]:
        answer["oid"] = answer["_id"]
        del answer["_id"]
        answer["canEdit"] = answer["authorId"] == auth.username()
        answer["isUpvoted"] = auth.username() in answer["upvotes"]
        answer["upvotes"] = len(answer["upvotes"])
        for comment in answer["comments"]:
            comment["oid"] = comment["_id"]
            del comment["_id"]
            comment["canEdit"] = comment["authorId"] == auth.username()
    section["answersection"]["answers"].sort(key=lambda x: -x["upvotes"])
    section["answersection"]["allow_new_answer"] = len([a for a in section["answersection"]["answers"] if a["authorId"] == username]) == 0
    return success(value=section)


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
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = people_client.GetEthPerson(req, metadata=people_metadata)
        return res.first_name + " " + res.last_name
    except grpc.RpcError as e:
        return username


def has_admin_rights(username):
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = people_client.GetVisPerson(req, metadata=people_metadata)
    except grpc.RpcError as e:
        print("RPC error while checking admin rights", e)
        return False
    return any(("vorstand" == group or "cit" == group or "cat" == group)
               for group in res.vis_groups)


@app.route("/health")
def test():
    return "Server is running"


@app.route("/")
@auth.login_required
def index():
    return render_template("index.html")


@app.route('/exams/<filename>')
@auth.login_required
def exams(filename):
    return index()


@app.route("/favicon.ico")
def favicon():
    return send_from_directory('.', 'favicon.ico')


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def is_pdf_in_minio(name):
    try:
        minio_client.stat_object(minio_bucket, name)
        return True
    except NoSuchKey:
        return False


@app.route("/api/user")
@auth.login_required
def get_user():
    """
    Returns information about the currently logged in user.
    """
    return success(
        adminrights=has_admin_rights(auth.username()),
        username=auth.username(),
        displayname=get_real_name(auth.username())
    )


@app.route("/api/listexams")
@auth.login_required
def list_exams():
    """
    Returns a list of all exams
    """
    return success(value=[obj.object_name for obj in minio_client.list_objects(minio_bucket)])


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
        "pageNum": 1
    })
    pages = {}
    for cut in results:
        pages.setdefault(cut["pageNum"], []).append({
            "relHeight": cut["relHeight"],
            "oid": str(cut["_id"])
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


@app.route("/api/exam/<filename>/newanswersection", methods=["POST"])
@auth.login_required
@require_admin
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
        "relHeight": rel_height
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
@require_admin
def remove_answer_section(filename):
    """
    Delete the answersection with the given oid.
    POST Parameter 'oid'.
    """
    oid_str = request.form.get("oid", None)
    if oid_str is None:
        return not_possible("Missing argument")
    oid = ObjectId(oid_str)
    if answer_sections.delete_one({"_id": oid}).deleted_count > 0:
        return success()
    else:
        return not_possible("Could not delete answersection")


@app.route("/api/exam/<filename>/setlike/<sectionoid>/<answeroid>", methods=["POST"])
@auth.login_required
def set_like(filename, sectionoid, answeroid):
    """
    Sets the like for the given answer in the given section.
    POST Parameter 'like' is 0/1.
    """
    answer_section_oid = ObjectId(sectionoid)
    answer_oid = ObjectId(answeroid)
    username = auth.username()
    like = request.form.get("like", "0") != "0"
    if like:
        answer_sections.update_one({
            'answersection.answers._id': answer_oid
        }, {'$addToSet': {
            'answersection.answers.$.upvotes': username
        }})
    else:
        answer_sections.update_one({
            'answersection.answers._id': answer_oid
        }, {'$pull': {
            'answersection.answers.$.upvotes': username
        }})
    return make_answer_section_response(answer_section_oid)

@app.route("/api/exam/<filename>/addanswer/<sectionoid>", methods=["POST"])
@auth.login_required
def add_answer(filename, sectionoid):
    """
    Adds an empty answer for the given section for the current user.
    This enforces that each user can only have one answer.
    """
    answer_section_oid = ObjectId(sectionoid)

    username = auth.username()
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
        "time": datetime.utcnow()
    }
    answer_sections.update_one({
        "_id": answer_section_oid
    }, {'$push': {
        "answersection.answers": answer
    }})
    return make_answer_section_response(answer_section_oid)

@app.route("/api/exam/<filename>/setanswer/<sectionoid>", methods=["POST"])
@auth.login_required
def set_answer(filename, sectionoid):
    """
    Sets the answer for the given section for the current user.
    This enforces that each user can only have one answer.
    POST Parameter 'text'.
    """
    answer_section_oid = ObjectId(sectionoid)

    username = auth.username()
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
    answer_sections.update_one({
        'answersection.answers._id': maybe_answer["answersection"]["answers"][0]["_id"]
    }, {"$set": {
        'answersection.answers.$.text': text
    }})
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/removeanswer/<sectionoid>", methods=["POST"])
@auth.login_required
def remove_answer(filename, sectionoid):
    """
    Delete the answer for the current user for the section.
    No POST Parameters
    """
    answer_section_oid = ObjectId(sectionoid)
    username = auth.username()
    answer_sections.update_one({
        '_id': answer_section_oid
    }, {"$pull": {
        'answersection.answers': {
            'authorId': username
        }
    }})
    return make_answer_section_response(answer_section_oid)


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

    comment = {
        "_id": ObjectId(),
        "text": text,
        "authorId": username,
        "authorDisplayName": get_real_name(username),
        "time": datetime.utcnow()
    }
    answer_sections.update_one({
        "answersection.answers._id": answer_oid
    }, {
        "$push": {
            "answersection.answers.$.comments": comment
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
    answer_oid = ObjectId(answeroid);
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
        'answersection.answers.comments': 1
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
    return success(value=metadata)


@app.route("/api/exam/<filename>/metadata", methods=["POST"])
@auth.login_required
def set_exam_metadata_api(filename):
    """
    Sets the metadata for the given exam file
    POST Parameters are the values to set
    """
    # TODO check permissions
    set_exam_metadata(filename, request.form)
    return success()


def int_exam_metadata(filename):
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
    whitelist = ["displayname", "category"]
    exam_metadata.update_one({
        "filename": filename
    }, {"$set": filter_dict(metadata, whitelist)})


@app.route("/api/listcategories")
@auth.login_required
def list_categories():
    """
    Lists all available categories sorted by name
    """
    return success(value=list(sorted(
        map(lambda x: x["category"], category_metadata.find({}, {"category": 1}))
    )))


@app.route("/api/listcategories/withexams")
@auth.login_required
def list_categories_with_exams():
    categories = list(sorted(
        map(lambda x: {"name": x["category"]}, category_metadata.find({}, {"category": 1})),
        key=lambda x: x["name"]
    ))
    for category in categories:
        category["exams"] = getCategoryExams(category["name"])
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


def enhanceExamDictionary(exam):
    """
    Enhance an exam dictionary with useful metadata
    :param exam: The exam dictionary to enhance
    """
    exam["displayname"] = exam_metadata.find_one({
        "filename": exam["filename"]
    }, {"displayname": 1})["displayname"]
    return exam


def getCategoryExams(category):
    """
    Returns list of exams in the given category, sorted by displayname
    :param category: name of the category
    :return: list of exams with metadata
    """
    exams = list(map(lambda x: enhanceExamDictionary({"filename": x["filename"]}), exam_metadata.find({
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
    # TODO handle categories with slashes
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
    exams = getCategoryExams(category)
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
    return success(value=getCategoryExams(category))


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
def set_category_metadata_api():
    """
    Sets the metadata for the given category
    POST Parameter 'category'
    POST Parameters are the values to set
    """
    category = request.form.get("category")
    if not category:
        return not_possible("Missing argument")
    # TODO check permissions
    set_category_metadata(category, request.form)
    return success()


def set_category_metadata(category, metadata):
    """
    Set the metadata for the given category
    :param category: name of category
    :param metadata: dictionary of values to set
    """
    whitelist = ["admins"]
    category_metadata.update_one({
        "category": category.lower()
    }, {"$set": filter_dict(metadata, whitelist)})


@app.route("/api/uploadpdf", methods=['POST'])
@auth.login_required
@require_admin
def uploadpdf():
    """
    Allows uploading a new pdf.
    File as 'file'.
    Optional POST Parameter 'filename' with filename to use.
    Optional POST Parameter 'displayname' with displayname to use.
    """
    file = request.files.get('file', None)
    if not file or not file.filename or not allowed_file(file.filename):
        return not_possible("No valid file found")
    filename = request.form.get("filename", "")
    if not filename or filename == ".pdf":
        filename = file.filename
    if not allowed_file(filename):
        return not_possible("Invalid file name")
    category = request.form.get("category", "") or "default"
    maybe_category = category_metadata.find_one({"category": category})
    if not maybe_category:
        return not_possible("Category does not exist")
    secure_filename = make_secure_filename(filename)
    if is_pdf_in_minio(secure_filename):
        return not_possible("File already exists")
    displayname = request.form.get("displayname", "") or secure_filename
    temp_file_path = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], secure_filename)
    file.save(temp_file_path)
    minio_client.fput_object(minio_bucket, secure_filename, temp_file_path)
    os.remove(temp_file_path)
    int_exam_metadata(secure_filename)
    set_exam_metadata(secure_filename, {"category": category, "displayname": displayname})
    return success(href="/exams/" + secure_filename)


@app.route("/api/pdf/<filename>")
@auth.login_required
def pdf(filename):
    """
    Get the pdf for the filename
    """
    try:
        data = minio_client.get_object(minio_bucket, filename)
        return send_file(data, mimetype="application/pdf")
    except NoSuchKey as n:
        return not_found()


@app.errorhandler(Exception)
def unhandled_exception(e):
    print('Unhandled Exception', e, traceback.format_exc(), file=sys.stderr)
    return "Sadly, we experienced an internal Error!", 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=80)
