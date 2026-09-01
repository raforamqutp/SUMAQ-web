import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { ReporteData } from '../../types/models';
import { StatCard } from '../../components/StatCard';
import { Button } from '../../components/Button';
import { BarChart3, Calendar, DollarSign, TrendingUp, Package, Users2, Download } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastMonthStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(lastMonthStr);
  const [fechaFin, setFechaFin] = useState(todayStr);
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReportes(fechaInicio, fechaFin);
      setReporte(data);
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Reportes & Métricas</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Reporte Financiero & Desglose por Terapeuta
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Análisis consolidado de ingresos, costos históricos de insumos y rentabilidad operativa.
          </p>
        </div>

        {/* Date Filter Form */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8C6F55] mb-1">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8C6F55] mb-1">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>
          <div className="self-end">
            <Button type="submit" variant="primary" size="md">
              Generar Reporte
            </Button>
          </div>
        </form>
      </div>

      {loading || !reporte ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Ingresos del Período"
              value={`S/ ${reporte.ingresos.toFixed(2)}`}
              subtitle={`${reporte.total_citas} citas totales`}
              icon={<DollarSign className="w-6 h-6" />}
              accentColor="bg-[#EFF8F4] text-[#24634B]"
            />

            <StatCard
              title="Costo de Insumos"
              value={`S/ ${reporte.costo_insumos.toFixed(2)}`}
              subtitle="Consumo exacto según kárdex"
              icon={<Package className="w-6 h-6" />}
              accentColor="bg-[#FFF8F7] text-[#9B2C1C]"
            />

            <StatCard
              title="Ganancia Operativa"
              value={`S/ ${reporte.ganancia_operativa.toFixed(2)}`}
              subtitle="Margen neto de atención"
              icon={<TrendingUp className="w-6 h-6" />}
              accentColor="bg-[#F2EDFF] text-[#5A3896]"
            />

            <StatCard
              title="Citas Atendidas"
              value={reporte.citas_atendidas}
              subtitle={`de ${reporte.total_citas} programadas`}
              icon={<Calendar className="w-6 h-6" />}
              accentColor="bg-[#F6F2EC] text-[#8C6F55]"
            />
          </div>

          {/* Therapist Breakdown Table */}
          <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-[#8C6F55]" />
              <h3 className="font-serif font-bold text-xl text-[#3D2D22]">
                Desglose de Productividad por Terapeuta
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F2EC] text-[#543F30] uppercase text-[10px] tracking-wider border-b border-[#EDE5DC]">
                  <tr>
                    <th className="p-4">Terapeuta</th>
                    <th className="p-4">Especialidad</th>
                    <th className="p-4">Citas Atendidas</th>
                    <th className="p-4">Ingresos Generados (S/)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE5DC]">
                  {reporte.desglose_terapeutas.map((t, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-4 font-bold text-[#2C2725]">
                        {t.terapeuta__usuario__nombre_completo}
                      </td>
                      <td className="p-4 text-[#8C6F55]">{t.terapeuta__especialidad}</td>
                      <td className="p-4 font-mono font-bold text-sm text-[#2C2725]">{t.citas_count}</td>
                      <td className="p-4 font-mono font-bold text-sm text-[#5E3A2B]">
                        S/ {parseFloat(t.ingresos?.toString() || '0').toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
