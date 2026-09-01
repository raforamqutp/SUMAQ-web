import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

/**
 * ============================================================================
 * PLANTILLA MAESTRA PÚBLICA: PUBLIC LAYOUT
 * ============================================================================
 * Envuelve todas las vistas accesibles por clientes:
 * - Navbar: Barra de navegación superior fija con enlaces y botón de reserva.
 * - Outlet: Espacio dinámico donde se renderizan las páginas hijas.
 * - Footer: Pie de página institucional con datos de contacto y horarios.
 * ============================================================================
 */
export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
