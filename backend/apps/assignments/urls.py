from django.urls import path
from .views import (
    AssignmentListCreateView, AssignmentDetailView,
    SubmitAssignmentView, AssignmentSubmissionsView,
    GradeSubmissionView,
)

urlpatterns = [
    path('', AssignmentListCreateView.as_view(), name='assignment-list'),
    path('<int:pk>/', AssignmentDetailView.as_view(), name='assignment-detail'),
    path('<int:pk>/submit/', SubmitAssignmentView.as_view(), name='assignment-submit'),
    path('<int:pk>/submissions/', AssignmentSubmissionsView.as_view(), name='assignment-submissions'),
    path('submissions/<int:pk>/grade/', GradeSubmissionView.as_view(), name='submission-grade'),
]
