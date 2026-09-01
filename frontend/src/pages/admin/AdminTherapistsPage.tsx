import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Terapeuta, Cabina, User } from '../../types/models';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import { Users2, Plus, Edit2, ShieldCheck, Mail, DoorClosed } from 'lucide-react';

/**
 * ============================================================================
 * VISTA: GESTIÓN DE TERAPEUTAS & ESPECIALISTAS (AdminTherapistsPage)
 * ============================================================================
 * Administración del personal asistencial del Spa:
 * - Vinculación de terapeuta con su cuenta de usuario del sistema.
 * - Asignación de cabina física de atención fija o rotativa.
 * - Registro de especialidades (Holística, Dermoestética, Hidroterapia) y foto.
 * ============================================================================
 */
export const AdminTherapistsPage: React.FC = () => {
  const { toast } = useToast();
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [cabinas, setCabinas] = useState<Cabina[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerapeuta, setEditingTerapeuta] = useState<Terapeuta | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [especialidad, setEspecialidad] = useState('');
  const [cabinaId, setCabinaId] = useState<number | null>(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teraps, cabs, users] = await Promise.all([
        adminService.getTerapeutas(),
        adminService.getCabinas(),
        adminService.getUsuarios(),
      ]);
      setTerapeutas(teraps);
      setCabinas(cabs);
      setUsuarios(users.filter((u) => u.rol === 'TERAPEUTA'));
    } catch (err) {
      console.error("Error loading therapists data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTerapeuta(null);
    setUsuarioId(usuarios.length > 0 ? usuarios[0].id : null);
    setEspecialidad('');
    setCabinaId(cabinas.length > 0 ? cabinas[0].id : null);
    setFotoUrl('');
    setActivo(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (t: Terapeuta) => {
    setEditingTerapeuta(t);
    setUsuarioId(t.usuario?.id || null);
    setEspecialidad(t.especialidad);
    setCabinaId(t.cabina?.id || null);
    setFotoUrl(t.foto_url || '');
    setActivo(t.activo);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!especialidad.trim()) {
      toast.error('Campos obligatorios', 'Ingrese la especialidad.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        especialidad: especialidad.trim(),
        cabina: cabinaId,
        foto_url: fotoUrl.trim(),
        activo,
      };
      if (!editingTerapeuta && usuarioId) {
        payload.usuario = usuarioId;
      }

      if (editingTerapeuta) {
        await adminService.updateTerapeuta(editingTerapeuta.id, payload);
        toast.success('Terapeuta actualizado', 'Cambios guardados correctamente.');
      } else {
        await adminService.createTerapeuta(payload);
        toast.success('Terapeuta creado', 'Terapeuta y asignación de cabina registrados.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al guardar terapeuta.';
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
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Personal & Especialistas</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Gestión de Terapeutas & Asignación de Cabinas
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Asignación de terapeutas a cabinas habituales y configuración de perfiles.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          Nuevo Perfil de Terapeuta
        </Button>
      </div>

      {/* Therapists Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#8C6F55] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {terapeutas.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-[#EDE5DC] shadow-sm p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#DFD0C0] shadow-inner shrink-0">
                    <img
                      src={t.foto_url || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400'}
                      alt={t.nombre_completo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C2725]">{t.nombre_completo}</h3>
                    <p className="text-xs text-[#8C6F55] font-medium">{t.especialidad}</p>
                    <p className="text-[11px] text-[#A88B71]">{t.email}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE5DC] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8C6F55]">Cabina Habitual:</span>
                    <span className="font-semibold text-[#3D2D22]">
                      {t.cabina?.nombre || 'Sin asignar'} ({t.cabina?.tipo || '-'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C6F55]">Estado:</span>
                    <span className={`font-bold ${t.activo ? 'text-[#24634B]' : 'text-[#9B2C1C]'}`}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F6F2EC] flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(t)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                  Editar Asignación
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EDITAR TERAPEUTA */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTerapeuta ? 'Editar Terapeuta' : 'Nuevo Terapeuta'}
        subtitle="Asignación de cuenta de usuario y cabina de atención"
      >
        <div className="space-y-4 text-xs">
          {!editingTerapeuta && (
            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Cuenta de Usuario</label>
              <select
                value={usuarioId || ''}
                onChange={(e) => setUsuarioId(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre_completo} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Especialidad Terapéutica</label>
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              placeholder="Ej: Dermoestética y Cosmiatría Facial"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Cabina Habitual Asignada</label>
            <select
              value={cabinaId || ''}
              onChange={(e) => setCabinaId(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            >
              {cabinas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.tipo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">URL de Fotografía</label>
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" loading={submitting} onClick={handleSubmit}>
              Guardar Terapeuta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
