import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Cabina } from '../../types/models';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import { DoorClosed, Plus, Edit2 } from 'lucide-react';

export const AdminCabinsPage: React.FC = () => {
  const { toast } = useToast();
  const [cabinas, setCabinas] = useState<Cabina[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCabina, setEditingCabina] = useState<Cabina | null>(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activa, setActiva] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCabinas = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCabinas();
      setCabinas(data);
    } catch (err) {
      console.error("Error loading cabins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabinas();
  }, []);

  const handleOpenCreate = () => {
    setEditingCabina(null);
    setNombre('');
    setTipo('Holística');
    setDescripcion('');
    setActiva(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Cabina) => {
    setEditingCabina(c);
    setNombre(c.nombre);
    setTipo(c.tipo);
    setDescripcion(c.descripcion);
    setActiva(c.activa);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || !tipo.trim()) {
      toast.error('Campos obligatorios', 'Ingrese el nombre y tipo de cabina.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        tipo: tipo.trim(),
        descripcion: descripcion.trim(),
        activa,
      };

      if (editingCabina) {
        await adminService.updateCabina(editingCabina.id, payload);
        toast.success('Cabina actualizada', 'Cambios guardados con éxito.');
      } else {
        await adminService.createCabina(payload);
        toast.success('Cabina creada', 'Nueva cabina registrada.');
      }
      setModalOpen(false);
      fetchCabinas();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al guardar cabina.';
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
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Instalaciones Físicas</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Gestión de Cabinas de Atención
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Espacios temáticos acondicionados para los diferentes tipos de rituales y terapias.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          Nueva Cabina
        </Button>
      </div>

      {/* Cabins Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cabinas.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FDF2F4] text-[#8A3648] border border-[#F4BAC6]">
                    {c.tipo}
                  </span>
                  <span className={`text-xs font-bold ${c.activa ? 'text-[#24634B]' : 'text-[#9B2C1C]'}`}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-[#2C2725]">{c.nombre}</h3>
                <p className="text-xs text-[#6F5540] mt-2 leading-relaxed">{c.descripcion}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F6F2EC] flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(c)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                  Editar Cabina
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EDITAR CABINA */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCabina ? 'Editar Cabina' : 'Nueva Cabina'}
        subtitle="Configuración de espacio y especialidad temática"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Nombre de la Cabina</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cabina 1"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Tipo de Cabina</label>
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej: Holística, Dermoestética, Hidroterapia..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Descripción & Equipamiento</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Masajes relajantes y terapéuticos con aromaterapia..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" loading={submitting} onClick={handleSubmit}>
              Guardar Cabina
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
