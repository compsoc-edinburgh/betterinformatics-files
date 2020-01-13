FROM node:13.1-alpine

WORKDIR /usr/src/app
COPY ./frontend/package.json .
COPY ./frontend/yarn.lock .
RUN yarn
COPY ./frontend/tsconfig.json .
COPY ./frontend/tslint.json .
COPY ./frontend/.prettierrc ./.prettierrc
COPY ./frontend/public ./public
COPY ./frontend/src ./src
RUN yarn run check-format || ( >&2 echo -e '\n\n=========\nSome code has not been autoformated. See "Editing frontend code" in README.md.\n=========\n\n'; exit 1 )
RUN yarn run build


FROM eu.gcr.io/vseth-public/base:delta
LABEL maintainer='schmidbe@vis.ethz.ch'

WORKDIR /app

RUN mkdir intermediate_pdf_storage && chown app-user:app-user intermediate_pdf_storage

RUN apt-get install -y \
	python3 python3-pip python3-dev \
	smbclient poppler-utils

COPY ./backend/requirements.txt ./requirements.txt
RUN pip3 install -r requirements.txt

COPY cinit.yml /etc/cinit.d/community-solutions.yml

# prevent guincorn from buffering prints from python workers
ENV PYTHONUNBUFFERED True

COPY --from=0 /usr/src/app/build/index.html ./index.html
COPY --from=0 /usr/src/app/build/favicon.ico ./favicon.ico
COPY --from=0 /usr/src/app/build/static ./static
COPY ./tutorial-slides ./tutorial
COPY ./frontend/public/static ./static
COPY ./backend/manage.py ./manage.py
COPY ./backend/backend ./backend
COPY ./backend/frontend ./frontend
COPY ./backend/health ./health
COPY ./backend/myauth ./myauth
COPY ./backend/servis ./servis
COPY ./backend/util ./util

EXPOSE 80
