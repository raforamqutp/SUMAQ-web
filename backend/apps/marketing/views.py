from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from apps.marketing.models import Promocion
from apps.marketing.serializers import PromocionSerializer
from apps.common.permissions import IsAdminUserRole


class PromocionViewSet(ModelViewSet):
    queryset = Promocion.objects.all().order_by('-id')
    serializer_class = PromocionSerializer
    permission_classes = [IsAdminUserRole]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


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
