ARG git_branch="<none>"
ARG git_commit="<none>"

FROM node:13.11-alpine
ARG git_branch
ARG git_commit

WORKDIR /usr/src/app

COPY ./frontend/package.json .
COPY ./frontend/yarn.lock .

RUN yarn --ignore-engines

COPY ./frontend/tsconfig.json .
COPY ./frontend/.eslintrc.json .
COPY ./frontend/.env.production .
COPY ./frontend/.prettierrc.json ./.prettierrc.json
COPY ./frontend/public ./public
COPY ./frontend/src ./src

RUN yarn run check-format || ( >&2 echo -e '\n\n=========\nSome code has not been autoformated. See "Editing frontend code" in README.md.\n=========\n\n'; exit 1 )
RUN yarn run lint || ( >&2 echo -e '\n\n=========\nYour code violates our set of linting rules.\nSee "Editing frontend code" in README.md.\n=========\n\n'; exit 1 )

ENV REACT_APP_GIT_BRANCH=$git_branch
ENV REACT_APP_GIT_COMMIT=$git_commit

RUN yarn run build

FROM eu.gcr.io/vseth-public/base:delta
LABEL maintainer='lmoeller@vis.ethz.ch'

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

COPY --from=0 /usr/src/app/build/manifest.json ./manifest.json
COPY --from=0 /usr/src/app/build/index.html ./templates/index.html
COPY --from=0 /usr/src/app/build/favicon.ico ./favicon.ico
COPY --from=0 /usr/src/app/build/static ./static

COPY ./frontend/public/exam10.pdf ./exam10.pdf
COPY ./frontend/public/static ./static

COPY ./backend/ ./
RUN python3 manage.py check

EXPOSE 80
