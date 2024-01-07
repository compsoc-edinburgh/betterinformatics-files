ARG git_branch="<none>"
ARG git_commit="<none>"

FROM eu.gcr.io/vseth-public/base:echo AS backend
LABEL maintainer='lmoeller@vis.ethz.ch'

WORKDIR /app

RUN mkdir intermediate_pdf_storage && chown app-user:app-user intermediate_pdf_storage

COPY ./backend/requirements.txt ./requirements.txt
RUN apt-get install -y --no-install-recommends \
	python3 python3-pip \
	python3-setuptools python3-cryptography \
	smbclient poppler-utils \
  pgbouncer
RUN	pip3 install -r requirements.txt
RUN	rm -rf /var/lib/apt/lists/*

COPY cinit.yml /etc/cinit.d/community-solutions.yml

# prevent guincorn from buffering prints from python workers
ENV PYTHONUNBUFFERED True

COPY ./frontend/public/exam10.pdf ./exam10.pdf
COPY ./frontend/public/static ./static

COPY ./backend/ ./
COPY ./pgbouncer ./pgbouncer

FROM node:20-alpine AS frontend-build
ARG git_branch
ARG git_commit

WORKDIR /usr/src/app
COPY ./frontend/package.json .
COPY ./frontend/yarn.lock .
RUN yarn --ignore-engines --ignore-optional
COPY ./frontend/tsconfig.json .
COPY ./frontend/.eslintrc.json .
COPY ./frontend/.env.production .
COPY ./frontend/.prettierrc.json ./.prettierrc.json
COPY ./frontend/public ./public
COPY ./frontend/src ./src
ENV VITE_GIT_BRANCH=${git_branch}
ENV VITE_GIT_COMMIT=${git_commit}
RUN yarn run build

FROM backend AS combined

COPY --from=frontend-build /usr/src/app/build/manifest.json ./manifest.json
COPY --from=frontend-build /usr/src/app/build/index.html ./templates/index.html
COPY --from=frontend-build /usr/src/app/build/favicon.ico ./favicon.ico
COPY --from=frontend-build /usr/src/app/build/static ./static

EXPOSE 80
