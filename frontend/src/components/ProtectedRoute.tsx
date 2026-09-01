import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ============================================================================
 * COMPONENTE DE SEGURIDAD: PROTECTED ROUTE (Guardián de Rutas)
 * ============================================================================
 * Protege las vistas privadas del sistema verificando:
 * 1. Si la sesión está cargando -> Muestra spinner elegante de carga.
 * 2. Si el usuario no está autenticado -> Redirige a /login recordando la ruta de origen.
 * 3. Si el rol del usuario no está en allowedRoles -> Redirige a /unauthorized (403).
 * ============================================================================
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'ADMIN' | 'RECEPCIONISTA' | 'TERAPEUTA'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-[#6F5540]">Cargando sesión segura de Sumaq Spa...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
