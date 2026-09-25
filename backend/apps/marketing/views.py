from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from apps.marketing.models import Promocion
from apps.marketing.serializers import PromocionSerializer
from apps.common.permissions import IsAdminUserRole
from apps.common.viewsets import WrappedModelViewSet


class PromocionViewSet(WrappedModelViewSet):
    queryset = Promocion.objects.all().order_by('-id')
    serializer_class = PromocionSerializer
    permission_classes = [IsAdminUserRole]


class PromocionesActivasPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.localdate()
        promos = Promocion.objects.filter(
            activo=True,
            fecha_inicio__lte=today,
            fecha_fin__gte=today
        ).order_by('-porcentaje_descuento')
        serializer = PromocionSerializer(promos, many=True)
        return Response({'success': True, 'data': serializer.data})
