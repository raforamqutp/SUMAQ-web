# 📘 GUÍA DE DEMOSTRACIÓN Y SUSTENTACIÓN PASO A PASO
## Sistema Web: SUMAQ SPA — Curso Integrador II (Semana 07)

> **Ubicación:** `DemostracionPasos.md` (Disponible en la raíz del proyecto y en Descargas)  
> **Propósito:** Guía práctica y completa para el expositor. Contiene explicaciones sencillas, comandos exactos de copiar y pegar, **pasos manuales rápidos (30 segundos)** para demostrar cada punto en vivo en pantalla, y las **justificaciones teóricas/arquitectónicas** para aquellos riesgos organizacionales o de infraestructura que no se ejecutan físicamente en software.

---

## 🧭 MAPA RÁPIDO DE LOS 5 PUNTOS DE LA EVALUACIÓN

```
1. LISTA DE RIESGOS DEFINIDOS        ➡️ ¿Qué peligros amenazan al spa? (Técnicos y Humanos).
2. IMPLEMENTACIÓN DE CONTROLES       ➡️ Candados (Preventivos), Alarmas (Detectivos) y Extintores (Correctivos).
3. LISTA DE ATAQUES (OWASP)          ➡️ Payloads reales y cómo el sistema los bloquea.
4. ESTRATEGIA DE SEGURIDAD           ➡️ Tokens JWT, RBAC por roles, hashing de claves y variables .env.
5. ESTRATEGIA DE DEFENSA EN VIVO     ➡️ Batería de 18 tests pytest, monitor en tiempo real y flujo web.
```

---

# 1️⃣ PASO 1: LISTA DE RIESGOS DEFINIDOS

### 💡 ¿Cómo explicarlo con palabras sencillas al profesor?
> *"Profesor, un riesgo es cualquier evento que amenace la continuidad operativa del spa, la integridad del dinero en caja o la confidencialidad médica de los pacientes. Basados en la norma ISO 27005 y OWASP, los clasificamos en dos naturalezas: **Técnicos** (vulnerabilidades de código e infraestructura) y **Humanos** (fallas operativas y descuidos del personal)."*

---

## A. RIESGOS TÉCNICOS (Fallas de Software o Infraestructura)

---

### 1. Inyección SQL (RT01)
* **¿Qué es?:** Un atacante escribe comandos SQL en las cajas de texto buscando vulnerar la autenticación o extraer datos privados.
* **✅ ¿Cómo demostrarlo manualmente en vivo (30 seg)?:**
  * **Método 1 (En el Login):**
    1. Abre la web: `http://localhost:5173/login`.
    2. En **Correo Electrónico**, escribe con formato de correo: `admin@sumaqspa.pe' OR '1'='1' --` *(Ojo: debe llevar `@` para superar la primera capa de validación del navegador)*.
    3. En **Contraseña**, escribe: `cualquiera` y dale a **Iniciar Sesión**.
    4. **Resultado visible:** El sistema muestra una alerta roja *"Credenciales inválidas o cuenta inactiva"*. No arroja error 500 ni permite el acceso.
  * **Método 2 (En Consultar Cita - Texto libre):**
    1. Entra a `http://localhost:5173/mis-citas`.
    2. En la caja de búsqueda escribe: `' OR 1=1 --` y dale a **Consultar Reserva**.
    3. **Resultado visible:** Responde *"No se encontraron reservas con los datos ingresados"*, tratándolo como texto plano inofensivo.
* **Explicación técnica:** Django ORM utiliza sentencias preparadas (*parameterized queries*); los caracteres especiales no alteran la sintaxis SQL.

---

### 2. Doble Reserva por Concurrencia (RT02)
* **¿Qué es?:** Dos clientes intentan reservar la misma cabina y terapeuta en el mismo turno horario al mismo milisegundo.
* **✅ ¿Cómo demostrarlo manualmente en vivo?:**
  * **Opción A (Automatizada en 2 segundos):**
    ```bash
    cd backend
    python -m pytest tests/test_concurrency.py
    ```
    *Resultado:* Muestra `test_concurrency_anti_double_booking PASSED` demostrando que ante 2 hilos paralelos, solo 1 reserva tiene éxito y la otra es rechazada.
  * **Opción B (Manual en navegador):**
    1. Abre `http://localhost:5173/reservar` en Chrome y en una ventana de incógnito.
    2. En ambas ventanas selecciona la misma fecha, terapeuta y horario (ej. 10:00 AM).
    3. Confirma la primera reserva. Al intentar confirmar la segunda, la web te advertirá que el turno ya no está disponible.
* **Explicación técnica:** Implementamos `@transaction.atomic` y `select_for_update()` en `backend/apps/appointments/services.py`, bloqueando la fila a nivel de base de datos.

---

### 3. Saturación / Ataque de Denegación de Servicio (DoS / Throttling) (RT03)
* **¿Qué es?:** Un script o bot malicioso bombardea el servidor con ráfagas continuas de peticiones para colapsar la CPU, agotar las conexiones de MySQL o hacer ataques de fuerza bruta.
* **📍 Ubicación exacta en el código:**
  * Archivo: [`backend/config/settings.py`](file:///c:/Users/alexi/Downloads/PROYECTO%20UNI/INTEGRADOR/SUMAQ-web/backend/config/settings.py#L149-L158) (Líneas 149 a 158):
  ```python
  REST_FRAMEWORK = {
      ...
      'DEFAULT_THROTTLE_CLASSES': (
          'rest_framework.throttling.AnonRateThrottle',
          'rest_framework.throttling.UserRateThrottle',
      ),
      'DEFAULT_THROTTLE_RATES': {
          'anon': '30/minute',   # Usuarios anónimos: Máximo 30 peticiones por minuto
          'user': '120/minute',  # Usuarios autenticados: Máximo 120 peticiones por minuto
      },
      ...
  }
  ```
* **✅ ¿Cómo demostrarlo manualmente en vivo (15 seg)?:**
  1. Con el backend encendido (`http://127.0.0.1:8000`), abre una terminal de PowerShell y ejecuta este comando de ráfaga rápida:
     ```powershell
     1..35 | ForEach-Object { (Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health/" -Method Get).StatusCode }
     ```
  2. **Resultado en pantalla:** Las primeras 30 peticiones responderán `200` (éxito) y las siguientes a partir de la 31 responderán con código HTTP **`429 Too Many Requests`** (*"Request was throttled. Expected available in X seconds"*).
* **Explicación técnica:** Django REST Framework rastrea la IP de origen y frena en seco cualquier ráfaga que exceda el umbral por minuto, protegiendo los recursos de cómputo y base de datos contra DoS y fuerza bruta.

---

### 4. Falla del Nodo Principal de Base de Datos (RT04)
* **¿Qué es?:** El disco duro del servidor se daña o el motor MySQL del puerto principal se detiene.
* **⚠️ ¿Se puede demostrar rompiendo el hardware en vivo?:**
  * *No es recomendable tumbar el servicio durante la exposición.*
* **✅ Cómo demostrar la preparación arquitectónica:**
  1. Muestra el script de replicación Master-Slave en: `backend/replication/setup_replication.sql`.
  2. Muestra la guía de conmutación por error en: `backend/replication/REPLICACION_GUIA.md`.
  3. Ejecuta el monitor en tiempo real:
     ```bash
     python admin_tools/monitor_db.py
     ```
* **Explicación técnica:** El spa cuenta con una arquitectura de alta disponibilidad con réplica asíncrona en el puerto secundario `3307` y failover con RTO < 5 minutos.

---

### 5. Inyección Cross-Site Scripting (XSS) (RT05)
* **¿Qué es?:** Un atacante inserta código JavaScript `<script>alert('hack')</script>` en las notas de evolución médica de un paciente.
* **✅ ¿Cómo demostrarlo manualmente en vivo (30 seg)?:**
  1. Inicia sesión como Terapeuta: `elena.morales@sumaqspa.pe` / `Sumaq2026!`.
  2. Entra a una cita y en el campo **Notas del Terapeuta / Diagnóstico**, escribe:
     `<script>alert('XSS Probado')</script>`
  3. Guarda la atención y recarga la pantalla.
  4. **Resultado visible:** El texto se muestra de forma literal como texto inofensivo; **nunca** se ejecuta la ventana emergente de script.
* **Explicación técnica:** React 19 escapa y sanitiza automáticamente el Virtual DOM antes de renderizar strings en pantalla.

---

### 6. Quiebre de Stock BOM (Inconsistencia de Inventario) (RT06)
* **¿Qué es?:** Atender una cita cuando ya no quedan cremas ni aceites esenciales en almacén, generando saldos negativos en el Kárdex.
* **✅ ¿Cómo demostrarlo manualmente en vivo?:**
  1. Corre el test específico de inventario:
     ```bash
     cd backend
     python -m pytest tests/test_inventory_attention.py
     ```
  2. **Resultado:** Pasan `test_completar_cita_consumes_inventory` y `test_completar_cita_insufficient_stock_rollback`.
  3. **Demostración en interfaz:** Si un insumo no cuenta con stock suficiente, la atención no puede cerrarse y la base de datos realiza un `ROLLBACK` total.

---

### 7. Intercepción Man-in-the-Middle (MitM) (RT07)
* **¿Qué es?:** Un intruso conectado al Wi-Fi del spa escucha los paquetes de red para robar contraseñas de los recepcionistas.
* **⚠️ ¿Se puede demostrar en vivo?:**
  * *No (requiere un router atacante o software de sniffing de red).*
* **🗣️ Qué responder al docente:**
  * *"Para mitigar MitM en producción, el backend utiliza transporte cifrado obligatorio mediante **HTTPS / TLS 1.3** con certificados SSL, y cabeceras estrictas `HSTS (Strict-Transport-Security)` que impiden cualquier degradación a HTTP plano."*

---

### 8. Fuga de Secretos en Repositorio Git (RT08)
* **¿Qué es?:** Subir por error las contraseñas de la base de datos y la llave `SECRET_KEY` de Django a GitHub.
* **✅ ¿Cómo demostrarlo manualmente en vivo (15 seg)?:**
  1. Abre el archivo `.gitignore` de la raíz del proyecto.
  2. Muestra las líneas donde están explícitamente ignorados `.env`, `*.env` y carpetas de credenciales.
  3. Muestra que en el repositorio solo existe `.env.example` con valores de plantilla inofensivos.

---

### 9. Broken Object Level Authorization / IDOR (RT09)
* **¿Qué es?:** Que una terapeuta cambie el ID en la URL (`/api/terapeuta/atenciones/15/` por `/16/`) para espiar la atención de otra colega.
* **✅ ¿Cómo demostrarlo manualmente en vivo?:**
  1. Corre el test de seguridad RBAC:
     ```bash
     cd backend
     python -m pytest tests/test_rbac_security.py -k "test_therapist_cannot_modify_other_therapist_appointment"
     ```
  2. **Resultado:** `PASSED`. La API devuelve código `403 Forbidden` al validar `IsAssignedTherapistOrAdmin`.

---

### 10. Subida de Archivos Maliciosos (RT10)
* **¿Qué es?:** Subir un ejecutable `.exe` camuflado como imagen de perfil o comprobante.
* **✅ Cómo explicarlo y demostrarlo:**
  * El sistema no expone endpoints de almacenamiento de binarios directos sin validación; los comprobantes oficiales se generan en memoria exclusivamente en formato **PDF estándar** (`application/pdf`) usando la librería ReportLab.

---

### 11. Librerías Obsoletas con Vulnerabilidades (RT11)
* **¿Qué es?:** Uso de versiones antiguas de paquetes con fallos de seguridad conocidos (CVE).
* **✅ Cómo demostrarlo:**
  * Muestra el archivo `backend/requirements.txt` con versiones fijadas y actualizadas (`Django==5.1.15`, `djangorestframework==3.15.2`, `PyMySQL==1.1.1`).

---

## B. RIESGOS HUMANOS (Descuidos o Errores Operativos)

---

### 1. Fuerza Bruta / Claves Débiles (RH01)
* **✅ Demostración:** Muestra que Django exige contraseñas complejas y aplica **PBKDF2_SHA256 con 600,000 iteraciones**, haciendo inviable el descifrado por tablas arcoíris.

---

### 2. Curiosidad Indebida de Datos Médicos (RH02)
* **✅ Demostración manual en vivo (20 seg):**
  1. Inicia sesión con el botón de demo **Recepcionista** (`recepcion@sumaqspa.pe`).
  2. Observa el menú lateral izquierdo: **No existe** acceso a historias clínicas dérmicas, diagnósticos médicos ni reportes de balance financiero. Solo puede operar la Agenda y la Caja POS.

---

### 3. Sesión Desatendida en Recepción (RH03)
* **✅ Demostración en código y explicación:**
  1. Abre `frontend/src/contexts/AuthContext.tsx` y muestra las líneas 45-65.
  2. Muestra el temporizador de inactividad: `INACTIVITY_LIMIT_MS = 5 * 60 * 1000` (5 minutos).
  3. **Explicación:** Si la recepcionista se ausenta y no mueve el mouse ni el teclado por 5 minutos, el sistema borra el token JWT y redirige automáticamente al login.

---

### 4. Descuadre en Caja POS (RH04)
* **✅ Demostración manual en vivo (30 seg):**
  1. Inicia sesión como **Recepcionista** o **Administrador**.
  2. Ingresa al módulo **Caja POS / Liquidación** (`/admin/caja`).
  3. Cada cobro (Efectivo, Tarjeta, Yape, Plin) queda asociado al código de reserva `SQ-YYYYMMDD-XXXX`, registrando el vuelto exacto y emitiendo el comprobante PDF.

---

### 5. Comando Destructivo Accidental (RH05)
* **✅ Demostración en configuración:**
  1. Abre `admin_tools/ADMINISTRACION_BD.md`.
  2. Muestra que la aplicación utiliza el usuario de mínimos privilegios `sumaq_app` (solo `SELECT, INSERT, UPDATE, DELETE`) sin permisos de `DROP DATABASE` ni `ALTER TABLE` en producción.

---

### 6. Riesgos Organizacionales / No ejecutables en software:
| Riesgo Humano | ¿Se demuestra en software? | 🗣️ Cómo justificarlo ante el profesor |
| :--- | :--- | :--- |
| **Ingeniería Social / Phishing (RH06)** | ⚠️ *No (Factor humano)* | *"Se mitiga con el Plan de Capacitación Semestral en Ciberseguridad para el personal del spa y campañas de simulacros de phishing interno."* |
| **Fuga Interna de Clientes (RH07)** | ⚠️ *No (Factor legal/humano)* | *"Se mitiga mediante Acuerdos de Confidencialidad (NDA) firmados por los empleados y el cumplimiento estricto de la **Ley Peruana de Protección de Datos Personales (Ley N° 29733)**."* |
| **Cuentas Compartidas (RH08)** | ⚠️ *No (Práctica operativa)* | *"Se mitiga con la política de cuentas nominativas obligatorias; cada terapeuta tiene asignada su propia cabina y no se permite el uso de credenciales genéricas."* |
| **Olvido de Respaldos (RH09)** | ✅ *Demostrable* | *Se mitiga con el script `admin_tools/backup_db.bat` programado en el Programador de Tareas de Windows (Task Scheduler).* |

---

# 2️⃣ PASO 2: IMPLEMENTACIÓN DE CONTROLES DEFINIDOS

```
🛡️ PREVENTIVOS  ➡️ Evitan que la amenaza ocurra (Candados).
🔍 DETECTIVOS    ➡️ Detectan anomalías en tiempo real (Alarmas).
🔄 CORRECTIVOS   ➡️ Corrigen el problema y restauran la operación (Extintores).
```

### 🧪 Cómo demostrar los 3 tipos de controles en vivo:

#### 1. Demostración de Controles Preventivos:
* **Token JWT y Rutas Protegidas:** Intenta entrar directamente a `http://localhost:5173/admin` sin loguearte. El componente `ProtectedRoute.tsx` te expulsa de inmediato al `/login`.
* **Concurrencia Pesimista:** Muestra el código en `backend/apps/appointments/services.py` con `select_for_update()`.

#### 2. Demostración de Controles Detectivos (La alarma en vivo):
Abre una terminal y corre:
```bash
python admin_tools/monitor_db.py
```
* **Qué muestra la pantalla:**
  * Latencia de conexión en milisegundos (`ms`).
  * Integridad de tablas (`CHECK TABLE: OK`).
  * Buffer Pool Hit Ratio de InnoDB.
  * Alertas amarillas/rojas automáticas si el stock de productos cae por debajo de 5 unidades.

#### 3. Demostración de Controles Correctivos:
* **Ejecutar un Backup Manual en 5 segundos:**
  Abre una terminal y ejecuta:
  ```cmd
  admin_tools\backup_db.bat
  ```
  *Verás:* Creación instantánea del archivo SQL comprimido en `admin_tools/backups/sumaq_backup_YYYYMMDD_HHMMSS.sql` con política de retención histórica.
* **Rollback Automático:** Transacciones atómicas de Django que cancelan el cobro si ocurre un error inesperado a mitad del proceso.

---

# 3️⃣ PASO 3: LISTA DE ATAQUES (OWASP TOP 10)

| Ataque | Payload / Prueba Manual en Vivo | Resultado Observado | Mecanismo de Defensa |
| :--- | :--- | :--- | :--- |
| **1. SQL Injection** | Ingresar `admin@sumaqspa.pe' OR '1'='1' --` | Error controlado `401 Unauthorized` | Consultas parametrizadas del ORM de Django |
| **2. Cross-Site Scripting (XSS)** | Ingresar `<script>alert(1)</script>` en notas de cita | Se imprime como texto plano | Sanitización automática de React 19 JSX |
| **3. Fuerza Bruta** | Enviar 35 peticiones seguidas en PowerShell | Salta código de error `429 Too Many Requests` | Throttling de Django REST Framework |
| **4. CSRF** | Petición externa sin Header Bearer | Rechazo inmediato con código `401` | Arquitectura JWT Stateless sin cookies de sesión |
| **5. IDOR / Acceso no autorizado** | Terapeuta accediendo a cita de otra colega | Rechazo con código `403 Forbidden` | Permiso `IsAssignedTherapistOrAdmin` |
| **6. Colisión Concurrente** | 2 peticiones paralelas al mismo turno | 1 aprobada (`201`), 1 rechazada (`409/400`) | Bloqueo `select_for_update()` a nivel de fila |

---

# 4️⃣ PASO 4: ESTRATEGIA DE SEGURIDAD

### 1. Demostración de Tokens JWT (F12 en el Navegador)
1. Inicia sesión en la web: `http://localhost:5173/login`.
2. Presiona `F12` en tu teclado (Herramientas de Desarrollador).
3. Ve a la pestaña **Aplicación (Application)** ➡️ **Almacenamiento Local (Local Storage)** ➡️ `http://localhost:5173`.
4. Muestra al docente la clave `sumaq_access_token` con el JWT firmado criptográficamente.
5. Ve a la pestaña **Red (Network)**, haz cualquier acción y muestra la cabecera enviada:
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. Demostración de Roles (RBAC) con los Botones de Demo
Usa los 3 botones rápidos de la pantalla de login para evidenciar la diferencia visual y funcional:
* **Admin General (`admin@sumaqspa.pe` / `AdminSumaq2026!`):** Acceso total al Dashboard, Finanzas, Reportes, Usuarios y Configuración de Cabinas.
* **Recepcionista (`recepcion@sumaqspa.pe` / `Sumaq2026!`):** Acceso restringido a la Agenda Diaria y Caja POS.
* **Terapeuta Elena (`elena.morales@sumaqspa.pe` / `Sumaq2026!`):** Acceso restringido a su propia lista de pacientes y ficha de evolución.

### 3. Demostración de Contraseñas Cifradas en Base de Datos
Abre tu cliente MySQL o ejecuta en terminal:
```sql
USE sumaq_spa;
SELECT id, email, password, rol FROM usuarios;
```
* **Resultado:** Las contraseñas se almacenan con el algoritmo `pbkdf2_sha256$600000$...`, impidiendo que cualquier administrador o hacker con acceso a la BD pueda conocer las claves reales.

---

# 5️⃣ PASO 5: ESTRATEGIA DE DEFENSA EN VIVO

### 🧪 Prueba A: Batería de 18 Tests Automatizados (Pytest)
Abre una terminal en la raíz del proyecto y ejecuta:
```bash
cd backend
python -m pytest
```

#### 📺 Resultado que verás en pantalla (100% Verde):
```text
============================= test session starts =============================
platform win32 -- Python 3.14.5, pytest-9.1.1, django-5.1.15
collected 18 items

tests/test_appointments.py::test_reserva_web_successful PASSED           [  5%]
tests/test_appointments.py::test_reserva_web_dni_rule_same_day_rejected PASSED [ 11%]
tests/test_appointments.py::test_consultar_y_cancelar_cita_web_24h_rule PASSED [ 16%]
tests/test_auth.py::test_login_successful_admin PASSED                   [ 22%]
tests/test_auth.py::test_login_invalid_password PASSED                   [ 27%]
tests/test_auth.py::test_login_inactive_user_rejected PASSED             [ 33%]
tests/test_finance_dashboard.py::test_financial_analytics_dashboard PASSED [ 38%]
tests/test_finance_dashboard.py::test_admin_reportes_therapist_breakdown PASSED [ 44%]
tests/test_health.py::test_health_check_endpoint PASSED                  [ 50%]
tests/test_inventory_attention.py::test_completar_cita_consumes_inventory PASSED [ 55%]
tests/test_inventory_attention.py::test_completar_cita_insufficient_stock_rollback PASSED [ 61%]
tests/test_pdf.py::test_generar_comprobante_pdf_binary PASSED            [ 66%]
tests/test_pdf.py::test_public_pdf_download_by_codigo_reserva PASSED     [ 72%]
tests/test_pdf.py::test_query_param_token_pdf_download PASSED            [ 77%]
tests/test_rbac_security.py::test_therapist_cannot_access_admin_dashboard PASSED [ 83%]
tests/test_rbac_security.py::test_unauthenticated_cannot_access_therapist_agenda PASSED [ 88%]
tests/test_rbac_security.py::test_therapist_cannot_modify_other_therapist_appointment PASSED [ 94%]
tests/test_concurrency.py::test_concurrency_anti_double_booking PASSED   [100%]

======================= 18 passed in 22.12s =======================
```

---

### 🚀 Prueba B: Flujo Completo en la Aplicación Web
1. Inicia la aplicación con doble clic en:
   ```cmd
   ejecutar_todo.bat
   ```
2. Abre tu navegador en **`http://localhost:5173/`**.
3. **Paso 1:** Navega al catálogo de servicios (`/servicios`) y selecciona un masaje.
4. **Paso 2:** En el asistente de reserva (`/reservar`), selecciona terapeuta, fecha y turno horario. Ingresa DNI y datos del cliente.
5. **Paso 3:** Se genera el código de reserva oficial `SQ-YYYYMMDD-XXXX`.
6. **Paso 4:** Haz clic en **Descargar Comprobante PDF** y muestra el archivo generado en vivo con código QR y desglose de IGV.
7. **Paso 5:** Ingresa a **Mis Citas** (`/mis-citas`), busca la cita por DNI/código y demuestra cómo el cliente puede consultar su estado o cancelarla cumpliendo la regla de más de 24 horas.

---

## ⚡ TABLA RESUMEN DE COMANDOS PARA COPIAR Y PEGAR

| Acción a Demostrar | Comando exacto a ejecutar | Resultado esperado |
| :--- | :--- | :--- |
| **1. Batería de 18 tests** | `cd backend; python -m pytest` | **18 PASSED** (100% verde). |
| **2. Monitor detectivo en vivo** | `python backend/admin_tools/monitor_db.py` | Latencia, integridad de tablas y stock crítico. |
| **3. Test de Throttling (DoS)** | `1..35 \| % { (iwr http://127.0.0.1:8000/api/health/).StatusCode }` | Respuestas `200` y freno con `429 Too Many Requests`. |
| **4. Backup manual de BD** | `admin_tools\backup_db.bat` | Archivo SQL generado en `admin_tools/backups/`. |
| **5. Levantar todo el sistema** | Doble clic en `ejecutar_todo.bat` | Backend (8000), Frontend (5173) y navegador listo. |

---

### 📁 Documentos de Sustentación Disponibles:
* 📄 **Informe de Seguridad en Word:** `C:\Users\alexi\Downloads\SeguridadSUMAQ.docx`
* 📘 **Guía de Demostración Paso a Paso:** `DemostracionPasos.md`
* 📊 **Diapositivas de Exposición:** `PRESENTACION_SEMANA_07_SEGURIDAD_SUMAQ_SPA.pptx`
