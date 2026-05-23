from django.db import models as db_models
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.cache import cache

from .models import Category, Course, CourseMaterial, CourseEnrollment, CourseComment, CourseRating
from .serializers import (
    CategorySerializer,
    CourseListSerializer, CourseDetailSerializer, CourseCreateSerializer,
    CourseMaterialSerializer, EnrollmentSerializer,
    CourseCommentSerializer, CourseRatingSerializer,
)
from apps.tests_module.models import Test, TestResult


class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('teacher', 'admin')


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.teacher == request.user or request.user.is_admin


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.annotate(
        courses_count=db_models.Count('courses'),
    )
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]
        return [permissions.AllowAny()]


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.select_related('teacher', 'category').annotate(
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

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        return qs

    def list(self, request, *args, **kwargs):
        role = getattr(request.user, 'role', 'guest')
        search = request.query_params.get('search')
        status_filter = request.query_params.get('status')
        page = request.query_params.get('page', '1')

        # Cache only for students/guests viewing the default published list without search
        if role in ('student', 'guest') and not search and not status_filter:
            cache_key = f"courses_list_published_page_{page}"
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response(cached_data)
                
            response = super().list(request, *args, **kwargs)
            cache.set(cache_key, response.data, timeout=60 * 5)  # 5 хвилин
            return response

        return super().list(request, *args, **kwargs)


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

class CourseAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response({'detail': 'Курс не знайдено'}, status=404)

        if course.teacher != request.user and request.user.role != 'admin':
            return Response({'detail': 'У вас немає доступу до аналітики цього курсу'}, status=403)

        cache_key = f"course_analytics_{pk}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        enrollments = CourseEnrollment.objects.filter(course=course).select_related('student')
        tests = Test.objects.filter(course=course)
        total_tests = tests.count()

        students_data = []
        total_course_progress = 0

        for enrollment in enrollments:
            passed_tests = TestResult.objects.filter(
                student=enrollment.student,
                test__course=course,
                passed=True
            ).values('test').distinct().count()
            
            progress = (passed_tests / total_tests * 100) if total_tests > 0 else 0
            total_course_progress += progress
            
            students_data.append({
                'id': enrollment.student.id,
                'name': f"{enrollment.student.first_name} {enrollment.student.last_name}",
                'email': enrollment.student.email,
                'progress': round(progress, 1),
                'passed_tests': passed_tests,
                'enrolled_at': enrollment.enrolled_at
            })

        avg_course_progress = (total_course_progress / enrollments.count()) if enrollments.exists() else 0

        tests_data = []
        score_buckets = {'0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0}
        all_results = TestResult.objects.filter(test__course=course)

        for r in all_results:
            s = r.score
            if s <= 20:
                score_buckets['0-20'] += 1
            elif s <= 40:
                score_buckets['21-40'] += 1
            elif s <= 60:
                score_buckets['41-60'] += 1
            elif s <= 80:
                score_buckets['61-80'] += 1
            else:
                score_buckets['81-100'] += 1

        score_distribution = [{'range': k, 'count': v} for k, v in score_buckets.items()]

        for test in tests:
            results = TestResult.objects.filter(test=test)
            total_attempts = results.count()
            passed_attempts = results.filter(passed=True).count()
            avg_score = results.aggregate(avg=db_models.Avg('score'))['avg'] or 0

            pass_rate = (passed_attempts / total_attempts * 100) if total_attempts > 0 else 0

            question_stats = []
            questions = list(test.questions.order_by('order'))
            if questions and total_attempts > 0:
                for idx, q in enumerate(questions):
                    correct_count = 0
                    for r in results:
                        answers = r.answers or []
                        if idx < len(answers):
                            a = answers[idx]
                            if q.question_type == 'single':
                                try:
                                    if int(a) == q.correct_answer:
                                        correct_count += 1
                                except (ValueError, TypeError):
                                    pass
                            elif q.question_type == 'multiple':
                                try:
                                    user_ans = sorted([int(x) for x in a])
                                    correct_ans = sorted([int(x) for x in q.correct_answers])
                                    if user_ans == correct_ans:
                                        correct_count += 1
                                except (ValueError, TypeError):
                                    pass
                            elif q.question_type == 'text':
                                user_ans = str(a).strip().lower()
                                correct_ans = [str(x).strip().lower() for x in q.correct_answers]
                                if user_ans in correct_ans:
                                    correct_count += 1
                    question_stats.append({
                        'question': q.question_text[:80],
                        'correct_pct': round(correct_count / total_attempts * 100, 1),
                    })

            tests_data.append({
                'id': test.id,
                'title': test.title,
                'total_attempts': total_attempts,
                'pass_rate': round(pass_rate, 1),
                'avg_score': round(avg_score, 1),
                'question_stats': question_stats,
            })

        from django.db.models.functions import TruncDate
        enrollment_timeline = list(
            CourseEnrollment.objects.filter(course=course)
            .annotate(date=TruncDate('enrolled_at'))
            .values('date')
            .annotate(count=db_models.Count('id'))
            .order_by('date')
        )
        for item in enrollment_timeline:
            item['date'] = item['date'].isoformat()

        response_data = {
            'course_title': course.title,
            'total_students': enrollments.count(),
            'avg_course_progress': round(avg_course_progress, 1),
            'students': students_data,
            'tests': tests_data,
            'score_distribution': score_distribution,
            'enrollment_timeline': enrollment_timeline,
        }
        cache.set(cache_key, response_data, timeout=60 * 5)
        return Response(response_data)
