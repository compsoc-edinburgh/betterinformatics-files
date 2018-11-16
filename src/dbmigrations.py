import fcntl
import time

DB_VERSION = 1
DB_VERSION_KEY = "dbversion"
DB_LOCK_FILE = ".dblock"

def init_migration(mongo_db):
    print("Init migration")
    mongo_db.dbmeta.insert_one({
        "key": DB_VERSION_KEY,
        "value": 1
    })
    mongo_db.categorymetadata.insert_one({
        "category": "default",
        "admins": []
    })

MIGRATIONS = [
    init_migration
]

def migrate(mongo_db):
    open(DB_LOCK_FILE, "a").close()
    meta = mongo_db.dbmeta
    # access all collections to make sure they exist
    answer_sections = mongo_db.answersections
    exam_categories = mongo_db.examcategories
    category_metadata = mongo_db.categorymetadata
    exam_metadata = mongo_db.exammetadata
    # give mongodb time to wake up...
    # it crashes with an authentication failure otherwise, yay!
    time.sleep(2)
    with open(DB_LOCK_FILE, "w") as f:
        fcntl.lockf(f, fcntl.LOCK_EX)
        maybe_version = meta.find_one({
            "key": DB_VERSION_KEY
        })
        version = 0
        if maybe_version:
            version = int(maybe_version["value"])
        print("found db version", version)
        for i in range(DB_VERSION):
            if version <= i:
                MIGRATIONS[i](mongo_db)
        fcntl.lockf(f, fcntl.LOCK_UN)