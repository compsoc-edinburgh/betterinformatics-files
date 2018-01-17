FROM registry.vis.ethz.ch/cit/vis-base:latest 
LABEL maintainer 'fischerf@vis.ethz.ch'

ENV SERVICE_CMD='python3 hellovis.py' 
ENV SERVICE_LOGGING_PATH='/app/logs'


RUN apt-get update && apt-get install -y \
	python3 python3-pip python3-dev 

ADD ./src/build/index.html ./templates/index.html
#ADD ./src/pruefungen-vis/public/index.html ./templates/index.html
#ADD ~/Developer/pruefungen-vis/public/index.html ./templates/index.html

ADD ./src/build ./static
#ADD ./src/pruefungen-vis ./static
#   ADD ~/Developer /pruefungen-vis/src ./static

ADD ./src/requirements.txt ./requirements.txt
RUN pip3 install -r requirements.txt 
ADD ./src/hellovis.py .
ADD ./intermediate_pdf_storage ./intermediate_pdf_storage

