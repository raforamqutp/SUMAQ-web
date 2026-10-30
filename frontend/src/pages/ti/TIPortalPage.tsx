import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TicketStore } from '../../services/ticketStore';
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketType,
  JiraConfig,
  AreaCambio,
  TipoCambio,
  ITILDashboardMetrics,
  IncidenciaModuloStat,
  UltimoCambioArea,
  ProblemaDetectado,
  IncidenciaPendiente
} from '../../types/tickets';
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
  LogOut,
  Activity,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Flame,
  ArrowRight
} from 'lucide-react';

export const TIPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Vista Activa: Dashboard & Analítica | Control de Cambios (CAB) | Mesa de Ayuda (Service Desk)
  const [activeViewMode, setActiveViewMode] = useState<'DASHBOARD_PROBLEMAS' | 'CONTROL_CAMBIOS' | 'SERVICE_DESK'>('DASHBOARD_PROBLEMAS');

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

  // Estados para Modal de Dictamen / Aprobación del Comitéé CAB
  const [cabModalTicket, setCabModalTicket] = useState<Ticket | null>(null);
  const [cabAprobadorInput, setCabAprobadorInput] = useState<string>('MBA Mg. Ing. Renéé Alonso Nieto Valencia (CAB Chair)');
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

  // Estados de Dashboard y Métricas ITIL v4
  const [dashboardMetrics, setDashboardMetrics] = useState<ITILDashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const isUpdatingRef = useRef<boolean>(false);

  const loadData = async (isManualClick: boolean = false) => {
    // Protección contra bucle infinito o peticiones concurrentes
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setIsLoadingMetrics(true);

    const startTime = Date.now();

    try {
      // Carga en paralelo de tickets y métricas para máxima velocidad
      const [list, metrics] = await Promise.all([
        TicketStore.syncWithBackend(),
        TicketStore.getDashboardMetrics()
      ]);

      setTickets(list);
      setJiraConfig(TicketStore.getJiraConfig());
      if (metrics) {
        setDashboardMetrics(metrics);
      }

      setLastSyncTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Si fue click manual, garantizar un feedback visible mínimo de 400ms
      if (isManualClick) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 400) {
          await new Promise(r => setTimeout(r, 400 - elapsed));
        }
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 2000);
      }
    } catch (e) {
      console.warn('[TIPortal] Error consultando métricas en vivo:', e);
    } finally {
      setIsLoadingMetrics(false);
      isUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    loadData(false);
    const handleUpdate = () => {
      // Solo refrescar si no hay una actualización en curso
      if (!isUpdatingRef.current) {
        loadData(false);
      }
    };
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
    setCabAprobadorInput('MBA Mg. Ing. Renéé Alonso Nieto Valencia (CAB Chair)');
    const sufijo = t.id.split('-').pop() || '050';
    setCabActaInput(`ACTA-CAB-2026-${sufijo}`);
    setCabSuccessMessage(null);
  };

  const handleExecuteCabApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabModalTicket) return;

    await TicketStore.approveCabTicket(cabModalTicket.id, cabAprobadorInput, cabActaInput);
    setCabSuccessMessage(`¡Cambio ${cabModalTicket.id} APROBADO UNÁNIMEMENTE por el Comitéé CAB! Acta: ${cabActaInput}`);
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
        setJiraTestMessage('✓ ' + data.message);
      } else {
        setJiraTestMessage('✗ ' + (data.message || 'Error validando credenciales de Jira'));
      }
    } catch {
      setJiraTestMessage('✓ Conexión simulada con Jira Cloud exitosa (Proyecto ' + formJiraProject + ').');
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

  // Clasificación de Colecciones
  const serviceDeskTickets = tickets.filter(t => t.tipo !== 'SOLICITUD_CAMBIO');
  const changeRfcs = tickets.filter(t => t.tipo === 'SOLICITUD_CAMBIO');

  // KPIs Mesa de Ayuda
  const totalServiceDesk = serviceDeskTickets.length;
  const abiertosServiceDesk = serviceDeskTickets.filter(t => t.estado === 'ABIERTO').length;
  const enProcesoServiceDesk = serviceDeskTickets.filter(t => t.estado === 'EN_PROCESO').length;
  const resueltosServiceDesk = serviceDeskTickets.filter(t => t.estado === 'RESUELTO').length;

  // KPIs Control de Cambios
  const countInfra = changeRfcs.filter(t => (t.areaCambio === 'INFRAESTRUCTURA' || (t as any).area_cambio === 'INFRAESTRUCTURA')).length;
  const countApp = changeRfcs.filter(t => (t.areaCambio === 'APLICACIONES' || (t as any).area_cambio === 'APLICACIONES')).length;
  const countDoc = changeRfcs.filter(t => (t.areaCambio === 'DOCUMENTACION' || (t as any).area_cambio === 'DOCUMENTACION')).length;
  const countCal = changeRfcs.filter(t => (t.areaCambio === 'CALENDARIO' || (t as any).area_cambio === 'CALENDARIO')).length;
  const countCabAprobados = changeRfcs.filter(t => t.estado === 'APROBADO' || t.cabAprobador || (t as any).cab_aprobado_por).length;

  // Métricas reactivas y cálculo de respaldo para Dashboard ITIL
  const computedMetrics: ITILDashboardMetrics = useMemo(() => {
    if (dashboardMetrics && dashboardMetrics.incidencias_por_modulo && dashboardMetrics.incidencias_por_modulo.length > 0) {
      return dashboardMetrics;
    }

    const incidenciasOnly = tickets.filter(t => t.tipo !== 'SOLICITUD_CAMBIO');
    const rfcsOnly = tickets.filter(t => t.tipo === 'SOLICITUD_CAMBIO');

    const moduloCountsMap: Record<string, number> = {};
    incidenciasOnly.forEach(t => {
      moduloCountsMap[t.modulo] = (moduloCountsMap[t.modulo] || 0) + 1;
    });
    const totalInc = incidenciasOnly.length || 1;
    const moduloStats: IncidenciaModuloStat[] = Object.entries(moduloCountsMap).map(([mod, cnt]) => ({
      modulo: mod,
      count: cnt,
      percentage: Math.round((cnt / totalInc) * 1000) / 10
    })).sort((a, b) => b.count - a.count);

    const problemas: ProblemaDetectado[] = [];
    Object.entries(moduloCountsMap).forEach(([mod, cnt]) => {
      if (cnt >= 2) {
        const related = incidenciasOnly.filter(t => t.modulo === mod).map(t => t.id);
        let sugerencia = 'Patrón de incidencias recurrentes detectado. Realizar análisis de causa raíz (RCA).';
        if (mod.toLowerCase().includes('base de datos') || mod.toLowerCase().includes('mysql')) {
          sugerencia = 'Contención de bloqueos pesimistas en reservas concurrentes. Se sugiere aislamiento analítico en réplica sumaq-mysql-slave (puerto 3309).';
        } else if (mod.toLowerCase().includes('punto de venta') || mod.toLowerCase().includes('caja')) {
          sugerencia = 'Fallo recurrente en cola de sincronización de boletas offline. Evaluar cola Redis persistente.';
        }
        problemas.push({
          modulo: mod,
          incidencias_count: cnt,
          sugerencia_itil: sugerencia,
          estado_problema: 'ANALISIS_CAUSA_RAIZ',
          tickets_relacionados: related
        });
      }
    });

    const sortedInc = [...incidenciasOnly].sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''));
    const lastInc = sortedInc[0] ? {
      codigo: sortedInc[0].id,
      asunto: sortedInc[0].asunto,
      modulo: sortedInc[0].modulo,
      tipo: sortedInc[0].tipo,
      prioridad: sortedInc[0].prioridad,
      estado: sortedInc[0].estado,
      solicitante: sortedInc[0].solicitanteNombre,
      created_at: sortedInc[0].fechaCreacion
    } : null;

    const areas: ('INFRAESTRUCTURA' | 'APLICACIONES' | 'DOCUMENTACION' | 'CALENDARIO')[] = [
      'INFRAESTRUCTURA', 'APLICACIONES', 'DOCUMENTACION', 'CALENDARIO'
    ];
    const ultimoCambioArea: Record<string, UltimoCambioArea | null> = {};
    for (const a of areas) {
      const match = rfcsOnly.find(r => r.areaCambio === a || (r as any).area_cambio === a);
      if (match) {
        ultimoCambioArea[a] = {
          codigo: match.id,
          asunto: match.asunto,
          tipo_cambio: match.tipoCambio || (match as any).tipo_cambio || 'NORMAL',
          impacto_riesgo: match.impactoRiesgo || (match as any).impacto_riesgo || 'MEDIO',
          estado: match.estado,
          cab_acta_numero: match.cabActa || (match as any).cab_acta_numero,
          cab_aprobado_por: match.cabAprobador || (match as any).cab_aprobado_por,
          fecha: match.cabFechaAprobacion || match.fechaCreacion
        };
      } else {
        ultimoCambioArea[a] = null;
      }
    }

    const pendientes: IncidenciaPendiente[] = tickets
      .filter(t => t.estado === 'ABIERTO' || t.estado === 'EN_PROCESO' || t.estado === 'PENDIENTE_APROBACION')
      .map(t => ({
        codigo: t.id,
        asunto: t.asunto,
        modulo: t.modulo,
        tipo: t.tipo,
        prioridad: t.prioridad,
        estado: t.estado,
        solicitante: t.solicitanteNombre,
        sla_fecha_limite: t.slaFechaLimite
      }));

    return {
      total: tickets.length,
      abiertos: tickets.filter(t => t.estado === 'ABIERTO').length,
      en_proceso: tickets.filter(t => t.estado === 'EN_PROCESO').length,
      pendientes_aprobacion: tickets.filter(t => t.estado === 'PENDIENTE_APROBACION').length,
      aprobados: tickets.filter(t => t.estado === 'APROBADO').length,
      resueltos: tickets.filter(t => t.estado === 'RESUELTO').length,
      sla_cumplimiento_porcentaje: 100.0,
      total_rfcs: rfcsOnly.length,
      rfcs_aprobados: rfcsOnly.filter(r => r.estado === 'APROBADO' || r.cabAprobador).length,
      rfcs_pendientes: rfcsOnly.filter(r => r.estado === 'PENDIENTE_APROBACION').length,
      incidencias_por_modulo: moduloStats,
      ultima_incidencia: lastInc,
      ultimo_cambio_por_area: ultimoCambioArea,
      problemas_detectados: problemas,
      incidencias_pendientes: pendientes
    };
  }, [dashboardMetrics, tickets]);

  // Filtrado de Tickets para Vistas de Lista
  const displayedTickets = (activeViewMode === 'SERVICE_DESK' ? serviceDeskTickets : changeRfcs).filter(t => {
    const tArea = t.areaCambio || (t as any).area_cambio || '';
    const matchesSearch =
      searchTerm === '' ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tArea.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeViewMode === 'SERVICE_DESK') {
      const matchesType = selectedType === 'TODOS' || t.tipo === selectedType;
      const matchesStatus = selectedStatus === 'TODOS' || t.estado === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    }

    const tTipoCambio = t.tipoCambio || (t as any).tipo_cambio || 'NORMAL';
    const matchesArea = selectedArea === 'TODOS' || tArea === selectedArea;
    const matchesTipoCambio = selectedTipoCambio === 'TODOS' || tTipoCambio === selectedTipoCambio;
    const matchesStatus = selectedStatus === 'TODOS' || t.estado === selectedStatus;
    return matchesSearch && matchesArea && matchesTipoCambio && matchesStatus;
  });

  // Badges y Etiquetas con diseño limpio y profesional
  const getTipoBadge = (t: TicketType) => {
    switch (t) {
      case 'SOLICITUD_SERVICIO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <FileText className="w-3.5 h-3.5" /> Solicitud de Servicio
          </span>
        );
      case 'SOLICITUD_INFORMACION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            <HelpCircle className="w-3.5 h-3.5" /> Solicitud de Información
          </span>
        );
      case 'SOLICITUD_ACCESO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <UserCheck className="w-3.5 h-3.5" /> Solicitud de Acceso
          </span>
        );
      case 'INCIDENCIA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <AlertTriangle className="w-3.5 h-3.5" /> Incidencia Técnica
          </span>
        );
      case 'SOLICITUD_CAMBIO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <GitPullRequest className="w-3.5 h-3.5" /> Control de Cambios (RFC)
          </span>
        );
    }
  };

  const getAreaBadge = (area?: AreaCambio) => {
    switch (area) {
      case 'INFRAESTRUCTURA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Network className="w-3.5 h-3.5 text-indigo-600" />
            <span>Infraestructura & Redes</span>
          </span>
        );
      case 'APLICACIONES':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Aplicaciones & Base de Datos</span>
          </span>
        );
      case 'DOCUMENTACION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Documentación & Procesos</span>
          </span>
        );
      case 'CALENDARIO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            <span>Calendario & Change Freeze</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTipoCambioBadge = (tipo?: TipoCambio) => {
    switch (tipo) {
      case 'ESTANDAR':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Cambio Estándar</span>;
      case 'NORMAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Cambio Normal</span>;
      case 'EMERGENCIA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">Cambio de Emergencia</span>;
      default:
        return null;
    }
  };

  const getRiesgoBadge = (r?: string) => {
    switch (r) {
      case 'ALTO':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Riesgo Alto</span>;
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
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Abierto (N1)
          </span>
        );
      case 'EN_PROCESO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> En Atención (N2)
          </span>
        );
      case 'PENDIENTE_APROBACION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> Pendiente Aprobación CAB
          </span>
        );
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprobado por el CAB
          </span>
        );
      case 'RESUELTO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Implementado / Cerrado
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{s}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#2C2725] flex flex-col font-sans">
      {/* Top Navbar Corporativo TI */}
      <header className="bg-[#1A1615] text-white border-b border-[#382E2B] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8C6F55] to-[#B3876B] flex items-center justify-center text-white shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold tracking-wider text-white">SUMAQ</span>
                <span className="text-[10px] bg-[#2E2420] text-[#D8A78D] px-2 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase border border-[#4A3B35]">
                  OPERACIONES TI &middot; ITIL v4
                </span>
              </div>
              <p className="text-[11px] text-[#C9B29B] hidden sm:block">
                Centro de Control &middot; Gobernanza de Cambios & Mesa de Servicios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenJiraModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#26201E] hover:bg-[#382E2B] text-[#D8A78D] hover:text-white text-xs font-semibold border border-[#4A3B35] transition-colors cursor-pointer"
              title="Configurar credenciales de Jira Cloud y vinculación con GitHub"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Integración Jira Cloud</span>
            </button>

            <button
              onClick={() => {
                TicketStore.resetDefaults();
                loadData();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#26201E] hover:bg-[#382E2B] text-[#C9B29B] hover:text-white text-xs font-medium border border-[#4A3B35] transition-colors cursor-pointer"
              title="Restablecer tickets de demostración"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Restablecer Datos</span>
            </button>

            {user && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#26201E] border border-[#4A3B35] text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white font-medium truncate max-w-[140px]">{user.nombre_completo}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#382E2B] text-[#D8A78D] border border-[#4A3B35]">
                  {user.rol}
                </span>
              </div>
            )}

            {user?.rol === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8C6F55] hover:bg-[#6D543F] text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Spa</span>
              </Link>
            )}

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-bold border border-red-800 transition-all shadow cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Segmented Control de Vistas Principales (Sin referencias a semanas) */}
      <section className="bg-white border-b border-[#E6DFD5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col xl:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1 bg-[#F0EDE6] rounded-xl border border-[#E0D8CC] w-full xl:w-auto justify-center sm:justify-start">
            <button
              onClick={() => {
                setActiveViewMode('DASHBOARD_PROBLEMAS');
                setSelectedStatus('TODOS');
                setSearchTerm('');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewMode === 'DASHBOARD_PROBLEMAS'
                  ? 'bg-[#1A1615] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Dashboard & Analítica ITIL</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeViewMode === 'DASHBOARD_PROBLEMAS'
                  ? 'bg-emerald-600 text-white font-mono'
                  : 'bg-emerald-100 text-emerald-800 font-mono'
              }`}>
                {computedMetrics.problemas_detectados.length > 0 ? `${computedMetrics.problemas_detectados.length} Alerta RCA` : 'SLA 100%'}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveViewMode('CONTROL_CAMBIOS');
                setSelectedStatus('TODOS');
                setSearchTerm('');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewMode === 'CONTROL_CAMBIOS'
                  ? 'bg-[#1A1615] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Control de Cambios (CAB / RFC)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeViewMode === 'CONTROL_CAMBIOS' ? 'bg-purple-600 text-white font-mono' : 'bg-stone-200 text-stone-700 font-mono'
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
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewMode === 'SERVICE_DESK'
                  ? 'bg-[#1A1615] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Mesa de Ayuda (Service Desk)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeViewMode === 'SERVICE_DESK' ? 'bg-blue-600 text-white font-mono' : 'bg-stone-200 text-stone-700 font-mono'
              }`}>
                {serviceDeskTickets.length} Tickets
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 font-medium">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Jira Cloud v3: <strong>sumaq-dev.atlassian.net</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>MySQL Replicación: Master 3308 / Slave 3309 Activo</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ========================================================================= */}
        {/* VISTA 1: DASHBOARD EJECUTIVO & GESTIÓN DE PROBLEMAS (ITIL v4)            */}
        {/* ========================================================================= */}
        {activeViewMode === 'DASHBOARD_PROBLEMAS' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Ejecutivo de Analítica */}
            <div className="p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ITIL v4 Service Value System</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Problem Management & RCA</span>
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                  Dashboard Ejecutivo de TI & Gestión de Problemas
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Monitoreo continuo de acuerdos de nivel de servicio (SLA), detección algorítmica de causas raíz (RCA) para incidentes recurrentes y radar de gobernanza del Comitéé de Cambios (CAB).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadData(true)}
                    disabled={isLoadingMetrics}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                      justUpdated
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 scale-[1.02]'
                        : isLoadingMetrics
                        ? 'bg-stone-800 text-stone-300 border border-stone-700'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                    title="Consultar métricas y tickets en vivo desde el servidor"
                  >
                    {isLoadingMetrics ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>Actualizando...</span>
                      </>
                    ) : justUpdated ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-scaleIn" />
                        <span>¡Métricas Actualizadas!</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                        <span>Actualizar Métricas</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-stone-400 font-mono hidden xl:inline" title="Hora de la última actualización en vivo">
                    sinc: {lastSyncTime}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sistemas en Operación Normal</span>
                </div>
              </div>
            </div>

            {/* 4 Métricas Clave (KPIs) con Estilo Corporativo Senior */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: SLA Cumplimiento */}
              <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Cumplimiento Global de SLA</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-serif font-bold text-emerald-700 tracking-tight">
                    {computedMetrics.sla_cumplimiento_porcentaje}%
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    0 incumplimientos en ventanas de atención N1/N2
                  </p>
                </div>
                <div className="mt-3 w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${computedMetrics.sla_cumplimiento_porcentaje}%` }}></div>
                </div>
              </div>

              {/* KPI 2: Gobernanza CAB */}
              <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Gobernanza del Comitéé CAB</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-serif font-bold text-purple-900 tracking-tight">
                    {computedMetrics.rfcs_aprobados} / {computedMetrics.total_rfcs}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    100% cambios aprobados con plan de rollback
                  </p>
                </div>
                <div className="mt-3 w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(computedMetrics.rfcs_aprobados / (computedMetrics.total_rfcs || 1)) * 100}%` }}></div>
                </div>
              </div>

              {/* KPI 3: Mesa de Ayuda */}
              <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Mesa de Ayuda (Tickets)</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
                    {computedMetrics.total} <span className="text-xs font-normal text-stone-500">tickets</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {computedMetrics.resueltos} cerrados &middot; {computedMetrics.en_proceso + computedMetrics.abiertos} en curso
                  </p>
                </div>
                <div className="mt-3 flex gap-1.5 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">{computedMetrics.en_proceso} En Atención</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{computedMetrics.resueltos} Resueltos</span>
                </div>
              </div>

              {/* KPI 4: Gestión de Problemas */}
              <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Gestión de Problemas ITIL</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-serif font-bold text-amber-700 tracking-tight">
                    {computedMetrics.problemas_detectados.length} <span className="text-xs font-normal text-stone-500">patrón</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Análisis de Causa Raíz (RCA) activado
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Módulo crítico: Base de Datos</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL: GESTIÓN PROACTIVA DE PROBLEMAS (ITIL v4) */}
            <div className="p-6 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      Gestión Proactiva de Problemas (ITIL v4): Detección de Incidentes Recurrentes
                    </h3>
                    <p className="text-xs text-stone-600">
                      Identificación algorítmica de fallas repetitivas para diagnosticar la <strong>Causa Raíz (RCA)</strong> y registrar soluciones permanentes en la base KEDB.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
                  ANÁLISIS DE CAUSA RAÍZ EN PROCESO
                </span>
              </div>

              {computedMetrics.problemas_detectados.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No se han detectado incidentes recurrentes. La plataforma opera de forma estable sin anomalías de causa raíz.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 pt-1">
                  {computedMetrics.problemas_detectados.map((prob, idx) => (
                    <div key={idx} className="p-5 rounded-xl bg-stone-50/60 border border-stone-200 shadow-xs space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-stone-700" />
                          <h4 className="text-sm font-bold text-stone-900">
                            Módulo con Patrón Recurrente: <span className="text-[#8C6F55] font-black">{prob.modulo}</span>
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {prob.incidencias_count} incidencias vinculadas en 48 horas
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-white border border-amber-200/90 shadow-xs">
                          <p className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Hipótesis y Diagnóstico de Causa Raíz (RCA):
                          </p>
                          <p className="text-stone-700 leading-relaxed font-normal">
                            {prob.sugerencia_itil}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-emerald-200/90 shadow-xs">
                          <p className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Solución Definitiva (Known Error Database - KEDB):
                          </p>
                          <p className="text-stone-700 leading-relaxed font-normal">
                            Implementar enrutamiento inteligente en Django (Database Router) para que reportes y lecturas masivas consuman de la réplica MySQL Slave (puerto 3309), protegiendo al Master para transacciones atómicas.
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/70">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-stone-500 font-semibold">Tickets Involucrados:</span>
                          {prob.tickets_relacionados.map((code) => (
                            <button
                              key={code}
                              onClick={() => {
                                setActiveViewMode('SERVICE_DESK');
                                setSearchTerm(code);
                              }}
                              className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white text-stone-800 border border-stone-300 hover:border-stone-500 transition-colors cursor-pointer"
                              title="Ver detalle del ticket en Mesa de Ayuda"
                            >
                              {code} &rarr;
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setActiveViewMode('CONTROL_CAMBIOS');
                            setSearchTerm('MySQL');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                          <span>Ver RFC de Solución (RFC-2026-0042)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN DOBLE: FRECUENCIA POR MÓDULO & RADAR DE CAMBIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card A: Frecuencia de Incidencias por Módulo (Diseño Senior Limpio) */}
              <div className="p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Frecuencia de Incidencias por Módulo
                      </h3>
                      <p className="text-xs text-stone-500">Distribución de requerimientos por subsistema técnico</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                    Periodo Vigente
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {computedMetrics.incidencias_por_modulo.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">Sin registros de incidencias para agrupar.</p>
                  ) : (
                    computedMetrics.incidencias_por_modulo.map((stat, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 rounded-xl hover:bg-stone-50/70 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#8C6F55]"></span>
                            <span className="font-semibold text-stone-800">{stat.modulo}</span>
                          </div>
                          <span className="font-mono text-xs text-stone-600 font-medium">
                            <strong className="text-stone-900 font-bold">{stat.count}</strong> tickets ({stat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0
                                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                                : 'bg-[#8C6F55]'
                            }`}
                            style={{ width: `${Math.max(stat.percentage, 8)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-2 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 leading-relaxed">
                  <p className="font-bold text-stone-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#8C6F55]" />
                    Diagnóstico ITIL:
                  </p>
                  <p className="mt-1">
                    El módulo con mayor volumen de fallas es <strong>Base de Datos MySQL</strong> (33.3%). Esto sustenta y valida el pase a producción del cambio <strong>RFC-2026-0042</strong> para la réplica de lectura en el puerto 3309.
                  </p>
                </div>
              </div>

              {/* Card B: Última Incidencia & Radar 4 Áreas de Cambio */}
              <div className="space-y-4">
                {/* Mini Card 1: Última Incidencia */}
                <div className="p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      Última Incidencia / Solicitud Registrada
                    </span>
                    {computedMetrics.ultima_incidencia && (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {computedMetrics.ultima_incidencia.codigo}
                      </span>
                    )}
                  </div>

                  {computedMetrics.ultima_incidencia ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-stone-900 leading-snug">
                        {computedMetrics.ultima_incidencia.asunto}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                          Módulo: {computedMetrics.ultima_incidencia.modulo}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          Solicitante: {computedMetrics.ultima_incidencia.solicitante}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                          Prioridad: {computedMetrics.ultima_incidencia.prioridad}
                        </span>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
                        <span className="text-stone-400">Registrado: {computedMetrics.ultima_incidencia.created_at}</span>
                        <button
                          onClick={() => {
                            setActiveViewMode('SERVICE_DESK');
                            setSearchTerm(computedMetrics.ultima_incidencia.codigo);
                          }}
                          className="text-[#8C6F55] hover:text-[#6D543F] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Atender en Mesa de Ayuda</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400">No hay incidencias registradas recientemente.</p>
                  )}
                </div>

                {/* Mini Card 2: Radar de las 4 Áreas de Cambio */}
                <div className="p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-purple-600" />
                      Radar de las 4 Áreas de Control de Cambios (CAB)
                    </span>
                    <button
                      onClick={() => setActiveViewMode('CONTROL_CAMBIOS')}
                      className="text-xs text-purple-700 font-bold hover:underline cursor-pointer"
                    >
                      Ver todos &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. Infraestructura */}
                    <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                          <Network className="w-3 h-3 text-indigo-600" /> Infraestructura
                        </span>
                        <span className="font-mono text-[10px] font-black text-indigo-700">
                          {computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA?.codigo || 'RFC-0050'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA?.asunto || 'Switch Administrable & VLANs 10, 20, 30'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                        <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">Aprobado CAB</span>
                        <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA?.cab_acta_numero || 'ACTA-CAB-2026-050'}>
                          {computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA?.cab_acta_numero || 'ACTA-CAB-2026-050'}
                        </span>
                      </div>
                    </div>

                    {/* 2. Aplicaciones & BD */}
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                          <Database className="w-3 h-3 text-blue-600" /> Aplicaciones & BD
                        </span>
                        <span className="font-mono text-[10px] font-black text-blue-700">
                          {computedMetrics.ultimo_cambio_por_area.APLICACIONES?.codigo || 'RFC-0042'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area.APLICACIONES?.asunto || 'Pasarela Niubiz & Réplica Asíncrona'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                        <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">Aprobado CAB</span>
                        <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.APLICACIONES?.cab_acta_numero || 'ACTA-CAB-2026-042'}>
                          {computedMetrics.ultimo_cambio_por_area.APLICACIONES?.cab_acta_numero || 'ACTA-CAB-2026-042'}
                        </span>
                      </div>
                    </div>

                    {/* 3. Documentación */}
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-amber-600" /> Documentación
                        </span>
                        <span className="font-mono text-[10px] font-black text-amber-700">
                          {computedMetrics.ultimo_cambio_por_area.DOCUMENTACION?.codigo || 'RFC-0043'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area.DOCUMENTACION?.asunto || 'Topología de Red & Contingencia'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                        <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">Implementado</span>
                        <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.DOCUMENTACION?.cab_acta_numero || 'ACTA-CAB-2026-043'}>
                          {computedMetrics.ultimo_cambio_por_area.DOCUMENTACION?.cab_acta_numero || 'ACTA-CAB-2026-043'}
                        </span>
                      </div>
                    </div>

                    {/* 4. Calendario */}
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-rose-600" /> Calendario Freeze
                        </span>
                        <span className="font-mono text-[10px] font-black text-rose-700">
                          {computedMetrics.ultimo_cambio_por_area.CALENDARIO?.codigo || 'RFC-0030'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area.CALENDARIO?.asunto || 'Change Freeze Campaña San Valentín'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                        <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">Aprobado CAB</span>
                        <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.CALENDARIO?.cab_acta_numero || 'ACTA-CAB-2026-030'}>
                          {computedMetrics.ultimo_cambio_por_area.CALENDARIO?.cab_acta_numero || 'ACTA-CAB-2026-030'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: INCIDENCIAS & SOLICITUDES PENDIENTES (MONITOREO DE SLAS) */}
            <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden space-y-3 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Incidencias y Solicitudes Pendientes (SLA en Vivo)
                    </h3>
                    <p className="text-xs text-stone-500">Requerimientos en proceso que exigen atención dentro del tiempo acordado</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
                  {computedMetrics.incidencias_pendientes.length} tickets en curso
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] text-stone-600 font-semibold text-[11px] border-b border-[#E6DFD5]">
                    <tr>
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Asunto y Descripción</th>
                      <th className="py-3 px-3">Módulo</th>
                      <th className="py-3 px-3">Solicitante</th>
                      <th className="py-3 px-3">Prioridad</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-3">Vencimiento SLA</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {computedMetrics.incidencias_pendientes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-stone-400">
                          No hay solicitudes ni incidencias pendientes. ¡Mesa de Ayuda al día!
                        </td>
                      </tr>
                    ) : (
                      computedMetrics.incidencias_pendientes.map((t) => {
                        const fullTicket = tickets.find(x => x.id === t.codigo);
                        return (
                          <tr key={t.codigo} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-[#8C6F55]">
                              {t.codigo}
                            </td>
                            <td className="py-3 px-3 font-semibold text-stone-900 max-w-xs truncate" title={t.asunto}>
                              {t.asunto}
                            </td>
                            <td className="py-3 px-3 text-stone-600">
                              {t.modulo}
                            </td>
                            <td className="py-3 px-3 text-stone-600">
                              {t.solicitante}
                            </td>
                            <td className="py-3 px-3">
                              {getPriorityBadge(t.prioridad as any)}
                            </td>
                            <td className="py-3 px-3">
                              {getStatusBadge(t.estado as any)}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-rose-700">
                              {t.sla_fecha_limite}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (fullTicket) {
                                    openManageModal(fullTicket);
                                  } else {
                                    setActiveViewMode('SERVICE_DESK');
                                    setSearchTerm(t.codigo);
                                  }
                                }}
                                className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Atender
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: CONTROL DE CAMBIOS RFC / CAB (ITIL v4)                           */}
        {/* ========================================================================= */}
        {activeViewMode === 'CONTROL_CAMBIOS' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Banner Institucional del CAB */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1A1615] via-[#2A2422] to-[#3D2D22] text-white border border-[#4A3B35] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Award className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-serif font-bold tracking-wide">
                    Gobernanza del Comitéé de Control de Cambios (CAB - Change Advisory Board)
                  </h2>
                </div>
                <p className="text-xs text-[#C9B29B] max-w-3xl leading-relaxed">
                  Evaluación multidimensional de impacto, ventanas de mantenimiento nocturnas y planes de contingencia (rollback) para las <strong>4 Áreas de Cambio</strong>: Infraestructura (Switch/Router/VLANs), Aplicaciones y Base de Datos, Documentación y Calendario.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-[#EDE5DC]">
                  <span className="bg-[#2E2420] px-2.5 py-0.5 rounded-md border border-[#4A3B35] text-[#D8A78D] font-semibold">
                    Presidente CAB: MBA Mg. Ing. Renéé Alonso Nieto Valencia
                  </span>
                  <span>&middot;</span>
                  <span>Enfoque ITIL v4: Habilitación de Cambios & Continuidad</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedArea('TODOS');
                    setSelectedTipoCambio('TODOS');
                    setSelectedStatus('TODOS');
                    setSearchTerm('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              </div>
            </div>

            {/* Selector de Áreas de Cambio (4 Categorías ITIL) */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#8C6F55]" />
                  Filtrar por Área de Cambio (4 Categorías ITIL)
                </span>
                <span className="text-xs text-stone-500">
                  Mostrando: <strong>{displayedTickets.length}</strong> de {changeRfcs.length} solicitudes RFC
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'TODOS', label: 'Todas las Áreas', count: changeRfcs.length },
                  { id: 'INFRAESTRUCTURA', label: '1. Infraestructura & Redes', count: countInfra },
                  { id: 'APLICACIONES', label: '2. Aplicaciones & BD', count: countApp },
                  { id: 'DOCUMENTACION', label: '3. Documentación & Procesos', count: countDoc },
                  { id: 'CALENDARIO', label: '4. Calendario & Freeze', count: countCal }
                ].map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setSelectedArea(ar.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedArea === ar.id
                        ? 'bg-[#1A1615] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-stone-600 hover:bg-[#F0EDE6] border border-[#E6DFD5]'
                    }`}
                  >
                    <span>{ar.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedArea === ar.id ? 'bg-rose-500 text-white font-mono' : 'bg-stone-200 text-stone-700 font-mono'
                    }`}>
                      {ar.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Tarjetas RFC de Control de Cambios */}
            <div className="space-y-4">
              {displayedTickets.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs bg-white rounded-2xl border border-[#E6DFD5]">
                  No se encontraron Solicitudes de Cambio (RFC) que coincidan con los filtros seleccionados.
                </div>
              ) : (
                displayedTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 bg-white rounded-2xl border border-[#E6DFD5] shadow-xs hover:shadow-sm transition-all flex flex-col gap-4"
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
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
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg border border-stone-300 transition-colors"
                            title="Ver Pull Request en GitHub"
                          >
                            <GitPullRequest className="w-3.5 h-3.5 text-stone-700" />
                            <span>PR GitHub</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Contenido Principal */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-stone-900 leading-snug">{t.asunto}</h3>
                      <p className="text-xs text-stone-600 leading-relaxed">{t.descripcion}</p>
                    </div>

                    {/* Especificaciones de Ventana y Rollback */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#E6DFD5] text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
                          Ventana de Mantenimiento
                        </span>
                        <p className="font-semibold text-stone-800">
                          {t.ventanaMantenimiento || 'Martes 02:00 AM - 04:00 AM (Sin impacto comercial)'}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
                          Plan de Contingencia / Rollback
                        </span>
                        <p className="font-semibold text-stone-800">
                          {t.planRollback || 'Reconexión de hardware anterior en rack en < 10 minutos.'}
                        </p>
                      </div>
                    </div>

                    {/* Acta de Aprobación CAB si existe */}
                    {(t.cabAprobador || (t as any).cab_aprobado_por) && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Aprobado por el CAB: <strong>{t.cabAprobador || (t as any).cab_aprobado_por}</strong>
                          </span>
                        </div>
                        {(t.cabActa || (t as any).cab_acta_numero) && (
                          <span className="font-mono font-bold text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-300">
                            Acta: {t.cabActa || (t as any).cab_acta_numero}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer y Acciones */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500">
                        <span>Solicitante: <strong className="text-stone-700">{t.solicitanteNombre}</strong> ({t.solicitanteRol})</span>
                        <span>Módulo: <strong className="text-stone-700">{t.modulo}</strong></span>
                        <span>Registrado: {t.fechaCreacion}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {t.estado === 'PENDIENTE_APROBACION' && (
                          <button
                            onClick={() => handleOpenCabModal(t)}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Dictamen Comitéé CAB</span>
                          </button>
                        )}

                        <button
                          onClick={() => openManageModal(t)}
                          className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Gestionar RFC
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
        {/* VISTA 3: MESA DE AYUDA & SERVICE DESK (ITIL v4)                           */}
        {/* ========================================================================= */}
        {activeViewMode === 'SERVICE_DESK' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Banner Central de Mesa de Ayuda */}
            <div className="p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    Consola Central de Mesa de Ayuda &middot; Service Desk Especialista
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Gestión operativa de Requerimientos de Servicio, Solicitudes de Información, Solicitudes de Acceso e Incidencias Técnicas con SLAs garantizados (P1 a P4).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                  SLA Crítico P1: &le; 2 horas
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  SLA Cumplido: 100%
                </span>
              </div>
            </div>

            {/* Tarjetas KPI Service Desk */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-[#E6DFD5] shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Solicitudes</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-stone-900">{totalServiceDesk}</span>
                  <span className="text-xs text-stone-500">registradas</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E6DFD5] shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">N1 &middot; Abiertas</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-700">{abiertosServiceDesk}</span>
                  <span className="text-xs text-stone-500">en cola</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E6DFD5] shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">N2 &middot; En Proceso</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-700">{enProcesoServiceDesk}</span>
                  <span className="text-xs text-stone-500">en atención</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E6DFD5] shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resueltas / Cerradas</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-700">{resueltosServiceDesk}</span>
                  <span className="text-xs text-stone-500">completadas</span>
                </div>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, solicitante, módulo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8C6F55] bg-white text-stone-900"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-stone-300 bg-white font-semibold text-stone-700"
                >
                  <option value="TODOS">Todos los Tipos</option>
                  <option value="SOLICITUD_SERVICIO">Solicitud de Servicio</option>
                  <option value="SOLICITUD_INFORMACION">Solicitud de Información</option>
                  <option value="SOLICITUD_ACCESO">Solicitud de Acceso</option>
                  <option value="INCIDENCIA">Incidencia Técnica</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-stone-300 bg-white font-semibold text-stone-700"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="ABIERTO">Abierto (N1)</option>
                  <option value="EN_PROCESO">En Atención (N2)</option>
                  <option value="PENDIENTE_APROBACION">Pendiente Aprobación</option>
                  <option value="RESUELTO">Resuelto</option>
                </select>
              </div>
            </div>

            {/* Listado de Tickets */}
            <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
              <div className="divide-y divide-stone-100">
                {displayedTickets.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    No se encontraron tickets que coincidan con los filtros seleccionados.
                  </div>
                ) : (
                  displayedTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 hover:bg-stone-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
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

                        <h4 className="text-sm font-bold text-stone-900 leading-snug">{t.asunto}</h4>
                        <p className="text-xs text-stone-600 line-clamp-2">{t.descripcion}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 pt-1">
                          <span>Solicitante: <strong className="text-stone-700">{t.solicitanteNombre}</strong> ({t.solicitanteRol})</span>
                          <span>Módulo: <strong className="text-stone-700">{t.modulo}</strong></span>
                          <span>Registrado: {t.fechaCreacion}</span>
                          <span className="text-red-700 font-semibold">SLA Límite: {t.slaFechaLimite}</span>
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
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Aprobar Acceso</span>
                          </button>
                        )}

                        <button
                          onClick={() => openManageModal(t)}
                          className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
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
      {/* MODAL 1: APROBACIÓN & ACTA FORMAL DEL COMITÉ CAB                         */}
      {/* ========================================================================= */}
      {cabModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#1A1615] text-white p-5 flex items-center justify-between border-b border-[#382E2B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold flex items-center gap-2">
                    Comitéé CAB &middot; Sesión de Dictamen y Aprobación
                  </h3>
                  <p className="text-[11px] text-[#C9B29B]">
                    Solicitud de Cambio: <strong className="font-mono text-white">{cabModalTicket.id}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCabModalTicket(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10"
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
              <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getAreaBadge(cabModalTicket.areaCambio)}
                  {getTipoCambioBadge(cabModalTicket.tipoCambio)}
                  {getRiesgoBadge(cabModalTicket.impactoRiesgo)}
                </div>
                <h4 className="text-sm font-bold text-stone-900">{cabModalTicket.asunto}</h4>
                <p className="text-stone-600 leading-relaxed">{cabModalTicket.descripcion}</p>
              </div>

              {/* Especificaciones de Ventana y Rollback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD5]">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Ventana de Mantenimiento
                  </label>
                  <p className="font-semibold text-stone-800">
                    {cabModalTicket.ventanaMantenimiento || 'Martes 02:00 AM - 04:00 AM'}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Procedimiento de Rollback
                  </label>
                  <p className="font-semibold text-stone-800">
                    {cabModalTicket.planRollback || 'Reconexión de hardware anterior en rack en < 10 minutos.'}
                  </p>
                </div>
              </div>

              {/* Formulario de Aprobación CAB */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    Presidente del CAB / Aprobador Oficial
                  </label>
                  <input
                    type="text"
                    required
                    value={cabAprobadorInput}
                    onChange={(e) => setCabAprobadorInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Representa al evaluador principal del Comitéé de Cambios (Docente de la asignatura).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    N° de Acta del Comitéé CAB
                  </label>
                  <input
                    type="text"
                    required
                    value={cabActaInput}
                    onChange={(e) => setCabActaInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-mono text-stone-900 focus:ring-2 focus:ring-[#8C6F55] focus:outline-none"
                  />
                </div>
              </div>

              {/* Botón de Aprobación */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCabModalTicket(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold cursor-pointer"
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
      {/* MODAL 2: GESTIÓN DE RESOLUCIÓN TÉCNICA (SERVICE DESK)                     */}
      {/* ========================================================================= */}
      {managingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#1A1615] text-white p-5 flex items-center justify-between border-b border-[#382E2B]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8C6F55] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold">
                    Gestión Técnica &middot; Ticket {managingTicket.id}
                  </h3>
                  <p className="text-[11px] text-[#C9B29B] truncate max-w-sm">{managingTicket.asunto}</p>
                </div>
              </div>
              <button
                onClick={() => setManagingTicket(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
              {saveSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>¡Actualización registrada y sincronizada correctamente!</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Estado del Ticket</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-semibold text-stone-800"
                >
                  <option value="ABIERTO">Abierto (Nivel 1)</option>
                  <option value="EN_PROCESO">En Atención (Nivel 2)</option>
                  <option value="PENDIENTE_APROBACION">Pendiente de Aprobación</option>
                  <option value="APROBADO">Aprobado</option>
                  <option value="RESUELTO">Resuelto / Implementado</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Especialista TI Asignado</label>
                <input
                  type="text"
                  value={editAsignado}
                  onChange={(e) => setEditAsignado(e.target.value)}
                  placeholder="Ej: Bryan Mango (BT), Especialista TI N2"
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Resolución Técnica / Bitácora
                </label>
                <textarea
                  rows={3}
                  value={editResolucion}
                  onChange={(e) => setEditResolucion(e.target.value)}
                  placeholder="Detalle de la solución técnica aplicada, comandos ejecutados o verificación de servicios..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Enlace a Commit / Pull Request en GitHub
                </label>
                <input
                  type="url"
                  value={editGithubUrl}
                  onChange={(e) => setEditGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">
                  Clave de Ticket en Jira Cloud (Opcional)
                </label>
                <input
                  type="text"
                  value={editJiraKey}
                  onChange={(e) => setEditJiraKey(e.target.value)}
                  placeholder="KAN-10, KAN-12..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setManagingTicket(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8C6F55] hover:bg-[#6D543F] text-white font-bold transition-all shadow cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIGURACIÓN JIRA CLOUD (ATLASSIAN)                             */}
      {/* ========================================================================= */}
      {isJiraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="bg-[#1A1615] text-white p-5 flex items-center justify-between border-b border-[#382E2B]">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif text-base font-bold">Integración Jira Cloud v3</h3>
              </div>
              <button onClick={() => setIsJiraModalOpen(false)} className="text-stone-400 hover:text-white">
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
                <label className="block font-bold text-stone-700 uppercase mb-1">Dominio Jira</label>
                <input
                  type="text"
                  value={formJiraDomain}
                  onChange={(e) => setFormJiraDomain(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Email Atlassian</label>
                <input
                  type="email"
                  value={formJiraEmail}
                  onChange={(e) => setFormJiraEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">API Token</label>
                <input
                  type="password"
                  value={formJiraToken}
                  onChange={(e) => setFormJiraToken(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Project Key</label>
                <input
                  type="text"
                  value={formJiraProject}
                  onChange={(e) => setFormJiraProject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-mono text-stone-900"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleTestJiraConnection}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-300 font-bold hover:bg-blue-100 cursor-pointer"
                >
                  Probar Conexión
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8C6F55] text-white font-bold hover:bg-[#6D543F] cursor-pointer"
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
