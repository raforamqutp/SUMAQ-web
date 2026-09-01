import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Package,
  Tag,
  Sparkles,
  Users2,
  DoorClosed,
  UserCog,
  BarChart3,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  ShieldAlert,
  DollarSign,
} from 'lucide-react';

/**
 * ============================================================================
 * PLANTILLA MAESTRA DE ADMINISTRACIÓN: ADMIN LAYOUT
 * ============================================================================
 * Estructura visual para el personal administrativo y de recepción:
 * - Sidebar Izquierda: Menú con 11 módulos (Dashboard, Agenda, Caja, Kárdex, etc.).
 * - Filtrado por Rol: Oculta Dashboard y Reportes para el rol 'RECEPCIONISTA'.
 * - Header Superior: Muestra alertas de insumos, usuario activo y botón de cierre de sesión.
 * - Versión Móvil: Menú lateral deslizante con overlay backdrop.
 * ============================================================================
 */
export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.rol === 'ADMIN';
  const isRecepcionista = user?.rol === 'RECEPCIONISTA';

  // If recepcionista tries to access dashboard or financial reports directly, redirect to agenda
  React.useEffect(() => {
    if (isRecepcionista && (location.pathname === '/admin' || location.pathname === '/admin/reportes' || location.pathname === '/admin/usuarios' || location.pathname === '/admin/marketing')) {
      navigate('/admin/agenda', { replace: true });
    }
  }, [isRecepcionista, location.pathname, navigate]);

  const allNavItems = [
    { name: 'Dashboard KPIs', path: '/admin', icon: LayoutDashboard, adminOnly: true },
    { name: 'Agenda Global 3 Cabinas', path: '/admin/agenda', icon: CalendarDays },
    { name: 'Gestion de Citas', path: '/admin/citas', icon: CalendarCheck },
    { name: 'Punto de Venta / Caja', path: '/admin/caja', icon: DollarSign },
    { name: 'Inventario & Kardex', path: '/admin/inventario', icon: Package },
    { name: 'Marketing & Promociones', path: '/admin/marketing', icon: Tag, adminOnly: true },
    { name: isRecepcionista ? 'Catalogo de Servicios' : 'Servicios & Recetas (BOM)', path: '/admin/servicios', icon: Sparkles },
    { name: isRecepcionista ? 'Terapeutas y Cabinas' : 'Terapeutas', path: '/admin/terapeutas', icon: Users2 },
    { name: 'Cabinas', path: '/admin/cabinas', icon: DoorClosed, adminOnly: true },
    { name: 'Usuarios & Roles', path: '/admin/usuarios', icon: UserCog, adminOnly: true },
    { name: 'Reportes Financieros', path: '/admin/reportes', icon: BarChart3, adminOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#2C2725]/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2C2725] text-[#EDE5DC] flex flex-col border-r border-[#3D2D22] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-[#3D2D22]">
          <Link to={isRecepcionista ? "/admin/agenda" : "/admin"} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8C6F55] via-[#C8907E] to-[#DFD0C0] flex items-center justify-center text-white shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-widest text-white block leading-none">
                SUMAQ
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#C8907E] font-semibold block mt-0.5">
                {isRecepcionista ? 'Panel Recepcion' : 'Panel Administrador'}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#C9B29B] hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#8C6F55] text-white shadow-sm font-semibold'
                    : 'text-[#C9B29B] hover:text-white hover:bg-[#3D2D22]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#A88B71]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#3D2D22]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#3D2D22]/60">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.nombre_completo}</p>
              <p className="text-[10px] text-[#C8907E] font-medium uppercase tracking-wider">
                {isRecepcionista ? 'Recepcionista' : 'Admin General (Dueño)'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesion"
              className="text-[#C9B29B] hover:text-[#C84B31] p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EDE5DC] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#543F30] hover:bg-[#EDE5DC]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-sm font-semibold text-[#543F30] hidden sm:block">
              Gestión Integral &middot; Sumaq Spa
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-medium text-[#8C6F55] hover:text-[#3D2D22] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver Sitio Público</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF8F4] border border-[#A8DAC2] text-[#24634B] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#24634B] animate-pulse"></span>
              Sistema Operativo
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
