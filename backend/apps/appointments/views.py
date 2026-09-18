from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.http import HttpResponse
from apps.appointments.models import Cita
from apps.appointments.serializers import (
    CitaListDetailSerializer,
    ReservaWebInputSerializer,
    ConsultarCitaInputSerializer,
    CancelarCitaWebInputSerializer,
    ReprogramarCitaWebInputSerializer
)
from apps.appointments.services import DisponibilidadService, ReservaService
from apps.common.permissions import IsAdminUserRole, IsAssignedTherapistOrAdmin
from apps.common.authentication import QueryParamJWTAuthentication
from apps.common.pdf import generar_comprobante_pdf


class DisponibilidadPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        fecha_str = request.query_params.get('fecha')
        if not fecha_str:
            fecha = timezone.localdate()
        else:
            try:
                fecha = timezone.datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'success': False, 'error': {'code': 'INVALID_DATE', 'message': 'Formato de fecha inválido. Utilice YYYY-MM-DD.'}},
                    status=status.HTTP_400_BAD_REQUEST
                )

        servicio_id = request.query_params.get('servicio_id')
        terapeuta_id = request.query_params.get('terapeuta_id')
        cabina_id = request.query_params.get('cabina_id')

        slots = DisponibilidadService.get_slots_disponibles(
            fecha=fecha,
            servicio_id=int(servicio_id) if servicio_id else None,
            terapeuta_id=int(terapeuta_id) if terapeuta_id else None,
            cabina_id=int(cabina_id) if cabina_id else None
        )

        return Response({
            'success': True,
            'data': {
                'fecha': fecha.isoformat(),
                'slots': slots
            }
        }, status=status.HTTP_200_OK)


class ReservaWebPublicView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ReservaWebInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cita = ReservaService.crear_reserva_web(serializer.validated_data)
        return Response({
            'success': True,
            'message': f'¡Reserva registrada con éxito! Código: {cita.codigo_reserva}',
            'data': CitaListDetailSerializer(cita).data
        }, status=status.HTTP_201_CREATED)


class ConsultarCitaPublicView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConsultarCitaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultado = ReservaService.consultar_cita_web(
            codigo_reserva=serializer.validated_data['codigo_reserva'],
            dni=serializer.validated_data['dni']
        )
        return Response({
            'success': True,
            'data': {
                'cita': CitaListDetailSerializer(resultado['cita']).data,
                'horas_restantes': resultado['horas_restantes'],
                'puede_modificar': resultado['puede_modificar'],
                'motivo_bloqueo': resultado['motivo_bloqueo']
            }
        }, status=status.HTTP_200_OK)


class CancelarCitaWebPublicView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CancelarCitaWebInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cita = ReservaService.cancelar_cita_web(
            codigo_reserva=serializer.validated_data['codigo_reserva'],
            dni=serializer.validated_data['dni'],
            motivo=serializer.validated_data.get('motivo')
        )
        return Response({
            'success': True,
            'message': f'Cita {cita.codigo_reserva} cancelada exitosamente.',
            'data': CitaListDetailSerializer(cita).data
        }, status=status.HTTP_200_OK)


class ReprogramarCitaWebPublicView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ReprogramarCitaWebInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cita = ReservaService.reprogramar_cita_web(
            codigo_reserva=serializer.validated_data['codigo_reserva'],
            dni=serializer.validated_data['dni'],
            nueva_fecha=serializer.validated_data['fecha'],
            nueva_hora_inicio=serializer.validated_data['hora_inicio']
        )
        return Response({
            'success': True,
            'message': f'Cita {cita.codigo_reserva} reprogramada exitosamente.',
            'data': CitaListDetailSerializer(cita).data
        }, status=status.HTTP_200_OK)


class CitaAdminViewSet(ModelViewSet):
    queryset = Cita.objects.select_related(
        'cliente', 'servicio', 'terapeuta__usuario', 'cabina'
    ).prefetch_related(
        'ficha_atencion__servicios_adicionales__servicio'
    ).all().order_by('-fecha', '-hora_inicio')
    serializer_class = CitaListDetailSerializer
    permission_classes = [IsAdminUserRole]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        fecha = request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha=fecha)

        estado = request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        terapeuta_id = request.query_params.get('terapeuta_id')
        if terapeuta_id:
            queryset = queryset.filter(terapeuta_id=terapeuta_id)

        cabina_id = request.query_params.get('cabina_id')
        if cabina_id:
            queryset = queryset.filter(cabina_id=cabina_id)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                codigo_reserva__icontains=search
            ) | queryset.filter(
                cliente__nombre_completo__icontains=search
            ) | queryset.filter(
                cliente__dni__icontains=search
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def partial_update(self, request, *args, **kwargs):
        cita = self.get_object()
        nuevo_estado = request.data.get('estado')
        if nuevo_estado in [Cita.Estados.PENDIENTE, Cita.Estados.CANCELADA, Cita.Estados.ATENDIDA]:
            cita.estado = nuevo_estado
            cita.save()
        return Response({
            'success': True,
            'message': 'Estado de cita actualizado.',
            'data': CitaListDetailSerializer(cita).data
        })


class CitaPDFDownloadView(APIView):
    authentication_classes = [QueryParamJWTAuthentication]
    permission_classes = [IsAuthenticated, IsAssignedTherapistOrAdmin]

    def get(self, request, pk):
        try:
            cita = Cita.objects.select_related(
                'cliente', 'servicio', 'terapeuta__usuario', 'cabina'
            ).prefetch_related(
                'ficha_atencion__servicios_adicionales__servicio'
            ).get(pk=pk)
        except Cita.DoesNotExist:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Cita no encontrada.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, cita)

        pdf_bytes = generar_comprobante_pdf(cita)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"Comprobante_Sumaq_{cita.codigo_reserva}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response


class CitaPublicPDFDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, codigo_reserva=None, pk=None):
        try:
            if codigo_reserva:
                cita = Cita.objects.select_related(
                    'cliente', 'servicio', 'terapeuta__usuario', 'cabina'
                ).prefetch_related(
                    'ficha_atencion__servicios_adicionales__servicio'
                ).get(codigo_reserva=codigo_reserva)
            elif pk:
                cita = Cita.objects.select_related(
                    'cliente', 'servicio', 'terapeuta__usuario', 'cabina'
                ).prefetch_related(
                    'ficha_atencion__servicios_adicionales__servicio'
                ).get(pk=pk)
            else:
                return Response(
                    {'success': False, 'error': {'code': 'BAD_REQUEST', 'message': 'Código de reserva requerido.'}},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Cita.DoesNotExist:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Cita no encontrada.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        pdf_bytes = generar_comprobante_pdf(cita)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"Comprobante_Sumaq_{cita.codigo_reserva}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
