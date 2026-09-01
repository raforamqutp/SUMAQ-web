import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/Button';
import { Sparkles, Lock, Mail, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const rutaOrigen = location.state?.from?.pathname || '/';

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !contrasena) {
      toast.error('Campos obligatorios', 'Por favor ingrese su correo y contraseña.');
      return;
    }
    setCargando(true);
    try {
      const data = await login(correo, contrasena);
      toast.success('Bienvenido al sistema', `Sesion iniciada como ${data.user.nombre_completo}`);
      if (data.user.rol === 'ADMIN') {
        navigate('/admin');
      } else if (data.user.rol === 'RECEPCIONISTA') {
        navigate('/admin/agenda');
      } else if (data.user.rol === 'TERAPEUTA') {
        navigate('/terapeuta');
      } else {
        navigate(rutaOrigen);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Credenciales invalidas o cuenta inactiva.';
      toast.error('Error de autenticacion', msg);
    } finally {
      setCargando(false);
    }
  };

  const manejarAccesoRapido = (correoDemo: string, contrasenaDemo: string) => {
    setCorreo(correoDemo);
    setContrasena(contrasenaDemo);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-[#8C6F55] hover:text-[#2C2725] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a la pagina principal
        </Link>
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8C6F55] via-[#C8907E] to-[#DFD0C0] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-serif font-bold tracking-tight text-[#3D2D22]">
          Acceso al Sistema
        </h2>
        <p className="mt-1 text-center text-xs text-[#8C6F55]">
          Sumaq Spa & Centro de Bienestar &middot; Portal Privado
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white/90 border border-[#EDE5DC] py-8 px-6 shadow-sm rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={manejarEnvio}>
            <div>
              <label className="block text-xs font-semibold text-[#543F30]">
                Correo Electronico
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A88B71]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  placeholder="ejemplo@sumaqspa.pe"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] placeholder-[#C9B29B] focus:outline-none focus:ring-2 focus:ring-[#8C6F55] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#543F30]">
                Contrasena
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A88B71]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] placeholder-[#C9B29B] focus:outline-none focus:ring-2 focus:ring-[#8C6F55] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={cargando}
              className="w-full"
            >
              Iniciar Sesion
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-[#EDE5DC]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C6F55] text-center mb-3">
              Credenciales de Demostracion por Rol
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => manejarAccesoRapido('admin@sumaqspa.pe', 'AdminSumaq2026!')}
                className="p-2.5 text-left rounded-xl border border-[#DFD0C0] bg-[#F6F2EC] hover:bg-[#EDE5DC] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5A3896]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin General</span>
                </div>
                <p className="text-[10px] text-[#8C6F55] mt-0.5 truncate">admin@sumaqspa.pe</p>
              </button>

              <button
                type="button"
                onClick={() => manejarAccesoRapido('recepcion@sumaqspa.pe', 'Recepcion2026!')}
                className="p-2.5 text-left rounded-xl border border-[#DFD0C0] bg-[#F6F2EC] hover:bg-[#EDE5DC] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0077B6]">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Recepcionista</span>
                </div>
                <p className="text-[10px] text-[#8C6F55] mt-0.5 truncate">recepcion@sumaqspa.pe</p>
              </button>

              <button
                type="button"
                onClick={() => manejarAccesoRapido('elena.morales@sumaqspa.pe', 'Terapeuta2026!')}
                className="p-2.5 text-left rounded-xl border border-[#DFD0C0] bg-[#F6F2EC] hover:bg-[#EDE5DC] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A3648]">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Terapeuta Elena</span>
                </div>
                <p className="text-[10px] text-[#8C6F55] mt-0.5 truncate">elena.morales@sumaqspa.pe</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
