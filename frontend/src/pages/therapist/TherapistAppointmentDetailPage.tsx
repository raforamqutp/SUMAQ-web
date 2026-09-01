import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { therapistService } from '../../services/therapistService';
import { publicService } from '../../services/publicService';
import { downloadPdf } from '../../services/api';
import { Cita, Servicio } from '../../types/models';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Sparkles,
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  Droplets,
} from 'lucide-react';

/**
 * ============================================================================
 * VISTA: FICHA CLÍNICA & ATENCIÓN DEL PACIENTE (TherapistAppointmentDetailPage)
 * ============================================================================
 * Espacio de trabajo directo en cabina durante la sesión:
 * - Datos del paciente, alergias conocidas y diagnóstico del tipo de piel.
 * - Desglose de insumos de la receta que se consumirán durante el tratamiento.
 * - Registro de notas de evolución, observaciones dermatológicas y recomendaciones.
 * - Botón "Finalizar Atención": Cambia el estado a ATENDIDA y descuenta el stock del Kárdex.
 * ============================================================================
 */
export const TherapistAppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const citaId = parseInt(id || '0', 10);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cita, setCita] = useState<Cita | null>(null);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  // Ficha de Atención Form State
  const [tipoPiel, setTipoPiel] = useState('');
  const [alergias, setAlergias] = useState('');
  const [notas, setNotas] = useState('');
  const [savingFicha, setSavingFicha] = useState(false);

  // Extra Service Modal State
  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [selectedExtraServicioId, setSelectedExtraServicioId] = useState<number | null>(null);
  const [extraCantidad, setExtraCantidad] = useState(1);
  const [addingExtra, setAddingExtra] = useState(false);

  // Complete Appointment Confirmation Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [citaData, servs] = await Promise.all([
        therapistService.getCitaDetail(citaId),
        publicService.getServicios(),
      ]);
      setCita(citaData);
      setServiciosDisponibles(servs);

      // Populate clinical sheet fields if already registered
      if (citaData.ficha_atencion) {
        setTipoPiel(citaData.ficha_atencion.tipo_piel || '');
        setAlergias(citaData.ficha_atencion.alergias_conocidas || '');
        setNotas(citaData.ficha_atencion.notas_terapeuta || '');
      }
    } catch (err: any) {
      toast.error('Error', 'No fue posible cargar el detalle de la cita.');
      navigate('/terapeuta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [citaId]);

  // Save Clinical Sheet
  const handleSaveFicha = async () => {
    if (!cita) return;
    setSavingFicha(true);
    try {
      if (cita.ficha_atencion) {
        await therapistService.updateFichaAtencion(cita.ficha_atencion.id, {
          tipo_piel: tipoPiel,
          alergias_conocidas: alergias,
          notas_terapeuta: notas,
        });
      } else {
        await therapistService.saveFichaAtencion({
          cita_id: cita.id,
          tipo_piel: tipoPiel,
          alergias_conocidas: alergias,
          notas_terapeuta: notas,
        });
      }
      toast.success('Ficha guardada', 'La ficha de atención estética ha sido actualizada.');
      fetchDetails();
    } catch (err: any) {
      toast.error('Error al guardar', err.response?.data?.error?.message || 'No se pudo guardar la ficha clínica.');
    } finally {
      setSavingFicha(false);
    }
  };

  // Add Extra Treatment / Service
  const handleAddExtraService = async () => {
    if (!selectedExtraServicioId || !cita) return;
    setAddingExtra(true);
    try {
      await therapistService.addServicioAdicional(cita.id, selectedExtraServicioId, extraCantidad);
      toast.success('Tratamiento Agregado', 'Se registró el servicio adicional y se descontaron los insumos.');
      setExtraModalOpen(false);
      setSelectedExtraServicioId(null);
      setExtraCantidad(1);
      fetchDetails();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al agregar servicio adicional o stock insuficiente.';
      toast.error('Error', msg);
    } finally {
      setAddingExtra(false);
    }
  };

  // Complete Appointment
  const handleCompleteAppointment = async () => {
    if (!cita) return;
    setCompleting(true);
    try {
      await therapistService.completarCita(cita.id);
      toast.success('¡Atención Completada!', 'Se descontó automáticamente el inventario del servicio base.');
      setCompleteModalOpen(false);
      fetchDetails();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'No fue posible completar la cita.';
      toast.error('Error al completar cita', msg);
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !cita) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/terapeuta"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6F55] hover:text-[#2C2725] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mi Agenda
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#8C6F55] bg-[#F6F2EC] px-2.5 py-0.5 rounded-md">
                {cita.codigo_reserva}
              </span>
              <Badge status={cita.estado} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725]">
              Atención: {cita.cliente?.nombre_completo}
            </h1>
            <p className="text-xs text-[#6F5540]">
              DNI: <b>{cita.cliente?.dni}</b> &middot; Teléfono: {cita.cliente?.telefono} &middot; Cabina: {cita.cabina?.nombre}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => downloadPdf(`/terapeuta/citas/${cita.id}/pdf/`, `Comprobante_Sumaq_${cita.codigo_reserva}.pdf`)}
            >
              Comprobante PDF
            </Button>

            {cita.estado === 'PENDIENTE' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCompleteModalOpen(true)}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Completar Atención
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Clinical Record & Treatments */}
        <div className="lg:col-span-2 space-y-6">
          {/* FICHA DE ATENCIÓN ESTÉTICA */}
          <div className="bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F6F2EC] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8C6F55]" />
                <h3 className="font-serif font-bold text-lg text-[#3D2D22]">
                  Ficha de Atención Estética (Confidencial)
                </h3>
              </div>
              <span className="text-[10px] text-[#A88B71] uppercase tracking-wider font-semibold">
                Registro Clínico
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#543F30] mb-1">
                  Tipo de Piel / Diagnóstico Cutáneo
                </label>
                <input
                  type="text"
                  value={tipoPiel}
                  onChange={(e) => setTipoPiel(e.target.value)}
                  placeholder="Ej: Piel mixta, sensible con tendencia a rosácea..."
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543F30] mb-1">
                  Alergias Conocidas / Observaciones Médicas
                </label>
                <textarea
                  rows={2}
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  placeholder="Ej: Alergia al aceite de almendras, intolerancia a la lavanda..."
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543F30] mb-1">
                  Notas de Evolución del Terapeuta
                </label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Se aplicó técnica descontracturante en zona cervical. Paciente refiere alivio notable..."
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="secondary"
                  size="md"
                  loading={savingFicha}
                  onClick={handleSaveFicha}
                >
                  Guardar Ficha de Atención
                </Button>
              </div>
            </div>
          </div>

          {/* SERVICIOS Y TRATAMIENTOS DE LA ATENCIÓN */}
          <div className="bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F6F2EC] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#3D2D22]">
                  Tratamientos & Adicionales de la Sesión
                </h3>
                <p className="text-[11px] text-[#8C6F55]">Servicio base y tratamientos complementarios agregados.</p>
              </div>
              {cita.estado !== 'CANCELADA' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExtraModalOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Agregar Tratamiento
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {/* Base Service */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C6F55] bg-[#EDE5DC] px-2 py-0.5 rounded">
                    Servicio Base
                  </span>
                  <h4 className="font-semibold text-sm text-[#2C2725] mt-1">{cita.servicio?.nombre}</h4>
                  <p className="text-[11px] text-[#6F5540]">{cita.servicio?.duracion_min} minutos</p>
                </div>
                <span className="font-serif font-bold text-base text-[#5E3A2B]">
                  S/ {parseFloat(cita.servicio?.precio_publico?.toString() || '0').toFixed(2)}
                </span>
              </div>

              {/* Extra Services List */}
              {cita.ficha_atencion?.servicios_adicionales?.map((extra) => (
                <div
                  key={extra.id}
                  className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#DFD0C0] flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#A35200] bg-[#FFF5E6] px-2 py-0.5 rounded">
                      Tratamiento Adicional (+{extra.cantidad})
                    </span>
                    <h4 className="font-semibold text-sm text-[#2C2725] mt-1">{extra.servicio_nombre}</h4>
                    <p className="text-[11px] text-[#8C6F55]">
                      {extra.cantidad} x S/ {parseFloat(extra.precio_unitario_historico.toString()).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-serif font-bold text-base text-[#5E3A2B]">
                    S/ {parseFloat(extra.subtotal.toString()).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Appointment Summary & Consumption Alert */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-[#3D2D22]">Resumen de Cita</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F6F2EC]">
                <span className="text-[#8C6F55]">Fecha Programada:</span>
                <span className="font-semibold text-[#2C2725]">{cita.fecha}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F6F2EC]">
                <span className="text-[#8C6F55]">Horario:</span>
                <span className="font-semibold text-[#2C2725]">
                  {cita.hora_inicio?.substring(0, 5)} - {cita.hora_fin?.substring(0, 5)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F6F2EC]">
                <span className="text-[#8C6F55]">Método de Pago:</span>
                <span className="font-semibold text-[#2C2725]">{cita.metodo_pago}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F6F2EC]">
                <span className="text-[#8C6F55]">Subtotal:</span>
                <span className="font-semibold text-[#2C2725]">S/ {parseFloat(cita.subtotal.toString()).toFixed(2)}</span>
              </div>
              {parseFloat(cita.descuento.toString()) > 0 && (
                <div className="flex justify-between py-1 border-b border-[#F6F2EC] text-[#24634B] font-semibold">
                  <span>Descuento:</span>
                  <span>- S/ {parseFloat(cita.descuento.toString()).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-serif font-bold text-[#2C2725]">
                <span>Total a Cobrar:</span>
                <span className="text-[#5E3A2B]">S/ {parseFloat(cita.monto_total.toString()).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF8F5] rounded-3xl border border-[#DFD0C0] p-6 text-xs text-[#6F5540] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#543F30]">
              <Droplets className="w-4 h-4 text-[#C8907E]" />
              Control Automático de Insumos
            </div>
            <p className="leading-relaxed text-[11px]">
              Al marcar esta cita como <b>Completada</b>, el sistema descontará de manera atómica los insumos de la receta de <b>{cita.servicio?.nombre}</b> y generará los asientos de kárdex correspondientes.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: AGREGAR SERVICIO ADICIONAL */}
      <Modal
        isOpen={extraModalOpen}
        onClose={() => setExtraModalOpen(false)}
        title="Agregar Tratamiento Adicional"
        subtitle="Registra servicios complementarios realizados durante la sesión"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">
              Selecciona el Tratamiento Complementario
            </label>
            <select
              value={selectedExtraServicioId || ''}
              onChange={(e) => setSelectedExtraServicioId(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            >
              <option value="">-- Seleccionar Tratamiento --</option>
              {serviciosDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} - S/ {parseFloat(s.precio_publico.toString()).toFixed(2)} ({s.duracion_min} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">Cantidad</label>
            <input
              type="number"
              min={1}
              max={5}
              value={extraCantidad}
              onChange={(e) => setExtraCantidad(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setExtraModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={addingExtra}
              disabled={!selectedExtraServicioId}
              onClick={handleAddExtraService}
            >
              Confirmar y Agregar
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: COMPLETAR ATENCIÓN */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="¿Deseas finalizar y completar esta atención?"
        subtitle="Confirmación de atención concluida"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#6F5540] leading-relaxed">
            Al completar la atención, el estado pasará a <b>ATENDIDA</b> y se procesará el consumo de inventario de todos los insumos necesarios para <b>{cita.servicio?.nombre}</b>.
          </p>

          <div className="p-3.5 rounded-xl bg-[#EFF8F4] border border-[#A8DAC2] text-[#24634B]">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Verificación Transaccional
            </p>
            <p className="text-[11px] mt-0.5">
              Si algún insumo no cuenta con stock suficiente, la operación se cancelará de forma segura.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setCompleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={completing}
              onClick={handleCompleteAppointment}
            >
              Sí, Completar Atención
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
