from django.urls import path
from .views import HealthCheckView, TripViewSet, StopViewSet, ELDLogViewSet, TripDetailViewSet
from .views.auth import RegisterView, LoginView, LogoutView, UserProfileView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('trips/', TripViewSet.as_view(), name='trip-list'),
    path('trips/plan/', TripViewSet.as_view(), name='trip-plan'),
    path('trips/<uuid:pk>/', TripDetailViewSet.as_view(), name='trip-detail'),
    path('stops/', StopViewSet.as_view(), name='stop-list'),
    path('logs/', ELDLogViewSet.as_view(), name='log-list'),
    
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/profile/', UserProfileView.as_view(), name='auth-profile'),
]
