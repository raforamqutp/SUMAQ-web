import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2C2725] text-[#EDE5DC] pt-16 pb-12 border-t border-[#543F30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8C6F55] flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-widest text-[#F6F2EC]">
                SUMAQ
              </span>
            </div>
            <p className="text-xs text-[#C9B29B] leading-relaxed">
              Sumaq Spa & Centro de Bienestar ofrece experiencias multisensoriales de relajación holística, tratamientos dermoestéticos avanzados y rituales termales de hidroterapia con insumos naturales de la más alta pureza.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#DFD0C0]">
              <ShieldCheck className="w-4 h-4 text-[#8FA89B]" />
              <span>Personal profesional certificado</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#DFD0C0]">Navegación</h4>
            <ul className="space-y-2 text-xs text-[#C9B29B]">
              <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/servicios" className="hover:text-white transition-colors">Catálogo de Servicios</Link></li>
              <li><a href="/#cabinas-terapeutas" className="hover:text-white transition-colors">Nuestras Cabinas y Terapeutas</a></li>
              <li><a href="/#promociones" className="hover:text-white transition-colors">Promociones y Cupones</a></li>
              <li><Link to="/reservar" className="hover:text-white transition-colors">Reservar Cita Online</Link></li>
            </ul>
          </div>

          {/* Col 3: Horarios de Atención */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#DFD0C0]">Horario de Atención</h4>
            <div className="space-y-2 text-xs text-[#C9B29B]">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#C8907E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#EDE5DC]">Lunes a Domingo</p>
                  <p>08:00 AM - 05:00 PM (9 turnos diarios)</p>
                </div>
              </div>
              <p className="text-[11px] text-[#A88B71] pt-1">
                * Citas programadas cada 60 minutos en nuestras 3 cabinas exclusivas.
              </p>
            </div>
          </div>

          {/* Col 4: Contact & Ubicación */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#DFD0C0]">Contacto & Ubicación</h4>
            <div className="space-y-2 text-xs text-[#C9B29B]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C8907E] shrink-0 mt-0.5" />
                <span>Av. Dos de Mayo 1420, San Isidro, Lima - Perú</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C8907E] shrink-0" />
                <span>+51 (01) 421-9876 / +51 987 654 321</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C8907E] shrink-0" />
                <span>contacto@sumaqspa.pe</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#3D2D22] flex flex-col sm:flex-row items-center justify-between text-xs text-[#A88B71] gap-4">
          <p>© {new Date().getFullYear()} Sumaq Spa & Centro de Bienestar. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Hecho con</span>
            <Heart className="w-3 h-3 text-[#C8907E] fill-current" />
            <span>para el cuidado de tu cuerpo y mente</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
