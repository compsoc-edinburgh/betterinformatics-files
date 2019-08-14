# Community Solutions

## Install Node.js

Node.js is an execution environment for standalone Javascript programs (it's
something like the Python interpreter).

You can install it [directly](https://nodejs.org/en/download/) or with a
[version manager](https://github.com/tj/n) (recommended).

## Install Yarn

Yarn is a dependency management tool (like npm or pip). Install it
[like this](https://yarnpkg.com/en/docs/install#debian-stable).

## Install dependencies

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

For more tasks, like building a production bundle, see the
[Create React App documentation](https://github.com/facebook/create-react-app).

## Start the backend

You will need to run `servis generate` before you can start the backend for the
first time, otherwise you will get an error (`people_pb.py: no such file`). See
[the servis documentation](https://documentation.vis.ethz.ch/servis.html) for 
more information.

Run `visdev test .` in this directory to start the backend
([more info about visdev](https://documentation.vis.ethz.ch/visdev.html)). The
frontend we started above will proxy all requests to this backend. It uses some
default login data which is only used for testing. You can change the user which
is used for these requests in the `package.json` file.
