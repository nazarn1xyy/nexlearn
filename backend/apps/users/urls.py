from django.urls import path
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterView, MeView


@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class RateLimitedLoginView(TokenObtainPairView):
    pass


@method_decorator(ratelimit(key='ip', rate='3/m', method='POST', block=True), name='post')
class RateLimitedRegisterView(RegisterView):
    pass


urlpatterns = [
    path('register/', RateLimitedRegisterView.as_view(), name='register'),
    path('login/', RateLimitedLoginView.as_view(), name='token_obtain'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
]
