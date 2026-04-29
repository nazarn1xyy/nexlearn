from rest_framework import serializers
from .models import Course, CourseMaterial, CourseEnrollment, CourseComment, CourseRating
from apps.users.serializers import UserListSerializer


class CourseMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMaterial
        fields = ['id', 'title', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class CourseListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    students_count = serializers.IntegerField(source='_students_count', read_only=True, default=0)
    avg_rating = serializers.FloatField(source='_avg_rating', read_only=True, default=None)
    ratings_count = serializers.IntegerField(source='_ratings_count', read_only=True, default=0)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'teacher', 'teacher_name',
                  'status', 'students_count', 'avg_rating', 'ratings_count',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'teacher', 'created_at', 'updated_at']


class CourseDetailSerializer(serializers.ModelSerializer):
    teacher = UserListSerializer(read_only=True)
    materials = CourseMaterialSerializer(many=True, read_only=True)
    students_count = serializers.IntegerField(source='_students_count', read_only=True, default=0)
    avg_rating = serializers.FloatField(source='_avg_rating', read_only=True, default=None)
    ratings_count = serializers.IntegerField(source='_ratings_count', read_only=True, default=0)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'teacher', 'status',
                  'materials', 'students_count', 'avg_rating', 'ratings_count',
                  'is_enrolled', 'created_at', 'updated_at']

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'status']

    def create(self, validated_data):
        validated_data['teacher'] = self.context['request'].user
        return super().create(validated_data)


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserListSerializer(read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'student', 'enrolled_at']


class CourseCommentSerializer(serializers.ModelSerializer):
    author = UserListSerializer(read_only=True)

    class Meta:
        model = CourseComment
        fields = ['id', 'author', 'text', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class CourseRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseRating
        fields = ['id', 'score', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_score(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Оцінка повинна бути від 1 до 5.')
        return value
