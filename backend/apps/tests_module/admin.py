from django.contrib import admin
from .models import Test, TestQuestion, TestResult


class TestQuestionInline(admin.TabularInline):
    model = TestQuestion
    extra = 1


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'passing_score', 'created_at']
    inlines = [TestQuestionInline]


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'test', 'score', 'passed', 'completed_at']
    list_filter = ['passed']
