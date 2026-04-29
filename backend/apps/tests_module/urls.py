from django.urls import path
from .views import (
    TestListCreateView, TestDetailView,
    SubmitTestView, TestResultsView, ExportTestResultsView,
    MyTestResultsSummaryView,
)

urlpatterns = [
    path('', TestListCreateView.as_view(), name='test-list'),
    path('my-results/', MyTestResultsSummaryView.as_view(), name='test-my-results'),
    path('<int:pk>/', TestDetailView.as_view(), name='test-detail'),
    path('<int:pk>/submit/', SubmitTestView.as_view(), name='test-submit'),
    path('<int:pk>/results/', TestResultsView.as_view(), name='test-results'),
    path('<int:pk>/export/', ExportTestResultsView.as_view(), name='test-export'),
]
