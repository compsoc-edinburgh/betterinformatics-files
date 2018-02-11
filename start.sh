#!/bin/sh
set -e
chmod +x people-fake-server
./people-fake-server &
/usr/local/bin/gunicorn hellovis:app -b 0.0.0.0:80 -w 4
# python3 hellovis.py
