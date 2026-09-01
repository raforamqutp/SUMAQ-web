import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';

/**
 * ============================================================================
 * VISTA: ERROR 404 (Página No Encontrada)
 * ============================================================================
 * Maneja rutas inexistentes o URLs mal escritas con diseño coherente de Sumaq Spa.
 * ============================================================================
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white border border-[#EDE5DC] p-8 rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#EDE5DC] text-[#8C6F55] flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-[#3D2D22]">404</h1>
        <h2 className="text-lg font-semibold text-[#543F30] mt-1">Página no encontrada</h2>
        <p className="text-xs text-[#8C6F55] mt-2 leading-relaxed">
          El ritual o sección que estás buscando no se encuentra disponible o ha cambiado de ubicación.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
              Volver a Sumaq Spa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
