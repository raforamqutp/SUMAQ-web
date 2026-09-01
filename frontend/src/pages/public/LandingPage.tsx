import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import { Servicio, Terapeuta, Cabina, Promocion } from '../../types/models';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/Button';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  Heart,
  Droplets,
  Flower2,
  ShieldCheck,
  ArrowRight,
  Star,
  MapPin,
  Phone,
} from 'lucide-react';

/**
 * ============================================================================
 * VISTA: PÁGINA PRINCIPAL / LANDING PAGE (LandingPage.tsx)
 * ============================================================================
 * Portada institucional y experiencia de marca de Sumaq Spa:
 * 1. Hero Section: Título editorial, propuesta de valor y CTA de reserva.
 * 2. Presentación & Filosofía: Enfoque holístico, dermoestético e hidroterapia.
 * 3. Catálogo Destacado: Tratamientos más solicitados con precios y duración.
 * 4. Las 3 Cabinas Exclusivas: Recorrido visual de cada ambiente temático.
 * 5. Equipo de Terapeutas: Especialistas de bienestar con fotos y perfiles.
 * 6. Cupones y Promociones Activas: Cupones copiables con un solo clic.
 * 7. Testimonios de Clientes: Valoraciones reales 5 estrellas.
 * ============================================================================
 */
export const LandingPage: React.FC = () => {
  const { toast } = useToast();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [cabinas, setCabinas] = useState<Cabina[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servs, teraps, cabs, promos] = await Promise.all([
          publicService.getServicios(),
          publicService.getTerapeutas(),
          publicService.getCabinas(),
          publicService.getPromocionesActivas(),
        ]);
        setServicios(servs);
        setTerapeutas(teraps);
        setCabinas(cabs);
        setPromociones(promos);
      } catch (err) {
        console.error("Error loading landing data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('¡Cupón copiado!', `El código "${code}" ha sido copiado al portapapeles.`);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-[#F6F2EC] via-[#FAF8F5] to-[#FAF8F5] px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#E8D5C4]/40 via-[#F7EDE8]/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EDE5DC]/80 border border-[#DFD0C0] text-[#6F5540] text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C8907E]" />
            Santuario de Serenidad & Autocuidado
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#2C2725] tracking-tight leading-[1.1]">
            Desconecta del mundo, <br />
            <span className="italic font-normal text-[#8C6F55]">reconecta contigo.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#6F5540] max-w-2xl mx-auto font-light leading-relaxed">
            Bienvenido a <b>Sumaq Spa & Centro de Bienestar</b>. Un refugio diseñado para restaurar tu equilibrio físico, mental y emocional mediante rituales holísticos, dermoestética y sales terapéuticas.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/reservar" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto" icon={<Calendar className="w-5 h-5" />}>
                Reservar Cita Online
              </Button>
            </Link>
            <Link to="/servicios" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto" icon={<ArrowRight className="w-4 h-4" />}>
                Explorar Catálogo
              </Button>
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto pt-8 border-t border-[#EDE5DC]">
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#3D2D22]">3</p>
              <p className="text-[11px] uppercase tracking-wider text-[#8C6F55] font-semibold mt-0.5">Cabinas Exclusivas</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#3D2D22]">100%</p>
              <p className="text-[11px] uppercase tracking-wider text-[#8C6F55] font-semibold mt-0.5">Insumos Botánicos</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#3D2D22]">9</p>
              <p className="text-[11px] uppercase tracking-wider text-[#8C6F55] font-semibold mt-0.5">Turnos Diarios</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRESENTACIÓN DE SUMAQ SPA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-[#EDE5DC]">
              <img
                src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000"
                alt="Ambiente Sumaq Spa"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-[#FAF8F5] p-6 rounded-2xl border border-[#DFD0C0] shadow-lg hidden sm:block max-w-xs">
              <div className="flex items-center gap-1 text-[#D4AF37] mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs font-semibold text-[#3D2D22]">Atención Personalizada</p>
              <p className="text-[11px] text-[#8C6F55] mt-0.5">Fichas estéticas individuales y seguimiento clínico en cada sesión.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8C6F55]">
              <Flower2 className="w-4 h-4 text-[#C8907E]" />
              Nuestra Esencia
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2725] leading-tight">
              Un santuario donde la ciencia estética y el relax ancestral convergen.
            </h2>
            <p className="text-sm text-[#543F30] leading-relaxed">
              En Sumaq Spa, cada experiencia está concebida bajo estrictos estándares de armonía y bienestar. Disponemos de 3 cabinas especializadas (Holística, Dermoestética e Hidroterapia), cada una atendida por terapeutas dedicadas que aplican protocolos diseñados para revitalizar tu energía y cuidar tu piel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#EDE5DC]">
                <ShieldCheck className="w-5 h-5 text-[#8FA89B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#3D2D22]">Privacidad Absoluta</h4>
                  <p className="text-[11px] text-[#8C6F55]">Cabinas individuales privadas y acústicamente acondicionadas.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#EDE5DC]">
                <Droplets className="w-5 h-5 text-[#C8907E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#3D2D22]">Insumos Puros</h4>
                  <p className="text-[11px] text-[#8C6F55]">Aceites esenciales, sales minerales y exfoliantes de alta gama.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICIOS Y TRATAMIENTOS DESTACADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8C6F55]">Nuestras Experiencias</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2725] mt-1">
            Servicios y Rituales Estrella
          </h2>
          <p className="text-xs sm:text-sm text-[#6F5540] mt-2">
            Sesiones de 60 minutos con recetas botánicas exclusivas preparadas al momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {servicios.slice(0, 3).map((serv) => (
            <div
              key={serv.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#EDE5DC] shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={serv.imagen_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'}
                  alt={serv.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-[#FAF8F5]/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#5E3A2B] border border-[#DFD0C0]">
                  S/ {parseFloat(serv.precio_publico.toString()).toFixed(2)}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8C6F55] mb-2 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{serv.duracion_min} minutos</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#3D2D22] mb-2">{serv.nombre}</h3>
                  <p className="text-xs text-[#6F5540] leading-relaxed line-clamp-3 mb-4">
                    {serv.descripcion}
                  </p>

                  {/* Recipe items preview */}
                  {serv.recetas && serv.recetas.length > 0 && (
                    <div className="mb-4 pt-3 border-t border-[#F6F2EC]">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#A88B71] mb-1.5">Insumos del Ritual:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {serv.recetas.map((r) => (
                          <span key={r.id} className="text-[11px] px-2 py-0.5 rounded-md bg-[#F6F2EC] text-[#543F30] border border-[#EDE5DC]">
                            {r.producto_nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#F6F2EC]">
                  <Link to={`/reservar?servicio_id=${serv.id}`}>
                    <Button variant="primary" size="md" className="w-full" icon={<Calendar className="w-4 h-4" />}>
                      Reservar Este Servicio
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/servicios" className="inline-flex items-center gap-2 text-xs font-bold text-[#8C6F55] hover:text-[#2C2725] transition-colors">
            Ver todos los servicios y tratamientos disponibles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. CABINAS Y TERAPEUTAS */}
      <section id="cabinas-terapeutas" className="bg-[#F6F2EC]/60 py-16 border-y border-[#EDE5DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8C6F55]">Nuestras Instalaciones & Expertas</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2725] mt-1">
              3 Cabinas Temáticas & 3 Terapeutas
            </h2>
            <p className="text-xs sm:text-sm text-[#6F5540] mt-2">
              Cada cabina está equipada con tecnología e insumos específicos para cada tipo de tratamiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {terapeutas.map((terapeuta) => (
              <div
                key={terapeuta.id}
                className="bg-white rounded-3xl overflow-hidden border border-[#EDE5DC] shadow-sm hover:shadow-md transition-all p-6 text-center flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#DFD0C0] shadow-inner mb-4">
                  <img
                    src={terapeuta.foto_url || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400'}
                    alt={terapeuta.nombre_completo}
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#F7EDE8] text-[#8A3648] border border-[#F4BAC6] mb-2">
                  {terapeuta.cabina?.nombre || 'Cabina Especializada'} ({terapeuta.cabina?.tipo})
                </span>

                <h3 className="text-lg font-serif font-bold text-[#3D2D22]">{terapeuta.nombre_completo}</h3>
                <p className="text-xs text-[#8C6F55] font-medium mt-1">{terapeuta.especialidad}</p>

                <p className="text-[11px] text-[#6F5540] mt-3 leading-relaxed border-t border-[#F6F2EC] pt-3">
                  {terapeuta.cabina?.descripcion || 'Tratamientos personalizados en ambiente privado.'}
                </p>

                <div className="mt-6 w-full">
                  <Link to={`/reservar?terapeuta_id=${terapeuta.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Agendar con {terapeuta.nombre_completo.split(' ')[0]}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROMOCIONES ACTIVAS Y CUPONES */}
      <section id="promociones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#3D2D22] via-[#2C2725] to-[#1E1715] text-[#EDE5DC] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-[#543F30]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#8C6F55]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C8907E] mb-2">
              <Sparkles className="w-4 h-4" />
              Promociones Exclusivas de Temporada
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
              Disfruta de beneficios únicos en tu próxima visita.
            </h2>
            <p className="text-xs sm:text-sm text-[#C9B29B] mt-2 max-w-xl">
              Aplica nuestros cupones oficiales durante el paso 4 de tu reserva web para obtener descuentos inmediatos en tus rituales.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {promociones.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-[#FAF8F5]/10 backdrop-blur-md border border-[#DFD0C0]/20 rounded-2xl p-5 flex flex-col justify-between hover:bg-[#FAF8F5]/15 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-serif font-bold text-[#E8D5C4]">
                        {parseFloat(promo.porcentaje_descuento.toString())}% OFF
                      </span>
                      <span className="text-[10px] text-[#A88B71] uppercase tracking-wider">Cupón Oficial</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1">{promo.titulo}</h4>
                    <p className="text-xs text-[#C9B29B] mt-1 line-clamp-2">{promo.descripcion}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-wider text-[#C8907E] bg-black/40 px-2.5 py-1 rounded-lg">
                      {promo.codigo_cupon}
                    </span>
                    <button
                      onClick={() => copyCoupon(promo.codigo_cupon)}
                      className="text-xs text-[#EDE5DC] hover:text-white flex items-center gap-1 bg-[#8C6F55]/60 hover:bg-[#8C6F55] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link to="/reservar">
                <Button variant="primary" size="lg" icon={<Calendar className="w-4 h-4" />}>
                  Reservar y Aplicar Cupón Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION & HORARIOS */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2725]">
          Tu momento de renovación comienza aquí.
        </h2>
        <p className="text-sm text-[#6F5540] max-w-lg mx-auto">
          Atención continua de 08:00 a 17:00. Reserva en menos de 2 minutos sin necesidad de crear cuenta previa.
        </p>
        <div className="pt-2">
          <Link to="/reservar">
            <Button variant="primary" size="lg" icon={<Calendar className="w-5 h-5" />}>
              Reservar Cita en Línea
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
