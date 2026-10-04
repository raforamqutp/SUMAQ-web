import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';
import { Terapeuta, Cabina } from '../../types/models';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import { Users2, Plus, Edit2, ShieldCheck, Mail, DoorClosed } from 'lucide-react';

export const AdminTherapistsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const { toast } = useToast();
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [cabinas, setCabinas] = useState<Cabina[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de terapeuta
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerapeuta, setEditingTerapeuta] = useState<Terapeuta | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Sumaq2026!');
  const [especialidad, setEspecialidad] = useState('');
  const [cabinaId, setCabinaId] = useState<number | null>(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Carga de terapeutas y cabinas
  const fetchData = async () => {
    setLoading(true);
    try {
      const [teraps, cabs] = await Promise.all([
        adminService.getTerapeutas(),
        adminService.getCabinas(),
      ]);
      setTerapeutas(teraps);
      setCabinas(cabs);
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
    setNombreCompleto('');
    setEmail('');
    setPassword('Sumaq2026!');
    setEspecialidad('');
    setCabinaId(cabinas.length > 0 ? cabinas[0].id : null);
    setFotoUrl('');
    setActivo(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (t: Terapeuta) => {
    setEditingTerapeuta(t);
    setNombreCompleto(t.nombre_completo || t.usuario?.nombre_completo || '');
    setEmail(t.email || t.usuario?.email || '');
    setPassword('');
    setEspecialidad(t.especialidad);
    setCabinaId(t.cabina?.id || null);
    setFotoUrl(t.foto_url || '');
    setActivo(t.activo);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!nombreCompleto.trim() && !editingTerapeuta) {
      toast.error('Campos obligatorios', 'Ingrese el nombre completo del terapeuta.');
      return;
    }
    if (!email.trim() && !editingTerapeuta) {
      toast.error('Campos obligatorios', 'Ingrese el correo electrónico.');
      return;
    }
    if (!especialidad.trim()) {
      toast.error('Campos obligatorios', 'Ingrese la especialidad.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        nombre_completo: nombreCompleto.trim(),
        email: email.trim().toLowerCase(),
        especialidad: especialidad.trim(),
        cabina_id: cabinaId || null,
        foto_url: fotoUrl.trim(),
        activo,
      };
      if (password) {
        payload.password = password;
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
      const msg = err.response?.data?.error?.message || err.response?.data?.email?.[0] || 'Error al guardar terapeuta.';
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

        {isAdmin && (
          <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
            Nuevo Perfil de Terapeuta
          </Button>
        )}
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

              {isAdmin && (
                <div className="mt-6 pt-4 border-t border-[#F6F2EC] flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(t)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                    Editar Asignación
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: EDITAR / CREAR TERAPEUTA */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTerapeuta ? 'Editar Terapeuta' : 'Nuevo Perfil de Terapeuta'}
        subtitle="Configuración de credenciales de usuario y cabina de atención"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Nombre Completo del Especialista *</label>
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej: Valeria Mendoza"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#543F30] mb-1">Correo Electrónico (Login) *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="valeria.mendoza@sumaqspa.pe"
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#543F30] mb-1">
                {editingTerapeuta ? 'Nueva Contraseña (opcional)' : 'Contraseña de Acceso *'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Especialidad Terapéutica *</label>
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
              onChange={(e) => setCabinaId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            >
              <option value="">Sin cabina fija</option>
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

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="terapeuta-activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="rounded text-[#8C6F55] focus:ring-[#8C6F55]"
            />
            <label htmlFor="terapeuta-activo" className="text-xs text-[#543F30] font-medium">
              Especialista activo para asignación y reservas
            </label>
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
