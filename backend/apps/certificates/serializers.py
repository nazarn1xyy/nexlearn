from rest_framework import serializers
from .models import Certificate
from apps.users.serializers import UserListSerializer


class CertificateSerializer(serializers.ModelSerializer):
    student = UserListSerializer(read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    teacher_name = serializers.CharField(
        source='course.teacher.get_full_name', read_only=True
    )

    class Meta:
        model = Certificate
        fields = ['id', 'student', 'course', 'course_title', 'teacher_name',
                  'certificate_number', 'issued_at']
