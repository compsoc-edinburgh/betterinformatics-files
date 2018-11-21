FROM node:9.4-alpine

WORKDIR /usr/src/app
COPY ./frontend/package.json .
COPY ./frontend/yarn.lock .
COPY ./frontend/tsconfig.json .
COPY ./frontend/tslint.json .
RUN yarn
COPY ./frontend/src ./src
COPY ./frontend/public ./public
RUN yarn run build


FROM registry.vis.ethz.ch/public/vis-base:bravo
LABEL maintainer 'schmidbe@vis.ethz.ch'

RUN mkdir intermediate_pdf_storage

RUN apt-get update && apt-get install -y \
	python3 python3-pip python3-dev

COPY ./src/requirements.txt ./requirements.txt
RUN pip3 install -r requirements.txt

# prevent guincorn from buffering prints from pythno workers
ENV PYTHONUNBUFFERED True

COPY --from=0 /usr/src/app/build/index.html ./templates/index.html
COPY --from=0 /usr/src/app/build/favicon.ico ./favicon.ico
COPY --from=0 /usr/src/app/build/static ./static
COPY ./frontend/public/static ./static
COPY ./src/people_pb2.py .
COPY ./src/people_pb2_grpc.py .
COPY ./src/dbmigrations.py .
COPY ./src/server.py .

CMD ["/usr/local/bin/gunicorn", "server:app", "-b", "0.0.0.0:80", "-w", "4", "--log-level", "debug"]
