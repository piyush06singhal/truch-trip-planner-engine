from django.urls import path
from .views import HealthCheckView, TripViewSet, StopViewSet, ELDLogViewSet, TripDetailViewSet

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('trips/', TripViewSet.as_view(), name='trip-list'),
    path('trips/plan/', TripViewSet.as_view(), name='trip-plan'),
    path('trips/<uuid:pk>/', TripDetailViewSet.as_view(), name='trip-detail'),
    path('stops/', StopViewSet.as_view(), name='stop-list'),
    path('logs/', ELDLogViewSet.as_view(), name='log-list'),
]
