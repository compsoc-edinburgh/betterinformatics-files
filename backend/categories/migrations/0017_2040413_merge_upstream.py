from django.db import migrations


def add_default_category_if_not_exists(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    Type = apps.get_model('categories', 'Category')
    Type.objects.using(db_alias).get_or_create(slug='default', defaults={'displayname':'default', 'permission': 'hidden'})


class Migration(migrations.Migration):
    replaces = [("categories", "0011_add_default_category_if_not_exists")]

    dependencies = [
        ('categories', '0016_euclidcode'),
    ]

    operations = [
        migrations.RunPython(add_default_category_if_not_exists)
    ]
