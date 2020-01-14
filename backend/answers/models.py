from django.db import models


class Exam(models.Model):
    filename = models.CharField(max_length=256)
    displayname = models.CharField(max_length=256)
    category = models.ForeignKey('categories.Category', null=True, on_delete=models.SET_NULL)
    exam_type = models.ForeignKey('ExamType', null=True, on_delete=models.SET_NULL)
    remark = models.TextField()
    resolve_alias = models.CharField(max_length=256)

    public = models.BooleanField()
    finished_cuts = models.BooleanField()
    finished_wiki_transfer = models.BooleanField()
    needs_payment = models.BooleanField()

    import_claim = models.ForeignKey('auth.User', related_name='import_claim_set', null=True, on_delete=models.SET_NULL)
    import_claim_time = models.DateTimeField()

    is_printonly = models.BooleanField()

    has_solution = models.BooleanField()
    solution_printonly = models.BooleanField()
    master_solution = models.CharField(max_length=512)
    legacy_solution = models.CharField(max_length=512)

    is_oral_transcript = models.BooleanField()
    oral_transcript_uploader = models.ForeignKey('auth.User', related_name='oral_transcript_set', null=True, on_delete=models.SET_NULL)
    oral_transcript_checked = models.BooleanField()


class ExamType(models.Model):
    displayname = models.CharField(max_length=256)


class AnswerSection(models.Model):
    exam = models.ForeignKey('Exam', on_delete=models.CASCADE)
    author = models.ForeignKey('auth.User', null=True, on_delete=models.SET_NULL)
    page_num = models.IntegerField()
    rel_height = models.FloatField()
    cut_version = models.IntegerField(default=1)


class Answer(models.Model):
    answer_section = models.ForeignKey('AnswerSection', on_delete=models.CASCADE)
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    text = models.TextField()
    time = models.DateTimeField()
    edittime = models.DateTimeField()
    upvotes = models.ManyToManyField('auth.User', related_name='upvoted_answer_set')
    downvotes = models.ManyToManyField('auth.User', related_name='downvoted_answer_set')
    expertvotes = models.ManyToManyField('auth.User', related_name='expertvote_answer_set')


class Comment(models.Model):
    answer = models.ForeignKey('Answer', on_delete=models.CASCADE)
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    text = models.TextField()
    time = models.DateTimeField()

