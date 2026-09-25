import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import { downloadPdf } from '../../services/api';
import { Cita, SlotDisponibilidad } from '../../types/models';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import {
  Search,
  Calendar,
  Clock,
  User,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  XCircle,
  HelpCircle,
  Phone,
  MessageCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  DoorClosed,
  CreditCard,
} from 'lucide-react';

export const ManageAppointmentPage: React.FC = () => {
  const { toast } = useToast();

  // Búsqueda
  const [codigoReserva, setCodigoReserva] = useState('');
  const [dni, setDni] = useState('');
  const [searching, setSearching] = useState(false);

  // Cita consultada
  const [cita, setCita] = useState<Cita | null>(null);
  const [horasRestantes, setHorasRestantes] = useState<number>(0);
  const [puedeModificar, setPuedeModificar] = useState<boolean>(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState<string | null>(null);

  // Cancelación
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [canceling, setCanceling] = useState(false);

  // Reprogramación
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [nuevaFecha, setNuevaFecha] = useState(tomorrowStr);
  const [slotsDisponibles, setSlotsDisponibles] = useState<SlotDisponibilidad[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotDisponibilidad | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Búsqueda por código y DNI
  const handleSearchAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanCode = codigoReserva.trim().toUpperCase();
    const cleanDni = dni.trim();

    if (!cleanCode || !cleanDni) {
      toast.error('Campos requeridos', 'Ingrese su código de reserva y el número de DNI.');
      return;
    }

    setSearching(true);
    try {
      const res = await publicService.consultarCita(cleanCode, cleanDni);
      setCita(res.cita);
      setHorasRestantes(res.horas_restantes);
      setPuedeModificar(res.puede_modificar);
      setMotivoBloqueo(res.motivo_bloqueo);
      toast.success('Cita encontrada', `Reserva ${res.cita.codigo_reserva} cargada correctamente.`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'No se encontró ninguna cita con los datos ingresados. Verifique el código y DNI.';
      toast.error('Búsqueda fallida', msg);
    } finally {
      setSearching(false);
    }
  };

  // Carga rápida con datos demo
  const handleLoadDemo = () => {
    setCodigoReserva('SQ-20260825-7281');
    setDni('72345678');
    setTimeout(() => {
      publicService
        .consultarCita('SQ-20260825-7281', '72345678')
        .then((res) => {
          setCita(res.cita);
          setHorasRestantes(res.horas_restantes);
          setPuedeModificar(res.puede_modificar);
          setMotivoBloqueo(res.motivo_bloqueo);
          toast.success('Cita demo cargada', 'Datos de prueba listos.');
        })
        .catch(() => {
          toast.info('Ingresa tus datos', 'Utiliza el código de tu reserva confirmada.');
        });
    }, 100);
  };

  // Descarga de comprobante PDF
  const handleDownloadPdf = () => {
    if (!cita) return;
    if (cita.codigo_reserva) {
      downloadPdf(
        `http://127.0.0.1:8000/api/citas/comprobante-pdf/${cita.codigo_reserva}/`,
        `Comprobante_Sumaq_${cita.codigo_reserva}.pdf`
      );
    }
  };

  // Apertura del modal de reprogramación
  const handleOpenReschedule = async () => {
    if (!cita || !puedeModificar) return;
    setRescheduleModalOpen(true);
    setSelectedSlot(null);
    fetchSlotsForDate(nuevaFecha);
  };

  // Consulta turnos para la fecha seleccionada
  const fetchSlotsForDate = async (targetDate: string) => {
    if (!cita) return;
    setLoadingSlots(true);
    try {
      const res = await publicService.getDisponibilidad(
        targetDate,
        cita.servicio?.id,
        cita.terapeuta?.id,
        cita.cabina?.id
      );
      setSlotsDisponibles(res.slots);
    } catch (err) {
      console.error('Error fetching reschedule slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Confirmar reprogramación
  const handleConfirmReschedule = async () => {
    if (!cita || !selectedSlot) {
      toast.error('Horario requerido', 'Seleccione un turno disponible de la lista.');
      return;
    }

    setRescheduling(true);
    try {
      const updatedCita = await publicService.reprogramarCitaWeb(
        cita.codigo_reserva,
        cita.cliente.dni,
        nuevaFecha,
        selectedSlot.hora_inicio
      );
      setCita(updatedCita);
      toast.success(
        '¡Cita Reprogramada!',
        `Nuevo turno confirmado para el ${updatedCita.fecha} a las ${updatedCita.hora_inicio?.substring(0, 5)}.`
      );
      setRescheduleModalOpen(false);

      // Actualizar estado de modificación
      const res = await publicService.consultarCita(updatedCita.codigo_reserva, updatedCita.cliente.dni);
      setHorasRestantes(res.horas_restantes);
      setPuedeModificar(res.puede_modificar);
      setMotivoBloqueo(res.motivo_bloqueo);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'No fue posible reprogramar la cita.';
      toast.error('Error al reprogramar', msg);
    } finally {
      setRescheduling(false);
    }
  };

  // Confirmar cancelación
  const handleConfirmCancellation = async () => {
    if (!cita || !puedeModificar) return;

    setCanceling(true);
    try {
      const canceledCita = await publicService.cancelarCitaWeb(
        cita.codigo_reserva,
        cita.cliente.dni,
        motivoCancelacion.trim() || undefined
      );
      setCita(canceledCita);
      setPuedeModificar(false);
      setMotivoBloqueo('La cita ha sido cancelada por el usuario.');
      toast.success('Cita Cancelada', 'Tu reserva ha sido anulada con éxito.');
      setCancelModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'No fue posible cancelar la cita.';
      toast.error('Error al cancelar', msg);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header institucional */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#8C6F55]">Portal de Autoservicio</span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2725] mt-1">
          Mis Citas & Gestión de Reserva
        </h1>
        <p className="text-xs sm:text-sm text-[#6F5540] mt-2">
          Consulta los detalles de tu cita, descarga tu comprobante oficial o reprograma tu fecha de atención con total tranquilidad.
        </p>
      </div>

      {/* Formulario de Consulta / Búsqueda */}
      <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSearchAppointment} className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#F6F2EC] pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#8C6F55]" />
              <h2 className="font-serif font-bold text-lg text-[#3D2D22]">Buscar Mi Reserva</h2>
            </div>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="text-[11px] font-semibold text-[#8C6F55] hover:text-[#2C2725] underline cursor-pointer"
            >
              Cargar datos demo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="input-codigo-reserva" className="block font-semibold text-[#543F30] mb-1.5">
                Código Único de Reserva <span className="text-[#C84B31]">*</span>
              </label>
              <input
                id="input-codigo-reserva"
                aria-label="Código único de reserva generado en su comprobante"
                type="text"
                value={codigoReserva}
                onChange={(e) => setCodigoReserva(e.target.value.toUpperCase())}
                placeholder="Ej: SQ-20260908-12345"
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl font-mono text-sm uppercase text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
              <p className="text-[10px] text-[#A88B71] mt-1">
                Figura en el comprobante emitido al reservar.
              </p>
            </div>

            <div>
              <label htmlFor="input-dni-cliente" className="block font-semibold text-[#543F30] mb-1.5">
                DNI / Documento del Titular <span className="text-[#C84B31]">*</span>
              </label>
              <input
                id="input-dni-cliente"
                aria-label="Número de DNI del titular de la reserva"
                type="text"
                maxLength={12}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 72345678"
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-sm text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
              <p className="text-[10px] text-[#A88B71] mt-1">
                Documento registrado en el paso 1 del wizard.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={searching}
              icon={<Search className="w-4 h-4" />}
            >
              Consultar Reserva
            </Button>
          </div>
        </form>
      </div>

      {/* Tarjeta de Detalles de la Reserva (Si se encuentra la cita) */}
      {cita && (
        <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-md p-6 sm:p-10 space-y-6 animate-in fade-in duration-300">
          {/* Header de la Tarjeta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE5DC] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-[#8C6F55] bg-[#F6F2EC] px-3 py-1 rounded-lg border border-[#EDE5DC]">
                  {cita.codigo_reserva}
                </span>
                <Badge status={cita.estado} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#2C2725]">
                Reserva a nombre de {cita.cliente?.nombre_completo}
              </h2>
              <p className="text-xs text-[#6F5540]">
                DNI: <b>{cita.cliente?.dni}</b> &middot; Teléfono: {cita.cliente?.telefono}
              </p>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={handleDownloadPdf}
              icon={<Download className="w-4 h-4" />}
            >
              Descargar Comprobante PDF
            </Button>
          </div>

          {/* Banner de Política de 24 Horas */}
          {puedeModificar ? (
            <div className="p-4 rounded-2xl bg-[#EFF8F4] border border-[#A8DAC2] text-[#24634B] text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Modificaciones y Cancelaciones Permitidas</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  Faltan <b>{horasRestantes} horas</b> para tu cita. Por política de bienestar, puedes reprogramar la fecha o anular tu cita sin ninguna penalidad online hasta 24 horas antes del turno.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FFF9EB] border border-[#F2D794] text-[#8C6615] text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#C87D00]" />
              <div>
                <p className="font-bold text-sm">Modificación Online Restringida (Regla de 24h)</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  {motivoBloqueo ||
                    'Por motivos de preparación de cabina y fórmulas de insumos, las modificaciones online solo pueden realizarse con un mínimo de 24 horas de antelación.'}
                </p>
              </div>
            </div>
          )}

          {/* Grid de Información de la Cita */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Servicio & Especialista */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE5DC] space-y-3">
              <h3 className="font-serif font-bold text-base text-[#3D2D22] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8C6F55]" />
                Tratamiento & Especialista
              </h3>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[#8C6F55] block">Servicio Solicitado:</span>
                  <span className="font-bold text-sm text-[#2C2725]">{cita.servicio?.nombre}</span>
                  <span className="text-[11px] text-[#6F5540] block">
                    Duración: {cita.servicio?.duracion_min} minutos
                  </span>
                </div>
                <div className="pt-2 border-t border-[#EDE5DC]">
                  <span className="text-[#8C6F55] block">Terapeuta Asignada:</span>
                  <span className="font-semibold text-[#2C2725]">{cita.terapeuta?.nombre_completo}</span>
                  <span className="text-[11px] text-[#8C6F55] block">{cita.terapeuta?.especialidad}</span>
                </div>
                <div className="pt-2 border-t border-[#EDE5DC]">
                  <span className="text-[#8C6F55] block">Cabina Asignada:</span>
                  <span className="font-semibold text-[#8A3648]">
                    {cita.cabina?.nombre} ({cita.cabina?.tipo})
                  </span>
                </div>
              </div>
            </div>

            {/* Fecha, Horario & Liquidación */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE5DC] space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#3D2D22] flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#8C6F55]" />
                  Fecha & Liquidación de Pago
                </h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#8C6F55]">Fecha Programada:</span>
                    <span className="font-bold text-[#2C2725]">{cita.fecha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C6F55]">Horario de Atención:</span>
                    <span className="font-bold text-[#2C2725]">
                      {cita.hora_inicio?.substring(0, 5)} a {cita.hora_fin?.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C6F55]">Método de Pago:</span>
                    <span className="font-semibold text-[#2C2725]">{cita.metodo_pago}</span>
                  </div>
                  {cita.codigo_cupon_aplicado && (
                    <div className="flex justify-between text-[#24634B]">
                      <span>Cupón Aplicado:</span>
                      <span className="font-bold">{cita.codigo_cupon_aplicado}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EDE5DC] flex justify-between items-center">
                <span className="font-bold text-[#543F30]">TOTAL ABONADO:</span>
                <span className="text-xl font-serif font-bold text-[#5E3A2B]">
                  S/ {parseFloat(cita.monto_total?.toString() || '0').toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción de Autogestión */}
          <div className="pt-4 border-t border-[#EDE5DC] flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setCita(null);
                setCodigoReserva('');
                setDni('');
              }}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Consultar Otra Reserva
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                disabled={!puedeModificar}
                onClick={handleOpenReschedule}
                icon={<CalendarDays className="w-4 h-4" />}
                className={!puedeModificar ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Reprogramar Fecha & Hora
              </Button>

              <Button
                variant="danger"
                size="md"
                disabled={!puedeModificar}
                onClick={() => setCancelModalOpen(true)}
                icon={<XCircle className="w-4 h-4" />}
                className={!puedeModificar ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Cancelar Cita
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sección Informativa y Asistencia */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#EDE5DC] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#6F5540]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[#3D2D22]">
            <Clock className="w-4 h-4 text-[#8C6F55]" />
            Puntualidad & Llegada
          </div>
          <p className="leading-relaxed text-[11px]">
            Te recomendamos presentarte 10 minutos antes de tu cita en nuestra recepción para brindarte tu infusión de bienvenida y preparar tu sesión.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[#3D2D22]">
            <ShieldCheck className="w-4 h-4 text-[#8C6F55]" />
            Política de 24 Horas
          </div>
          <p className="leading-relaxed text-[11px]">
            Las cancelaciones y cambios de horario son 100% gratuitos y automáticos hasta 24 horas antes del turno pactado.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-[#3D2D22]">
            <Phone className="w-4 h-4 text-[#8C6F55]" />
            ¿Necesitas Ayuda Urgente?
          </div>
          <p className="leading-relaxed text-[11px]">
            Si tienes algún imprevisto con menos de 24h, contáctanos directamente a nuestra central de recepción:
          </p>
          <a
            href="https://wa.me/51987654321?text=Hola%20Sumaq%20Spa,%20deseo%20consultar%20sobre%20mi%20cita"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#24634B] hover:underline pt-1"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Recepción: 987 654 321
          </a>
        </div>
      </div>

      {/* MODAL: REPROGRAMAR CITA */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reprogramar Fecha y Horario"
        subtitle={`Servicio: ${cita?.servicio?.nombre} · Especialista: ${cita?.terapeuta?.nombre_completo}`}
        maxWidth="lg"
      >
        <div className="space-y-6 text-xs">
          <div>
            <label htmlFor="modal-reprogramar-fecha" className="block font-semibold text-[#543F30] mb-1.5">
              1. Selecciona la Nueva Fecha
            </label>
            <input
              id="modal-reprogramar-fecha"
              aria-label="Seleccionar nueva fecha para reprogramar su cita"
              type="date"
              min={tomorrowStr}
              value={nuevaFecha}
              onChange={(e) => {
                setNuevaFecha(e.target.value);
                setSelectedSlot(null);
                fetchSlotsForDate(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-2">
              2. Elige el Nuevo Turno Disponible para el {nuevaFecha}
            </label>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-[#6F5540] ml-2">Consultando disponibilidad...</span>
              </div>
            ) : slotsDisponibles.length === 0 ? (
              <p className="text-xs text-[#8C6F55] italic">No hay turnos disponibles para esta fecha.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                {slotsDisponibles
                  .filter(
                    (slot, index, self) =>
                      index === self.findIndex((s) => s.hora_inicio.slice(0, 5) === slot.hora_inicio.slice(0, 5))
                  )
                  .map((slot, idx) => (
                  <button
                    key={`${slot.hora_inicio}-${idx}`}
                    type="button"
                    disabled={!slot.disponible}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      !slot.disponible
                        ? 'bg-[#F6F2EC]/60 border-[#EDE5DC] text-[#A88B71] opacity-50 cursor-not-allowed line-through'
                        : selectedSlot?.hora_inicio === slot.hora_inicio
                        ? 'bg-[#8C6F55] text-white border-[#8C6F55] shadow-sm font-bold'
                        : 'bg-white border-[#DFD0C0] text-[#3D2D22] hover:border-[#8C6F55]'
                    }`}
                  >
                    <div className="text-xs">{slot.hora_inicio.slice(0, 5)} - {slot.hora_fin.slice(0, 5)}</div>
                    <span className="text-[10px] block opacity-80">
                      {slot.disponible ? 'Disponible' : (slot.motivo || (slot.pasado ? 'Cerrado' : 'Ocupado'))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F6F2EC] flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setRescheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={rescheduling}
              disabled={!selectedSlot}
              onClick={handleConfirmReschedule}
            >
              Confirmar Nuevo Turno
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CANCELAR CITA */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="¿Deseas cancelar tu reserva?"
        subtitle={`Código: ${cita?.codigo_reserva} · ${cita?.servicio?.nombre}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#6F5540] leading-relaxed">
            Al confirmar, tu reserva quedará en estado <b>CANCELADA</b> y el slot horario será liberado en el calendario para otros clientes.
          </p>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">
              Motivo de Cancelación (Opcional):
            </label>
            <textarea
              rows={2}
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Ej: Cambio de planes, viaje imprevisto..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#EFF8F4] border border-[#A8DAC2] text-[#24634B]">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Cancelación Gratuita
            </p>
            <p className="text-[11px] mt-0.5">
              Tu solicitud cumple con la política de cancelación de más de 24 horas.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setCancelModalOpen(false)}>
              No, Mantener Mi Cita
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={canceling}
              onClick={handleConfirmCancellation}
            >
              Sí, Cancelar Reserva
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
