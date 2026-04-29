from django.urls import path
from .views import (
    CourseListCreateView, CourseDetailView,
    CourseEnrollView, CourseMaterialListCreateView,
    CourseProgressView, CourseCommentListCreateView,
    CourseRateView,
)

urlpatterns = [
    path('', CourseListCreateView.as_view(), name='course-list'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/enroll/', CourseEnrollView.as_view(), name='course-enroll'),
    path('<int:pk>/materials/', CourseMaterialListCreateView.as_view(), name='course-materials'),
    path('<int:pk>/progress/', CourseProgressView.as_view(), name='course-progress'),
    path('<int:pk>/comments/', CourseCommentListCreateView.as_view(), name='course-comments'),
    path('<int:pk>/rate/', CourseRateView.as_view(), name='course-rate'),
]
