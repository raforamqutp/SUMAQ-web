import React, { useEffect, useState, useMemo } from 'react';
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
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  DollarSign,
  Boxes,
} from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'KARDEX'>('STOCK');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda y estado
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'ALERTAS'>('TODOS');

  // Modal de movimiento de inventario (Kárdex)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<string>('ENTRADA_COMPRA');
  const [cantidad, setCantidad] = useState<number>(1);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal de Crear / Editar Producto (CRUD)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [prodNombre, setProdNombre] = useState('');
  const [prodDescripcion, setProdDescripcion] = useState('');
  const [prodCostoUnitario, setProdCostoUnitario] = useState<number>(0);
  const [prodStockActual, setProdStockActual] = useState<number>(0);
  const [prodStockMinimo, setProdStockMinimo] = useState<number>(5);
  const [prodUnidadMedida, setProdUnidadMedida] = useState('unidades');
  const [prodActivo, setProdActivo] = useState(true);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Carga de stock y kardex
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
      console.error('Error loading inventory:', err);
      toast.error('Error', 'No se pudo cargar la información del inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handlers para CRUD de Productos
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProdNombre('');
    setProdDescripcion('');
    setProdCostoUnitario(0);
    setProdStockActual(0);
    setProdStockMinimo(5);
    setProdUnidadMedida('unidades');
    setProdActivo(true);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Producto) => {
    setEditingProduct(prod);
    setProdNombre(prod.nombre);
    setProdDescripcion(prod.descripcion || '');
    setProdCostoUnitario(parseFloat(prod.costo_unitario.toString()));
    setProdStockActual(parseFloat(prod.stock_actual.toString()));
    setProdStockMinimo(parseFloat(prod.stock_minimo_alerta.toString()));
    setProdUnidadMedida(prod.unidad_medida);
    setProdActivo(prod.activo);
    setProductModalOpen(true);
  };

  const handleSubmitProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prodNombre.trim()) {
      toast.error('Nombre requerido', 'Ingrese el nombre del insumo o producto.');
      return;
    }
    if (prodCostoUnitario < 0) {
      toast.error('Costo inválido', 'El costo unitario no puede ser negativo.');
      return;
    }
    if (prodStockMinimo < 0) {
      toast.error('Stock mínimo inválido', 'El stock de alerta no puede ser negativo.');
      return;
    }

    setSubmittingProduct(true);
    try {
      if (editingProduct) {
        // Actualizar producto existente (permite modificar precio/costo, nombre, alertas, estado)
        await adminService.updateProducto(editingProduct.id, {
          nombre: prodNombre.trim(),
          descripcion: prodDescripcion.trim(),
          costo_unitario: prodCostoUnitario,
          stock_minimo_alerta: prodStockMinimo,
          unidad_medida: prodUnidadMedida.trim() || 'unidades',
          activo: prodActivo,
        });
        toast.success('Insumo Actualizado', `"${prodNombre.trim()}" ha sido actualizado exitosamente.`);
      } else {
        // Crear nuevo producto en inventario
        await adminService.createProducto({
          nombre: prodNombre.trim(),
          descripcion: prodDescripcion.trim(),
          costo_unitario: prodCostoUnitario,
          stock_actual: prodStockActual >= 0 ? prodStockActual : 0,
          stock_minimo_alerta: prodStockMinimo,
          unidad_medida: prodUnidadMedida.trim() || 'unidades',
          activo: prodActivo,
        });
        toast.success('Insumo Creado', `"${prodNombre.trim()}" ha sido registrado en el catálogo.`);
      }
      setProductModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Error al guardar el producto.';
      toast.error('Error', msg);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleToggleActivo = async (prod: Producto) => {
    const nuevoEstado = !prod.activo;
    if (!nuevoEstado) {
      const conf = window.confirm(
        `¿Desea desactivar el insumo "${prod.nombre}"?\nNo se eliminará el historial de kárdex ni recetas previas.`
      );
      if (!conf) return;
    }

    try {
      await adminService.updateProducto(prod.id, { activo: nuevoEstado });
      toast.success(
        nuevoEstado ? 'Insumo Reactivado' : 'Insumo Desactivado',
        `"${prod.nombre}" fue ${nuevoEstado ? 'activado' : 'desactivado'} en el catálogo.`
      );
      fetchInventory();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al actualizar el estado del insumo.';
      toast.error('Error', msg);
    }
  };

  // Modal con producto precargado para Kárdex
  const handleOpenMovementModal = (producto?: Producto) => {
    if (producto) {
      setSelectedProductoId(producto.id);
      setCostoUnitario(parseFloat(producto.costo_unitario.toString()));
    } else {
      const activeProds = productos.filter((p) => p.activo);
      if (activeProds.length > 0) {
        setSelectedProductoId(activeProds[0].id);
        setCostoUnitario(parseFloat(activeProds[0].costo_unitario.toString()));
      } else if (productos.length > 0) {
        setSelectedProductoId(productos[0].id);
        setCostoUnitario(parseFloat(productos[0].costo_unitario.toString()));
      }
    }
    setModalOpen(true);
  };

  // Registro de movimiento en kardex
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

  // Métricas rápidas de almacén
  const metrics = useMemo(() => {
    const total = productos.length;
    const activos = productos.filter((p) => p.activo).length;
    const inactivos = total - activos;
    const alertas = productos.filter((p) => p.activo && (p.estado_stock === 'BAJO' || p.estado_stock === 'CRITICO')).length;
    const valorizacionTotal = productos
      .filter((p) => p.activo)
      .reduce((sum, p) => sum + parseFloat(p.stock_actual.toString()) * parseFloat(p.costo_unitario.toString()), 0);

    return { total, activos, inactivos, alertas, valorizacionTotal };
  }, [productos]);

  // Lista filtrada de productos
  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterEstado === 'ACTIVOS') return p.activo;
      if (filterEstado === 'INACTIVOS') return !p.activo;
      if (filterEstado === 'ALERTAS') return p.activo && (p.estado_stock === 'BAJO' || p.estado_stock === 'CRITICO');

      return true;
    });
  }, [productos, searchTerm, filterEstado]);

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
            Gestión completa de insumos, edición de costos, alertas de reposición y movimientos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateProduct}
            icon={<Plus className="w-4 h-4" />}
          >
            Nuevo Insumo
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleOpenMovementModal()}
            icon={<ArrowUpDown className="w-4 h-4" />}
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
          Stock Actual & Catálogo ({productos.length})
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
        <div className="space-y-4">
          {/* Métricas Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#EDE5DC] shadow-xs">
              <div className="flex items-center gap-2 text-[#8C6F55] text-xs font-semibold">
                <Boxes className="w-4 h-4" /> Total Insumos
              </div>
              <p className="text-xl font-bold font-serif text-[#2C2725] mt-1">{metrics.total}</p>
              <p className="text-[11px] text-[#6F5540] mt-0.5">{metrics.activos} activos, {metrics.inactivos} inactivos</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EDE5DC] shadow-xs">
              <div className="flex items-center gap-2 text-[#A35200] text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-[#A35200]" /> Alertas Reposición
              </div>
              <p className="text-xl font-bold font-serif text-[#9B2C1C] mt-1">{metrics.alertas}</p>
              <p className="text-[11px] text-[#6F5540] mt-0.5">Stock bajo o crítico</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EDE5DC] shadow-xs">
              <div className="flex items-center gap-2 text-[#24634B] text-xs font-semibold">
                <DollarSign className="w-4 h-4 text-[#24634B]" /> Valor Almacén
              </div>
              <p className="text-xl font-bold font-serif text-[#24634B] mt-1">
                S/ {metrics.valorizacionTotal.toFixed(2)}
              </p>
              <p className="text-[11px] text-[#6F5540] mt-0.5">Stock activo valorizado</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EDE5DC] shadow-xs">
              <div className="flex items-center gap-2 text-[#5E3A2B] text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#5E3A2B]" /> Insumos Activos
              </div>
              <p className="text-xl font-bold font-serif text-[#2C2725] mt-1">{metrics.activos}</p>
              <p className="text-[11px] text-[#6F5540] mt-0.5">Disponibles en tratamientos</p>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE5DC] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C6F55]" />
              <input
                type="text"
                placeholder="Buscar por insumo o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#EDE5DC] rounded-xl text-xs text-[#2C2725] placeholder-[#8C6F55] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={() => setFilterEstado('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterEstado === 'TODOS'
                    ? 'bg-[#8C6F55] text-white'
                    : 'bg-[#FAF8F5] text-[#6F5540] hover:bg-[#F2ECE4]'
                }`}
              >
                Todos ({productos.length})
              </button>
              <button
                onClick={() => setFilterEstado('ACTIVOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterEstado === 'ACTIVOS'
                    ? 'bg-[#24634B] text-white'
                    : 'bg-[#FAF8F5] text-[#24634B] hover:bg-[#EFF8F4]'
                }`}
              >
                Activos ({metrics.activos})
              </button>
              <button
                onClick={() => setFilterEstado('ALERTAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterEstado === 'ALERTAS'
                    ? 'bg-[#A35200] text-white'
                    : 'bg-[#FAF8F5] text-[#A35200] hover:bg-[#FFF5E6]'
                }`}
              >
                Bajo Stock ({metrics.alertas})
              </button>
              <button
                onClick={() => setFilterEstado('INACTIVOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterEstado === 'INACTIVOS'
                    ? 'bg-[#6F5540] text-white'
                    : 'bg-[#FAF8F5] text-[#6F5540] hover:bg-[#F2ECE4]'
                }`}
              >
                Inactivos ({metrics.inactivos})
              </button>
            </div>
          </div>

          {/* Tabla de Stock */}
          <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProductos.length === 0 ? (
              <div className="p-12 text-center text-[#8C6F55]">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm">No se encontraron insumos</p>
                <p className="text-xs mt-1">Pruebe ajustando el término de búsqueda o agregue un nuevo insumo.</p>
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
                      <th className="p-4">Valor Total</th>
                      <th className="p-4">Nivel Stock</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE5DC]">
                    {filteredProductos.map((prod) => {
                      const stockNum = parseFloat(prod.stock_actual.toString());
                      const costoNum = parseFloat(prod.costo_unitario.toString());
                      const valorTotal = stockNum * costoNum;

                      return (
                        <tr
                          key={prod.id}
                          className={`hover:bg-[#FAF8F5] transition-colors ${
                            !prod.activo ? 'opacity-70 bg-[#FAF8F5]/50' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[#2C2725]">{prod.nombre}</p>
                              {!prod.activo && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E5DCD3] text-[#6F5540]">
                                  DESACTIVADO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#8C6F55] line-clamp-1">
                              {prod.descripcion || 'Insumo de cabina'}
                            </p>
                          </td>
                          <td className="p-4 font-mono font-bold text-sm text-[#2C2725]">
                            {stockNum.toFixed(1)} <span className="text-xs font-normal text-[#8C6F55]">{prod.unidad_medida}</span>
                          </td>
                          <td className="p-4 text-[#8C6F55]">
                            {parseFloat(prod.stock_minimo_alerta.toString()).toFixed(1)} {prod.unidad_medida}
                          </td>
                          <td className="p-4 font-mono text-[#5E3A2B] font-semibold">
                            S/ {costoNum.toFixed(2)}
                          </td>
                          <td className="p-4 font-mono font-semibold text-[#2C2725]">
                            S/ {valorTotal.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <Badge status={prod.estado_stock} />
                          </td>
                          <td className="p-4">
                            {prod.activo ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8F4] text-[#24634B] border border-[#A8DAC2]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#24634B]"></span>
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F6F2EC] text-[#8C6F55] border border-[#DFD0C0]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8C6F55]"></span>
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEditProduct(prod)}
                                icon={<Edit2 className="w-3 h-3" />}
                              >
                                Editar
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenMovementModal(prod)}
                                icon={<ArrowUpDown className="w-3 h-3" />}
                                title="Ajustar o registrar compra en kárdex"
                              >
                                Kárdex
                              </Button>

                              <button
                                onClick={() => handleToggleActivo(prod)}
                                title={prod.activo ? 'Desactivar insumo (baja lógica)' : 'Reactivar insumo'}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  prod.activo
                                    ? 'border-[#EDE5DC] text-[#8C6F55] hover:text-[#9B2C1C] hover:bg-[#FFF2F0] hover:border-[#F8B4AB]'
                                    : 'border-[#A8DAC2] text-[#24634B] bg-[#EFF8F4] hover:bg-[#D9F1E6]'
                                }`}
                              >
                                {prod.activo ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KARDEX MOVEMENTS TABLE */}
      {activeTab === 'KARDEX' && (
        <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="p-12 text-center text-[#8C6F55]">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No hay movimientos registrados en kárdex</p>
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

      {/* MODAL 1: REGISTRAR MOVIMIENTO MANUAL DE KARDEX */}
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
                  {p.nombre} {!p.activo ? '[INACTIVO]' : ''} (Stock: {p.stock_actual} {p.unidad_medida})
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

      {/* MODAL 2: CREAR / EDITAR PRODUCTO O INSUMO */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? `Editar Insumo: ${editingProduct.nombre}` : 'Nuevo Insumo / Producto'}
        subtitle={
          editingProduct
            ? 'Modifique nombre, precio/costo, alertas o disponibilidad'
            : 'Ingrese los datos para dar de alta un nuevo producto o insumo en el almacén'
        }
      >
        <form onSubmit={handleSubmitProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">
              Nombre del Insumo / Producto <span className="text-[#9B2C1C]">*</span>
            </label>
            <input
              type="text"
              required
              value={prodNombre}
              onChange={(e) => setProdNombre(e.target.value)}
              placeholder="Ej: Aceite de Coco Virgen, Crema Exfoliante..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1.5">Descripción / Uso</label>
            <textarea
              rows={2}
              value={prodDescripcion}
              onChange={(e) => setProdDescripcion(e.target.value)}
              placeholder="Ej: Insumo para cabina holística, aromaterapia y masajes relajantes..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#543F30] mb-1.5">
                Costo / Precio Unitario (S/) <span className="text-[#9B2C1C]">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={prodCostoUnitario}
                onChange={(e) => setProdCostoUnitario(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#543F30] mb-1.5">
                Unidad de Medida <span className="text-[#9B2C1C]">*</span>
              </label>
              <input
                type="text"
                list="unidades-medida-list"
                required
                value={prodUnidadMedida}
                onChange={(e) => setProdUnidadMedida(e.target.value)}
                placeholder="Ej: unidades, frascos (100ml)..."
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
              <datalist id="unidades-medida-list">
                <option value="unidades" />
                <option value="frascos (100ml)" />
                <option value="potes (250gr)" />
                <option value="potes (500gr)" />
                <option value="sobres" />
                <option value="bolsas (500gr)" />
                <option value="ml" />
                <option value="litros" />
                <option value="gr" />
                <option value="kg" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#543F30] mb-1.5">Stock Mínimo de Alerta</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={prodStockMinimo}
                onChange={(e) => setProdStockMinimo(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
              <p className="text-[10px] text-[#8C6F55] mt-1">Nivel para activar advertencia de reposición.</p>
            </div>

            {!editingProduct ? (
              <div>
                <label className="block font-semibold text-[#543F30] mb-1.5">Stock Inicial de Apertura</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={prodStockActual}
                  onChange={(e) => setProdStockActual(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                />
                <p className="text-[10px] text-[#8C6F55] mt-1">Se generará un asiento inicial en el kárdex.</p>
              </div>
            ) : (
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EDE5DC]">
                <span className="block text-[11px] font-semibold text-[#543F30]">Stock Actual en Almacén</span>
                <span className="text-base font-bold font-mono text-[#2C2725]">
                  {editingProduct.stock_actual} {editingProduct.unidad_medida}
                </span>
                <p className="text-[10px] text-[#8C6F55] mt-0.5">
                  Para modificar existencias físicas use el botón "Kárdex / Ajustar".
                </p>
              </div>
            )}
          </div>

          {/* Toggle Activo / Inactivo */}
          <div className="pt-2 border-t border-[#EDE5DC]">
            <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5DC] hover:bg-[#F6F2EC] transition-colors">
              <div>
                <span className="font-semibold text-xs text-[#2C2725] block">
                  Insumo Activo en Catálogo
                </span>
                <span className="text-[11px] text-[#6F5540] block">
                  {prodActivo
                    ? 'Disponible para recetas, consumos y tratamientos en cabina.'
                    : 'Desactivado (oculto en nuevas recetas pero conservado en el historial).'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={prodActivo}
                onChange={(e) => setProdActivo(e.target.checked)}
                className="w-4 h-4 text-[#8C6F55] rounded border-[#DFD0C0] focus:ring-[#8C6F55] cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setProductModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submittingProduct}
            >
              {editingProduct ? 'Guardar Cambios' : 'Crear Insumo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
