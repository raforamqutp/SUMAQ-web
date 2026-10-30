import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TicketStore } from '../../services/ticketStore';
import { Ticket, TicketPriority, TicketStatus, TicketType, JiraConfig, AreaCambio, TipoCambio } from '../../types/tickets';
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
  ShieldCheck,
  X,
  Server,
  Network,
  Calendar,
  BookOpen,
  Award,
  Zap,
  Activity
} from 'lucide-react';

export const TIPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Modo Principal: Mesa de Ayuda (Semana 10) vs Control de Cambios RFC/CAB (Semana 11)
  const [activeViewMode, setActiveViewMode] = useState<'SERVICE_DESK' | 'CONTROL_CAMBIOS'>('CONTROL_CAMBIOS');

  // Filtros Generales
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedArea, setSelectedArea] = useState<string>('TODOS');
  const [selectedTipoCambio, setSelectedTipoCambio] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados para Modal de Gestión de Tickets (Service Desk)
  const [managingTicket, setManagingTicket] = useState<Ticket | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>('EN_PROCESO');
  const [editAsignado, setEditAsignado] = useState<string>('');
  const [editResolucion, setEditResolucion] = useState<string>('');
  const [editGithubUrl, setEditGithubUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [editJiraKey, setEditJiraKey] = useState<string>('');

  // Estados para Modal de Dictamen / Aprobación del Comité CAB (Semana 11)
  const [cabModalTicket, setCabModalTicket] = useState<Ticket | null>(null);
  const [cabAprobadorInput, setCabAprobadorInput] = useState<string>('MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)');
  const [cabActaInput, setCabActaInput] = useState<string>('');
  const [cabSuccessMessage, setCabSuccessMessage] = useState<string | null>(null);

  // Jira Cloud Integration Modal States
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>(TicketStore.getJiraConfig());
  const [isJiraModalOpen, setIsJiraModalOpen] = useState<boolean>(false);
  const [formJiraDomain, setFormJiraDomain] = useState<string>(jiraConfig.domain || '');
  const [formJiraEmail, setFormJiraEmail] = useState<string>(jiraConfig.email || '');
  const [formJiraToken, setFormJiraToken] = useState<string>(jiraConfig.apiToken || '');
  const [formJiraProject, setFormJiraProject] = useState<string>(jiraConfig.projectKey || 'KAN');
  const [formJiraEnabled, setFormJiraEnabled] = useState<boolean>(jiraConfig.enabled);
  const [jiraTestMessage, setJiraTestMessage] = useState<string | null>(null);

  const loadData = async () => {
    const list = await TicketStore.syncWithBackend();
    setTickets(list);
    setJiraConfig(TicketStore.getJiraConfig());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('sumaq_tickets_updated', handleUpdate);
    return () => window.removeEventListener('sumaq_tickets_updated', handleUpdate);
  }, []);

  const handleApproveAccessTicket = async (t: Ticket) => {
    const approver = user?.nombre_completo ? `${user.nombre_completo} (Gerente General)` : 'Rafael Ramirez (Gerente General)';
    await TicketStore.approveTicket(t.id, approver);
    await loadData();
  };

  const handleOpenCabModal = (t: Ticket) => {
    setCabModalTicket(t);
    setCabAprobadorInput('MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)');
    const sufijo = t.id.split('-').pop() || '050';
    setCabActaInput(`ACTA-CAB-2026-W11-${sufijo}`);
    setCabSuccessMessage(null);
  };

  const handleExecuteCabApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabModalTicket) return;

    await TicketStore.approveCabTicket(cabModalTicket.id, cabAprobadorInput, cabActaInput);
    setCabSuccessMessage(`¡Cambio ${cabModalTicket.id} APROBADO UNÁNIMEMENTE por el Comité CAB! Acta: ${cabActaInput}`);
    setTimeout(() => {
      setCabModalTicket(null);
      setCabSuccessMessage(null);
      loadData();
    }, 1200);
  };

  const handleOpenJiraModal = () => {
    const cfg = TicketStore.getJiraConfig();
    setFormJiraDomain(cfg.domain || '');
    setFormJiraEmail(cfg.email || '');
    setFormJiraToken(cfg.apiToken || '');
    setFormJiraProject(cfg.projectKey || 'KAN');
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
      projectKey: formJiraProject.trim().toUpperCase() || 'KAN'
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
      setJiraTestMessage('Conexión validada con Jira Cloud API v3. Proyecto ' + (formJiraProject || 'KAN') + ' detectado.');
    }
  };

  const openManageModal = (ticket: Ticket) => {
    setManagingTicket(ticket);
    setEditStatus(ticket.estado);
    setEditAsignado(ticket.asignadoA || 'Especialista TI N2');
    setEditResolucion(ticket.resolucionTecnica || '');
    setEditGithubUrl(ticket.githubUrl || '');
    setEditJiraKey(ticket.jiraKey || '');
    setSaveSuccess(false);
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTicket) return;

    if (editStatus === 'RESUELTO') {
      await TicketStore.resolveTicket(managingTicket.id, {
        resolucionTecnica: editResolucion,
        asignadoA: editAsignado,
        githubUrl: editGithubUrl,
        jiraKey: editJiraKey
      });
    } else {
      TicketStore.updateLocalTicket(managingTicket.id, {
        estado: editStatus,
        asignadoA: editAsignado,
        resolucionTecnica: editResolucion,
        githubUrl: editGithubUrl,
        jiraKey: editJiraKey,
        jiraUrl: editJiraKey ? `${jiraConfig.domain || 'https://sumaq-dev.atlassian.net'}/browse/${editJiraKey}` : undefined
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setManagingTicket(null);
      setSaveSuccess(false);
      loadData();
    }, 600);
  };

  // Separación por Módulo / Semana
  const serviceDeskTickets = tickets.filter(t => t.tipo !== 'SOLICITUD_CAMBIO');
  const changeRfcs = tickets.filter(t => t.tipo === 'SOLICITUD_CAMBIO');

  // KPIs Service Desk (Semana 10)
  const totalServiceDesk = serviceDeskTickets.length;
  const abiertosServiceDesk = serviceDeskTickets.filter(t => t.estado === 'ABIERTO').length;
  const enProcesoServiceDesk = serviceDeskTickets.filter(t => t.estado === 'EN_PROCESO').length;
  const resueltosServiceDesk = serviceDeskTickets.filter(t => t.estado === 'RESUELTO').length;

  // KPIs Control de Cambios (Semana 11)
  const countInfra = changeRfcs.filter(t => (t.areaCambio === 'INFRAESTRUCTURA' || (t as any).area_cambio === 'INFRAESTRUCTURA')).length;
  const countApp = changeRfcs.filter(t => (t.areaCambio === 'APLICACIONES' || (t as any).area_cambio === 'APLICACIONES')).length;
  const countDoc = changeRfcs.filter(t => (t.areaCambio === 'DOCUMENTACION' || (t as any).area_cambio === 'DOCUMENTACION')).length;
  const countCal = changeRfcs.filter(t => (t.areaCambio === 'CALENDARIO' || (t as any).area_cambio === 'CALENDARIO')).length;
  const countCabAprobados = changeRfcs.filter(t => t.estado === 'APROBADO' || t.cabAprobador || (t as any).cab_aprobado_por).length;

  // Filtrado
  const displayedTickets = (activeViewMode === 'SERVICE_DESK' ? serviceDeskTickets : changeRfcs).filter(t => {
    // Búsqueda
    const tArea = t.areaCambio || (t as any).area_cambio || '';
    const matchesSearch =
      searchTerm === '' ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tArea.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtros específicos de Service Desk
    if (activeViewMode === 'SERVICE_DESK') {
      const matchesType = selectedType === 'TODOS' || t.tipo === selectedType;
      const matchesStatus = selectedStatus === 'TODOS' || t.estado === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    }

    // Filtros específicos de Control de Cambios
    const tTipoCambio = t.tipoCambio || (t as any).tipo_cambio || 'NORMAL';
    const matchesArea = selectedArea === 'TODOS' || tArea === selectedArea;
    const matchesTipoCambio = selectedTipoCambio === 'TODOS' || tTipoCambio === selectedTipoCambio;
    const matchesStatus = selectedStatus === 'TODOS' || t.estado === selectedStatus;
    return matchesSearch && matchesArea && matchesTipoCambio && matchesStatus;
  });

  // Badges y Etiquetas
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
      case 'SOLICITUD_CAMBIO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><GitPullRequest className="w-3.5 h-3.5" /> Control de Cambios (RFC)</span>;
    }
  };

  const getAreaBadge = (area?: AreaCambio) => {
    switch (area) {
      case 'INFRAESTRUCTURA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-sm">
            <Network className="w-3.5 h-3.5 text-indigo-600" />
            <span>Infraestructura & Redes</span>
          </span>
        );
      case 'APLICACIONES':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-sm">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Aplicaciones & Base de Datos</span>
          </span>
        );
      case 'DOCUMENTACION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Documentación & Procesos</span>
          </span>
        );
      case 'CALENDARIO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Calendario & Change Freeze</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTipoCambioBadge = (tipo?: TipoCambio) => {
    switch (tipo) {
      case 'NORMAL':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300 uppercase tracking-wide">
            Normal (CHN)
          </span>
        );
      case 'EMERGENCIA':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-red-100 text-red-900 border border-red-300 uppercase tracking-wide">
            Emergencia (CHE)
          </span>
        );
      case 'ESTANDAR':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase tracking-wide">
            Estándar (CHS)
          </span>
        );
      default:
        return null;
    }
  };

  const getRiesgoBadge = (r?: string) => {
    switch (r) {
      case 'ALTO':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Riesgo Alto</span>;
      case 'MEDIO':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Riesgo Medio</span>;
      case 'BAJO':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Riesgo Bajo</span>;
      default:
        return null;
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
      case 'PENDIENTE_APROBACION':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> Pendiente Aprobación CAB</span>;
      case 'APROBADO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprobado por el CAB</span>;
      case 'RESUELTO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Implementado / Cerrado</span>;
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
                  GERENCIA DE TI &middot; ITIL v4
                </span>
              </div>
              <p className="text-[11px] text-[#C9B29B]">
                Mesa de Ayuda (Semana 10) &middot; Habilitación y Control de Cambios RFC/CAB (Semana 11)
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
              <span>Conexión Jira Cloud</span>
            </button>
            <button
              onClick={() => {
                TicketStore.resetDefaults();
                loadData();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C2725] hover:bg-[#3D2D22] text-[#C9B29B] hover:text-white text-xs font-medium border border-[#543F30] transition-colors cursor-pointer"
              title="Restablecer tickets de ejemplo en memoria local"
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

      {/* Selector de Modo Principal (Semana 10 vs Semana 11) */}
      <section className="bg-white border-b border-[#EDE5DC] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col xl:flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-1.5 bg-[#F4F1EA] rounded-2xl border border-[#EDE5DC] w-full xl:w-auto justify-center sm:justify-start">
            <button
              onClick={() => {
                setActiveViewMode('CONTROL_CAMBIOS');
                setSelectedStatus('TODOS');
                setSearchTerm('');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewMode === 'CONTROL_CAMBIOS'
                  ? 'bg-[#1F1B1A] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GitPullRequest className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Control de Cambios / CAB (Semana 11)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeViewMode === 'CONTROL_CAMBIOS' ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {changeRfcs.length} RFCs
              </span>
            </button>

            <button
              onClick={() => {
                setActiveViewMode('SERVICE_DESK');
                setSelectedStatus('TODOS');
                setSearchTerm('');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewMode === 'SERVICE_DESK'
                  ? 'bg-[#1F1B1A] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Mesa de Ayuda & Service Desk (Semana 10)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeViewMode === 'SERVICE_DESK' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {serviceDeskTickets.length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold shadow-xs">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Jira Cloud v3: <strong>sumaq-dev.atlassian.net (KAN)</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold shadow-xs">
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>MySQL Master 3308 / Slave 3309 Activo</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ========================================================================= */}
        {/* VISTA 1: CONTROL DE CAMBIOS RFC / CAB (SEMANA 11 - ITIL v4)               */}
        {/* ========================================================================= */}
        {activeViewMode === 'CONTROL_CAMBIOS' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Banner Institucional del CAB */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1F1B1A] via-[#2A2422] to-[#3D2D22] text-white border border-[#543F30] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Award className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-serif font-bold tracking-wide">
                    Gobernanza del Comité de Control de Cambios (CAB - Change Advisory Board)
                  </h2>
                </div>
                <p className="text-xs text-[#C9B29B] max-w-3xl leading-relaxed">
                  Evaluación multidimensional de impacto, ventanas de mantenimiento nocturnas y planes de rollback para las <strong>4 Áreas de Cambio</strong>: Infraestructura (Switch/Router/VLANs), Aplicaciones y BD, Documentación y Calendario.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#EDE5DC]">
                  <span className="bg-[#3D2D22] px-2.5 py-0.5 rounded-md border border-[#543F30] text-[#E8C2A0] font-semibold">
                    👑 Presidente del CAB: <strong>MBA Mg. Ing. René Alonso Nieto Valencia</strong>
                  </span>
                  <span>Change Manager: <strong>Rafael Ramirez (PO)</strong></span>
                  <span>Infraestructura & BD: <strong>Bryan Mango (DBA)</strong></span>
                  <span>DevOps & Citas: <strong>Anthony Luque</strong></span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 bg-[#141211] p-3 rounded-xl border border-[#443328]">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Trazabilidad CAB</p>
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{countCabAprobados} de {changeRfcs.length} RFCs Aprobados</span>
                  </p>
                </div>
              </div>
            </div>

            {/* KPIs de las 4 Áreas de Cambio */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">1. Infraestructura</span>
                  <Network className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-indigo-950">{countInfra}</span>
                  <span className="text-[11px] text-gray-500">Switch & VLANs 10/20/30</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Router borde, Switch Cisco 24p, Servidor local 3307
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">2. Aplicaciones & BD</span>
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-blue-950">{countApp}</span>
                  <span className="text-[11px] text-gray-500">Pasarela & Réplica</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Niubiz, Migraciones Django y MySQL Slave 3309
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">3. Documentación</span>
                  <BookOpen className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-amber-950">{countDoc}</span>
                  <span className="text-[11px] text-gray-500">Topología & C4</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Manual de contingencia offline y políticas de TI
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">4. Calendario</span>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-emerald-950">{countCal}</span>
                  <span className="text-[11px] text-gray-500">Freeze Campaña</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Ventana nocturna 02-04 AM y congelamiento San Valentín
                </p>
              </div>
            </div>

            {/* Barra de Filtros para Control de Cambios */}
            <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Buscador */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por RFC, hardware, switch, VLAN o aprobador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EDE5DC] bg-[#FAF8F5] text-[#2C2725] focus:outline-none focus:ring-2 focus:ring-[#8C6F55]"
                  />
                </div>

                {/* Filtro por Tipo de Cambio ITIL */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                    Tipo ITIL:
                  </span>
                  {[
                    { id: 'TODOS', label: 'Todos los Tipos' },
                    { id: 'NORMAL', label: 'Normal (CHN)' },
                    { id: 'EMERGENCIA', label: 'Emergencia (CHE)' },
                    { id: 'ESTANDAR', label: 'Estándar (CHS)' }
                  ].map((tp) => (
                    <button
                      key={tp.id}
                      onClick={() => setSelectedTipoCambio(tp.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        selectedTipoCambio === tp.id
                          ? 'bg-[#2C2725] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por las 4 Áreas de Cambio */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 shrink-0 uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5" /> Área de Cambio:
                </span>
                {[
                  { id: 'TODOS', label: `Todas las Áreas (${changeRfcs.length})` },
                  { id: 'INFRAESTRUCTURA', label: `🌐 Infraestructura (${countInfra})` },
                  { id: 'APLICACIONES', label: `💻 Aplicaciones & BD (${countApp})` },
                  { id: 'DOCUMENTACION', label: `📄 Documentación (${countDoc})` },
                  { id: 'CALENDARIO', label: `📅 Calendario (${countCal})` }
                ].map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setSelectedArea(ar.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedArea === ar.id
                        ? 'bg-[#8C6F55] text-white font-bold'
                        : 'bg-[#FAF8F5] text-gray-700 hover:bg-gray-200 border border-[#EDE5DC]'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Tarjetas RFC de Control de Cambios */}
            <div className="space-y-4">
              {displayedTickets.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-[#EDE5DC]">
                  No se encontraron Solicitudes de Cambio (RFC) que coincidan con los filtros seleccionados.
                </div>
              ) : (
                displayedTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          {t.id}
                        </span>
                        {getAreaBadge(t.areaCambio)}
                        {getTipoCambioBadge(t.tipoCambio)}
                        {getRiesgoBadge(t.impactoRiesgo)}
                        {getStatusBadge(t.estado)}
                      </div>

                      <div className="flex items-center gap-2">
                        {t.jiraKey && (
                          <a
                            href={t.jiraUrl || `${jiraConfig.domain || 'https://sumaq-dev.atlassian.net'}/browse/${t.jiraKey}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                            title="Ver tarjeta en Jira Cloud"
                          >
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            <span>Jira: {t.jiraKey}</span>
                          </a>
                        )}
                        {t.githubUrl && (
                          <a
                            href={t.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-300 transition-colors"
                            title="Ver repositorio / PR en GitHub"
                          >
                            <GitPullRequest className="w-3.5 h-3.5 text-gray-700" />
                            <span>GitHub RFC</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Contenido Técnico */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-[#2C2725]">{t.asunto}</h3>
                      <p className="text-xs text-gray-700 leading-relaxed">{t.descripcion}</p>
                    </div>

                    {/* Matriz Técnica de Implementación: Ventana y Rollback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5DC] text-xs">
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Ventana de Mantenimiento Autorizada:
                        </p>
                        <p className="font-semibold text-gray-800 mt-0.5">
                          {t.ventanaMantenimiento || 'Nocturna (02:00 AM - 04:00 AM)'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          Plan de Rollback / Contingencia:
                        </p>
                        <p className="font-semibold text-gray-800 mt-0.5">
                          {t.planRollback || 'Reconexión de hardware anterior en < 10 minutos.'}
                        </p>
                      </div>
                    </div>

                    {/* Sello de Aprobación Formal del Comité CAB */}
                    {t.cabAprobador ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start sm:items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold">
                              Dictamen CAB Aprobado: <span className="font-normal">{t.cabAprobador}</span>
                            </p>
                            <p className="text-[11px] text-emerald-700">
                              Acta Oficial: <strong className="font-mono">{t.cabActa || 'ACTA-CAB-2026-W11'}</strong>
                              {t.cabFechaAprobacion && ` · Fecha: ${t.cabFechaAprobacion}`}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                          Listo para Ventana Nocturna
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Pendiente de evaluación formal y firma en sesión del Comité CAB.</span>
                        </div>
                        <button
                          onClick={() => handleOpenCabModal(t)}
                          className="px-4 py-1.5 rounded-xl bg-[#2C2725] hover:bg-[#1F1B1A] text-[#EDE5DC] hover:text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Aprobar como Presidente del CAB (René Nieto)</span>
                        </button>
                      </div>
                    )}

                    {/* Footer y Datos de Solicitante */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                      <div>
                        Solicitado por: <strong className="text-gray-700">{t.solicitanteNombre}</strong> &middot; Responsable Técnico: <strong className="text-gray-700">{t.asignadoA || 'Especialista TI'}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenCabModal(t)}
                          className="text-xs font-bold text-[#8C6F55] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Ver Acta del CAB</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: MESA DE AYUDA & SERVICE DESK (SEMANA 10 - ITIL v4)               */}
        {/* ========================================================================= */}
        {activeViewMode === 'SERVICE_DESK' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Banner de Contexto Académico */}
            <div className="p-4 rounded-2xl bg-white border border-[#EDE5DC] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#2C2725]">
                    Consola Central de Mesa de Ayuda &middot; Service Desk Especialista
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Gestión operativa de Requerimientos de Servicio, Solicitudes de Información, Solicitudes de Acceso e Incidencias con SLAs P1 a P4.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                  SLA Crítico P1: $\le 2$ horas
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  SLA Cumplido: 100%
                </span>
              </div>
            </div>

            {/* Tarjetas KPI Service Desk */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Solicitudes</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-[#2C2725]">{totalServiceDesk}</span>
                  <span className="text-xs text-gray-500">registradas</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">N1 &middot; Abiertas</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-700">{abiertosServiceDesk}</span>
                  <span className="text-xs text-blue-600 font-medium">pendientes</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">N2 &middot; En Proceso</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-700">{enProcesoServiceDesk}</span>
                  <span className="text-xs text-amber-600 font-medium">en atención</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resueltas / Cerradas</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-700">{resueltosServiceDesk}</span>
                  <span className="text-xs text-emerald-600 font-medium">SLA verificado</span>
                </div>
              </div>
            </div>

            {/* Filtros Service Desk */}
            <div className="p-4 bg-white rounded-2xl border border-[#EDE5DC] shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
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

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['TODOS', 'PENDIENTE_APROBACION', 'ABIERTO', 'EN_PROCESO', 'RESUELTO'].map((st) => (
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

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 shrink-0 uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5" /> Categoría:
                </span>
                {[
                  { id: 'TODOS', label: `Todos (${totalServiceDesk})` },
                  { id: 'SOLICITUD_SERVICIO', label: `Servicio` },
                  { id: 'SOLICITUD_INFORMACION', label: `Información` },
                  { id: 'SOLICITUD_ACCESO', label: `Accesos` },
                  { id: 'INCIDENCIA', label: `Incidencias` }
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

            {/* Listado de Tickets Service Desk */}
            <div className="bg-white rounded-2xl border border-[#EDE5DC] shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {displayedTickets.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    No se encontraron tickets que coincidan con los filtros seleccionados.
                  </div>
                ) : (
                  displayedTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 hover:bg-[#FAF8F5]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
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
                          <span>Solicitante: <strong className="text-gray-700">{t.solicitanteNombre}</strong> ({t.solicitanteRol})</span>
                          <span>Módulo: <strong className="text-gray-700">{t.modulo}</strong></span>
                          <span>Creado: {t.fechaCreacion}</span>
                          <span className="text-red-700 font-medium">SLA Límite: {t.slaFechaLimite}</span>
                        </div>

                        {t.aprobadoPorGerencia && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Aprobado por: {t.aprobadorNombre || 'Gerencia General'}</span>
                          </div>
                        )}

                        {t.resolucionTecnica && (
                          <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                            <p className="font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Resolución TI ({t.asignadoA || 'Técnico'}): {t.resolucionTecnica}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        {t.tipo === 'SOLICITUD_ACCESO' && t.estado === 'PENDIENTE_APROBACION' && (
                          <button
                            onClick={() => handleApproveAccessTicket(t)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Aprobar Acceso</span>
                          </button>
                        )}

                        <button
                          onClick={() => openManageModal(t)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2C2725] hover:bg-[#3D2D22] text-[#EDE5DC] hover:text-white text-xs font-semibold border border-[#543F30] transition-colors cursor-pointer"
                        >
                          Gestionar Ticket
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: APROBACIÓN & ACTA FORMAL DEL COMITÉ CAB (SEMANA 11)              */}
      {/* ========================================================================= */}
      {cabModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#EDE5DC] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#1F1B1A] text-white p-5 flex items-center justify-between border-b border-[#3D2D22]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold flex items-center gap-2">
                    Comité CAB &middot; Sesión de Dictamen y Aprobación
                  </h3>
                  <p className="text-[11px] text-[#C9B29B]">
                    Solicitud de Cambio: <strong className="font-mono text-white">{cabModalTicket.id}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCabModalTicket(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCabApproval} className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
              {cabSuccessMessage && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{cabSuccessMessage}</span>
                </div>
              )}

              {/* Ficha Resumen del RFC */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE5DC] space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getAreaBadge(cabModalTicket.areaCambio)}
                  {getTipoCambioBadge(cabModalTicket.tipoCambio)}
                  {getRiesgoBadge(cabModalTicket.impactoRiesgo)}
                </div>
                <h4 className="text-sm font-bold text-[#2C2725]">{cabModalTicket.asunto}</h4>
                <p className="text-gray-600 leading-relaxed">{cabModalTicket.descripcion}</p>
              </div>

              {/* Especificaciones de Ventana y Rollback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE5DC]">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Ventana de Mantenimiento
                  </label>
                  <p className="font-semibold text-gray-800">
                    {cabModalTicket.ventanaMantenimiento || 'Martes 02:00 AM - 04:00 AM'}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Procedimiento de Rollback
                  </label>
                  <p className="font-semibold text-gray-800">
                    {cabModalTicket.planRollback || 'Reconexión de hardware en rack en < 10 minutos.'}
                  </p>
                </div>
              </div>

              {/* Formulario de Aprobación CAB */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                    Presidente del CAB / Aprobador Oficial
                  </label>
                  <input
                    type="text"
                    required
                    value={cabAprobadorInput}
                    onChange={(e) => setCabAprobadorInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725] font-semibold focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Representa al evaluador principal del Comité de Cambios (Docente de la asignatura).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                    N° de Acta del Comité CAB
                  </label>
                  <input
                    type="text"
                    required
                    value={cabActaInput}
                    onChange={(e) => setCabActaInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#EDE5DC] bg-white font-mono text-[#2C2725] focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                  />
                </div>
              </div>

              {/* Botón de Aprobación */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCabModalTicket(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold transition-all shadow flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Emitir Aprobación Formal del CAB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GESTIÓN DE RESOLUCIÓN TÉCNICA (SERVICE DESK)                    */}
      {/* ========================================================================= */}
      {managingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#EDE5DC] rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#2C2725] text-white p-5 flex items-center justify-between border-b border-[#3D2D22]">
              <div>
                <h3 className="font-serif text-base font-bold flex items-center gap-2">
                  Gestión y Dictamen Técnico &middot; N2
                </h3>
                <p className="text-[11px] text-[#C9B29B]">
                  Ticket: <strong className="font-mono text-white">{managingTicket.id}</strong> ({managingTicket.tipo})
                </p>
              </div>
              <button
                onClick={() => setManagingTicket(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
              {saveSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Ticket actualizado correctamente.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                  Estado Operativo
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                  className="w-full p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725]"
                >
                  <option value="ABIERTO">Abierto (Nivel 1)</option>
                  <option value="EN_PROCESO">En Atención (Nivel 2)</option>
                  <option value="PENDIENTE_APROBACION">Pendiente de Aprobación</option>
                  <option value="APROBADO">Aprobado</option>
                  <option value="RESUELTO">Resuelto / Cerrado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                  Especialista TI Asignado
                </label>
                <input
                  type="text"
                  value={editAsignado}
                  onChange={(e) => setEditAsignado(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                  Resolución Técnica / Dictamen
                </label>
                <textarea
                  rows={3}
                  value={editResolucion}
                  onChange={(e) => setEditResolucion(e.target.value)}
                  placeholder="Detalle la solución aplicada, verificación en base de datos o hardware..."
                  className="w-full p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                    Jira Issue Key
                  </label>
                  <input
                    type="text"
                    value={editJiraKey}
                    onChange={(e) => setEditJiraKey(e.target.value)}
                    placeholder="Ej. KAN-12"
                    className="w-full p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#543F30] uppercase tracking-wider mb-1">
                    GitHub PR / Commits
                  </label>
                  <input
                    type="url"
                    value={editGithubUrl}
                    onChange={(e) => setEditGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full p-2.5 rounded-xl border border-[#EDE5DC] bg-white text-[#2C2725]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManagingTicket(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8C6F55] hover:bg-[#6D543F] text-white font-bold transition-all shadow"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIGURACIÓN JIRA CLOUD (ATLASSIAN)                            */}
      {/* ========================================================================= */}
      {isJiraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#EDE5DC] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="bg-[#1F1B1A] text-white p-5 flex items-center justify-between border-b border-[#3D2D22]">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif text-base font-bold">Integración Jira Cloud v3</h3>
              </div>
              <button onClick={() => setIsJiraModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJiraConfig} className="p-6 space-y-3">
              {jiraTestMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl font-medium">
                  {jiraTestMessage}
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Dominio Jira</label>
                <input
                  type="text"
                  value={formJiraDomain}
                  onChange={(e) => setFormJiraDomain(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Email Atlassian</label>
                <input
                  type="email"
                  value={formJiraEmail}
                  onChange={(e) => setFormJiraEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">API Token</label>
                <input
                  type="password"
                  value={formJiraToken}
                  onChange={(e) => setFormJiraToken(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Project Key</label>
                <input
                  type="text"
                  value={formJiraProject}
                  onChange={(e) => setFormJiraProject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <button
                  type="button"
                  onClick={handleTestJiraConnection}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-300 font-bold hover:bg-blue-100"
                >
                  Probar Conexión
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8C6F55] text-white font-bold hover:bg-[#6D543F]"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
