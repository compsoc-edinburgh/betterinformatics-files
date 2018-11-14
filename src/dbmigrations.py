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

MIGRATIONS = [
    init_migration
]

def migrate(mongo_db):
    open(DB_LOCK_FILE, "a").close()
    meta = mongo_db.dbmeta
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