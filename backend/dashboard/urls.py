from django.urls import path
from .views import DashboardView, OwnerDashboardView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('owner/', OwnerDashboardView.as_view(), name='owner-dashboard'),
]
