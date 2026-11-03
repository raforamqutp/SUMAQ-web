import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/Button';
import { Sparkles, Lock, Mail, ArrowLeft, ShieldCheck, Calendar, Terminal } from 'lucide-react';

const DEMO_USERS = [
  {
    role: 'Admin General',
    area: 'Gestión total, finanzas y reportes',
    email: 'admin@sumaqspa.pe',
    pass: 'AdminSumaq2026!',
    icon: ShieldCheck,
    iconColor: 'text-[#5A3896]',
    iconBg: 'bg-[#5A3896]/10',
  },
  {
    role: 'Recepcionista',
    area: 'Agenda de citas, clientes y caja',
    email: 'recepcion@sumaqspa.pe',
    pass: 'Sumaq2026!',
    icon: Calendar,
    iconColor: 'text-[#0077B6]',
    iconBg: 'bg-[#0077B6]/10',
  },
  {
    role: 'Terapeuta Elena',
    area: 'Atención de citas y fichas clínicas',
    email: 'elena.morales@sumaqspa.pe',
    pass: 'Sumaq2026!',
    icon: Sparkles,
    iconColor: 'text-[#8A3648]',
    iconBg: 'bg-[#8A3648]/10',
  },
  {
    role: 'Soporte TI',
    area: 'Service Desk, CAB y gestión ITIL',
    email: 'soporte.ti@sumaqspa.pe',
    pass: 'Sumaq2026!',
    icon: Terminal,
    iconColor: 'text-[#B23B2A]',
    iconBg: 'bg-[#B23B2A]/10',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // Autenticación y redirección por rol
  const performLogin = async (targetEmail: string, targetPass: string) => {
    if (!targetEmail || !targetPass) {
      toast.error('Campos obligatorios', 'Por favor ingrese su correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(targetEmail, targetPass);
      const userName = data.user?.nombre_completo || data.user?.email || 'Usuario';
      toast.success('Bienvenido al sistema', `Sesión iniciada correctamente como ${userName}.`);
      if (data.user.rol === 'ADMIN') {
        navigate('/admin');
      } else if (data.user.rol === 'RECEPCIONISTA') {
        navigate('/admin/agenda');
      } else if (data.user.rol === 'TERAPEUTA') {
        navigate('/terapeuta');
      } else if (data.user.rol === 'SOPORTE_TI') {
        navigate('/ti');
      } else {
        navigate(from);
      }
    } catch (err: any) {
      const msg = err.message || err.response?.data?.error?.message || 'Credenciales inválidas o cuenta inactiva.';
      toast.error('Error de autenticación', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    await performLogin(demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-[#8C6F55] hover:text-[#2C2725] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a la página principal
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white/95 border border-[#EDE5DC] py-8 px-6 shadow-sm rounded-2xl sm:px-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#543F30]">
                Correo Electrónico
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A88B71]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ejemplo@sumaqspa.pe"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] placeholder-[#C9B29B] focus:outline-none focus:ring-2 focus:ring-[#8C6F55] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#543F30]">
                Contraseña
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A88B71]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              loading={loading}
              className="w-full"
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-[#EDE5DC]">
            <div className="text-center mb-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6F55]">
                Credenciales de Demostración por Rol
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_USERS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => handleQuickLogin(item.email, item.pass)}
                    className="p-3 text-left rounded-xl border border-[#DFD0C0] bg-[#FAF8F5] hover:bg-white hover:border-[#8C6F55] hover:shadow-sm transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8C6F55]/20 flex items-start gap-3"
                  >
                    <div className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} shrink-0 mt-0.5 transition-transform group-hover:scale-110`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-[#2C2725] group-hover:text-[#8C6F55] transition-colors">
                          {item.role}
                        </span>
                        <span className="text-[10px] text-[#8C6F55] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Entrar &rarr;
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A624E] font-medium mt-0.5 break-all sm:break-normal">
                        {item.email}
                      </p>
                      <p className="text-[10px] text-[#A08875] mt-0.5 leading-tight">
                        {item.area}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
