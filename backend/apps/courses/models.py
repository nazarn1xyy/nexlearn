from django.core.exceptions import ValidationError
from django.db import models
from django.conf import settings


import os
import filetype

def validate_safe_file_10mb(value):
    if value.size > 10 * 1024 * 1024:
        raise ValidationError('Максимальний розмір файлу — 10MB.')
        
    ext = os.path.splitext(value.name)[1].lower()
    dangerous_exts = ['.html', '.htm', '.js', '.exe', '.sh', '.php', '.py', '.svg']
    if ext in dangerous_exts:
        raise ValidationError('Завантаження скриптів або виконуваних файлів заборонено.')
        
    kind = filetype.guess(value.read(2048))
    value.seek(0)
    
    # Якщо файл розпізнаний filetype, перевіряємо, щоб це не був виконуваний файл
    if kind is not None:
        if kind.mime.startswith('application/x-executable') or kind.mime.startswith('text/html'):
            raise ValidationError('Цей тип файлу заборонено з міркувань безпеки.')


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Назва')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='Slug')

    class Meta:
        verbose_name = 'Категорія'
        verbose_name_plural = 'Категорії'
        ordering = ['name']

    def __str__(self):
        return self.name


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
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
        verbose_name='Категорія',
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
    file = models.FileField(upload_to='materials/', verbose_name='Файл', validators=[validate_safe_file_10mb])
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
        indexes = [
            models.Index(fields=['student', 'course'], name='idx_enroll_student_course'),
        ]

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
