from django.db import models
from django.conf import settings
from apps.courses.models import validate_safe_file_10mb


class Assignment(models.Model):
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name='Курс',
    )
    title = models.CharField(max_length=255, verbose_name='Назва')
    description = models.TextField(verbose_name='Опис завдання')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_assignments',
        verbose_name='Автор',
    )
    due_date = models.DateTimeField(null=True, blank=True, verbose_name='Дедлайн')
    max_score = models.PositiveIntegerField(default=100, verbose_name='Макс. бал')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Створено')

    class Meta:
        verbose_name = 'Завдання'
        verbose_name_plural = 'Завдання'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} — {self.course.title}'


class AssignmentSubmission(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Очікує перевірки'
        GRADED = 'graded', 'Оцінено'

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name='Завдання',
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assignment_submissions',
        verbose_name='Студент',
    )
    text = models.TextField(blank=True, verbose_name='Відповідь')
    file = models.FileField(upload_to='submissions/', blank=True, null=True, verbose_name='Файл', validators=[validate_safe_file_10mb])
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Статус',
    )
    grade = models.PositiveIntegerField(null=True, blank=True, verbose_name='Оцінка')
    feedback = models.TextField(blank=True, verbose_name='Коментар викладача')
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='Здано')
    graded_at = models.DateTimeField(null=True, blank=True, verbose_name='Оцінено')

    class Meta:
        verbose_name = 'Відповідь на завдання'
        verbose_name_plural = 'Відповіді на завдання'
        ordering = ['-submitted_at']
        unique_together = ['assignment', 'student']
        indexes = [
            models.Index(fields=['student', 'assignment'], name='idx_sub_student_assign'),
        ]

    def __str__(self):
        return f'{self.student} — {self.assignment.title}'
