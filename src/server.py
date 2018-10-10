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
from flask import send_from_directory, render_template
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
minio_client = Minio(
    os.environ['RUNTIME_MINIO_HOST'],
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

answer_sections = mongo_db.answersections
exam_categories = mongo_db.examcategories


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
    return success(value=answer_sections.find({"_id": oid}).limit(1)[0])


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


def has_admin_rights(username):
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = people_client.GetVisPerson(req, metadata=people_metadata)
    except grpc.RpcError as e:
        print("RPC error while checking admin rights", e)
        return False
    return max(("vorstand" == group or "cit" == group or "cat" == group)
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
        displayname=auth.username()
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
    result = answer_sections.find_one({
        "_id": ObjectId(oid)
    }, {
        "_id": 1,
        "answersection": 1
    })
    if not result:
        return not_found()
    result["oid"] = result["_id"]
    del result["_id"]
    return success(value=result)


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
        "answersection": {"answers": [], "asker": username},
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
        return internal_error("Could not delete answersection")


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
    like = request.form.get("like", 0) != 0
    if like:
        answer_sections.update_one({
            'answersection.answers._id': oid
        }, {'$addToSet': {
            'answersection.answers.$.upvotes': username
        }})
    else:
        answer_sections.update_one({
            'answersection.answers._id': oid
        }, {'$pull': {
            'answersection.answers.$.upvotes': username
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
    if not text:
        return not_possible("Missing argument")
    maybe_answer = answer_sections.find_one({
        "answersection._id": answer_section_oid,
        "answersection.answers.authorId": username
    }, {
        "answersection.answers.$": 1
    })
    if maybe_answer:
        answer_sections.update_one({
            'answersection.answers._id': maybe_answer["answersection"]["answers"][0]["_id"]
        }, {"$set": {
            'answersection.answers.$.text': text
        }})
    else:
        answer = {
            "authorId": username,
            "text": text,
            "comments": [],
            "upvotes": [],
            "time": datetime.utcnow()
        }
        answer_sections.update_one({
            "_id": answer_section_oid
        }, {'$push': {
            "answersection.answers": answer
        }})
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/removeanswer/<sectionoid>", methods=["POST"])
@auth.login_required
def remove_answer(filename, sectionoid):
    """
    Delete the answer for the current user for the section.
    """
    answer_section_oid = ObjectId(sectionoid)
    username = auth.username()
    answer_sections.update_one({
        'answersection._id': answer_section_oid
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
        "text": text,
        "authorId": username,
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


@app.route("/api/exam/<filename>/removecomment/<sectionoid>/<answeroid>", methods=["POST"])
@auth.login_required
def remove_comment(filename, sectionoid, answeroid):
    """
    Remove the comment with the given id.
    POST Parmeter 'commentoid'.
    """
    answer_section_oid = ObjectId(sectionoid)
    oid_str = request.form.get("commentoid", None)
    if not oid_str:
        return not_possible("Missing argument")
    comment_oid = ObjectId(oid_str)

    username = auth.username()
    answer_sections.update_one({
        "answersections.answer_section.comments._id": comment_oid
    }, {
        "$pull": {
            "answersection.answers.$.comments": {
                "_id": comment_oid,
                "authorId": username
            }
        }
    })
    return make_answer_section_response(answer_section_oid)


@app.route("/api/listcategories")
@auth.login_required
def list_categories():
    include_exams = 1 if request.args.get('exams', "1") != "0" else 0
    projection = {"_id": 0, "name": 1}
    if request.args.get('exams', "1") != "0":
        projection["exams"] = 1
    results = exam_categories.find({
        "exams": {"$gt": []}
    }, projection).sort([("name", pymongo.ASCENDING)])
    return success(value=list(results))


@app.route("/api/category/<category>/list")
@auth.login_required
def list_category(category):
    results = exam_categories.find_one({
        "name": category,
        "exams": {"$gt": []}
    }, {
        "exams": 1
    })
    return success(value=results["exams"])


@app.route("/api/category/<category>/add", methods=["POST"])
@auth.login_required
@require_admin
def add_exam_category_api(category):
    add_exam_category(category, request.form["exam"])
    return success()


def add_exam_category(category, exam):
    """
    Add the exam to the given category
    """
    exam_categories.update_one({
        "name": category
    }, {
        "$set": {
            "name": category
        },
        "$addToSet": {
            "exams": exam
        }
    }, upsert=True)


@app.route("/api/category/<category>/remove", methods=["POST"])
@auth.login_required
@require_admin
def remove_exam_category_api(category):
    remove_exam_category(category, request.form["exam"])
    return success()


def remove_exam_category(category, exam):
    """
    Remove the exam from the given category
    """
    exam_categories.update_one({
        "name": category
    }, {
        "$pull": {
            "exams": exam
        }
    })


@app.route("/api/uploadpdf", methods=['POST'])
@auth.login_required
@require_admin
def uploadpdf():
    """
    Allows uploading a new pdf.
    File as 'file'.
    Optional POST Parameter 'filename' with filename to use.
    """
    file = request.files.get('file', None)
    if not file or not file.filename or not allowed_file(file.filename):
        return not_possible("No valid file found")
    filename = request.form.get("filename", "") or file.filename
    if not allowed_file(filename):
        return not_possible("Invalid file name")
    category = request.form.get("category", "") or "default"
    secure_filename = make_secure_filename(filename)
    if is_pdf_in_minio(secure_filename):
        return not_possible("File already exists")
    temp_file_path = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], secure_filename)
    file.save(temp_file_path)
    minio_client.fput_object(minio_bucket, secure_filename, temp_file_path)
    add_exam_category(category, secure_filename)
    return success(href="/exams/" + secure_filename)


@app.route("/api/pdf/<filename>")
@auth.login_required
def pdf(filename):
    try:
        minio_client.fget_object(
            minio_bucket, filename,
            os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename))
    except NoSuchKey as n:
        return not_found()
    return send_from_directory(app.config['INTERMEDIATE_PDF_STORAGE'], filename)


@app.errorhandler(Exception)
def unhandled_exception(e):
    print('Unhandled Exception', e, traceback.format_exc(), file=sys.stderr)
    return "Sadly, we experienced an internal Error!", 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=80)
