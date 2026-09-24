from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from apps.accounts.models import User
from apps.accounts.serializers import (
    UserSerializer,
    UserCreateUpdateSerializer,
    LoginSerializer
)
from apps.common.permissions import IsAdminUserRole
from apps.common.viewsets import WrappedModelViewSet


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            'success': True,
            'message': 'Inicio de sesión exitoso.',
            'data': serializer.validated_data
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        terapeuta_id = None
        if hasattr(user, 'terapeuta') and user.terapeuta:
            terapeuta_id = user.terapeuta.id

        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'terapeuta_id': terapeuta_id
            }
        }, status=status.HTTP_200_OK)


class UserAdminViewSet(WrappedModelViewSet):
    queryset = User.objects.all().order_by('id')
    permission_classes = [IsAdminUserRole]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'Usuario creado exitosamente.',
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'Usuario actualizado exitosamente.',
            'data': UserSerializer(user).data
        })
