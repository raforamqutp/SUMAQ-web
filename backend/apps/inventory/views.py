from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from apps.inventory.models import Producto, MovimientoInventario
from apps.inventory.serializers import (
    ProductoSerializer,
    MovimientoInventarioSerializer,
    MovimientoManualInputSerializer
)
from apps.common.permissions import IsAdminUserRole, IsTherapistUserRole
from apps.common.viewsets import WrappedModelViewSet


class ProductoAdminViewSet(WrappedModelViewSet):
    queryset = Producto.objects.all().order_by('id')
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminUserRole]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        estado = request.query_params.get('estado')
        search = request.query_params.get('search')

        if search:
            queryset = queryset.filter(nombre__icontains=search) | queryset.filter(descripcion__icontains=search)

        if estado:
            # Filtrado por propiedad calculada estado_stock
            items = [p for p in queryset if p.estado_stock == estado.upper()]
            return Response({'success': True, 'data': ProductoSerializer(items, many=True).data})

        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


class MovimientoInventarioViewSet(WrappedModelViewSet):
    queryset = MovimientoInventario.objects.select_related('producto').all().order_by('-fecha_registro', '-id')
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAdminUserRole]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        producto_id = request.query_params.get('producto_id')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = MovimientoManualInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        producto = serializer.validated_data['producto']
        tipo = serializer.validated_data['tipo']
        cantidad = serializer.validated_data['cantidad']
        costo_unitario = serializer.validated_data.get('costo_unitario') or producto.costo_unitario
        descripcion = serializer.validated_data.get('descripcion', 'Ajuste manual de inventario')

        with transaction.atomic():
            prod_lock = Producto.objects.select_for_update().get(id=producto.id)

            if tipo in [MovimientoInventario.Tipos.ENTRADA_COMPRA, MovimientoInventario.Tipos.AJUSTE_POSITIVO]:
                prod_lock.stock_actual += cantidad
            else:
                prod_lock.stock_actual = max(Decimal('0.00'), prod_lock.stock_actual - cantidad)

            prod_lock.save()

            mov = MovimientoInventario.objects.create(
                producto=prod_lock,
                tipo=tipo,
                cantidad=cantidad,
                costo_unitario=costo_unitario,
                referencia_tipo='AJUSTE_MANUAL',
                descripcion=descripcion
            )

        return Response({
            'success': True,
            'message': 'Movimiento de inventario registrado correctamente.',
            'data': MovimientoInventarioSerializer(mov).data
        }, status=status.HTTP_201_CREATED)


class TerapeutaInventarioView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistUserRole]

    def get(self, request):
        productos = Producto.objects.filter(activo=True).order_by('nombre')
        serializer = ProductoSerializer(productos, many=True)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
