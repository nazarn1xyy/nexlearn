from django.urls import path
from .views import CertificateListView, CertificateDetailView

urlpatterns = [
    path('', CertificateListView.as_view(), name='certificate-list'),
    path('<int:pk>/', CertificateDetailView.as_view(), name='certificate-detail'),
]
