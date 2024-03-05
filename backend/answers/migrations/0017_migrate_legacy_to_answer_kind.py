from django.conf import settings
from django.db import migrations, models

def migrate_to_answer_kinds(apps, schema_editor):
    Answer = apps.get_model("answers", "Answer")
    Answer.objects.filter(is_legacy_answer=True).update(kind='legacy')

def reverse_answer_kinds(apps, schema_editor):
    Answer = apps.get_model("answers", "Answer")
    Answer.objects.filter(kind='legacy').update(is_legacy_answer=True)


class Migration(migrations.Migration):

    dependencies = [
        ('scoreboard', '0004_add_answer_scores'),
        ('answers', '0016_remove_exam_finished_wiki_transfer_and_more'),
    ]

    scoreboard_sql = """
    DROP VIEW scoreboard_userscore;
    CREATE VIEW scoreboard_userscore (id, user_id, upvotes, downvotes, document_likes, answers, legacy, official, cuts, documents, comments) AS
        SELECT au.id as id,
        au.id AS user_id,
        COALESCE(auv.count, 0) AS auv_count,
        COALESCE(adv.count, 0) AS adv_count,
        COALESCE(dv.count, 0) AS dv_count,
        COALESCE(aa.count, 0) AS aa_count,
        COALESCE(al.count, 0) AS al_count,
        COALESCE(ao.count, 0) AS ao_count,
        COALESCE(aas.count, 0) AS aas_count,
        COALESCE(dd.count, 0) AS dd_count,
        COALESCE(ac.count, 0) AS ac_count
        FROM auth_user au
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count
            FROM answers_answer_upvotes aav
            INNER JOIN answers_answer aa ON (aa.id = aav.answer_id)
            WHERE aa.kind = 'personal'
            GROUP by aa.author_id
        ) auv ON (auv.id = au.id)
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count
            FROM answers_answer_downvotes aav
            INNER JOIN answers_answer aa ON (aa.id = aav.answer_id)
            WHERE aa.kind = 'personal'
            GROUP by aa.author_id
        ) adv ON (adv.id = au.id)
        LEFT JOIN (SELECT dd.author_id as id, COUNT(*) as count
            FROM documents_document_likes ddl
            INNER JOIN documents_document dd ON(ddl.document_id = dd.id)
            GROUP BY dd.author_id
        ) dv ON (dv.id = au.id)
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count 
            FROM answers_answer aa 
            WHERE aa.kind = 'personal'
            GROUP BY aa.author_id
        ) aa ON (aa.id = au.id)
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count 
            FROM answers_answer aa 
            WHERE aa.kind = 'legacy'
            GROUP BY aa.author_id
        ) al ON (al.id = au.id)
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count 
            FROM answers_answer aa 
            WHERE aa.kind = 'official'
            GROUP BY aa.author_id
        ) ao ON (ao.id = au.id) 
        LEFT JOIN (SELECT aas.author_id as id, COUNT(*) as count 
            FROM answers_answersection aas 
            GROUP BY aas.author_id
        ) aas ON (aas.id = au.id) 
        LEFT JOIN (SELECT dd.author_id as id, COUNT(*) as count 
            FROM documents_document dd 
            GROUP BY dd.author_id
        ) dd ON (dd.id = au.id) 
        LEFT JOIN (SELECT ac.author_id as id, COUNT(*) as count 
            FROM answers_comment ac 
            GROUP BY ac.author_id
        ) ac ON (ac.id = au.id) 
        ORDER BY auv_count desc;
    """

    reverse_scoreboard_sql = """
    DROP VIEW scoreboard_userscore;
    CREATE VIEW scoreboard_userscore (id, user_id, upvotes, downvotes, document_likes, answers, legacy, cuts, documents, comments) AS
        SELECT au.id as id,
        au.id AS user_id,
        COALESCE(auv.count, 0) AS auv_count,
        COALESCE(adv.count, 0) AS adv_count,
        COALESCE(dv.count, 0) AS dv_count,
        COALESCE(aa.count, 0) AS aa_count,
        COALESCE(al.count, 0) AS al_count,
        COALESCE(aas.count, 0) AS aas_count,
        COALESCE(dd.count, 0) AS dd_count,
        COALESCE(ac.count, 0) AS ac_count
        FROM auth_user au
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count
            FROM answers_answer_upvotes aav
            INNER JOIN answers_answer aa ON (aa.id = aav.answer_id)
            WHERE aa.is_legacy_answer = false
            GROUP by aa.author_id
        ) auv ON (auv.id = au.id)
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count
            FROM answers_answer_downvotes aav
            INNER JOIN answers_answer aa ON (aa.id = aav.answer_id)
            WHERE aa.is_legacy_answer = false
            GROUP by aa.author_id
        ) adv ON (adv.id = au.id)
        LEFT JOIN (SELECT dd.author_id as id, COUNT(*) as count
            FROM documents_document_likes ddl
            INNER JOIN documents_document dd ON(ddl.document_id = dd.id)
            GROUP BY dd.author_id
        ) dv ON (dv.id = au.id)
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count 
            FROM answers_answer aa 
            WHERE aa.is_legacy_answer = false
            GROUP BY aa.author_id
        ) aa ON (aa.id = au.id) 
        LEFT JOIN (SELECT aa.author_id as id, COUNT(*) as count 
            FROM answers_answer aa 
            WHERE aa.is_legacy_answer = true
            GROUP BY aa.author_id
        ) al ON (al.id = au.id) 
        LEFT JOIN (SELECT aas.author_id as id, COUNT(*) as count 
            FROM answers_answersection aas 
            GROUP BY aas.author_id
        ) aas ON (aas.id = au.id) 
        LEFT JOIN (SELECT dd.author_id as id, COUNT(*) as count 
            FROM documents_document dd 
            GROUP BY dd.author_id
        ) dd ON (dd.id = au.id) 
        LEFT JOIN (SELECT ac.author_id as id, COUNT(*) as count 
            FROM answers_comment ac 
            GROUP BY ac.author_id
        ) ac ON (ac.id = au.id) 
        ORDER BY auv_count desc;
    """

    operations = [
        migrations.AddField(
            model_name='answer',
            name='kind',
            field=models.CharField(choices=[('personal', 'Personal'), ('legacy', 'Legacy'), ('official', 'Official')], default='personal', max_length=16),
        ),
        migrations.RunPython(migrate_to_answer_kinds, reverse_answer_kinds),
        migrations.RunSQL(scoreboard_sql, reverse_scoreboard_sql),
        migrations.RemoveField(
            model_name='answer',
            name='is_legacy_answer',
        ),
    ]
