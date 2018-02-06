import sys
from flask import Flask, g, request, redirect, url_for, send_from_directory
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
print("HELLO", file=sys.stderr)
#raise Exception(listdir("templates"))

app = Flask(__name__, static_url_path="/static")
serverurl = os.environ['RUNTIME_MONGO_DB_SERVER']
UPLOAD_FOLDER = 'intermediate_pdf_storage'
ALLOWED_EXTENSIONS = set(['pdf'])
app.config['INTERMEDIATE_PDF_STORAGE'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024 #MAX FILE SIZE IS 32 MB
app.config['SECRET_KEY'] = 'VERY SAFE SECRET KEY'

minioClient = Minio(os.environ['RUNTIME_MINIO_URL']+":80",
                access_key=os.environ['RUNTIME_MINIO_ACCESS_KEY'],
                secret_key=os.environ['RUNTIME_MINIO_SECRET_KEY'],
                secure=False)

print(os.environ['RUNTIME_MINIO_URL']+":80",os.environ['RUNTIME_MINIO_ACCESS_KEY'],os.environ['RUNTIME_MINIO_SECRET_KEY'],file=sys.stderr)
try:
    minioClient.make_bucket("pdfs")
except BucketAlreadyOwnedByYou as err:
    pass
except BucketAlreadyExists as err:
    pass
except ResponseError as err:
    print(err)

mongoClient = MongoClient(serverurl, 27017)
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


def getUserId():
    return "muelsamu"
def getUserDisplayName():
    return "Samuel Müller"

@app.route("/test")
def test():
    return "Server is running"

@app.route('/<filename>')
def index(filename):
    cursor = answersections.find({"filename":filename},{"relHeight":1,"pageNum":1})

    cuts = {}
    for cut in cursor:
        relHeight = (cut["relHeight"])
        pageNum = (cut["pageNum"])
        if pageNum in cuts:
            cuts[pageNum].append(relHeight)
            cuts[pageNum].sort(key=float)
        else:
            cuts[pageNum] = [relHeight]
    return render_template('index.html',pdfLink="pdf/"+filename,userId=getUserId(),userDisplayName=getUserDisplayName(),
                           cuts=cuts,templated="True")

@app.route("/favicon.ico")
def favicon():
    return send_from_directory('favicon.ico',"")


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/uploadpdf",methods=['POST','GET'])
def upload_pdf():
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

def hasAdminRights(userId):
    return userId == "muelsamu"

@app.route("/api/<filename>/answersection")
def getAnswersection(filename):
    pageNum = request.args.get("pageNum","")
    relHeight = request.args.get("relHeight","")
    answersecQueryResult = answersections.find({"filename": filename,"pageNum":pageNum,"relHeight":relHeight}, {"answersection": 1}).limit(1)
    if answersecQueryResult.count() == 0:
        return "NOT FOUND"
    else:
        answersec = answersecQueryResult[0]["answersection"]
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
def newAnswersection(filename):
    if hasAdminRights(getUserId()):
        pageNum = request.args.get("pageNum", "")
        relHeight = request.args.get("relHeight", "")
        userId = getUserId()
        answersecQueryResult = answersections.find({"filename": filename, "pageNum": pageNum, "relHeight": relHeight},
                                                   {"_id": 1}).limit(1)
        if answersecQueryResult.count() == 0:
            answersection = {"answers":[],"asker":userId}
            answersections.insert_one({"filename": filename, "pageNum": pageNum, "relHeight": relHeight,"answersection": {"answers":[],"asker":userId}})
            return json.dumps(answersection,default=date_handler)
        else:
            return json.dumps(answersecQueryResult[0]["answersection"],default=date_handler)
    else:
        return "NOT ALLOWED"


@app.route("/api/<filename>/removeanswersection")
def removeAnswersection(filename):
    if hasAdminRights(getUserId()):
        pageNum = request.args.get("pageNum", "")
        relHeight = request.args.get("relHeight", "")
        userId = getUserId()
        if answersections.delete_one({"pageNum":pageNum,"filename":filename,"relHeight":relHeight}).deleted_count > 0:
            return json.dumps({"status":"success"},default=date_handler)
        else:
            return json.dumps({"status":"error"},default=date_handler)

@app.route("/api/<filename>/togglelike")
def toggleLike(filename):
    pageNum = request.args.get("pageNum", "")
    relHeight = request.args.get("relHeight", "")
    oid = ObjectId(request.args.get("oid",""))
    userId = getUserId()
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
    return json.dumps(answersections.find({"pageNum":pageNum,"relHeight":relHeight,"filename":filename}).limit(1)[0]["answersection"],default=date_handler)

@app.route("/api/<filename>/setanswer",methods=["POST"])
def setAnswer(filename):
    pageNum = request.args.get("pageNum", "")
    relHeight = request.args.get("relHeight", "")
    userId = getUserId()
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
        answersections.update_one({"pageNum":pageNum,"relHeight":relHeight,"filename":filename},{'$push':{"answersection.answers":answer}})
    return json.dumps(answersections.find({"pageNum":pageNum,"relHeight":relHeight,"filename":filename}).limit(1)[0]["answersection"],default=date_handler)


@app.route("/api/<filename>/addcomment",methods=["POST"])
def addComment(filename):
    pageNum = request.args.get("pageNum", "")
    relHeight = request.args.get("relHeight", "")
    answerOid = ObjectId(request.args.get("answerOid", ""))
    userId = getUserId()
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
    return json.dumps(answersections.find({"pageNum":pageNum,"relHeight":relHeight,"filename":filename}).limit(1)[0]["answersection"],default=date_handler)

@app.route("/api/<filename>/removecomment")
def removeComment(filename):
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
    if comment["authorId"] == getUserId():
        answersections.update_one(
            {'answersection.answers.comments.oid': ObjectId(commentOid)},
            {"$pull": {'answersection.answers.$.comments': {'oid': ObjectId(commentOid)}}}
        )
    return json.dumps(answersections.find({"pageNum":pageNum,"relHeight":relHeight,"filename":filename}).limit(1)[0]["answersection"],default=date_handler)


@app.route("/api/<filename>/removeanswer")
def removeanswer(filename):
    pageNum = request.args.get("pageNum", "")
    relHeight = request.args.get("relHeight", "")
    oid = request.args.get("oid","")
    userId = getUserId()
    if answersections.find({"answersection.answers.oid": ObjectId(oid)}, {"_id": 0, 'answersection.answers.$': 1}).limit(1)[0]["answersection"]["answers"][0]["authorId"] == userId:
        answersections.update_one(
            {'answersection.answers.oid': ObjectId(oid)},
            {"$pull": {'answersection.answers': {'oid': ObjectId(oid)}}}
        )
    return json.dumps(answersections.find({"pageNum":pageNum,"relHeight":relHeight,"filename":filename}).limit(1)[0]["answersection"],default=date_handler)


@app.route("/pdf/<filename>")
def pdf(filename):

    try:
        print(minioClient.fget_object('pdfs', filename, os.path.join(app.config['INTERMEDIATE_PDF_STORAGE'], filename)))
    except ResponseError as err:
        print(err)
        return "ERROR"
    return send_from_directory(app.config['INTERMEDIATE_PDF_STORAGE'], filename)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=80)
