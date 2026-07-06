# Reorganización ERP + Cierre de Huecos (SIGGAN) — Plan de Implementación

> **Para ejecución agéntica:** SUB-SKILL REQUERIDA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar tarea a tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Reorganizar los módulos y acciones de registro en 3 hubs (Ganadería, ExPro, CoMer) + capa transversal, con dueño único de cada dato, y cerrar el hueco normativo P1, sin romper la trazabilidad SIGGAN.

**Architecture:** Refactor incremental por fases independientes y desplegables una a una. Cada fase es reversible y se valida contra la suite `SigganQA.runAll()` (17 tests) más verificación manual de navegación. No se toca el modelo de datos salvo en las fases de huecos (P2–P5), que quedan al final y son opcionales.

**Tech Stack:** Vanilla JS (patrón `App` + vistas `*-view.js`), IndexedDB (`window.db`), Capacitor Android, suite QA propia (`js/qa-siggan.js`).

## Global Constraints

- **No borrado físico:** toda baja/anulación es trazable vía evento en `registro_eventos` (nunca `delete` duro de datos de negocio).
- **Dueño único de registro:** cada acción de alta vive en un solo hub; los demás consultan en lectura.
- **Regresión obligatoria:** `SigganQA.runAll()` debe seguir en verde (17/17) al cerrar cada fase.
- **Build oficial:** tras cambios de UI/JS, `npm run build:free` + `cap sync android`; bumpear `CACHE_NAME` y `?v=` (SW cache-first).
- **Idioma UI:** español con tildes correctas.

---

## Fase 0 — Baseline de regresión (red de seguridad)

**Objetivo:** Fotografiar el estado verde antes de tocar nada, para detectar cualquier regresión introducida por el refactor.

**Files:**
- Ejecutar (no modificar): `js/qa-siggan.js`, `js/qa-siggan-test17.js`

- [ ] **Paso 1:** Abrir la app en navegador/dispositivo y ejecutar `SigganQA.runAll()` en consola. Anotar resultado (esperado: 17/17 verde).
- [ ] **Paso 2:** Registrar en un fichero `docs/superpowers/plans/baseline-qa-2026-07-06.txt` la salida de los tests y capturas de las 3 vistas hub actuales (Ganadería, ExPro, CoMer) como referencia visual "antes".
- [ ] **Paso 3:** Crear rama de trabajo `feat/reorg-erp-siggan` desde `master`.
- [ ] **Paso 4:** Commit del baseline.

**Verificación:** 17/17 tests en verde documentados. Rama creada.

---

## Fase 1 — P1: Bloqueo sanitario automático en venta de leche (HUECO NORMATIVO)

**Objetivo:** Impedir la expedición de leche cuando hay supresión farmacológica activa. Hoy `checkSupresion()` se invoca para carne pero **no** automáticamente al guardar el albarán de leche (riesgo normativo SIGGAN).

**Files:**
- Modify: `js/views/wizards/wizard-albaran-leche.js` (flujo de guardado del albarán)
- Consume: `js/trazabilidad.js` → `MotorTrazabilidad.checkSupresion(db, animalId, fechaEvaluar, tipoDestino)`
- Test: `js/qa-siggan.js` (añadir aserción al TEST 15)

**Interfaces:**
- Consume: `checkSupresion(db, animalId, fecha, 'leche')` → `{ apto: boolean, diasRestantes: number, fecha_liberacion: string }`
- La supresión de leche opera a nivel **rebaño** (`Sanitarios.rebanoId`), por lo que la comprobación itera los animales/rebaño de la entrega.

- [ ] **Paso 1: Escribir el test que falla.** En `js/qa-siggan.js`, extender el TEST 15 con un caso: crear sanitario con `prohibidoLeche=true` sobre un rebaño, intentar guardar un albarán de leche de ese rebaño y afirmar que el guardado se **rechaza** (`apto=false`). Ejecutar `SigganQA.runAll()` y verificar que ese caso FALLA (hoy no hay bloqueo).
- [ ] **Paso 2: Implementar el bloqueo.** En el guardado del wizard de albarán de leche, antes del `db.put('comercializacion_leche', ...)`, invocar `checkSupresion(db, animalId, fechaRecogida, 'leche')` para cada animal del rebaño de la entrega. Si algún resultado es `apto=false`, abortar el guardado y mostrar aviso con `diasRestantes`/`fecha_liberacion`.
- [ ] **Paso 3: Ejecutar** `SigganQA.runAll()` y verificar que el nuevo caso del TEST 15 PASA y los 17 tests siguen verdes.
- [ ] **Paso 4: Verificación manual.** Registrar tratamiento con `prohibidoLeche` y confirmar en UI que la retirada de leche queda bloqueada con mensaje claro.
- [ ] **Paso 5: Commit** (`feat: bloqueo sanitario automatico en venta de leche (SIGGAN P1)`).

**Verificación:** No es posible expedir leche de un rebaño con supresión activa; 17/17 + nuevo caso verde.

---

## Fase 2 — Gastos: dueño único en ExPro

**Objetivo:** Eliminar la triplicación (ExPro + CoMer + ruta `/gastos`). El **alta** de gasto vive solo en ExPro; CoMer muestra gastos comerciales en **lectura** para el cálculo de márgenes.

**Files:**
- Modify: `js/views/comercializacion-view.js` (tab "Gastos": quitar FAB de alta → dejar listado filtrado en lectura; `_renderGastos()` ~L367-383)
- Modify: `js/views/explotacion-view.js` (confirmar ExPro como único punto de `App._abrirFormularioGasto()`)
- Modify: `js/app.js` (ruta `/gastos` → redirige a `/explotacion?sub=gastos` en vez de vista suelta, o marcarla como deep-link interno)

- [ ] **Paso 1:** En `comercializacion-view.js`, en el tab Gastos, sustituir la acción "Registrar Gasto" (`App._abrirFormularioGasto()`) por un enlace "Registrar en Explotación" que navegue a `#/explotacion?sub=gastos`. Mantener el listado de gastos comerciales (transporte/matanza) en lectura.
- [ ] **Paso 2:** Verificar que en ExPro el alta de gasto sigue disponible y es el único punto de creación.
- [ ] **Paso 3:** En `app.js`, hacer que `/gastos` redirija a `#/explotacion?sub=gastos` (evitar dos UIs de gastos).
- [ ] **Paso 4: Verificación manual:** confirmar que solo existe un formulario de alta de gasto (ExPro) y que CoMer muestra los gastos correctos en lectura.
- [ ] **Paso 5:** `SigganQA.runAll()` (17/17) y commit (`refactor: gastos con dueno unico en ExPro`).

**Verificación:** Un único punto de alta de gasto; CoMer en lectura; sin ruta suelta duplicada.

---

## Fase 3 — Sanidad: reubicar dueño a Ganadería

**Objetivo:** El **alta de tratamiento** pasa a ser acción de Ganadería (libro sanitario censal, alineado SIGGAN), manteniendo un acceso rápido desde ExPro.

**Files:**
- Modify: `js/views/ganaderia-view.js` (añadir acción "Nuevo tratamiento" → `wizard-tratamiento`)
- Modify: `js/views/explotacion-view.js` (`_abrirAsistenteSanitario` pasa a ser acceso rápido que reutiliza el mismo wizard; no duplica lógica)
- Consume: `js/views/wizards/wizard-tratamiento.js`

- [ ] **Paso 1:** En `ganaderia-view.js`, añadir en las acciones de registro (FAB/menú) la opción "Nuevo tratamiento" que abre `wizard-tratamiento`.
- [ ] **Paso 2:** En `explotacion-view.js`, mantener el botón "Tratamiento" pero que invoque el **mismo** wizard (acceso rápido), sin lógica propia divergente.
- [ ] **Paso 3: Regresión sanitaria:** ejecutar `SigganQA.runAll()` y confirmar que TEST 5 (tratamientos) y TEST 15 (bloqueo leche/carne) siguen verdes tras el movimiento.
- [ ] **Paso 4: Verificación manual:** registrar un tratamiento desde Ganadería y desde el acceso rápido de ExPro; confirmar que ambos producen el mismo registro y que el bloqueo de venta funciona.
- [ ] **Paso 5:** Commit (`refactor: sanidad con dueno en Ganaderia + acceso rapido en ExPro`).

**Verificación:** Alta de tratamiento accesible desde Ganadería; ExPro reutiliza sin duplicar; tests sanitarios verdes.

---

## Fase 4 — Directorio de Terceros en CoMer

**Objetivo:** Agrupar Compradores, Proveedores, Transportistas y Contratos como sub-módulo "Terceros / Directorio comercial" dentro de CoMer (hoy sueltos en "Más").

**Files:**
- Modify: `js/views/comercializacion-view.js` (añadir tab/sección "Terceros" con acceso a los 4 maestros)
- Modify: `index.html` (quitar los 4 ítems del `nav-more-sheet`)
- Modify: `js/app.js` (las rutas `/compradores`, `/proveedores`, `/transportistas`, `/contrato` se mantienen como detalle, pero se entra desde CoMer › Terceros)

- [ ] **Paso 1:** En `comercializacion-view.js`, añadir sección "Terceros" con 4 accesos: Compradores, Proveedores, Transportistas, Contratos (reusando las vistas/rutas existentes).
- [ ] **Paso 2:** Añadir en el alta de Gasto (ExPro) un selector de Proveedor que enlaza al mismo maestro (un maestro, dos accesos), preservando `proveedorId` FK.
- [ ] **Paso 3:** En `index.html`, retirar Compradores/Proveedores/Transportistas del `nav-more-sheet` (ahora se alcanzan por CoMer).
- [ ] **Paso 4: Verificación manual:** llegar a los 4 maestros desde CoMer › Terceros; confirmar que el alta de proveedor sigue enlazando gastos.
- [ ] **Paso 5:** `SigganQA.runAll()` (17/17) y commit (`feat: directorio de terceros en CoMer`).

**Verificación:** Los 4 maestros agrupados en CoMer; "Más" descargado de terceros.

---

## Fase 5 — Reorganización de navegación

**Objetivo:** Bottom-nav de 5 (Inicio · Ganadería · ExPro · CoMer · Más); Animales/Rebaños pasan a tabs internos de Ganadería; "Más" queda como capa transversal (Cuaderno, Documentos, Informes, Trazabilidad, Exportación, Ajustes, Manuales).

**Files:**
- Modify: `index.html` (bottom-nav ~L116-171 y `nav-more-sheet`)
- Modify: `js/app.js` (lógica `_updateNav`/`route` ~L744-833; estados activos)
- Modify: `js/views/ganaderia-view.js` (integrar Animales y Rebaños como tabs internos)

- [ ] **Paso 1:** En `ganaderia-view.js`, añadir tabs internos (patrón `_cambiarSubModulo` como ExPro) para Animales, Rebaños, Zonas, Sanidad, Reproducción, Movimientos.
- [ ] **Paso 2:** En `index.html`, quitar Animales y Rebaños del bottom-nav; dejar 5 fijos. Reordenar `nav-more-sheet` a solo capa transversal.
- [ ] **Paso 3:** En `app.js`, ajustar el resaltado de nav activo para que `/animales`, `/rebanos`, etc. marquen Ganadería como activo.
- [ ] **Paso 4: Verificación manual:** recorrer toda la navegación; confirmar que no hay rutas inalcanzables y que "Más" solo tiene la capa transversal.
- [ ] **Paso 5:** `SigganQA.runAll()` (17/17), `build:free` + `cap sync android`, commit (`feat: reorganizacion de navegacion ERP (3 hubs + transversal)`).

**Verificación:** 5 ítems en barra inferior; Animales/Rebaños dentro de Ganadería; "Más" = transversal.

---

## Fase 6 — Selector de modo global (carne/leche/híbrido)

**Objetivo:** Unificar el modo, hoy duplicado con estados independientes en Ganadería y ExPro, en un único filtro de contexto persistente que consumen ambos hubs y CoMer.

**Files:**
- Modify: `js/app.js` (estado global de modo + persistencia)
- Modify: `js/views/ganaderia-view.js`, `js/views/explotacion-view.js`, `js/views/comercializacion-view.js` (leer el modo global en vez de estado local)

- [ ] **Paso 1:** Introducir `App.modoActivo` persistido (localStorage/config) con un único control en header o Ganadería.
- [ ] **Paso 2:** Sustituir los selectores locales (`_changeMode`, `_cambiarModo`) por lectura/escritura del modo global, emitiendo evento para re-render.
- [ ] **Paso 3: Verificación manual:** cambiar el modo en un hub y confirmar que se refleja en los otros dos.
- [ ] **Paso 4:** `SigganQA.runAll()` (17/17) y commit (`refactor: selector de modo global de contexto`).

**Verificación:** Un solo control de modo; coherente entre los 3 hubs.

---

## Fase 7 — Huecos de negocio P2–P5 (posterior / opcional)

**Objetivo:** Cerrar los huecos de trazabilidad y rentabilidad. Requieren cambios de modelo de datos → **fase separada**, cada hueco con su propio ciclo TDD sobre `SigganQA`.

- [ ] **P2 — Gasto por animal:** añadir `animalId` opcional en `gastos.js` (tabla bridge `animal_gastos`); coste por individuo en `BalanceService`.
- [ ] **P3 — Producción → Venta:** enlazar `produccion_carne.animalId` con `comercializacion_carne` para trazar kg pesado → kg canal.
- [ ] **P4 — Contrato exigido:** validar vigencia/precio del contrato en `wizard-venta-masiva`.
- [ ] **P5 — Origen de compra:** `proveedorId`/`rega_origen` enlazado en alta tipo "Compra".

**Verificación:** Cada P con su test añadido a `SigganQA` y en verde antes de commit.

---

## Self-Review (cobertura vs. auditoría)

- Reasignación Gastos → Fase 2 ✅ · Sanidad → Fase 3 ✅ · Terceros → Fase 4 ✅ · Navegación/Animales-Rebaños → Fase 5 ✅ · Modo global → Fase 6 ✅ · Huecos P1 → Fase 1 ✅ · P2–P5 → Fase 7 ✅.
- Regla de no-borrado y regresión 17/17 aplicadas como constraint global en cada fase.
- Orden: primero el hueco normativo (P1), luego consolidaciones de bajo riesgo (Gastos, Sanidad, Terceros), luego navegación (mayor impacto visual), y modelo de datos al final.
