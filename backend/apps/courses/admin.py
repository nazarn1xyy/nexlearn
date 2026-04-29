from django.contrib import admin
from .models import Course, CourseMaterial, CourseEnrollment


class CourseMaterialInline(admin.TabularInline):
    model = CourseMaterial
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'status', 'created_at']
    list_filter = ['status']
    inlines = [CourseMaterialInline]


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'enrolled_at']
