import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { DashboardData } from '../../types/models';
import { StatCard } from '../../components/StatCard';
import { Button } from '../../components/Button';
import {
  DollarSign,
  TrendingUp,
  Package,
  CalendarCheck,
  Percent,
  AlertTriangle,
  Sparkles,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const fin = data.resumen_financiero;
  const ops = data.operaciones_hoy;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Panel Ejecutivo</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Dashboard Administrativo & KPIs
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Resumen financiero verificado, capacidad de cabinas y control de insumos en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/agenda">
            <Button variant="secondary" size="md" icon={<CalendarDays className="w-4 h-4" />}>
              Agenda 3 Cabinas
            </Button>
          </Link>
          <Link to="/admin/citas">
            <Button variant="primary" size="md" icon={<CalendarCheck className="w-4 h-4" />}>
              Gestionar Citas
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos Totales"
          value={`S/ ${fin.ingresos_totales.toFixed(2)}`}
          subtitle={`Hoy: S/ ${fin.ingresos_hoy.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          accentColor="bg-[#EFF8F4] text-[#24634B]"
        />

        <StatCard
          title="Costo de Insumos"
          value={`S/ ${fin.costo_insumos_total.toFixed(2)}`}
          subtitle={`Hoy: S/ ${fin.costo_insumos_hoy.toFixed(2)}`}
          icon={<Package className="w-6 h-6" />}
          accentColor="bg-[#FFF8F7] text-[#9B2C1C]"
        />

        <StatCard
          title="Ganancia Operativa"
          value={`S/ ${fin.ganancia_operativa.toFixed(2)}`}
          subtitle={`Hoy: S/ ${fin.ganancia_operativa_hoy.toFixed(2)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          accentColor="bg-[#F2EDFF] text-[#5A3896]"
        />

        <StatCard
          title="Ocupación Hoy"
          value={`${ops.tasa_ocupacion_porcentaje}%`}
          subtitle={`${ops.citas_totales} de ${ops.capacidad_maxima} slots ocupados`}
          icon={<Percent className="w-6 h-6" />}
          accentColor="bg-[#F6F2EC] text-[#8C6F55]"
        />
      </div>

      {/* Second Row: Operations Today & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Breakdown */}
        <div className="bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#3D2D22]">Operaciones de Hoy</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE5DC]">
              <span className="text-xs text-[#8C6F55] block">Total Citas:</span>
              <span className="text-2xl font-bold font-serif text-[#2C2725]">{ops.citas_totales}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF9EB] border border-[#F2D794]">
              <span className="text-xs text-[#8C6615] block">Pendientes:</span>
              <span className="text-2xl font-bold font-serif text-[#8C6615]">{ops.citas_pendientes}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#EFF8F4] border border-[#A8DAC2]">
              <span className="text-xs text-[#24634B] block">Atendidas:</span>
              <span className="text-2xl font-bold font-serif text-[#24634B]">{ops.citas_atendidas}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF2F0] border border-[#F8B4AB]">
              <span className="text-xs text-[#9B2C1C] block">Canceladas:</span>
              <span className="text-2xl font-bold font-serif text-[#9B2C1C]">{ops.citas_canceladas}</span>
            </div>
          </div>
        </div>

        {/* 7-Day Financial Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#3D2D22]">Tendencia Últimos 7 Días</h3>
            <span className="text-[11px] text-[#8C6F55] font-semibold">Ingresos vs. Costos de Insumos</span>
          </div>

          <div className="space-y-3 pt-2">
            {data.tendencia_7_dias.map((d) => (
              <div key={d.fecha_iso} className="flex items-center gap-4 text-xs">
                <span className="w-12 font-mono font-semibold text-[#543F30] shrink-0">{d.fecha}</span>
                <div className="flex-1 flex gap-1 h-5 rounded-full overflow-hidden bg-[#F6F2EC] p-0.5">
                  <div
                    style={{ width: `${Math.min(100, (d.ingresos / Math.max(1, fin.ingresos_totales || 100)) * 100)}%` }}
                    className="bg-[#8C6F55] rounded-full min-w-[6px]"
                    title={`Ingresos: S/ ${d.ingresos.toFixed(2)}`}
                  />
                  <div
                    style={{ width: `${Math.min(100, (d.costos / Math.max(1, fin.ingresos_totales || 100)) * 100)}%` }}
                    className="bg-[#C84B31] rounded-full min-w-[4px]"
                    title={`Costos: S/ ${d.costos.toFixed(2)}`}
                  />
                </div>
                <div className="text-right shrink-0 w-24">
                  <span className="font-bold text-[#2C2725]">S/ {d.ingresos.toFixed(0)}</span>
                  <span className="text-[10px] text-[#8C6F55] ml-1">({d.citas} citas)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Row: Popular Services & Critical Inventory Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#3D2D22]">Tratamientos Más Solicitados</h3>
          <div className="space-y-3">
            {data.servicios_populares.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5DC] text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#EDE5DC] flex items-center justify-center font-bold text-[#543F30] text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-[#2C2725]">{s.servicio__nombre}</span>
                </div>
                <span className="font-bold font-mono text-[#8C6F55]">{s.total} reservas</span>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Supplies Alert Box */}
        <div className="bg-white rounded-3xl border border-[#EDE5DC] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#3D2D22]">Estado del Inventario</h3>
              {data.alertas.productos_criticos_conteo > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF2F0] text-[#9B2C1C] border border-[#F8B4AB] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {data.alertas.productos_criticos_conteo} en alerta
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF8F4] text-[#24634B] border border-[#A8DAC2]">
                  Niveles Óptimos
                </span>
              )}
            </div>
            <p className="text-xs text-[#6F5540] mt-2 leading-relaxed">
              El semáforo monitorea automáticamente cuando el stock actual es menor o igual al stock mínimo configurado.
            </p>
          </div>

          <div className="pt-4 border-t border-[#F6F2EC]">
            <Link to="/admin/inventario">
              <Button variant="secondary" size="md" className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
                Gestionar Stock y Movimientos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
