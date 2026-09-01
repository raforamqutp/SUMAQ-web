import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Producto, MovimientoInventario } from '../../types/models';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import {
  Package,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'KARDEX'>('STOCK');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Movement Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<string>('ENTRADA_COMPRA');
  const [cantidad, setCantidad] = useState<number>(1);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [prods, movs] = await Promise.all([
        adminService.getProductos(),
        adminService.getMovimientosInventario(),
      ]);
      setProductos(prods);
      setMovimientos(movs);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenMovementModal = (producto?: Producto) => {
    if (producto) {
      setSelectedProductoId(producto.id);
      setCostoUnitario(parseFloat(producto.costo_unitario.toString()));
    } else if (productos.length > 0) {
      setSelectedProductoId(productos[0].id);
      setCostoUnitario(parseFloat(productos[0].costo_unitario.toString()));
    }
    setModalOpen(true);
  };

  const handleSubmitMovement = async () => {
    if (!selectedProductoId || cantidad <= 0) {
      toast.error('Datos inválidos', 'Seleccione un insumo y una cantidad mayor a cero.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.registrarMovimientoManual({
        producto_id: selectedProductoId,
        tipo: tipoMovimiento,
        cantidad,
        costo_unitario: costoUnitario > 0 ? costoUnitario : undefined,
        descripcion: descripcion.trim() || undefined,
      });
      toast.success('Movimiento Registrado', 'El stock y kárdex han sido actualizados exitosamente.');
      setModalOpen(false);
      setDescripcion('');
      setCantidad(1);
      fetchInventory();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al procesar movimiento de inventario.';
      toast.error('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Almacén & Insumos</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Control de Inventario & Kárdex
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Gestión de stock, alertas de reposición y trazabilidad histórica de consumos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleOpenMovementModal()}
            icon={<Plus className="w-4 h-4" />}
          >
            Registrar Movimiento / Compra
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EDE5DC] pb-3">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'STOCK'
              ? 'bg-[#8C6F55] text-white shadow-sm'
              : 'bg-white text-[#6F5540] border border-[#EDE5DC] hover:bg-[#F6F2EC]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Stock Actual & Alertas ({productos.length})
        </button>

        <button
          onClick={() => setActiveTab('KARDEX')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'KARDEX'
              ? 'bg-[#8C6F55] text-white shadow-sm'
              : 'bg-white text-[#6F5540] border border-[#EDE5DC] hover:bg-[#F6F2EC]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Historial de Movimientos ({movimientos.length})
        </button>
      </div>

      {/* TAB 1: STOCK TABLE */}
      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F2EC] text-[#543F30] uppercase text-[10px] tracking-wider border-b border-[#EDE5DC]">
                  <tr>
                    <th className="p-4">Producto / Insumo</th>
                    <th className="p-4">Stock Actual</th>
                    <th className="p-4">Stock Mínimo</th>
                    <th className="p-4">Costo Unitario</th>
                    <th className="p-4">Valor Total Stock</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE5DC]">
                  {productos.map((prod) => {
                    const stockNum = parseFloat(prod.stock_actual.toString());
                    const costoNum = parseFloat(prod.costo_unitario.toString());
                    const valorTotal = stockNum * costoNum;

                    return (
                      <tr key={prod.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-[#2C2725]">{prod.nombre}</p>
                          <p className="text-[11px] text-[#8C6F55]">{prod.descripcion || 'Insumo de cabina'}</p>
                        </td>
                        <td className="p-4 font-mono font-bold text-sm text-[#2C2725]">
                          {stockNum.toFixed(1)} {prod.unidad_medida}
                        </td>
                        <td className="p-4 text-[#8C6F55]">
                          {parseFloat(prod.stock_minimo_alerta.toString()).toFixed(1)} {prod.unidad_medida}
                        </td>
                        <td className="p-4 font-mono text-[#5E3A2B]">
                          S/ {costoNum.toFixed(2)}
                        </td>
                        <td className="p-4 font-mono font-semibold text-[#2C2725]">
                          S/ {valorTotal.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <Badge status={prod.estado_stock} />
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenMovementModal(prod)}
                            icon={<ArrowUpDown className="w-3 h-3" />}
                          >
                            Ajustar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KARDEX MOVEMENTS TABLE */}
      {activeTab === 'KARDEX' && (
        <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F2EC] text-[#543F30] uppercase text-[10px] tracking-wider border-b border-[#EDE5DC]">
                  <tr>
                    <th className="p-4">Fecha & Hora</th>
                    <th className="p-4">Insumo</th>
                    <th className="p-4">Tipo Movimiento</th>
                    <th className="p-4">Cantidad</th>
                    <th className="p-4">Costo Histórico</th>
                    <th className="p-4">Referencia / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE5DC]">
                  {movimientos.map((mov) => {
                    const isPositive = mov.tipo === 'ENTRADA_COMPRA' || mov.tipo === 'AJUSTE_POSITIVO';

                    return (
                      <tr key={mov.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="p-4 font-mono text-[11px] text-[#8C6F55] whitespace-nowrap">
                          {new Date(mov.fecha_registro).toLocaleString('es-PE')}
                        </td>
                        <td className="p-4 font-bold text-[#2C2725]">
                          {mov.producto_nombre}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPositive
                                ? 'bg-[#EFF8F4] text-[#24634B]'
                                : 'bg-[#FFF2F0] text-[#9B2C1C]'
                            }`}
                          >
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {mov.tipo}
                          </span>
                        </td>
                        <td className={`p-4 font-mono font-bold text-sm ${isPositive ? 'text-[#24634B]' : 'text-[#9B2C1C]'}`}>
                          {isPositive ? '+' : '-'}{parseFloat(mov.cantidad.toString()).toFixed(1)} {mov.unidad_medida}
                        </td>
                        <td className="p-4 font-mono text-[#5E3A2B]">
                          S/ {parseFloat(mov.costo_unitario.toString()).toFixed(2)}
                        </td>
                        <td className="p-4 text-[#6F5540]">
                          <p className="font-medium">{mov.descripcion || mov.referencia_tipo}</p>
                          {mov.referencia_id && (
                            <p className="text-[10px] text-[#8C6F55]">Ref ID: #{mov.referencia_id}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: REGISTRAR MOVIMIENTO MANUAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Movimiento de Inventario"
        subtitle="Entradas por compra o ajustes manuales en almacén"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">Insumo / Producto</label>
            <select
              value={selectedProductoId || ''}
              onChange={(e) => {
                const pId = parseInt(e.target.value, 10);
                setSelectedProductoId(pId);
                const p = productos.find((x) => x.id === pId);
                if (p) setCostoUnitario(parseFloat(p.costo_unitario.toString()));
              }}
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            >
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Stock: {p.stock_actual} {p.unidad_medida})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#543F30] mb-1.5">Tipo de Movimiento</label>
              <select
                value={tipoMovimiento}
                onChange={(e) => setTipoMovimiento(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              >
                <option value="ENTRADA_COMPRA">Entrada por Compra (+)</option>
                <option value="AJUSTE_POSITIVO">Ajuste Positivo (+)</option>
                <option value="AJUSTE_NEGATIVO">Ajuste Negativo (-)</option>
                <option value="SALIDA_CONSUMO_SERVICIO">Salida por Merma / Uso (-)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#543F30] mb-1.5">Cantidad</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={cantidad}
                onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">Costo Unitario (S/)</label>
            <input
              type="number"
              step="0.01"
              value={costoUnitario}
              onChange={(e) => setCostoUnitario(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">Concepto / Motivo</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Factura de proveedor #F001-245 o regularización de inventario físico..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleSubmitMovement}
            >
              Registrar en Kárdex
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
