from django.core.exceptions import ValidationError
from django.db import models
from django.conf import settings


def validate_file_size_10mb(value):
    if value.size > 10 * 1024 * 1024:
        raise ValidationError('Максимальний розмір файлу — 10MB.')


class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Чернетка'
        PUBLISHED = 'published', 'Опубліковано'

    title = models.CharField(max_length=255, verbose_name='Назва')
    description = models.TextField(verbose_name='Опис')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='taught_courses',
        verbose_name='Викладач',
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Статус',
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Створено')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Оновлено')

    class Meta:
        verbose_name = 'Курс'
        verbose_name_plural = 'Курси'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class CourseMaterial(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='materials',
        verbose_name='Курс',
    )
    title = models.CharField(max_length=255, verbose_name='Назва')
    file = models.FileField(upload_to='materials/', verbose_name='Файл', validators=[validate_file_size_10mb])
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Завантажено')

    class Meta:
        verbose_name = 'Матеріал'
        verbose_name_plural = 'Матеріали'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.title} — {self.course.title}'


class CourseEnrollment(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name='Курс',
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name='Слухач',
    )
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата запису')

    class Meta:
        verbose_name = 'Запис на курс'
        verbose_name_plural = 'Записи на курси'
        unique_together = ['course', 'student']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f'{self.student} → {self.course}'


class CourseComment(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Курс',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_comments',
        verbose_name='Автор',
    )
    text = models.TextField(verbose_name='Текст коментаря')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Створено')

    class Meta:
        verbose_name = 'Коментар'
        verbose_name_plural = 'Коментарі'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author} — {self.course.title}'


class CourseRating(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='ratings',
        verbose_name='Курс',
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_ratings',
        verbose_name='Слухач',
    )
    score = models.PositiveSmallIntegerField(verbose_name='Оцінка')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Створено')

    class Meta:
        verbose_name = 'Оцінка курсу'
        verbose_name_plural = 'Оцінки курсів'
        unique_together = ['course', 'student']

    def __str__(self):
        return f'{self.student} → {self.course.title}: {self.score}★'
