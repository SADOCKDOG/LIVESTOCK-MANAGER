# Ciclo de Vida de Desarrollo y Gobernanza AI-GRC: Livestock Manager

## 1. Proposito y Alcance

Este documento formaliza el procedimiento de ingenieria, desarrollo asistido por agentes de inteligencia artificial y custodia normativa para **Livestock Manager**, integrando operativamente el repositorio con la **Autonomous AI Dev Infrastructure** y el hub corporativo de **Microsoft Azure AI Foundry** en el tenant `sadogfarm.onmicrosoft.com` (Sdog Farm Software Factory).

---

## 2. Niveles de Autonomia Operacional (L1 a L5)

Ningun agente de IA dispone de permisos ilimitados sobre el codigo base. Las tareas se categorizan conforme a su impacto en la seguridad agroalimentaria:

| Nivel de Autonomia | Alcance en Livestock Manager | Intervencion Humana Requerida |
| :--- | :--- | :--- |
| **Nivel 1 (Asistido Basico)** | Generacion de documentacion, comentarios de codigo, tipado TypeScript | Revision estandar en Pull Request |
| **Nivel 2 (Desarrollo UI/UX)** | Diseno visual conforme a `.agent/AGENTS.md`, pantallas Bento Grid, CSS neón | Pruebas visuales automatizadas con Playwright |
| **Nivel 3 (Logica de Negocio)** | Modulos de censo, pesadas, altas/bajas de ganado | Cobertura de tests unitarios obligatoria en sandbox |
| **Nivel 4 (Critico / Sanitario)** | Periodos de supresion de medicamentos (RD 787/2023), guias de movimiento, SIGGAN/BADIGEX | **Barrera Humana Obligatoria (ApprovalManager)** previa a cualquier merge |
| **Nivel 5 (Autonomo Total)** | **TERMINANTEMENTE PROHIBIDO** en este proyecto | N/A |

---

## 3. Politica de Aislamiento y Clasificacion de Datos

1. **Aislamiento `local_only`:**
   - La carpeta `Private/`, certificados digitales autonómicos (`.pfx`, `.keystore`) y datos reales de fincas (coordenadas GPS, codigos REGA de explotaciones piloto) jamas seran transmitidos a ningun modelo de IA externo.
   - El motor de politicas `ModelPolicyEngine` aborta inmediatamente cualquier solicitud que contenga estos identificadores.
2. **Contexto `approved_remote`:**
   - Unicamente se permite el envio a Microsoft Foundry (`sadogfarm.onmicrosoft.com`) de logica pura desacoplada: algoritmos de calculo de dias restantes de retirada farmacologica, interfaces de validacion de albaranes y esquemas abstractos.

---

## 4. Flujo de Trabajo en la Factoria de Software

1. **Incepcion en Kanban:** Toda iniciativa se registra en el tablero SQLite de la factoria (`data/factory.db`).
2. **Analisis Regulatorio:** El Agente Analista descompone el requerimiento e infiere los criterios de aceptacion conforme a los decretos oficiales vigentes.
3. **Plan Arquitectonico:** El Agente Arquitecto diseña los cambios sin tocar ficheros.
4. **Implementacion en Git Worktree:** El Agente Desarrollador inicializa una rama aislada (`feat/task-xxx`) dentro de `.worktrees/`.
5. **Pruebas en Sandbox Seguro:** El Agente Tester ejecuta `npm test`, `npx playwright test` o `cargo test` dentro del entorno restringido.
6. **Auditoria de Seguridad:** El Agente Revisor escanea el diff con `SecretScanner` para asegurar cero credenciales expuestas.
7. **Aprobacion Humana y Promocion:** Solo el Director Tecnico Ganadero o el Responsable de Seguridad pueden emitir la decision formal de transicion a `DONE` y autorizar la creacion de la Pull Request hacia la rama protegida `master`.

---

## 5. Consola de Gestion Integral de Escritorio para Windows

Los operadores, desarrolladores y responsables tecnicos disponen de una aplicacion grafica nativa en Windows para supervisar este ciclo de vida en tiempo real:
- **Repositorio Dedicado:** [Console-AI-Dev-Infrastructure](https://github.com/SADOCKDOG/Console-AI-Dev-Infrastructure)
- **Lanzador:** Archivo ejecutable por lotes `run_console.bat` en la infraestructura de desarrollo y en la consola.
- **Capacidades Operativas:**
  - Monitorizacion en tiempo real de FCC Server (8082), Backend FastAPI (8000), base de datos SQLite y Microsoft Foundry (`sadogfarm.onmicrosoft.com`).
  - Gestion del tablero Kanban: visualizacion de expedientes tecnicos, creacion de tareas asistidas y firma de aprobaciones humanas para transicion a `DONE`.
  - Gestor de incidencias AI-GRC: diagnostico y resolucion auditada de bloqueos normativos o alertas de seguridad.
  - Exportacion de informes forenses de auditoria de cumplimiento en formato Markdown.

---

## 6. Expediente de Validacion: Modulo de Trazabilidad y Evaluacion Zoosanitaria Porcina (RD 787/2023)

### A. Datos del Expediente
- **Identificador de Tarea:** `TASK-LM-PORCINE-COMPLIANCE-02`
- **Rama de Trabajo Aislada:** `test/software-factory-porcine-traceability`
- **Marco de Gobernanza:** Repositorio privado [Autonomous-Doc-Compliance](https://github.com/SADOCKDOG/Autonomous-Doc-Compliance) (Procedimiento `SOP-SF-001`, ISO/IEC 42001, NIST AI RMF).
- **Directivas Inyectadas con Hash SHA-256:**
  - `policy_analyst.md`: `79de69b60a6a1f9f5b6e9d40dff98a2b08fdf73992c8b39e8bd997e1845ee0ed`
  - `policy_architect.md`: `3487c4eba15dd4aab6620a1567767e13a8017157c296612fc8c3b4815ec0693f`
  - `policy_developer.md`: `07ff9594ee457c9f8945858f184a40c73a494624c0c6540a58439cc9440cc1ae`
  - `policy_uiux.md`: `548fe387bdabee51e7eda602ca470e620aaccea0b59b1a75dcf273456aef19ed`
  - `policy_tester.md`: `c5066957c6c5b2b5bab08788ce08833f99a34af004f3c47152e6f7861f84eeea`
  - `policy_reviewer.md`: `87d6a917a815b22b0ad360f1681327e0d06f9b461e731aa2746e376783a7a75e`

### B. Arquitectura e Integracion en el Ecosistema
1. **Extension del Motor Central (`MotorTrazabilidad` en `js/trazabilidad.js`):**
   - Incorporacion de `evaluarMovimientoPorcino(db, options)` en el nucleo de negocio.
   - Consulta transaccional a `animales` y `sanitarios_ganado`, aplicando `checkSupresion` para el bloqueo automatico de partidas con periodos de retirada de medicamentos veterinarios activos.
2. **Anclaje en el Shell ERP (`js/erp-shell.js`):**
   - Integracion en el menu lateral oficial de escritorio dentro de `NAV_GROUPS` (`gegan -> trazabilidad-porcina` y `tramites -> tram-porcino`).
   - Ruta activa: `#/trazabilidad?modulo=porcino`.
3. **Conformidad con el Sistema de Diseno (`js/views/trazabilidad-porcina-view.js`):**
   - Uso exclusivo de tokens W3C de `css/design-tokens.css` (`--surface-card`, `--surface-input`, `--p-gold`, `--c-success`, `--c-danger`).
   - Consumo dinamico del codigo REGA de la finca activa (`ES210050001234`) a traves de `Fincas.getActive()`.
   - Dimensiones tactiles ergonomicas $\ge 48\text{ px}$.

### C. Resultados de Aseguramiento de Calidad (QA)
- **Pruebas Unitarias Node.js:** 16/16 aserciones superadas con exito (100% PASS, 0 fallos) en `tests/porcine-traceability.unit.test.js`.
- **Validacion Visual Playwright:** Capturas nominales y de bloqueo generadas en `docs/screenshots/`.
- **Validacion en Vivo y Coexistencia de Base de Datos:** Certificada por el Director Tecnico mediante captura de pantalla de la aplicacion en ejecucion local (`localhost:8080/index.html#/trazabilidad?modulo=porcino`), constatando ubicacion en sidebar, armonia de tokens y lectura del REGA real.
- **Evidencia Visual Archivada:** `docs/screenshots/evidencia_usuario_integracion_real.png`.
- **Revision de Seguridad SecOps:** 0 secretos detectados en diff.
- **Firma Humana Criptografica (AI-GRC):**
  - Actor: `director_tecnico_veterinario`
  - Firma SHA-256: `9490814df9d0a9c55e5716fc575af6b5f59c57d50c54b81f90b361379fbe4dda`
  - Estado: `DONE` (Registrado en `factory.db`).
