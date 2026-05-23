from rest_framework import serializers
from .models import Assignment, AssignmentSubmission
from apps.users.serializers import UserListSerializer


class AssignmentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    submissions_count = serializers.IntegerField(read_only=True, default=0)
    graded_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'created_by', 'created_by_name',
                  'due_date', 'max_score', 'submissions_count', 'graded_count', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']


class AssignmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'due_date', 'max_score']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SubmissionSerializer(serializers.ModelSerializer):
    student = UserListSerializer(read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'assignment', 'student', 'text', 'file', 'status',
                  'grade', 'feedback', 'submitted_at', 'graded_at']
        read_only_fields = ['id', 'student', 'status', 'grade', 'feedback', 'submitted_at', 'graded_at']


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'text', 'file']

    def validate(self, data):
        if not data.get('text') and not data.get('file'):
            raise serializers.ValidationError('Потрібно надати текст відповіді або файл.')
        return data


class GradeSubmissionSerializer(serializers.Serializer):
    grade = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, default='')
