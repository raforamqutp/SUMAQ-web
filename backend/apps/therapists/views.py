from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.utils import timezone
from apps.therapists.models import Terapeuta
from apps.therapists.serializers import TerapeutaSerializer, TerapeutaCreateUpdateSerializer
from apps.common.permissions import IsAdminUserRole, IsTherapistUserRole
from apps.common.viewsets import WrappedModelViewSet


class TerapeutaViewSet(WrappedModelViewSet):
    queryset = Terapeuta.objects.select_related('usuario', 'cabina').all().order_by('id')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TerapeutaCreateUpdateSerializer
        return TerapeutaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not (request.user and request.user.is_authenticated and request.user.rol == 'ADMIN'):
            queryset = queryset.filter(activo=True, usuario__activo=True)

        serializer = TerapeutaSerializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response({
            'success': True,
            'message': 'Terapeuta registrado con éxito.',
            'data': TerapeutaSerializer(instance).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response({
            'success': True,
            'message': 'Terapeuta actualizado con éxito.',
            'data': TerapeutaSerializer(instance).data
        }, status=status.HTTP_200_OK)


class TerapeutaMiAgendaView(APIView):
    permission_classes = [IsAuthenticated, IsTherapistUserRole]

    def get(self, request):
        user = request.user
        terapeuta = getattr(user, 'terapeuta', None)

        if not terapeuta and user.rol == 'ADMIN':
            # Si el admin consulta la agenda sin terapeuta asignado, tomar el primer terapeuta
            terapeuta = Terapeuta.objects.filter(activo=True).first()

        if not terapeuta:
            return Response({
                'success': False,
                'error': {'code': 'NOT_A_THERAPIST', 'message': 'El usuario no tiene un perfil de terapeuta vinculado.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        fecha_str = request.query_params.get('fecha')
        if not fecha_str:
            fecha = timezone.localdate()
        else:
            try:
                fecha = timezone.datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except ValueError:
                fecha = timezone.localdate()

        from apps.appointments.models import Cita
        from apps.appointments.serializers import CitaListDetailSerializer

        citas_qs = Cita.objects.select_related(
            'cliente', 'servicio', 'terapeuta__usuario', 'cabina'
        ).prefetch_related(
            'ficha_atencion__servicios_adicionales__servicio'
        ).filter(
            terapeuta=terapeuta,
            fecha=fecha
        ).order_by('hora_inicio')

        citas_data = CitaListDetailSerializer(citas_qs, many=True).data

        return Response({
            'success': True,
            'data': {
                'fecha': fecha.isoformat(),
                'terapeuta': TerapeutaSerializer(terapeuta).data,
                'total_citas': len(citas_data),
                'citas': citas_data
            }
        }, status=status.HTTP_200_OK)
