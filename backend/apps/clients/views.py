from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from apps.clients.models import Cliente
from apps.clients.serializers import ClienteSerializer
from apps.common.permissions import IsAdminUserRole


class ClienteAdminViewSet(ModelViewSet):
    queryset = Cliente.objects.all().order_by('nombre_completo')
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminUserRole]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(nombre_completo__icontains=search) | queryset.filter(dni__icontains=search)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})
