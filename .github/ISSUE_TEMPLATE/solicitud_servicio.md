---
name: "Solicitud de Servicio (Catálogo, BOM y Operaciones)"
about: "Para solicitar altas o ajustes de servicios de spa, recetas de insumos o tareas técnicas."
title: "[SERVICIO] REQ-2026-XXXX: "
labels: ["solicitud-servicio", "service-desk"]
assignees: []
---

### 1. Datos Generales de la Solicitud
* **Fecha:** DD/MM/AAAA
* **Solicitante:** <!-- Nombre del colaborador -->
* **Área:** <!-- Administración / Cabinas / Terapeutas -->
* **Nivel de Prioridad (SLA):**
  - [ ] **P1 - Crítica:** Falla o interrupción en el catálogo de reservas web en vivo. (SLA: 2h)
  - [ ] **P2 - Alta:** Corrección de precios o insumos con venta en curso. (SLA: 4h)
  - [ ] **P3 - Media:** Publicación de nuevo ritual o ajuste de receta estándar. (SLA: 12h)
  - [ ] **P4 - Baja:** Actualización de fotos o descripciones comerciales. (SLA: 24h)

---

### 2. Clasificación del Requerimiento
- [ ] Alta de Nuevo Tratamiento en Catálogo Web
- [ ] Modificación de Receta de Insumos (Bill of Materials - BOM)
- [ ] Ajuste de Precios o Tiempos de Duración
- [ ] Mantenimiento Técnico / Backup Extraordinario en Azure

---

### 3. Ficha Técnica del Servicio / Cambio Propuesto
* **Nombre del Tratamiento:** <!-- Ej. Ritual Geotermal con Piedras Volcánicas -->
* **Precio al Público (S/):** <!-- Ej. S/ 160.00 (Incluye 18% IGV) -->
* **Duración de la Sesión:** <!-- 60 min / 90 min / 120 min -->
* **Cabina(s) Apta(s):** <!-- Cabina 1, 2 o 3 -->
* **Receta de Insumos Requeridos por Sesión (BOM):**
  | Insumo / Producto | Cantidad por Cita | Unidad de Medida | ¿Stock disponible en Kárdex? |
  |---|:---:|:---:|:---:|
  | <!-- Ej. Aceite de Eucalipto --> | <!-- 30 --> | <!-- ml --> | [ ] Sí / [ ] No |
  | <!-- Ej. Toallas descartables --> | <!-- 2 --> | <!-- unidades --> | [ ] Sí / [ ] No |

---

### 4. Visto Bueno Administrativo
* **Aprobación de Costos y Viabilidad:**
  - [ ] Aprobado por Administración
  - [ ] Observado / Pendiente de revisión
* **Firma / Responsable:** <!-- Nombre del aprobador -->

---

### 5. Checklist de Implementación (Soporte N2)
- [ ] Registro creado en tabla servicios y verificado en la API REST.
- [ ] Receta vinculada en tabla recetas_servicio con claves foráneas RESTRICT.
- [ ] Verificación en dev: Descuento correcto en Kárdex al completar la cita.
- [ ] Prueba de rollback: Validación de que no permita cerrar si hay stock insuficiente.
- [ ] Verificación visual en la web de producción (68.155.146.110/servicios).
