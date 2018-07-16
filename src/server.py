import sys
from flask import Flask, g, request, redirect, url_for, send_from_directory, jsonify
from flask_httpauth import HTTPBasicAuth
from werkzeug.utils import secure_filename as make_secure_filename
import json, re
from pymongo import MongoClient
from datetime import datetime
import os
from flask import send_from_directory, render_template
from minio import Minio
from minio.error import ResponseError, BucketAlreadyExists, BucketAlreadyOwnedByYou, NoSuchKey
from bson.objectid import ObjectId
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer,
                          BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
import traceback

from os import listdir
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
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  #MAX FILE SIZE IS 32 MB
app.config['SECRET_KEY'] = 'VERY SAFE SECRET KEY'
# Minio seems to run unsecured on port 80
minio_is_https = False # os.environ.get('RUNTIME_MINIO_URL', '').startswith('https')
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
examAnswerSections = mongo_db.examAnswerSections


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
    return make_json_response(answer_sections.find({"oid": oid}).limit(1)[0])

def not_allowed():
    return make_json_response({"err": "Not allowed"}), 403

def not_found():
    return make_json_response({"err": "Not found"}), 404

def not_possible(msg):
    # TODO better HTTP Status Code
    return make_json_response({"err": msg}), 418


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
    return list(minio_client.list_objects(minio_bucket, prefix=name)) != []


@app.route("/api/user")
@auth.login_required
def get_user():
    return make_json_response({
        "adminrights": has_admin_rights(auth.username()),
        "username": auth.username(),
        "displayname": auth.username()
    })


@app.route("/api/exam/<filename>/answersection")
@auth.login_required
def get_answer_section(filename):
    oid = request.args.get("oid", "")
    results = answer_sections.find({
        "oid": ObjectId(oid)
    }, {
        "oid": 1,
        "answersection": 1
    }).limit(1)
    if results.count() == 0:
        return not_found()
    return make_json_response(results[0])


@app.route("/api/exam/<filename>/cuts")
@auth.login_required
def get_cuts(filename):
    results = answer_sections.find({
        "filename": filename
    }, {
        "oid": 1,
        "relHeight": 1,
        "pageNum": 1
    })
    cuts = {}
    for cut in results:
        group = cuts.get(cut["pageNum"], [])
        group.append([cut["relHeight"], str(cut["oid"])])
        cuts[cut["pageNum"]] = group
    for group in cuts.values():
        group.sort(key=lambda x: float(x[0]))
    return make_json_response(cuts)


@app.route("/api/exam/<filename>/newanswersection")
@auth.login_required
def new_answer_section(filename):
    username = auth.username()
    answer_section = {"answers": [], "asker": username}
    if not has_admin_rights(auth.username()):
        return not_allowed()
    page_num = request.args["pageNum"]
    rel_height = request.args["relHeight"]
    result = answer_sections.find({
        "pageNum": page_num,
        "filename": filename,
        "relHeight": rel_height
    }).limit(1)
    if result.count() > 0:
        return make_json_response(result[0])
    new_doc = {
        "filename": filename,
        "pageNum": page_num,
        "relHeight": rel_height,
        "answersection": answer_section,
        "oid": ObjectId()
    }
    answer_sections.insert_one(new_doc)
    return make_json_response(new_doc)


@app.route("/api/exam/<filename>/removeanswersection")
@auth.login_required
def remove_answer_section(filename):
    if has_admin_rights(auth.username()):
        oid = ObjectId(request.args.get("oid", ""))
        username = auth.username()
        if answer_sections.delete_one({"oid": oid}).deleted_count > 0:
            return make_json_response({"status": "success"})
        else:
            return make_json_response({"status": "error"})
    else:
        return not_allowed()


@app.route("/api/exam/<filename>/togglelike")
@auth.login_required
def toggle_like(filename):
    answer_section_oid = ObjectId(request.args.get("answersectionoid", ""))
    oid = ObjectId(request.args.get("oid", ""))
    username = auth.username()
    answer = answer_sections.find({
        "answersection.answers.oid": oid
    }, {
        "_id": 0,
        'answersection.answers.$': 1
    })[0]["answersection"]["answers"][0]
    if username in answer["upvotes"]:
        answer["upvotes"].remove(username)
    else:
        answer["upvotes"].append(username)
    answer_sections.update_one({
        'answersection.answers.oid': oid
    }, {"$set": {
        'answersection.answers.$': answer
    }})
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/setanswer", methods=["POST"])
@auth.login_required
def set_answer(filename):
    answer_section_oid = ObjectId(request.args["answersectionoid"])
    req_body = request.get_json()
    answer_oid = ObjectId(req_body["oid"]) if "oid" in req_body else None
    username = auth.username()
    if answer_oid is None:
        add_answer(answer_section_oid, username, req_body["text"])
    else:
        modify_answer(answer_oid, username, req_body["text"])
    return make_answer_section_response(answer_section_oid)


def modify_answer(answer_oid, username, text):
    answer = answer_sections.find({
        "answersection.answers.oid": answer_oid
    }, {
        "_id": 0,
        'answersection.answers.$': 1
    })[0]["answersection"]["answers"][0]
    answer["text"] = text
    if answer["authorId"] != username:
        return not_allowed()
    answer_sections.update_one({
        'answersection.answers.oid': answer_oid
    }, {"$set": {
        'answersection.answers.$': answer
    }})


def add_answer(answer_section_oid, username, text):
    answer = {
        "authorId": username,
        "text": text,
        "comments": [],
        "upvotes": [],
        "time": datetime.utcnow(),
        "oid": ObjectId()
    }
    answer_sections.update_one({
        "oid": answer_section_oid
    }, {'$push': {
        "answersection.answers": answer
    }})


@app.route("/api/exam/<filename>/addcomment", methods=["POST"])
@auth.login_required
def add_comment(filename):
    answer_section_oid = ObjectId(request.args["answersectionoid"])
    answer_oid = ObjectId(request.args["answerOid"])
    username = auth.username()
    req_body = request.get_json()
    answer = \
        answer_sections\
        .find({"answersection.answers.oid": answer_oid}, {"_id": 0, 'answersection.answers.$': 1})\
        [0]['answersection']["answers"][0]
    answer["comments"].append({
        "text": req_body["text"],
        "authorId": username,
        "time": datetime.utcnow(),
        "oid": ObjectId()
    })
    answer_sections.update_one({
        'answersection.answers.oid': answer_oid
    }, {"$set": {
        'answersection.answers.$': answer
    }})
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/removecomment")
@auth.login_required
def remove_comment(filename):
    answer_section_oid = ObjectId(request.args["answersectionoid"])
    comment_oid = ObjectId(request.args["oid"])
    page_num = request.args["pageNum"]
    rel_height = request.args["relHeight"]
    comments = \
        answer_sections \
        .find_one({"answersection.answers": {"$elemMatch": {"comments.oid": ObjectId(comment_oid)}}}, \
        {"_id":0, "answersection.answers.$.comments": 1})["answersection"]["answers"][0]["comments"]
    comment = {"authorId": ""}
    for c in comments:
        if c["oid"] == ObjectId(comment_oid):
            comment = c
            break
    if comment["authorId"] == auth.username():
        answer_sections.update_one(
            {
                'answersection.answers.comments.oid': ObjectId(comment_oid)
            }, {
                "$pull": {
                    'answersection.answers.$.comments': {
                        'oid': ObjectId(comment_oid)
                    }
                }
            })
    return make_answer_section_response(answer_section_oid)


@app.route("/api/exam/<filename>/removeanswer")
@auth.login_required
def remove_answer(filename):
    answer_section_oid = ObjectId(request.args["answersectionoid"])
    oid = request.args["oid"]
    username = auth.username()
    if answer_sections.find({
            "answersection.answers.oid": ObjectId(oid)
    }, {
            "_id": 0,
            'answersection.answers.$': 1
    }).limit(1)[0]["answersection"]["answers"][0]["authorId"] == username:
        answer_sections.update_one({
            'answersection.answers.oid': ObjectId(oid)
        }, {"$pull": {
            'answersection.answers': {
                'oid': ObjectId(oid)
            }
        }})
    return make_answer_section_response(answer_section_oid)


@app.route("/api/uploadpdf", methods=['POST'])
@auth.login_required
def uploadpdf():
    if not has_admin_rights(auth.username()):
        return not_allowed()
    file = request.files.get('file', None)
    if not file or not file.filename or not allowed_file(file.filename):
        return not_possible("No valid file found")
    filename = request.form.get("filename", "") or file.filename
    if not allowed_file(filename):
        return not_possible("Invalid file name")
    secure_filename = make_secure_filename(filename)
    if is_pdf_in_minio(secure_filename):
        return not_possible("File already exists")
    temp_file_path = os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], secure_filename)
    file.save(temp_file_path)
    minio_client.fput_object(minio_bucket, secure_filename, temp_file_path)
    return make_json_response({
        "result": "success",
        "href": "/exams/" + secure_filename
    })


@app.route("/api/pdf/<filename>")
@auth.login_required
def pdf(filename):
    try:
        minio_client.fget_object(
            minio_bucket, filename,
            os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename))
    except NoSuchKey as n:
        return "There is no such PDF saved here :(", 404
    return send_from_directory(app.config['INTERMEDIATE_PDF_STORAGE'],
                               filename)


@app.errorhandler(Exception)
def unhandled_exception(e):
    print('Unhandled Exception', e, traceback.format_exc(), file=sys.stderr)
    return "Sadly, we experienced an internal Error!", 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=80)
