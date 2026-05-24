from django.db import models as db_models
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Assignment, AssignmentSubmission
from .serializers import (
    AssignmentSerializer, AssignmentCreateSerializer,
    SubmissionSerializer, SubmissionCreateSerializer,
    GradeSubmissionSerializer,
)
from apps.courses.models import CourseEnrollment


class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('teacher', 'admin')


class AssignmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Assignment.objects.select_related('created_by', 'course').annotate(
            submissions_count=db_models.Count('submissions'),
            graded_count=db_models.Count('submissions', filter=db_models.Q(submissions__status='graded')),
        )
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AssignmentCreateSerializer
        return AssignmentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Assignment.objects.select_related('created_by', 'course').annotate(
        submissions_count=db_models.Count('submissions'),
        graded_count=db_models.Count('submissions', filter=db_models.Q(submissions__status='graded')),
    )
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AssignmentCreateSerializer
        return AssignmentSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated(), IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]


class SubmitAssignmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            assignment = Assignment.objects.get(pk=pk)
        except Assignment.DoesNotExist:
            return Response({'detail': 'Завдання не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        if not CourseEnrollment.objects.filter(
            course=assignment.course, student=request.user
        ).exists():
            return Response({'detail': 'Ви не записані на цей курс.'}, status=status.HTTP_403_FORBIDDEN)

        if AssignmentSubmission.objects.filter(assignment=assignment, student=request.user).exists():
            return Response({'detail': 'Ви вже здали це завдання.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = AssignmentSubmission.objects.create(
            assignment=assignment,
            student=request.user,
            **serializer.validated_data,
        )
        return Response(SubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)


class AssignmentSubmissionsView(generics.ListAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssignmentSubmission.objects.select_related('student', 'assignment')
        assignment_pk = self.kwargs.get('pk')
        if assignment_pk:
            qs = qs.filter(assignment_id=assignment_pk)
        if self.request.user.is_student:
            qs = qs.filter(student=self.request.user)
        return qs


class GradeSubmissionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        try:
            submission = AssignmentSubmission.objects.select_related('assignment__course__teacher').get(pk=pk)
        except AssignmentSubmission.DoesNotExist:
            return Response({'detail': 'Відповідь не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        # Verify that the grading teacher owns the course
        if submission.assignment.course.teacher != request.user and request.user.role != 'admin':
            return Response(
                {'detail': 'Ви не є викладачем цього курсу.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GradeSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        grade = serializer.validated_data['grade']
        if grade > submission.assignment.max_score:
            return Response(
                {'detail': f'Оцінка не може перевищувати {submission.assignment.max_score}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission.grade = grade
        submission.feedback = serializer.validated_data.get('feedback', '')
        submission.status = 'graded'
        submission.graded_at = timezone.now()
        submission.save()

        return Response(SubmissionSerializer(submission).data)
