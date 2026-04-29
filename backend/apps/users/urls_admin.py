from django.urls import path

from .views import UserListView, UserChangeRoleView

urlpatterns = [
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/role/', UserChangeRoleView.as_view(), name='user-change-role'),
]
