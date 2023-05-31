# Automatically generated and manually modified on the 31. May 2023

import django.contrib.postgres.indexes
from django.db import migrations, models


class ConstrainedAlterField(migrations.AlterField):
    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        if self.constraint_exists(schema_editor, "document", "documents_document_slug_10ec7f96_uniq"):
            return
        return super().database_forwards(app_label, schema_editor, from_state, to_state)

    def constraint_exists(self, schema_editor, db_name, constraint):
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(
                (
                    "select 1 "
                    "from information_schema.constraint_column_usage "
                    f"where table_name = 'documents_{db_name}' "
                    f"and constraint_name = '{constraint}'"
                )
            )
            return cursor.fetchone() is not None


class ConstrainedAddIndex(migrations.AddIndex):
    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        if self.index_exists(schema_editor, 'documents_c_search__fb153e_gin'):
            return
        return super().database_forwards(app_label, schema_editor, from_state, to_state)

    def index_exists(self, schema_editor, index_name):
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(
                (
                    "select 1 "
                    "from pg_indexes "
                    f"where indexname = '{index_name}' "
                    f"and tablename = 'documents_comment' "
                )
            )
            return cursor.fetchone() is not None


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0009_rename_duplicate_documents'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='comment',
            name='documents_c_search__02d77d_gin',
        ),
        ConstrainedAlterField(
            model_name='document',
            name='slug',
            field=models.CharField(max_length=256, unique=True),
        ),
        ConstrainedAddIndex(
            model_name='comment',
            index=django.contrib.postgres.indexes.GinIndex(
                fields=['search_vector'], name='documents_c_search__fb153e_gin'),
        ),
    ]
