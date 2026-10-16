---
name: "Solicitud de Información (Reportes y Datos)"
about: "Para solicitar extracción de métricas de ventas, kárdex contable o auditoría de citas."
title: "[INFORMACIÓN] REQ-2026-XXXX: "
labels: ["solicitud-informacion", "service-desk"]
assignees: []
---

### 1. Datos Generales de la Solicitud
* **Fecha:** DD/MM/AAAA
* **Solicitante:** <!-- Nombre del colaborador o auditor -->
* **Cargo / Entidad:** <!-- Contabilidad / Gerencia / Auditor Externo -->
* **Nivel de Prioridad (SLA):**
  - [ ] **P2 - Alta:** Información requerida para cierre fiscal o auditoría inmediata. (SLA: 4h)
  - [ ] **P3 - Media:** Reporte mensual estándar de caja o comisiones. (SLA: 12h)
  - [ ] **P4 - Baja:** Estadísticas históricas de años o trimestres anteriores. (SLA: 24h)

---

### 2. Alcance de la Información Solicitada
* **Tipo de Información:**
  - [ ] Consolidado de Ventas y Movimientos de Caja POS (Libro diario)
  - [ ] Trazabilidad de Kárdex y Consumo de Insumos (Entradas/Salidas)
  - [ ] Métricas de Ocupación y Cancelaciones de Cabinas
  - [ ] Auditoría de Accesos y Logs del Sistema
* **Periodo de Extracción:**
  * Fecha Inicio: `AAAA-MM-DD`
  * Fecha Fin: `AAAA-MM-DD`
* **Formato de Entrega Solicitado:**
  - [ ] Excel protegido con contraseña
  - [ ] Reporte PDF oficial
  - [ ] Archivo CSV exportado
* **Propósito / Uso de los Datos:**
  <!-- Ej. Conciliación tributaria mensual con el contador externo de la sede. -->

---

### 3. Verificación de Seguridad y Confidencialidad
> *Nota: Ningún reporte con datos sensibles de clientes o fichas dermatológicas se entrega sin validación formal.*
* **Nivel de Confidencialidad:**
  - [ ] Uso Interno del Spa
  - [ ] Confidencial (Datos financieros / Médicos)
* **Acuerdo de Confidencialidad (NDA) firmado:** [ ] Sí / [ ] No aplica
* **Autorizado por:** <!-- Nombre del Gerente o Administrador -->

---

### 4. Control de Extracción Técnica (Soporte N2)
- [ ] Consulta SQL ejecutada estrictamente en el Nodo Esclavo (MySQL Slave puerto 3309) para no generar sobrecarga ni bloqueos en el motor de reservas online.
- [ ] Verificación de que no se expongan contraseñas ni datos protegidos por la Ley de Protección de Datos Personales.
- [ ] Archivo cifrado y transmitido por canal seguro institucional.
- [ ] Registro de entrega archivado en el log de auditoría del Service Desk.
