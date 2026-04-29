from django.db import models
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Test, TestResult
from .serializers import (
    TestListSerializer, TestDetailSerializer, TestStudentDetailSerializer,
    TestCreateSerializer, SubmitTestSerializer, TestResultSerializer,
)
from apps.certificates.models import Certificate
from apps.courses.models import CourseEnrollment


class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('teacher', 'admin')


class TestListCreateView(generics.ListCreateAPIView):
    queryset = Test.objects.select_related('course').annotate(
        _questions_count=models.Count('questions'),
    )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TestCreateSerializer
        return TestListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


class TestDetailView(generics.RetrieveAPIView):
    queryset = Test.objects.select_related('course').prefetch_related('questions')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role in ('teacher', 'admin'):
            return TestDetailSerializer
        return TestStudentDetailSerializer


class SubmitTestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            test = Test.objects.prefetch_related('questions').get(pk=pk)
        except Test.DoesNotExist:
            return Response(
                {'detail': 'Тест не знайдено.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.is_student:
            if not CourseEnrollment.objects.filter(
                course=test.course, student=request.user
            ).exists():
                return Response(
                    {'detail': 'Ви не записані на цей курс.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        attempts = TestResult.objects.filter(student=request.user, test=test).count()
        if attempts >= 3:
            return Response(
                {'detail': 'Ви вичерпали кількість спроб (макс. 3).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SubmitTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers = serializer.validated_data['answers']

        questions = list(test.questions.order_by('order'))
        if len(answers) != len(questions):
            return Response(
                {'detail': f'Очікується {len(questions)} відповідей, отримано {len(answers)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        correct = sum(
            1 for q, a in zip(questions, answers)
            if a == q.correct_answer
        )
        total = len(questions)
        score = round((correct / total) * 100) if total > 0 else 0
        passed = score >= test.passing_score

        result = TestResult.objects.create(
            student=request.user,
            test=test,
            score=score,
            passed=passed,
            answers=answers,
        )

        if passed:
            Certificate.objects.get_or_create(
                student=request.user,
                course=test.course,
            )

        return Response(TestResultSerializer(result).data, status=status.HTTP_201_CREATED)


class ExportTestResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, pk):
        import csv
        from django.http import HttpResponse

        results = TestResult.objects.filter(test_id=pk).select_related('student', 'test')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="test_{pk}_results.csv"'

        writer = csv.writer(response)
        writer.writerow(['Слухач', 'Email', 'Бал (%)', 'Пройдено', 'Дата'])

        for r in results:
            writer.writerow([
                r.student.get_full_name() or r.student.username,
                r.student.email,
                r.score,
                'Так' if r.passed else 'Ні',
                r.completed_at.strftime('%d.%m.%Y %H:%M'),
            ])

        return response


class MyTestResultsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        results = TestResult.objects.filter(student=request.user).values(
            'test_id'
        ).annotate(
            best_score=models.Max('score'),
            attempts=models.Count('id'),
            passed=models.Max(models.Case(
                models.When(passed=True, then=1),
                default=0,
                output_field=models.IntegerField(),
            )),
        )
        return Response(list(results))


class TestResultsView(generics.ListAPIView):
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = TestResult.objects.select_related('student', 'test')
        test_pk = self.kwargs.get('pk')
        if test_pk:
            qs = qs.filter(test_id=test_pk)
        if self.request.user.is_student:
            qs = qs.filter(student=self.request.user)
        return qs
