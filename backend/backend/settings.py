"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 3.0.2.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import os
import sys

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

DEBUG = os.environ.get("IS_DEBUG", "false").lower() == "true"
SECURE = not DEBUG
IN_ENVIRON = "SIP_POSTGRES_DB_SERVER" in os.environ
TESTING = sys.argv[1:2] == ["test"]

SECRET_KEY = (
    "VERY SAFE SECRET KEY"
    if DEBUG
    else os.environ.get(
        "RUNTIME_COMMUNITY_SOLUTIONS_SESSION_SECRET", "VERY SAFE SECRET KEY"
    )
)
API_KEY = (
    "API_KEY" if DEBUG else os.environ.get(
        "RUNTIME_COMMUNITY_SOLUTIONS_API_KEY", "")
)
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

COMSOL_UPLOAD_FOLDER = "intermediate_pdf_storage"
COMSOL_EXAM_DIR = "exams/"
COMSOL_SOLUTION_DIR = "solutions/"
COMSOL_DOCUMENT_DIR = "documents/"
COMSOL_IMAGE_DIR = "imgs/"
COMSOL_FILESTORE_DIR = "files/"
COMSOL_EXAM_ALLOWED_EXTENSIONS = {"pdf"}
COMSOL_DOCUMENT_ALLOWED_EXTENSIONS = {
    (".pdf", "application/pdf"),
    (".tex", "application/x-tex"),
    (".tex", "text/x-tex"),
    (".md", "application/octet-stream"),
    (".md", "text/markdown"),
    (".md", "text/x-markdown"),
    (".txt", "text/plain"),
    (".zip", "application/zip"),
    (".zip", "application/octet-stream"),
    (".zip", "multipart/x-zip"),
    (".zip", "application/zip-compressed"),
    (".zip", "application/x-zip-compressed"),
    (".apkg", "application/octet-stream"),  # anki
    (".colpkg", "application/octet-stream"),  # anki collection
    (
        ".docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    (".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    (
        ".pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ),
    (".epub", "application/epub+zip"),
}
COMSOL_IMAGE_ALLOWED_EXTENSIONS = {
    "jfif", "jpg", "jpeg", "png", "svg", "gif", "webp"}
COMSOL_FILESTORE_ALLOWED_EXTENSIONS = {"pdf", "zip", "tar.gz", "tar.xz"}
COMSOL_CATEGORY_SLUG_CHARS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
)
COMSOL_DOCUMENT_SLUG_CHARS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-"
)

COMSOL_AUTH_ACCEPTED_DOMAINS = "sms.ed.ac.uk"
COMSOL_AUTH_ADMIN_UUNS = os.environ.get("ADMIN_UUNS", "").split(",")

COMSOL_AUTH_BANNED_USERS = os.environ.get("BANNED_USERS", "").split(",")

# The public / private key path in the testing directory should only be
# used for unit testing and nothing else. For production, the keys are
# generated at runtime by cinit. Restarting the backend will invalidate all
# existing tokens, but this isn't really a large problem except for the
# small inconvenience of all users having to log in again.
jwt_private_key_path = (
    "testing/jwtRS256.key"
    if TESTING
    else os.environ.get("RUNTIME_JWT_PRIVATE_KEY_PATH", "")
)
jwt_public_key_path = (
    "testing/jwtRS256.key.pub"
    if TESTING
    else os.environ.get("RUNTIME_JWT_PUBLIC_KEY_PATH", "")
)

# Use keys (and thus RS256 for JWT instead of HS256) if both keys are provided.
# Otherwise, use a symmetric key (empty string).
JWT_USE_KEYS = jwt_private_key_path and jwt_public_key_path
JWT_PRIVATE_KEY = (
    "" if not jwt_private_key_path else open(jwt_private_key_path, "rb").read()
)
JWT_PUBLIC_KEY = (
    "" if not jwt_public_key_path else open(jwt_public_key_path, "rb").read()
)

# If we don't have a Gsuite credentials file (e.g. during local dev), use the
# dummy email backend that will write emails to console.
if os.environ.get("GSUITE_CREDENTIALS_FILE", "") == "":
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    # Use django-suite-email (which allows us to use the GSuite SMTP server for
    # the send_mail function), set the backend and credential file.
    EMAIL_BACKEND = "django_gsuite_email.GSuiteEmailBackend"
    GSUITE_CREDENTIALS_FILE = os.environ.get("GSUITE_CREDENTIALS_FILE", "")
    # Below: Required fields for django_gsuite_email (v0.1.4)
    GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
    GMAIL_USER = None

# The address in the From field must be a valid user address (not a
# group address or non-existent address) that the provided credential
# file has access to. If the credential was created for an organisation,
# you must enable "domain-wide delegation" or impersonation for the
# associated service account in GSuite Admin Console, with the following
# as the scope: "https://www.googleapis.com/auth/gmail.send"
VERIF_CODE_FROM_EMAIL_ADDRESS = os.environ.get(
    "VERIF_CODE_FROM_EMAIL_ADDRESS", "")

FRONTEND_SERVER_DATA = {
    "title_prefix": os.environ.get("FRONTEND_TITLE_PREFIX", ""),
    "title_suffix": os.environ.get("FRONTEND_TITLE_SUFFIX", ""),
    "email_address": os.environ.get("FRONTEND_EMAIL_ADDRESS", ""),
    "imprint": os.environ.get("FRONTEND_IMPRINT", ""),
    "privacy_policy": os.environ.get("FRONTEND_PRIVACY_POLICY", ""),
}

FAVICON_URL = os.environ.get("FRONTEND_FAVICON_URL", "/favicon.ico")
IS_PREVIEW = os.environ.get("PDEP_IS_PREVIEW", "") == "TRUE"

DEPLOYMENT_DOMAINS = os.environ.get("DEPLOYMENT_DOMAINS", "").split(",")

ALLOWED_HOSTS = []
REAL_ALLOWED_HOSTS = []
if DEBUG:
    ALLOWED_HOSTS.append("localhost")
    REAL_ALLOWED_HOSTS.append("localhost")
else:
    # USE_X_FORWARDED_HOST = True
    # In K8s, the host is the IP of the pod and can thus change
    # As we are behind a reverse proxy, it should be fine to ignore this...
    ALLOWED_HOSTS.append("*")
    REAL_ALLOWED_HOSTS = DEPLOYMENT_DOMAINS

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Set up Content Security Policy so only .js files from the frontend /static
# path (and inline ones) are allowed to be executed. We also assume HTTPS.
CSP_DEFAULT_SRC = "'self'"
allowed_script_sources = []
if DEBUG:
    allowed_script_sources = [
        f"http://{host}:8080/static/" for host in REAL_ALLOWED_HOSTS
    ]
else:
    allowed_script_sources = [
        f"https://{host}/static/" for host in REAL_ALLOWED_HOSTS]
CSP_SCRIPT_SRC = (
    "'unsafe-eval'",
    *allowed_script_sources,
)
CSP_STYLE_SRC = (
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
)
CSP_FONT_SRC = ("'self'", "data:", "https://fonts.gstatic.com")
CSP_FRAME_SRC = ("'self'", "https://minio.on.tardis.ac:80")

s3_host = os.environ.get("SIP_S3_FILES_HOST", "s3")
s3_port = os.environ.get("SIP_S3_FILES_PORT", "9000")
CSP_CONNECT_SRC = (
    "'self'",
    "https://" + s3_host + ":" + s3_port,
    "http://" + s3_host + ":" + s3_port,
    # Allow fetch()-ing and rendering Markdown files from BetterInformatics
    # (assumption being that they are relatively safe -- if they contain XSS,
    # the Markdown renderer should prevent it from being executed)
    "https://raw.githubusercontent.com/compsoc-edinburgh/betterinformatics/master/_sections/",
    "https://betterinformatics.com/courses.json",
)
CSP_IMG_SRC = (
    "'self'",
    "data:",
    "https://betterinformatics.com/static/img/",  # for the camel image
    "https://comp-soc.com/static/img/",  # for the compsoc logo
    "https://raw.githubusercontent.com/compsoc-edinburgh/",  # for anything else
)


# Application definition

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "answers.apps.AnswersConfig",
    "documents.apps.DocumentsConfig",
    "categories.apps.CategoriesConfig",
    "favourites.apps.FavouritesConfig",
    "faq.apps.FaqConfig",
    "feedback.apps.FeedbackConfig",
    "filestore.apps.FilestoreConfig",
    "frontend.apps.FrontendConfig",
    "health.apps.HealthConfig",
    "images.apps.ImagesConfig",
    "ediauth",
    "util.apps.UtilConfig",
    "notifications.apps.NotificationsConfig",
    "scoreboard.apps.ScoreboardConfig",
    "testing.apps.TestingConfig",
    "django_probes",
    "dissertations.apps.DissertationsConfig",
] + (["django_gsuite_email"] if "django_gsuite_email" in EMAIL_BACKEND else [])

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "ediauth.auth_backend.AuthenticationMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "csp.middleware.CSPMiddleware",
    "util.middleware.parse_request_middleware",
    "util.middleware.last_user_activity_middleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

if DEBUG and not TESTING:
    MIDDLEWARE.append("backend.debugging.db_profiling_middleware")

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": not DEBUG,
    "formatters": {
        "simple": {
            "format": "[{levelname}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
            "stream": sys.stdout,
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO" if DEBUG else "WARNING",
        },
    },
}

WSGI_APPLICATION = "backend.wsgi.application"

# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

if "SIP_POSTGRES_DB_NAME" in os.environ:
    DATABASES = {
        "default": {
            "ENGINE": "django_prometheus.db.backends.postgresql",
            "NAME": os.environ["SIP_POSTGRES_DB_NAME"],
            "USER": os.environ["SIP_POSTGRES_DB_USER"],
            "PASSWORD": os.environ["SIP_POSTGRES_DB_PW"],
            "HOST": os.environ["SIP_POSTGRES_DB_SERVER"],
            "PORT": os.environ["SIP_POSTGRES_DB_PORT"],
            "CONN_MAX_AGE": 0,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.dummy",
        }
    }
    print("Warning: no database configured!")


# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = []

AUTHENTICATION_BACKENDS = []

# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = False

USE_L10N = False

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/

STATIC_URL = "/static/"
