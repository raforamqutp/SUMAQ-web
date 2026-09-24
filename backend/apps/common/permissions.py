from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    """
    Permite acceso únicamente a usuarios con rol ADMIN.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'ADMIN' and
            request.user.activo
        )


class IsTherapistUserRole(BasePermission):
    """
    Permite acceso a usuarios con rol TERAPEUTA o ADMIN.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in ['TERAPEUTA', 'ADMIN'] and
            request.user.activo
        )


class IsAssignedTherapistOrAdmin(BasePermission):
    """
    Permite acceso a Administradores o a la Terapeuta asignada a la Cita/Ficha específica (Anti-IDOR).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.activo
        )

    def has_object_permission(self, request, view, obj):
        if request.user.rol == 'ADMIN':
            return True

        if request.user.rol == 'TERAPEUTA':
            terapeuta_perfil = getattr(request.user, 'terapeuta', None)
            if not terapeuta_perfil:
                return False

            # Comprobar si el objeto es Cita o FichaAtencion
            if hasattr(obj, 'terapeuta_id'):
                return obj.terapeuta_id == terapeuta_perfil.id
            if hasattr(obj, 'cita') and hasattr(obj.cita, 'terapeuta_id'):
                return obj.cita.terapeuta_id == terapeuta_perfil.id

        return False
