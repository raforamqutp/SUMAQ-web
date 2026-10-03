# INFORME TÉCNICO: ANÁLISIS Y AMPLIACIÓN DE LA MATRIZ DE GESTIÓN DE RIESGOS Y ESTRATEGIA DEFENSIVA

**Proyecto:** SUMAQ SPA - Sistema Web de Gestión de Citas, Inventario y Finanzas  
**Curso:** Curso Integrador II: Sistemas (Semana 07 – Sesión 13)  
**Docente:** MBA Mg. Ing. René Alonso Nieto Valencia  
**Equipo de Desarrollo:**  
* Bryan (Módulo 3 - Replicación, Administración de BD y QA)  
* Anthony (Módulo 2 - Gestión de Citas, Inventario y Finanzas)  
* Rafael (Módulo 1 - Core, Arquitectura y Autenticación)  

---

## 1. DIAGNÓSTICO DE LA MATRIZ ACTUAL (TRABAJO DE LA SEMANA)

### 1.1 Fortalezas del Trabajo Realizado
* **Alto grado de contextualización real:** No es un listado genérico de conceptos teóricos; menciona componentes específicos del código de Sumaq Spa como `select_for_update` en transacciones atómicas de Django, sanitización JSX en React 19, deducción BOM de insumos por sesión médica, replicación esclava en puerto 3307 y el monitor de base de datos `monitor_db.py`.
* **Alineación con OWASP Top 10:** Cubre las vulnerabilidades clásicas solicitadas por la rúbrica (SQLi, XSS, Fuerza Bruta, CSRF y MitM).
* **Asignación de roles claros:** Define responsables directos por disciplina técnica (Backend Lead, Frontend Lead, Admin BD, Infraestructura TI, Logística y Contabilidad).

### 1.2 Oportunidades de Mejora y Brechas Detectadas
1. **Desbalance en los Tipos de Control:**
   * La gran mayoría de controles registrados en la matriz inicial son **Preventivos** (9) y **Detectivos** (3).
   * **Casi no hay controles Correctivos** (solo RT04 lo menciona). En la teoría de control de riesgos (ISO 27005 / ISO 31000 y temario UTP) es indispensable definir qué contingencia correctiva se aplica cuando el riesgo se materializa (ej. rollback transaccional, revocación de tokens, restauración de respaldos, procedimientos de contingencia operativa).
2. **Riesgos Técnicos omitidos que aplican directamente a Sumaq Spa:**
   * **Fuga de credenciales o secretos en repositorios (.env / SECRET_KEY):** Muy relevante por el trabajo colaborativo en Git.
   * **Subida arbitraria de archivos (Unrestricted File Upload):** Para comprobantes de pago o fotos de perfil/servicios.
   * **Manipulación de identificadores (IDOR / Broken Object Level Authorization):** Acceso a citas o reportes ajenos alterando el ID en la URL.
   * **Dependencias y librerías vulnerables (Software Supply Chain):** Paquetes de npm o pip desactualizados con vulnerabilidades conocidas (CVE).
3. **Riesgos Humanos adicionales omitidos:**
   * **Ingeniería social / Phishing a recepcionistas y terapeutas:** El eslabón más vulnerable de la cadena suele ser el operador humano.
   * **Uso de contraseñas débiles o compartidas:** Práctica común en turnos de mostrador.
   * **Exfiltración de base de datos de clientes por empleados desleales:** Riesgo legal crítico bajo la Ley Peruana de Protección de Datos Personales (Ley N° 29733).
   * **Omisión o descuido humano en la ejecución/verificación de backups:** Riesgo operativo del administrador de base de datos.

---

## 2. MATRIZ INTEGRAL CONSOLIDADA Y AMPLIADA DE RIESGOS (TÉCNICOS Y HUMANOS)

A continuación se presenta la matriz completa que integra los riesgos identificados inicialmente (RT01–RT07 y RH01–RH05) junto con las **nuevas incorporaciones recomendadas (RT08–RT11 y RH06–RH09)**, garantizando una cobertura equilibrada de controles **Preventivos (P)**, **Detectivos (D)** y **Correctivos (C)**.

### 2.1 Riesgos Técnicos (RT)

| ID | Riesgo | Escenario en Sumaq Spa | Prob. | Imp. | Tipo Control | Medida y Estrategia de Seguridad Implementada | Responsable |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **RT01** | Inyección SQL (SQLi) | Manipulación de campos de entrada (DNI en `/mis-citas` o credenciales en `/login`) para forzar sentencias (`' OR '1'='1`). | Baja | Alta | **Preventivo** | Consultas parametrizadas con Django ORM 5.1. Prohibición de raw SQL concatenado. Validación estricta con Regex en frontend y backend. | Backend Lead |
| **RT02** | Doble reserva / Colisión de concurrencia | Dos clientes reservan la misma cabina o terapeuta en el mismo slot horario de 60 min simultáneamente. | Alta | Alta | **Preventivo / Correctivo** | **P:** Bloqueo pesimista (`select_for_update`) dentro de `transaction.atomic()`. Inhabilitación visual reactiva en frontend. <br>**C:** Mecanismo de rollback transaccional y reasignación de turno con mensaje amigable al usuario. | Backend Lead |
| **RT03** | Saturación y caída por tráfico masivo (DoS) | Bloqueo del servidor web o saturación del Buffer Pool de MySQL durante promociones con cupones de descuento. | Media | Alta | **Detectivo / Correctivo** | **D:** Monitoreo continuo de latencia, CPU, memoria e InnoDB con `monitor_db.py`. Registro de excepciones HTTP en logs. <br>**C:** Reinicio asistido de servicios, balanceo de carga y aislamiento de procesos en segundo plano. | DevOps / TI |
| **RT04** | Caída del nodo principal de base de datos | Falla física de almacenamiento SSD o corrupción en el esquema relacional de la BD productiva (3306). | Baja | Alta | **Correctivo** | Replicación asíncrona Master-Slave (nodo esclavo en puerto 3307 con failover RTO < 5 min). Política de backups diarios `backup_db.bat` bajo regla 3-2-1. | Administrador de BD |
| **RT05** | Inyección de scripts web (XSS) | Inserción de código JavaScript malicioso en "Notas de evolución dérmica" o comentarios de cita. | Media | Alta | **Preventivo** | Escapado automático contextual de HTML en JSX (React 19), sanitización en serializadores Django REST y cabeceras CSP (*Content Security Policy*). | Frontend Lead |
| **RT06** | Quiebre de stock por desabastecimiento | Confirmación y cobro de citas web sin disponibilidad física de cremas o aceites en almacén. | Media | Media | **Detectivo / Preventivo** | **D:** Alerta temprana cuando el stock cae por debajo del umbral mínimo configurado (< 5 unidades). <br>**P:** Bloqueo automático de reserva web si el insumo crítico asociado a la receta (BOM) está agotado. | Admin. Logística |
| **RT07** | Intercepción de tráfico de red (MitM) | Escucha o alteración de paquetes en la red local Wi-Fi entre tablets de terapeutas y el servidor host. | Media | Alta | **Preventivo** | Cifrado obligatorio de extremo a extremo mediante HTTPS/TLS 1.3 con certificados válidos y directiva HSTS (*HTTP Strict Transport Security*). | Infraestructura TI |
| **RT08** *(NUEVO)* | Exposición de credenciales y secretos en Git | Subida accidental del archivo `.env` o exposición de `SECRET_KEY` y claves de BD en GitHub. | Media | Alta | **Preventivo / Detectivo** | **P:** Inclusión estricta de `.env` en `.gitignore`, usando solo `.env.example` en repositorios. Lectura dinámica en scripts `.bat`. <br>**D:** Escaneo automatizado de repositorios mediante hooks de pre-commit y `git-secrets`. | Backend / DevOps |
| **RT09** *(NUEVO)* | Acceso no autorizado a objetos (IDOR / BOLA) | Un cliente altera el parámetro `id_cita` o `id_cliente` en las peticiones API para consultar fichas ajenas. | Media | Alta | **Preventivo / Detectivo** | **P:** Validación de propiedad del registro en la capa del queryset (`queryset.filter(cliente=request.user)` o validación estricta de código alfanumérico aleatorio `SQ-XXXXX`). <br>**D:** Auditoría de accesos cruzados fallidos. | Backend Lead |
| **RT10** *(NUEVO)* | Subida arbitraria de archivos maliciosos | Carga de archivos ejecutables disfrazados de imágenes (.php, .exe como .jpg) en avatares o comprobantes. | Baja | Alta | **Preventivo / Correctivo** | **P:** Validación estricta de extensiones y tipo MIME real (Magic Bytes) con `pillow`, renombramiento UUID y almacenamiento fuera de la raíz web. <br>**C:** Aislamiento y borrado inmediato del archivo no conforme. | Backend Lead |
| **RT11** *(NUEVO)* | Vulnerabilidades por dependencias obsoletas | Brechas de seguridad conocidas (CVE) en paquetes de npm (React) o pip (Django/PyMySQL). | Media | Media | **Detectivo / Correctivo** | **D:** Auditorías continuas con `pip audit` y `npm audit` integradas en el pipeline de CI/CD. <br>**C:** Actualización controlada de paquetes y aplicación de parches de seguridad de librerías. | Seguridad TI |

---

### 2.2 Riesgos Humanos (RH)

| ID | Riesgo | Escenario en Sumaq Spa | Prob. | Imp. | Tipo Control | Medida y Estrategia de Seguridad Implementada | Responsable |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **RH01** | Suplantación por ataque de fuerza bruta | Software automatizado enviando miles de contraseñas contra cuentas de administración o recepción. | Alta | Alta | **Preventivo / Detectivo** | **P:** Cifrado PBKDF2_SHA256, políticas de bloqueo tras 5 intentos fallidos y *throttling* con Django Rest Framework. <br>**D:** Alertas inmediatas en logs por anomalías en login y baneo temporal de IPs. | Seguridad TI |
| **RH02** | Acceso indebido a historiales dérmicos | Personal administrativo o de recepción curioseando fichas de anamnesis o diagnósticos cutáneos confidenciales. | Media | Alta | **Preventivo / Detectivo** | **P:** RBAC estricto con `ProtectedRoute.tsx` y SimpleJWT: recepcionistas solo ven agenda; expediente clínico restringido exclusivamente a la terapeuta asignada. <br>**D:** Bitácora de accesos (*Access Log*) registrando usuario, hora y ficha consultada. | Arquitecto de Software |
| **RH03** | Sesiones desatendidas en mostrador | Recepcionista o terapeuta abandona la computadora dejando el sistema autenticado y expuesto a clientes o intrusos. | Alta | Media | **Preventivo** | Cierre automático de sesión (*timeout*) tras 5 minutos de inactividad de mouse/teclado y tokens de acceso JWT de corta duración (15 min). | Frontend Lead |
| **RH04** | Negligencia o fraude en arqueo de caja POS | Manipulación manual de cobros, diferencias intencionales de dinero en efectivo o anulación ilícita de comprobantes. | Media | Media | **Detectivo / Preventivo** | **D:** Conciliación digital obligatoria vinculando el ID de cita con `movimientos_caja`, cálculo automático de IGV y reporte de cierre ciego de caja. <br>**P:** Bloqueo de anulación de comprobantes sin autorización de gerencia. | Área Contable |
| **RH05** | Modificación destructiva del esquema de BD | Ejecución accidental de comandos destructivos (`DROP TABLE`, `TRUNCATE`) por desarrolladores en BD productiva. | Baja | Alta | **Preventivo / Correctivo** | **P:** Principio de Mínimos Privilegios: el usuario aplicativo `sumaq_app` solo tiene permisos CRUD (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), nunca DDL (`DROP`, `ALTER`). <br>**C:** Procedimiento de restauración mediante `restore_db.bat`. | Administrador de BD |
| **RH06** *(NUEVO)* | Ingeniería Social / Phishing a empleados | Llamadas o correos falsos dirigidos a recepcionistas para solicitar restablecimiento de contraseñas o datos de clientes. | Media | Alta | **Preventivo** | Capacitación periódica al personal, protocolo formal de verificación de identidad para cambios de claves y prohibición de compartir credenciales por mensajería. | Gerencia / RRHH |
| **RH07** *(NUEVO)* | Exfiltración de datos de clientes (Fuga interna) | Empleado descarga o copia masivamente la cartera de clientes (nombres, teléfonos, historial) para venderla a la competencia. | Baja | Crítica | **Preventivo / Detectivo** | **P:** Inhabilitación de botones de exportación masiva para usuarios no autorizados (solo Gerencia General) y cláusulas de confidencialidad (NDA / Ley N° 29733). <br>**D:** Alerta en logs ante solicitudes API de paginación masiva inusual. | Legal / Seguridad TI |
| **RH08** *(NUEVO)* | Uso de contraseñas débiles o compartidas | Varios colaboradores usando la misma cuenta o claves triviales (`123456`, `admin123`) por comodidad entre turnos. | Alta | Alta | **Preventivo** | Obligatoriedad de cuentas nominativas individuales. Políticas de contraseña segura (mínimo 8 caracteres, alfanumérico, mayúscula y carácter especial) forzadas por Django Validators. | Seguridad TI |
| **RH09** *(NUEVO)* | Omisión de copias de seguridad por descuido | El administrador olvida ejecutar manualmente las copias de seguridad durante días o semanas. | Media | Alta | **Preventivo / Detectivo** | **P:** Automatización mediante Programador de Tareas de Windows (Task Scheduler) ejecutando `admin_tools/backup_db.bat` de forma diaria a medianoche. <br>**D:** Envío de correo o log de confirmación de backup exitoso diario. | Administrador de BD |

---

## 3. MATRIZ DE VECTORES DE ATAQUE WEB Y ESTRATEGIAS DEFENSIVAS (SEMANA 07)

Basado en los lineamientos específicos de la sesión (Ataques comunes, Autenticación, Autorización y Cifrado):

| Vector de Ataque | Descripción y Escenario en Sumaq Spa | Tipo de Control | Estrategia Defensiva y Mecanismo Técnico |
| :--- | :--- | :--- | :--- |
| **SQL Injection (SQLi)** | Inyección de sintaxis maliciosa en campos de reserva web, consulta por DNI o login (`' OR 1=1 --`). | **Preventivo** | Sanitización integral mediante Django ORM con consultas preparadas precompiladas. Prohibición estricta de concatenación manual de cadenas. Expresiones regulares en frontend y serializadores. |
| **Cross-Site Scripting (XSS)** | Inyección de etiquetas `<script>` o eventos JavaScript en campos de texto enriquecido (fichas clínicas, observaciones). | **Preventivo** | Escapado automático contextual provisto por el motor JSX de React 19 al renderizar variables en el DOM. Implementación de cabeceras HTTP de seguridad: `Content-Security-Policy (CSP)` y `X-XSS-Protection`. |
| **Ataque de Fuerza Bruta** | Bombardeo masivo de combinaciones de usuario/clave contra el endpoint `/api/token/` para comprometer cuentas privilegiadas. | **Preventivo y Detectivo** | **P:** Limitación de tasa (*Rate Limiting*) a 5 intentos por minuto por IP, hashing robusto de contraseñas con PBKDF2 (260,000+ iteraciones). <br>**D:** Detección de patrones anómalos y bloqueo temporal exponencial de direcciones IP sospechosas. |
| **Cross-Site Request Forgery (CSRF)** | Inducción a usuarios autenticados para disparar peticiones no autorizadas (ej. agendar citas o modificar precios) desde sitios externos. | **Preventivo** | Arquitectura SPA desacoplada sin cookies de sesión implícitas. La autenticación se basa exclusivamente en tokens JWT transmitidos vía cabecera `Authorization: Bearer <token>`, inmunes a ataques CSRF convencionales. |
| **Intercepción / Sniffing (MitM)** | Captura de credenciales, tokens JWT o historiales clínicos en tránsito al navegar en redes públicas o Wi-Fi local. | **Preventivo** | Cifrado obligatorio en tránsito con protocolo HTTPS (TLS 1.3), cabecera HSTS activa y tokens de acceso con ciclo de vida corto (15-60 min). |
| **Broken Object Level Authorization (BOLA / IDOR)** | Manipulación de identificadores (`GET /api/appointments/45/`) para consultar o alterar registros de otros usuarios sin ser dueño del dato. | **Preventivo** | Verificación estricta en cada ViewSet de Django: el backend valida en el ORM que el usuario autenticado sea el dueño de la cita o tenga rol `admin`/`terapeuta` asignada al servicio. |

---

## 4. VALIDACIÓN DE LA ESTRATEGIA DEFENSIVA (PREGUNTAS CLAVE DEL ENTREGABLE)

### ¿Qué protege cada tipo de control implementado?
* **Controles Preventivos (Confidencialidad e Integridad):**
  * Protegen el sistema *antes* de que ocurra la brecha. 
  * Garantizan que solo usuarios acreditados accedan a la información sensible mediante autenticación JWT y roles RBAC.
  * Preservan la consistencia de la base de datos MySQL bajo principios ACID mediante transacciones atómicas, validación de inputs y bloqueos de concurrencia.
* **Controles Detectivos (Visibilidad, Monitoreo y Trazabilidad):**
  * Identifican incidentes, anomalías y cuellos de botella *mientras* ocurren.
  * A través del monitor `admin_tools/monitor_db.py`, se vigila en tiempo real la latencia de MySQL, el uso del Buffer Pool de InnoDB, las conexiones activas y las alertas tempranas de stock crítico antes de que se produzca un desabastecimiento.
  * Los registros de auditoría (*access logs*) permiten rastrear quién vio o modificó expedientes médicos y arqueos de caja.
* **Controles Correctivos (Disponibilidad y Resiliencia del Negocio):**
  * Minimizan los daños y recuperan el servicio *después* de que se materializa un problema.
  * Ante una falla crítica del servidor o pérdida de datos, se cuenta con scripts automatizados de restauración (`restore_db.bat`) y con el nodo esclavo de replicación en puerto 3307 para conmutación por error (*failover*) en menos de 5 minutos (RTO < 5 min), asegurando la continuidad del negocio.

---

### ¿Es suficiente la seguridad implementada en esta etapa?
**Sí, es plenamente adecuada y suficiente para la fase actual de desarrollo e integración (Sprint S04 / Semana 07).**
* El sistema mitiga con éxito los riesgos más críticos del estándar OWASP Top 10 (SQLi, XSS, CSRF, control de acceso roto y colisión de concurrencia).
* Los datos médicos de las fichas dérmicas están aislados por roles y las contraseñas se almacenan con algoritmos de hashing modernos (PBKDF2).
* La arquitectura multi-entorno soporta tanto desarrollo local seguro como despliegue institucional.

---

### ¿Qué falta por implementar para la fase de producción final?
Para el pase definitivo a producción se deben completar los siguientes componentes clave:
1. **Autenticación Multifactor (MFA / 2FA):** Obligatoria mediante TOTP (Google Authenticator) para cuentas con privilegios de Administrador y Gerencia.
2. **Firewall Perimetral (WAF):** Implementar Cloudflare o AWS WAF frente al servidor web para mitigación activa de ataques DDoS y filtrado geográfico de IPs.
3. **Almacenamiento Remoto de Respaldos (Regla 3-2-1):** Enviar copias cifradas de los backups diarios de MySQL a almacenamiento cloud inmutable (ej. AWS S3 Glacier con bloqueo de objetos).
4. **Firma Digital y Certificación:** Integración de certificados digitales y firma electrónica en los comprobantes de pago emitidos por el módulo POS para cumplimiento tributario.
5. **Rotación Automática de Secretos:** Implementar un gestor de secretos (AWS Secrets Manager o HashiCorp Vault) para la rotación periódica de contraseñas de base de datos y llaves `SECRET_KEY`.

---

## 5. RESPUESTAS AL CUESTIONARIO ACADÉMICO (DIAPOSITIVAS 39 Y 40 DE LA CLASE)

### Pregunta 1: ¿Qué es una metodología de riesgos para los proyectos tecnológicos? (Slide 39)
> **Respuesta Técnica:**  
> Una metodología de gestión de riesgos en proyectos tecnológicos (como ISO/IEC 27005, MAGERIT o el marco de evaluación de riesgos de OWASP) es un **marco sistemático y estructurado de procesos continuos** diseñado para:
> 1. **Identificar** de forma proactiva las amenazas potenciales, vulnerabilidades técnicas y factores humanos que pueden comprometer los activos de información (código fuente, bases de datos, credenciales, infraestructura).
> 2. **Evaluar y cuantificar** la probabilidad de ocurrencia y el nivel de impacto (Confidencialidad, Integridad y Disponibilidad - Triada CID).
> 3. **Diseñar e implementar controles** específicos clasificados en preventivos (evitan el hecho), detectivos (alertan oportunamente) y correctivos (recuperan el servicio).
> 4. **Monitorear y auditar** la efectividad de dichos controles a lo largo de todo el ciclo de vida del software (DevSecOps), transformando la seguridad en un proceso vivo y no en un evento aislado.

---

### Pregunta 2: ¿Qué representa o cómo aporta un proyecto tecnológico al desarrollo de una organización o para el país? (Slide 40)
> **Respuesta Integral (Organización y País):**  
> * **Aporte a nivel Organizacional (Sumaq Spa):**
>   * **Eficiencia y Reducción de Pérdidas:** Elimina el solapamiento de citas (doble reserva) y el desabastecimiento de insumos mediante el control de stock automatizado por receta (BOM).
>   * **Toma de Decisiones basada en Datos:** Proporciona tableros financieros y reportes de rentabilidad en tiempo real sobre terapeutas, servicios y ventas.
>   * **Fidelización y Confianza:** Otorga al cliente un canal de autogestión ágil (24/7), garantizando absoluta privacidad en sus datos médicos y transacciones transparentes.
> * **Aporte a nivel País:**
>   * **Digitalización y Productividad de las PYMEs:** El sector de servicios y bienestar representa un motor clave de empleo; la adopción de software formaliza la gestión, incrementa la competitividad y fomenta la inclusión digital de profesionales técnicos (terapeutas y recepcionistas).
>   * **Formalización Económica y Tributaria:** La vinculación de cobros con emisión de boletas y cálculo automático de IGV fortalece la recaudación fiscal y reduce la informalidad comercial.
>   * **Cultura de Ciberseguridad y Protección de Datos:** Implementar sistemas que respetan la Ley N° 29733 (Protección de Datos Personales en el Perú) eleva los estándares de confianza digital en el comercio electrónico nacional.
