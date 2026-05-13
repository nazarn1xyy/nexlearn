from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


import filetype

def validate_image_file(value):
    if value.size > 2 * 1024 * 1024:
        raise ValidationError('Максимальний розмір файлу — 2MB.')
    
    kind = filetype.guess(value.read(2048))
    value.seek(0)
    
    if kind is None or not kind.mime.startswith('image/'):
        raise ValidationError('Дозволені лише зображення (JPEG, PNG, WebP тощо).')


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Адміністратор'
        TEACHER = 'teacher', 'Викладач'
        STUDENT = 'student', 'Слухач'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
        verbose_name='Роль',
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='Телефон')
    bio = models.TextField(blank=True, verbose_name='Про себе')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Аватар', validators=[validate_image_file])

    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT
