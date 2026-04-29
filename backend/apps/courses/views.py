from django.db import models as db_models
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Course, CourseMaterial, CourseEnrollment, CourseComment, CourseRating
from .serializers import (
    CourseListSerializer, CourseDetailSerializer, CourseCreateSerializer,
    CourseMaterialSerializer, EnrollmentSerializer,
    CourseCommentSerializer, CourseRatingSerializer,
)


class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('teacher', 'admin')


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.teacher == request.user or request.user.is_admin


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.select_related('teacher').annotate(
        _avg_rating=db_models.Avg('ratings__score'),
        _ratings_count=db_models.Count('ratings', distinct=True),
        _students_count=db_models.Count('enrollments', distinct=True),
    )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseCreateSerializer
        return CourseListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated or self.request.user.is_student:
            qs = qs.filter(status='published')

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.select_related('teacher').prefetch_related('materials').annotate(
        _avg_rating=db_models.Avg('ratings__score'),
        _ratings_count=db_models.Count('ratings', distinct=True),
        _students_count=db_models.Count('enrollments', distinct=True),
    )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return CourseCreateSerializer
        return CourseDetailSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.AllowAny()]


class CourseEnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            course = Course.objects.get(pk=pk, status='published')
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Курс не знайдено.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        enrollment, created = CourseEnrollment.objects.get_or_create(
            course=course, student=request.user,
        )
        if not created:
            return Response(
                {'detail': 'Ви вже записані на цей курс.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )


class CourseProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response({'detail': 'Курс не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.tests_module.models import Test, TestResult
        from apps.certificates.models import Certificate

        tests = Test.objects.filter(course=course)
        total_tests = tests.count()
        passed_tests = TestResult.objects.filter(
            student=request.user, test__course=course, passed=True
        ).values('test').distinct().count()

        has_certificate = Certificate.objects.filter(
            student=request.user, course=course
        ).exists()

        progress = round((passed_tests / total_tests) * 100) if total_tests > 0 else 0

        return Response({
            'course_id': course.id,
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'progress': progress,
            'has_certificate': has_certificate,
        })


class CourseMaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseMaterialSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return CourseMaterial.objects.filter(course_id=self.kwargs['pk'])

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs['pk'])
        if course.teacher != self.request.user and not self.request.user.is_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Ви не є викладачем цього курсу.')
        serializer.save(course=course)


class CourseCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseComment.objects.filter(
            course_id=self.kwargs['pk']
        ).select_related('author')

    def perform_create(self, serializer):
        serializer.save(
            course_id=self.kwargs['pk'],
            author=self.request.user,
        )


class CourseRateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            rating = CourseRating.objects.get(course_id=pk, student=request.user)
            return Response({'score': rating.score})
        except CourseRating.DoesNotExist:
            return Response({'score': None})

    def post(self, request, pk):
        score = request.data.get('score')
        if not score or int(score) < 1 or int(score) > 5:
            return Response(
                {'detail': 'Оцінка повинна бути від 1 до 5.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rating, _ = CourseRating.objects.update_or_create(
            course_id=pk, student=request.user,
            defaults={'score': int(score)},
        )
        avg = CourseRating.objects.filter(course_id=pk).aggregate(
            avg=db_models.Avg('score'), count=db_models.Count('id'),
        )
        return Response({
            'score': rating.score,
            'avg_rating': round(avg['avg'], 1) if avg['avg'] else 0,
            'ratings_count': avg['count'],
        })
