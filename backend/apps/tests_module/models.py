from django.db import models
from django.conf import settings
from apps.courses.models import Course


class Test(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='tests',
        verbose_name='Курс',
    )
    title = models.CharField(max_length=255, verbose_name='Назва')
    description = models.TextField(blank=True, verbose_name='Опис')
    passing_score = models.PositiveIntegerField(
        default=60,
        verbose_name='Прохідний бал (%)',
    )
    time_limit = models.PositiveIntegerField(
        default=0,
        verbose_name='Обмеження часу (хвилини)',
        help_text='0 = без обмеження',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Створено')

    class Meta:
        verbose_name = 'Тест'
        verbose_name_plural = 'Тести'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.course.title})'


class TestQuestion(models.Model):
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name='Тест',
    )
    question_text = models.TextField(verbose_name='Запитання')
    options = models.JSONField(
        verbose_name='Варіанти відповідей',
        help_text='Масив рядків, напр. ["Варіант A", "Варіант B", "Варіант C"]',
    )
    correct_answer = models.PositiveIntegerField(
        verbose_name='Індекс правильної відповіді',
        help_text='Індекс (починаючи з 0) правильного варіанту',
    )
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    class Meta:
        verbose_name = 'Запитання'
        verbose_name_plural = 'Запитання'
        ordering = ['order']

    def __str__(self):
        return f'Q{self.order}: {self.question_text[:50]}'


class TestResult(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='test_results',
        verbose_name='Слухач',
    )
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name='Тест',
    )
    score = models.PositiveIntegerField(verbose_name='Бал (%)')
    passed = models.BooleanField(verbose_name='Пройдено')
    answers = models.JSONField(
        verbose_name='Відповіді',
        help_text='Масив обраних індексів',
        default=list,
    )
    completed_at = models.DateTimeField(auto_now_add=True, verbose_name='Завершено')

    class Meta:
        verbose_name = 'Результат тесту'
        verbose_name_plural = 'Результати тестів'
        ordering = ['-completed_at']
        indexes = [
            models.Index(fields=['student', 'test'], name='idx_result_student_test'),
            models.Index(fields=['student', 'passed'], name='idx_result_student_passed'),
        ]

    def __str__(self):
        status = '✓' if self.passed else '✗'
        return f'{self.student} — {self.test.title}: {self.score}% {status}'
