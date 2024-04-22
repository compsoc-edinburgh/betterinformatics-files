from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("categories", "0011_add_default_category_if_not_exists"),
        ("documents", "0001_initial"),
    ]

    # The subquery contains all answer_section ids with at least one answer. By doing a left join on it
    # we have a new column sub.answer_section_id which is non-null iff the answer_section has at least one
    # answer.
    #
    # In the main query we simply join the answer_sections table on the sub.answer_section_id column, grouping by
    # the exam id.
    #
    # COUNT(aas.id) counts the total number of answer_sections with answers enabled.
    # COUNT(sub.answer_section_id) will only count those that have an answer.
    sql = """
    DROP VIEW categories_categorymetadata;
    CREATE VIEW categories_categorymetadata (id, category_id, documentcount, examcount_public, examcount_answered, total_cuts, answered_cuts) AS
        SELECT row_number() OVER () as id,
            cc.id AS category_id,
            (SELECT COUNT(*) FROM documents_document dd WHERE (dd.category_id = cc.id)),
            (SELECT COUNT(*) FROM answers_exam ae WHERE (ae.category_id = cc.id AND ae.public = true)),
            (SELECT COUNT(*) FROM answers_exam ae WHERE (ae.category_id = cc.id AND ae.public=true AND EXISTS (
                SELECT aa.id FROM answers_answer aa INNER JOIN answers_answersection aas ON (aa.answer_section_id = aas.id) WHERE aas.exam_id = ae.id
            ))),
            (SELECT COUNT(*) FROM answers_answersection aas INNER JOIN answers_exam ae ON (aas.exam_id = ae.id) WHERE (ae.category_id = cc.id AND ae.public = true AND aas.has_answers = true)),
            (SELECT COUNT(*) FROM answers_answersection aas INNER JOIN answers_exam ae ON (aas.exam_id = ae.id) WHERE (ae.category_id = cc.id AND ae.public = true AND aas.has_answers = true AND EXISTS (
                SELECT aa.id FROM answers_answer aa WHERE aa.answer_section_id = aas.id
            )))
        FROM categories_category cc
    ;
    """

    reverse_sql = """
    DROP VIEW categories_categorymetadata;
    CREATE VIEW categories_categorymetadata (id, category_id, examcount_public, examcount_answered, total_cuts, answered_cuts) AS
        SELECT row_number() OVER () as id,
            cc.id AS category_id,
            (SELECT COUNT(*) FROM answers_exam ae WHERE (ae.category_id = cc.id AND ae.public = true)),
            (SELECT COUNT(*) FROM answers_exam ae WHERE (ae.category_id = cc.id AND ae.public=true AND EXISTS (
                SELECT aa.id FROM answers_answer aa INNER JOIN answers_answersection aas ON (aa.answer_section_id = aas.id) WHERE aas.exam_id = ae.id
            ))),
            (SELECT COUNT(*) FROM answers_answersection aas INNER JOIN answers_exam ae ON (aas.exam_id = ae.id) WHERE (ae.category_id = cc.id AND ae.public = true AND aas.has_answers = true)),
            (SELECT COUNT(*) FROM answers_answersection aas INNER JOIN answers_exam ae ON (aas.exam_id = ae.id) WHERE (ae.category_id = cc.id AND ae.public = true AND aas.has_answers = true AND EXISTS (
                SELECT aa.id FROM answers_answer aa WHERE aa.answer_section_id = aas.id
            )))
        FROM categories_category cc
    ;
    """

    operations = [
        migrations.RunSQL(sql, reverse_sql)
    ]
