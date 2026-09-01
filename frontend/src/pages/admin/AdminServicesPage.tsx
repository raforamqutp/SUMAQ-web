import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Servicio, Producto } from '../../types/models';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import { Sparkles, Plus, Edit2, Trash2, Clock, Droplets, X } from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
  const { toast } = useToast();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioPublico, setPrecioPublico] = useState<number>(120);
  const [duracionMin, setDuracionMin] = useState<number>(60);
  const [imagenUrl, setImagenUrl] = useState('');
  const [activo, setActivo] = useState(true);

  // Recipe items state in modal
  const [recetasItems, setRecetasItems] = useState<Array<{ producto_id: number; cantidad_requerida: number }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servs, prods] = await Promise.all([
        adminService.getServicios(),
        adminService.getProductos(),
      ]);
      setServicios(servs);
      setProductos(prods);
    } catch (err) {
      console.error("Error loading services data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingServicio(null);
    setNombre('');
    setDescripcion('');
    setPrecioPublico(120);
    setDuracionMin(60);
    setImagenUrl('');
    setActivo(true);
    setRecetasItems([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (serv: Servicio) => {
    setEditingServicio(serv);
    setNombre(serv.nombre);
    setDescripcion(serv.descripcion);
    setPrecioPublico(parseFloat(serv.precio_publico.toString()));
    setDuracionMin(serv.duracion_min);
    setImagenUrl(serv.imagen_url || '');
    setActivo(serv.activo);

    if (serv.recetas) {
      setRecetasItems(
        serv.recetas.map((r) => ({
          producto_id: r.producto,
          cantidad_requerida: parseFloat(r.cantidad_requerida.toString()),
        }))
      );
    } else {
      setRecetasItems([]);
    }
    setModalOpen(true);
  };

  const handleAddRecipeRow = () => {
    if (productos.length === 0) return;
    setRecetasItems([...recetasItems, { producto_id: productos[0].id, cantidad_requerida: 1.0 }]);
  };

  const handleRemoveRecipeRow = (idx: number) => {
    setRecetasItems(recetasItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || precioPublico <= 0) {
      toast.error('Campos obligatorios', 'Ingrese el nombre y un precio válido.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio_publico: precioPublico,
        duracion_min: duracionMin,
        imagen_url: imagenUrl.trim(),
        activo,
        recetas_data: recetasItems,
      };

      if (editingServicio) {
        await adminService.updateServicio(editingServicio.id, payload);
        toast.success('Servicio actualizado', 'Servicio y receta de insumos actualizados.');
      } else {
        await adminService.createServicio(payload);
        toast.success('Servicio creado', 'Nuevo servicio y receta guardados.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al guardar servicio.';
      toast.error('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este servicio?')) return;
    try {
      await adminService.deleteServicio(id);
      toast.success('Servicio eliminado', 'El servicio ha sido eliminado.');
      fetchData();
    } catch (err: any) {
      toast.error('Error al eliminar', err.response?.data?.error?.message || 'No se pudo eliminar el servicio.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE5DC] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Catálogo & Recetas</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Gestión de Servicios & Recetas (BOM)
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Configuración de precios, duración y fórmula de insumos que se consumen automáticamente al atender.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          Nuevo Servicio
        </Button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {servicios.map((serv) => (
            <div
              key={serv.id}
              className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#8C6F55] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {serv.duracion_min} min
                  </span>
                  <span className="font-serif font-bold text-lg text-[#5E3A2B]">
                    S/ {parseFloat(serv.precio_publico.toString()).toFixed(2)}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-xl text-[#2C2725] mb-1">{serv.nombre}</h3>
                <p className="text-xs text-[#6F5540] leading-relaxed mb-4">{serv.descripcion}</p>

                {/* Recipe items box */}
                <div className="pt-3 border-t border-[#F6F2EC]">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[#A88B71] mb-1.5 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-[#C8907E]" />
                    Insumos por Sesión:
                  </p>
                  {serv.recetas && serv.recetas.length > 0 ? (
                    <div className="space-y-1">
                      {serv.recetas.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-[#FAF8F5] border border-[#EDE5DC]"
                        >
                          <span className="text-[#543F30]">{r.producto_nombre}</span>
                          <span className="font-bold text-[#8C6F55]">
                            {r.cantidad_requerida} {r.unidad_medida}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#A88B71] italic">Sin receta de insumos asociada.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F6F2EC] flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(serv)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                  Editar & Receta
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(serv.id)} icon={<Trash2 className="w-3.5 h-3.5" />}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREAR / EDITAR SERVICIO & RECETAS */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingServicio ? 'Editar Servicio & Receta' : 'Nuevo Servicio & Receta'}
        subtitle="Configura precios y la fórmula de insumos a descontar"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Nombre del Servicio</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Masaje Descontracturante Profundo"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Precio al Público (S/)</label>
              <input
                type="number"
                step="0.01"
                value={precioPublico}
                onChange={(e) => setPrecioPublico(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Duración (Minutos)</label>
              <input
                type="number"
                step="5"
                value={duracionMin}
                onChange={(e) => setDuracionMin(parseInt(e.target.value, 10) || 60)}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">URL de Fotografía</label>
            <input
              type="url"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Descripción</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles del tratamiento, beneficios y técnicas..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          {/* RECIPE BOM BUILDER SECTION */}
          <div className="pt-3 border-t border-[#EDE5DC] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#3D2D22]">Receta de Insumos Requeridos (BOM)</h4>
                <p className="text-[11px] text-[#8C6F55]">Insumos que se consumirán de almacén por cada atención.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddRecipeRow} icon={<Plus className="w-3 h-3" />}>
                Agregar Insumo
              </Button>
            </div>

            {recetasItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#FAF8F5] p-2 rounded-xl border border-[#EDE5DC]">
                <select
                  value={item.producto_id}
                  onChange={(e) => {
                    const newItems = [...recetasItems];
                    newItems[idx].producto_id = parseInt(e.target.value, 10);
                    setRecetasItems(newItems);
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-[#DFD0C0] rounded-lg text-xs"
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.unidad_medida})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={item.cantidad_requerida}
                  onChange={(e) => {
                    const newItems = [...recetasItems];
                    newItems[idx].cantidad_requerida = parseFloat(e.target.value) || 0;
                    setRecetasItems(newItems);
                  }}
                  className="w-24 px-2.5 py-1.5 bg-white border border-[#DFD0C0] rounded-lg text-xs"
                  placeholder="Cant."
                />

                <button
                  type="button"
                  onClick={() => handleRemoveRecipeRow(idx)}
                  className="text-[#C84B31] hover:text-[#9B2C1C] p-1 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" loading={submitting} onClick={handleSubmit}>
              Guardar Servicio & Receta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
