import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { downloadPdf } from '../../services/api';
import { Cita, Cabina } from '../../types/models';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CalendarDays, Clock, User, Download, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const SLOTS_HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

export const GlobalAgendaPage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(todayStr);
  const [cabinas, setCabinas] = useState<Cabina[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cabs, citasData] = await Promise.all([
        adminService.getCabinas(),
        adminService.getCitas({ fecha }),
      ]);
      setCabinas(cabs);
      setCitas(Array.isArray(citasData) ? citasData : citasData.results || []);
    } catch (err) {
      console.error("Error loading global agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fecha]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Vista Global</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Agenda Simultánea &middot; 3 Cabinas
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Visualización en tiempo real de slots horarios por cabina para el día seleccionado.
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

      {/* 3 Cabins Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {cabinas.map((cabina) => {
            const citasCabina = citas.filter((c) => c.cabina?.id === cabina.id);

            return (
              <div
                key={cabina.id}
                className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm overflow-hidden flex flex-col"
              >
                {/* Cabin Header */}
                <div className="p-5 bg-[#F6F2EC] border-b border-[#EDE5DC]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A3648] bg-[#FDF2F4] px-2.5 py-0.5 rounded-full border border-[#F4BAC6]">
                    {cabina.tipo}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-[#2C2725] mt-1">{cabina.nombre}</h3>
                  <p className="text-[11px] text-[#6F5540] mt-0.5">{cabina.descripcion}</p>
                </div>

                {/* Slots List */}
                <div className="p-4 flex-1 space-y-3">
                  {SLOTS_HORAS.map((hora) => {
                    const citaSlot = citasCabina.find(
                      (c) => c.hora_inicio?.substring(0, 5) === hora
                    );

                    return (
                      <div
                        key={hora}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          citaSlot
                            ? 'bg-[#FAF8F5] border-[#DFD0C0] shadow-xs'
                            : 'bg-white/40 border-[#EDE5DC] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#5E3A2B]">
                            <Clock className="w-3.5 h-3.5 text-[#8C6F55]" />
                            <span>{hora} - {parseInt(hora.split(':')[0], 10) + 1}:00</span>
                          </div>
                          {citaSlot ? (
                            <Badge status={citaSlot.estado} />
                          ) : (
                            <span className="text-[10px] font-semibold text-[#24634B] bg-[#EFF8F4] px-2 py-0.5 rounded-md">
                              Libre
                            </span>
                          )}
                        </div>

                        {citaSlot ? (
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold text-[#2C2725] truncate">
                              {citaSlot.cliente?.nombre_completo}
                            </p>
                            <p className="text-[11px] text-[#8C6F55] truncate">
                              {citaSlot.servicio?.nombre} &middot; {citaSlot.terapeuta?.nombre_completo}
                            </p>
                            <div className="pt-2 flex items-center justify-between border-t border-[#EDE5DC]">
                              <span className="font-mono text-[10px] text-[#8C6F55]">
                                {citaSlot.codigo_reserva}
                              </span>
                              <button
                                onClick={() => downloadPdf(`/admin/citas/${citaSlot.id}/pdf/`, `Comprobante_Sumaq_${citaSlot.codigo_reserva}.pdf`)}
                                className="text-[11px] font-semibold text-[#8C6F55] hover:text-[#2C2725] flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3 h-3" /> PDF
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#A88B71] italic">Sin reserva programada</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
