import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { therapistService } from '../../services/therapistService';
import { Cita, Terapeuta } from '../../types/models';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  ChevronRight,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const TherapistAgendaPage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(todayStr);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [terapeuta, setTerapeuta] = useState<Terapeuta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const data = await therapistService.getMiAgenda(fecha);
      setCitas(data.citas);
      setTerapeuta(data.terapeuta);
    } catch (err) {
      console.error("Error loading therapist agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [fecha]);

  const filteredCitas = citas.filter((c) => {
    if (filtroEstado === 'TODOS') return true;
    return c.estado === filtroEstado;
  });

  return (
    <div className="space-y-8">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Panel de Trabajo</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Agenda del Día &middot; {terapeuta?.nombre_completo || 'Terapeuta'}
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Cabina asignada: <b>{terapeuta?.cabina?.nombre || 'Cabina 1'} ({terapeuta?.cabina?.tipo})</b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[#543F30]">Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3.5 py-2 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs font-medium text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#EDE5DC] pb-3 overflow-x-auto">
        {[
          { id: 'TODOS', label: 'Todas las Citas' },
          { id: 'PENDIENTE', label: 'Pendientes por Atender' },
          { id: 'ATENDIDA', label: 'Completadas' },
          { id: 'CANCELADA', label: 'Canceladas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFiltroEstado(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroEstado === tab.id
                ? 'bg-[#8C6F55] text-white shadow-sm'
                : 'bg-white text-[#6F5540] border border-[#EDE5DC] hover:bg-[#F6F2EC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredCitas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EDE5DC] p-12 text-center text-xs text-[#8C6F55]">
          <Calendar className="w-8 h-8 text-[#C9B29B] mx-auto mb-2" />
          No hay citas programadas para esta fecha con el filtro seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCitas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white rounded-2xl border border-[#EDE5DC] p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#DFD0C0] flex flex-col items-center justify-center text-[#5E3A2B] shrink-0 font-mono">
                  <span className="text-xs font-bold">{cita.hora_inicio?.substring(0, 5)}</span>
                  <span className="text-[10px] text-[#8C6F55]">{cita.hora_fin?.substring(0, 5)}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-[#8C6F55] bg-[#F6F2EC] px-2 py-0.5 rounded-md">
                      {cita.codigo_reserva}
                    </span>
                    <Badge status={cita.estado} />
                  </div>
                  <h3 className="text-base font-serif font-bold text-[#2C2725]">
                    {cita.cliente?.nombre_completo}
                  </h3>
                  <p className="text-xs text-[#6F5540]">
                    DNI: <b>{cita.cliente?.dni}</b> &middot; Tel: {cita.cliente?.telefono}
                  </p>
                  <p className="text-xs text-[#8C6F55] font-medium mt-1">
                    Tratamiento: <b>{cita.servicio?.nombre}</b> ({cita.cabina?.nombre})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:self-center">
                <Link to={`/terapeuta/citas/${cita.id}`}>
                  <Button
                    variant={cita.estado === 'PENDIENTE' ? 'primary' : 'outline'}
                    size="md"
                    icon={<FileText className="w-4 h-4" />}
                  >
                    {cita.estado === 'PENDIENTE' ? 'Atender / Ficha' : 'Ver Detalles & Ficha'}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
