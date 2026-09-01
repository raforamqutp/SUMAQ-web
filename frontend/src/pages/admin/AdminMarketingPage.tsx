import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Promocion } from '../../types/models';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export const AdminMarketingPage: React.FC = () => {
  const { toast } = useToast();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promocion | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigoCupon, setCodigoCupon] = useState('');
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(10);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('2026-12-31');
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPromociones = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPromociones();
      setPromociones(data);
    } catch (err) {
      console.error("Error loading promotions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromociones();
  }, []);

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setTitulo('');
    setDescripcion('');
    setCodigoCupon('');
    setPorcentajeDescuento(15);
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setFechaFin('2026-12-31');
    setActivo(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (promo: Promocion) => {
    setEditingPromo(promo);
    setTitulo(promo.titulo);
    setDescripcion(promo.descripcion);
    setCodigoCupon(promo.codigo_cupon);
    setPorcentajeDescuento(parseFloat(promo.porcentaje_descuento.toString()));
    setFechaInicio(promo.fecha_inicio);
    setFechaFin(promo.fecha_fin);
    setActivo(promo.activo);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !codigoCupon.trim() || porcentajeDescuento <= 0) {
      toast.error('Campos obligatorios', 'Ingrese título, código y porcentaje mayor a 0.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        codigo_cupon: codigoCupon.trim().toUpperCase(),
        porcentaje_descuento: porcentajeDescuento,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        activo,
      };

      if (editingPromo) {
        await adminService.updatePromocion(editingPromo.id, payload);
        toast.success('Promoción actualizada', 'Los cambios se guardaron correctamente.');
      } else {
        await adminService.createPromocion(payload);
        toast.success('Promoción creada', 'Nuevo cupón de descuento activo.');
      }
      setModalOpen(false);
      fetchPromociones();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al guardar promoción.';
      toast.error('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta promoción?')) return;
    try {
      await adminService.deletePromocion(id);
      toast.success('Eliminado', 'La promoción ha sido eliminada.');
      fetchPromociones();
    } catch (err: any) {
      toast.error('Error al eliminar', err.response?.data?.error?.message || 'No se pudo eliminar la promoción.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Marketing & Fidelización</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Promociones & Cupones de Descuento
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Configuración de cupones vigentes aplicables en el motor de reservas web.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          Crear Nueva Promoción
        </Button>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : promociones.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8C6F55]">
            No hay promociones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F2EC] text-[#543F30] uppercase text-[10px] tracking-wider border-b border-[#EDE5DC]">
                <tr>
                  <th className="p-4">Código de Cupón</th>
                  <th className="p-4">Título / Campaña</th>
                  <th className="p-4">Descuento (%)</th>
                  <th className="p-4">Vigencia (Inicio - Fin)</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5DC]">
                {promociones.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="p-4 font-mono font-bold text-sm text-[#5E3A2B] whitespace-nowrap">
                      {p.codigo_cupon}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-[#2C2725]">{p.titulo}</p>
                      <p className="text-[11px] text-[#8C6F55]">{p.descripcion}</p>
                    </td>
                    <td className="p-4 font-bold text-sm text-[#24634B]">
                      {parseFloat(p.porcentaje_descuento.toString())}% OFF
                    </td>
                    <td className="p-4 whitespace-nowrap text-[#6F5540]">
                      {p.fecha_inicio} &middot; {p.fecha_fin}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.activo
                            ? 'bg-[#EFF8F4] text-[#24634B] border border-[#A8DAC2]'
                            : 'bg-[#FFF2F0] text-[#9B2C1C] border border-[#F8B4AB]'
                        }`}
                      >
                        {p.activo ? 'Vigente / Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg text-[#543F30] hover:bg-[#EDE5DC] transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-[#C84B31] hover:bg-[#FFF2F0] transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREAR / EDITAR PROMOCIÓN */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPromo ? 'Editar Promoción' : 'Nueva Promoción / Cupón'}
        subtitle="Configuración de descuento y vigencia"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Título de la Campaña</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Descuento de Primavera"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Código de Cupón</label>
              <input
                type="text"
                value={codigoCupon}
                onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                placeholder="Ej: PRIMAVERA20"
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs font-mono uppercase text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Porcentaje Descuento (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={porcentajeDescuento}
                onChange={(e) => setPorcentajeDescuento(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Descripción / Términos</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Válido para reservas de cualquier ritual durante el mes de setiembre..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="promoActivo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="rounded text-[#8C6F55] focus:ring-[#8C6F55]"
            />
            <label htmlFor="promoActivo" className="text-xs font-medium text-[#3D2D22]">
              Promoción y cupón activo para reservas públicas
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" loading={submitting} onClick={handleSubmit}>
              Guardar Promoción
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
