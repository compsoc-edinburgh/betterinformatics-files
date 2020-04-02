from faq.models import FAQuestion
from util import response
from myauth import auth_check
from myauth.models import get_my_user, MyUser
from categories.models import Category, MetaCategory
from django.conf import settings
from django.shortcuts import get_object_or_404


@response.request_get()
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


@response.request_post('question', 'answer', 'order')
@auth_check.require_admin
def add_faq(request):
    faq = FAQuestion(
        question=request.POST['question'],
        answer=request.POST['answer'],
        order=int(request.POST['order']),
    )
    faq.save()
    return response.success(value=faq.pk)


@response.request_post('question', 'answer', 'order')
@auth_check.require_admin
def set_faq(request, id):
    faq = get_object_or_404(FAQuestion, pk=id)
    faq.question = request.POST['question']
    faq.answer = request.POST['answer']
    faq.order = request.POST['order']
    faq.save()
    return response.success()


@response.request_post()
@auth_check.require_admin
def remove_faq(request, id):
    faq = get_object_or_404(FAQuestion, pk=id)
    faq.delete()
    return response.success()
