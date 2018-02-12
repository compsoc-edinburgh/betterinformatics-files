FROM node:9.4-alpine

WORKDIR /usr/src/app
COPY ./frontend/package.json .
COPY ./frontend/package-lock.json .
RUN npm i
COPY ./frontend/src ./src
COPY ./frontend/public ./public
RUN npm run build


FROM registry.vis.ethz.ch/cit/vis-base:bravo
LABEL maintainer 'muelsamu@vis.ethz.ch'

RUN mkdir intermediate_pdf_storage

RUN apt-get update && apt-get install -y \
	python3 python3-pip python3-dev 

COPY ./src/requirements.txt ./requirements.txt
RUN pip3 install -r requirements.txt 

COPY --from=0 /usr/src/app/build/index.html ./templates/index.html
COPY --from=0 /usr/src/app/build/static ./static
COPY ./src/hellovis.py .
COPY ./src/test.py .
COPY ./src/people_pb2.py .
COPY ./src/people_pb2_grpc.py .

ADD https://people.api.svis.ethz.ch/people-fake-linux-amd64 people-fake-server

CMD ["/usr/local/bin/gunicorn", "hellovis:app", "-b", "0.0.0.0:80", "-w", "4", "--log-level", "debug"]
