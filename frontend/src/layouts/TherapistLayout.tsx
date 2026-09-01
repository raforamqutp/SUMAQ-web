import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Calendar, Package, LogOut, ArrowLeft, User as UserIcon } from 'lucide-react';

export const TherapistLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Therapist Topbar */}
      <header className="bg-[#2C2725] text-[#EDE5DC] border-b border-[#3D2D22] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/terapeuta" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#8C6F55] flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-serif font-bold text-lg text-white">SUMAQ</span>
                  <span className="text-[10px] ml-1.5 text-[#C8907E] font-semibold uppercase tracking-wider">Portal Terapeuta</span>
                </div>
              </Link>

              <nav className="hidden sm:flex items-center gap-4">
                <Link
                  to="/terapeuta"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/terapeuta')
                      ? 'bg-[#8C6F55] text-white'
                      : 'text-[#C9B29B] hover:text-white hover:bg-[#3D2D22]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Mi Agenda Diaria
                </Link>
                <Link
                  to="/terapeuta/inventario"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/terapeuta/inventario')
                      ? 'bg-[#8C6F55] text-white'
                      : 'text-[#C9B29B] hover:text-white hover:bg-[#3D2D22]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Insumos de Trabajo
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="hidden md:flex items-center gap-1 text-xs text-[#C9B29B] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Ver Sitio Público
              </Link>
              <div className="flex items-center gap-2 pl-3 border-l border-[#543F30]">
                <div className="w-7 h-7 rounded-full bg-[#8C6F55] flex items-center justify-center text-white text-xs font-bold">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-white leading-none">{user?.nombre_completo}</p>
                  <p className="text-[10px] text-[#A88B71] leading-none mt-0.5">Terapeuta Profesional</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Cerrar sesión"
                  className="text-[#C9B29B] hover:text-[#C84B31] p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
