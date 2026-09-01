import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { User } from '../../types/models';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { useToast } from '../../contexts/ToastContext';
import { UserCog, Plus, Edit2, Shield, User as UserIcon } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'ADMIN' | 'RECEPCIONISTA' | 'TERAPEUTA'>('RECEPCIONISTA');
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNombreCompleto('');
    setEmail('');
    setPassword('');
    setRol('TERAPEUTA');
    setActivo(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNombreCompleto(u.nombre_completo);
    setEmail(u.email);
    setPassword('');
    setRol(u.rol);
    setActivo(u.activo);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!nombreCompleto.trim() || !email.trim()) {
      toast.error('Campos obligatorios', 'Ingrese nombre y correo electrónico.');
      return;
    }
    if (!editingUser && (!password || password.length < 8)) {
      toast.error('Contraseña requerida', 'La contraseña inicial debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        nombre_completo: nombreCompleto.trim(),
        email: email.trim(),
        rol,
        activo,
      };
      if (password) {
        payload.password = password;
      }

      if (editingUser) {
        await adminService.updateUsuario(editingUser.id, payload);
        toast.success('Usuario actualizado', 'Cambios guardados con éxito.');
      } else {
        await adminService.createUsuario(payload);
        toast.success('Usuario creado', 'Nuevo usuario registrado en el sistema.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Error al guardar usuario.';
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
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6F55]">Seguridad & Control RBAC</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2725] mt-0.5">
            Gestión de Usuarios & Roles
          </h1>
          <p className="text-xs text-[#6F5540] mt-1">
            Administración de cuentas con roles ADMIN y TERAPEUTA para el acceso al sistema.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          Nuevo Usuario
        </Button>
      </div>

      {/* Users Table */}
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
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Correo Electrónico</th>
                  <th className="p-4">Rol Asignado</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha Creación</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5DC]">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="p-4 font-bold text-[#2C2725] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#EDE5DC] flex items-center justify-center text-[#8C6F55]">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span>{u.nombre_completo}</span>
                    </td>
                    <td className="p-4 font-mono text-[#6F5540]">{u.email}</td>
                    <td className="p-4">
                      <Badge status={u.rol} />
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${u.activo ? 'text-[#24634B]' : 'text-[#9B2C1C]'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-[#8C6F55]">{u.created_at ? new Date(u.created_at).toLocaleDateString('es-PE') : '-'}</td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(u)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: EDITAR USUARIO */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        subtitle="Configura credenciales y nivel de acceso RBAC"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Nombre Completo</label>
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej: Lic. Elena Morales"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Correo Electrónico (Login)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@sumaqspa.pe"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">
              Contraseña {editingUser && '(Dejar en blanco para mantener actual)'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#543F30] mb-1">Rol de Acceso</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-white border border-[#DFD0C0] rounded-xl text-xs text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
            >
              <option value="ADMIN">ADMINISTRADOR GENERAL (Acceso total, finanzas, métricas y roles)</option>
              <option value="RECEPCIONISTA">RECEPCIONISTA (Agenda 3 cabinas, citas, caja POS e insumos)</option>
              <option value="TERAPEUTA">TERAPEUTA (Portal de terapeuta, atención clínica y consumos)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="userActivo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="rounded text-[#8C6F55] focus:ring-[#8C6F55]"
            />
            <label htmlFor="userActivo" className="text-xs font-medium text-[#3D2D22]">
              Usuario activo para inicio de sesión
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" loading={submitting} onClick={handleSubmit}>
              Guardar Usuario
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
