ARG git_branch="<none>"
ARG git_commit="<none>"

# Backend targets:
# - backend: Includes only the backend part. Can be used for development, does not support hot-reloading.
# - backend-hotreload: Support hot-reloading, used only for local deployment. Excludes frontend
#
# Frontend targets:
# - frontend-base: Common base for both deployment and development containers
# - frontend-dev: Target only for local development, supports hot-reload
# - frontend-build: Builds the frontend files that will be included with the backend for final production-ready container.
#
# The `combined` stage extends the `backend` target with files built in the `frontend-build` step. Includes everything, production-ready

FROM eu.gcr.io/vseth-public/base:echo AS backend
LABEL maintainer='cat@vis.ethz.ch'

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

COPY ./backend/ ./

COPY ./frontend/public/exam10.pdf ./exam10.pdf
COPY ./frontend/public/static ./static

# prevent guincorn from buffering prints from python workers
ENV PYTHONUNBUFFERED True

COPY ./pgbouncer ./pgbouncer
COPY cinit.yml /etc/cinit.d/community-solutions.yml


FROM node:20-alpine AS frontend-base

WORKDIR /usr/src/app
COPY ./frontend/package.json \
     ./frontend/yarn.lock \
     ./frontend/index.html .

RUN yarn --ignore-engines


FROM frontend-base AS frontend-build
ARG git_branch
ARG git_commit

COPY ./frontend/tsconfig.json \
     ./frontend/postcss.config.cjs \
     ./frontend/vite.config.ts \
     ./frontend/.eslintrc.json \
     ./frontend/.env.production \
     ./frontend/.prettierrc.json .
COPY ./frontend/public ./public
COPY ./frontend/src ./src
ENV VITE_GIT_BRANCH=${git_branch}
ENV VITE_GIT_COMMIT=${git_commit}
RUN yarn run build

FROM backend AS combined

COPY --from=frontend-build /usr/src/app/build/manifest.json \
     /usr/src/app/build/favicon.ico .
COPY --from=frontend-build /usr/src/app/build/index.html ./templates/index.html
COPY --from=frontend-build /usr/src/app/build/static ./static

EXPOSE 80


# Development-only stages
# Backend
FROM backend AS backend-hotreload

ENV IS_DEBUG true
CMD python3 manage.py migrate \
    && python3 manage.py runserver 0:8081

# Frontend
FROM frontend-base AS frontend-dev

RUN yarn install --ignore-optional
COPY frontend ./
EXPOSE 3000
CMD ["yarn", "start-docker"]


# Production build as final result
FROM combined

