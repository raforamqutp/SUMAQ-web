import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Sparkles, Calendar, User as UserIcon, LogOut, Menu, X, Shield, Clock } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isTherapist, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EDE5DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8C6F55] via-[#C8907E] to-[#DFD0C0] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-widest text-[#3D2D22] block leading-none">
                SUMAQ
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6F55] font-semibold block mt-0.5">
                Spa & Bienestar
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-[#8C6F55] ${
                isActive('/') ? 'text-[#8C6F55] font-semibold border-b-2 border-[#8C6F55] pb-1' : 'text-[#543F30]'
              }`}
            >
              Inicio
            </Link>
            <Link
              to="/servicios"
              className={`text-sm font-medium transition-colors hover:text-[#8C6F55] ${
                isActive('/servicios') ? 'text-[#8C6F55] font-semibold border-b-2 border-[#8C6F55] pb-1' : 'text-[#543F30]'
              }`}
            >
              Servicios & Rituales
            </Link>
            <a
              href="/#cabinas-terapeutas"
              className="text-sm font-medium text-[#543F30] hover:text-[#8C6F55] transition-colors"
            >
              Cabinas & Terapeutas
            </a>
            <a
              href="/#promociones"
              className="text-sm font-medium text-[#543F30] hover:text-[#8C6F55] transition-colors"
            >
              Promociones
            </a>
          </nav>

          {/* Action CTAs and User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/reservar">
              <Button variant="primary" size="md" icon={<Calendar className="w-4 h-4" />}>
                Reservar Cita
              </Button>
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#DFD0C0]">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm" icon={<Shield className="w-3.5 h-3.5" />}>
                      Panel Admin
                    </Button>
                  </Link>
                )}
                {isTherapist && (
                  <Link to="/terapeuta">
                    <Button variant="secondary" size="sm" icon={<Clock className="w-3.5 h-3.5" />}>
                      Mi Agenda
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EDE5DC] text-xs font-medium text-[#543F30]">
                  <UserIcon className="w-3.5 h-3.5 text-[#8C6F55]" />
                  <span className="max-w-[120px] truncate">{user.nombre_completo.split(' ')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="text-[#8C6F55] hover:text-[#C84B31] p-1.5 rounded-lg hover:bg-[#EDE5DC] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-xs font-semibold text-[#8C6F55] hover:text-[#3D2D22] transition-colors">
                Acceso Personal
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link to="/reservar">
              <Button variant="primary" size="sm">
                Reservar
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#543F30] p-2 rounded-lg hover:bg-[#EDE5DC]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-[#EDE5DC] px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[#3D2D22] border-b border-[#EDE5DC]"
          >
            Inicio
          </Link>
          <Link
            to="/servicios"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[#3D2D22] border-b border-[#EDE5DC]"
          >
            Servicios & Rituales
          </Link>
          <a
            href="/#cabinas-terapeutas"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[#3D2D22] border-b border-[#EDE5DC]"
          >
            Cabinas & Terapeutas
          </a>
          <a
            href="/#promociones"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-[#3D2D22] border-b border-[#EDE5DC]"
          >
            Promociones
          </a>

          {isAuthenticated && user ? (
            <div className="pt-3 space-y-2">
              <p className="text-xs text-[#8C6F55]">Sesión iniciada como: <b>{user.nombre_completo}</b></p>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2 text-center text-sm font-semibold bg-[#EDE5DC] text-[#543F30] rounded-xl"
                >
                  Panel Administrador
                </Link>
              )}
              {isTherapist && (
                <Link
                  to="/terapeuta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2 text-center text-sm font-semibold bg-[#EDE5DC] text-[#543F30] rounded-xl"
                >
                  Mi Agenda del Día
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2 text-center text-sm font-semibold text-[#C84B31] border border-[#F8B4AB] rounded-xl"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-semibold text-[#8C6F55] border border-[#C9B29B] rounded-xl"
              >
                Acceso Personal (Staff / Terapeuta)
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
