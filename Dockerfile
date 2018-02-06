FROM registry.vis.ethz.ch/cit/vis-base:latest 
LABEL maintainer 'muelsamu@vis.ethz.ch'

ENV SERVICE_CMD='python3 hellovis.py' 
ENV SERVICE_LOGGING_PATH='/app/logs'


RUN apt-get update && apt-get install -y \
	python3 python3-pip python3-dev 

COPY ./frontend/build/index.html ./templates/index.html

COPY ./frontend/build/static ./static

COPY ./src/requirements.txt ./requirements.txt
RUN pip3 install -r requirements.txt 
ADD ./src/hellovis.py .
ADD ./intermediate_pdf_storage ./intermediate_pdf_storage

