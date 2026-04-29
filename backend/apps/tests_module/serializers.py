from rest_framework import serializers
from .models import Test, TestQuestion, TestResult
from apps.users.serializers import UserListSerializer


class TestQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestQuestion
        fields = ['id', 'question_text', 'options', 'correct_answer', 'order']


class TestQuestionStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestQuestion
        fields = ['id', 'question_text', 'options', 'order']


class TestListSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    questions_count = serializers.IntegerField(source='_questions_count', read_only=True, default=0)

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'course', 'course_title',
                  'passing_score', 'time_limit', 'questions_count', 'created_at']


class TestDetailSerializer(serializers.ModelSerializer):
    questions = TestQuestionSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'course', 'course_title',
                  'passing_score', 'time_limit', 'questions', 'created_at']


class TestStudentDetailSerializer(serializers.ModelSerializer):
    questions = TestQuestionStudentSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'course', 'course_title',
                  'passing_score', 'time_limit', 'questions', 'created_at']


class TestCreateSerializer(serializers.ModelSerializer):
    questions = TestQuestionSerializer(many=True)

    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'course', 'passing_score', 'time_limit', 'questions']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        test = Test.objects.create(**validated_data)
        for i, q_data in enumerate(questions_data):
            q_data['order'] = i
            TestQuestion.objects.create(test=test, **q_data)
        return test


class SubmitTestSerializer(serializers.Serializer):
    answers = serializers.ListField(
        child=serializers.IntegerField(min_value=0),
        help_text='Масив індексів обраних відповідей',
    )


class TestResultSerializer(serializers.ModelSerializer):
    student = UserListSerializer(read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestResult
        fields = ['id', 'student', 'test', 'test_title', 'score',
                  'passed', 'answers', 'completed_at']
