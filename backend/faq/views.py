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

    def get(self, request):
        res = [get_faq_obj(q) for q in FAQuestion.objects.order_by('order').all()]
        return response.success(value=res)

    @response.required_args('question', 'answer', 'order')
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

    def get(self, request, id):
        faq = get_object_or_404(FAQuestion, pk=id)
        return response.success(value=get_faq_obj(faq))

    @response.required_args('question', 'answer', 'order')
    def put(self, request, id):
        faq = get_object_or_404(FAQuestion, pk=id)
        faq.question = request.DATA['question']
        faq.answer = request.DATA['answer']
        faq.order = request.DATA['order']
        faq.save()
        return response.success(value=get_faq_obj(faq))

    def delete(self, request, id):
        faq = get_object_or_404(FAQuestion, pk=id)
        faq.delete()
        return response.success()

