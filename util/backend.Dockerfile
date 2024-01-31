ARG git_branch="<none>"
ARG git_commit="<none>"

FROM python:3.10.13-bookworm

WORKDIR /app

RUN mkdir intermediate_pdf_storage

COPY ./backend/requirements.txt ./requirements.txt
RUN	pip install -r requirements.txt
RUN	rm -rf /var/lib/apt/lists/*

COPY backend /app

ENV IS_DEBUG true
CMD python manage.py runserver 0:8081
