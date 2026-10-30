import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TicketStore } from '../services/ticketStore';
import { Ticket, TicketPriority, TicketType, AreaCambio } from '../types/tickets';
import {
  LifeBuoy,
  X,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Terminal,
  FileText,
  UserCheck,
  GitPullRequest,
  Network
} from 'lucide-react';

export const SupportWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [tipo, setTipo] = useState<TicketType>('SOLICITUD_SERVICIO');
  const [prioridad, setPrioridad] = useState<TicketPriority>('P3_MEDIA');
  const [modulo, setModulo] = useState('Agenda / Citas');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripción] = useState('');
  const [areaCambio, setAreaCambio] = useState<AreaCambio>('INFRAESTRUCTURA');
  const [ventanaMantenimiento, setVentanaMantenimiento] = useState('Martes 02:00 AM - 04:00 AM');
  const [planRollback, setPlanRollback] = useState('Reconexión de hardware anterior en rack (< 10 min)');
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    const list = await TicketStore.syncWithBackend();
    setTickets(list);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadTickets();
    }
    const handleUpdate = () => loadTickets();
    window.addEventListener('sumaq_tickets_updated', handleUpdate);
    return () => window.removeEventListener('sumaq_tickets_updated', handleUpdate);
  }, [isAuthenticated, user]);

  const myTickets = tickets.filter(
    (t) => !user?.email || t.solicitanteEmail.toLowerCase() === user.email.toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !descripcion.trim()) return;

    setLoading(true);
    try {
      const created = await TicketStore.createTicket({
        tipo,
        prioridad,
        modulo,
        asunto,
        descripcion,
        solicitanteNombre: user?.nombre_completo || 'Usuario Sumaq',
        solicitanteEmail: user?.email || 'usuario@sumaqspa.com',
        solicitanteRol: user?.rol || 'TERAPEUTA',
        areaCambio: tipo === 'SOLICITUD_CAMBIO' ? areaCambio : undefined,
        ventanaMantenimiento: tipo === 'SOLICITUD_CAMBIO' ? ventanaMantenimiento : undefined,
        planRollback: tipo === 'SOLICITUD_CAMBIO' ? planRollback : undefined
      });

      setSuccessMessage(`¡Ticket ${created.id} generado exitosamente!`);
      setAsunto('');
      setDescripción('');
      setActiveTab('list');
      await loadTickets();
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (t: TicketType) => {
    switch (t) {
      case 'SOLICITUD_SERVICIO':
        return { label: 'Solicitud de Servicio', icon: FileText, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'SOLICITUD_INFORMACION':
        return { label: 'Solicitud de Información', icon: HelpCircle, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'SOLICITUD_ACCESO':
        return { label: 'Solicitud de Acceso', icon: UserCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'INCIDENCIA':
        return { label: 'Incidencia Técnica', icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'SOLICITUD_CAMBIO':
        return { label: 'Control de Cambios (RFC)', icon: GitPullRequest, color: 'text-rose-700 bg-rose-50 border-rose-200' };
      default:
        return { label: 'Requerimiento TI', icon: FileText, color: 'text-gray-700 bg-gray-50 border-gray-200' };
    }
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'P1_CRITICA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">P1 - Crítica (2h)</span>;
      case 'P2_ALTA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">P2 - Alta (8h)</span>;
      case 'P3_MEDIA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">P3 - Media (24h)</span>;
      case 'P4_BAJA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">P4 - Baja (48h)</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'ABIERTO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Abierto</span>;
      case 'EN_PROCESO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">En Atención</span>;
      case 'PENDIENTE_APROBACION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pendiente CAB</span>;
      case 'APROBADO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aprobado CAB</span>;
      case 'RESUELTO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Resuelto</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{s}</span>;
    }
  };

  if (!isAuthenticated || !user || !['ADMIN', 'RECEPCIONISTA', 'TERAPEUTA', 'SOPORTE_TI'].includes(user.rol)) {
    return null;
  }

  const canCreateRFC = ['ADMIN', 'SOPORTE_TI'].includes(user.rol);

  return (
    <>
      {/* Botón Flotante Permanente */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#2C2725] hover:bg-[#3D2D22] text-[#EDE5DC] hover:text-white rounded-full shadow-2xl border-2 border-[#8C6F55] transition-all transform hover:scale-105 cursor-pointer group"
          title="Abrir Mesa de Ayuda / Gestión de Solicitudes TI"
        >
          <div className="relative">
            <LifeBuoy className="w-5 h-5 text-[#C8907E] group-hover:rotate-45 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Mesa de Ayuda TI</span>
          {myTickets.length > 0 && (
            <span className="bg-[#8C6F55] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {myTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* Modal Principal de Solicitudes */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#EDE5DC] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#2C2725] text-white p-5 flex items-center justify-between border-b border-[#3D2D22]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8C6F55] flex items-center justify-center shadow">
                  <LifeBuoy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold flex items-center gap-2">
                    Service Desk &middot; Gestión de Solicitudes
                    <span className="text-[10px] bg-[#3D2D22] text-[#C8907E] px-2 py-0.5 rounded font-mono font-medium">
                      ITIL v4
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#C9B29B]">
                    Solicitante: <span className="text-white font-medium">{user?.nombre_completo || 'Usuario'}</span> ({user?.rol || 'TERAPEUTA'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/ti');
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3D2D22] hover:bg-[#8C6F55] text-[#EDE5DC] hover:text-white text-xs font-medium transition-colors border border-[#543F30]"
                  title="Abrir la consola del Especialista de TI"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#C8907E]" />
                  <span>Ver Portal TI & CAB</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#C9B29B] hover:text-white hover:bg-[#3D2D22] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex border-b border-[#EDE5DC] bg-white px-5 pt-3">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'create'
                    ? 'border-[#8C6F55] text-[#8C6F55]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Crear Nueva Solicitud
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'list'
                    ? 'border-[#8C6F55] text-[#8C6F55]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                Mis Tickets Registrados ({myTickets.length})
              </button>
            </div>

            {/* Mensaje de éxito */}
            {successMessage && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cuerpo del Modal */}
            <div className="flex-1 p-5 overflow-y-auto">
              {activeTab === 'create' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selector de Tipo de Solicitud */}
                  <div>
                    <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-2">
                      Tipo de Requerimiento
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'SOLICITUD_SERVICIO', title: 'Solicitud de Servicio', desc: 'Nuevo tratamiento, insumos BOM, mantenimiento' },
                        { id: 'SOLICITUD_ACCESO', title: 'Solicitud de Acceso', desc: 'Crear usuario, rol, reseteo de clave' },
                        { id: 'SOLICITUD_INFORMACION', title: 'Solicitud de Información', desc: 'Reporte kardex/ventas en nodo Slave 3309' },
                        { id: 'INCIDENCIA', title: 'Incidencia Técnica', desc: 'Error de sistema, lentitud o bug' },
                        ...(canCreateRFC
                          ? [{ id: 'SOLICITUD_CAMBIO', title: 'Control de Cambios (RFC)', desc: 'Infraestructura, Apps, Docs, Calendario (CAB)' }]
                          : [])
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setTipo(item.id as TicketType)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            tipo === item.id
                              ? 'border-[#8C6F55] bg-[#8C6F55]/10 ring-1 ring-[#8C6F55]'
                              : 'border-[#EDE5DC] bg-white hover:border-[#8C6F55]/50'
                          }`}
                        >
                          <p className="text-xs font-bold text-[#2C2725]">{item.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campos condicionales si es Control de Cambios (RFC) */}
                  {tipo === 'SOLICITUD_CAMBIO' && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                      <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <GitPullRequest className="w-4 h-4 text-rose-700" />
                        <span>Parámetros de Control de Cambios (CAB / RFC) (CAB / RFC)</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                            Área de Cambio (4 Categorías ITIL)
                          </label>
                          <select
                            value={areaCambio}
                            onChange={(e) => setAreaCambio(e.target.value as AreaCambio)}
                            className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-white"
                          >
                            <option value="INFRAESTRUCTURA">1. Infraestructura (Switch, Router, Servidores)</option>
                            <option value="APLICACIONES">2. Aplicaciones & Base de Datos</option>
                            <option value="DOCUMENTACION">3. Documentación & Procesos</option>
                            <option value="CALENDARIO">4. Calendario & Change Freeze</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                            Ventana de Mantenimiento
                          </label>
                          <input
                            type="text"
                            value={ventanaMantenimiento}
                            onChange={(e) => setVentanaMantenimiento(e.target.value)}
                            placeholder="Ej. Martes 02:00 AM - 04:00 AM"
                            className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prioridad y Módulo Afectado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                        Prioridad / SLA Requerido
                      </label>
                      <select
                        value={prioridad}
                        onChange={(e) => setPrioridad(e.target.value as TicketPriority)}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                      >
                        <option value="P1_CRITICA">P1 - Crítica (SLA: 2 Horas - Sistema detenido)</option>
                        <option value="P2_ALTA">P2 - Alta (SLA: 8 Horas - Alto impacto operativo)</option>
                        <option value="P3_MEDIA">P3 - Media (SLA: 24 Horas - Operación normal)</option>
                        <option value="P4_BAJA">P4 - Baja (SLA: 48 Horas - Consulta o sugerencia)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                        Módulo o Componente Afectado
                      </label>
                      <select
                        value={modulo}
                        onChange={(e) => setModulo(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                      >
                        <option value="Redes & Hardware (Switch / Router)">Redes & Hardware (Switch / Router)</option>
                        <option value="Agenda / Citas">Agenda / Citas de Cabinas</option>
                        <option value="Punto de Venta / Caja">Punto de Venta / Caja y Pagos</option>
                        <option value="Inventario y Kardex">Inventario & Kardex de Insumos</option>
                        <option value="Servicios y Recetas (BOM)">Servicios & Recetas (BOM)</option>
                        <option value="Usuarios y Accesos">Usuarios, Cuentas y Accesos</option>
                        <option value="Base de Datos / Azure VM">Infraestructura / Azure VM</option>
                      </select>
                    </div>
                  </div>

                  {/* Asunto */}
                  <div>
                    <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                      Asunto Resumido de la Solicitud
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Reemplazo de Switch Administrable y Segmentación de VLANs 10, 20 y 30"
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                      Detalle y Justificación Técnica
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describa el motivo, componentes afectados, impacto y consideraciones operativas..."
                      value={descripcion}
                      onChange={(e) => setDescripción(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">
                      Principio ITIL v4: Sincronización en tiempo real con Jira Cloud v3.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-[#8C6F55] hover:bg-[#6D543F] text-white text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{loading ? 'Registrando...' : 'Enviar Solicitud'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {myTickets.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">
                      No tienes tickets registrados aún.
                    </div>
                  ) : (
                    myTickets.map((t) => {
                      const tipoInfo = getTipoLabel(t.tipo);
                      const TipoIcon = tipoInfo.icon;
                      return (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl border border-[#EDE5DC] bg-white space-y-2 hover:border-[#8C6F55] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#8C6F55]">{t.id}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${tipoInfo.color}`}>
                                <TipoIcon className="w-3 h-3" />
                                {tipoInfo.label}
                              </span>
                              {getPriorityBadge(t.prioridad)}
                            </div>
                            {getStatusBadge(t.estado)}
                          </div>

                          <p className="text-xs font-bold text-[#2C2725]">{t.asunto}</p>
                          <p className="text-[11px] text-gray-600 line-clamp-2">{t.descripcion}</p>

                          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                            <span>SLA Límite: {t.slaFechaLimite}</span>
                            {t.jiraKey && (
                              <span className="text-blue-700 font-bold">Jira: {t.jiraKey}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
