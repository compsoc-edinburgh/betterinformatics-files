# Manually written on 2026/08/17

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("categories", "0019_coursestats_course_organiser"),
    ]

    # Adds answered_bits: it is a binary string (NOT a bitstring) of ordered
    # answer sections with answers (1) or not (0)
    sql = """
    CREATE OR REPLACE VIEW categories_examcounts (id, exam_id, count_cuts, count_answered, answered_bits) AS
        SELECT
            CAST(ae.id AS bigint),
            ae.id,
            COUNT(aas.id) FILTER (WHERE aas.has_answers),
            COUNT(sub.answer_section_id),
            (
                SELECT COALESCE(string_agg(
                    CASE WHEN EXISTS (
                        SELECT 1 FROM answers_answer aa WHERE aa.answer_section_id = aas2.id
                    ) THEN '1' ELSE '0' END,
                    ''
                    ORDER BY aas2.page_num, aas2.rel_height
                ), '')
                FROM answers_answersection aas2
                WHERE aas2.exam_id = ae.id AND aas2.has_answers
            )
        FROM answers_exam ae
        LEFT JOIN answers_answersection aas ON aas.exam_id = ae.id
        LEFT JOIN (
            SELECT answer_section_id
            FROM answers_answer aa
            GROUP BY aa.answer_section_id
        ) sub ON sub.answer_section_id = aas.id
        GROUP BY ae.id
    ;
    """

    reverse_sql = """
    CREATE OR REPLACE VIEW categories_examcounts (id, exam_id, count_cuts, count_answered) AS
        SELECT CAST(ae.id AS bigint), ae.id, COUNT(aas.id) FILTER (WHERE aas.has_answers), COUNT(sub.answer_section_id)
        FROM answers_exam ae
        LEFT JOIN answers_answersection aas ON aas.exam_id = ae.id
        LEFT JOIN (
            SELECT answer_section_id
            FROM answers_answer aa
            GROUP BY aa.answer_section_id
        ) sub ON sub.answer_section_id = aas.id
        GROUP BY ae.id
    ;
    """

    operations = [migrations.RunSQL(sql, reverse_sql)]
