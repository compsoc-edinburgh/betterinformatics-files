#!/bin/sh
set -e
chmod +x people-fake-server
./people-fake-server &
python3 hellovis.py
