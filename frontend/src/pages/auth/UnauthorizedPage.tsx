import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';

/**
 * ============================================================================
 * VISTA: ERROR 403 (Acceso Denegado / No Autorizado)
 * ============================================================================
 * Se muestra cuando un usuario autenticado intenta ingresar a una ruta fuera
 * de los privilegios asignados a su rol (ej. Recepcionista intentando ver reportes).
 * ============================================================================
 */
export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white border border-[#EDE5DC] p-8 rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#FFF2F0] text-[#9B2C1C] flex items-center justify-center mx-auto mb-4 border border-[#F8B4AB]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#3D2D22]">Acceso Denegado</h2>
        <p className="text-sm text-[#6F5540] mt-2 leading-relaxed">
          No cuentas con los permisos necesarios para ingresar a esta sección restringida de Sumaq Spa.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
              Ir al Inicio
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="primary" size="md">
              Cambiar de Cuenta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
