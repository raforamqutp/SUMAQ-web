from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Common Views
from apps.common.health import HealthCheckView

# Auth Views
from apps.accounts.views import LoginView, CurrentUserView, UserAdminViewSet

# Public and Catalog Views
from apps.services.views import ServicioViewSet
from apps.cabins.views import CabinaViewSet
from apps.therapists.views import TerapeutaViewSet, TerapeutaMiAgendaView
from apps.marketing.views import PromocionViewSet, PromocionesActivasPublicView

# Booking and Attention Views
from apps.appointments.views import (
    DisponibilidadPublicView,
    ReservaWebPublicView,
    ConsultarCitaPublicView,
    CancelarCitaWebPublicView,
    ReprogramarCitaWebPublicView,
    CitaAdminViewSet,
    CitaPDFDownloadView,
    CitaPublicPDFDownloadView
)
from apps.attention.views import (
    TerapeutaCitaDetailView,
    TerapeutaFichaView,
    TerapeutaAgregarServicioView,
    TerapeutaCompletarCitaView
)
from apps.inventory.views import (
    ProductoAdminViewSet,
    MovimientoInventarioViewSet,
    TerapeutaInventarioView
)
from apps.clients.views import ClienteAdminViewSet
from apps.finance.views import (
    MovimientoCajaViewSet,
    AdminDashboardAnalyticsView,
    AdminReportesView
)

# Admin Router
admin_router = DefaultRouter()
admin_router.register(r'citas', CitaAdminViewSet, basename='admin-citas')
admin_router.register(r'inventario/movimientos', MovimientoInventarioViewSet, basename='admin-inventario-movimientos')
admin_router.register(r'inventario', ProductoAdminViewSet, basename='admin-inventario')
admin_router.register(r'marketing', PromocionViewSet, basename='admin-marketing')
admin_router.register(r'servicios', ServicioViewSet, basename='admin-servicios')
admin_router.register(r'terapeutas', TerapeutaViewSet, basename='admin-terapeutas')
admin_router.register(r'cabinas', CabinaViewSet, basename='admin-cabinas')
admin_router.register(r'usuarios', UserAdminViewSet, basename='admin-usuarios')
admin_router.register(r'clientes', ClienteAdminViewSet, basename='admin-clientes')
admin_router.register(r'caja', MovimientoCajaViewSet, basename='admin-caja')

urlpatterns = [
    # Health Check
    path('api/health/', HealthCheckView.as_view(), name='api-health'),

    # Authentication
    path('api/auth/login/', LoginView.as_view(), name='auth-login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('api/auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Public Endpoints
    path('api/servicios/', ServicioViewSet.as_view({'get': 'list'}), name='public-servicios-list'),
    path('api/servicios/<int:pk>/', ServicioViewSet.as_view({'get': 'retrieve'}), name='public-servicios-detail'),
    path('api/cabinas/', CabinaViewSet.as_view({'get': 'list'}), name='public-cabinas-list'),
    path('api/terapeutas/', TerapeutaViewSet.as_view({'get': 'list'}), name='public-terapeutas-list'),
    path('api/disponibilidad/', DisponibilidadPublicView.as_view(), name='public-disponibilidad'),
    path('api/promociones/activas/', PromocionesActivasPublicView.as_view(), name='public-promociones-activas'),
    path('api/citas/reservar-web/', ReservaWebPublicView.as_view(), name='public-reservar-web'),
    path('api/citas/consultar/', ConsultarCitaPublicView.as_view(), name='public-citas-consultar'),
    path('api/citas/cancelar-web/', CancelarCitaWebPublicView.as_view(), name='public-citas-cancelar-web'),
    path('api/citas/reprogramar-web/', ReprogramarCitaWebPublicView.as_view(), name='public-citas-reprogramar-web'),
    path('api/citas/comprobante-pdf/<str:codigo_reserva>/', CitaPublicPDFDownloadView.as_view(), name='public-cita-pdf-codigo'),
    path('api/citas/<int:pk>/pdf/publico/', CitaPublicPDFDownloadView.as_view(), name='public-cita-pdf-id'),

    # Therapist Endpoints
    path('api/terapeuta/mi-agenda/', TerapeutaMiAgendaView.as_view(), name='terapeuta-mi-agenda'),
    path('api/terapeuta/citas/<int:pk>/', TerapeutaCitaDetailView.as_view(), name='terapeuta-cita-detail'),
    path('api/terapeuta/citas/<int:pk>/pdf/', CitaPDFDownloadView.as_view(), name='terapeuta-cita-pdf'),
    path('api/terapeuta/fichas/', TerapeutaFichaView.as_view(), name='terapeuta-ficha-create'),
    path('api/terapeuta/fichas/<int:pk>/', TerapeutaFichaView.as_view(), name='terapeuta-ficha-update'),
    path('api/terapeuta/citas/<int:pk>/agregar-servicio/', TerapeutaAgregarServicioView.as_view(), name='terapeuta-agregar-servicio'),
    path('api/terapeuta/citas/<int:pk>/completar/', TerapeutaCompletarCitaView.as_view(), name='terapeuta-completar-cita'),
    path('api/terapeuta/inventario/', TerapeutaInventarioView.as_view(), name='terapeuta-inventario'),

    # Admin Endpoints
    path('api/admin/dashboard/', AdminDashboardAnalyticsView.as_view(), name='admin-dashboard'),
    path('api/admin/reportes/', AdminReportesView.as_view(), name='admin-reportes'),
    path('api/admin/citas/<int:pk>/pdf/', CitaPDFDownloadView.as_view(), name='admin-cita-pdf'),
    path('api/admin/', include(admin_router.urls)),

    # Django Admin (optional)
    path('admin/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
