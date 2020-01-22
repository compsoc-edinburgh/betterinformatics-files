#!/usr/bin/env python3

import subprocess
import os

args = [
    'visdev',
    'test',
    '.',
]

for dir in os.listdir('backend'):
    if not os.path.isdir(os.path.join('backend', dir)) or dir == 'venv':
        continue
    args.extend([
        '--volume',
        os.path.abspath('backend/' + dir) + ':/app/' + dir
    ])

subprocess.call(args)
