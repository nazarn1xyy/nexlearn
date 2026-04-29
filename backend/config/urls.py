from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('mgmt-panel-x9k2/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/users/', include('apps.users.urls_admin')),
    path('api/courses/', include('apps.courses.urls')),
    path('api/tests/', include('apps.tests_module.urls')),
    path('api/certificates/', include('apps.certificates.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
