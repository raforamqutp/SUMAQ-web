from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, KdbArticleViewSet

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ti-tickets')
router.register(r'kdb', KdbArticleViewSet, basename='ti-kdb')

urlpatterns = [
    path('', include(router.urls)),
]
