from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from apps.services.models import Servicio, RecetaServicio
from apps.services.serializers import (
    ServicioSerializer,
    RecetaItemInputSerializer
)
from apps.common.permissions import IsAdminUserRole
from apps.common.viewsets import WrappedModelViewSet


class ServicioViewSet(WrappedModelViewSet):
    queryset = Servicio.objects.prefetch_related('recetas__producto').all().order_by('id')
    serializer_class = ServicioSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not (request.user and request.user.is_authenticated and request.user.rol == 'ADMIN'):
            queryset = queryset.filter(activo=True)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=True, methods=['post'], url_path='recetas')
    def add_receta_item(self, request, pk=None):
        servicio = self.get_object()
        serializer = RecetaItemInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        producto = serializer.validated_data['producto']
        cantidad = serializer.validated_data['cantidad_requerida']

        receta, _ = RecetaServicio.objects.update_or_create(
            servicio=servicio,
            producto=producto,
            defaults={'cantidad_requerida': cantidad}
        )

        servicio_updated = self.get_object()
        return Response({
            'success': True,
            'message': f"Insumo {producto.nombre} agregado a la receta.",
            'data': ServicioSerializer(servicio_updated).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='recetas/(?P<receta_id>[^/.]+)')
    def delete_receta_item(self, request, pk=None, receta_id=None):
        servicio = self.get_object()
        try:
            receta = RecetaServicio.objects.get(id=receta_id, servicio=servicio)
            receta.delete()
        except RecetaServicio.DoesNotExist:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Ítem de receta no encontrado.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        servicio_updated = self.get_object()
        return Response({
            'success': True,
            'message': 'Ítem de receta eliminado.',
            'data': ServicioSerializer(servicio_updated).data
        }, status=status.HTTP_200_OK)
