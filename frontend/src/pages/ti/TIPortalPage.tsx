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
  IncidenciaPendiente,
  KdbArticle,
  MonitoringEvent,
  MonitoringHealthResponse
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
  ArrowRight,
  PieChart,
  Copy,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';

export const TIPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Vista Activa: Dashboard & Analítica | Monitoreo & Eventos | Control de Cambios (CAB) | Mesa de Ayuda (Service Desk)
  const [activeViewMode, setActiveViewMode] = useState<'DASHBOARD_PROBLEMAS' | 'MONITOREO_EVENTOS' | 'CONTROL_CAMBIOS' | 'SERVICE_DESK'>('DASHBOARD_PROBLEMAS');

  // Filtros Generales
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedArea, setSelectedArea] = useState<string>('TODOS');
  const [selectedTipoCambio, setSelectedTipoCambio] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtros interactivos específicos del Dashboard ITIL
  const [dashFilterModulo, setDashFilterModulo] = useState<string>('TODOS');
  const [dashFilterPrioridad, setDashFilterPrioridad] = useState<string>('TODOS');
  const [dashFilterEstado, setDashFilterEstado] = useState<string>('TODOS');

  // Estados para Modal de Gestión de Tickets (Service Desk)
  const [managingTicket, setManagingTicket] = useState<Ticket | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>('EN_PROCESO');
  const [editAsignado, setEditAsignado] = useState<string>('');
  const [editResolucion, setEditResolucion] = useState<string>('');
  const [editGithubUrl, setEditGithubUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [editJiraKey, setEditJiraKey] = useState<string>('');
  const [editKdbCodigo, setEditKdbCodigo] = useState<string>('');

  // Estados para Modal de Creación de Ticket / RFC desde Portal TI
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState<boolean>(false);
  const [newTicketTipo, setNewTicketTipo] = useState<TicketType>('INCIDENCIA');
  const [newTicketPrioridad, setNewTicketPrioridad] = useState<TicketPriority>('P2_ALTA');
  const [newTicketModulo, setNewTicketModulo] = useState<string>('Base de Datos MySQL');
  const [newTicketAsunto, setNewTicketAsunto] = useState<string>('');
  const [newTicketDescripcion, setNewTicketDescripcion] = useState<string>('');
  const [newTicketSolicitante, setNewTicketSolicitante] = useState<string>('Ing. Anthony Luque (Soporte TI)');
  const [newTicketAreaCambio, setNewTicketAreaCambio] = useState<AreaCambio>('INFRAESTRUCTURA');
  const [newTicketTipoCambio, setNewTicketTipoCambio] = useState<TipoCambio>('NORMAL');
  const [newTicketRiesgo, setNewTicketRiesgo] = useState<'BAJO' | 'MEDIO' | 'ALTO'>('MEDIO');
  const [newTicketVentana, setNewTicketVentana] = useState<string>('Martes 02:00 AM - 04:00 AM');
  const [newTicketRollback, setNewTicketRollback] = useState<string>('Reversión a configuración previa en < 10 min');
  const [isCreatingTicket, setIsCreatingTicket] = useState<boolean>(false);

  // Estados para Modal de Dictamen / Aprobación del Comité CAB
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

  // Estados de Dashboard y Métricas ITIL v4
  const [dashboardMetrics, setDashboardMetrics] = useState<ITILDashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const isUpdatingRef = useRef<boolean>(false);

  // Estados y Catálogo de Base de Conocimiento (KDB - Known Error Database / Workarounds)
  const [isKDBOpen, setIsKDBOpen] = useState<boolean>(true);
  const [kdbSearchTerm, setKdbSearchTerm] = useState<string>('');
  const [kdbSelectedCategory, setKdbSelectedCategory] = useState<string>('TODOS');
  const [kdbSelectedPriority, setKdbSelectedPriority] = useState<string>('TODOS');
  const [copiedKDBId, setCopiedKDBId] = useState<string | null>(null);
  const [expandedKDBId, setExpandedKDBId] = useState<string | null>('KDB-2026-001');
  const [kdbArticles, setKdbArticles] = useState<KdbArticle[]>([]);
  const [isLoadingKDB, setIsLoadingKDB] = useState<boolean>(false);
  const [isKdbModalOpen, setIsKdbModalOpen] = useState<boolean>(false);
  const [editingKdbArticle, setEditingKdbArticle] = useState<KdbArticle | null>(null);
  const [kdbFormTitulo, setKdbFormTitulo] = useState<string>('');
  const [kdbFormCategoria, setKdbFormCategoria] = useState<string>('BASE_DE_DATOS');
  const [kdbFormModulo, setKdbFormModulo] = useState<string>('Base de Datos MySQL');
  const [kdbFormPrioridad, setKdbFormPrioridad] = useState<string>('P2_ALTA');
  const [kdbFormTiempo, setKdbFormTiempo] = useState<string>('< 5 min');
  const [kdbFormJiraRef, setKdbFormJiraRef] = useState<string>('');
  const [kdbFormSintoma, setKdbFormSintoma] = useState<string>('');
  const [kdbFormCausaRaiz, setKdbFormCausaRaiz] = useState<string>('');
  const [kdbFormSolucion, setKdbFormSolucion] = useState<string>('');
  const [isSavingKdb, setIsSavingKdb] = useState<boolean>(false);

  // Estados de Monitoreo y Gestión de Eventos
  const [monitoringEvents, setMonitoringEvents] = useState<MonitoringEvent[]>([]);
  const [monitoringHealth, setMonitoringHealth] = useState<MonitoringHealthResponse | null>(null);
  const [isLoadingMonitoring, setIsLoadingMonitoring] = useState<boolean>(false);
  const [monFilterNivel, setMonFilterNivel] = useState<string>('TODOS');
  const [monFilterComponente, setMonFilterComponente] = useState<string>('TODOS');
  const [monFilterIncidente, setMonFilterIncidente] = useState<string>('TODOS');
  const [monSearchTerm, setMonSearchTerm] = useState<string>('');

  // Formulario de Registro y Evaluación de Lecturas de Monitoreo
  const [evalComponente, setEvalComponente] = useState<string>('MYSQL_MASTER');
  const [evalMetrica, setEvalMetrica] = useState<string>('Uso de CPU del Servidor');
  const [evalUnidad, setEvalUnidad] = useState<string>('%');
  const [evalValor, setEvalValor] = useState<string>('78.5');
  const [evalProceso, setEvalProceso] = useState<string>('Agendamiento y Disponibilidad de Terapeutas');
  const [evalDescripcion, setEvalDescripcion] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalFeedback, setEvalFeedback] = useState<{ type: 'info' | 'warning' | 'critical'; message: string; ticketId?: string } | null>(null);

  const fetchMonitoring = async () => {
    setIsLoadingMonitoring(true);
    try {
      const [evts, health] = await Promise.all([
        TicketStore.getMonitoringEvents({
          nivel: monFilterNivel,
          componente: monFilterComponente,
          genera_incidente: monFilterIncidente,
          search: monSearchTerm
        }),
        TicketStore.getMonitoringHealth()
      ]);
      setMonitoringEvents(evts);
      if (health) {
        setMonitoringHealth(health);
      }
    } catch (err) {
      console.warn('[TIPortal] Error cargando monitoreo:', err);
    } finally {
      setIsLoadingMonitoring(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, [monFilterNivel, monFilterComponente, monFilterIncidente, monSearchTerm]);

  const handleEvaluateMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericVal = parseFloat(evalValor);
    if (isNaN(numericVal)) return;

    setIsEvaluating(true);
    setEvalFeedback(null);
    try {
      const res = await TicketStore.evaluateMonitoringReading({
        componente: evalComponente,
        metrica: evalMetrica,
        valor_numerico: numericVal,
        unidad: evalUnidad,
        proceso_negocio: evalProceso,
        descripcion: evalDescripcion
      });

      if (res.success && res.evento) {
        const evt = res.evento;
        const tId = res.ticket_generado?.id || evt.ticketCodigo || evt.ticket_codigo;
        if (evt.generaIncidente || evt.genera_incidente) {
          setEvalFeedback({
            type: 'critical',
            message: `Evento [${evt.codigo}] clasificado como ${evt.nivel}. Superó umbral de tolerancia y generó automáticamente el Ticket de Incidente ${tId}.`,
            ticketId: tId
          });
        } else if (evt.nivel === 'WARNING') {
          setEvalFeedback({
            type: 'warning',
            message: `Evento [${evt.codigo}] clasificado como ADVERTENCIA (${evt.valorRegistrado || evt.valor_registrado}). Acción preventiva asignada sin generar incidente.`
          });
        } else {
          setEvalFeedback({
            type: 'info',
            message: `Evento [${evt.codigo}] registrado como INFORMATIVO (${evt.valorRegistrado || evt.valor_registrado}). Operación dentro del rango normal.`
          });
        }
        setEvalDescripcion('');
        await Promise.all([fetchMonitoring(), loadData(false)]);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleMitigateEvent = async (evt: MonitoringEvent) => {
    const updated = await TicketStore.mitigateMonitoringEvent(evt.id, {
      estado: 'MITIGADO',
      accion_respuesta: `${evt.accionRespuesta || evt.accion_respuesta} [Verificado y mitigado por Guardia TI]`
    });
    if (updated) {
      await fetchMonitoring();
    }
  };

  const fetchKDB = async () => {
    setIsLoadingKDB(true);
    try {
      const data = await TicketStore.getKdbArticles({
        search: kdbSearchTerm,
        categoria: kdbSelectedCategory,
        prioridad: kdbSelectedPriority
      });
      setKdbArticles(data);
      if (data.length > 0 && !expandedKDBId) {
        setExpandedKDBId(data[0].codigo);
      }
    } catch (err) {
      console.warn('[TIPortal] Error cargando KDB:', err);
    } finally {
      setIsLoadingKDB(false);
    }
  };

  useEffect(() => {
    fetchKDB();
  }, [kdbSearchTerm, kdbSelectedCategory, kdbSelectedPriority]);

  const handleCopyWorkaround = (art: KdbArticle) => {
    const causa = art.causaRaiz || art.causa_raiz || '';
    const solucion = art.solucionWorkaround || art.solucion_workaround || '';
    const textToCopy = `[${art.codigo}] ${art.titulo}\nDiagnóstico: ${causa}\nSolución Workaround:\n${solucion}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKDBId(art.codigo);
    setTimeout(() => setCopiedKDBId(null), 2500);
  };

  const loadData = async (isManualClick: boolean = false) => {
    // Protección contra bucle infinito o peticiones concurrentes
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setIsLoadingMetrics(true);

    const startTime = Date.now();

    try {
      // Carga en paralelo de tickets, métricas y telemetría de salud
      const [list, metrics, health] = await Promise.all([
        TicketStore.syncWithBackend(),
        TicketStore.getDashboardMetrics(),
        TicketStore.getMonitoringHealth()
      ]);

      setTickets(list);
      setJiraConfig(TicketStore.getJiraConfig());
      if (metrics) {
        setDashboardMetrics(metrics);
      }
      if (health) {
        setMonitoringHealth(health);
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
      if (!isUpdatingRef.current) {
        loadData(false);
      }
    };
    window.addEventListener('sumaq_tickets_updated', handleUpdate);
    // Sincronización automática periódica en segundo plano (sin botón manual)
    const intervalId = window.setInterval(() => {
      if (!isUpdatingRef.current) {
        loadData(false);
      }
    }, 30000);
    return () => {
      window.removeEventListener('sumaq_tickets_updated', handleUpdate);
      window.clearInterval(intervalId);
    };
  }, []);

  const handleOpenNewKdb = () => {
    setEditingKdbArticle(null);
    setKdbFormTitulo('');
    setKdbFormCategoria('BASE_DE_DATOS');
    setKdbFormModulo('Base de Datos MySQL');
    setKdbFormPrioridad('P2_ALTA');
    setKdbFormTiempo('< 5 min');
    setKdbFormJiraRef('');
    setKdbFormSintoma('');
    setKdbFormCausaRaiz('');
    setKdbFormSolucion('');
    setIsKdbModalOpen(true);
  };

  const handleOpenEditKdb = (art: KdbArticle) => {
    setEditingKdbArticle(art);
    setKdbFormTitulo(art.titulo);
    setKdbFormCategoria(art.categoria || 'BASE_DE_DATOS');
    setKdbFormModulo(art.modulo || 'Base de Datos MySQL');
    setKdbFormPrioridad(String(art.prioridad || 'P2_ALTA'));
    setKdbFormTiempo(art.tiempoEstimado || art.tiempo_estimado || '< 5 min');
    setKdbFormJiraRef(art.jiraRef || art.jira_ref || '');
    setKdbFormSintoma(art.sintoma || '');
    setKdbFormCausaRaiz(art.causaRaiz || art.causa_raiz || '');
    setKdbFormSolucion(art.solucionWorkaround || art.solucion_workaround || '');
    setIsKdbModalOpen(true);
  };

  const handleSaveKdbArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKdb(true);
    try {
      const payload = {
        titulo: kdbFormTitulo.trim(),
        categoria: kdbFormCategoria,
        modulo: kdbFormModulo.trim(),
        prioridad: kdbFormPrioridad,
        tiempo_estimado: kdbFormTiempo.trim() || '< 5 min',
        jira_ref: kdbFormJiraRef.trim().toUpperCase(),
        sintoma: kdbFormSintoma.trim(),
        causa_raiz: kdbFormCausaRaiz.trim(),
        solucion_workaround: kdbFormSolucion.trim()
      };
      if (editingKdbArticle) {
        await TicketStore.updateKdbArticle(editingKdbArticle.id, payload);
      } else {
        await TicketStore.createKdbArticle(payload);
      }
      setIsKdbModalOpen(false);
      await Promise.all([fetchKDB(), loadData(false)]);
    } finally {
      setIsSavingKdb(false);
    }
  };

  const handleDeleteKdbArticle = async (art: KdbArticle) => {
    const ok = await TicketStore.deleteKdbArticle(art.id);
    if (ok) {
      await Promise.all([fetchKDB(), loadData(false)]);
    }
  };

  const handleOpenNewTicketModal = (defaultTipo: TicketType = 'INCIDENCIA') => {
    setNewTicketTipo(defaultTipo);
    setNewTicketPrioridad(defaultTipo === 'INCIDENCIA' ? 'P1_CRITICA' : 'P2_ALTA');
    setNewTicketModulo(defaultTipo === 'SOLICITUD_CAMBIO' ? 'Redes & Hardware' : 'Base de Datos MySQL');
    setNewTicketAsunto('');
    setNewTicketDescripcion('');
    setNewTicketSolicitante(user?.nombre_completo || 'Ing. Anthony Luque (Soporte TI)');
    setNewTicketAreaCambio('INFRAESTRUCTURA');
    setNewTicketTipoCambio('NORMAL');
    setNewTicketRiesgo('MEDIO');
    setNewTicketVentana('Martes 02:00 AM - 04:00 AM');
    setNewTicketRollback('Reversión controlada a versión estable anterior en < 10 min');
    setIsNewTicketModalOpen(true);
  };

  const handleCreateNewTicketFromTI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketAsunto.trim() || !newTicketDescripcion.trim()) return;
    setIsCreatingTicket(true);
    try {
      await TicketStore.createTicket({
        tipo: newTicketTipo,
        prioridad: newTicketPrioridad,
        modulo: newTicketModulo,
        asunto: newTicketAsunto.trim(),
        descripcion: newTicketDescripcion.trim(),
        solicitanteNombre: newTicketSolicitante.trim() || 'Soporte TI SUMAQ',
        solicitanteEmail: user?.email || 'soporte.ti@sumaqspa.pe',
        solicitanteRol: user?.rol || 'SOPORTE_TI',
        areaCambio: newTicketTipo === 'SOLICITUD_CAMBIO' ? newTicketAreaCambio : undefined,
        tipoCambio: newTicketTipo === 'SOLICITUD_CAMBIO' ? newTicketTipoCambio : undefined,
        impactoRiesgo: newTicketTipo === 'SOLICITUD_CAMBIO' ? newTicketRiesgo : undefined,
        ventanaMantenimiento: newTicketTipo === 'SOLICITUD_CAMBIO' ? newTicketVentana : undefined,
        planRollback: newTicketTipo === 'SOLICITUD_CAMBIO' ? newTicketRollback : undefined
      });
      setIsNewTicketModalOpen(false);
      await Promise.all([loadData(false), fetchKDB()]);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleApproveAccessTicket = async (t: Ticket) => {
    const approver = user?.nombre_completo ? `${user.nombre_completo} (Gerente General)` : 'Rafael Ramirez (Gerente General)';
    await TicketStore.approveTicket(t.id, approver);
    await loadData();
  };

  // Implementación: cab-modal
  const handleOpenCabModal = (t: Ticket) => {
    setCabModalTicket(t);
    setCabAprobadorInput('MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)');
    const sufijo = t.id.split('-').pop() || '050';
    setCabActaInput(`ACTA-CAB-2026-${sufijo}`);
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
      setJiraTestMessage('Credenciales pendientes. Ingrese el dominio y API Token de Atlassian para validar la conexión.');
      return;
    }
    setJiraTestMessage('Conectando con Jira Cloud API v3...');
    const res = await TicketStore.testJiraConnection({
      enabled: formJiraEnabled,
      domain: formJiraDomain,
      email: formJiraEmail,
      apiToken: formJiraToken,
      projectKey: formJiraProject
    });
    if (res.success) {
      setJiraTestMessage('✓ ' + (res.message || 'Conexión verificada con Atlassian Jira Cloud'));
    } else {
      setJiraTestMessage('✗ ' + (res.error || res.message || 'Error validando credenciales de Jira'));
    }
  };

  const openManageModal = (ticket: Ticket) => {
    setManagingTicket(ticket);
    setEditStatus(ticket.estado);
    setEditAsignado(ticket.asignadoA || 'Anthony Luque (AL)');
    setEditResolucion(ticket.resolucionTecnica || '');
    setEditGithubUrl(ticket.githubUrl || '');
    setEditJiraKey(ticket.jiraKey || '');
    setEditKdbCodigo(ticket.kdbCodigo || ticket.kdb_codigo || '');
    setSaveSuccess(false);
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTicket) return;

    if (editStatus === 'RESUELTO') {
      await TicketStore.resolveTicket(managingTicket.id, {
        resolucionTecnica: editResolucion || 'Incidencia atendida y verificada por Soporte TI.',
        asignadoA: editAsignado,
        githubUrl: editGithubUrl,
        jiraKey: editJiraKey,
        kdbCodigo: editKdbCodigo
      });
    } else {
      await TicketStore.updateTicket(managingTicket.id, {
        estado: editStatus,
        asignadoA: editAsignado,
        resolucionTecnica: editResolucion,
        githubUrl: editGithubUrl,
        jiraKey: editJiraKey,
        kdbCodigo: editKdbCodigo,
        jiraUrl: editJiraKey ? `${jiraConfig.domain || 'https://sumaq-dev.atlassian.net'}/browse/${editJiraKey}` : undefined
      });
    }

    setSaveSuccess(true);
    await Promise.all([loadData(false), fetchKDB()]);
    setTimeout(() => {
      setManagingTicket(null);
      setSaveSuccess(false);
    }, 500);
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

  // Filtros reactivos y cómputos para el Dashboard ITIL
  const dashFilteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchModulo = dashFilterModulo === 'TODOS' || t.modulo.toLowerCase().includes(dashFilterModulo.toLowerCase());
      const matchPrioridad = dashFilterPrioridad === 'TODOS' || t.prioridad === dashFilterPrioridad;
      const matchEstado = dashFilterEstado === 'TODOS' || (
        dashFilterEstado === 'RESUELTO' ? t.estado === 'RESUELTO' :
        dashFilterEstado === 'EN_PROCESO' ? t.estado === 'EN_PROCESO' :
        dashFilterEstado === 'ABIERTO' ? (t.estado === 'ABIERTO' || t.estado === 'PENDIENTE_APROBACION') :
        true
      );
      return matchModulo && matchPrioridad && matchEstado;
    });
  }, [tickets, dashFilterModulo, dashFilterPrioridad, dashFilterEstado]);

  // Desglose de Prioridades para Donut Chart (basado en dashFilteredTickets reales)
  const priorityStats = useMemo(() => {
    const list = dashFilteredTickets;
    const total = list.length || 1;
    const alta = list.filter(t => t.prioridad === 'P1_CRITICA' || t.prioridad === 'P2_ALTA').length;
    const media = list.filter(t => t.prioridad === 'P3_MEDIA').length;
    const baja = list.filter(t => t.prioridad === 'P4_BAJA').length;

    const pctAlta = list.length > 0 ? Math.round((alta / total) * 100) : 0;
    const pctMedia = list.length > 0 ? Math.round((media / total) * 100) : 0;
    const pctBaja = list.length > 0 ? Math.max(0, 100 - pctAlta - pctMedia) : 0;

    return {
      total: list.length,
      alta,
      media,
      baja,
      pctAlta,
      pctMedia,
      pctBaja
    };
  }, [dashFilteredTickets]);

  // Desglose por Módulo y Estado para Barras Horizontales Apiladas (100% real desde BD, sin mínimos ficticios)
  const areaEstadoStats = useMemo(() => {
    const buckets: Record<string, { name: string; resueltos: number; enProceso: number; abiertos: number; total: number }> = {};
    for (const t of dashFilteredTickets) {
      const modName = t.modulo || 'Infraestructura & BD';
      if (!buckets[modName]) {
        buckets[modName] = { name: modName, resueltos: 0, enProceso: 0, abiertos: 0, total: 0 };
      }
      if (t.estado === 'RESUELTO' || t.estado === 'APROBADO') {
        buckets[modName].resueltos += 1;
      } else if (t.estado === 'EN_PROCESO') {
        buckets[modName].enProceso += 1;
      } else {
        buckets[modName].abiertos += 1;
      }
      buckets[modName].total += 1;
    }
    return Object.values(buckets).sort((a, b) => b.total - a.total);
  }, [dashFilteredTickets]);

  // Evolución Temporal Dinámica (basada en fechas históricas reales de Jira Cloud / MySQL)
  const evolucionChartData = useMemo(() => {
    const hasFilter = dashFilterModulo !== 'TODOS' || dashFilterPrioridad !== 'TODOS' || dashFilterEstado !== 'TODOS';
    const mesesEs: Record<string, string> = {
      '01': 'ene', '02': 'feb', '03': 'mar', '04': 'abr', '05': 'may', '06': 'jun',
      '07': 'jul', '08': 'ago', '09': 'sep', '10': 'oct', '11': 'nov', '12': 'dic'
    };

    let rawSeries: { fecha: string; label: string; count: number }[] = [];
    if (!hasFilter && computedMetrics.evolucion_temporal && computedMetrics.evolucion_temporal.length > 0) {
      rawSeries = computedMetrics.evolucion_temporal;
    } else {
      const mapByDay: Record<string, { fecha: string; label: string; count: number }> = {};
      for (const t of dashFilteredTickets) {
        const rawDate = (t.fechaCreacion || '').substring(0, 10);
        if (!rawDate || rawDate.length < 10) continue;
        const [yr, mo, dy] = rawDate.split('-');
        const lbl = `${dy} ${mesesEs[mo] || mo} ${yr}`;
        if (!mapByDay[rawDate]) {
          mapByDay[rawDate] = { fecha: rawDate, label: lbl, count: 0 };
        }
        mapByDay[rawDate].count += 1;
      }
      rawSeries = Object.values(mapByDay).sort((a, b) => a.fecha.localeCompare(b.fecha));
    }

    if (rawSeries.length === 0) {
      return { points: [], linePath: '', areaPath: '', yTicks: [0, 5, 10] };
    }

    const maxCount = Math.max(...rawSeries.map(r => r.count), 4);
    const minX = 48;
    const maxX = 482;
    const topY = 28;
    const bottomY = 122;
    const stepX = rawSeries.length > 1 ? (maxX - minX) / (rawSeries.length - 1) : 0;

    const points = rawSeries.map((r, i) => {
      const x = rawSeries.length === 1 ? (minX + maxX) / 2 : Math.round(minX + i * stepX);
      const ratio = r.count / maxCount;
      const y = Math.round(bottomY - ratio * (bottomY - topY));
      return { x, y, val: r.count, label: r.label };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = Math.round((prev.x + curr.x) / 2);
      linePath += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    const areaPath = `${linePath} L ${points[points.length - 1].x} 135 L ${points[0].x} 135 Z`;
    const yTicks = [maxCount, Math.round(maxCount / 2), 1];

    return { points, linePath, areaPath, yTicks };
  }, [dashFilteredTickets, dashFilterModulo, dashFilterPrioridad, dashFilterEstado, computedMetrics.evolucion_temporal]);

  // Matriz de Técnicos Dinámica (calculada en vivo desde los tickets reales)
  const matrizTecnicosRows = useMemo(() => {
    const hasFilter = dashFilterModulo !== 'TODOS' || dashFilterPrioridad !== 'TODOS' || dashFilterEstado !== 'TODOS';
    if (!hasFilter && computedMetrics.matriz_tecnicos && computedMetrics.matriz_tecnicos.length > 0) {
      return computedMetrics.matriz_tecnicos;
    }

    const perfiles = [
      {
        match: ['bryan', 'alexis'],
        nombre: 'Ing. Bryan Mango',
        rol: 'DBA / Especialista Infraestructura N3',
        area: 'Base de Datos MySQL & Redes',
        is_cab: false
      },
      {
        match: ['anthony'],
        nombre: 'Ing. Anthony Luque',
        rol: 'Ingeniero DevOps / Soporte TI N2',
        area: 'Infraestructura, POS & Backend',
        is_cab: false
      },
      {
        match: ['rafael'],
        nombre: 'Ing. Rafael Ramirez',
        rol: 'Arquitecto Cloud / SysAdmin N3',
        area: 'Frontend, APIs & Gobernanza',
        is_cab: false
      },
      {
        match: ['rené', 'rene', 'nieto', 'cab'],
        nombre: 'MBA Mg. Ing. René Nieto',
        rol: 'CAB Chair / Comité de Cambios',
        area: 'Control de Cambios (RFC / CAB)',
        is_cab: true
      }
    ];

    return perfiles.map(perf => {
      const assigned = perf.is_cab
        ? dashFilteredTickets.filter(t => t.tipo === 'SOLICITUD_CAMBIO')
        : dashFilteredTickets.filter(t => perf.match.some(m => (t.asignadoA || '').toLowerCase().includes(m)));
      const total = assigned.length;
      const resueltos = assigned.filter(t => t.estado === 'RESUELTO' || t.estado === 'APROBADO').length;
      const en_curso = total - resueltos;
      return {
        nombre: perf.nombre,
        rol: perf.rol,
        area: perf.area,
        total,
        resueltos,
        en_curso,
        is_cab: perf.is_cab,
        sla_pct: 100
      };
    });
  }, [dashFilteredTickets, dashFilterModulo, dashFilterPrioridad, dashFilterEstado, computedMetrics.matriz_tecnicos]);

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
              onClick={() => handleOpenNewTicketModal(activeViewMode === 'CONTROL_CAMBIOS' ? 'SOLICITUD_CAMBIO' : 'INCIDENCIA')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-500 transition-colors cursor-pointer shadow-xs"
              title="Registrar nuevo Ticket de Mesa de Ayuda o Solicitud de Cambio (RFC)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Nuevo Ticket / RFC</span>
            </button>

            <button
              onClick={handleOpenJiraModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#26201E] hover:bg-[#382E2B] text-[#D8A78D] hover:text-white text-xs font-semibold border border-[#4A3B35] transition-colors cursor-pointer"
              title="Configurar credenciales de Jira Cloud y vinculación con GitHub"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Integración Jira Cloud</span>
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

      {/* Segmented Control de Vistas Principales */}
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
                setActiveViewMode('MONITOREO_EVENTOS');
                fetchMonitoring();
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeViewMode === 'MONITOREO_EVENTOS'
                  ? 'bg-[#1A1615] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Monitoreo & Gestión de Eventos</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeViewMode === 'MONITOREO_EVENTOS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}>
                {monitoringHealth?.resumen_eventos?.total ?? monitoringEvents.length} Eventos
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
            <a
              href="https://sumaq-dev.atlassian.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-blue-900 font-medium transition-colors cursor-pointer"
              title="Abrir Atlassian Jira Cloud v3 de SUMAQ"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Jira Cloud v3: <strong>sumaq-dev.atlassian.net</strong></span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </a>
            <a
              href={window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}:3000`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 hover:bg-amber-100 border border-amber-200 text-amber-900 font-medium transition-colors cursor-pointer"
              title="Abrir Dashboard de Telemetría en Grafana (Puerto 3000)"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Grafana: <strong>Monitoreo :3000</strong></span>
              <ExternalLink className="w-3 h-3 text-amber-500" />
            </a>
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
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Operaciones & Incidentes TI</span>
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                  Dashboard de Gestión de Incidentes y Operaciones en Tecnología de Información (TI)
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Monitoreo continuo de acuerdos de nivel de servicio (SLA), detección algorítmica de causas raíz (RCA) para incidentes recurrentes y radar de gobernanza del Comité de Cambios (CAB).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                <div className="px-3.5 py-2 rounded-xl bg-stone-900 text-stone-100 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs">
                  <Globe className={`w-3.5 h-3.5 text-sky-400 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
                  <span>Sincronización Automática Jira Cloud</span>
                  <span className="text-[10px] text-stone-400 font-mono border-l border-stone-700 pl-2">
                    {lastSyncTime}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sistemas en Operación Normal</span>
                </div>
              </div>
            </div>

            {/* Fila Superior de Métricas Clave (KPIs Ejecutivos - Items Importantes Arriba) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* KPI 1: Total Incidentes */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Total Incidentes</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                    {computedMetrics.total}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">Tickets registrados</p>
                </div>
                <div className="mt-2 text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block w-fit">
                  Mesa de Ayuda & CAB
                </div>
              </div>

              {/* KPI 2: Cerrados / Resueltos */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Cerrados</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 tracking-tight">
                    {computedMetrics.resueltos}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {Math.round((computedMetrics.resueltos / (computedMetrics.total || 1)) * 100)}% de resolución
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block w-fit">
                  Resueltos con éxito
                </div>
              </div>

              {/* KPI 3: En Atención / Abiertos (Cubiertos) */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">En Atención</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-700 tracking-tight">
                    {computedMetrics.en_proceso + computedMetrics.abiertos}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {computedMetrics.en_proceso} curso &middot; {computedMetrics.abiertos} abier.
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block w-fit">
                  Cubiertos en SLA
                </div>
              </div>

              {/* KPI 4: SLA Cumplimiento */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">SLA Promedio</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 tracking-tight">
                    {computedMetrics.sla_cumplimiento_porcentaje}%
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">0 fallas de SLA</p>
                </div>
                <div className="mt-2 text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block w-fit">
                  Ventana N1/N2
                </div>
              </div>

              {/* KPI 5: Gobernanza CAB */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Cambios CAB</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 tracking-tight">
                    {computedMetrics.rfcs_aprobados} / {computedMetrics.total_rfcs}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">100% con rollback</p>
                </div>
                <div className="mt-2 text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-block w-fit">
                  Comité Dictaminado
                </div>
              </div>

              {/* KPI 6: Último Cambio Aprobado */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Último Cambio</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-sm font-mono font-bold text-indigo-900 truncate" title={computedMetrics.ultimo_cambio_por_area.APLICACIONES?.codigo || 'RFC-2026-0042'}>
                    {computedMetrics.ultimo_cambio_por_area.APLICACIONES?.codigo || 'RFC-2026-0042'}
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium truncate mt-0.5" title={computedMetrics.ultimo_cambio_por_area.APLICACIONES?.asunto || 'Réplica MySQL 3309'}>
                    {computedMetrics.ultimo_cambio_por_area.APLICACIONES?.asunto || 'Réplica MySQL 3309'}
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block w-fit">
                  Pase a Producción
                </div>
              </div>
            </div>

            {/* Barra de Filtros Interactivos (Estilo PowerBI adaptado a Web) */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <Filter className="w-4 h-4 text-[#8C6F55]" />
                <span>Filtros Interactivos de Analítica:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {/* Filtro Módulo */}
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E0D7CD]">
                  <span className="text-[11px] text-stone-500 font-semibold">Módulo:</span>
                  <select
                    value={dashFilterModulo}
                    onChange={(e) => setDashFilterModulo(e.target.value)}
                    className="bg-transparent font-medium text-stone-800 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="TODOS">Todos los módulos</option>
                    <option value="Base de Datos">Base de Datos MySQL</option>
                    <option value="Infraestructura">Infraestructura & Red</option>
                    <option value="Seguridad">Seguridad & Auth</option>
                    <option value="Frontend">Frontend & APIs</option>
                    <option value="Soporte">Soporte & Usuarios</option>
                  </select>
                </div>

                {/* Filtro Prioridad */}
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E0D7CD]">
                  <span className="text-[11px] text-stone-500 font-semibold">Prioridad:</span>
                  <select
                    value={dashFilterPrioridad}
                    onChange={(e) => setDashFilterPrioridad(e.target.value)}
                    className="bg-transparent font-medium text-stone-800 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="TODOS">Todas las prioridades</option>
                    <option value="P1_CRITICA">P1 - Crítica</option>
                    <option value="P2_ALTA">P2 - Alta</option>
                    <option value="P3_MEDIA">P3 - Media</option>
                    <option value="P4_BAJA">P4 - Baja</option>
                  </select>
                </div>

                {/* Filtro Estado */}
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E0D7CD]">
                  <span className="text-[11px] text-stone-500 font-semibold">Estado:</span>
                  <select
                    value={dashFilterEstado}
                    onChange={(e) => setDashFilterEstado(e.target.value)}
                    className="bg-transparent font-medium text-stone-800 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="TODOS">Todos los estados</option>
                    <option value="RESUELTO">Cerrados / Resueltos</option>
                    <option value="EN_PROCESO">En Atención</option>
                    <option value="ABIERTO">Abiertos / Pendientes</option>
                  </select>
                </div>

                {(dashFilterModulo !== 'TODOS' || dashFilterPrioridad !== 'TODOS' || dashFilterEstado !== 'TODOS') && (
                  <button
                    onClick={() => {
                      setDashFilterModulo('TODOS');
                      setDashFilterPrioridad('TODOS');
                      setDashFilterEstado('TODOS');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECCIÓN ANALÍTICA: 4 GRÁFICOS PRINCIPALES (ESTILO POWERBI) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gráfico 1 (lg:col-span-7): Área y Estado por Incidentes */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shadow-xs shrink-0">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        Área y Estado por Incidentes
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">Distribución de estados operativos por subsistema técnico</p>
                    </div>
                  </div>
                  {/* Leyenda Horizontal tipo PowerBI */}
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-stone-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cerrado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> En Proceso
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Abierto
                    </span>
                  </div>
                </div>

                {/* Barras Horizontales Apiladas (Calculadas en vivo desde BD) */}
                <div className="space-y-3.5 pt-1">
                  {areaEstadoStats.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">No hay tickets que coincidan con los filtros seleccionados.</p>
                  ) : (
                    areaEstadoStats.map((item, idx) => {
                      const maxVal = Math.max(...areaEstadoStats.map(x => x.total), 1);
                      const pctCerrado = (item.resueltos / maxVal) * 100;
                      const pctProceso = (item.enProceso / maxVal) * 100;
                      const pctAbierto = (item.abiertos / maxVal) * 100;

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-800">{item.name}</span>
                            <span className="text-[11px] font-mono text-stone-500">
                              {item.total} ticket{item.total !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="h-6 w-full bg-stone-100 rounded-lg flex overflow-hidden border border-stone-200/60 p-0.5 gap-0.5">
                            {item.resueltos > 0 && (
                              <div
                                style={{ width: `${pctCerrado}%` }}
                                className="bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center rounded-sm transition-all duration-500"
                                title={`${item.resueltos} Cerrados / Resueltos`}
                              >
                                {item.resueltos}
                              </div>
                            )}
                            {item.enProceso > 0 && (
                              <div
                                style={{ width: `${pctProceso}%` }}
                                className="bg-amber-400 text-stone-900 text-[10px] font-bold flex items-center justify-center rounded-sm transition-all duration-500"
                                title={`${item.enProceso} En Proceso`}
                              >
                                {item.enProceso}
                              </div>
                            )}
                            {item.abiertos > 0 && (
                              <div
                                style={{ width: `${pctAbierto}%` }}
                                className="bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-sm transition-all duration-500"
                                title={`${item.abiertos} Abiertos`}
                              >
                                {item.abiertos}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Gráfico 2 (lg:col-span-5): Prioridad por Incidentes (Donut Chart SVG) */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs flex flex-col justify-between space-y-4">
                <div className="border-b border-stone-100 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80 shadow-xs shrink-0">
                    <PieChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                      Prioridad por Incidentes
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">Volumen clasificado por criticidad según acuerdos SLA</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                  {/* SVG Donut */}
                  <div className="relative w-36 h-36 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                      {/* Fondo */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#F3EFEA"
                        strokeWidth="18"
                      />
                      {/* Slice Alta (P1/P2) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#1E3A8A"
                        strokeWidth="18"
                        strokeDasharray={`${(priorityStats.pctAlta / 100) * 339.292} 339.292`}
                        strokeDashoffset="0"
                        className="transition-all duration-700"
                      />
                      {/* Slice Media (P3) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#EA580C"
                        strokeWidth="18"
                        strokeDasharray={`${(priorityStats.pctMedia / 100) * 339.292} 339.292`}
                        strokeDashoffset={`-${(priorityStats.pctAlta / 100) * 339.292}`}
                        className="transition-all duration-700"
                      />
                      {/* Slice Baja (P4) */}
                      <circle
                        cx="70"
                        cy="70"
                        r="54"
                        fill="transparent"
                        stroke="#0284C7"
                        strokeWidth="18"
                        strokeDasharray={`${(priorityStats.pctBaja / 100) * 339.292} 339.292`}
                        strokeDashoffset={`-${((priorityStats.pctAlta + priorityStats.pctMedia) / 100) * 339.292}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    {/* Centro del Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-serif font-bold text-stone-900 leading-none">
                        {priorityStats.total}
                      </span>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">
                        Incidentes
                      </span>
                    </div>
                  </div>

                  {/* Leyenda Detallada con Porcentajes */}
                  <div className="space-y-2.5 text-xs w-full sm:w-auto">
                    <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#1E3A8A]"></span>
                        <span className="font-semibold text-stone-800">Alta / Crítica</span>
                      </div>
                      <span className="font-mono font-bold text-blue-900">
                        {priorityStats.alta} ({priorityStats.pctAlta}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#EA580C]"></span>
                        <span className="font-semibold text-stone-800">Media</span>
                      </div>
                      <span className="font-mono font-bold text-amber-900">
                        {priorityStats.media} ({priorityStats.pctMedia}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-sky-50/60 border border-sky-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#0284C7]"></span>
                        <span className="font-semibold text-stone-800">Baja</span>
                      </div>
                      <span className="font-mono font-bold text-sky-900">
                        {priorityStats.baja} ({priorityStats.pctBaja}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 text-center">
                  Cálculo basado en acuerdos SLA con matriz de impacto y urgencia ITIL.
                </div>
              </div>
            </div>

            {/* SECCIÓN INFERIOR ANALÍTICA: EVOLUCIÓN TEMPORAL & MATRIZ DE TÉCNICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gráfico 3 (lg:col-span-6): Evolución Anual y Mensual de Incidentes */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200/80 shadow-xs shrink-0">
                      <TrendingUp className="w-5 h-5 text-[#0284C7]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        Evolución Anual y Mensual por Total Incidentes
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">Comportamiento temporal de la demanda en Mesa de Ayuda</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                    Histórico 2026
                  </span>
                </div>

                {/* SVG Curve Chart Dinámico (Fechas históricas reales de Jira Cloud / MySQL) */}
                <div className="w-full overflow-hidden pt-2">
                  {evolucionChartData.points.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-10">Sin registros históricos para los filtros seleccionados.</p>
                  ) : (
                    <svg className="w-full h-44" viewBox="0 0 520 160">
                      <defs>
                        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Guías de fondo horizontales */}
                      <line x1="40" y1="30" x2="490" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" />
                      <line x1="40" y1="76" x2="490" y2="76" stroke="#E2E8F0" strokeDasharray="3 3" />
                      <line x1="40" y1="122" x2="490" y2="122" stroke="#E2E8F0" strokeDasharray="3 3" />

                      {/* Eje Y etiquetas dinámicas */}
                      <text x="28" y="34" fill="#94A3B8" fontSize="10" textAnchor="end">{evolucionChartData.yTicks[0]}</text>
                      <text x="28" y="80" fill="#94A3B8" fontSize="10" textAnchor="end">{evolucionChartData.yTicks[1]}</text>
                      <text x="28" y="126" fill="#94A3B8" fontSize="10" textAnchor="end">{evolucionChartData.yTicks[2]}</text>

                      {/* Área sombreada */}
                      {evolucionChartData.areaPath && (
                        <path d={evolucionChartData.areaPath} fill="url(#curveGrad)" />
                      )}

                      {/* Línea principal */}
                      {evolucionChartData.linePath && (
                        <path
                          d={evolucionChartData.linePath}
                          fill="none"
                          stroke="#0284C7"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Puntos de datos reales con valor y fecha histórica */}
                      {evolucionChartData.points.map((pt, i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r="5.5" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2.5" />
                          <text x={pt.x} y={pt.y - 9} fill="#1E293B" fontSize="10" fontWeight="bold" textAnchor="middle">
                            {pt.val}
                          </text>
                          <text x={pt.x} y="152" fill="#64748B" fontSize="9" textAnchor="middle">
                            {pt.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  )}
                </div>
              </div>

              {/* Tabla 4 (lg:col-span-6): Matriz de Técnicos y Productividad de TI */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/80 shadow-xs shrink-0">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        Matriz de Técnicos & Productividad de TI
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">Asignación operativa y cumplimiento de acuerdos por especialista</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                    Equipo TI Activo
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF8F5] text-stone-600 font-semibold text-[11px] border-b border-[#E6DFD5]">
                      <tr>
                        <th className="py-2.5 px-3">Especialista TI</th>
                        <th className="py-2.5 px-3">Área / Subsistema</th>
                        <th className="py-2.5 px-3 text-center">Tickets</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {matrizTecnicosRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-stone-900">
                            <div>{row.nombre}</div>
                            <span className="text-[10px] text-stone-500 font-normal">{row.rol}</span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">{row.area}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-800 text-center">
                            {row.is_cab ? `${row.total} RFCs` : row.total}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.is_cab ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                                {row.resueltos} Aprobados CAB{row.en_curso > 0 ? ` · ${row.en_curso} Pend.` : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {row.resueltos} Resueltos{row.en_curso > 0 ? ` · ${row.en_curso} En Curso` : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                            {row.sla_pct ?? 100}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                          {prob.kdb_codigo && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              KEDB: {prob.kdb_codigo}
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {prob.incidencias_count} incidencias vinculadas
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
                            Solución Workaround Registrada ({prob.kdb_codigo || 'KEDB'}):
                          </p>
                          <p className="text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                            {prob.solucion_kedb || 'Aplicar procedimiento estándar del catálogo KDB y aislamiento de carga en réplica MySQL Slave (3309).'}
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

                        <div className="flex items-center gap-2">
                          {prob.kdb_codigo && (
                            <button
                              onClick={() => {
                                setActiveViewMode('SERVICE_DESK');
                                setIsKDBOpen(true);
                                setKdbSearchTerm(prob.kdb_codigo || '');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Ver {prob.kdb_codigo}</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveViewMode('CONTROL_CAMBIOS');
                              setSearchTerm(prob.rfc_codigo || 'RFC-2026-0042');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                            <span>Ver RFC ({prob.rfc_codigo || 'RFC-2026-0042'})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN DOBLE: FRECUENCIA POR MÓDULO & RADAR DE CAMBIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card A: Frecuencia de Incidencias por Módulo */}
              <div className="p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80 shadow-xs shrink-0">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        Frecuencia de Incidencias por Módulo
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">Distribución de requerimientos por subsistema técnico</p>
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
                    {computedMetrics.incidencias_por_modulo && computedMetrics.incidencias_por_modulo.length > 0 ? (
                      <>
                        El módulo con mayor volumen de fallas es <strong>{computedMetrics.incidencias_por_modulo[0].modulo}</strong> ({computedMetrics.incidencias_por_modulo[0].percentage}%). 
                        Esto sustenta la priorización operativa y focalización de recursos de soporte en este subsistema.
                      </>
                    ) : (
                      <>No hay incidencias registradas en el periodo actual para formular diagnóstico.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Card B: Última Incidencia & Radar 4 Áreas de Cambio */}
              <div className="space-y-4">
                {/* Mini Card 1: Última Incidencia */}
                <div className="p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/80 shrink-0">
                        <Clock className="w-4 h-4 text-rose-600" />
                      </div>
                      <span className="text-sm font-bold text-stone-900 tracking-wide uppercase">
                        Última Incidencia / Solicitud Registrada
                      </span>
                    </div>
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
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/80 shrink-0">
                        <Award className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-bold text-stone-900 tracking-wide uppercase">
                        Radar de las 4 Áreas de Control de Cambios (CAB)
                      </span>
                    </div>
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
                        {computedMetrics.ultimo_cambio_por_area?.INFRAESTRUCTURA && (
                          <span className="font-mono text-[10px] font-black text-indigo-700">
                            {computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA.codigo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area?.INFRAESTRUCTURA?.asunto || 'Sin cambios en esta área'}
                      </p>
                      {computedMetrics.ultimo_cambio_por_area?.INFRAESTRUCTURA && (
                        <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                          <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            {computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA.estado || 'Registrado'}
                          </span>
                          <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA.cab_acta_numero || ''}>
                            {computedMetrics.ultimo_cambio_por_area.INFRAESTRUCTURA.cab_acta_numero || 'Sin Acta'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. Aplicaciones & BD */}
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                          <Database className="w-3 h-3 text-blue-600" /> Aplicaciones & BD
                        </span>
                        {computedMetrics.ultimo_cambio_por_area?.APLICACIONES && (
                          <span className="font-mono text-[10px] font-black text-blue-700">
                            {computedMetrics.ultimo_cambio_por_area.APLICACIONES.codigo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area?.APLICACIONES?.asunto || 'Sin cambios en esta área'}
                      </p>
                      {computedMetrics.ultimo_cambio_por_area?.APLICACIONES && (
                        <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                          <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            {computedMetrics.ultimo_cambio_por_area.APLICACIONES.estado || 'Registrado'}
                          </span>
                          <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.APLICACIONES.cab_acta_numero || ''}>
                            {computedMetrics.ultimo_cambio_por_area.APLICACIONES.cab_acta_numero || 'Sin Acta'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3. Documentación */}
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-amber-600" /> Documentación
                        </span>
                        {computedMetrics.ultimo_cambio_por_area?.DOCUMENTACION && (
                          <span className="font-mono text-[10px] font-black text-amber-700">
                            {computedMetrics.ultimo_cambio_por_area.DOCUMENTACION.codigo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area?.DOCUMENTACION?.asunto || 'Sin cambios en esta área'}
                      </p>
                      {computedMetrics.ultimo_cambio_por_area?.DOCUMENTACION && (
                        <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                          <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            {computedMetrics.ultimo_cambio_por_area.DOCUMENTACION.estado || 'Registrado'}
                          </span>
                          <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.DOCUMENTACION.cab_acta_numero || ''}>
                            {computedMetrics.ultimo_cambio_por_area.DOCUMENTACION.cab_acta_numero || 'Sin Acta'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 4. Calendario */}
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-rose-600" /> Calendario Freeze
                        </span>
                        {computedMetrics.ultimo_cambio_por_area?.CALENDARIO && (
                          <span className="font-mono text-[10px] font-black text-rose-700">
                            {computedMetrics.ultimo_cambio_por_area.CALENDARIO.codigo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-700 line-clamp-1 font-medium">
                        {computedMetrics.ultimo_cambio_por_area?.CALENDARIO?.asunto || 'Sin cambios en esta área'}
                      </p>
                      {computedMetrics.ultimo_cambio_por_area?.CALENDARIO && (
                        <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                          <span className="font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            {computedMetrics.ultimo_cambio_por_area.CALENDARIO.estado || 'Registrado'}
                          </span>
                          <span className="truncate max-w-[110px]" title={computedMetrics.ultimo_cambio_por_area.CALENDARIO.cab_acta_numero || ''}>
                            {computedMetrics.ultimo_cambio_por_area.CALENDARIO.cab_acta_numero || 'Sin Acta'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: INCIDENCIAS & SOLICITUDES PENDIENTES (MONITOREO DE SLAS) */}
            <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden space-y-3 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200/80 shadow-xs shrink-0">
                    <Clock className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                      Incidencias y Solicitudes Pendientes (SLA en Vivo)
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">Requerimientos en proceso que exigen atención dentro del tiempo acordado</p>
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

        {activeViewMode === 'MONITOREO_EVENTOS' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header de Monitoreo y Gestión de Eventos */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1A1615] via-[#26201E] to-[#362922] text-white border border-[#4A3B35] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>ITIL v4 Monitoring & Event Management</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <Server className="w-3.5 h-3.5" />
                    <span>Telemetría en Tiempo Real</span>
                  </span>
                </div>
                <h2 className="text-lg font-serif font-bold tracking-wide">
                  Centro de Monitoreo de Infraestructura y Gestión de Eventos
                </h2>
                <p className="text-xs text-[#D5C3B3] leading-relaxed">
                  Detección temprana de cambios de estado en los componentes de SUMAQ Spa, correlación y evaluación cuantitativa contra políticas de umbrales (Informativo, Advertencia, Error, Crítico) y generación automatizada de incidentes P1/P2 con su respectivo plan de respuesta.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => fetchMonitoring()}
                  disabled={isLoadingMonitoring}
                  className="px-4 py-2 rounded-xl bg-[#8C6F55] hover:bg-[#725943] text-white text-xs font-bold transition-all shadow flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingMonitoring ? 'animate-spin' : ''}`} />
                  <span>{isLoadingMonitoring ? 'Consultando...' : 'Actualizar Telemetría'}</span>
                </button>
              </div>
            </div>

            {/* Bloque 1: Telemetría de Salud de Servicios en Vivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tarjeta 1: Base de Datos MySQL */}
              <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Base de Datos Activa</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    monitoringHealth?.servicios.database.online !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {monitoringHealth?.servicios.database.online !== false ? 'ONLINE · 3308' : 'CRÍTICO'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {monitoringHealth?.servicios.database.latencia_ms ?? 1.4} ms
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    Motor: {monitoringHealth?.servicios.database.engine || 'MYSQL / SQLITE'}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(12, ((monitoringHealth?.servicios.database.latencia_ms ?? 2) / 400) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-500 font-mono">
                  {monitoringHealth?.servicios.database.umbral || 'Normal < 400 ms | Warning 400-1000 ms'}
                </p>
              </div>

              {/* Tarjeta 2: Memoria Física RAM */}
              <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-blue-600" />
                    <span>Memoria RAM Servidor</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (monitoringHealth?.servicios.memory.used_pct ?? 64) > 95
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : (monitoringHealth?.servicios.memory.used_pct ?? 64) >= 85
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : (monitoringHealth?.servicios.memory.used_pct ?? 64) >= 75
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {monitoringHealth?.servicios.memory.nivel || 'INFO'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {monitoringHealth?.servicios.memory.used_pct ?? 64.0}%
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {monitoringHealth?.servicios.memory.used_gb ?? 10.2} / {monitoringHealth?.servicios.memory.total_gb ?? 16.0} GB
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (monitoringHealth?.servicios.memory.used_pct ?? 64) > 95
                        ? 'bg-red-600'
                        : (monitoringHealth?.servicios.memory.used_pct ?? 64) >= 85
                        ? 'bg-orange-500'
                        : (monitoringHealth?.servicios.memory.used_pct ?? 64) >= 75
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, monitoringHealth?.servicios.memory.used_pct ?? 64)}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-500 font-mono">
                  Info 60-75% | Warning 75-85% | Crítico &gt; 95%
                </p>
              </div>

              {/* Tarjeta 3: Almacenamiento en Disco */}
              <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Partición de Disco</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (monitoringHealth?.servicios.disk.used_pct ?? 58) > 95
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : (monitoringHealth?.servicios.disk.used_pct ?? 58) >= 85
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : (monitoringHealth?.servicios.disk.used_pct ?? 58) >= 75
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {monitoringHealth?.servicios.disk.nivel || 'INFO'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {monitoringHealth?.servicios.disk.used_pct ?? 58.0}%
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {monitoringHealth?.servicios.disk.free_gb ?? 42.0} GB Libres
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (monitoringHealth?.servicios.disk.used_pct ?? 58) > 95
                        ? 'bg-red-600'
                        : (monitoringHealth?.servicios.disk.used_pct ?? 58) >= 85
                        ? 'bg-orange-500'
                        : (monitoringHealth?.servicios.disk.used_pct ?? 58) >= 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, monitoringHealth?.servicios.disk.used_pct ?? 58)}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-500 font-mono">
                  Info 60-75% | Warning 75-85% | Crítico &gt; 95%
                </p>
              </div>

              {/* Tarjeta 4: Motor Caché Redis & API Backend */}
              <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Caché & API Gateway</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    HTTP 200 OK
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {monitoringHealth?.servicios.cache_api.latencia_ms ?? 0.4} ms
                  </span>
                  <span className="text-[11px] font-semibold text-stone-500">
                    Heartbeat Activo
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full w-1/4" />
                </div>
                <p className="text-[10px] text-stone-500 font-mono">
                  Sonda cada 15s · Sesiones JWT & Caché Activo
                </p>
              </div>
            </div>

            {/* Bloque 2: Clasificación de Eventos y Contadores de Umbral */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-[#E6DFD5] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase">Total Eventos</p>
                  <p className="text-xl font-black text-stone-900 font-mono">
                    {monitoringHealth?.resumen_eventos.total ?? monitoringEvents.length}
                  </p>
                  <p className="text-[10px] text-stone-500">Bitácora TI</p>
                </div>
                <Activity className="w-6 h-6 text-stone-400" />
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-sky-800 uppercase">Informativo (Info)</p>
                  <p className="text-xl font-black text-sky-900 font-mono">
                    {monitoringHealth?.resumen_eventos.info ?? monitoringEvents.filter(e => e.nivel === 'INFO').length}
                  </p>
                  <p className="text-[10px] text-sky-700 font-mono">Umbral: 60% – 75%</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-sky-600" />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-amber-800 uppercase">Advertencia (Warning)</p>
                  <p className="text-xl font-black text-amber-900 font-mono">
                    {monitoringHealth?.resumen_eventos.warning ?? monitoringEvents.filter(e => e.nivel === 'WARNING').length}
                  </p>
                  <p className="text-[10px] text-amber-700 font-mono">Umbral: 75% – 85%</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-orange-800 uppercase">Excepción / Error</p>
                  <p className="text-xl font-black text-orange-900 font-mono">
                    {monitoringHealth?.resumen_eventos.error ?? monitoringEvents.filter(e => e.nivel === 'ERROR').length}
                  </p>
                  <p className="text-[10px] text-orange-700 font-mono">Umbral: 85% – 95%</p>
                </div>
                <AlertOctagon className="w-6 h-6 text-orange-600" />
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <p className="text-[10px] font-bold text-rose-800 uppercase">Crítico (&gt; 95%)</p>
                  <p className="text-xl font-black text-rose-900 font-mono">
                    {monitoringHealth?.resumen_eventos.critical ?? monitoringEvents.filter(e => e.nivel === 'CRITICAL').length}
                  </p>
                  <p className="text-[10px] text-rose-700 font-bold">
                    {monitoringHealth?.resumen_eventos.incidentes_generados ?? monitoringEvents.filter(e => e.generaIncidente || e.genera_incidente).length} Incidentes creados
                  </p>
                </div>
                <Flame className="w-6 h-6 text-rose-600" />
              </div>
            </div>

            {/* Bloque 3: Políticas de Monitoreo de Umbrales y Matriz de Priorización */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tabla de Políticas de Monitoreo (7 columnas) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 bg-[#1A1615] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Políticas de Monitoreo y Criterios de Umbrales
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#D8A78D] bg-[#2E2420] px-2 py-0.5 rounded border border-[#4A3B35]">
                    Evaluación Continua
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-100 text-stone-600 text-[10px] uppercase font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Métrica / Componente</th>
                        <th className="py-2.5 px-2.5 text-sky-800">Info</th>
                        <th className="py-2.5 px-2.5 text-amber-800">Warning</th>
                        <th className="py-2.5 px-2.5 text-orange-800">Error</th>
                        <th className="py-2.5 px-2.5 text-rose-800">Crítico</th>
                        <th className="py-2.5 px-2.5 text-center">Muestreo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(monitoringHealth?.politicas_monitoreo || [
                        {
                          metrica: 'Uso de CPU del Servidor / Contenedor',
                          componente: 'Django REST API / Host',
                          umbral_info: '60% – 75%',
                          umbral_warning: '75% – 85%',
                          umbral_error: '85% – 95%',
                          umbral_critical: '> 95%',
                          intervalo: '30 seg'
                        },
                        {
                          metrica: 'Consumo de Memoria RAM',
                          componente: 'Contenedores Docker / Host',
                          umbral_info: '60% – 75%',
                          umbral_warning: '75% – 85%',
                          umbral_error: '85% – 95%',
                          umbral_critical: '> 95%',
                          intervalo: '30 seg'
                        },
                        {
                          metrica: 'Ocupación de Almacenamiento en Disco',
                          componente: 'Partición Base de Datos / Logs',
                          umbral_info: '60% – 75%',
                          umbral_warning: '75% – 85%',
                          umbral_error: '85% – 95%',
                          umbral_critical: '> 95%',
                          intervalo: '5 min'
                        },
                        {
                          metrica: 'Tiempo de Respuesta / Latencia DB',
                          componente: 'MySQL Master (3308) / Slave (3309)',
                          umbral_info: '< 400 ms',
                          umbral_warning: '400 – 1000 ms',
                          umbral_error: '1000 – 2500 ms',
                          umbral_critical: '> 2500 ms',
                          intervalo: '15 seg'
                        },
                        {
                          metrica: 'Intentos Fallidos de Inicio de Sesión',
                          componente: 'Seguridad & Autenticación JWT',
                          umbral_info: '< 10 / min',
                          umbral_warning: '10 – 30 / min',
                          umbral_error: '30 – 60 / min',
                          umbral_critical: '> 60 / min',
                          intervalo: '60 seg'
                        }
                      ]).map((pol, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/80">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-stone-900">{pol.metrica}</p>
                            <p className="text-[10px] text-stone-500">{pol.componente}</p>
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-[11px] text-sky-800 font-semibold">{pol.umbral_info}</td>
                          <td className="py-2.5 px-2.5 font-mono text-[11px] text-amber-800 font-semibold">{pol.umbral_warning}</td>
                          <td className="py-2.5 px-2.5 font-mono text-[11px] text-orange-800 font-semibold">{pol.umbral_error}</td>
                          <td className="py-2.5 px-2.5 font-mono text-[11px] text-rose-800 font-bold">{pol.umbral_critical}</td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-stone-600">{pol.intervalo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matriz de Priorización y Flujo de Atención (5 columnas) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-4 bg-[#1A1615] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Matriz de Priorización (Impacto × Urgencia)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300">SLA Operativo</span>
                  </div>
                  <div className="p-4">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-stone-100 text-stone-700 font-bold text-center">
                          <th className="p-2 border border-stone-200 text-left">Impacto \ Urgencia</th>
                          <th className="p-2 border border-stone-200">Urgencia Alta</th>
                          <th className="p-2 border border-stone-200">Urgencia Media</th>
                          <th className="p-2 border border-stone-200">Urgencia Baja</th>
                        </tr>
                      </thead>
                      <tbody className="text-center font-mono">
                        <tr>
                          <td className="p-2 border border-stone-200 font-sans font-bold text-stone-800 text-left">Impacto Alto</td>
                          <td className="p-2 border border-stone-200 bg-rose-100 text-rose-900 font-black">P1 · Crítica (2h)</td>
                          <td className="p-2 border border-stone-200 bg-orange-100 text-orange-900 font-bold">P2 · Alta (8h)</td>
                          <td className="p-2 border border-stone-200 bg-amber-50 text-amber-900 font-semibold">P3 · Media (24h)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-stone-200 font-sans font-bold text-stone-800 text-left">Impacto Medio</td>
                          <td className="p-2 border border-stone-200 bg-orange-100 text-orange-900 font-bold">P2 · Alta (8h)</td>
                          <td className="p-2 border border-stone-200 bg-amber-50 text-amber-900 font-semibold">P3 · Media (24h)</td>
                          <td className="p-2 border border-stone-200 bg-stone-50 text-stone-700">P4 · Baja (48h)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-stone-200 font-sans font-bold text-stone-800 text-left">Impacto Bajo</td>
                          <td className="p-2 border border-stone-200 bg-amber-50 text-amber-900 font-semibold">P3 · Media (24h)</td>
                          <td className="p-2 border border-stone-200 bg-stone-50 text-stone-700">P4 · Baja (48h)</td>
                          <td className="p-2 border border-stone-200 bg-stone-50 text-stone-700">P4 · Baja (48h)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Flujo BPMN Resumido de Gestión de Eventos */}
                <div className="px-4 pb-4">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6DFD5] space-y-1.5">
                    <p className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                      Flujo de Atención de Eventos (9 Etapas)
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      <strong>1.</strong> Generación &rarr; <strong>2.</strong> Detección &rarr; <strong>3.</strong> Filtrado &rarr; <strong>4.</strong> Correlación &rarr; <strong>5.</strong> Clasificación &rarr; <strong>6.</strong> Evaluación de Umbral &rarr; <strong>7.</strong> ¿Genera Incidente? (Sí: Auto-Ticket P1/P2 | No: Bitácora) &rarr; <strong>8.</strong> Acción de Respuesta &rarr; <strong>9.</strong> Cierre y Mejora.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 4: Evaluador e Ingesta de Lecturas de Monitoreo en Vivo */}
            <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#8C6F55]" />
                    <span>Evaluador de Lecturas de Telemetría y Disparo Automático de Incidentes</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Registre una lectura de monitoreo para evaluarla contra la matriz de políticas. Si el valor alcanza el rango de Error (85%–95%) o Crítico (&gt;95%), el motor genera y vincula automáticamente el Ticket de Incidente en la base de datos.
                  </p>
                </div>
              </div>

              {evalFeedback && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  evalFeedback.type === 'critical'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : evalFeedback.type === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-sky-50 border-sky-300 text-sky-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{evalFeedback.message}</span>
                  </div>
                  {evalFeedback.ticketId && (
                    <button
                      type="button"
                      onClick={() => {
                        const found = tickets.find(t => t.id === evalFeedback.ticketId);
                        if (found) {
                          openManageModal(found);
                        } else {
                          setActiveViewMode('SERVICE_DESK');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      Ver Ticket {evalFeedback.ticketId}
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleEvaluateMonitoring} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Componente Origen</label>
                  <select
                    value={evalComponente}
                    onChange={(e) => setEvalComponente(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5] font-semibold text-stone-800"
                  >
                    <option value="MYSQL_MASTER">MySQL Master (3308)</option>
                    <option value="MYSQL_SLAVE">MySQL Slave (3309)</option>
                    <option value="BACKEND_API">Django REST API (8000)</option>
                    <option value="NGINX_GATEWAY">Servidor Web Nginx</option>
                    <option value="REDIS_CACHE">Motor Redis (6379)</option>
                    <option value="HOST_SISTEMA">Recursos de Servidor / Host</option>
                    <option value="SEGURIDAD_AUTH">Seguridad & Autenticación</option>
                    <option value="PASARELA_NIUBIZ">Pasarela de Pagos Niubiz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Métrica Monitoreada</label>
                  <select
                    value={evalMetrica}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEvalMetrica(val);
                      if (val.includes('Latencia')) {
                        setEvalUnidad('ms');
                        setEvalValor('1850');
                      } else if (val.includes('Intentos')) {
                        setEvalUnidad('intentos');
                        setEvalValor('25');
                      } else {
                        setEvalUnidad('%');
                        setEvalValor('96.0');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5] font-semibold text-stone-800"
                  >
                    <option value="Uso de CPU del Servidor">Uso de CPU del Servidor (%)</option>
                    <option value="Consumo de Memoria RAM">Consumo de Memoria RAM (%)</option>
                    <option value="Ocupación de Almacenamiento en Disco">Ocupación de Disco (%)</option>
                    <option value="Latencia de Respuesta Base de Datos">Latencia Base de Datos (ms)</option>
                    <option value="Tasa de Errores HTTP 5xx">Tasa de Errores HTTP 5xx (%)</option>
                    <option value="Intentos Fallidos de Inicio de Sesión">Intentos Fallidos Login (intentos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Valor & Unidad</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={evalValor}
                      onChange={(e) => setEvalValor(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-mono font-bold text-stone-900"
                    />
                    <select
                      value={evalUnidad}
                      onChange={(e) => setEvalUnidad(e.target.value)}
                      className="p-2.5 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5] font-mono font-bold text-stone-700"
                    >
                      <option value="%">%</option>
                      <option value="ms">ms</option>
                      <option value="intentos">int.</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Proceso de Negocio</label>
                  <input
                    type="text"
                    required
                    value={evalProceso}
                    onChange={(e) => setEvalProceso(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Detalle / Observación</label>
                  <input
                    type="text"
                    value={evalDescripcion}
                    onChange={(e) => setEvalDescripcion(e.target.value)}
                    placeholder="Descripción opcional del evento..."
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isEvaluating}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1A1615] hover:bg-[#322A27] text-white font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isEvaluating ? 'Evaluando...' : 'Evaluar y Registrar'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Bloque 5: Bitácora de Eventos, Identificación de Incidentes y Plan de Respuesta */}
            <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Bitácora de Eventos, Identificación de Incidentes y Plan de Respuesta
                  </h3>
                  <p className="text-xs text-stone-500">
                    Registro persistente en base de datos (<code className="font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded">ti_eventos_monitoreo</code>) con clasificación, justificación de incidente, prioridad asignada y responsable operativo.
                  </p>
                </div>

                {/* Filtros de Bitácora */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={monFilterNivel}
                    onChange={(e) => setMonFilterNivel(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5] font-semibold text-stone-800"
                  >
                    <option value="TODOS">Nivel: Todos</option>
                    <option value="INFO">Informativo (Info)</option>
                    <option value="WARNING">Advertencia (Warning)</option>
                    <option value="ERROR">Excepción / Error</option>
                    <option value="CRITICAL">Crítico (Critical)</option>
                  </select>

                  <select
                    value={monFilterComponente}
                    onChange={(e) => setMonFilterComponente(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5] font-semibold text-stone-800"
                  >
                    <option value="TODOS">Componente: Todos</option>
                    <option value="MYSQL_MASTER">MySQL Master (3308)</option>
                    <option value="BACKEND_API">Django REST API</option>
                    <option value="NGINX_GATEWAY">Servidor Web Nginx</option>
                    <option value="HOST_SISTEMA">Servidor Host / Disco</option>
                    <option value="SEGURIDAD_AUTH">Seguridad & Auth</option>
                    <option value="REDIS_CACHE">Motor Redis (6379)</option>
                  </select>

                  <select
                    value={monFilterIncidente}
                    onChange={(e) => setMonFilterIncidente(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5] font-semibold text-stone-800"
                  >
                    <option value="TODOS">¿Genera Incidente?: Todos</option>
                    <option value="SI">Sí Genera Incidente</option>
                    <option value="NO">No Genera Incidente</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={monSearchTerm}
                      onChange={(e) => setMonSearchTerm(e.target.value)}
                      placeholder="Buscar código, métrica, ticket..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800 w-52"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-600 text-[10px] uppercase font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Evento / Nivel</th>
                      <th className="py-3 px-3">Componente & Métrica</th>
                      <th className="py-3 px-3">Lectura / Umbral</th>
                      <th className="py-3 px-3">¿Genera Incidente? & Justificación</th>
                      <th className="py-3 px-3">Priorización</th>
                      <th className="py-3 px-4">Plan de Respuesta & Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {monitoringEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-stone-400">
                          No se encontraron eventos de monitoreo con los criterios seleccionados.
                        </td>
                      </tr>
                    ) : (
                      monitoringEvents.map((ev) => {
                        const isInc = ev.generaIncidente ?? ev.genera_incidente;
                        const tCode = ev.ticketCodigo || ev.ticket_codigo || '';
                        const valReg = ev.valorRegistrado || ev.valor_registrado || '';
                        const umbRef = ev.umbralReferencia || ev.umbral_referencia || '';
                        const justif = ev.justificacionIncidente || ev.justificacion_incidente || '';
                        const accResp = ev.accionRespuesta || ev.accion_respuesta || '';
                        const tMax = ev.tiempoRespuestaMax || ev.tiempo_respuesta_max || '15 min';
                        const prio = ev.prioridadAsignada || ev.prioridad_asignada || 'N/A';

                        return (
                          <tr key={ev.id} className="hover:bg-stone-50/80 align-top">
                            <td className="py-3.5 px-4 whitespace-nowrap space-y-1.5">
                              <div className="font-mono font-black text-stone-900">{ev.codigo}</div>
                              <div>
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  ev.nivel === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                    : ev.nivel === 'ERROR'
                                    ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                    : ev.nivel === 'WARNING'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-sky-100 text-sky-900 border border-sky-300'
                                }`}>
                                  {ev.nivelDisplay || ev.nivel}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono">
                                {ev.fechaDeteccion || (ev.created_at ? ev.created_at.substring(0, 19).replace('T', ' ') : '')}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 max-w-xs space-y-1">
                              <div className="font-bold text-stone-900">{ev.metrica}</div>
                              <div className="text-[11px] font-semibold text-[#8C6F55]">
                                {ev.componenteDisplay || ev.componente}
                              </div>
                              <p className="text-[11px] text-stone-600 leading-snug">{ev.descripcion}</p>
                              <div className="text-[10px] text-stone-500">
                                Proceso: <strong className="text-stone-700">{ev.procesoNegocio || ev.proceso_negocio}</strong>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap space-y-1">
                              <span className="inline-block font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-stone-900 text-white">
                                {valReg}
                              </span>
                              <p className="text-[10px] text-stone-500 font-mono max-w-[170px] whitespace-normal">
                                {umbRef}
                              </p>
                            </td>

                            <td className="py-3.5 px-3 max-w-xs space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  isInc
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-stone-200 text-stone-700'
                                }`}>
                                  {isInc ? 'SÍ GENERA INCIDENTE' : 'NO GENERA INCIDENTE'}
                                </span>
                                {tCode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const linked = tickets.find(t => t.id === tCode);
                                      if (linked) {
                                        openManageModal(linked);
                                      } else {
                                        setActiveViewMode('SERVICE_DESK');
                                      }
                                    }}
                                    className="font-mono text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                                  >
                                    {tCode}
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-600 leading-snug">{justif}</p>
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap space-y-1">
                              {isInc ? (
                                <>
                                  <div>{getPriorityBadge(prio as TicketPriority)}</div>
                                  <div className="text-[10px] text-stone-500 font-mono">
                                    Impacto: <strong>{ev.impacto}</strong>
                                  </div>
                                  <div className="text-[10px] text-stone-500 font-mono">
                                    Urgencia: <strong>{ev.urgencia}</strong>
                                  </div>
                                </>
                              ) : (
                                <span className="text-[11px] text-stone-400 font-mono">No aplica (Solo Evento)</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 max-w-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-stone-800">{ev.responsable}</span>
                                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px] font-bold">
                                  Máx: {tMax}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 leading-snug">{accResp}</p>
                              <div className="flex items-center justify-between pt-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ev.estado === 'CERRADO' || ev.estado === 'MITIGADO'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {ev.estadoDisplay || ev.estado}
                                </span>
                                {(ev.estado === 'ACTIVO' || ev.estado === 'ESCALADO') && (
                                  <button
                                    type="button"
                                    onClick={() => handleMitigateEvent(ev)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold cursor-pointer"
                                  >
                                    Marcar Mitigado
                                  </button>
                                )}
                              </div>
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
        {/* VISTA 3: CONTROL DE CAMBIOS RFC / CAB (ITIL v4)                           */}
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
                    Gobernanza del Comité de Control de Cambios (CAB - Change Advisory Board)
                  </h2>
                </div>
                <p className="text-xs text-[#C9B29B] max-w-3xl leading-relaxed">
                  Evaluación multidimensional de impacto, ventanas de mantenimiento nocturnas y planes de contingencia (rollback) para las <strong>4 Áreas de Cambio</strong>: Infraestructura (Switch/Router/VLANs), Aplicaciones y Base de Datos, Documentación y Calendario.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-[#EDE5DC]">
                  <span className="bg-[#2E2420] px-2.5 py-0.5 rounded-md border border-[#4A3B35] text-[#D8A78D] font-semibold">
                    Presidente CAB: MBA Mg. Ing. René Alonso Nieto Valencia
                  </span>
                  <span>&middot;</span>
                  <span>Enfoque ITIL v4: Habilitación de Cambios & Continuidad</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => handleOpenNewTicketModal('SOLICITUD_CAMBIO')}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold border border-rose-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Nuevo RFC</span>
                </button>
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
                            <span>Dictamen Comité CAB</span>
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
                <button
                  onClick={() => handleOpenNewTicketModal('INCIDENCIA')}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nuevo Ticket</span>
                </button>
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

            {/* SECCIÓN INTERACTIVA: BASE DE CONOCIMIENTO (KDB / KNOWN ERROR DATABASE - ITIL v4) */}
            <div className="bg-gradient-to-r from-amber-50/70 via-white to-blue-50/50 p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                    <BookOpen className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-stone-900">
                        Base de Conocimiento (KDB) &middot; Soluciones Estándar & Workarounds N1
                      </h3>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono font-bold border border-indigo-200">
                        ITIL KEDB v4
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-mono font-bold border border-blue-200 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Jira Service Desk KDB
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Diccionario operativo de errores conocidos, causas raíz y procedimientos rápidos probados para que Nivel 1 resuelva incidentes recurrentes en &le; 5 minutos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={handleOpenNewKdb}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Artículo KDB</span>
                  </button>
                  <button
                    onClick={() => setIsKDBOpen(!isKDBOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>{isKDBOpen ? 'Ocultar KDB' : `Explorar KDB (${kdbArticles.length} Soluciones)`}</span>
                    {isKDBOpen ? <ChevronUp className="w-3.5 h-3.5 text-stone-500" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-500" />}
                  </button>
                </div>
              </div>

              {isKDBOpen && (
                <div className="space-y-4 pt-2 border-t border-amber-200/60 animate-fadeIn">
                  {/* Filtro y Búsqueda de Artículos KDB */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Buscar solución en BD por síntoma, error (502, 401, deadlock, kardex)..."
                          value={kdbSearchTerm}
                          onChange={(e) => setKdbSearchTerm(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-900 shadow-2xs"
                        />
                      </div>

                      {/* Filtro por Categoría */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                        {['TODOS', 'INFRAESTRUCTURA', 'SEGURIDAD', 'BASE_DE_DATOS', 'APLICACIONES'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setKdbSelectedCategory(cat)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                              kdbSelectedCategory === cat
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {cat === 'TODOS' ? 'Todas las Categorías' :
                             cat === 'BASE_DE_DATOS' ? 'Base de Datos' :
                             cat === 'INFRAESTRUCTURA' ? 'Infraestructura' :
                             cat === 'SEGURIDAD' ? 'Seguridad & Auth' : 'Aplicaciones'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtro por Nivel de Prioridad */}
                    <div className="flex items-center gap-2 pt-1 text-xs overflow-x-auto">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-stone-400" /> Prioridad:
                      </span>
                      {[
                        { id: 'TODOS', label: 'Todas' },
                        { id: 'P1_CRITICA', label: 'P1 - Crítica', color: 'border-red-300 text-red-800 hover:bg-red-50' },
                        { id: 'P2_ALTA', label: 'P2 - Alta', color: 'border-orange-300 text-orange-800 hover:bg-orange-50' },
                        { id: 'P3_MEDIA', label: 'P3 - Media', color: 'border-blue-300 text-blue-800 hover:bg-blue-50' },
                        { id: 'P4_BAJA', label: 'P4 - Baja', color: 'border-stone-300 text-stone-800 hover:bg-stone-50' }
                      ].map((p) => {
                        const isSelected = kdbSelectedPriority === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setKdbSelectedPriority(p.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                : `bg-white ${p.color || 'border-stone-200 text-stone-600 hover:bg-stone-100'}`
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid de Tarjetas de Soluciones KDB */}
                  {isLoadingKDB ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-500 text-xs">
                      Consultando artículos en la Base de Conocimiento...
                    </div>
                  ) : kdbArticles.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-stone-300 text-stone-500 text-xs">
                      No se encontraron artículos en la Base de Conocimiento para los filtros aplicados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {kdbArticles.map((art) => {
                        const isCopied = copiedKDBId === art.codigo;
                        const prioridadStr = String(art.prioridad || '');
                        const causa = art.causaRaiz || art.causa_raiz || '';
                        const solucion = art.solucionWorkaround || art.solucion_workaround || '';
                        const tiempo = art.tiempoEstimado || art.tiempo_estimado || '< 5 min';
                        const jira = art.jiraRef || art.jira_ref || '';
                        const veces = art.vecesUtilizado ?? art.veces_utilizado ?? 0;
                        const linkedTickets = art.ticketsVinculados || art.tickets_vinculados || [];

                        return (
                          <div
                            key={art.codigo}
                            className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {art.codigo}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                                    {tiempo}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    prioridadStr.includes('P1') ? 'bg-red-100 text-red-800 border border-red-200' :
                                    prioridadStr.includes('P2') ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                    'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {prioridadStr.replace('_', ' ')}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200" title="Número real de tickets vinculados a este artículo KDB en MySQL">
                                    {veces} uso{veces !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              <h4 className="text-xs font-bold text-stone-900 leading-snug">
                                {art.titulo}
                              </h4>

                              <div className="mt-2.5 space-y-1.5 text-[11px]">
                                <p className="text-stone-600">
                                  <strong className="text-red-700 font-semibold">Síntoma: </strong>
                                  {art.sintoma}
                                </p>
                                <p className="text-stone-600">
                                  <strong className="text-stone-800 font-semibold">Causa Raíz: </strong>
                                  {causa}
                                </p>
                              </div>

                              {/* Detalle del Workaround */}
                              <div className="mt-3 p-2.5 rounded-lg bg-stone-900 text-stone-100 text-[10px] font-mono leading-relaxed overflow-x-auto border border-stone-800">
                                <div className="flex items-center justify-between text-stone-400 mb-1 border-b border-stone-800 pb-1">
                                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                    <Zap className="w-3 h-3 text-amber-400" /> Receta de Resolución N1
                                  </span>
                                  {jira && (
                                    <a
                                      href={`${jiraConfig.domain || 'https://sumaq-dev.atlassian.net'}/browse/${jira}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9px] text-sky-400 hover:text-sky-300 font-mono underline flex items-center gap-1"
                                      title="Ver tarjeta vinculada en Jira Cloud"
                                    >
                                      <span>Jira: {jira}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                                <pre className="whitespace-pre-wrap font-mono text-[10.5px] text-emerald-300">
                                  {solucion}
                                </pre>
                              </div>

                              {/* Tickets Vinculados a este KDB */}
                              {linkedTickets.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap items-center gap-1">
                                  <span className="text-[9px] font-bold text-stone-500 uppercase">Tickets vinculados:</span>
                                  {linkedTickets.slice(0, 5).map((tCode) => (
                                    <button
                                      key={tCode}
                                      type="button"
                                      onClick={() => setSearchTerm(tCode)}
                                      className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 cursor-pointer"
                                      title="Filtrar ticket en la lista inferior"
                                    >
                                      {tCode}
                                    </button>
                                  ))}
                                  {linkedTickets.length > 5 && (
                                    <span className="text-[9px] text-stone-500 font-mono">+{linkedTickets.length - 5}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-stone-400 font-medium truncate">
                                Módulo: <strong>{art.modulo}</strong>
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditKdb(art)}
                                  className="p-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                  title="Editar artículo KDB"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKdbArticle(art)}
                                  className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                  title="Eliminar artículo KDB"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyWorkaround(art)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                                    isCopied
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                  }`}
                                  title="Copiar solución técnica para aplicarla al ticket"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-stone-500" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, Jira (KAN-X), KDB, solicitante, módulo..."
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
                  displayedTickets.map((t) => {
                    const tKdb = t.kdbCodigo || t.kdb_codigo || '';
                    return (
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
                            {t.jiraKey && (
                              <a
                                href={t.jiraUrl || `${jiraConfig.domain || 'https://sumaq-dev.atlassian.net'}/browse/${t.jiraKey}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
                                title="Abrir ticket en Jira Cloud"
                              >
                                <Globe className="w-3 h-3 text-blue-600" />
                                <span>Jira: {t.jiraKey}</span>
                              </a>
                            )}
                            {tKdb && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsKDBOpen(true);
                                  setKdbSearchTerm(tKdb);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                                title="Ver artículo KDB vinculado"
                              >
                                <BookOpen className="w-3 h-3 text-amber-700" />
                                <span>{tKdb}</span>
                              </button>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-stone-900 leading-snug">{t.asunto}</h4>
                          <p className="text-xs text-stone-600 line-clamp-2">{t.descripcion}</p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 pt-1">
                            <span>Solicitante: <strong className="text-stone-700">{t.solicitanteNombre}</strong> ({t.solicitanteRol})</span>
                            <span>Módulo: <strong className="text-stone-700">{t.modulo}</strong></span>
                            {t.asignadoA && (
                              <span>Asignado a: <strong className="text-stone-800">{t.asignadoA}</strong></span>
                            )}
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
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Resolución TI ({t.asignadoA || 'Técnico'}){tKdb ? ` [${tKdb}]` : ''}: {t.resolucionTecnica}</span>
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
                    );
                  })
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
                    Comité CAB &middot; Sesión de Dictamen y Aprobación
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
                    Presidente o representante autorizado del Comité de Cambios (CAB).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                    N° de Acta del Comité CAB
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
                  <span>¡Actualización persistida en MySQL y sincronizada con Jira Cloud!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    list="especialistas-ti-list"
                    value={editAsignado}
                    onChange={(e) => setEditAsignado(e.target.value)}
                    placeholder="Ej: Bryan Alexis Mango (BT)"
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800 font-semibold"
                  />
                  <datalist id="especialistas-ti-list">
                    <option value="Bryan Alexis Mango (BT)" />
                    <option value="Anthony Luque (AL)" />
                    <option value="Rafael Ramirez Quiroz (RQ)" />
                    <option value="MBA Mg. Ing. René Alonso Nieto Valencia (CAB Chair)" />
                  </datalist>
                </div>
              </div>

              {/* Vinculación directa con Base de Conocimiento (KDB) */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-amber-950 uppercase flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Artículo KDB Aplicado (Incrementa uso +1 en BD)</span>
                  </label>
                  {editKdbCodigo && (
                    <button
                      type="button"
                      onClick={() => {
                        const foundKdb = kdbArticles.find(k => k.codigo === editKdbCodigo);
                        if (foundKdb) {
                          const sol = foundKdb.solucionWorkaround || foundKdb.solucion_workaround || '';
                          setEditResolucion(`[${foundKdb.codigo}] ${sol}`);
                        }
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                    >
                      Insertar Workaround en Resolución
                    </button>
                  )}
                </div>
                <select
                  value={editKdbCodigo}
                  onChange={(e) => setEditKdbCodigo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-semibold text-stone-800"
                >
                  <option value="">-- Sin artículo KDB vinculado --</option>
                  {kdbArticles.map((art) => (
                    <option key={art.codigo} value={art.codigo}>
                      [{art.codigo}] {art.titulo} ({art.vecesUtilizado ?? art.veces_utilizado ?? 0} usos · Jira: {art.jiraRef || art.jira_ref || 'KAN'})
                    </option>
                  ))}
                </select>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Clave de Ticket en Jira Cloud
                  </label>
                  <input
                    type="text"
                    value={editJiraKey}
                    onChange={(e) => setEditJiraKey(e.target.value)}
                    placeholder="KAN-10, KAN-12..."
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">
                    Enlace Pull Request en GitHub
                  </label>
                  <input
                    type="url"
                    value={editGithubUrl}
                    onChange={(e) => setEditGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-800 font-mono text-[11px]"
                  />
                </div>
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
                  Guardar en Base de Datos & Jira
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

      {/* ========================================================================= */}
      {/* MODAL 4: CREAR / EDITAR ARTÍCULO DE BASE DE CONOCIMIENTO (KDB)            */}
      {/* ========================================================================= */}
      {isKdbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="bg-[#1A1615] text-white p-5 flex items-center justify-between border-b border-[#382E2B]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold">
                    {editingKdbArticle ? `Editar Artículo ${editingKdbArticle.codigo}` : 'Nuevo Artículo de Base de Conocimiento (KDB)'}
                  </h3>
                  <p className="text-[11px] text-[#C9B29B]">
                    Registro en MySQL (<code className="font-mono">ti_kdb_articulos</code>) y vinculación con Jira Cloud ({jiraConfig.projectKey || 'KAN'})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsKdbModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKdbArticle} className="flex-1 p-6 overflow-y-auto space-y-3.5">
              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Título de la Solución / Error Conocido</label>
                <input
                  type="text"
                  required
                  value={kdbFormTitulo}
                  onChange={(e) => setKdbFormTitulo(e.target.value)}
                  placeholder="Ej: Error de Timeout en Pasarela de Pagos o Saturación de Pool MySQL"
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Categoría Técnica</label>
                  <select
                    value={kdbFormCategoria}
                    onChange={(e) => setKdbFormCategoria(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-semibold text-stone-800"
                  >
                    <option value="BASE_DE_DATOS">Base de Datos</option>
                    <option value="INFRAESTRUCTURA">Infraestructura</option>
                    <option value="SEGURIDAD">Seguridad & Auth</option>
                    <option value="APLICACIONES">Aplicaciones</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Módulo Afectado</label>
                  <input
                    type="text"
                    required
                    value={kdbFormModulo}
                    onChange={(e) => setKdbFormModulo(e.target.value)}
                    placeholder="Ej: Base de Datos MySQL"
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Prioridad ITIL</label>
                  <select
                    value={kdbFormPrioridad}
                    onChange={(e) => setKdbFormPrioridad(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-semibold text-stone-800"
                  >
                    <option value="P1_CRITICA">P1 - Crítica</option>
                    <option value="P2_ALTA">P2 - Alta</option>
                    <option value="P3_MEDIA">P3 - Media</option>
                    <option value="P4_BAJA">P4 - Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Tiempo Estimado</label>
                  <input
                    type="text"
                    value={kdbFormTiempo}
                    onChange={(e) => setKdbFormTiempo(e.target.value)}
                    placeholder="< 5 min"
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Clave Jira (KAN-X)</label>
                  <input
                    type="text"
                    value={kdbFormJiraRef}
                    onChange={(e) => setKdbFormJiraRef(e.target.value)}
                    placeholder="Vacío = Auto-crear en Jira"
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-mono text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Síntoma Detectado</label>
                <textarea
                  rows={2}
                  required
                  value={kdbFormSintoma}
                  onChange={(e) => setKdbFormSintoma(e.target.value)}
                  placeholder="Descripción del síntoma que reporta el usuario o el monitor..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Diagnóstico de Causa Raíz (RCA)</label>
                <textarea
                  rows={2}
                  required
                  value={kdbFormCausaRaiz}
                  onChange={(e) => setKdbFormCausaRaiz(e.target.value)}
                  placeholder="Causa técnica subyacente..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Receta de Resolución / Workaround N1</label>
                <textarea
                  rows={4}
                  required
                  value={kdbFormSolucion}
                  onChange={(e) => setKdbFormSolucion(e.target.value)}
                  placeholder="1. Paso uno...\n2. Paso dos..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-mono text-stone-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsKdbModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingKdb}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow cursor-pointer"
                >
                  {isSavingKdb ? 'Guardando...' : editingKdbArticle ? 'Guardar Cambios KDB' : 'Crear Artículo KDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REGISTRAR NUEVO TICKET / RFC DESDE PORTAL TI                     */}
      {/* ========================================================================= */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E6DFD5] rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="bg-[#1A1615] text-white p-5 flex items-center justify-between border-b border-[#382E2B]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold">
                    Registrar Nuevo Ticket / Solicitud de Cambio (RFC)
                  </h3>
                  <p className="text-[11px] text-[#C9B29B]">
                    Creación simultánea en MySQL (<code className="font-mono">ti_tickets</code>) y Atlassian Jira Cloud ({jiraConfig.projectKey || 'KAN'})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTicketFromTI} className="flex-1 p-6 overflow-y-auto space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Tipo de Registro ITIL</label>
                  <select
                    value={newTicketTipo}
                    onChange={(e) => setNewTicketTipo(e.target.value as TicketType)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-semibold text-stone-800"
                  >
                    <option value="INCIDENCIA">Incidencia Técnica (INC)</option>
                    <option value="SOLICITUD_SERVICIO">Solicitud de Servicio (REQ)</option>
                    <option value="SOLICITUD_ACCESO">Solicitud de Acceso (REQ)</option>
                    <option value="SOLICITUD_INFORMACION">Solicitud de Información (REQ)</option>
                    <option value="SOLICITUD_CAMBIO">Control de Cambios (RFC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Prioridad & Acuerdo SLA</label>
                  <select
                    value={newTicketPrioridad}
                    onChange={(e) => setNewTicketPrioridad(e.target.value as TicketPriority)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-semibold text-stone-800"
                  >
                    <option value="P1_CRITICA">P1 - Crítica (SLA 2h)</option>
                    <option value="P2_ALTA">P2 - Alta (SLA 8h)</option>
                    <option value="P3_MEDIA">P3 - Media (SLA 24h)</option>
                    <option value="P4_BAJA">P4 - Baja (SLA 48h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Módulo / Subsistema</label>
                  <select
                    value={newTicketModulo}
                    onChange={(e) => setNewTicketModulo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white font-semibold text-stone-800"
                  >
                    <option value="Base de Datos MySQL">Base de Datos MySQL</option>
                    <option value="Infraestructura & BD">Infraestructura & BD</option>
                    <option value="Punto de Venta / Caja">Punto de Venta / Caja</option>
                    <option value="Seguridad & Auth">Seguridad & Auth</option>
                    <option value="Usuarios & Roles">Usuarios & Roles</option>
                    <option value="Redes & Hardware">Redes & Hardware</option>
                    <option value="Frontend & APIs">Frontend & APIs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Solicitante</label>
                  <input
                    type="text"
                    required
                    value={newTicketSolicitante}
                    onChange={(e) => setNewTicketSolicitante(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                  />
                </div>
              </div>

              {newTicketTipo === 'SOLICITUD_CAMBIO' && (
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-rose-900 uppercase mb-1">Área de Cambio</label>
                      <select
                        value={newTicketAreaCambio}
                        onChange={(e) => setNewTicketAreaCambio(e.target.value as AreaCambio)}
                        className="w-full p-2 rounded-lg border border-rose-200 bg-white font-semibold text-stone-800"
                      >
                        <option value="INFRAESTRUCTURA">1. Infraestructura</option>
                        <option value="APLICACIONES">2. Aplicaciones & BD</option>
                        <option value="DOCUMENTACION">3. Documentación</option>
                        <option value="CALENDARIO">4. Calendario</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-rose-900 uppercase mb-1">Tipo de Cambio</label>
                      <select
                        value={newTicketTipoCambio}
                        onChange={(e) => setNewTicketTipoCambio(e.target.value as TipoCambio)}
                        className="w-full p-2 rounded-lg border border-rose-200 bg-white font-semibold text-stone-800"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="ESTANDAR">Estándar</option>
                        <option value="EMERGENCIA">Emergencia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-rose-900 uppercase mb-1">Nivel de Riesgo</label>
                      <select
                        value={newTicketRiesgo}
                        onChange={(e) => setNewTicketRiesgo(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-rose-200 bg-white font-semibold text-stone-800"
                      >
                        <option value="BAJO">Bajo</option>
                        <option value="MEDIO">Medio</option>
                        <option value="ALTO">Alto</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-rose-900 uppercase mb-1">Ventana de Mantenimiento</label>
                      <input
                        type="text"
                        value={newTicketVentana}
                        onChange={(e) => setNewTicketVentana(e.target.value)}
                        className="w-full p-2 rounded-lg border border-rose-200 bg-white text-stone-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-rose-900 uppercase mb-1">Plan de Rollback</label>
                      <input
                        type="text"
                        value={newTicketRollback}
                        onChange={(e) => setNewTicketRollback(e.target.value)}
                        className="w-full p-2 rounded-lg border border-rose-200 bg-white text-stone-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Asunto del Requerimiento / Incidente</label>
                <input
                  type="text"
                  required
                  value={newTicketAsunto}
                  onChange={(e) => setNewTicketAsunto(e.target.value)}
                  placeholder="Descripción breve y clara del requerimiento o incidente..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Descripción Técnica Detallada</label>
                <textarea
                  rows={3}
                  required
                  value={newTicketDescripcion}
                  onChange={(e) => setNewTicketDescripcion(e.target.value)}
                  placeholder="Detalles técnicos, impacto operativo y pasos reproducibles..."
                  className="w-full p-2.5 rounded-xl border border-[#E6DFD5] bg-white text-stone-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTicket}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow cursor-pointer"
                >
                  {isCreatingTicket ? 'Registrando en MySQL & Jira...' : 'Crear y Sincronizar con Jira'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
