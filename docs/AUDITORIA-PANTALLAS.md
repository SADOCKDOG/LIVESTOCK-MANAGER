# Auditoría Integral de Pantallas — Livestock Manager

> Iniciada el **2026-07-02** · App v4.8.8 · CSS 5.3.3 · Estándar: `.agent/AGENTS.md` (Cork Manager)
> Alcance: pantallas, botones, wizards, cards, textos (encabezados/descriptivos/unidades),
> colores de textos y líneas en cards, notificaciones, y navegación al retroceder/cancelar.
> Metodología TQM: análisis semántico de los datos ANTES de aplicar correcciones.

---

## 1. Hallazgos globales (transversales)

| # | Sev. | Hallazgo | Estado |
|---|:---:|---|:---:|
| G1 | 🔴 | **CSS corrupto**: `.card-accent-green/blue/red/orange/purple/amber` tenían `border-top: none !important;` inyectado EN MITAD del valor hex (`border-left-color: #; …;10b981;`) — un reemplazo automático (fix_dash/strip_borders) rompió las 6 clases; todas las cards accent caían al marrón corcho. | ✅ corregido |
| G2 | 🔴 | `.card-accent-gold` se usa 9× en vistas pero **no estaba definida** en el CSS. | ✅ corregido (→ `var(--p-gold)`) |
| G3 | 🟠 | `css/design-tokens.css` era código muerto con valores divergentes. **Resuelto**: ahora es la FUENTE ÚNICA de tokens (`:root` migrado desde styles.css + colores de módulo `--c-orange/--c-purple/--c-pink`), cargado antes de styles.css y precacheado en SW. | ✅ 2026-07-02 |
| G4 | 🟠 | **Colores hardcodeados fuera de paleta** en vistas (conteo): `#10b981`×134, `#ef4444`×103, `#f59e0b`×64, `#8b5cf6`×58, `#d97706`×36, `#f97316`×20, `#cc0000`×11, `#fbbf24`×9, `#a855f7`×9, `#ec4899`×8, `#FFD700`×7… La paleta corporativa es: `#CCFF00`, `#FFD600`, `#FF4444`, `#3b82f6` (+ gris `#94A3B8`). | Fase 3 |
| G5 | 🟠 | Dos mapas de color de módulos contradictorios (dropdown header vs sheet "Más", ambos violando AGENTS en Zonas/Híbrido). **Resuelto**: mapa único `js/module-colors.js` (`window.MODULE_COLORS`/`getModuleColor`) consumido por dropdown, `updateHeaderColor()` y sheet "Más" (vía tokens). Paleta ampliada oficialmente en AGENTS.md: naranja `#F97316` (Animales/Cuaderno), violeta `#A855F7` (Proveedores/Manuales/Documentos), rosa `#EC4899` (Logística). | ✅ 2026-07-02 |
| G6 | 🟡 | `.neon-success` mezcla paletas: borde `var(--c-success)` (lima) pero glow `rgba(16,185,129,…)` (esmeralda). Gradiente con `#059669` hardcodeado (styles.css ~485). | Fase 3 |
| G7 | 🟡 | `dashboard-view.js` conserva `border-top: 3px solid #FF4444/#FF9800/#a855f7` inline (neutralizados por el `!important` global → código muerto y 2 colores fuera de paleta). | Fase 3 |
| G8 | 🟡 | **Estilos inline** en vistas: informes 222, dashboard 127, explotación 72, trazabilidad 42, ajustes 40, compradores 34, wizards-censo/guía/crotales ~31 c/u… (parte justificada: plantillas PDF). | Fase 3 (por lotes) |
| G9 | 🟡 | **Toasts**: 123× `App.toast()` + 233× `App.toastError()`; `App.toast` infiere la semántica por prefijo emoji (✅/❌/⚠️). Los `Toast.success/warning/info` casi no se usan (1×). Convención implícita frágil. | Fase 6: estandarizar |
| G10 | 🔴 | Navegación retroceder/cancelar. **Resuelto**: (a) back físico cierra el sheet "Más"; (b) back físico con modal/Confirm abierto pulsa su Cancelar (resuelve promesas y callbacks); (c) back físico con wizard abierto pasa por el botón Cancelar; (d) Cancelar de `WizardManager` confirma el descarte cuando hay pasos avanzados ("Se perderán los datos introducidos", botones Salir/Continuar aquí) y respeta `onCancel`; (e) `/venta-carne` añadida a `_routesConVolver`. `/documentos` se deja sin volver (es módulo de nivel superior del menú Más). | ✅ 2026-07-02 |
| G11 | 🟡 | `.page-title-blue/green/purple` usan `#60a5fa/#34d399/#a78bfa` — fuera de paleta. | Fase 3 |
| G12 | 🟢 | Emojis funcionales en botones/tabs: **0** ✓ · `alert()/confirm()` nativos: **0** ✓ | OK |

### Mapa de equivalencias propuesto (Fase 3)

| Hardcodeado | Sustituir por | Semántica |
|---|---|---|
| `#10b981`, `#34d399`, `#059669` | `var(--c-success)` `#CCFF00` | éxito/zonas/híbrido |
| `#ef4444`, `#cc0000`, `#FF9800`→revisar | `var(--c-danger)` `#FF4444` | peligro/carne |
| `#f59e0b`, `#fbbf24`, `#d97706`, `#b45309`, `#FFD700`, `#eab308` | `var(--c-warning)` `#FFD600` | aviso/alertas |
| `#60a5fa`, `#4FACFE` | `var(--c-info)` `#3b82f6` | info/leche/listas |
| `#8b5cf6`, `#a855f7`, `#a78bfa`, `#9333ea`, `#ec4899`, `#f97316` | **decisión de David**: no existen en la paleta corporativa (hoy identifican Proveedores/Logística/Manuales/Animales/CoMer). Opciones: (a) reasignar a los 4 semánticos; (b) ampliar AGENTS.md con 2-3 colores de módulo oficiales. | módulos sin color oficial |

---

## 2. Plan de fases

| Fase | Contenido | Estado |
|---|---|:---:|
| F1 | Quick-wins de bugs objetivos: G1, G2 | ✅ 2026-07-02 |
| F2 | **Mapa único de colores de módulo** (constante `window.MODULE_COLORS` o similar) + migrar dropdown del header, sheet "Más" y `updateHeaderColor()` + design-tokens.css canónico + paleta ampliada en AGENTS.md | ✅ 2026-07-02 |
| F3 | Migración de colores a tokens por lotes de vistas (orden: dashboard → ganadería → expro → comer → listas → informes → wizards) + G6, G7, G11 + decisión G3 | ⬜ |
| F4 | Navegación: back físico cierra sheet "Más"; cancelar/back en wizard con confirmación de descarte (vía `onCancel` + `Confirm`); completar `_routesConVolver` | ✅ 2026-07-02 |
| F5 | **Pase visual por pantalla** (checklist §3): textos, encabezados, unidades (kg, L, €, cab., UGM), capitalización, glassmorphism de KPIs, pills | ⬜ |
| F6 | Notificaciones (campana, mini-badge, vista alertas) + estandarización de toasts semánticos | ⬜ |

**Disciplina por lote:** TQM → editar → bump `CACHE_NAME`+`?v=` → `npm run build:free` → `npx cap sync android` → verificación preview/USB → commit+push.

---

## 3. Checklist por pantalla

Leyenda: 🤖 escaneo automático hecho · 👁 pase visual · ✅ conforme · ⬜ pendiente

| Ruta / Pantalla | 🤖 | 👁 | Hallazgos específicos |
|---|:---:|:---:|---|
| `#/` Dashboard | ✅ | ✅ | G7 (border-top muertos, 127 inline); marco y cards OK tras F1 marco |
| `#/ganaderia` | ✅ | ⬜ | 15 inline |
| `#/rebanos` (+detalle) | ✅ | ⬜ | 24 inline |
| `#/animales` (+detalle) | ✅ | ⬜ | 25 inline; color módulo `#f97316` fuera de paleta (G5) |
| `#/explotacion` (ExPro) | ✅ | ⬜ | 72 inline |
| `#/carne` · `#/leche` · `#/hibrido` | ✅ | ⬜ | híbrido usa `#10b981` (G5) |
| `#/zonas` (+detalle) | ✅ | ⬜ | color módulo contradictorio (G5: debe ser `#CCFF00`) |
| `#/comercializacion` (+albarán/venta) | ✅ | ⬜ | 16 inline; `/venta-carne` sin volver (G10d) |
| `#/gastos` (+detalle) | ✅ | ⬜ | 14 inline |
| `#/informes` | ✅ | ⬜ | 222 inline (mayoría PDF, revisar resto) |
| `#/cuaderno` | ✅ | ⬜ | 16 inline; color `#d97706` (G4) |
| `#/trazabilidad` | ✅ | ⬜ | 42 inline |
| `#/documentos` | ✅ | ⬜ | 27 inline; sin volver (G10d) |
| `#/compradores` (+detalle) | ✅ | ⬜ | 34 inline |
| `#/proveedores` (+detalle) | ✅ | ⬜ | color `#a855f7` fuera de paleta (G4/G5) |
| `#/transportistas` | ✅ | ⬜ | 18 inline; color `#ec4899` fuera de paleta |
| `#/contrato` | ✅ | ⬜ | — |
| `#/ajustes` | ✅ | ✅ | 40 inline; toggles nuevos OK; cards accent restauradas (G1/G2) |
| `#/manuales` | ✅ | ⬜ | 11 inline; color `#9333ea` fuera de paleta |
| Notificaciones (campana/badge/alertas) | ⬜ | ⬜ | F6 |
| Wizards (9) | ✅ | ⬜ | censo/guía/crotales ~31 inline c/u; cancelar sin confirmación (G10) |
| Onboarding / Bienvenida | ✅ | ✅ | versión unificada ✓ |
| Menú "Más" (sheet) | ✅ | ✅ | colores G5; back físico no lo cierra (G10a) |
| Menú desplegable header | ✅ | ✅ | colores G5 |

---

## 4. Registro de cambios de la auditoría

- **2026-07-02** — F1: reparadas `.card-accent-*` corruptas (G1) y añadida `.card-accent-gold` (G2). Documento creado.
- **2026-07-02** — Marco: haz de luz interior en header y bottom-nav (efecto unión).
- **2026-07-02** — F2: `design-tokens.css` = fuente única de tokens (G3); paleta ampliada en AGENTS.md (naranja/violeta/rosa de módulo); mapa único `js/module-colors.js` consumido por dropdown, header y sheet "Más" (G5). Cambio de color notable: Animales pasa de rojo a **naranja** en la cabecera (coherente con su color de módulo).
- **2026-07-02** — Header: punto de finca activa único y exterior; viñeta flexible (adiós max-width 90px legacy); componentes centrados en el mismo eje.
- **2026-07-02** — F4: cascada del back físico (modal → dropdown → sheet Más → wizard vía Cancelar → confirmar salida en dashboard → history.back); confirmación de descarte en WizardManager con pasos avanzados (verificada en preview: aparece diálogo, Continuar mantiene, Salir cierra + onCancel); `/venta-carne` con botón volver (G10).
