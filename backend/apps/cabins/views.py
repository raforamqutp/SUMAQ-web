from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.cabins.models import Cabina
from apps.cabins.serializers import CabinaSerializer
from apps.common.permissions import IsAdminUserRole


class CabinaViewSet(ModelViewSet):
    queryset = Cabina.objects.all().order_by('id')
    serializer_class = CabinaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        # Si la llamada es pública, solo retornar cabinas activas
        if not (request.user and request.user.is_authenticated and request.user.rol == 'ADMIN'):
            queryset = queryset.filter(activa=True)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})
