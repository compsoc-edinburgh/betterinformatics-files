import sys
from flask import Flask, g, request, redirect, url_for, send_from_directory
from flask_httpauth import HTTPBasicAuth
from werkzeug.utils import secure_filename
import json, re
from pymongo import MongoClient
from datetime import datetime
import os
from flask import send_from_directory, render_template
from minio import Minio
from minio.error import ResponseError,BucketAlreadyExists,BucketAlreadyOwnedByYou
from bson.objectid import ObjectId
from itsdangerous import (TimedJSONWebSignatureSerializer
                          as Serializer, BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context

from os import listdir
import grpc
import people_pb2
import people_pb2_grpc

peopleChannel = grpc.insecure_channel(os.environ["RUNTIME_SERVIS_PEOPLE_API_SERVER"]+":"+os.environ["RUNTIME_SERVIS_PEOPLE_API_PORT"])
peopleClient = people_pb2_grpc.PeopleStub(peopleChannel)
peopleMetadata = [("authorization",os.environ["RUNTIME_SERVIS_PEOPLE_API_KEY"])]

app = Flask(__name__, static_url_path="/static")
auth = HTTPBasicAuth()

if "RUNTIME_MONGO_DB_SERVER" in os.environ:
    mongourl = "mongodb://{}:{}@{}:{}/{}".format(
        os.environ['RUNTIME_MONGO_DB_USER'],
        os.environ['RUNTIME_MONGO_DB_PW'],
        os.environ['RUNTIME_MONGO_DB_SERVER'],
        os.environ['RUNTIME_MONGO_DB_PORT'],
        os.environ['RUNTIME_MONGO_DB_NAME'])
else:
    mongourl = os.environ['RUNTIME_MONGO_DB_URL']

UPLOAD_FOLDER = 'intermediate_pdf_storage'
ALLOWED_EXTENSIONS = set(['pdf'])
app.config['INTERMEDIATE_PDF_STORAGE'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024 #MAX FILE SIZE IS 32 MB
app.config['SECRET_KEY'] = 'VERY SAFE SECRET KEY'
if "RUNTIME_MINIO_SERVER" in os.environ:
    minioClient = Minio(os.environ['RUNTIME_MINIO_SERVER'],
                    access_key=os.environ['RUNTIME_MINIO_ACCESS_KEY'],
                    secret_key=os.environ['RUNTIME_MINIO_SECRET_KEY'],
                    secure=False)
else:
    minioClient = Minio(os.environ['RUNTIME_MINIO_URL'],
                access_key=os.environ['RUNTIME_MINIO_ACCESS_KEY'],
                secret_key=os.environ['RUNTIME_MINIO_SECRET_KEY'],
                secure=False)

try:
    minioClient.make_bucket("pdfs")
except BucketAlreadyOwnedByYou as err:
    pass
except BucketAlreadyExists as err:
    pass
except ResponseError as err:
    print(err)

mongoClient = MongoClient(mongourl, 27017)
mongodb = mongoClient.examDataBase

answersections = mongodb.answersections
examAnswerSections = mongodb.examAnswerSections
"""
date_handler = lambda obj: (
    obj.isoformat()
    if isinstance(obj, datetime)
    else None
)
"""

def date_handler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj,ObjectId):
        return str(obj)
    else:
        return obj



@auth.verify_password
def verify_pw(username, password):
    try:
        req = people_pb2.AuthPersonRequest(password=password,username=username)
        res = peopleClient.AuthEthPerson(req,metadata=peopleMetadata)
    except grpc.RpcError as e:
        print("Verify Password throws:",e,file=sys.stderr)
        return False
    return res.ok

def hasAdminrights(username):
    try:
        req = people_pb2.GetPersonRequest(username=username)
        res = peopleClient.GetVisLegacyPerson(req,metadata=peopleMetadata)
    except grpc.RpcError as e:
        print("failed getting user groups with:",e,file=sys.stderr)
        return False
    return max("vorstand" == group for group in res.vis_groups)

@app.route("/health")
def test():
    return "Server is running"

@app.route('/<filename>')
@auth.login_required
def index(filename):
    print("recieved")
    cursor = answersections.find({"filename":filename},{"oid":1,"relHeight":1,"pageNum":1})

    cuts = {}
    for cut in cursor:
        print(cut, file=sys.stderr)
        _id = cut["oid"] 
        relHeight = (cut["relHeight"])
        pageNum = (cut["pageNum"])
        if pageNum in cuts:
            cuts[pageNum].append([relHeight,str(_id)])
            cuts[pageNum].sort(key=lambda x: float(x[0]))
        else:
            cuts[pageNum] = [(relHeight,str(_id))]
    print("cuts computed")
    return render_template('index.html',pdfLink="pdf/"+filename,userId=auth.username(),userDisplayName=auth.username(),
                           cuts=cuts,templated="True")

@app.route("/favicon.ico")
def favicon():
    return send_from_directory('favicon.ico',"")


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/uploadpdf",methods=['POST','GET'])
@auth.login_required
def upload_pdf():
    if hasAdminrights(auth.username):
        if request.method == 'POST':
            # check if the post request has the file part
            if 'file' not in request.files:
                return redirect(request.url)
            file = request.files['file']
            # if user does not select file, browser also
            # submit a empty part without filename
            if file.filename == '':
                return redirect(request.url)
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename))
                try:
                    minioClient.fput_object('pdfs', filename, os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename))

                except ResponseError as err:
                    print(err)
                return redirect(url_for('',
                                        filename=filename))
        return '''
        <!doctype html>
        <title>Upload new File</title>
        <h1>Upload new File</h1>
        <form method=post enctype=multipart/form-data>
          <p><input type=file name=file>
             <input type=submit value=Upload>
        </form>
        '''
    else:
        return {"err":"no permission"}


@app.route("/api/<filename>/answersection")
@auth.login_required
def getAnswersection(filename):
    _id = request.args.get("oid","")
    answersecQueryResult = answersections.find({"oid":ObjectId(_id)}, {"oid":1,"answersection": 1}).limit(1)
    if answersecQueryResult.count() == 0:
        return json.dumps({"err":"NOT FOUND"})
    else:
        answersec = answersecQueryResult[0]
        return json.dumps(answersec,default=date_handler)
    #return """
    #{"answers":
    #[
    #  {"authorId":"fo2r3b8g23g823g",
    #  "text":"### This is a $t=e5^T$ answer!",
    #  "comments":[],
    #  "upvotes":["fo2r3b8g23g823g"],
    #  "time":1488893168}
    #],"asker":"fo2r3b8g23g823g"}"""

@app.route("/api/<filename>/newanswersection")
@auth.login_required
def newAnswersection(filename):
    if hasAdminrights(auth.username()):
        pageNum = request.args.get("pageNum", "")
        relHeight = request.args.get("relHeight", "")
        userId = auth.username()
        answersecQueryResult = answersections.find({"pageNum":pageNum,"filename":filename,"relHeight":relHeight}).limit(1)
        if answersecQueryResult.count() == 0:
            answersection = {"answers":[],"asker":userId}
            newDoc = {"filename": filename, "pageNum": pageNum, "relHeight": relHeight,"answersection": answersection,"oid":ObjectId()};
            answersections.insert_one(newDoc)
            return json.dumps(newDoc,default=date_handler)
        else:
            return json.dumps(answersecQueryResult[0],default=date_handler)
    else:
        return json.dumps({"err":"NOT ALLOWED"},default=date_handler)


@app.route("/api/<filename>/removeanswersection")
@auth.login_required
def removeAnswersection(filename):
    if hasAdminrights(auth.username()):
        oid = ObjectId(request.args.get("oid", ""))
        userId = auth.username()
        if answersections.delete_one({"oid":oid}).deleted_count > 0:
            return json.dumps({"status":"success"},default=date_handler)
        else:
            return json.dumps({"status":"error"},default=date_handler)
    else:
        return {"err":"NOT ALLOWED"}

@app.route("/api/<filename>/togglelike")
@auth.login_required
def toggleLike(filename):
    answersectionOid = ObjectId(request.args.get("answersectionoid", ""))
    oid = ObjectId(request.args.get("oid",""))
    userId = auth.username()
    answer = \
    answersections.find({"answersection.answers.oid": oid}, {"_id": 0, 'answersection.answers.$': 1})[0][
        "answersection"]["answers"][0]
    if userId in answer["upvotes"]:
        answer["upvotes"].remove(userId)
    else:
        answer["upvotes"].append(userId)
    answersections.update_one(
        {'answersection.answers.oid': oid},
        {"$set": {'answersection.answers.$': answer}}
    )
    return json.dumps(answersections.find({"oid":answersectionOid}).limit(1)[0],default=date_handler)

@app.route("/api/<filename>/setanswer",methods=["POST"])
@auth.login_required
def setAnswer(filename):
    answersectionOid = ObjectId(request.args.get("answersectionoid", ""))
    userId = auth.username()
    content = request.get_json()
    if "oid" in content:
        content["oid"] = ObjectId(content["oid"])
        answer = answersections.find({"answersection.answers.oid": content["oid"]}, {"_id": 0, 'answersection.answers.$': 1})[0]["answersection"]["answers"][0]
        answer["text"] = content["text"]
        if answer["authorId"] == userId:
            answersections.update_one(
                {'answersection.answers.oid': content["oid"]},
                {"$set":{'answersection.answers.$': answer}}
            )
    else:
        answer = {"authorId": userId, "text": content["text"], "comments": [], "upvotes": [], "time": datetime.utcnow(),
                  "oid": ObjectId()}
        answersections.update_one({"oid":answersectionOid},{'$push':{"answersection.answers":answer}})
    return json.dumps(answersections.find({"oid":answersectionOid}).limit(1)[0],default=date_handler)


@app.route("/api/<filename>/addcomment",methods=["POST"])
@auth.login_required
def addComment(filename):
    answersectionOid = ObjectId(request.args.get("answersectionoid", ""))
    answerOid = ObjectId(request.args.get("answerOid", ""))
    userId = auth.username()
    content = request.get_json()
    answer = \
        answersections\
        .find({"answersection.answers.oid": answerOid}, {"_id": 0, 'answersection.answers.$': 1})\
        [0]['answersection']["answers"][0]
    comment = {"text":content["text"],"authorId":userId,"time": datetime.utcnow(),"oid":ObjectId()}
    answer["comments"].append(comment)
    answersections.update_one(
        {'answersection.answers.oid': answerOid},
        {"$set": {'answersection.answers.$': answer}}
    )
    return json.dumps(answersections.find({"oid":answersectionOid}).limit(1)[0],default=date_handler)

@app.route("/api/<filename>/removecomment")
@auth.login_required
def removeComment(filename):
    answersectionOid = ObjectId(request.args.get("answersectionoid", ""))
    commentOid = ObjectId(request.args.get("oid", ""))
    pageNum = request.args.get("pageNum", "")
    relHeight = request.args.get("relHeight", "")
    comments = \
        answersections \
        .find_one({"answersection.answers": {"$elemMatch": {"comments.oid": ObjectId(commentOid)}}}, \
        {"_id":0, "answersection.answers.$.comments": 1})["answersection"]["answers"][0]["comments"]
    comment = {"authorId":""}
    for c in comments:
        if c["oid"] == ObjectId(commentOid):
            comment = c
            break
    if comment["authorId"] == auth.username():
        answersections.update_one(
            {'answersection.answers.comments.oid': ObjectId(commentOid)},
            {"$pull": {'answersection.answers.$.comments': {'oid': ObjectId(commentOid)}}}
        )
    return json.dumps(answersections.find({"oid":answersectionOid}).limit(1)[0],default=date_handler)


@app.route("/api/<filename>/removeanswer")
@auth.login_required
def removeanswer(filename):
    answersectionOid = ObjectId(request.args.get("answersectionoid", ""))
    oid = request.args.get("oid","")
    userId = auth.username()
    if answersections.find({"answersection.answers.oid": ObjectId(oid)}, {"_id": 0, 'answersection.answers.$': 1}).limit(1)[0]["answersection"]["answers"][0]["authorId"] == userId:
        answersections.update_one(
            {'answersection.answers.oid': ObjectId(oid)},
            {"$pull": {'answersection.answers': {'oid': ObjectId(oid)}}}
        )
    return json.dumps(answersections.find({"oid":answersectionOid}).limit(1)[0],default=date_handler)


@app.route("/pdf/<filename>")
@auth.login_required
def pdf(filename):

    try:
        print(minioClient.fget_object('pdfs', filename, os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename)))
    except ResponseError as err:
        print(err)
        return "ERROR"
    return send_from_directory(app.config['INTERMEDIATE_PDF_STORAGE'], filename)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=80)
