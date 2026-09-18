# GUÍA DE DESARROLLO — MÓDULO 2: GESTIÓN TRANSACCIONAL DE CITAS, INVENTARIO Y FINANZAS
**Sistema:** SUMAQ Spa & Centro de Bienestar — Plataforma Web Integral
**Rama de Trabajo:** `feature/backend-gestion-citas-inventario-finanzas`
**Rama Base:** `feature/backend-core-autenticacion-catalogos` (o `main` una vez integrado el Módulo 1)
**Objetivo:** Desarrollar el motor transaccional de reservas de citas con bloqueo pesimista contra doble reserva, regla de negocio de 1 cita por DNI al día, endpoints de autogestión de citas para clientes (con regla de 24 horas), portal de terapeutas con fichas de atención clínica, descuento automático de inventario (BOM), dashboard financiero de analítica y generación de comprobantes PDF.

---

## 1. Contexto del Negocio y Reglas Críticas
Heredando la estructura base y los modelos de catálogo implementados en el Módulo 1, este desarrollo aborda el núcleo transaccional del spa:

### Reglas de Negocio Obligatorias:
1. **Control de Concurrencia (Bloqueo Pesimista):** Implementar `select_for_update()` en transacciones atómicas (`@transaction.atomic`) para evitar colisiones cuando múltiples usuarios intenten reservar el mismo terapeuta o cabina en el mismo slot horario.
2. **Límite de 1 Cita por DNI/Día:** Ningún cliente puede tener más de una cita activa (`PENDIENTE`, `CONFIRMADA`, `EN_ATENCION`) en la misma fecha calendario.
3. **Autogestión Web de Citas (Regla de 24 Horas):** El cliente puede consultar, cancelar y reprogramar su cita desde la web sin necesidad de registrar cuenta de usuario. Tanto la cancelación como la reprogramación exigen un mínimo de **24 horas de anticipación** respecto a la hora de inicio de la cita.
4. **Descuento de Insumos por Receta (BOM):** Al completar una atención médica (`POST /api/atencion/completar-cita/{id}/`), se deben descontar del Kárdex los insumos correspondientes a la receta del servicio (`RecetaServicio`) y servicios adicionales. Si el stock es insuficiente, se cancela la operación con un *Rollback* total.
5. **Comprobantes PDF:** El servicio de generación de PDF debe admitir autenticación vía parámetro URL (`?token=<jwt>`) para permitir descargas o aperturas directas en pestañas del navegador mediante `window.open()`.

---

## 2. Flujo de Trabajo en Git

```bash
# 1. Ubicarse en el proyecto
cd d:\Projects\Antigravity-projects\SUMAQ

# 2. Asegurarse de tener la rama base actualizada
git checkout feature/backend-core-autenticacion-catalogos
git pull origin feature/backend-core-autenticacion-catalogos

# 3. Crear la rama de trabajo para el Módulo 2
git checkout -b feature/backend-gestion-citas-inventario-finanzas

# 4. Validar el estado de la rama
git status
```

---

## 3. Especificaciones Técnicas y Módulos a Desarrollar

### 3.1. Motor Transaccional de Citas y Reservas (`apps/appointments/`)
* **Modelo `Cita`:**
  * Campos: `codigo` (alfanumérico único, ej. `SUMAQ-2026-9876`), `cliente` (FK `Cliente`), `servicio` (FK `Servicio`), `terapeuta` (FK `Terapeuta`), `cabina` (FK `Cabina`), `fecha` (DateField), `hora_inicio` (TimeField), `hora_fin` (TimeField), `estado` (`PENDIENTE`, `CONFIRMADA`, `EN_ATENCION`, `COMPLETADA`, `CANCELADA`, `NO_ASISTIO`), `precio_base`, `descuento_aplicado`, `monto_total`, `promocion_aplicada` (FK opcional `Promocion`), `notas_cliente`, `created_at`.
  * Índices compuestos: `['fecha', 'hora_inicio']`, `['cliente', 'fecha']`, `['terapeuta', 'fecha']`.
* **Clase `ReservaService` (`apps/appointments/services.py`):**
  * `crear_reserva_web(...)`:
    1. Bloquea con `select_for_update()` los registros de terapeuta y cabina.
    2. Valida disponibilidad del slot.
    3. Valida la regla de 1 cita por DNI por día.
    4. Aplica descuento de cupón si aplica.
    5. Guarda la cita en estado `CONFIRMADA`.
    6. Genera el registro de ingreso en caja (`MovimientoCaja`).
  * `cancelar_cita_web(identificador, dni)`:
    * Verifica propiedad de la cita mediante DNI.
    * Valida que falten `>= 24 horas` para la cita.
    * Pasa la cita a `CANCELADA` y libera los recursos.
  * `reprogramar_cita_web(identificador, dni, nueva_fecha, nueva_hora)`:
    * Valida anticipación de 24 horas.
    * Valida disponibilidad del nuevo horario y actualiza la cita atómicamente.
* **Endpoints:**
  * `POST /api/citas/reserva-web/`: Creación pública de citas.
  * `POST /api/citas/consultar/`: Consulta pública de cita por DNI y código.
  * `POST /api/citas/cancelar-web/`: Cancelación de cita con regla de 24h.
  * `POST /api/citas/reprogramar-web/`: Reprogramación de cita con regla de 24h.
  * `GET /api/citas/{id}/comprobante-pdf/`: Descarga de comprobante de pago en PDF.
  * `GET /api/citas/{id}/ficha-pdf/`: Descarga de ficha de atención en PDF.
  * `GET/POST/PUT/DELETE /api/citas/`: CRUD para recepción y administración.

---

### 3.2. Módulo de Inventario y Kárdex (`apps/inventory/`)
* **Modelo `Producto`:**
  * Campos: `sku`, `nombre`, `descripcion`, `categoria` (`ACEITES`, `ESENCIAS`, `CREMAS`, `MASCARILLAS`, `DESCARTABLES`), `stock_actual`, `stock_minimo`, `precio_unitario`, `unidad_medida`, `activo`.
  * Propiedad calculada `estado_stock`: Retorna `'AGOTADO'` si stock <= 0, `'CRITICO'` si stock <= stock_minimo, `'NORMAL'` en otros casos.
* **Modelo `MovimientoInventario`:**
  * Campos: `producto` (FK `Producto`), `tipo_movimiento` (`INGRESO`, `EGRESO_ATENCION`, `AJUSTE`, `MERMA`), `cantidad`, `stock_previo`, `stock_posterior`, `motivo`, `fecha_hora`, `usuario` (FK `User`).
* **Endpoints:**
  * `GET /api/inventario/`: Listado de insumos con semáforo de stock.
  * `POST /api/inventario/ajuste/`: Ajuste manual de stock registrando Kárdex.
  * `GET /api/inventario/kardex/`: Historial de transacciones de inventario.
  * `GET /api/terapeuta/inventario/`: Vista simplificada para terapeutas.

---

### 3.3. Módulo de Atención Clínica (`apps/attention/`)
* **Modelo `FichaAtencion`:**
  * Campos: `cita` (OneToOne con `Cita`), `alergias`, `nivel_presion_preferido` (`SUAVE`, `MEDIO`, `FUERTE`), `zonas_dolor_enfoque`, `observaciones_diagnostico`, `recomendaciones_post`, `firma_digital_consentimiento`, `fecha_atencion`.
* **Modelo `ServicioAdicionalAtencion`:**
  * Campos: `ficha` (FK `FichaAtencion`), `servicio` (FK `Servicio`), `precio_cobrado`.
* **Clase `AtencionService` (`apps/attention/services.py`):**
  * `completar_atencion(cita_id, terapeuta_user, ficha_data, servicios_adicionales)`:
    1. Registra o actualiza la `FichaAtencion`.
    2. Recorre las recetas BOM de los servicios atendidos.
    3. Descuenta insumos mediante `MovimientoInventario(tipo='EGRESO_ATENCION')`.
    4. Si algún insumo carece de stock, lanza `ValidationError` provocando `Rollback`.
    5. Cambia el estado de la cita a `COMPLETADA`.
* **Endpoints:**
  * `GET /api/terapeuta/mi-agenda/`: Lista de citas asignadas al terapeuta autenticado.
  * `GET /api/terapeuta/citas/{id}/`: Detalle de la cita para el terapeuta.
  * `POST /api/atencion/iniciar-cita/{id}/`: Pasa la cita a `EN_ATENCION`.
  * `POST /api/atencion/completar-cita/{id}/`: Completa la atención y descuenta insumos.

---

### 3.4. Módulo Financiero, Reportes y Dashboard (`apps/finance/`)
* **Modelo `MovimientoCaja`:**
  * Campos: `cita` (FK opcional `Cita`), `tipo` (`INGRESO`, `EGRESO`), `monto`, `metodo_pago` (`EFECTIVO`, `TARJETA`, `TRANSFERENCIA`, `YAPE_PLIN`), `concepto`, `fecha_hora`, `usuario` (FK `User`).
* **Endpoints:**
  * `GET /api/caja/movimientos/`: Registro y consulta de transacciones de caja.
  * `GET /api/admin/dashboard/`: Resumen de KPIs en tiempo real (`ingresos_mes`, `citas_hoy`, `clientes_nuevos`, `stock_critico`) y gráfico de tendencia de 7 días.
  * `GET /api/admin/reportes/`: Reporte financiero consolidado con desglose por método de pago y por terapeuta con filtros por fecha.

---

### 3.5. Generador de Documentos PDF (`apps/common/pdf.py`)
* Implementar generador de PDF con **ReportLab** con diseño corporativo SUMAQ Spa:
  * Comprobante de reserva con código de seguimiento, datos del cliente, cabina, terapeuta y desglose monetario.
  * Ficha clínica de atención con antecedentes, recomendaciones y espacio para firma digital.
  * Soporte para descarga directa vía token en URL con `QueryParamJWTAuthentication`.

---

## 4. Validación de Calidad y Pruebas
Ejecutar la suite de pruebas transaccionales y de concurrencia:

```bash
pytest backend/tests/test_appointments.py backend/tests/test_concurrency.py backend/tests/test_inventory_attention.py backend/tests/test_finance_dashboard.py backend/tests/test_pdf.py -v
```

Criterios de Aceptación:
1. `test_concurrency.py`: 5 intentos simultáneos de reserva para el mismo slot producen exactamente 1 reserva confirmada y 4 rechazos limpios por colisión (400), sin inconsistencias en BD.
2. `test_appointments.py`: La segunda reserva para un mismo DNI en la misma fecha es rechazada con código 400. La cancelación con más de 24h es aprobada y con menos de 24h es rechazada.
3. `test_inventory_attention.py`: Completar atención descuenta stock correctamente en Kárdex. Si no hay suficiente stock, se anula la operación y la cita permanece en su estado anterior.
4. `test_finance_dashboard.py`: KPIs y series de tiempo calculan montos exactos.
5. `test_pdf.py`: Streaming binario de PDF con cabecera `application/pdf`.

---

## 5. Cierre y Preparación de la Entrega
```bash
git add backend/
git commit -m "feat(business-logic): implementar motor transaccional de citas, autogestion 24h, kardex de inventario BOM, dashboard financiero y comprobantes PDF"
```
