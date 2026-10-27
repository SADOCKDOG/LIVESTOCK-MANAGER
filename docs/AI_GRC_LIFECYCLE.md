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
- **Lanzador:** Archivo ejecutable por lotes `run_console.bat` en la infraestructura de desarrollo.
- **Capacidades Operativas:**
  - Monitorizacion en tiempo real de FCC Server (8082), Backend FastAPI (8000), base de datos SQLite y Microsoft Foundry (`sadogfarm.onmicrosoft.com`).
  - Gestion del tablero Kanban: visualizacion de expedientes tecnicos, creacion de tareas asistidas y firma de aprobaciones humanas para transicion a `DONE`.
  - Gestor de incidencias AI-GRC: diagnostico y resolucion auditada de bloqueos normativos o alertas de seguridad.
  - Exportacion de informes forenses de auditoria de cumplimiento en formato Markdown.
