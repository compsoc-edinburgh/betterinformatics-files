# Community Solutions

## Assumptions and Note

This guide is based on Ubuntu 20.04 LTS, but should work on anything similar. 

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

## Editing frontend code

There is an autoformatter for the frontend code
([prettier](https://prettier.io/)). It can be run once using `yarn run format`.
Some aspects of code quality and coding style are checked automatically using 
[eslint](https://eslint.org). You can run eslint using `yarn run lint`. There are plugins
for most editors so that you can see warnings and errors as you type.

## Install backend dependencies

- You will need to have Docker installed. Install it [like this](https://docs.docker.com/engine/install/ubuntu/). You might find the convenience script useful!

- Non macos users need to install Docker-Compose separately [like this](https://docs.docker.com/compose/install/).


## Start the backend

The backend can be started with the command:
```bash
sudo docker-compose up --build
```
## Post-Setup for backend

- Edit your host file at ```/etc/hosts``` to include the line ```127.0.0.1      minio```

- Go to ```localhost:9000``` and login to the minio console with the username: minio and password: minio123. Then create a bucket named: community-solutions