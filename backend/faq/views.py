from faq.models import FAQuestion
from util import response
from myauth import auth_check
from myauth.models import get_my_user, MyUser
from categories.models import Category, MetaCategory
from django.conf import settings
from django.shortcuts import get_object_or_404


@auth_check.require_login
def list_faq(request):
    res = [
        {
            'oid': q.pk,
            'question': q.question,
            'answer': q.answer,
            'order': q.order,
        } for q in FAQuestion.objects.order_by('order').all()
    ]
    return response.success(value=res)


@auth_check.require_admin
@response.args_post('question', 'answer', 'order')
def add_faq(request):
    faq = FAQuestion(
        question=request.POST['question'],
        answer=request.POST['answer'],
        order=int(request.POST['order']),
    )
    faq.save()
    return response.success(value=faq.pk)


@auth_check.require_admin
@response.args_post('question', 'answer', 'order')
def set_faq(request, id):
    faq = get_object_or_404(FAQuestion, pk=id)
    faq.question = request.POST['question']
    faq.answer = request.POST['answer']
    faq.order = request.POST['order']
    faq.save()
    return response.success()


@auth_check.require_admin
@response.args_post()
def remove_faq(request, id):
    faq = get_object_or_404(FAQuestion, pk=id)
    faq.delete()
    return response.success()
