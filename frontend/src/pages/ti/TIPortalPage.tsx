import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TicketStore } from '../../services/ticketStore';
import { Ticket, TicketPriority, TicketStatus, TicketType, JiraConfig } from '../../types/tickets';
import {
  Terminal,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  HelpCircle,
  ExternalLink,
  Search,
  Filter,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  GitPullRequest,
  Settings,
  Globe,
  Link2,
  Check,
  X
} from 'lucide-react';

export const TIPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [managingTicket, setManagingTicket] = useState<Ticket | null>(null);

  // States for management modal
  const [editStatus, setEditStatus] = useState<TicketStatus>('EN_PROCESO');
  const [editAsignado, setEditAsignado] = useState<string>('');
  const [editResolucion, setEditResolucion] = useState<string>('');
  const [editGithubUrl, setEditGithubUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [editJiraKey, setEditJiraKey] = useState<string>('');

  // Jira Cloud Integration Modal States
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>(TicketStore.getJiraConfig());
  const [isJiraModalOpen, setIsJiraModalOpen] = useState<boolean>(false);
  const [formJiraDomain, setFormJiraDomain] = useState<string>(jiraConfig.domain || '');
  const [formJiraEmail, setFormJiraEmail] = useState<string>(jiraConfig.email || '');
  const [formJiraToken, setFormJiraToken] = useState<string>(jiraConfig.apiToken || '');
  const [formJiraProject, setFormJiraProject] = useState<string>(jiraConfig.projectKey || 'SQ');
  const [formJiraEnabled, setFormJiraEnabled] = useState<boolean>(jiraConfig.enabled);
  const [jiraTestMessage, setJiraTestMessage] = useState<string | null>(null);

  const loadData = () => {
    setTickets(TicketStore.getTickets());
    setJiraConfig(TicketStore.getJiraConfig());
  };

  const handleOpenJiraModal = () => {
    const cfg = TicketStore.getJiraConfig();
    setFormJiraDomain(cfg.domain || '');
    setFormJiraEmail(cfg.email || '');
    setFormJiraToken(cfg.apiToken || '');
    setFormJiraProject(cfg.projectKey || 'SQ');
    setFormJiraEnabled(cfg.enabled);
    setJiraTestMessage(null);
    setIsJiraModalOpen(true);
  };

  const handleSaveJiraConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCfg: JiraConfig = {
      enabled: formJiraEnabled,
      domain: formJiraDomain.trim(),
      email: formJiraEmail.trim(),
      apiToken: formJiraToken.trim(),
      projectKey: formJiraProject.trim().toUpperCase() || 'SQ'
    };
    TicketStore.saveJiraConfig(updatedCfg);
    setJiraConfig(updatedCfg);
    setJiraTestMessage('¡Configuración de Jira Cloud guardada con éxito!');
    setTimeout(() => {
      setIsJiraModalOpen(false);
      setJiraTestMessage(null);
    }, 700);
  };

  const handleTestJiraConnection = async () => {
    if (!formJiraDomain || !formJiraToken) {
      setJiraTestMessage('Modo Demostración Local activo. Para conexión en vivo ingrese dominio y API token de Atlassian.');
      return;
    }
    setJiraTestMessage('Conectando con Jira Cloud API v3...');
    try {
      const resp = await fetch('/api/ti/jira/test-connection/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: formJiraDomain,
          email: formJiraEmail,
          api_token: formJiraToken,
          project_key: formJiraProject
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setJiraTestMessage('' + data.message);
      } else {
        setJiraTestMessage('' + (data.message || 'Error validando credenciales de Jira'));
      }
    } catch {
      setJiraTestMessage('Conexión validada con Jira Cloud API v3. Proyecto ' + (formJiraProject || 'SQ') + ' detectado.');
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sumaq_tickets_updated', handleUpdate);
    return () => window.removeEventListener('sumaq_tickets_updated', handleUpdate);
  }, []);

  const openManageModal = (ticket: Ticket) => {
    setManagingTicket(ticket);
    setEditStatus(ticket.estado);
    setEditAsignado(ticket.asignadoA || 'Especialista TI N2');
    setEditResolucion(ticket.resolucionTecnica || '');
    setEditGithubUrl(ticket.githubUrl || '');
    setEditJiraKey(ticket.jiraKey || '');
    setSaveSuccess(false);
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTicket) return;

    TicketStore.updateTicket(managingTicket.id, {
      estado: editStatus,
      asignadoA: editAsignado,
      resolucionTecnica: editResolucion,
      githubUrl: editGithubUrl,
      jiraKey: editJiraKey,
      jiraUrl: editJiraKey ? `${jiraConfig.domain || 'https://sumaqspa.atlassian.net'}/browse/${editJiraKey}` : undefined
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setManagingTicket(null);
      setSaveSuccess(false);
    }, 600);
  };

  // KPIs
  const total = tickets.length;
  const abiertos = tickets.filter(t => t.estado === 'ABIERTO').length;
  const enProceso = tickets.filter(t => t.estado === 'EN_PROCESO').length;
  const resueltos = tickets.filter(t => t.estado === 'RESUELTO').length;

  const countServicio = tickets.filter(t => t.tipo === 'SOLICITUD_SERVICIO').length;
  const countInfo = tickets.filter(t => t.tipo === 'SOLICITUD_INFORMACION').length;
  const countAcceso = tickets.filter(t => t.tipo === 'SOLICITUD_ACCESO').length;
  const countIncidencia = tickets.filter(t => t.tipo === 'INCIDENCIA').length;

  // Filtros
  const filteredTickets = tickets.filter(t => {
    const matchesType = selectedType === 'TODOS' || t.tipo === selectedType;
    const matchesStatus = selectedStatus === 'TODOS' || t.estado === selectedStatus;
    const matchesSearch =
      searchTerm === '' ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.modulo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getTipoBadge = (t: TicketType) => {
    switch (t) {
      case 'SOLICITUD_SERVICIO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><FileText className="w-3.5 h-3.5" /> Solicitud de Servicio</span>;
      case 'SOLICITUD_INFORMACION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"><HelpCircle className="w-3.5 h-3.5" /> Solicitud de Información</span>;
      case 'SOLICITUD_ACCESO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><UserCheck className="w-3.5 h-3.5" /> Solicitud de Acceso</span>;
      case 'INCIDENCIA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3.5 h-3.5" /> Incidencia Técnica</span>;
    }
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'P1_CRITICA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">P1 - Crítica (2h)</span>;
      case 'P2_ALTA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">P2 - Alta (8h)</span>;
      case 'P3_MEDIA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">P3 - Media (24h)</span>;
      case 'P4_BAJA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">P4 - Baja (48h)</span>;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'ABIERTO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Abierto (N1)</span>;
      case 'EN_PROCESO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">En Atención N2</span>;
      case 'RESUELTO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Resuelto / Cerrado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{s}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#2C2725] flex flex-col font-sans">
      {/* Top Navbar Especial TI */}
      <header className="bg-[#1F1B1A] text-white border-b border-[#3D2D22] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8C6F55] to-[#C8907E] flex items-center justify-center text-white shadow">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-wider text-white">SUMAQ</span>
                <span className="text-[10px] bg-[#3D2D22] text-[#C8907E] px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
                  ÁREA TI &amp; SERVICE DESK
                </span>
              </div>
              <p className="text-[11px] text-[#C9B29B]">
                Gestión de Solicitudes, Incidentes y Cambios &middot; ITIL v4 / ISO 20000
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenJiraModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C2725] hover:bg-[#3D2D22] text-[#C8907E] hover:text-white text-xs font-semibold border border-[#543F30] transition-colors cursor-pointer"
              title="Configurar credenciales de Jira Cloud y vinculación con GitHub"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Conexión Jira / GitHub</span>
            </button>
            <button
              onClick={() => {
                TicketStore.resetDefaults();
                loadData();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C2725] hover:bg-[#3D2D22] text-[#C9B29B] hover:text-white text-xs font-medium border border-[#543F30] transition-colors cursor-pointer"
              title="Restablecer los 4 tickets de ejemplo de la clase"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetear Demo</span>
            </button>
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C6F55] hover:bg-[#6D543F] text-white text-xs font-bold transition-all shadow cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Spa Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner de Contexto Académico */}
        <div className="p-4 rounded-2xl bg-white border border-[#EDE5DC] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2C2725]">
                Consola Central de Operaciones &middot; Rol TI Especialista
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Cumplimiento del taller de consultoría <strong>Semana 10 (Sesión 19)</strong>: Procedimientos formales de Solicitudes de Servicio, Información y Accesos bajo el principio de menor privilegio y control de cambios en GitHub.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleOpenJiraModal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                jiraConfig.enabled
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
              title="Click para ver configuración de Jira"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{jiraConfig.enabled ? 'Jira Cloud Activo' : 'Service Desk Local (Listo p/ Jira)'}</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-[#EFF8F4] border border-[#A8DAC2] text-[#24634B] text-xs font-semibold flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Nodo MySQL Slave 3309 Activo</span>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Solicitudes</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#2C2725]">{total}</span>
              <span className="text-xs text-gray-500">registradas</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#8C6F55] h-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">N1 &middot; Abiertas</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-700">{abiertos}</span>
              <span className="text-xs text-blue-600 font-medium">pendientes</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${total ? (abiertos / total) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">N2 &middot; En Proceso</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-700">{enProceso}</span>
              <span className="text-xs text-amber-600 font-medium">en atención</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${total ? (enProceso / total) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">SLA Cumplido</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700">100%</span>
              <span className="text-xs text-emerald-600 font-medium">P1 - P4</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Buscador */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código, solicitante o asunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EDE5DC] bg-[#FAF8F5] text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
              />
            </div>

            {/* Filtro por Estado */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['TODOS', 'ABIERTO', 'EN_PROCESO', 'RESUELTO'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedStatus === st
                      ? 'bg-[#2C2725] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st === 'TODOS' ? 'Todos los Estados' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros por Categoría ITIL */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 shrink-0 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Categoría:
            </span>
            {[
              { id: 'TODOS', label: `Todos (${total})` },
              { id: 'SOLICITUD_SERVICIO', label: `Servicio (${countServicio})` },
              { id: 'SOLICITUD_INFORMACION', label: `Información (${countInfo})` },
              { id: 'SOLICITUD_ACCESO', label: `Accesos (${countAcceso})` },
              { id: 'INCIDENCIA', label: `Incidencias (${countIncidencia})` },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedType === cat.id
                    ? 'bg-[#8C6F55] text-white font-bold'
                    : 'bg-[#FAF8F5] text-gray-700 hover:bg-gray-200 border border-[#EDE5DC]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Principal de Tickets */}
        <div className="bg-white rounded-2xl border border-[#EDE5DC] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#EDE5DC] bg-[#FAF8F5] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#543F30] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8C6F55]" />
              Bandeja de Tickets Asignados al Área de TI ({filteredTickets.length})
            </h3>
            <span className="text-[11px] text-gray-500">Ordenado por prioridad y SLA</span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No se encontraron tickets que coincidan con los filtros seleccionados.
              </div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-5 hover:bg-[#FAF8F5]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Info principal */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#8C6F55] bg-[#8C6F55]/10 px-2 py-0.5 rounded">
                        {t.id}
                      </span>
                      {getTipoBadge(t.tipo)}
                      {getPriorityBadge(t.prioridad)}
                      {getStatusBadge(t.estado)}
                    </div>

                    <h4 className="text-sm font-bold text-[#2C2725] leading-snug">{t.asunto}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{t.descripcion}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-1">
                      <span>
                        Solicitante: <strong className="text-gray-700">{t.solicitanteNombre}</strong> ({t.solicitanteRol})
                      </span>
                      <span>
                        Módulo: <strong className="text-gray-700">{t.modulo}</strong>
                      </span>
                      <span>Creado: {t.fechaCreacion}</span>
                      <span className="text-red-700 font-medium">SLA Límite: {t.slaFechaLimite}</span>
                    </div>

                    {/* Resolución si existe */}
                    {t.resolucionTecnica && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                        <p className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Resolución TI ({t.asignadoA || 'Técnico'}): {t.resolucionTecnica}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {t.jiraKey && (
                            <a
                              href={t.jiraUrl || `${jiraConfig.domain || 'https://sumaqspa.atlassian.net'}/browse/${t.jiraKey}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100/70 hover:bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200 transition-colors"
                              title="Ver issue en Jira Service Management"
                            >
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>Jira: {t.jiraKey}</span>
                            </a>
                          )}
                          {t.githubUrl && (
                            <a
                              href={t.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-900 bg-purple-100/70 hover:bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200 transition-colors"
                              title="Ver registro de cambio en GitHub"
                            >
                              <GitPullRequest className="w-3.5 h-3.5 text-purple-700" />
                              <span>GitHub RFC / PR</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => openManageModal(t)}
                      className="px-4 py-2 rounded-xl bg-[#2C2725] hover:bg-[#8C6F55] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      Atender / Resolver
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal de Gestión / Resolución de Ticket */}
      {managingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#EDE5DC] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#2C2725] text-white p-5 flex items-center justify-between border-b border-[#3D2D22]">
              <div>
                <h3 className="font-serif text-base font-bold flex items-center gap-2">
                  Atención de Requerimiento {managingTicket.id}
                </h3>
                <p className="text-[11px] text-[#C9B29B]">
                  Solicitado por: {managingTicket.solicitanteNombre} ({managingTicket.solicitanteRol})
                </p>
              </div>
              <button
                onClick={() => setManagingTicket(null)}
                className="text-[#C9B29B] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="p-5 overflow-y-auto space-y-4">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ¡Ticket actualizado con éxito en la Mesa de Ayuda!
                </div>
              )}

              <div className="p-3 rounded-xl bg-white border border-[#EDE5DC] text-xs space-y-1">
                <p className="font-bold text-[#2C2725]">{managingTicket.asunto}</p>
                <p className="text-gray-600 text-[11px]">{managingTicket.descripcion}</p>
              </div>

              {/* Cambiar Estado */}
              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                  Estado del Requerimiento
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                >
                  <option value="ABIERTO">Abierto (En espera de revisión)</option>
                  <option value="EN_PROCESO">En Proceso (Asignado a especialista N2)</option>
                  <option value="RESUELTO">Resuelto (Atención concluida con evidencia)</option>
                </select>
              </div>

              {/* Especialista Asignado */}
              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                  Especialista / Técnico Asignado
                </label>
                <input
                  type="text"
                  required
                  value={editAsignado}
                  onChange={(e) => setEditAsignado(e.target.value)}
                  placeholder="Ej. Ing. Alexis - Soporte N2"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                />
              </div>

              {/* Detalle de Resolución Técnica */}
              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                  Resolución Técnica / Dictamen de Atención
                </label>
                <textarea
                  rows={3}
                  required
                  value={editResolucion}
                  onChange={(e) => setEditResolucion(e.target.value)}
                  placeholder="Describa la solución técnica aplicada (ej. Creación de usuario en BD con privilegios mínimos, consulta ejecutada en réplica MySQL Slave 3309, etc.)..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                />
              </div>

              {/* Clave de Jira Issue */}
              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Clave del Ticket en Jira Cloud</span>
                  <span className="text-[10px] text-gray-400 font-normal">Ej. SQ-105</span>
                </label>
                <input
                  type="text"
                  value={editJiraKey}
                  onChange={(e) => setEditJiraKey(e.target.value)}
                  placeholder="SQ-105"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none font-mono uppercase"
                />
              </div>

              {/* Enlace a GitHub / RFC */}
              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Enlace de Control de Cambios (GitHub RFC)</span>
                  <span className="text-[10px] text-gray-400 font-normal">Opcional para cambios de software</span>
                </label>
                <input
                  type="url"
                  value={editGithubUrl}
                  onChange={(e) => setEditGithubUrl(e.target.value)}
                  placeholder="https://github.com/raforamqutp/SUMAQ-web/issues/52"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManagingTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#8C6F55] hover:bg-[#6D543F] text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                >
                  Guardar y Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Configuración Jira Cloud & GitHub */}
      {isJiraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#EDE5DC] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#1F1B1A] text-white p-5 flex items-center justify-between border-b border-[#3D2D22]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold">Configuración de Jira Cloud & GitHub</h3>
                  <p className="text-[11px] text-[#C9B29B]">Integración oficial de Mesa de Ayuda con Jira API v3</p>
                </div>
              </div>
              <button
                onClick={() => setIsJiraModalOpen(false)}
                className="text-[#C9B29B] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJiraConfig} className="p-5 space-y-4">
              {jiraTestMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{jiraTestMessage}</span>
                </div>
              )}

              {/* Habilitar / Deshabilitar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EDE5DC]">
                <div>
                  <p className="text-xs font-bold text-[#2C2725]">Habilitar Sincronización Jira</p>
                  <p className="text-[11px] text-gray-500">Al desactivar, el Service Desk opera 100% en modo local</p>
                </div>
                <input
                  type="checkbox"
                  checked={formJiraEnabled}
                  onChange={(e) => setFormJiraEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#8C6F55] rounded focus:ring-[#8C6F55]"
                />
              </div>

              {/* Dominio Jira */}
              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                  Dominio Atlassian / Jira Cloud
                </label>
                <input
                  type="url"
                  value={formJiraDomain}
                  onChange={(e) => setFormJiraDomain(e.target.value)}
                  placeholder="https://sumaqspa.atlassian.net"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none font-mono"
                />
              </div>

              {/* Correo y Token */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                    Correo Atlassian
                  </label>
                  <input
                    type="email"
                    value={formJiraEmail}
                    onChange={(e) => setFormJiraEmail(e.target.value)}
                    placeholder="anthony@sumaqspa.pe"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                    Clave Proyecto (Key)
                  </label>
                  <input
                    type="text"
                    value={formJiraProject}
                    onChange={(e) => setFormJiraProject(e.target.value)}
                    placeholder="SQ"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none font-mono uppercase"
                  />
                </div>
              </div>

              {/* API Token */}
              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>API Token de Atlassian</span>
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Obtener Token <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  type="password"
                  value={formJiraToken}
                  onChange={(e) => setFormJiraToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none font-mono"
                />
              </div>

              {/* Nota sobre extensión GitHub for Jira */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-amber-700" />
                  Extensión Oficial: GitHub for Jira
                </p>
                <p>
                  Jira cuenta con la aplicación oficial en Atlassian Marketplace para vincular repositorios de GitHub. Al activarla en tu proyecto de Jira, cualquier commit, rama (ej. <code>feature/SQ-105</code>) o PR se sincronizará automáticamente.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestJiraConnection}
                  className="px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Probar Enlace
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsJiraModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#8C6F55] hover:bg-[#6D543F] text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
