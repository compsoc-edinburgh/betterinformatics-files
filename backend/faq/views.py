from faq.models import FAQuestion
from util import response
from myauth import auth_check
from django.views import View
from django.shortcuts import get_object_or_404


def get_faq_obj(faq):
    return {
        'oid': faq.pk,
        'question': faq.question,
        'answer': faq.answer,
        'order': faq.order,
    }


class FaqRootView(View):

    http_method_names = ['get', 'post']

    @auth_check.require_login
    def get(self, request):
        res = [get_faq_obj(q) for q in FAQuestion.objects.order_by('order').all()]
        return response.success(value=res)

    @response.required_args('question', 'answer', 'order')
    @auth_check.require_admin
    def post(self, request):
        faq = FAQuestion(
            question=request.DATA['question'],
            answer=request.DATA['answer'],
            order=int(request.DATA['order']),
        )
        faq.save()
        return response.success(value=get_faq_obj(faq))


class FaqElementView(View):

    http_method_names = ['get', 'put', 'delete']

    @auth_check.require_login
    def get(self, request, id):
        faq = get_object_or_404(FAQuestion, pk=id)
        return response.success(value=get_faq_obj(faq))

    @response.required_args('question', 'answer', 'order', optional=True)
    @auth_check.require_admin
    def put(self, request, id):
        faq = get_object_or_404(FAQuestion, pk=id)
        faq.question = request.DATA.get('question', faq.question)
        faq.answer = request.DATA.get('answer', faq.answer)
        faq.order = request.DATA.get('order', faq.order)
        faq.save()
        return response.success(value=get_faq_obj(faq))

    @auth_check.require_admin
    def delete(self, request, id):
        faq = get_object_or_404(FAQuestion, pk=id)
        faq.delete()
        return response.success()

