from decimal import Decimal
from datetime import timedelta
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count, Q
from apps.finance.models import MovimientoCaja
from apps.appointments.models import Cita
from apps.inventory.models import Producto, MovimientoInventario
from apps.therapists.models import Terapeuta
from apps.services.models import Servicio
from apps.finance.serializers import (
    MovimientoCajaSerializer,
    MovimientoCajaCreateSerializer
)
from apps.common.permissions import IsAdminUserRole, IsStaffUserRole
from apps.common.authentication import QueryParamJWTAuthentication
from apps.common.pdf import generar_comprobante_pdf, generar_comprobante_caja_pdf
from apps.common.viewsets import WrappedModelViewSet


class MovimientoCajaViewSet(WrappedModelViewSet):
    queryset = MovimientoCaja.objects.all().order_by('-fecha_registro', '-id')
    permission_classes = [IsStaffUserRole]

    def get_serializer_class(self):
        if self.action == 'create':
            return MovimientoCajaCreateSerializer
        return MovimientoCajaSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response({
            'success': True,
            'message': 'Movimiento de caja registrado con éxito.',
            'data': MovimientoCajaSerializer(instance).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='pdf', authentication_classes=[QueryParamJWTAuthentication])
    def descargar_pdf(self, request, pk=None):
        movimiento = self.get_object()
        concepto = movimiento.concepto or ''
        if movimiento.tipo == MovimientoCaja.Tipos.INGRESO_CITA and movimiento.cita and not concepto.startswith('Venta POS'):
            pdf_bytes = generar_comprobante_pdf(movimiento.cita)
            filename = f"Boleta_Cita_{movimiento.cita.codigo_reserva}.pdf"
        else:
            pdf_bytes = generar_comprobante_caja_pdf(movimiento)
            filename = f"Boleta_Venta_POS_{movimiento.id}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response


class AdminDashboardAnalyticsView(APIView):
    permission_classes = [IsStaffUserRole]

    def get(self, request):
        today = timezone.localdate()

        # 1. Resumen Financiero Total
        citas_atendidas = Cita.objects.filter(estado=Cita.Estados.ATENDIDA)
        ingresos_totales = float(citas_atendidas.aggregate(total=Sum('monto_total'))['total'] or Decimal('0.00'))

        # Costo de insumos = sumatoria de salidas de kárdex
        movs_salida = MovimientoInventario.objects.filter(tipo=MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO)
        costo_insumos_total = float(sum(
            m.cantidad * m.costo_unitario for m in movs_salida
        ))

        egresos_caja = float(MovimientoCaja.objects.filter(tipo=MovimientoCaja.Tipos.EGRESO).aggregate(total=Sum('monto'))['total'] or Decimal('0.00'))
        ganancia_operativa = round(ingresos_totales - costo_insumos_total - egresos_caja, 2)

        # 2. Resumen Financiero Hoy
        citas_hoy_atendidas = Cita.objects.filter(fecha=today, estado=Cita.Estados.ATENDIDA)
        ingresos_hoy = float(citas_hoy_atendidas.aggregate(total=Sum('monto_total'))['total'] or Decimal('0.00'))

        movs_salida_hoy = MovimientoInventario.objects.filter(
            tipo=MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO,
            fecha_registro__date=today
        )
        costo_insumos_hoy = float(sum(m.cantidad * m.costo_unitario for m in movs_salida_hoy))
        egresos_caja_hoy = float(MovimientoCaja.objects.filter(
            tipo=MovimientoCaja.Tipos.EGRESO,
            fecha_registro__date=today
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00'))
        ganancia_operativa_hoy = round(ingresos_hoy - costo_insumos_hoy - egresos_caja_hoy, 2)

        # 3. Operaciones Hoy
        citas_hoy = Cita.objects.filter(fecha=today)
        citas_totales_hoy = citas_hoy.count()
        citas_pendientes_hoy = citas_hoy.filter(estado=Cita.Estados.PENDIENTE).count()
        citas_atendidas_hoy = citas_hoy.filter(estado=Cita.Estados.ATENDIDA).count()
        citas_canceladas_hoy = citas_hoy.filter(estado=Cita.Estados.CANCELADA).count()

        capacidad_maxima = 27  # 3 cabinas x 9 turnos diarios
        tasa_ocupacion = round((citas_totales_hoy / capacidad_maxima) * 100.0, 1) if capacidad_maxima > 0 else 0.0

        # 4. Alertas de Stock
        productos = Producto.objects.all()
        productos_criticos = sum(1 for p in productos if p.estado_stock != Producto.EstadosStock.NORMAL)

        # 5. Tendencia 7 Días (Cálculo real por fecha)
        dias_semana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        tendencia_7_dias = []

        for i in range(6, -1, -1):
            dia_fecha = today - timedelta(days=i)
            dia_nombre = dias_semana[dia_fecha.weekday()]

            citas_dia = Cita.objects.filter(fecha=dia_fecha)
            citas_dia_count = citas_dia.count()
            ingresos_dia = float(citas_dia.filter(estado=Cita.Estados.ATENDIDA).aggregate(total=Sum('monto_total'))['total'] or Decimal('0.00'))

            movs_salida_dia = MovimientoInventario.objects.filter(
                tipo=MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO,
                fecha_registro__date=dia_fecha
            )
            costos_dia = float(sum(m.cantidad * m.costo_unitario for m in movs_salida_dia))
            ganancia_dia = round(ingresos_dia - costos_dia, 2)

            tendencia_7_dias.append({
                'fecha': dia_nombre,
                'fecha_iso': dia_fecha.isoformat(),
                'ingresos': ingresos_dia,
                'costos': costos_dia,
                'ganancia': ganancia_dia,
                'citas': citas_dia_count
            })

        # 6. Servicios Populares
        servicios_populares = []
        servicios_agg = Cita.objects.values('servicio__nombre').annotate(total=Count('id')).order_by('-total')[:5]
        for s in servicios_agg:
            if s['servicio__nombre']:
                servicios_populares.append({
                    'servicio__nombre': s['servicio__nombre'],
                    'total': s['total']
                })

        return Response({
            'success': True,
            'data': {
                'resumen_financiero': {
                    'ingresos_totales': ingresos_totales,
                    'egresos_totales': egresos_caja,
                    'costo_insumos_total': costo_insumos_total,
                    'ganancia_operativa': ganancia_operativa,
                    'ingresos_hoy': ingresos_hoy,
                    'costo_insumos_hoy': costo_insumos_hoy,
                    'ganancia_operativa_hoy': ganancia_operativa_hoy
                },
                'operaciones_hoy': {
                    'citas_totales': citas_totales_hoy,
                    'citas_pendientes': citas_pendientes_hoy,
                    'citas_atendidas': citas_atendidas_hoy,
                    'citas_canceladas': citas_canceladas_hoy,
                    'capacidad_maxima': capacidad_maxima,
                    'tasa_ocupacion_porcentaje': tasa_ocupacion
                },
                'alertas': {
                    'productos_criticos_conteo': productos_criticos
                },
                'tendencia_7_dias': tendencia_7_dias,
                'servicios_populares': servicios_populares
            }
        }, status=status.HTTP_200_OK)


class AdminReportesView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str = request.query_params.get('fecha_fin')

        today = timezone.localdate()
        if fecha_inicio_str:
            try:
                fecha_inicio = timezone.datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            except ValueError:
                fecha_inicio = today.replace(day=1)
        else:
            fecha_inicio = today.replace(day=1)

        if fecha_fin_str:
            try:
                fecha_fin = timezone.datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
            except ValueError:
                fecha_fin = today
        else:
            fecha_fin = today

        citas_rango = Cita.objects.filter(
            fecha__gte=fecha_inicio,
            fecha__lte=fecha_fin
        )

        total_citas = citas_rango.count()
        citas_atendidas_qs = citas_rango.filter(estado=Cita.Estados.ATENDIDA)
        citas_atendidas_count = citas_atendidas_qs.count()

        ingresos = float(citas_atendidas_qs.aggregate(total=Sum('monto_total'))['total'] or Decimal('0.00'))
        movs_salida_rango = MovimientoInventario.objects.filter(
            tipo=MovimientoInventario.Tipos.SALIDA_CONSUMO_SERVICIO,
            fecha_registro__date__gte=fecha_inicio,
            fecha_registro__date__lte=fecha_fin
        )
        costo_insumos = float(sum(m.cantidad * m.costo_unitario for m in movs_salida_rango))
        egresos_caja_rango = float(MovimientoCaja.objects.filter(
            tipo=MovimientoCaja.Tipos.EGRESO,
            fecha_registro__date__gte=fecha_inicio,
            fecha_registro__date__lte=fecha_fin
        ).aggregate(total=Sum('monto'))['total'] or Decimal('0.00'))
        ganancia_operativa = round(ingresos - costo_insumos - egresos_caja_rango, 2)

        # Desglose por terapeuta
        terapeutas = Terapeuta.objects.select_related('usuario').filter(activo=True)
        desglose_terapeutas = []

        for ter in terapeutas:
            citas_ter = citas_atendidas_qs.filter(terapeuta=ter)
            citas_count = citas_ter.count()
            ter_ingresos = float(citas_ter.aggregate(total=Sum('monto_total'))['total'] or Decimal('0.00'))

            desglose_terapeutas.append({
                'terapeuta__usuario__nombre_completo': ter.usuario.nombre_completo,
                'terapeuta__especialidad': ter.especialidad,
                'citas_count': citas_count,
                'ingresos': ter_ingresos
            })

        return Response({
            'success': True,
            'data': {
                'periodo': {
                    'fecha_inicio': fecha_inicio.isoformat(),
                    'fecha_fin': fecha_fin.isoformat()
                },
                'total_citas': total_citas,
                'citas_atendidas': citas_atendidas_count,
                'ingresos': ingresos,
                'costo_insumos': costo_insumos,
                'ganancia_operativa': ganancia_operativa,
                'desglose_terapeutas': desglose_terapeutas
            }
        }, status=status.HTTP_200_OK)
