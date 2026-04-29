import uuid
from django.db import models
from django.conf import settings
from apps.courses.models import Course


class Certificate(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificates',
        verbose_name='Слухач',
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='certificates',
        verbose_name='Курс',
    )
    certificate_number = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name='Номер сертифікату',
    )
    issued_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата видачі')

    class Meta:
        verbose_name = 'Сертифікат'
        verbose_name_plural = 'Сертифікати'
        unique_together = ['student', 'course']
        ordering = ['-issued_at']

    def __str__(self):
        return f'Сертифікат {self.certificate_number} — {self.student}'
