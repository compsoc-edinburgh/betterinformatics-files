# Community Solutions

## Quickstart with Gitpod

If you have Gitpod configured for ETH GitLab (https://gitpod.io/integrations)
you can just click here: 
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://gitlab.ethz.ch/vseth/sip-com-apps/community-solutions/-/tree/try-gitpod)

## Assumptions and Note

This guide is based on Ubuntu 20.04 LTS, but should work on anything similar. 

---

## Frontend
There are 2 ways to start the frontend:
1. Using [Yarn](#install-yarn) which requires [Node.js](#install-nodejs)
2. Using [Docker](#running-the-frontend-with-docker)

## Install Node.js

Node.js is an execution environment for standalone Javascript programs (it's
something like the Python interpreter).

You can install it [directly](https://nodejs.org/en/download/) or with a
[version manager](https://github.com/tj/n) (recommended). To install with
the version manager n simply do:
```bash
curl -L https://git.io/n-install | bash
```
n should install npm as well.
It is recommended to use **Node.js 16**, since the Dockerfile also uses v16. Newer versions of Node.js have been reported to not work correctly.

## Install Yarn

Yarn is a dependency management tool (like npm or pip). Install it
like this:
```bash
npm install --global yarn
```

## Install frontend dependencies

This installs things like React which the frontend needs. You usually only need
to do this once after cloning the repo.

```bash
cd frontend
yarn
```

If everything worked, you'll see a `node_modules` directory, where the
dependencies were installed to.

## Start the frontend

The frontend is built using
[Create React App](https://github.com/facebook/create-react-app). This is like a
compiler toolchain, which combines Javascript files and provides a server with
special development features. Start the dev server with:

```bash
cd frontend
yarn start
```

## Running the frontend with Docker

You will need to install [Docker](#install-docker).
Then you can simply start the frontend with the following command which will handle
all the setup automatically:
```bash
cd frontend
sudo docker compose up --build  # or docker-compose depending on your installed version
```

## Editing frontend code

There is an autoformatter for the frontend code
([prettier](https://prettier.io/)). It can be run once using `yarn run format`.
Some aspects of code quality and coding style are checked automatically using 
[eslint](https://eslint.org). You can run eslint using `yarn run lint`. There are plugins
for most editors so that you can see warnings and errors as you type.

---
## Backend
Backend is built with Django. It can be run using Docker.
## Install Docker

- You will need to have Docker installed. Install it [like this](https://docs.docker.com/engine/install/ubuntu/). You might find the convenience script useful!

- Non macos users need to install Docker-Compose separately [like this](https://docs.docker.com/compose/install/).


## Start the backend

The backend can be started with the command:
```bash
sudo docker compose up --build  # or docker-compose depending on your installed version
```

## Post-Setup for backend (needed for documents to work)

- Edit your host file at ```/etc/hosts``` to include the line ```127.0.0.1      minio```.
  This will allow the frontend to access documents from minio. (If you're running the
  frontend with Docker, this step is not needed.)

- Go to ```localhost:9001``` and login to the minio console with the username: minio and
  password: minio123. There should be a bucket called `community-solutions`. That is where
  all the documents are stored. If it's not there, create it manually.

---
## Testing
To fill the website with users, exams and documents, you can run:
```bash
cd backend
python3 manage.py create_testdata
```
This requires you to have all the Python libraries like Django installed. To circumvent
that, you can also start your backend, then access the terminal of the container
and execute the command there:

1. Start your backend as noted above.
2. Execute `docker exec -it community-solutions /bin/bash` to access the container.
3. Enter the app directory (`cd /app`) and execute `python3 manage.py create_testdata`

**Note:** It is normal for this to take some time (~10 mins).
