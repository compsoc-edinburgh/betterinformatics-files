# Manually merged migration for all upstream changes until 20260731

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def normalise_order(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    DocumentFile = apps.get_model("documents", "DocumentFile")

    for document in Document.objects.all():
        document_files = document.files.order_by("order")

        for order, file in enumerate(document_files):
            file.order = order

        DocumentFile.objects.bulk_update(document_files, ["order"])


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0018_20260428_merge_upstream_mark_as_ai"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Originally from normalise_documentfile_order
        migrations.RunPython(normalise_order, migrations.RunPython.noop),

        # Originally from document_transfer_ownership
        migrations.AddField(
            model_name="document",
            name="pending_transfer_user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="pending_document_transfer_receive_requests",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
