import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import { Servicio, Terapeuta, Cabina, SlotDisponibilidad, Promocion } from '../../types/models';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/Button';
import {
  User,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Lock,
  QrCode,
  Banknote,
} from 'lucide-react';

export const BookingWizardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Data from Backend
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [cabinas, setCabinas] = useState<Cabina[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState<SlotDisponibilidad[]>([]);

  // Step 1: Customer Info
  const [dni, setDni] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Service & Therapist
  const [selectedServicioId, setSelectedServicioId] = useState<number | null>(null);
  const [selectedTerapeutaId, setSelectedTerapeutaId] = useState<number | null>(null);
  const [selectedCabinaId, setSelectedCabinaId] = useState<number | null>(null);

  // Step 3: Date & Slot
  const todayStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<SlotDisponibilidad | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 4: Payment & Coupon
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN'>('TARJETA');
  const [codigoCupon, setCodigoCupon] = useState('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [cuponValido, setCuponValido] = useState<boolean | null>(null);

  // Online Card State (4 automatic non-space chunks)
  const [cardChunk0, setCardChunk0] = useState('4557');
  const [cardChunk1, setCardChunk1] = useState('8901');
  const [cardChunk2, setCardChunk2] = useState('2345');
  const [cardChunk3, setCardChunk3] = useState('6789');
  const [cardHolder, setCardHolder] = useState('MARIA GARCIA RAMOS');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');

  // Yape Approval State
  const [yapePhone, setYapePhone] = useState('987654321');
  const [yapeOtp, setYapeOtp] = useState('136441');
  const [yapeVerified, setYapeVerified] = useState(false);

  // Plin QR State
  const [plinVerified, setPlinVerified] = useState(false);
  const [plinChecking, setPlinChecking] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const handleChunkChange = (
    _index: number,
    val: string,
    setter: (v: string) => void,
    nextId?: string
  ) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setter(clean);
    if (clean.length === 4 && nextId) {
      document.getElementById(nextId)?.focus();
    }
  };

  const handleChunkKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentVal: string,
    prevId?: string
  ) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
    }
    if (e.key === 'Backspace' && !currentVal && prevId) {
      document.getElementById(prevId)?.focus();
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
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

        // Preselect from URL params if present
        const urlServicio = searchParams.get('servicio_id');
        if (urlServicio) {
          const sId = parseInt(urlServicio, 10);
          setSelectedServicioId(sId);
        } else if (servs.length > 0) {
          setSelectedServicioId(servs[0].id);
        }

        const urlTerapeuta = searchParams.get('terapeuta_id');
        if (urlTerapeuta) {
          const tId = parseInt(urlTerapeuta, 10);
          setSelectedTerapeutaId(tId);
          const tObj = teraps.find((t) => t.id === tId);
          if (tObj?.cabina?.id) setSelectedCabinaId(tObj.cabina.id);
        } else if (teraps.length > 0) {
          setSelectedTerapeutaId(teraps[0].id);
          if (teraps[0].cabina?.id) setSelectedCabinaId(teraps[0].cabina.id);
        }
      } catch (err) {
        console.error("Error loading booking init data:", err);
      }
    };
    init();
  }, [searchParams]);

  // Fetch Availability Slots when date, service or therapist changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!fecha) return;
      setLoadingSlots(true);
      try {
        const res = await publicService.getDisponibilidad(
          fecha,
          selectedServicioId || undefined,
          selectedTerapeutaId || undefined,
          selectedCabinaId || undefined
        );
        setSlotsDisponibles(res.slots);
      } catch (err) {
        console.error("Error fetching availability slots:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [fecha, selectedServicioId, selectedTerapeutaId, selectedCabinaId]);

  // When therapist changes, sync cabin
  const handleSelectTerapeuta = (tId: number) => {
    setSelectedTerapeutaId(tId);
    const tObj = terapeutas.find((t) => t.id === tId);
    if (tObj?.cabina?.id) {
      setSelectedCabinaId(tObj.cabina.id);
    }
    setSelectedSlot(null);
  };

  // Coupon application handler
  const handleApplyCoupon = () => {
    if (!codigoCupon.trim()) {
      setDescuentoPorcentaje(0);
      setCuponValido(null);
      return;
    }
    const promo = promociones.find(
      (p) => p.codigo_cupon.toUpperCase() === codigoCupon.trim().toUpperCase()
    );
    if (promo) {
      setDescuentoPorcentaje(parseFloat(promo.porcentaje_descuento.toString()));
      setCuponValido(true);
      toast.success('¡Cupón aplicado!', `Se ha aplicado un ${promo.porcentaje_descuento}% de descuento.`);
    } else {
      setDescuentoPorcentaje(0);
      setCuponValido(false);
      toast.error('Cupón no válido', 'El código de cupón no existe o ha expirado.');
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!dni.trim() || dni.trim().length < 8) {
      toast.error('DNI inválido', 'Por favor ingrese un número de DNI o documento válido (mínimo 8 dígitos).');
      return false;
    }
    if (!nombreCompleto.trim() || nombreCompleto.trim().length < 3) {
      toast.error('Nombre requerido', 'Por favor ingrese su nombre completo.');
      return false;
    }
    if (!telefono.trim() || telefono.trim().length < 7) {
      toast.error('Teléfono requerido', 'Por favor ingrese un número de teléfono de contacto.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!selectedServicioId) {
      toast.error('Servicio requerido', 'Seleccione un servicio para continuar.');
      return false;
    }
    if (!selectedTerapeutaId || !selectedCabinaId) {
      toast.error('Terapeuta requerido', 'Seleccione una terapeuta y cabina.');
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!selectedSlot) {
      toast.error('Horario requerido', 'Por favor elija un horario disponible de la lista.');
      return false;
    }
    return true;
  };

  // Calculations
  const selectedServicio = servicios.find((s) => s.id === selectedServicioId);
  const selectedTerapeuta = terapeutas.find((t) => t.id === selectedTerapeutaId);
  const selectedCabina = cabinas.find((c) => c.id === selectedCabinaId);

  const subtotal = selectedServicio ? parseFloat(selectedServicio.precio_publico.toString()) : 0;
  const descuento = subtotal * (descuentoPorcentaje / 100);
  const montoTotal = Math.max(0, subtotal - descuento);

  // Final Submit
  const handleFinalBooking = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    setSubmitting(true);
    try {
      const payload = {
        dni: dni.trim(),
        nombre_completo: nombreCompleto.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        servicio_id: selectedServicioId!,
        terapeuta_id: selectedTerapeutaId!,
        cabina_id: selectedCabinaId!,
        fecha,
        hora_inicio: selectedSlot!.hora_inicio + ':00',
        metodo_pago: metodoPago,
        codigo_cupon: cuponValido ? codigoCupon.trim() : undefined,
      };

      const citaCreated = await publicService.reservarWeb(payload);
      toast.success('¡Reserva Exitosa!', `Código: ${citaCreated.codigo_reserva}`);
      navigate('/confirmacion', { state: { cita: citaCreated } });
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      const errorMsg = errorData?.message || 'No fue posible completar la reserva. Por favor intente nuevamente.';
      toast.error('Error al reservar', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Title Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2725]">
          Reserva de Cita Online
        </h1>
        <p className="text-xs sm:text-sm text-[#6F5540] mt-1.5">
          Proceso guiado de 4 pasos &middot; Confirmación inmediata
        </p>
      </div>

      {/* Steps Indicator Bar */}
      <div className="mb-10">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { num: 1, name: 'Datos Personales', icon: User },
            { num: 2, name: 'Servicio & Cabina', icon: Sparkles },
            { num: 3, name: 'Fecha & Horario', icon: CalendarIcon },
            { num: 4, name: 'Pago & Confirmación', icon: CreditCard },
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                    isCurrent
                      ? 'bg-[#8C6F55] text-white shadow-md ring-4 ring-[#EDE5DC]'
                      : isCompleted
                      ? 'bg-[#24634B] text-white'
                      : 'bg-[#EDE5DC] text-[#8C6F55]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-semibold mt-2 ${
                    isCurrent ? 'text-[#3D2D22]' : 'text-[#8C6F55]'
                  }`}
                >
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm p-6 sm:p-10">
        {/* PASO 1: DATOS DEL CLIENTE */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#3D2D22]">Paso 1: Datos de Identificación</h2>
              <p className="text-xs text-[#6F5540] mt-1">
                Recuerda que por política de bienestar se permite <b>máximo 1 cita por DNI por día</b>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="dni-cliente" className="block text-xs font-semibold text-[#543F30] mb-1.5">
                  DNI / Documento de Identidad <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  id="dni-cliente"
                  aria-label="Documento nacional de identidad del cliente"
                  type="text"
                  maxLength={12}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 72345678"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
              </div>

              <div>
                <label htmlFor="nombre-cliente" className="block text-xs font-semibold text-[#543F30] mb-1.5">
                  Nombre y Apellidos Completos <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  id="nombre-cliente"
                  aria-label="Nombre y apellidos completos del cliente"
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej: Laura Ramírez Silva"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
              </div>

              <div>
                <label htmlFor="telefono-cliente" className="block text-xs font-semibold text-[#543F30] mb-1.5">
                  Teléfono / WhatsApp de Contacto <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  id="telefono-cliente"
                  aria-label="Teléfono o número de WhatsApp"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 987654321"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
              </div>

              <div>
                <label htmlFor="email-cliente" className="block text-xs font-semibold text-[#543F30] mb-1.5">
                  Correo Electrónico (Para envío de comprobante)
                </label>
                <input
                  id="email-cliente"
                  aria-label="Correo electrónico para recibir comprobante de reserva"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: laura.ramirez@gmail.com"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}
                icon={<ChevronRight className="w-5 h-5" />}
              >
                Continuar a Selección de Servicio
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2: SELECCIÓN DE SERVICIO, TERAPEUTA Y CABINA */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#3D2D22]">Paso 2: Elige tu Ritual y Especialista</h2>
              <p className="text-xs text-[#6F5540] mt-1">Selecciona el tratamiento deseado y la terapeuta a cargo.</p>
            </div>

            {/* Servicio Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8C6F55] mb-3">
                1. Selecciona el Servicio Base
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {servicios.map((serv) => (
                  <div
                    key={serv.id}
                    onClick={() => setSelectedServicioId(serv.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedServicioId === serv.id
                        ? 'border-[#8C6F55] bg-[#F6F2EC] shadow-sm'
                        : 'border-[#EDE5DC] bg-white hover:border-[#DFD0C0]'
                    }`}
                  >
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#3D2D22]">{serv.nombre}</h4>
                      <p className="text-[11px] text-[#6F5540] mt-1 line-clamp-2">{serv.descripcion}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-[#DFD0C0]/60 flex items-center justify-between">
                      <span className="text-xs text-[#8C6F55] font-medium">{serv.duracion_min} min</span>
                      <span className="text-sm font-bold text-[#5E3A2B]">
                        S/ {parseFloat(serv.precio_publico.toString()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terapeuta & Cabina Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8C6F55] mb-3">
                2. Selecciona la Terapeuta & Cabina
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {terapeutas.map((terap) => (
                  <div
                    key={terap.id}
                    onClick={() => handleSelectTerapeuta(terap.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      selectedTerapeutaId === terap.id
                        ? 'border-[#8C6F55] bg-[#F6F2EC] shadow-sm'
                        : 'border-[#EDE5DC] bg-white hover:border-[#DFD0C0]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#DFD0C0]">
                      <img
                        src={terap.foto_url || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=200'}
                        alt={terap.nombre_completo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-sm text-[#3D2D22] truncate">{terap.nombre_completo}</h4>
                      <p className="text-[10px] font-semibold text-[#8A3648] truncate">{terap.cabina?.nombre}</p>
                      <p className="text-[10px] text-[#8C6F55] truncate">{terap.especialidad}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(1)} icon={<ChevronLeft className="w-4 h-4" />}>
                Volver
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (validateStep2()) setCurrentStep(3);
                }}
                icon={<ChevronRight className="w-5 h-5" />}
              >
                Continuar a Selección de Fecha y Horario
              </Button>
            </div>
          </div>
        )}

        {/* PASO 3: FECHA Y SELECCIÓN DE HORARIOS DISPONIBLES EN VIVO */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#3D2D22]">Paso 3: Fecha y Horario Disponible</h2>
              <p className="text-xs text-[#6F5540] mt-1">
                La disponibilidad se calcula en tiempo real desde el servidor. Turnos de 60 minutos entre las 08:00 y las 17:00.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE5DC] max-w-sm">
              <label htmlFor="fecha-reserva-wizard" className="block text-xs font-semibold text-[#543F30] mb-1.5">
                Selecciona la Fecha de Atención
              </label>
              <input
                id="fecha-reserva-wizard"
                aria-label="Seleccionar fecha de atención para la cita"
                type="date"
                min={todayStr}
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setSelectedSlot(null);
                }}
                className="w-full px-4 py-2 bg-white border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8C6F55] mb-3">
                Horarios Disponibles para el {fecha} con {selectedTerapeuta?.nombre_completo}
              </label>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-[#6F5540] ml-3">Consultando disponibilidad en tiempo real...</span>
                </div>
              ) : slotsDisponibles.length === 0 ? (
                <p className="text-xs text-[#8C6F55] italic">No hay slots configurados para esta fecha.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slotsDisponibles.map((slot, idx) => (
                    <button
                      key={idx}
                      disabled={!slot.disponible}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        !slot.disponible
                          ? 'bg-[#F6F2EC]/60 border-[#EDE5DC] text-[#A88B71] opacity-50 cursor-not-allowed line-through'
                          : selectedSlot?.hora_inicio === slot.hora_inicio
                          ? 'bg-[#8C6F55] text-white border-[#8C6F55] shadow-md'
                          : 'bg-white border-[#DFD0C0] text-[#3D2D22] hover:border-[#8C6F55]'
                      }`}
                    >
                      <div className="text-sm font-bold">
                        {slot.hora_inicio} - {slot.hora_fin}
                      </div>
                      <p className={`text-[10px] mt-0.5 ${selectedSlot?.hora_inicio === slot.hora_inicio ? 'text-[#FAF8F5]' : 'text-[#8C6F55]'}`}>
                        {slot.disponible ? 'Disponible' : 'Ocupado'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(2)} icon={<ChevronLeft className="w-4 h-4" />}>
                Volver
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (validateStep3()) setCurrentStep(4);
                }}
                icon={<ChevronRight className="w-5 h-5" />}
              >
                Continuar al Pago y Resumen
              </Button>
            </div>
          </div>
        )}

        {/* PASO 4: PAGO, CUPÓN Y CONFIRMACIÓN */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#3D2D22]">Paso 4: Resumen & Confirmación de Pago</h2>
              <p className="text-xs text-[#6F5540] mt-1">Revisa los detalles de tu cita y selecciona tu método de pago preferido.</p>
            </div>

            {/* Appointment Summary Box */}
            <div className="bg-[#FAF8F5] border border-[#EDE5DC] rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Detalles de la Reserva</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#8C6F55] block">Cliente:</span>
                  <span className="font-semibold text-[#2C2725]">{nombreCompleto} (DNI: {dni})</span>
                </div>
                <div>
                  <span className="text-[#8C6F55] block">Contacto:</span>
                  <span className="font-semibold text-[#2C2725]">{telefono} {email ? `&middot; ${email}` : ''}</span>
                </div>
                <div>
                  <span className="text-[#8C6F55] block">Servicio Seleccionado:</span>
                  <span className="font-semibold text-[#2C2725]">{selectedServicio?.nombre} (60 min)</span>
                </div>
                <div>
                  <span className="text-[#8C6F55] block">Terapeuta & Cabina:</span>
                  <span className="font-semibold text-[#2C2725]">{selectedTerapeuta?.nombre_completo} &middot; {selectedCabina?.nombre}</span>
                </div>
                <div>
                  <span className="text-[#8C6F55] block">Fecha & Horario:</span>
                  <span className="font-semibold text-[#2C2725]">{fecha} &middot; {selectedSlot?.hora_inicio} a {selectedSlot?.hora_fin}</span>
                </div>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div>
              <label className="block text-xs font-semibold text-[#543F30] mb-1.5">
                ¿Tienes un Cupón de Descuento?
              </label>
              <div className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A88B71]">
                    <Tag className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={codigoCupon}
                    onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                    placeholder="Ej: SUMAQBIENVENIDA"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm font-mono uppercase text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                  />
                </div>
                <Button variant="secondary" size="md" onClick={handleApplyCoupon}>
                  Aplicar
                </Button>
              </div>
              {cuponValido === true && (
                <p className="text-xs text-[#24634B] font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cupón válido aplicado (-{descuentoPorcentaje}%)
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8C6F55]">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'TARJETA', label: 'Tarjeta Déb./Créd.', desc: 'Pasarela Online Segura' },
                  { id: 'YAPE', label: 'Yape Móvil', desc: 'Código de aprobación' },
                  { id: 'PLIN', label: 'Plin QR', desc: 'Transferencia directa' },
                  { id: 'EFECTIVO', label: 'Efectivo en Caja', desc: 'Pago en recepción' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setMetodoPago(m.id as any);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                      metodoPago === m.id
                        ? 'border-[#8C6F55] bg-[#F6F2EC] shadow-sm'
                        : 'border-[#EDE5DC] bg-white hover:border-[#DFD0C0]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#3D2D22]">{m.label}</p>
                    <p className="text-[10px] text-[#8C6F55] mt-0.5">{m.desc}</p>
                  </div>
                ))}
              </div>

              {/* Specific Payment Protocol Details */}
              {metodoPago === 'TARJETA' && (
                <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#DFD0C0] space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-[#EDE5DC] pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#8C6F55]" />
                      <span className="text-xs font-bold text-[#2C2725]">Pago Seguro con Tarjeta en Linea</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">VISA</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">MASTERCARD</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">AMEX</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[#543F30] font-semibold">Numero de Tarjeta (16 digitos)</label>
                        <span className="text-[10px] text-[#8C6F55]">4 bloques de 4 digitos</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          id="card-chunk-0"
                          aria-label="Primeros 4 digitos de la tarjeta"
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardChunk0}
                          placeholder="4557"
                          onChange={(e) => handleChunkChange(0, e.target.value, setCardChunk0, 'card-chunk-1')}
                          onKeyDown={(e) => handleChunkKeyDown(e, cardChunk0)}
                          className="w-full py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-sm text-center font-semibold text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                        />
                        <input
                          id="card-chunk-1"
                          aria-label="Segundos 4 digitos de la tarjeta"
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardChunk1}
                          placeholder="8901"
                          onChange={(e) => handleChunkChange(1, e.target.value, setCardChunk1, 'card-chunk-2')}
                          onKeyDown={(e) => handleChunkKeyDown(e, cardChunk1, 'card-chunk-0')}
                          className="w-full py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-sm text-center font-semibold text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                        />
                        <input
                          id="card-chunk-2"
                          aria-label="Terceros 4 digitos de la tarjeta"
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardChunk2}
                          placeholder="2345"
                          onChange={(e) => handleChunkChange(2, e.target.value, setCardChunk2, 'card-chunk-3')}
                          onKeyDown={(e) => handleChunkKeyDown(e, cardChunk2, 'card-chunk-1')}
                          className="w-full py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-sm text-center font-semibold text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                        />
                        <input
                          id="card-chunk-3"
                          aria-label="Ultimos 4 digitos de la tarjeta"
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardChunk3}
                          placeholder="6789"
                          onChange={(e) => handleChunkChange(3, e.target.value, setCardChunk3)}
                          onKeyDown={(e) => handleChunkKeyDown(e, cardChunk3, 'card-chunk-2')}
                          className="w-full py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-sm text-center font-semibold text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="card-holder-name" className="block text-[#543F30] font-semibold mb-1">Nombre y Apellidos del Titular</label>
                      <input
                        id="card-holder-name"
                        aria-label="Nombre y apellidos del titular de la tarjeta"
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="Como figura en la tarjeta"
                        className="w-full px-3 py-2.5 bg-white border border-[#DFD0C0] rounded-xl text-xs uppercase text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                      />
                    </div>

                    <div>
                      <label htmlFor="card-exp-date" className="block text-[#543F30] font-semibold mb-1">Fecha de Expiracion</label>
                      <input
                        id="card-exp-date"
                        aria-label="Fecha de expiracion mes y año"
                        type="text"
                        maxLength={5}
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        placeholder="MM/AA (Ej: 12/28)"
                        className="w-full px-3 py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-xs text-center text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                      />
                    </div>

                    <div>
                      <label htmlFor="card-cvv-code" className="block text-[#543F30] font-semibold mb-1">Codigo de Seguridad (CVV)</label>
                      <div className="relative">
                        <input
                          id="card-cvv-code"
                          aria-label="Codigo de seguridad CVV de 3 digitos"
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="3 digitos al reverso"
                          className="w-full px-3 py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-xs text-center text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                        />
                        <Lock className="w-3.5 h-3.5 text-[#A88B71] absolute right-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#7A7067] flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Transaccion cifrada con encriptacion SSL de 256 bits &middot; Pasarela Sumaq Pay
                  </p>
                </div>
              )}

              {metodoPago === 'YAPE' && (
                <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#7A2182]/30 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-[#EDE5DC] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#7A2182] text-white flex items-center justify-center font-bold text-xs">
                        Y
                      </div>
                      <span className="text-xs font-bold text-[#2C2725]">Pago con Yape Movil</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#7A2182]/10 text-[#7A2182] rounded-full text-[10px] font-bold">
                      Aprobacion Inmediata
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label htmlFor="yape-phone-number" className="block text-[#543F30] font-semibold mb-1">Numero de Celular Yape</label>
                      <input
                        id="yape-phone-number"
                        aria-label="Numero de celular registrado en Yape"
                        type="text"
                        maxLength={9}
                        value={yapePhone}
                        onChange={(e) => setYapePhone(e.target.value)}
                        placeholder="Ej: 987654321"
                        className="w-full px-3 py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-sm text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#7A2182]"
                      />
                    </div>

                    <div>
                      <label htmlFor="yape-otp-code" className="block text-[#543F30] font-semibold mb-1">
                        Codigo de Aprobacion Yape (6 digitos)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="yape-otp-code"
                          aria-label="Codigo de aprobacion OTP de 6 digitos de Yape"
                          type="text"
                          maxLength={6}
                          value={yapeOtp}
                          onChange={(e) => {
                            setYapeOtp(e.target.value);
                            setYapeVerified(false);
                          }}
                          placeholder="Ej: 136441"
                          className="w-full px-3 py-2.5 bg-white border border-[#DFD0C0] rounded-xl font-mono text-sm font-bold text-center tracking-widest text-[#7A2182] focus:outline-none focus:ring-2 focus:ring-[#7A2182]"
                        />
                        <button
                          type="button"
                          aria-label="Validar codigo de aprobacion Yape"
                          onClick={() => {
                            if (yapeOtp.trim().length >= 5) {
                              setYapeVerified(true);
                              toast.success('Pago Yape Verificado', `Codigo ${yapeOtp} validado exitosamente por S/ ${montoTotal.toFixed(2)}.`);
                            } else {
                              toast.error('Codigo Invalido', 'Ingrese los 6 digitos que muestra su App Yape.');
                            }
                          }}
                          className="px-3.5 py-2 bg-[#7A2182] text-white rounded-xl text-xs font-semibold hover:bg-[#681B6F] transition shrink-0 flex items-center gap-1.5"
                        >
                          {yapeVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{yapeVerified ? 'Validado' : 'Validar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {yapeVerified && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pago realizado correctamente por S/ {montoTotal.toFixed(2)}. Puede proceder a confirmar la reserva.</span>
                    </div>
                  )}
                </div>
              )}

              {metodoPago === 'PLIN' && (
                <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#00B4D8]/30 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-[#EDE5DC] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#0096C7] text-white flex items-center justify-center font-bold text-xs">
                        P
                      </div>
                      <span className="text-xs font-bold text-[#2C2725]">Pago con Plin QR / Transferencia</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#0096C7]/10 text-[#0096C7] rounded-full text-[10px] font-bold">
                      Interbank &middot; BBVA &middot; Scotiabank
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Authentic Vector QR Code */}
                    <div className="p-3 bg-white rounded-2xl border border-[#DFD0C0] shadow-sm flex flex-col items-center justify-center shrink-0">
                      <svg
                        viewBox="0 0 120 120"
                        className="w-32 h-32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="120" height="120" rx="8" fill="#FFFFFF" />
                        
                        {/* Top-Left Finder */}
                        <rect x="8" y="8" width="32" height="32" rx="4" fill="#0077B6" />
                        <rect x="13" y="13" width="22" height="22" rx="2" fill="#FFFFFF" />
                        <rect x="18" y="18" width="12" height="12" rx="1.5" fill="#0077B6" />
                        
                        {/* Top-Right Finder */}
                        <rect x="80" y="8" width="32" height="32" rx="4" fill="#0077B6" />
                        <rect x="85" y="13" width="22" height="22" rx="2" fill="#FFFFFF" />
                        <rect x="90" y="18" width="12" height="12" rx="1.5" fill="#0077B6" />
                        
                        {/* Bottom-Left Finder */}
                        <rect x="8" y="80" width="32" height="32" rx="4" fill="#0077B6" />
                        <rect x="13" y="85" width="22" height="22" rx="2" fill="#FFFFFF" />
                        <rect x="18" y="90" width="12" height="12" rx="1.5" fill="#0077B6" />
                        
                        {/* Alignment Pattern */}
                        <rect x="82" y="82" width="20" height="20" rx="3" fill="#0077B6" />
                        <rect x="86" y="86" width="12" height="12" rx="1.5" fill="#FFFFFF" />
                        <rect x="90" y="90" width="4" height="4" fill="#0077B6" />
                        
                        {/* Timing Lines */}
                        <rect x="44" y="14" width="4" height="4" fill="#0077B6" />
                        <rect x="52" y="14" width="4" height="4" fill="#0077B6" />
                        <rect x="60" y="14" width="4" height="4" fill="#0077B6" />
                        <rect x="68" y="14" width="4" height="4" fill="#0077B6" />
                        <rect x="14" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="14" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="14" y="60" width="4" height="4" fill="#0077B6" />
                        <rect x="14" y="68" width="4" height="4" fill="#0077B6" />
                        
                        {/* Dense Authentic QR Data Modules */}
                        <rect x="44" y="24" width="4" height="4" fill="#0077B6" />
                        <rect x="48" y="28" width="4" height="4" fill="#0077B6" />
                        <rect x="56" y="24" width="4" height="4" fill="#0077B6" />
                        <rect x="64" y="28" width="4" height="4" fill="#0077B6" />
                        <rect x="44" y="36" width="4" height="4" fill="#0077B6" />
                        <rect x="52" y="36" width="4" height="4" fill="#0077B6" />
                        <rect x="60" y="36" width="4" height="4" fill="#0077B6" />
                        <rect x="68" y="36" width="4" height="4" fill="#0077B6" />
                        <rect x="24" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="32" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="44" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="52" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="72" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="80" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="92" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="100" y="44" width="4" height="4" fill="#0077B6" />
                        <rect x="28" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="36" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="68" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="76" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="88" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="96" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="104" y="52" width="4" height="4" fill="#0077B6" />
                        <rect x="24" y="60" width="4" height="4" fill="#0077B6" />
                        <rect x="36" y="60" width="4" height="4" fill="#0077B6" />
                        <rect x="68" y="60" width="4" height="4" fill="#0077B6" />
                        <rect x="80" y="60" width="4" height="4" fill="#0077B6" />
                        <rect x="92" y="60" width="4" height="4" fill="#0077B6" />
                        <rect x="100" y="60" width="4" height="4" fill="#0077B6" />
                        <rect x="28" y="68" width="4" height="4" fill="#0077B6" />
                        <rect x="44" y="68" width="4" height="4" fill="#0077B6" />
                        <rect x="56" y="68" width="4" height="4" fill="#0077B6" />
                        <rect x="64" y="68" width="4" height="4" fill="#0077B6" />
                        <rect x="76" y="68" width="4" height="4" fill="#0077B6" />
                        <rect x="84" y="68" width="4" height="4" fill="#0077B6" />
                        <rect x="100" y="68" width="4" height="4" fill="#0077B6" />
                        <rect x="44" y="76" width="4" height="4" fill="#0077B6" />
                        <rect x="52" y="76" width="4" height="4" fill="#0077B6" />
                        <rect x="60" y="76" width="4" height="4" fill="#0077B6" />
                        <rect x="72" y="76" width="4" height="4" fill="#0077B6" />
                        <rect x="48" y="84" width="4" height="4" fill="#0077B6" />
                        <rect x="56" y="84" width="4" height="4" fill="#0077B6" />
                        <rect x="68" y="84" width="4" height="4" fill="#0077B6" />
                        <rect x="76" y="84" width="4" height="4" fill="#0077B6" />
                        <rect x="44" y="92" width="4" height="4" fill="#0077B6" />
                        <rect x="52" y="92" width="4" height="4" fill="#0077B6" />
                        <rect x="64" y="92" width="4" height="4" fill="#0077B6" />
                        <rect x="72" y="92" width="4" height="4" fill="#0077B6" />
                        <rect x="48" y="100" width="4" height="4" fill="#0077B6" />
                        <rect x="56" y="100" width="4" height="4" fill="#0077B6" />
                        <rect x="68" y="100" width="4" height="4" fill="#0077B6" />
                        <rect x="76" y="100" width="4" height="4" fill="#0077B6" />
                        <rect x="88" y="104" width="4" height="4" fill="#0077B6" />
                        <rect x="96" y="104" width="4" height="4" fill="#0077B6" />
                        
                        {/* Branded Center Badge */}
                        <rect x="45" y="45" width="30" height="30" rx="8" fill="#0096C7" stroke="#FFFFFF" strokeWidth="2.5" />
                        <text x="60" y="66" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold" fontFamily="sans-serif">P</text>
                      </svg>
                    </div>

                    <div className="space-y-2 text-xs flex-1 text-center sm:text-left">
                      <p className="font-semibold text-[#2C2725]">
                        Escanee el codigo QR con Plin por el monto exacto:
                      </p>
                      <p className="text-xl font-serif font-bold text-[#0077B6]">
                        S/ {montoTotal.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-[#7A7067]">
                        Destinatario: <strong>Sumaq Spa & Centro de Bienestar</strong> (Cel: 987 654 321)
                      </p>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPlinChecking(true);
                            setTimeout(() => {
                              setPlinChecking(false);
                              setPlinVerified(true);
                              toast.success('Pago Plin Verificado', `Transferencia confirmada por S/ ${montoTotal.toFixed(2)}.`);
                            }, 800);
                          }}
                          disabled={plinChecking}
                          className="px-4 py-2.5 bg-[#0096C7] hover:bg-[#0077B6] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 w-full sm:w-auto shadow-xs"
                        >
                          {plinChecking ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Verificando transferencia...</span>
                            </>
                          ) : plinVerified ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>Transferencia Plin Verificada</span>
                            </>
                          ) : (
                            <span>Verificar Compra / Pago Plin</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {plinVerified && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Transferencia Plin verificada exitosamente. Listo para confirmar la reserva.</span>
                    </div>
                  )}
                </div>
              )}

              {metodoPago === 'EFECTIVO' && (
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#DFD0C0] space-y-2 animate-in fade-in duration-300 text-xs">
                  <div className="flex items-center gap-2 text-[#8C6F55] font-bold">
                    <Banknote className="w-5 h-5" />
                    <span>Pago Presencial en Recepcion</span>
                  </div>
                  <p className="text-[#6F5540] leading-relaxed">
                    Abonara el monto total de <strong>S/ {montoTotal.toFixed(2)}</strong> directamente en la recepcion del Spa al momento de presentarse para su cita. Por favor llegue 10 minutos antes de su turno pactado.
                  </p>
                </div>
              )}
            </div>

            {/* Financial Breakdown Table */}
            <div className="border-t border-[#EDE5DC] pt-4 space-y-2 max-w-sm ml-auto text-xs">
              <div className="flex justify-between text-[#6F5540]">
                <span>Subtotal Servicio:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-[#24634B] font-semibold">
                  <span>Descuento ({codigoCupon}):</span>
                  <span>- S/ {descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-serif font-bold text-[#2C2725] border-t border-[#DFD0C0] pt-2">
                <span>TOTAL A PAGAR:</span>
                <span className="text-[#5E3A2B]">S/ {montoTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(3)} icon={<ChevronLeft className="w-4 h-4" />}>
                Volver
              </Button>
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                onClick={handleFinalBooking}
                icon={<CheckCircle2 className="w-5 h-5" />}
              >
                Confirmar y Registrar Cita
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
