# Manually written on 2026/08/11

import django.db.models.deletion
from django.db import migrations, models

def populate_page_parents(apps, schema_editor):
    Page = apps.get_model('pages', 'Page')
    PageParent = apps.get_model('pages', 'PageParent')

    top_level_order = 0
    for page in Page.objects.all():
        for i, child in enumerate(page.children.all()):
            PageParent.objects.create(parent=page, child=child, order=i)

        if not page.parents.exists():
            # Create a PageParent with null parent for top-level pages
            PageParent.objects.create(parent=None, child=page, order=top_level_order)
            top_level_order += 1

class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0006_pagerevision_redacted'),
    ]


    operations = [
        migrations.CreateModel(
            name='PageParent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order', models.IntegerField(default=0)),
                ('child', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='child_links', to='pages.page')),
                ('parent', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='parent_links', to='pages.page')),
            ],
        ),
        migrations.RemoveField(
            model_name='page',
            name='parents',
        ),
        migrations.AddField(
            model_name='page',
            name='parents',
            field=models.ManyToManyField(related_name='children', through='pages.PageParent', to='pages.page'),
        ),
        migrations.RunPython(
            populate_page_parents,
            reverse_code=migrations.RunPython.noop,
        )
    ]
