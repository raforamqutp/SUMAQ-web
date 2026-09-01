import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Cita } from '../../types/models';
import { Button } from '../../components/Button';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Sparkles,
  Download,
  ArrowLeft,
  Share2,
} from 'lucide-react';

import { downloadPdf } from '../../services/api';

/**
 * ============================================================================
 * VISTA: CONFIRMACIÓN DE RESERVA (BookingConfirmationPage)
 * ============================================================================
 * Pantalla final de éxito tras completar el Wizard de reservas:
 * - Muestra el código de seguimiento de la cita (SQ-YYYYMMDD-XXXX).
 * - Resumen de cabina asignada, especialista, fecha, hora y total pagado.
 * - Botón para descargar el comprobante en PDF.
 * ============================================================================
 */
export const BookingConfirmationPage: React.FC = () => {
  const location = useLocation();
  const cita: Cita = location.state?.cita;

  if (!cita) {
    return <Navigate to="/reservar" replace />;
  }

  const handleDownloadPDF = () => {
    // Download using public endpoint or helper
    if (cita.codigo_reserva) {
      downloadPdf(
        `http://127.0.0.1:8000/api/citas/comprobante-pdf/${cita.codigo_reserva}/`,
        `Comprobante_Sumaq_${cita.codigo_reserva}.pdf`
      );
    } else {
      downloadPdf(
        `http://127.0.0.1:8000/api/citas/${cita.id}/pdf/publico/`,
        `Comprobante_Sumaq_${cita.id}.pdf`
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-lg p-8 sm:p-12 text-center relative overflow-hidden">
        {/* Top decorative badge */}
        <div className="w-16 h-16 rounded-full bg-[#EFF8F4] border border-[#A8DAC2] text-[#24634B] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#8C6F55]">¡Reserva Confirmada!</span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2725] mt-1">
          Gracias por tu preferencia
        </h1>
        <p className="text-xs sm:text-sm text-[#6F5540] mt-2 max-w-md mx-auto">
          Hemos registrado tu cita satisfactoriamente. Te esperamos con un ritual personalizado de bienestar.
        </p>

        {/* Unique Reservation Code Box */}
        <div className="my-8 p-6 rounded-2xl bg-[#FAF8F5] border-2 border-dashed border-[#C9B29B] max-w-md mx-auto">
          <p className="text-xs uppercase font-bold tracking-wider text-[#8C6F55]">Código Único de Reserva</p>
          <p className="text-3xl font-mono font-bold text-[#5E3A2B] tracking-wider mt-1">
            {cita.codigo_reserva}
          </p>
          <p className="text-[11px] text-[#A88B71] mt-1">
            Presenta este código o tu DNI al momento de tu llegada al spa.
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="text-left bg-[#F6F2EC]/60 rounded-2xl p-6 border border-[#EDE5DC] max-w-lg mx-auto space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-[#EDE5DC]">
            <span className="text-[#8C6F55]">Cliente:</span>
            <span className="font-semibold text-[#2C2725]">{cita.cliente?.nombre_completo} (DNI: {cita.cliente?.dni})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#EDE5DC]">
            <span className="text-[#8C6F55]">Servicio / Tratamiento:</span>
            <span className="font-semibold text-[#2C2725]">{cita.servicio?.nombre}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#EDE5DC]">
            <span className="text-[#8C6F55]">Terapeuta Asignada:</span>
            <span className="font-semibold text-[#2C2725]">{cita.terapeuta?.nombre_completo}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#EDE5DC]">
            <span className="text-[#8C6F55]">Cabina:</span>
            <span className="font-semibold text-[#2C2725]">{cita.cabina?.nombre} ({cita.cabina?.tipo})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#EDE5DC]">
            <span className="text-[#8C6F55]">Fecha & Horario:</span>
            <span className="font-semibold text-[#2C2725]">{cita.fecha} &middot; {cita.hora_inicio?.substring(0, 5)} a {cita.hora_fin?.substring(0, 5)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#EDE5DC]">
            <span className="text-[#8C6F55]">Método de Pago:</span>
            <span className="font-semibold text-[#2C2725]">{cita.metodo_pago}</span>
          </div>
          <div className="flex justify-between pt-2 text-sm font-serif font-bold text-[#3D2D22]">
            <span>Monto Total:</span>
            <span className="text-[#5E3A2B]">S/ {parseFloat(cita.monto_total?.toString() || '0').toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
              Volver al Inicio
            </Button>
          </Link>
          <Link to="/servicios">
            <Button variant="secondary" size="md">
              Ver Otros Rituales
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
