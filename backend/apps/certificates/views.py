from rest_framework import generics, permissions
from .models import Certificate
from .serializers import CertificateSerializer


class CertificateListView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Certificate.objects.select_related('student', 'course', 'course__teacher')
        if self.request.user.is_student:
            qs = qs.filter(student=self.request.user)
        return qs


class CertificateDetailView(generics.RetrieveAPIView):
    queryset = Certificate.objects.select_related('student', 'course', 'course__teacher')
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]
