# Community Solutions

[[_TOC_]]

---

# Local Development

## Mise

We heavily recommend [Mise](https://mise.jdx.dev/installing-mise.html) for
toolchain management. Mise allows you to easily download all the correctly
versioned tools into the project directory (no need to worry about it cluttering
your system or messing up other paths).

- On MacOS, `brew install mise`
- On Windows, `winget install mise`
- On other systems, follow the installation guide linked above.

Once Mise is installed:

- On MacOS/Linux, add the `eval "$(mise activate <shell>)"` line to your shell
  config
- On Windows, add `%localappdata%\mise\shims` to your PATH

Finally, run `mise install` in the Community Solutions source directory to
install the required tools.

_NOTE: Non-essential tools you need can be added to `mise.local.toml`._

## Terminal Setup

The main way to develop is to have three separate terminals:

- One for the frontend using node (yarn) with hot-reload
- One for the backend using python (uv) with hot-reload
- One for running the remaining services like PostgreSQL/rclone with docker-compose

Start the terminals in the following order to ensure a correct startup.

#### Terminal 1 : Services

You will need **Docker Compose** to start up any extra services. See the
[official install instructions](https://docs.docker.com/compose/install/) for
detailed explanation of how to install Docker.

This will start up required services, like a local postgres and rclone S3 server.
The first time around this can take a while to start up.

```sh
docker compose up postgres rclone rclone-create-bucket
```

Key things to look for:

- Is postgres running successfully? Look for the following lines:
  ```sh
  postgres  | 2026-02-18 11:03:51.926 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
  ...
  postgres  | 2026-02-18 11:03:51.936 UTC [1] LOG:  database system is ready to accept connections
  ```
- Is rclone running successfully?
  ```sh
  rclone-1  | 2026/04/25 21:45:55 NOTICE: Warning: Allow origin set to *. This can cause serious security problems.
  rclone-1  | 2026/04/25 21:45:55 NOTICE: Local file system at /data: Starting s3 server on [http://[::]:9000/]
  ```

#### Terminal 2 : Backend

The backend is a django python app. You have to enter the `backend` directory to
work on it. We use `uv` for Python package management (which should be installed
by Mise automatically).

By using `uv run manage.py` (instead of just `python manage.py`) it ensures that
you always have the correct (versioned) dependencies installed locally.

The `migrate` command runs the required database migrations. It is only required
on first launch or if there are any database schema changes.

The `runserver` command starts up the django app with hot-reload. Saving a file
will restart the server automatically without you having to rerun the command.

```sh
cd backend
mkdir -p intermediate_pdf_storage
uv run manage.py migrate # only on first run, or if DB schema changed
uv run manage.py runserver 127.0.0.1:8081
```

The backend now runs locally on port `8081`.

#### Terminal 3 : Frontend

The frontend is a react app. You have to enter the `frontend` directory to work
on it. We use `yarn` for Node package management (which should be installed by
Mise automatically).

The `yarn` command only needs to be rerun if any dependencies change or are updated.

```sh
cd frontend
yarn # only if any Node dependencies changed
yarn start --host
```

Website is now accessible at http://localhost:3000

---

## Alternative Docker-Compose Setup

If desired, the backend (`Terminal 2`) and frontend (`Terminal 3`) can be launched using docker-compose.

This method is less flexible than running it fully locally, so prefer the above setup.

> ## IMPORTANT
>
> When running the backend with docker-compose, you **HAVE** to add `rclone` to your `/etc/hosts` or else documents won't work on the frontend (this is not required if fully using mise)!
>
> - Edit your host file at `/etc/hosts` to include the line `127.0.0.1 rclone`.
>   This will allow your browser to get documents directly from rclone.

If you want to run the _backend_ in docker-compose, remove the targets for the docker compose command for `Terminal 1` and simply run:

```sh
docker compose up
```

If you want to additionally run the _frontend_ in docker-compose, add the `--profile frontend` flag to the docker-compose command from `Terminal 1` (the flag **HAS** to come before the `up`).

```sh
docker compose --profile frontend up
# or if you ONLY want the frontend without backend:
# docker compose up react-frontend postgres rclone rclone-create-bucket
```

If you are too lazy to type it every time, create a `.env` file in this directory and add the line `COMPOSE_PROFILES=frontend`.

---

# Additional Information and Resources

This section is not directly relevant for getting the local development setup running, but can be beneficial to read into to learn more about the tools used and further resources to look into.

## Pre-commit hooks

There are pre-commit hooks for the frontend and backend for formatting code.
If you have run `mise install` already, then running `prek install` will setup
your local `.git/hooks/pre-commit` to automatically perform formatting when
committing code.

## Frontend

The frontend is built using
[Vite](https://vitejs.dev/). This is like a
compiler toolchain, which combines Javascript files and provides a server with
special development features. Start the dev server with.

### Editing frontend code

There is an autoformatter for the frontend code
([prettier](https://prettier.io/)). It can be run once using `yarn run format`.
Some aspects of code quality and coding style are checked automatically using
[eslint](https://eslint.org). You can run eslint using `yarn run lint`. There are plugins
for most editors so that you can see warnings and errors as you type.

---

## Testing

To fill the website with users, exams and documents, you would run the following (but read on below, before executing the command):

```bash
cd backend
uv run manage.py create_testdata
```

This requires you to have all the Python libraries like Django installed. To circumvent
that, you can also start your backend, then access the terminal of the container
and execute the command there. This has the bonus that your container will already have
all the required packages installed.

1. Start your backend as noted above.
2. Execute `docker exec -it community-solutions /bin/bash` to access the container.
3. Enter the app directory (`cd /app`) and execute `uv run manage.py create_testdata`

**Note:** It is normal for this to take some time (~10 mins). Do **not** open your frontend when running this command.
This will result in a null pointer exception. It's best to simply stop the frontend process while the test data is being added.

---

## Observability

### Start showcase infrastructure

Sometimes, it is helpful to have just a little bit more data at disposal, to monitor applications or to debug performance issues.
We provide a "simple" setup that automatically gathers all information (traces, metrics & logs) for local setup, including Grafana.
Interesting Grafana dashboard should also be shipped in `./contrib` to allow fairly easy deployments of such advanced features.

To try, run

```bash
# For running frontend in docker:
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile frontend up --build

# For running frontend locally:
docker compose -f docker-compose.yml -f docker-compose.observability.yml up --build
yarn start-with-faro
```

Now you can access:

- Community solutions frontend on [localhost:3000](http://localhost:3000)
- Grafana / Monitoring data on [localhost:3001](http://localhost:3001)

For Grafana, look at the sidebar, search for "Explore" and "Drilldown" and "Traces". There, you can have a quick overview. You can select appropriate traces, which usually start in the browser of the user, then to the backend where multiple DB queries are started. There are many other things you can do with the data and other ways to query for it, familiarize yourself with Grafana, Prometheus, Tempo, Loki, (Pyroscope)... if interested:)

### What is observability

In short, there are 3 important kinds of data that we focus on: logs, metrics and traces. Logs are simply error (warning, info, ...) logs that you usually see in the console. Metrics are usually just numbers in a time interval, such as number of get requests in the last minute, and so on. Traces are more involved, and they focus on interactions between microservices, requests, queries and so on. They contain start and end times, but also additional information (such as an exact query or URL).

There are also profiles, however these are more familiar from local debugging and performance testing and have been rarer to find in production at scale. Hence, while not as integrated as other data, it too can be measured and provide valuable insights.

### Used components

Behind the scenes, the following components are used:

- Faro: SDK used by frontend for collecting traces (e.g. browser stats, client fetch, console logs etc)
- Alloy: A component that exposes an endpoint that Faro can push its data to. While unused, it also has builtin exporters, receivers, processors for many kinds of data.
- Tempo: "Database" storing traces, which Alloy will forward received traces to. They can be received via the TraceQL query language.
- Loki: "Database" storing logs, which Alloy will forward logs to. They can be received via the LogQL query language.
- Prometheus: "Database" storing metrics. It too can either receive data from Alloy, or scrape data itself. The metrics can be received via the PromQL query language.
- Pyroscope: "Database" storing profiles at scale. The Django backend directly pushes its generated profiles to Pyroscope.
- Grafana: Visualization of all data, can be used to build dashboards to view applications status at a glance or in great detail.

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
  Is the backend running without errors? The backend
  is configured to listen on port 8081. You should be able to see something
  on <http://localhost:8081/> (no HTTP**S**). If not, something is wrong with
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
  fix the problem, you can also delete the Postgres folder `data/sql` which will
  force the Postgres service to completely build the database from scratch.

- **`UnknownErrorException` when accessing exams/documents:** This is very likely
  caused by rclone not being in your hosts file. Your browser gets an url with rclone
  as the host, but if rclone is not in your hosts file, it won't be redirected correctly.

# The important bits

The pipeline is managed by [Preview Deployment Manager](https://gitlab.ethz.ch/vseth/0403-isg/sip-sip-apps/pdep). It uses Webhooks to build and deploy upon merge requests. PDep interacts with TeamCity, and schedules the actual jobs on there. As CIT / CAT member you should be able to see the TeamCity project and see pipeline status & logs as well as re-run it. It sometimes happens that the pipeline fails because of Out-Of-Memory issues, you can usually just restart it and run again if that is the case.

# License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>
