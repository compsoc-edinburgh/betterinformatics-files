# Exam Solution Exchange

## New frontend

### Install Node.js

Node.js is an execution environment for standalone Javascript programs (it's
something like the Python interpreter).

You can install it [directly](https://nodejs.org/en/download/) or with a
[version manager](https://github.com/tj/n) (recommended).

### Install Yarn

Yarn is a dependency management tool (like npm or pip). Install it
[like this](https://yarnpkg.com/en/docs/install#debian-stable).

### Install dependencies

This installs things like React which the frontend needs. You usually only need
to do this once after cloning the repo.

```bash
cd frontend
yarn
```

If everything worked, you'll see a `node_modules` directory, where the
dependencies were installed to.

### Start the frontend

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

## Older documentation

Setup with visdev test:

1.  Create Bucket pdfs on Minio Browser.

2.  Start: Depends on what mode you want to run:

    a) Database based: final version and good for backend updates run with:
    visdev test .  
    And use verify_pw method for verification in hellovis.py

    b) Without Database: for debugging front end: run with "visdev test ." in
    this directory, but also run "npm run start" in frontend folder (get there
    with "cd frontend") to run a static server which directly propagates all
    updates of the frontend Also use dummyVerify method in hellovis.py and don't
    run a browser with XSS enabled, thus on a mac you would start chrome like:

> open -a Google\ Chrome --args --disable-web-security --user-data-dir

**When going into production move to real ser.vis and change from dummyVerfiy to
verify_pw**
