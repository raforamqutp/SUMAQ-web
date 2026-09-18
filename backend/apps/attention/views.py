from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.appointments.models import Cita
from apps.attention.models import FichaAtencion
from apps.appointments.serializers import CitaListDetailSerializer
from apps.attention.serializers import (
    FichaAtencionSerializer,
    FichaAtencionInputSerializer,
    AgregarServicioInputSerializer
)
from apps.attention.services import AtencionService
from apps.common.permissions import IsAssignedTherapistOrAdmin, IsTherapistUserRole


class TerapeutaCitaDetailView(APIView):
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
        return Response({'success': True, 'data': CitaListDetailSerializer(cita).data})


class TerapeutaFichaView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistUserRole]

    def post(self, request):
        serializer = FichaAtencionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cita = serializer.validated_data.get('cita_id')
        if not cita:
            return Response(
                {'success': False, 'error': {'code': 'BAD_REQUEST', 'message': 'cita_id es requerido.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        ficha, _ = FichaAtencion.objects.get_or_create(cita=cita)
        ficha.tipo_piel = serializer.validated_data.get('tipo_piel', ficha.tipo_piel)
        ficha.alergias_conocidas = serializer.validated_data.get('alergias_conocidas', ficha.alergias_conocidas)
        ficha.notas_terapeuta = serializer.validated_data.get('notas_terapeuta', ficha.notas_terapeuta)
        ficha.save()

        return Response({
            'success': True,
            'message': 'Ficha clínica guardada correctamente.',
            'data': FichaAtencionSerializer(ficha).data
        }, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            ficha = FichaAtencion.objects.get(pk=pk)
        except FichaAtencion.DoesNotExist:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Ficha no encontrada.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = FichaAtencionInputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if 'tipo_piel' in serializer.validated_data:
            ficha.tipo_piel = serializer.validated_data['tipo_piel']
        if 'alergias_conocidas' in serializer.validated_data:
            ficha.alergias_conocidas = serializer.validated_data['alergias_conocidas']
        if 'notas_terapeuta' in serializer.validated_data:
            ficha.notas_terapeuta = serializer.validated_data['notas_terapeuta']
        ficha.save()

        return Response({
            'success': True,
            'message': 'Ficha clínica actualizada.',
            'data': FichaAtencionSerializer(ficha).data
        }, status=status.HTTP_200_OK)


class TerapeutaAgregarServicioView(APIView):
    permission_classes = [IsAuthenticated, IsAssignedTherapistOrAdmin]

    def post(self, request, pk):
        try:
            cita = Cita.objects.get(pk=pk)
        except Cita.DoesNotExist:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Cita no encontrada.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, cita)

        serializer = AgregarServicioInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cita_updated = AtencionService.agregar_servicio_adicional(
            cita=cita,
            servicio_id=serializer.validated_data['servicio_id'],
            cantidad=serializer.validated_data.get('cantidad', 1)
        )

        return Response({
            'success': True,
            'message': 'Servicio adicional agregado a la sesión.',
            'data': CitaListDetailSerializer(cita_updated).data
        }, status=status.HTTP_200_OK)


class TerapeutaCompletarCitaView(APIView):
    permission_classes = [IsAuthenticated, IsAssignedTherapistOrAdmin]

    def patch(self, request, pk):
        try:
            cita = Cita.objects.get(pk=pk)
        except Cita.DoesNotExist:
            return Response(
                {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Cita no encontrada.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, cita)

        cita_updated = AtencionService.completar_cita(cita)

        return Response({
            'success': True,
            'message': f'Cita {cita_updated.codigo_reserva} completada y stock de insumos descontado exitosamente.',
            'data': CitaListDetailSerializer(cita_updated).data
        }, status=status.HTTP_200_OK)
