import io
from minio import Minio

print("making minio client")
minioClient = Minio(os.environ['RUNTIME_MINIO_SERVER'],
                    access_key=os.environ['RUNTIME_MINIO_ACCESS_KEY'],
                    secret_key=os.environ['RUNTIME_MINIO_SECRET_KEY'],
                    secure=False)

print("listing files")
files = list(minioClient.list_objects("pdfs", prefix=filename))
print(files)

print("making data")
data = io.BytesIO(b"walrus")
print("starting put object", data.getbuffer().nbytes)
minioClient.put_object("pdfs", "testfile", data, data.getbuffer().nbytes)
print("put object done")