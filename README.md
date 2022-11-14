# Community Solutions

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

- Non-macOS users need to install Docker-Compose separately [like this](https://docs.docker.com/compose/install/).

## Start the backend

The backend can be started with the command:

```bash
sudo docker compose up --build  # or docker-compose depending on your installed version
```

The `--build` is important so that the images are rebuilt in case of changes.

## Post-Setup for backend (needed for documents to work)

- Edit your host file at `/etc/hosts` to include the line `127.0.0.1 minio`.
  This will allow your browser to get documents directly from minio.

- Go to `localhost:9001` and login to the minio console with the username: minio and
  password: minio123. There should be a bucket called `community-solutions`. That is where
  all the documents are stored. If it's not there, create it manually.

---

## Testing

To fill the website with users, exams and documents, you would run the following (but read on below, before executing the command):

```bash
cd backend
python3 manage.py create_testdata
```

This requires you to have all the Python libraries like Django installed. To circumvent
that, you can also start your backend, then access the terminal of the container
and execute the command there. This has the bonus that your container will already have
all the required packages installed.

1. Start your backend as noted above.
2. Execute `docker exec -it community-solutions /bin/bash` to access the container.
3. Enter the app directory (`cd /app`) and execute `python3 manage.py create_testdata`

**Note:** It is normal for this to take some time (~10 mins). Do **not** open your frontend when running this command.
This will result in a null pointer exception. It's best to simply stop the frontend process while the test data is being added.

---

## Troubleshooting

If something doesn't work, it's time to figure out what broke. The following points
serve as a starting point to figure out what went wrong. It is usually always good to
make sure you're on the latest commit of the branch with `git pull`.

- **localhost:3000 shows nothing:** This is usually if the frontend failed to startup.
  Check the terminal where you did `yarn start`. Usually React is very informative on
  what went wrong. Most often it's simply a package issue and you'll want to quickly run
  `yarn` to install/update/remove the required packages. Do note, it can sometimes take
  a while to startup. The webpage is only accessible once Yarn displays a few warnings
  about unused variables.

- **The homepage works, but I get errors of type `ECONNREFUSED` or `ENOTFOUND`:**
  This means your frontend can't communicate with the backend.
  Is the backend running without errors? The backend docker-compose file
  is configured to listen on port 8081. You should be able to see something
  on http://localhost:8081/ (no HTTP**S**). If not, something is wrong with
  the backend.

- **Backend doesn't work:** The logs from the docker-compose are formatted so
  that you have the service name on the left and the logs on the right.
  `community-solutions` is the backend Django service. Have a look at what is
  being printed there. If it's along the lines of it not being able to connect
  to the Postgres database, that's usually a problem with Postgres not able
  to start up. Search for the latest logs of Postgres which tell you if
  Postgres started up successfully or failed. Those can help you debug.
  For a "turn it off and on again" solution you can often simply type
  `docker compose down -v` to make sure all the services are shut down
  before starting it again with `docker compose up --build`. If that doesn't
  the problem, you can also delete the Postgres folder `data/sql` which will
  force the Postgres service to completely build the database from scratch.

- **`UnknownErrorException` when accessing exams/documents:** This is very likely
  caused by minio not being in your hosts file. Your browser gets an url with minio
  as the host, but if minio is not in your hosts file, it won't be redirected correctly.
