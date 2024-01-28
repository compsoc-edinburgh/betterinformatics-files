import os

ini = """
[databases]
%s = host=%s port=%s user=%s password=%s dbname=%s


[pgbouncer]
unix_socket_dir=/dev/shm
auth_type=trust
max_client_conn=%s
auth_file=/app/pgbouncer/userlist.txt
log_connections=0
log_disconnections=0
log_stats=0

default_pool_size=%s
""" % (
    os.environ["SIP_POSTGRES_DB_NAME"],
    os.environ["SIP_POSTGRES_DB_SERVER"],
    os.environ["SIP_POSTGRES_DB_PORT"],
    os.environ["SIP_POSTGRES_DB_USER"],
    os.environ["SIP_POSTGRES_DB_PW"],
    os.environ["SIP_POSTGRES_DB_NAME"],
    os.environ.get("PGBOUNCER_MAX_CLIENT_CONN", 64),
    os.environ.get("PGBOUNCER_DEFAULT_POOL_SIZE", 4),
)
ini = ini.strip()

with open("/dev/shm/pgbouncer.ini", "w") as ini_file:
    ini_file.write(ini)

