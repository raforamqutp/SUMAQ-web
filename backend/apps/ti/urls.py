from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, KdbArticleViewSet, MonitoringEventViewSet, JiraTestConnectionView

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ti-tickets')
router.register(r'kdb', KdbArticleViewSet, basename='ti-kdb')
router.register(r'monitoring', MonitoringEventViewSet, basename='ti-monitoring')

urlpatterns = [
    path('jira/test-connection/', JiraTestConnectionView.as_view(), name='ti-jira-test-connection'),
    path('', include(router.urls)),
]
