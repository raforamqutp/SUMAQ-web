import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { downloadPdf } from '../../services/api';
import { Cita } from '../../types/models';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useToast } from '../../contexts/ToastContext';
import {
  CalendarCheck,
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/**
 * ============================================================================
 * VISTA: GESTIÓN DE CITAS & RESERVAS (AdminAppointmentsPage)
 * ============================================================================
 * Panel de consulta y administración global de todas las citas del spa:
 * - Filtros por texto (nombre, DNI, código de reserva), estado y fecha.
 * - Cambios de estado en un clic (Confirmar, Atender, Cancelar).
 * - Exportación / descarga de comprobantes en PDF.
 * ============================================================================
 */
export const AdminAppointmentsPage: React.FC = () => {
  const { toast } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [fecha, setFecha] = useState('');

  const fetchCitas = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCitas({
        search: search || undefined,
        estado: estado || undefined,
        fecha: fecha || undefined,
      });
      setCitas(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [estado, fecha]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCitas();
  };

  const handleUpdateStatus = async (id: number, nuevoEstado: 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA') => {
    try {
      await adminService.updateCitaEstado(id, nuevoEstado);
      toast.success('Estado actualizado', `La cita ahora está en estado ${nuevoEstado}.`);
      fetchCitas();
    } catch (err: any) {
      toast.error('Error al actualizar', err.response?.data?.error?.message || 'No se pudo actualizar el estado.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Gestión Operativa</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Control Global de Citas & Reservas
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Visualización, filtrado avanzado y emisión de comprobantes internos.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EDE5DC] shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por DNI, cliente o código..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
          />
          <Search className="w-4 h-4 text-[#A88B71] absolute left-3 top-2.5" />
        </form>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
          />

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
          >
            <option value="">Todos los Estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : citas.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8C6F55]">
            No se encontraron citas con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F2EC] text-[#543F30] uppercase text-[10px] tracking-wider border-b border-[#EDE5DC]">
                <tr>
                  <th className="p-4">Código</th>
                  <th className="p-4">Cliente / DNI</th>
                  <th className="p-4">Servicio</th>
                  <th className="p-4">Terapeuta / Cabina</th>
                  <th className="p-4">Fecha & Hora</th>
                  <th className="p-4">Monto Total</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5DC]">
                {citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="p-4 font-mono font-bold text-[#5E3A2B] whitespace-nowrap">
                      {cita.codigo_reserva}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-[#2C2725]">{cita.cliente?.nombre_completo}</p>
                      <p className="text-[11px] text-[#8C6F55]">DNI: {cita.cliente?.dni}</p>
                    </td>
                    <td className="p-4 font-medium text-[#2C2725]">{cita.servicio?.nombre}</td>
                    <td className="p-4">
                      <p className="text-[#2C2725]">{cita.terapeuta?.nombre_completo}</p>
                      <p className="text-[11px] text-[#8C6F55]">{cita.cabina?.nombre}</p>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <p className="font-medium text-[#2C2725]">{cita.fecha}</p>
                      <p className="text-[11px] text-[#8C6F55]">
                        {cita.hora_inicio?.substring(0, 5)} - {cita.hora_fin?.substring(0, 5)}
                      </p>
                    </td>
                    <td className="p-4 font-bold font-serif text-sm text-[#5E3A2B] whitespace-nowrap">
                      S/ {parseFloat(cita.monto_total.toString()).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <Badge status={cita.estado} />
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => downloadPdf(`/admin/citas/${cita.id}/pdf/`, `Comprobante_Sumaq_${cita.codigo_reserva}.pdf`)}
                        title="Descargar Comprobante PDF"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#DFD0C0] text-[#543F30] hover:bg-[#EDE5DC] text-[11px] font-medium cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>

                      {cita.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => handleUpdateStatus(cita.id, 'CANCELADA')}
                          title="Cancelar Cita"
                          className="px-2.5 py-1 rounded-lg bg-[#FFF2F0] border border-[#F8B4AB] text-[#9B2C1C] hover:bg-[#FFE5E2] text-[11px] font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
