import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TicketStore } from '../services/ticketStore';
import { Ticket, TicketPriority, TicketType } from '../types/tickets';
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
  GitPullRequest
} from 'lucide-react';

export const SupportWidget: React.FC = () => {
  const { user } = useAuth();
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
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    const list = await TicketStore.syncWithBackend();
    setTickets(list);
  };

  const loadTicketsSync = () => {
    const list = TicketStore.getTickets();
    setTickets(list);
  };

  useEffect(() => {
    loadTickets();
    const handleUpdate = () => loadTickets();
    window.addEventListener('sumaq_tickets_updated', handleUpdate);
    return () => window.removeEventListener('sumaq_tickets_updated', handleUpdate);
  }, []);

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
        solicitanteRol: user?.rol || 'TERAPEUTA'
      });

      setSuccessMessage(`¡Ticket ${created.id} generado exitosamente!`);
      setAsunto('');
      setDescripcion('');
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
      case 'RESUELTO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Resuelto</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{s}</span>;
    }
  };

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
                      Mesa de Ayuda
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
                  <span>Ver Portal TI</span>
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
                Mis Solicitudes ({myTickets.length})
              </button>
            </div>

            {/* Mensaje de Confirmación Éxito */}
            {successMessage && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
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
                        { id: 'INCIDENCIA', title: 'Incidencia Técnica', desc: 'Error de sistema, lentitud o bug' }
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
                        Módulo o Área Afectada
                      </label>
                      <select
                        value={modulo}
                        onChange={(e) => setModulo(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                      >
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
                      placeholder="Ej. Alta de credenciales para terapeuta Camila Vega en Cabina 2"
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
                      placeholder="Indique con claridad los requerimientos, nombres de usuarios a dar de alta, reportes necesarios o síntomas de la falla..."
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                    />
                  </div>

                  {/* Botón de Envío */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Registro cifrado con auditoría y trazabilidad
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#8C6F55] hover:bg-[#6D543F] text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {loading ? 'Registrando Ticket...' : 'Emitir Ticket Formal'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Lista de Mis Solicitudes */
                <div className="space-y-3">
                  {myTickets.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-[#EDE5DC]">
                      <LifeBuoy className="w-10 h-10 text-[#C9B29B] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-gray-600">Aún no has registrado solicitudes de soporte.</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="mt-3 text-xs text-[#8C6F55] font-bold hover:underline"
                      >
                        Crear tu primera solicitud aquí
                      </button>
                    </div>
                  ) : (
                    myTickets.map((t) => {
                      const typeInfo = getTipoLabel(t.tipo);
                      const Icon = typeInfo.icon;
                      return (
                        <div
                          key={t.id}
                          className="p-4 bg-white rounded-xl border border-[#EDE5DC] shadow-sm hover:border-[#8C6F55]/60 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#8C6F55]">{t.id}</span>
                              {t.jiraKey && (
                                <a
                                  href={t.jiraUrl || `https://sumaqspa.atlassian.net/browse/${t.jiraKey}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 hover:underline"
                                  title="Ver ticket sincronizado en Jira Cloud"
                                >
                                  Jira: {t.jiraKey}
                                </a>
                              )}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.color}`}>
                                <Icon className="w-3 h-3" />
                                {typeInfo.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(t.prioridad)}
                              {getStatusBadge(t.estado)}
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-[#2C2725]">{t.asunto}</h4>
                          <p className="text-[11px] text-gray-600 leading-relaxed">{t.descripcion}</p>

                          <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                            <span>Módulo: <strong className="text-gray-600">{t.modulo}</strong></span>
                            <span>Creado: {t.fechaCreacion}</span>
                            <span>SLA Límite: <strong className="text-gray-600">{t.slaFechaLimite}</strong></span>
                          </div>

                          {/* Respuesta Técnica del área de TI si existe */}
                          {t.resolucionTecnica && (
                            <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px]">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold flex items-center gap-1 text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Respuesta y Atención por Área de TI:
                                </span>
                                {t.fechaResolucion && (
                                  <span className="text-[10px] text-emerald-700">{t.fechaResolucion}</span>
                                )}
                              </div>
                              <p className="text-gray-700 italic">{t.resolucionTecnica}</p>
                              {t.githubUrl && (
                                <a
                                  href={t.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-gray-800 hover:text-black underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver Registro de Cambio (RFC en GitHub)
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer Informativo */}
            <div className="p-3 bg-[#FAF8F5] border-t border-[#EDE5DC] flex items-center justify-between text-[11px] text-gray-500">
<span className="flex items-center gap-1">
                SUMAQ Spa &middot; Mesa de Ayuda y Soporte TI
              </span>
              <button
                type="button"
                onClick={() => {
                  TicketStore.resetDefaults();
                  loadTickets();
                }}
                className="text-[10px] text-gray-400 hover:text-gray-600 underline cursor-pointer"
              >
                Restablecer Tickets de Ejemplo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
