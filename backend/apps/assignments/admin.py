from django.contrib import admin
from .models import Assignment, AssignmentSubmission


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'created_by', 'due_date', 'max_score', 'created_at']
    list_filter = ['course', 'created_at']
    search_fields = ['title', 'description']


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'assignment', 'status', 'grade', 'submitted_at', 'graded_at']
    list_filter = ['status', 'submitted_at']
    search_fields = ['student__username', 'assignment__title']
