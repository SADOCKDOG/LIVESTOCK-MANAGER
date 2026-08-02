# Plan de Implementación: Guías Interactivas (Wizard Flotante) para GeGan, ExPro y CoMer

**Fecha:** 2026-08-02  
**Espec:** `docs/superpowers/specs/2026-08-02-guias-interactivas-design.md`  
**Estado:** Listo para ejecución  
**Branch objetivo:** `feature/guias-interactivas` (master protegida → PR)

---

## Resumen del alcance

| Pilar | Vista principal | Tabs reales (carrusel) | Guías totales |
|-------|-----------------|------------------------|---------------|
| GeGan | `GanaderiaView` | animales, rebanos, patrimonio¹, zonas, sanidad | 6 (5 tab + 1 panorámica) |
| ExPro | `ExplotacionView` | explotacion, lacteo, silos, fitosanitarios, gastos, proveedores, tramites | 8 (7 tab + 1 panorámica) |
| CoMer | `ComercializacionView` | leche, carne, compradores, contratos, transportistas | 6 (5 tab + 1 panorámica) |
| **Total** | | | **21 guías** |

¹ `patrimonio` solo si `flags.carne`

---

## Fases y desglose TDD

### FASE 0 — Motor + Infraestructura (~1 sesión)

**Objetivo:** `GuideManager` funcional + registro + hooks + toggle Ajustes + FAB + loader de guías.

| # | Tarea | Archivos | Test (TDD) |
|---|-------|----------|------------|
| 0.1 | Crear `js/guide-manager.js` — overlay z-3500, máscara SVG (4 rect + hueco), popover anclado (arriba/abajo), dots progreso, botones (Ant/Sig/Saltar/No mostrar), focus trap, Escape=Salt, recálculo resize/scroll | `js/guide-manager.js` | `maybeStart` respeta precondiciones; `waitFor` resuelve target tardío ≤2s; nav next/prev/skip/dismiss muta estado; chip reanudar auto-oculta con `#tour-flotante-overlay` o `.asistente-loading-overlay` |
| 0.2 | MutationObserver perezoso para wizard (childList sin subtree, por identidad de nodo `_nodoPausa` capturado en `addedNodes`) | `js/guide-manager.js` | Observer reanuda tras `remove()` del nodo pausado; ignora otros `removedNodes`; cubre 3 salidas (Finalizar, Cancelar confirmado, Android-back `wizard.remove()`) |
| 0.3 | Crear `js/guide-registry.js` — `register(guide)`, `getByRouteTab(route,tab)`, `getPanoramica(route)`, filtrado `applies(flags)` | `js/guide-registry.js` | Lookup correcto por (route,tab); panorámicas (`tab:null`) separadas; `applies` filtra `gegan.patrimonio` sin carne |
| 0.4 | Hook auto-arranque en `app.js:1188` tras `await App[methodName](params)` — `GuideManager.maybeStart(path, tab)` con `tab = window[viewName]._activeSubModule` y helper `_viewForMethod` | `js/app.js` | Auto-arranque tras render; no arranca si bienvenida activa; no arranca si `enabled=false` o `seen`/`dismissed` |
| 0.5 | Helper cambio tab en `app.js:663` — `_cambiarSubmoduloConGuia(viewName,key)` que `await window[viewName]._cambiarSubModulo(key)` y `EventBus.emit('view:tabChanged',{viewName,tab:key})` | `js/app.js` | Emit tras DOM nuevo montado; `GuideManager` re-ancla paso activo; `maybeStart` evalúa guía nuevo tab |
| 0.6 | Patch 3 vistas: `_cambiarSubModulo` → `return this.render()` (1 línea cada una) | `ganaderia-view.js:108`, `explotacion-view.js:16`, `comercializacion-view.js:306` | Retorno Promise mantiene compatibilidad con `onclick` existentes |
| 0.7 | Toggle "Guías interactivas" + botón "Reiniciar todas" en `ajustes-view.js` — persistido en `appConfig.guides` merge defaults | `js/views/ajustes-view.js` | Toggle off → `isEnabled()=false` → no auto-arranque; reset limpia `seen`+`dismissed`; merge sobrevive configs previas |
| 0.8 | Loader guías por grupo de ruta en `_ensureRouteScripts` — carga `js/guides/<pillar>/*` bajo demanda | `js/app.js` | Scripts guías cargados solo al entrar a su ruta; no bloquean carga inicial |
| 0.9 | FAB "Guía" por subvista + icono `Icons.ayuda()` nuevo en `js/icons.js` | `js/icons.js`, 3 vistas + sub-vistas | FAB visible si `enabled`; relanza guía tab actual ignore `seen`/`dismissed` |
| 0.10 | Estilos CSS overlay guide + popover + spotlight + chip reanudar (z-4500, responsive, Marco Galáctico, sin borde sup iluminado) | `css/styles.css` | z-index sanado (§3.2 spec); chip debajo toast (6000) y btn-pesaje-close (5001) |
| 0.11 | Tests unitarios motor (Jest/jsdom o equivalente ligero del proyecto) | `__tests__/guide-manager.test.js` | Cobertura §9 Testing spec |

---

### FASE 1 — GeGan (~2 sesiones)

**Objetivo:** 6 guías declarativas + `data-guide` en vistas GeGan + verificación navegador.

| # | Guía | Archivo | Pasos clave (launch real) |
|---|------|---------|---------------------------|
| 1.1 | `gegan.panoramica` | `js/guides/gegan-panoramica.js` | 4 pasos narrativos recorren carrusel (sin `launch`) |
| 1.2 | `gegan.animales` | `js/guides/gegan-animales.js` | Alta animal → `WizardAnimal.showForm({})`; crotal/sexo/raza/f.nac obligatorios |
| 1.3 | `gegan.rebanos` | `js/guides/gegan-rebanos.js` | Crear lote → `WizardRebano.showForm({})`; nombre/capacidad/ubicacion |
| 1.4 | `gegan.patrimonio` | `js/guides/gegan-patrimonio.js` | (condicional `flags.carne`) Censo → `WizardCenso.abrir()`; lotes/conversión |
| 1.5 | `gegan.zonas` | `js/guides/gegan-zonas.js` | Parcela → `WizardZona.showForm({})`; UGM/carga/PAC |
| 1.6 | `gegan.sanidad` | `js/guides/gegan-sanidad.js` | Tratamiento → `WizardTratamiento.abrir(opts)`; vacuna/supresión **siempre visibles** |

**Atributos `data-guide` mínimos** (añadir en cada sub-vista):
- `animales-view.js`: `btn-add-animal`, `crotal-input`, `sexo-select`, `raza-select`, `fnac-input`
- `rebanos-view.js`: `btn-add-rebano`, `nombre-input`, `capacidad-input`, `ubicacion-select`
- `patrimonio-view.js`: `btn-censo`, `lote-select`, `conversion-input`
- `zonas-view.js`: `btn-add-zona`, `nombre-input`, `ugm-input`, `carga-input`, `pac-checkbox`
- `sanidad-view.js`: `btn-add-tratamiento`, `animal-select`, `tipo-select`, `producto-input`, `supresion-input`

**Verificación:** cada guía en web (PWA) + emulador WebView Android (safe-areas, edge-to-edge, rotación).

---

### FASE 2 — ExPro (~2 sesiones)

**Objetivo:** 8 guías + `data-guide` vistas ExPro.

| # | Guía | Archivo | Pasos clave (launch real) |
|---|------|---------|---------------------------|
| 2.1 | `expro.panoramica` | `js/guides/expro-panoramica.js` | 4 pasos recorren carrusel ExPro |
| 2.2 | `expro.explotacion` | `js/guides/expro-explotacion.js` | Modo explotación (balance leche/carne) — FAB adaptativo; sin wizard |
| 2.3 | `expro.lacteo` | `js/guides/expro-lacteo.js` | Partida leche → `WizardPartidaLeche.showForm({})`; fecha/volumen/grasa/proteina |
| 2.4 | `expro.silos` | `js/guides/expro-silos.js` | Silo → `WizardSilo.showForm({})`; tipo/capacidad/stock |
| 2.5 | `expro.fitosanitarios` | `js/guides/expro-fitosanitarios.js` | Aplicación → `WizardFitosanitario.showForm({})`; parcela/producto/dosis |
| 2.6 | `expro.gastos` | `js/guides/expro-gastos.js` | Gasto → `GastoWizard.open(opts)`; concepto/importe/fecha/proveedor |
| 2.7 | `expro.proveedores` | `js/guides/expro-proveedores.js` | Proveedor → `WizardProveedor.showForm({})`; nombre/CIF/contacto |
| 2.8 | `expro.tramites` | `js/guides/expro-tramites.js` | Trámite → `WizardTramite.showForm({})`; tipo/organismo/fecha/doc |

**Atributos `data-guide`** en sub-vistas correspondientes (`lacteo-view.js`, `silos-view.js`, etc.) — 5-6 por vista.

**Verificación:** mismo criterio Fase 1.

---

### FASE 3 — CoMer (~1.5 sesiones)

**Objetivo:** 6 guías + `data-guide` vistas CoMer.

| # | Guía | Archivo | Pasos clave (launch real) |
|---|------|---------|---------------------------|
| 3.1 | `comer.panoramica` | `js/guides/comer-panoramica.js` | 4 pasos recorren carrusel CoMer |
| 3.2 | `comer.leche` | `js/guides/comer-leche.js` | (condicional `flags.leche`) Guía movimiento → `WizardGuiaMovimiento.abrir(borrador)`; comprador/volumen/fecha |
| 3.3 | `comer.carne` | `js/guides/comer-carne.js` | (condicional `flags.carne`) Venta → `VentaMasivaWizard.open(borrador)`; comprador/cabezas/peso/precio |
| 3.4 | `comer.compradores` | `js/guides/comer-compradores.js` | Comprador → `WizardComprador.showForm({})`; nombre/CIF/direccion/contacto |
| 3.5 | `comer.contratos` | `js/guides/comer-contratos.js` | Contrato → `WizardContrato.showForm({})`; comprador/tipo/duracion/condiciones |
| 3.6 | `comer.transportistas` | `js/guides/comer-transportistas.js` | Transportista → `WizardTransportista.showForm({})`; nombre/matricula/autorizacion |

**Atributos `data-guide`** en sub-vistas CoMer.

**Verificación:** mismo criterio.

---

### FASE 4 — Cierre y QA (~0.5 sesión)

| # | Tarea | Detalle |
|---|-------|---------|
| 4.1 | QA regresión web PWA MSIX + WebView Android | Spotlight, popover, safe-areas, rotación, z-index |
| 4.2 | Extender `PremiumQA.runAll()` | Verifica persistencia `guides.{enabled,seen,dismissed}` y toggle desactiva auto-arranque |
| 4.3 | Bump `CACHE_NAME` en `sw.js` + `?v=` en `<script>`/`<link>` editados | SW cache-first obligatorio |
| 4.4 | Build `:free` + `cap sync android` | Flujo estándar repo |
| 4.5 | Commit + PR a `master` (rama protegida) | Usuario revisa antes de fusionar |

---

## Interfaces y contratos (TypeScript-like para claridad)

```ts
// js/guide-registry.js
interface Guide {
  id: string;                    // 'gegan.animales'
  pillar: 'gegan'|'expro'|'comer';
  route: string;                 // '/ganaderia' | '/explotacion' | '/comercializacion'
  tab: string | null;            // 'animales' | null (panorámica)
  applies: (flags: {leche:boolean, carne:boolean}) => boolean;
  steps: GuideStep[];
}

interface GuideStep {
  target: string | null;         // selector o null = paso narrativo centrado
  waitFor?: boolean;             // reintenta querySelector hasta 2s
  title: string;
  body: string;                  // markdown ligero: **negrita** para datos clave
  launch?: () => void;           // arranca wizard real con su API concreta
  optional?: boolean;            // salta si precondición no se da
}

// js/guide-manager.js
interface GuideState {
  enabled: boolean;
  seen: string[];                // ids completadas
  dismissed: string[];           // "No mostrar de nuevo"
}

// Métodos públicos
GuideManager.maybeStart(route: string, tab: string | null): Promise<void>;
GuideManager.start(guideId: string): Promise<void>;
GuideManager.relaunch(guideId: string): Promise<void>;
GuideManager.next(): void;
GuideManager.prev(): void;
GuideManager.skip(): void;
GuideManager.dismiss(): void;     // marca dismissed + persiste
GuideManager.isEnabled(): boolean;
GuideManager._hydrate(): Promise<void>;  // startup si !App._config
```

---

## Puntos de integración exactos (file:line verificado)

| Punto | Archivo:Línea | Acción |
|-------|---------------|--------|
| Hook auto-arranque | `app.js:1188` | Tras `await App[methodName](params)` → `GuideManager.maybeStart(path, tab)` |
| Helper _viewForMethod | `app.js` (nuevo) | Mapa `methodName → viewName` (p.ej. `renderGanaderia` → `GanaderiaView`) |
| Cambio tab | `app.js:663` | Reemplaza inline `cerrarYNavegar` por `App._cambiarSubmoduloConGuia(viewName,key)` |
| _cambiarSubModulo return | `ganaderia-view.js:108` | `return this.render()` |
| _cambiarSubModulo return | `explotacion-view.js:16` | `return this.render()` |
| _cambiarSubModulo return | `comercializacion-view.js:306` | `return this.render()` |
| Config persistencia | `ajustes-view.js:241,251` | `_saveConfig` mergea `guides` en `App._config` |
| Icono ayuda | `js/icons.js` (nuevo método) | `ayuda(): string` → SVG interrogación `currentColor` |
| Loader guías | `app.js` `_ensureRouteScripts` | Carga `js/guides/<pillar>/*` bajo demanda |

---

## Criterios de aceptación por fase

| Fase | Done cuando |
|------|-------------|
| 0 | Motor arranca guía test en `/ganaderia` tab `animales`; MutationObserver reanuda tras cerrar `WizardAnimal`; toggle Ajustes off/on funciona; FAB relanza; chip reanudar aparece/oculta correctamente; tests unitarios pasan |
| 1 | 6 guías GeGan completan sin error en navegador + emulador; `patrimonio` solo aparece con `flags.carne`; supresión sanidad visible en paso correspondiente |
| 2 | 8 guías ExPro completan; `explotacion` (tab por defecto) auto-arranca primero |
| 3 | 6 guías CoMer completan; `leche`/`carne` condicionales a flags |
| 4 | `PremiumQA` verde; build `:free` + `cap sync` ok; PR creado |

---

## Riesgos ya mitigados en el spec (no repetir)

- C-1..C-5, B-1..B-6 resueltos en diseño (§2.1, §5.2, §6.1, §6.2, §6.3)
- Z-index saneado (§3.2)
- MutationObserver cubre 3 salidas wizard sin tocar `wizard-manager.js`
- `waitFor` resuelve targets lazy/modales
- Re-anclaje `requestAnimationFrame` ×2 tras `view:tabChanged`
- Merge defaults config sobrevive migraciones

---

## Comandos de verificación rápida

```bash
# Tests unitarios motor
npm test -- __tests__/guide-manager.test.js

# Build free + sync android
npm run build:free && npx cap sync android

# Lint / typecheck si aplica
npm run lint
```

---

## Notas para el ejecutor (subagent-driven-development)

- **Una tarea = un subagente** (según skill). Cada fila de la tabla TDD es una tarea atómica.
- **No `git add .` nunca** — añadir archivos individuales (`git add <archivo>`).
- **Commit + push tras cada fase** (PR a master, usuario revisa).
- **Verificación en navegador real** obligatoria por guía (no solo tests).
- **Icono `Icons.ayuda()`** — añadir en `js/icons.js` siguiendo patrón `info()` (`js/icons.js:445`).
- **Selectores `data-guide`** — añadir en vistas/sub-vistas según tabla Fases 1-3; son el contrato estable entre guía y vista.
- **`launch` usa APIs reales** — no hay interfaz uniforme; cada guía declara su llamada concreta (ver `launch` en catálogo spec §4).
- **SW cache-first** — bump `CACHE_NAME` + `?v=` en `index.html` tras tocar CSS/JS (memoria `deploy-cache-build`).