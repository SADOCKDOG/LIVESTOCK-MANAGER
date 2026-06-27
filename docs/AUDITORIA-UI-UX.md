# Auditoría UI/UX y Guía de Diseño — Livestock Manager (SIGGAN)

> **Objetivo del documento.** Diagnosticar el estado actual de la interfaz tras las modificaciones de adaptación a **SIGGAN** y definir un **sistema de diseño único** (tokens, componentes, patrones y reglas) que sirva de referencia para estandarizar toda la app antes de implementar los cambios.
>
> **Plataforma objetivo: teléfono Android en vertical** (`~360–430 px` de ancho). Todo el diseño se valida contra ese viewport. No hay vista de escritorio ni tablet como objetivo principal.
>
> Estado: **borrador para revisión** · Versión app: 4.5.0 / CSS 5.2.0

---

## 1. Resumen ejecutivo

La aplicación tiene **buena base de diseño** (paleta "Deep Dark" OLED, sistema de utilidades CSS v5.0, librería `Icons` SVG, `WizardManager` y `ModalManager`), pero esa base **convive con código legacy sin migrar**. El resultado es una interfaz funcional pero **inconsistente**: mismos elementos se ven y se comportan distinto según la pantalla.

Cifras medidas sobre el código (50 archivos JS):

| Síntoma | Magnitud | Peores ofensores |
|---|---|---|
| Estilos **inline** (`style="..."`) | **1.361** en 43 archivos | `informes-view.js` (371), `explotacion-view.js` (62), `pesajes-ui.js` (52), `ajustes-view.js` (52), `dashboard-view.js` (50), `cuaderno-view.js` (49) |
| **Emojis** usados como iconos | **1.110** en 50 archivos | `informes-view.js` (157), `ajustes-view.js` (80), `qa-siggan.js` (42), `explotacion-view.js` (42) |
| Llamadas a feedback **mezclado** (`alert`/`confirm`/`toast`/`modal`) | **349** en 36 archivos | `informes-view.js` (27), `ajustes-view.js` (26), `animales-view.js` (16) |

**Conclusión:** el problema no es falta de sistema, es **falta de adopción del sistema existente** + duplicación de soluciones paralelas. La estrategia debe ser **consolidar, migrar y borrar lo legacy**, no crear más componentes.

---

## 2. Inventario de problemas (por categoría)

### 2.1 Iconografía — `[ALTA]`
> **Hallazgo crítico (verificado).** `js/icons.js` **no estaba cargado** en `index.html` y `Icons.*()` **no se invocaba en ninguna parte** del código: la "librería centralizada de iconos" era **código muerto**. Por eso el 100% de los iconos eran emojis. → *Corregido en Fase 2: se conecta la librería, se amplía con los glifos de dominio que faltaban y se añade el sistema de tamaños `.icon`/`.icon-sm/md/lg/xl`. Queda pendiente la migración de los ~1.110 emojis vista por vista.*

- Existe `js/icons.js` (`Icons.home()`, SVG con `currentColor`, `stroke-width: 2`) **pero se usa poco**.
- **1.110 emojis** (🐄 💰 📊 ✅ 🥩 🥛) dispersos por las vistas. En Android cada emoji se renderiza con el set del sistema: tamaño, peso y color inconsistentes, **no heredan el dorado del tema** y descolocan la alineación vertical.
- El propio `WizardManager` usa flechas emoji en sus botones (`⬅ Volver`, `Siguiente ➔`, `Finalizar ✔`) en lugar de `Icons`.
- **Regla a aplicar:** SVG (`Icons`) para navegación, acciones, estados y badges. Emoji **solo** como decoración explícitamente aceptada (p. ej. ilustración de estado vacío), nunca como icono funcional.

### 2.2 Estilos / CSS — `[ALTA]`
- **1.361 estilos inline** pese a existir utilidades equivalentes (`.text-*`, `.flex`, `.gap-*`, `.card`, `.form-*`).
- **Colores hardcodeados.** La paleta define `--color-metric-primary/warning/danger/info`, pero el código repite `#10b981`, `#f59e0b`, `#ef4444`, `#3b82f6` como literales en miles de sitios.
- **Bug confirmado:** `#header-back-btn` (`css/styles.css:143`) y `.link-back` (`:2131`) usan `var(--p-gold)`, **variable que no existe** en `:root` (solo está `--p-cork`). El color del botón "volver" queda sin definir.
- **CSS inyectado desde JS.** `informes-view.js` llama a `_inyectarEstilosTabs()` / inyecta `<style>` en runtime. Los estilos deben vivir en `styles.css`.
- **Contenedor roto.** `informes-view.js:15-18` hace `main.style.maxWidth='100%'` y sobrescribe paddings, rompiendo el contenedor global de `600px`. La vista debe respetar el layout estándar.
- **Parche frágil.** Reglas con `:has(> h2[style*="2.2rem"])` + `!important` (`:2228-2255`) parchean vistas legacy que aún inyectan `<h2 style="font-size:2.2rem">`. Hay que migrar esos `<h2>` a `.page-title-bar` y eliminar el parche.
- **Duplicación CSS:**
  - `.premium-input` ≡ `.wizard-input` ≡ `.form-input` (idénticos: padding 14px, radius 12px, bg `#1a1a1a`, border `#333`).
  - `.fab` (naranja, `:1150`) vs `.fab-btn` (verde, `:2310`) — **dos FAB distintos**.
  - Bloque de aliases de formulario declarado **dos veces**.
  - `--accent: #7fb069` (verde alcornoque) definido pero casi sin uso; el verde real es `#10b981`/`#059669`.

### 2.3 Botones — `[MEDIA]`
**8 sistemas paralelos** con alturas y radios sin criterio:

| Clase | Altura | Radio | Uso |
|---|---|---|---|
| `.btn` | 58px | 29px | acción principal full-width |
| `.wizard-btn-action` | 48px | 14px | wizards |
| `.btn-sm` | 48px | 14px | inline |
| `.btn-industrial` | ~64px | 15px | botones grandes |
| `.formulario-finca-botones .btn-primario` | ~52px | 14px | formulario finca |
| `.btn-action-blue/red` | auto | 12px | detalle |
| `.error-dialog-btn` | 48px | 14px | diálogos error |
| `.btn-naranja/verde` | — | 15px | industriales |

→ Consolidar en **una** familia `.btn` con modificadores de tamaño y semántica (ver §3.5).

### 2.4 Formularios y Wizards — `[MEDIA]`
- **Dos frameworks para lo mismo:**
  1. `WizardManager` (declarativo, 9 wizards) — el camino correcto.
  2. `formulario-finca.js` con su propio modal (`.formulario-finca-*`, inputs con radius/padding propios) + `asistente-configuracion.js`.
- Dentro del `WizardManager`, la cabecera y el footer usan **estilos inline** (`wizard-manager.js:25-27,36`) en vez de las clases `.wizard-header-*`.
- → Unificar todos los flujos multi-paso bajo `WizardManager`; migrar `formulario-finca` a un wizard (o a un formulario estándar con `.form-*`).

### 2.5 Mensajes / Feedback — `[ALTA]`
- Conviven **4 mecanismos**: `alert()`/`confirm()` nativos, `.toast`, `.error-dialog` (`error-handler.js`) y `ModalManager`.
- `alert()`/`confirm()` nativos **rompen el look Android** (diálogo del sistema, fondo blanco). Incluso `index.html` (`window.onerror`) hace `alert()`.
- El `.toast` es **amarillo fijo** (`#fbbf24`) y no usa los colores semánticos (éxito/aviso/error/info).
- → Un único API: `Toast.success/warning/error/info(msg)` para no-bloqueante y `Confirm.show({...})` (basado en `ModalManager` + `.error-dialog` restyled) para confirmaciones. Prohibir `alert`/`confirm` nativos.

### 2.6 Tipografía — `[MEDIA]`
- Escala mixta: semántica (`.text-sm/base/lg/xl`) **+** por valor (`.text-75`, `.text-82`, `.text-85`) **+** `rem` hardcodeado.
- → Una sola escala semántica con tokens (ver §3.3). Deprecar los nombres por valor.

### 2.7 Navegación e información — `[MEDIA]`
- `informes-view.js` tiene **23 pestañas** en scroll horizontal. En teléfono vertical esto es difícil de descubrir y de alcanzar con el pulgar. → Agrupar en categorías (acordeón, secciones o sub-menú) o reducir a las 5–7 más usadas + "Más informes".
- La `bottom-nav` (5 items + "Más") está bien dimensionada; mantener como patrón canónico.

### 2.8 Específico SIGGAN — `[REVISAR]`
- Existe `qa-siggan.js` (suite QA) con 42 emojis. La nomenclatura y terminología visible al usuario (REGA, DIMOE, guías de movimiento, libro de ventas) debe revisarse para coherencia con SIGGAN (Andalucía) vs. BADIGEX (Extremadura). → Validar etiquetas, no solo estilos.

---

## 3. Sistema de diseño objetivo (reglas a seguir)

Esta sección es **la referencia normativa**. Toda pantalla nueva o migrada debe cumplirla.

### 3.1 Principios
1. **Mobile-first vertical.** Diseñar y probar a 360–430px. Objetivos táctiles ≥ 48px. Acciones primarias al alcance del pulgar (mitad inferior).
2. **Un solo origen de estilo.** Cero `style="..."` en JS salvo valores verdaderamente dinámicos (p. ej. ancho de barra de progreso `%`). Todo lo demás → clases en `styles.css`.
3. **Tokens, no literales.** Ningún color/espaciado hardcodeado: usar variables CSS.
4. **Reutilizar, no duplicar.** Antes de crear una clase/componente, comprobar si ya existe.

### 3.2 Tokens de color
Mantener la paleta Deep Dark y **consolidar todo el color semántico en variables**. Añadir las que faltan y eliminar literales del código.

```css
:root {
  /* Marca */
  --p-cork:       #d4a373;
  --p-cork-dark:  #a0673a;
  --p-gold:       #fbbf24;   /* ⚠️ AÑADIR: hoy se usa sin definir */
  --p-gold-dark:  #d97706;

  /* Base OLED */
  --bg:            #000000;
  --surface:       #121212;
  --surface-light: #1e1e1e;
  --surface-input: #1a1a1a;
  --border:        #2a2a2a;
  --border-input:  #333333;

  /* Texto */
  --text-p:  #f8f9fa;
  --text-s:  #a0a0a0;
  --text-d:  #666666;   /* deshabilitado / placeholder */

  /* Semántica (única fuente de verdad para datos/estados) */
  --c-success: #10b981;
  --c-warning: #f59e0b;
  --c-danger:  #ef4444;
  --c-info:    #3b82f6;
  --c-accent:  #8b5cf6;  /* reproducción/violeta */
}
```
> Acción: reemplazar `#10b981 → var(--c-success)`, etc., en todo el código. Eliminar `--accent: #7fb069` o reutilizarlo conscientemente.

### 3.3 Escala tipográfica
Font: `'Inter', system-ui, -apple-system, sans-serif`. Una sola escala semántica:

| Token | Tamaño | Uso |
|---|---|---|
| `--fs-display` | 1.6rem | KPI grande / cifras destacadas |
| `--fs-h1` | 1.25rem | título de card |
| `--fs-h2` | 1.05rem | subtítulo de sección |
| `--fs-body` | 0.95rem | texto e inputs |
| `--fs-sm` | 0.85rem | secundario |
| `--fs-label` | 0.75rem | labels (uppercase) |
| `--fs-tiny` | 0.65rem | metadatos |

> Deprecar `.text-75/.text-82/.text-85` (mantener como alias temporales). Pesos: 400 normal, 700 énfasis, 900 cifras/títulos.

### 3.4 Espaciado y radios
Escala base **4px**: `4 · 8 · 12 · 16 · 20 · 24`. Radios: `--r-sm: 8px` (chips/inputs internos), `--r-md: 12–14px` (inputs/botones), `--r-lg: 16px` (cards), `--r-pill: 28px` (botón principal/FAB). Margen de contenido global: 16px; contenedor `max-width: 600px` centrado (**no sobrescribir por vista**).

### 3.5 Botones (familia única)
Una base + modificadores. Eliminar las 8 variantes paralelas.

```
.btn                      /* base: flex, gap, peso 800, transición, :active scale(.97) */
  .btn--block             /* width:100%, height 56px, radius pill (acción principal) */
  .btn--inline            /* height 48px, radius 14px, padding lateral (inline) */
  .btn--icon              /* 48×48, solo icono */
  .btn--fab               /* flotante 56×56, radius pill */
/* Semántica (color): */
  .btn--primary  (gold→dark-gold)   .btn--secondary (surface+border)
  .btn--success  .btn--danger  .btn--info  .btn--pdf  .btn--excel
```
Reglas: altura mínima **48px**; un solo FAB (unificar `.fab` y `.fab-btn`, color = acción primaria de la vista); icono SVG + texto, nunca emoji.

### 3.6 Formularios (sistema `.form-*` único)
Canónico: `.form-group > .form-label + (.form-input | .form-select | .form-textarea)`. Estados: `.is-error` + `.form-error`, `.form-help`. Deprecar `.premium-input` y `.wizard-input` como **alias** de `.form-input` (ya son idénticos) y migrar el markup progresivamente. Inputs ≥ 48px de alto, `font-size ≥ 16px` recomendado para evitar zoom de Android al enfocar.

### 3.7 Iconos
- Fuente única: `Icons.*` (SVG `currentColor`, `viewBox 0 0 24 24`, stroke 2).
- Tamaños estándar: 20 (inline), 24 (acción), 26 (nav), 28 (sheet).
- Color por herencia (`color`/`stroke`), nunca fijo.
- Añadir a `Icons` los glifos que hoy son emoji (sanidad, leche, carne, reproducción, ventas, PAC…).

### 3.8 Mensajes y diálogos
| Necesidad | Componente | API propuesta |
|---|---|---|
| Aviso no bloqueante | Toast | `Toast.success/warning/error/info(msg, ms?)` |
| Confirmación (sí/no) | Diálogo modal | `Confirm.show({title, msg, onOk, danger?})` |
| Error fatal | `error-dialog` | gestionado por `error-handler` |
| Formulario/flujo | `ModalManager` / `WizardManager` | — |

Reglas: **prohibido** `alert()`/`confirm()` nativos (sustituir los 349 usos progresivamente, empezando por los de cara al usuario). Toast usa color semántico, no amarillo fijo. Auto-dismiss 3–4s; un toast a la vez (cola).

### 3.9 Wizards (framework único)
- Todo flujo multi-paso usa `WizardManager`.
- Mover los estilos inline de la plantilla (`wizard-manager.js`) a `.wizard-header-fixed/.wizard-footer-fixed`.
- Botones de navegación con `Icons` (no `⬅ ➔ ✔`), usando `.btn--inline` + semántica.
- Cabecera estándar: título + "PASO x DE y" + barra de progreso.
- Migrar `formulario-finca.js` y `asistente-configuracion.js` a este framework.

### 3.10 Navegación
- `bottom-nav` (5 + "Más") = patrón canónico; conservar safe-area.
- Pantallas con muchas secciones (Informes, 23 tabs): agrupar en categorías o reducir; evitar scroll horizontal largo como única navegación.
- Header contextual: corregir `--p-gold`, mantener título + botón volver + badge de finca.

---

## 4. Hoja de ruta de implementación (por fases)

Orden por **impacto visual / riesgo**. Cada fase es entregable y verificable de forma aislada.

| Fase | Contenido | Riesgo | Impacto |
|---|---|---|---|
| **0. Tokens y bugs base** | Definir `--p-gold` y demás tokens; corregir botón "volver"; documentar escala. Sin cambios de layout. | Muy bajo | Medio |
| **1. Consolidación CSS** | Unificar inputs (alias), FAB único, familia `.btn`, eliminar duplicados y parche `:has()` (migrando los `<h2>` afectados). | Bajo | Medio |
| **2. Iconos** | ✅ *Hecho:* conectar `icons.js`, ampliar `Icons`, sistema `.icon`. ✅ *Batch 1:* 35 emojis funcionales migrados → SVG en `informes-view` (17: card-titles + botones Excel/PAC/Guardar), `app.js` (5: doc/delete/leche/guardar/borrar), `produccion-view` (7: tab Láctea + botones), `wizard-venta-masiva` (2: DIB/Veterinario), `wizard-albaran-leche` (2: Extracto/Antibióticos), `ayuda.js` (2: h2 Normativa). ⏳ *Pendiente:* emojis restantes en `animales-view`, `ajustes-view`, `dashboard-view`, `trazabilidad-view`, `cuaderno-view` (decorativos/datos/toasts — bajo impacto). SW: `corcho-v6.7.11`. | Bajo | **Alto** |
| **3. Mensajes** | Implementar `Toast`/`Confirm` unificados; reemplazar `alert`/`confirm` nativos. | Medio | Alto |
| **4. Estilos inline** | ✅ *En curso:* ~1.361 → **~754** estilos inline. Migraciones en `informes-view`, `ajustes-view`, `dashboard-view`, `cuaderno-view`, `trazabilidad-view`, `ayuda.js`, `comercializacion-view`, `hibrido-view`, `leche-view`, `carne-view`, `animales-view`, `gastos-view`, `transportistas-view`, `explotacion-view`, `produccion-view`, `proveedores-view`, `documentos-view`, `zonas-view`, `rebanos-view`, `asistente-configuracion`, `wizard-venta-masiva`, `wizard-traslado`, `manuales-view`. Clases añadidas: `.nota-box-*`, `.pdf-loader-*`, `.btn-overlay-close`, `.wizard-body-text`, `.sec-divider-top`, `.flex-col-end`, `.modal-scroll`, `.select-sm`, `.pl-18`, `.nota-box-amber`, `.flex-2`, `.mr-12`, `.checkbox-lg`, `.min-w-0`, `.nowrap`, `.border-left-violet`. Residuales (~754): ~350 PDF-templates (intocables), ~150 CSS custom props (`--kpi-color`, `--neon-color`), ~80 skeletons (dimensiones exactas), ~80 colores dinámicos computados, ~94 overrides específicos justificados. SW: `corcho-v6.7.10`. | Medio | Medio |
| **5. Formularios y wizards** | ✅ *Hecho:* `--p-gold` ya definido; alias `.form-input/.premium-input/.wizard-input` unificados en CSS; `formulario-finca.js` reemplazado por `wizard-finca.js`; `wizard-manager.js` ya usa clases CSS (v1.1.0); parche `:has()` eliminado; `asistente-configuracion.js` limpio: 10 `style.display` → `classList`, logo e iconos inline → clases CSS (`.asistente-logo`, `.asistente-msg-body`, `.text-2rem`), `.tour-btn:disabled` con `opacity:0.4` en CSS. | Medio-alto | Medio |
| **6. Rediseño de pantallas densas** | Reestructurar Informes (23 tabs) y otras vistas con sobrecarga; revisar terminología SIGGAN. | Alto | Alto |

> Alcance aprobado: **amplio con rediseño**. Las fases 5–6 incluyen reorganización de layouts y refundido de frameworks.

---

## 5. Reglas rápidas (checklist para cada PR)

- [ ] Sin `style="..."` salvo valor dinámico justificado.
- [ ] Sin colores/espaciados literales: usar variables CSS.
- [ ] Iconos vía `Icons.*` (SVG), no emoji funcional.
- [ ] Botones de la familia `.btn` (altura ≥ 48px).
- [ ] Inputs `.form-*` (alto ≥ 48px, font ≥ 16px).
- [ ] Mensajes vía `Toast`/`Confirm`, nunca `alert`/`confirm` nativos.
- [ ] Probado a 360px de ancho (Android vertical), respetando safe-areas.
- [ ] No se sobrescribe el contenedor global de 600px.

---

## 6. Anexo — referencias de código

- Paleta y base: `css/styles.css:6-35`
- Utilidades v5.0: `css/styles.css:716-901`
- Formularios unificados: `css/styles.css:1188-1425`
- Bug `--p-gold`: `css/styles.css:143`, `:2131`
- Parche `:has()` legacy: `css/styles.css:2228-2255`
- FAB duplicado: `css/styles.css:1150` y `:2310`
- Librería de iconos: `js/icons.js`
- Framework de wizards: `js/wizard-manager.js` (inline en `:25-27,36`)
- Peor densidad inline/emoji: `js/views/informes-view.js`
- Formulario paralelo: `js/formulario-finca.js`, `js/asistente-configuracion.js`
- Navegación y bottom-sheet: `index.html:98-278`
