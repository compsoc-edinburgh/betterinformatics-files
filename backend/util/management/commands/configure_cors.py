import logging

from botocore.exceptions import ClientError
from django.conf import settings
from django.core.management.base import BaseCommand
from util.s3_util import s3, s3_bucket_name

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **options):
        s3_bucket_cors = s3.BucketCors(s3_bucket_name)
        try:
            s3_bucket_cors.put(
                CORSConfiguration={
                    "CORSRules": [
                        {
                            "AllowedOrigins": [
                                "https://" + domain
                                for domain in settings.DEPLOYMENT_DOMAINS
                            ],
                            "AllowedHeaders": ["Range"],
                            "AllowedMethods": ["GET"],
                            "ExposeHeaders": ["Accept-Ranges"],
                            "MaxAgeSeconds": 3000,
                        }
                    ]
                }
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "NotImplemented":
                logger.warning(
                    "The S3 server doesn't support put-bucket-cors - this is fine if you are using minio"
                )
            else:
                logger.error("put-bucket-cors failed: %s", e.response["Error"]["Code"])
