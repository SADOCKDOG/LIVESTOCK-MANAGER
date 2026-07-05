                                                                # Auditoría UI/UX y Guía de Diseño — Livestock Manager (SIGGAN)

> **Objetivo del documento.** Definir el **sistema de diseño único** (tokens, componentes, patrones y reglas) que sirva de referencia normativa para toda la app.
>
> **Plataforma objetivo: teléfono Android en vertical** (`~360–430 px` de ancho). Todo el diseño se valida contra ese viewport. No hay vista de escritorio ni tablet como objetivo principal.
>
> Estado: **referencia activa** · Versión app: 4.8.5 / CSS 5.5.0 / SW: corcho-v6.7.22

---

## 1. Resumen ejecutivo

La aplicación ha sido plenamente estandarizada bajo el sistema de diseño **Premium OLED v4.8.5**. Se han consolidado los cuatro grandes Hubs operativos (Ganadería, ExPro, CoMer e Informes) bajo una arquitectura visual idéntica y una navegación intuitiva.

| Síntoma | Magnitud | Estado |
|---|---|---|
| Estilos **inline** (`style="..."`) | **~100** residuales | [OK] Saneado |
| **Emojis** usados como iconos | **0** (prohibición total, 2026-07-03) | [OK] Saneado |
| Cabecera Dinámica | Hub Centric Gold | [OK] Implementado |
| Consistencia KPI | Alineación 2+1 | [OK] Implementado |

---

## 2. Inventario de soluciones (v4.8.5)

### 2.1 Cabecera Premium Gold Neon
- **Banner Hub Centrado**: El título de la vista (Icono SVG + Texto) flota en el centro absoluto sin interferir con logo o badge.
- **Línea de Neón Integral**: Una línea de 2px recorre toda la base del banner. El color es dinámico según el modo: Rojo (Carne), Azul (Leche), Verde (Híbrido) u Oro (General).
- **Efecto Glow**: Icono SVG de 17px con `drop-shadow` amarillo/oro (`#facc15`) y resplandor suave.

### 2.2 Hubs Operativos (Botones Neón)
- **Etiquetas Blanco Maestro**: Texto blanco puro (`#ffffff !important`), peso 800, 0.8rem, **centrado absoluto**.
- **Panel de Acciones**: Tarjeta con gradiente, encabezado centrado (sin línea superior) y botones neón con iconos SVG brillantes.
- **Sincronización CoMer**: La sección de Comercialización (CoMer) ahora es un Hub con navegación superior y botones neón, eliminando los antiguos botones "Nuevo".

### 2.3 Sistema de KPIs y Registros
- **Alineación Perfecta**: Todas las cajas KPI tienen una altura fija de `90px` para evitar descuadres.
- **Regla de Centrado 2+1**: Si existen 3 KPIs, se muestran 2 en la primera fila y el 3º centrado debajo.
- **Fichas de Censo**: Información enriquecida con género (♀/♂), edad calculada y Lote/Rebaño asociado con icono SVG.
- **Fichas de Comercial**: Layout optimizado que ocupa el 100% del ancho, eliminando columnas vacías y usando iconos SVG para cada metadato (Fecha, Zona, Albarán).

### 2.4 Navegación Inteligente
- **Prioridad Láctea**: Ganadería, ExPro y CoMer seleccionan por defecto el modo **Lácteo** en explotaciones mixtas, respetando la elección manual posterior.

---

## 2. Inventario de problemas (por categoría)

### 2.1 Iconografía — `[ALTA]`
> **Hallazgo crítico (verificado).** `js/icons.js` **no estaba cargado** en `index.html` y `Icons.*()` **no se invocaba en ninguna parte** del código: la "librería centralizada de iconos" era **código muerto**. Por eso el 100% de los iconos eran emojis. → *Corregido en Fase 2: se conecta la librería, se amplía con los glifos de dominio que faltaban y se añade el sistema de tamaños `.icon`/`.icon-sm/md/lg/xl`. Queda pendiente la migración de los ~1.110 emojis vista por vista.*

- Existe `js/icons.js` (`Icons.home()`, SVG con `currentColor`, `stroke-width: 2`) **pero se usa poco**.
- **1.110 emojis** (vaca, dinero, gráfico, check, carne, leche…) dispersos por las vistas. En Android cada emoji se renderiza con el set del sistema: tamaño, peso y color inconsistentes, **no heredan el dorado del tema** y descolocan la alineación vertical.
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
--p-gold:       #fbbf24;   /* AÑADIR: hoy se usa sin definir */
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

### 3.11 Patrones Neon UI (Fase 4+)

Componentes incorporados tras las fases de migración. Todos en `css/styles.css:2524-2572`.

#### Widget-link neon (botón de acceso rápido entre módulos)

Botón columnar con borde y glow de color semántico. Uso típico: rejilla de acceso en vistas hub (Ganadería, ExPro).

```html
<button class="widget-link-btn--neon neon-success">
<!-- icono SVG via Icons.* -->
<span class="widget-link-label">Animales</span>
</button>
```

```css
.widget-link-btn--neon   /* contenedor base: flex-col, borde lateral neon, box-shadow glow */
+ variante de color (una por botón):
.neon-danger   → var(--c-danger)  rojo
.neon-info     → var(--c-info)    azul
.neon-success  → var(--c-success) verde
.neon-warning  → var(--c-warning) ámbar
.neon-accent   → #a855f7          violeta
.neon-theme    → var(--theme-color) (color de modo activo)

.widget-link-label     /* 0.85rem, bold */
.widget-link-label-sm  /* 0.80rem, bold, line-height 1.1 — dos líneas */
.widget-link-label-xs  /* 0.75rem, bold — texto muy largo */
```

Reglas:
- Icono SVG (`Icons.*`) arriba, label abajo. Nunca emoji como icono.
- El SVG hereda el tamaño fijo 24×24px por CSS (`.widget-link-btn--neon svg { width:24px; height:24px }`). No pasar parámetros de tamaño a `Icons.*`.
- Color vía clase `.neon-*`; nunca `--neon-color` inline (excepción solo si el color es computado dinámicamente en JS y no hay clase `neon-*` aplicable).
- `:active` tiene `scale(0.95)` incorporado; no añadir más transiciones.
- Texto de label: mismo tamaño/fuente/color en todos los botones (`.widget-link-label`). Sin abreviaciones con punto salvo que el texto completo supere el ancho disponible tras verificar. Sin "Registrar" como prefijo — el contexto de la sección lo da el header `section-header-neon`.
- Vocabulario estándar de acciones: `Peso (kg)` · `Ordeño (L)` · `Tratamiento` · `Alimentación` · `Energía` · `Fitosanitario` · `Carga/Consumo`.

#### Section header neon

Cabecera de sección con color temático y glow de texto.

```html
<div class="section-header-neon text-label" style="--neon-color: var(--c-success)">
REBAÑOS ACTIVOS
</div>
```

`--neon-color` se acepta inline aquí porque es un **valor computado/dinámico** (color del modo activo). Esta es la única excepción a la regla de "sin inline styles".

#### Mode switch (selector de modo de explotación)

```html
<div class="expro-mode-switch">
<button class="expro-mode-btn active" style="--mode-color:#ef4444">CÁRNICO</button>
<button class="expro-mode-btn"        style="--mode-color:#3b82f6">LÁCTEO</button>
<button class="expro-mode-btn"        style="--mode-color:#10b981">HÍBRIDO</button>
</div>
<!-- variante para ganadería: ganaderia-mode-switch / ganaderia-mode-btn -->
```

`--mode-color` inline está justificado: es el color semántico del modo de explotación, valor dinámico.

#### Variantes de color adicionales en `.btn` (Fase 4)

```css
.btn--gold      /* var(--p-gold), texto negro — acción principal dorada */
.btn--blue      /* var(--c-info) — acción informativa */
.btn--purple    /* #8b5cf6 — reproducción/genética */
.btn--red       /* var(--c-danger) — acción destructiva alternativa */
.btn--amber     /* var(--p-gold-dark) — aviso */
.btn--dark-red  /* #450a0a — acción destructiva de bajo perfil */
```

#### Nota-box (caja de información contextual)

```html
<div class="nota-box nota-box-green">Texto informativo</div>
```

```css
.nota-box           /* padding 12px, font 0.85rem */
.nota-box-red       /* fondo rojo tenue + borde izquierdo rojo */
.nota-box-green     /* fondo verde tenue + borde izquierdo verde */
.nota-box-purple    /* fondo violeta tenue + borde izquierdo violeta */
.nota-box-blue      /* fondo azul tenue + borde completo azul + radius */
.nota-box-amber     /* fondo ámbar tenue + borde izquierdo ámbar */
```

Usar para avisos SIGGAN, notas normativas, restricciones de supresión, etc.

#### Hint-box (pista/ayuda dentro de formularios)

```css
.hint-box-gold    /* fondo dorado muy tenue, borde gold 20% */
.hint-box-violet  /* fondo violeta muy tenue, borde violet 15% */
.hint-box-green   /* fondo verde tenue, borde --c-success */
```

#### Comprador-mode-header

Cabecera de contexto de modo para vistas de compradores.

```html
<div class="comprador-mode-header comprador-mode-header--hibrido">
Modo Híbrido
</div>
```

```css
.comprador-mode-header--carne   → rojo
.comprador-mode-header--leche   → azul
.comprador-mode-header--hibrido → verde
```

#### Card con gradiente oscuro

```html
<div class="card card-dark-gradient border-top-theme">...</div>
```

`.card-dark-gradient` añade gradiente sutil `#111→#0a0a0a`. `.border-top-theme` pinta el borde superior con `var(--theme-color, var(--p-gold))`.

---

## 4. Hoja de ruta de implementación (por fases)

Orden por **impacto visual / riesgo**. Cada fase es entregable y verificable de forma aislada.

| Fase | Contenido | Riesgo | Impacto |
|---|---|---|---|
| **0. Tokens y bugs base** | [OK] *Hecho:* `--p-gold`, `--p-gold-dark`, `--p-cork`, `--p-cork-dark` definidos en `:root`. Botón "volver" operativo en `app.js`. | Muy bajo | Medio |
| **1. Consolidación CSS** | [OK] *Hecho:* inputs unificados (`.form-input/.premium-input/.wizard-input`); FAB único (`.fab-btn`); parche `:has()` eliminado; 33 colores hardcodeados `#d97706`/`#fbbf24` → `var(--p-gold-dark)`/`var(--p-gold)` en `styles.css`; `.mb-6` duplicado eliminado. SW: `corcho-v6.7.14`. | Bajo | Medio |
| **2. Iconos** | [OK] *Hecho:* conectar `icons.js`, ampliar `Icons`, sistema `.icon`. [OK] *Batch 1 (35):* `informes-view` (17), `app.js` (5), `produccion-view` (7), `wizard-venta-masiva` (2), `wizard-albaran-leche` (2), `ayuda.js` (2). [OK] *Batch 2 (10):* `ajustes-view` (calendario→calendar, dinero→dinero), `pesajes-ui` (leche ×2, paquete, guardar), `calidad-leche` (gráfico→grafico, microscopio→fitosanitario, píldora→veterinario), `wizard-crotales` (paquete). ~~Residuales decorativos: marcadores en datos, toast messages, placeholders, species emojis en tarjetas de datos, PDF templates~~ → **cerrado 2026-07-03**: barrido total de emoticonos visibles (DOM/PDF) según norma de AGENTS.md §2 (solo persisten los marcadores funcionales de toasts, que nunca se pintan). SW: `corcho-v6.7.12`. | Bajo | **Alto** |
| **3. Mensajes** | Implementar `Toast`/`Confirm` unificados; reemplazar `alert`/`confirm` nativos. | Medio | Alto |
| **4. Estilos inline** | [OK] *Batch 4 terminado:* ~1.361 → **~600** estilos inline. Migraciones en `informes-view`, `ajustes-view`, `dashboard-view`, `cuaderno-view`, `trazabilidad-view`, `ayuda.js`, `comercializacion-view`, `hibrido-view`, `leche-view`, `carne-view`, `animales-view`, `gastos-view`, `transportistas-view`, `explotacion-view`, `produccion-view`, `proveedores-view`, `documentos-view`, `zonas-view`, `rebanos-view`, `asistente-configuracion`, `wizard-venta-masiva`, `wizard-traslado`, `manuales-view`, `app.js`, `trazabilidad-view`, `compradores-view`, `pesajes-ui`. Clases añadidas: `.nota-box-*`, `.pdf-loader-*`, `.btn-overlay-close`, `.wizard-body-text`, `.sec-divider-top`, `.flex-col-end`, `.modal-scroll`, `.select-sm`, `.pl-18`, `.nota-box-amber`, `.flex-2`, `.mr-12`, `.checkbox-lg`, `.min-w-0`, `.nowrap`, `.border-left-violet`, `.row-border-dark`, `.row-sep-222`, `.border-top-5-danger`, `.border-top-4-violet`, `.btn--dark-red`, `.msg-feedback`, `.traz-meta-grid`, `.traz-stats-grid`, `.traz-timeline-line`, `.comprador-mode-header{--carne\|--leche\|--hibrido}`, `.btn-pesaje-close`, `.pesaje-titulo-h2`, `.pesaje-rebano-box`, `.pesaje-info-grid`, `.pesaje-animal-box`, `.pesaje-animal-label`, `.pesaje-crotal`, `.pesaje-peso-input`, `.pesaje-unidad-label`, `.pesaje-leche-grid`, `.pesaje-guardar-btn`, `.pesaje-logis-grid`, `.pesaje-logis-grid-2`, `.pesaje-neto-box`, `.pesaje-lista-box`, `.pesaje-lista-header`. Batch 3: `.prod-options-grid`, `.prod-opt-icon`, `.prod-opt-label`, `.wizard-sel-btn{--sm}`, `.h-full`, `.gap-20`, `.prod-entity-list`, `.about-card`, `.about-logo`, `.about-desc`, `.about-footer`, `.max-w-340`, `.border-top-5-amber`, `.manual-header`, `.manual-iframe`, `.tr-blocked`, `.tr-active`, `.stat-box-aptos`, `.stat-box-bloq`, `.venta-tabla-wrapper`, `.table-collapse`, `.thead-sticky`, `.hint-box-gold`, `.hint-box-violet`, `.btn-inline-green`, `.btn-inline-blue`, `.border-top-222`. Batch 4 (22 migraciones): `.border-top-5-gold`, `.border-top-4-blue`, `.border-top-5-success`, `.border-top-5-violet`, `.border-left-333`, `.btn--gold`, `.btn--blue`, `.progress-track{--lg}`, `.resize-none`, `.gasto-bar-wrap`, `.hint-box-green`. Batch 5 — cierre (17 migraciones en `informes-view`, `ajustes-view`, `transportistas-view`, `modal-manager`, `produccion-ui`): `.max-w-380/500/600/800`, `.mx-auto`, `.bg-222`, `.border-top-5-blue`, `.wizard-sel-icon{--sm}`, `.error-dialog--gold`. [OK] **COMPLETADO** — 625 residuales son 100% intocables o justificados: ~350 PDF-templates, ~120 CSS custom props dinámicos, ~80 colores computados, ~75 skeletons. **Cero estilos migrables pendientes.** SW: `corcho-v6.7.19`. | Medio | Medio |
| **5. Formularios y wizards** | [OK] *Hecho:* `--p-gold` ya definido; alias `.form-input/.premium-input/.wizard-input` unificados en CSS; `formulario-finca.js` reemplazado por `wizard-finca.js`; `wizard-manager.js` ya usa clases CSS (v1.1.0); parche `:has()` eliminado; `asistente-configuracion.js` limpio: 10 `style.display` → `classList`, logo e iconos inline → clases CSS (`.asistente-logo`, `.asistente-msg-body`, `.text-2rem`), `.tour-btn:disabled` con `opacity:0.4` en CSS. | Medio-alto | Medio |
| **6. Rediseño de pantallas densas** | [OK] *Hecho:* Nav 2 niveles en `informes-view` (5 categorías × 22 sub-tabs). `_renderValidacionModal`: 28 inline styles → 21 clases `.modal-val-*` en styles.css; accent dinámico via `--val-accent`. Loader PDF: `text-4xl+animation inline` → `.pdf-loader-emoji` (renombrada a `.pdf-loader-icon` con SVG `Icons.documento()` el 2026-07-03). Runtime CSS injection y `main.style` overrides ya eliminados en Fase 4. Terminología SIGGAN/BADIGEX correcta en modal y en `fincas.js`. SW: `corcho-v6.7.13`. | Alto | Alto |

> Alcance aprobado: **amplio con rediseño**. Las fases 5–6 incluyen reorganización de layouts y refundido de frameworks.

---

## 5. Reglas rápidas (checklist para cada PR)

- [ ] Sin `style="..."` salvo valor dinámico justificado.
- [ ] Sin colores/espaciados literales: usar variables CSS.
- [ ] Iconos vía `Icons.*` (SVG), no emoji funcional.
- [ ] Botones de la familia `.btn` (altura ≥ 48px).
- [ ] Botones de acción principal en vistas modo-specific: usar `widget-link-btn widget-link-btn--neon neon-{color}`
      con icono SVG + `.widget-link-label` apilados en columna (nunca `btn-create` / `btn-success`).
      Color por modo: Carne → `neon-danger`, Leche → `neon-info`, Híbrido → `neon-success`.
      Tratamiento sanitario → `neon-accent` en cualquier modo.
- [ ] Cards de registros/datos (v4.8+): usar `.card-registro` con alineación `stretch`.
      Identificadores en Oro (`var(--p-gold)`) peso 950.
      Derecha: **Viñeta Iluminada** arriba (glow + fondo 15%) y acción "FICHA ➔" abajo (en `var(--c-warning)`).
      Referencia: `docs/PLANTILLA-CARD-REGISTRO.md`.
- [ ] Textos de contexto en cards: usar `text-xs text-gray uppercase font-extrabold tracking-wider` para línea de label,
      `text-xs text-aaa mt-4 leading-relaxed` para descripción. Nunca `text-[0.55rem]` o `text-gray-600`.
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
