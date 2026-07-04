# Auditoría Integral de Pantallas — Livestock Manager

> Iniciada el **2026-07-02** · App v4.8.8 · CSS 5.3.3 · Estándar: `.agent/AGENTS.md` (Cork Manager)
> Alcance: pantallas, botones, wizards, cards, textos (encabezados/descriptivos/unidades),
> colores de textos y líneas en cards, notificaciones, y navegación al retroceder/cancelar.
> Metodología TQM: análisis semántico de los datos ANTES de aplicar correcciones.

---

## 1. Hallazgos globales (transversales)

| # | Sev. | Hallazgo | Estado |
|---|:---:|---|:---:|
| G1 | [CRIT] | **CSS corrupto**: `.card-accent-green/blue/red/orange/purple/amber` tenían `border-top: none !important;` inyectado EN MITAD del valor hex (`border-left-color: #; …;10b981;`) — un reemplazo automático (fix_dash/strip_borders) rompió las 6 clases; todas las cards accent caían al marrón corcho. | [OK] corregido |
| G2 | [CRIT] | `.card-accent-gold` se usa 9× en vistas pero **no estaba definida** en el CSS. | [OK] corregido (→ `var(--p-gold)`) |
| G3 | [ALTO] | `css/design-tokens.css` era código muerto con valores divergentes. **Resuelto**: ahora es la FUENTE ÚNICA de tokens (`:root` migrado desde styles.css + colores de módulo `--c-orange/--c-purple/--c-pink`), cargado antes de styles.css y precacheado en SW. | [OK] 2026-07-02 |
| G4 | [ALTO] | Colores hardcodeados fuera de paleta en vistas (~500 ocurrencias). **Resuelto en F3** (4 lotes, commits bd33e91/71ae536/d209a75/9a7168f): todo a tokens salvo excepciones justificadas (PDF/print, Chart.js con literales corporativos, muestras del selector de tema, colorDark). | [OK] 2026-07-03 |
| G5 | [ALTO] | Dos mapas de color de módulos contradictorios (dropdown header vs sheet "Más", ambos violando AGENTS en Zonas/Híbrido). **Resuelto**: mapa único `js/module-colors.js` (`window.MODULE_COLORS`/`getModuleColor`) consumido por dropdown, `updateHeaderColor()` y sheet "Más" (vía tokens). Paleta ampliada oficialmente en AGENTS.md: naranja `#F97316` (Animales/Cuaderno), violeta `#A855F7` (Proveedores/Manuales/Documentos), rosa `#EC4899` (Logística). | [OK] 2026-07-02 |
| G6 | [MEDIO] | `.neon-success` mezcla paletas: borde `var(--c-success)` (lima) pero glow `rgba(16,185,129,…)` (esmeralda). Gradiente con `#059669` hardcodeado (styles.css ~485). **Resuelto en F3**: glow/inner en lima `rgba(204,255,0,…)`; verificado 2026-07-03: cero `16,185,129`/`#059669` en CSS. | [OK] 2026-07-03 |
| G7 | [MEDIO] | `dashboard-view.js` conserva `border-top: 3px solid #FF4444/#FF9800/#a855f7` inline (neutralizados por el `!important` global → código muerto y 2 colores fuera de paleta). **Resuelto en F3**; verificado 2026-07-03: cero `border-top: 3px` inline en dashboard-view. | [OK] 2026-07-03 |
| G8 | [MEDIO] | **Estilos inline** en vistas: informes 222, dashboard 127, explotación 72, trazabilidad 42, ajustes 40, compradores 34, wizards-censo/guía/crotales ~31 c/u… (parte justificada: plantillas PDF). Tratado en AUDITORIA-UI-UX Fase 4 (5 batches, ~1.361 → ~600 residuales declarados justificados: PDF-templates, custom props dinámicos, colores computados, skeletons). | Revisión de criterio pendiente |
| G9 | [MEDIO] | `Toast.success/warning/info` casi no se usan (1×). Convención implícita frágil. **Resuelto en F6**: `App.toast` detecta el marcador semántico (check/cruz/aviso/info, caracteres funcionales que nunca se pintan) en cualquier posición, retira emojis decorativos del texto (el icono lo pone Toast en SVG), `toastError('aviso…')` se degrada a warning (no error), y el toast manual de seed-data pasa por `window.Toast`. Sin tipo → neutro dorado (definido). | [OK] 2026-07-03 |
| G10 | [CRIT] | Navegación retroceder/cancelar. **Resuelto**: (a) back físico cierra el sheet "Más"; (b) back físico con modal/Confirm abierto pulsa su Cancelar (resuelve promesas y callbacks); (c) back físico con wizard abierto pasa por el botón Cancelar; (d) Cancelar de `WizardManager` confirma el descarte cuando hay pasos avanzados ("Se perderán los datos introducidos", botones Salir/Continuar aquí) y respeta `onCancel`; (e) `/venta-carne` añadida a `_routesConVolver`. `/documentos` se deja sin volver (es módulo de nivel superior del menú Más). | [OK] 2026-07-02 |
| G11 | [MEDIO] | `.page-title-blue/green/purple` usan `#60a5fa/#34d399/#a78bfa` — fuera de paleta. **Resuelto en F3**: migradas a `var(--c-info/--c-success/--c-purple)` (también `.page-title-bar-*::before` con `color-mix`); verificado 2026-07-03. | [OK] 2026-07-03 |
| G12 | [BAJO] | Emojis funcionales en botones/tabs: **0** ✓ · `alert()/confirm()` nativos: **0** ✓ · **2026-07-03**: barrido total — eliminados los ~92 emoticonos restantes en strings visibles (DOM/PDF) de vistas, servicios, asistente e index.html; sustituidos por `Icons.*` SVG donde aportan (loaders PDF, asistente/tour, error-handler) o retirados. Ver norma abajo. | [OK] 2026-07-03 |

---

### Mapa de equivalencias propuesto (Fase 3)

| Hardcodeado | Sustituir por | Semántica |
|---|---|---|
| `#10b981`, `#34d399`, `#059669` | `var(--c-success)` `#CCFF00` | éxito/zonas/híbrido |
| `#ef4444`, `#cc0000`, `#FF9800`→revisar | `var(--c-danger)` `#FF4444` | peligro/carne |
| `#f59e0b`, `#fbbf24`, `#d97706`, `#b45309`, `#FFD700`, `#eab308` | `var(--c-warning)` `#FFD600` | aviso/alertas |
| `#60a5fa`, `#4FACFE` | `var(--c-info)` `#3b82f6` | info/leche/listas |
| `#8b5cf6`, `#a855f7`, `#a78bfa`, `#9333ea`, `#ec4899`, `#f97316` | **decisión de David**: no existen en la paleta corporativa (hoy identifican Proveedores/Logística/Manuales/Animales/CoMer). Opciones: (a) reasignar a los 4 semánticos; (b) ampliar AGENTS.md con 2-3 colores de módulo oficiales. | módulos sin color oficial |

---

### Norma: prohibición de emoticonos (vigente desde 2026-07-03)

- **Prohibido** el uso de emoticonos/pictogramas Unicode en cualquier string visible de la UI (DOM, PDF, print, placeholders) y en la documentación del proyecto.
- Los iconos se resuelven **siempre** con `Icons.*` (SVG, `js/icons.js`); dimensionan con `.icon` (1.2em) y heredan `currentColor`.
- **Se permiten** símbolos tipográficos: ✓ ✕ ✗ ♀ ♂ ⚤ ➔ ← · — no son emoticonos.
- **Excepción funcional**: `App.toast(msg, type, duracionMs)` acepta el tipo EXPLÍCITO como 2º argumento (`'success'|'error'|'warning'|'info'`; número = duración, API legacy). **2026-07-03**: migradas todas las llamadas con literal (marcador → tipo explícito, emojis decorativos retirados del origen); la inferencia por marcador se conserva SOLO como fallback para strings dinámicos construidos en runtime.
- Fuera de alcance: ficheros QA/test (`e2e-test-suite`, `qa-*`, `tests.js`, `test-importador`) — solo escriben en consola.

---

## 2. Plan de fases

| Fase | Contenido | Estado |
|---|---|:---:|
| F1 | Quick-wins de bugs objetivos: G1, G2 | [OK] 2026-07-02 |
| F2 | **Mapa único de colores de módulo** (constante `window.MODULE_COLORS` o similar) + migrar dropdown del header, sheet "Más" y `updateHeaderColor()` + design-tokens.css canónico + paleta ampliada en AGENTS.md | [OK] 2026-07-02 |
| F3 | Migración de colores a tokens por lotes de vistas + G4, G6, G7, G11 | [OK] 2026-07-03 (4 lotes: 21 vistas + 9 wizards + helpers + comunidades-service + styles.css). Literales conservados a propósito: plantillas/toolbars PDF-print, gráficas Chart.js (literales corporativos), muestras del selector de tema, pares colorDark. GASTOS violeta en el conmutador CoMer confirmado por David. |
| F4 | Navegación: back físico cierra sheet "Más"; cancelar/back en wizard con confirmación de descarte (vía `onCancel` + `Confirm`); completar `_routesConVolver` | [OK] 2026-07-02 |
| F5 | **Pase visual por pantalla**: textos, encabezados, unidades, capitalización | [OK] lote 1 [OK] 2026-07-03 (d891ed1): plurales (años/lotes/registros/activos/especies/expediciones/hembras/machos/cabezas), CC.AA./sistema formateados, códigos de evento humanizados, LÁCTICO→LÁCTEO, ºC→°C, versión pie cuaderno→APP_INFO, bugs de datos (censo por sexos H/M; cabezas vivas por rebaño), color de módulo por RUTA (Cuaderno naranja…). **Lote 2 [OK] 2026-07-03**: Kg/KG→kg unificado (0 restantes en UI/PDF/CSV; identificadores intactos), MG/KG→mg/kg, ºC→°C restantes (app.js, wizard-albarán-leche, albaranes-ventas), decimales es-ES (`InformesView._fmt`: litros/precios leche, curva produção y PDFs; gastos detalle monto; media proveedores; €/L compradores/CoMer/dashboard; GMD ExPro), somáticas/bacterias de albarán-lácteo con valor bruto y unidad errónea → `k cél/mL` / `k UFC/mL`, '·' colgante en compradores/transportistas (join filtrado; emoji camión→Icons), trazabilidad sin animal → empty-state con CTA a Animales (antes se quedaba en 'Cargando...'), documentos: emojis impresora/clip/lápiz → `Icons.imprimir()/adjuntar()/editar()` (iconos nuevos en icons.js). **Lote 3 [OK] 2026-07-03**: los 66 `toFixed` restantes de informes-view (kg, €, %, ha, UGM — pantalla y PDF) migrados a `InformesView._fmt` es-ES vía codemod con parseo balanceado; fallbacks `'0.0'/'0.00'` → `'0,0'/'0,00'`. **F5 COMPLETADA**. |
| F6 | Notificaciones (campana, mini-badge, vista alertas) + estandarización de toasts semánticos | [OK] 2026-07-03. **Hallazgos TQM**: la ruta `/alertas` NUNCA existió (el mini-badge eliminado apuntaba a un 404 y su contador «3» era estático); el enlace del dashboard `#/informes?tab=alertas` no funcionaba (render ignoraba params); `AlertasService.getActiveCount()` era código muerto; los toggles de Ajustes → Gestión de Alertas no tenían efecto. **Resuelto**: ruta `/alertas` real (Informes→tab Alertas, título+icono campana+color warning en module-colors), `renderInformes` acepta `?tab=` validado, ítem «Alertas» en dropdown del header con contador dinámico (`getActiveCount`, badge rojo, 99+), enlace del dashboard → `#/alertas`, AlertasService v1.1 filtra por preferencias (sanidad/trazabilidad/PAC/ADSG/INFOLAC/contratos; transportista sin toggle → siempre) y los toggles recalculan en vivo vía `alertas:updated`, toasts semánticos (G9). |

**Disciplina por lote:** TQM → editar → bump `CACHE_NAME`+`?v=` → `npm run build:free` → `npx cap sync android` → verificación preview/USB → commit+push.

---

## 3. Checklist por pantalla

Leyenda: [AUTO] escaneo automático hecho · [COD] pase de código profundo (textos, unidades, plurales, formato es-ES, fallbacks, empty-states, CSS roto) · [VISUAL] pase visual en dispositivo · [OK] conforme · [PEND] pendiente

| Ruta / Pantalla | [AUTO] | [COD] | [VISUAL] | Hallazgos específicos |
|---|:---:|:---:|:---:|---|
| `#/` Dashboard | [OK] | [OK] | [OK] | Conforme tras F1/F3 (G7 resuelto) |
| `#/ganaderia` | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: edad nunca visible (`fechaNacimiento`→`fecha_nacimiento`), plurales cabeza/parcela/año |
| `#/rebanos` (+detalle) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: crash si rebaño sin `tipo`, plurales, miles es-ES en KPIs, fallback crotal, empty-state detalle, "6D"→"6 D" |
| `#/animales` (+detalle) | [OK] | [OK] 2026-07-03 | [PEND] | Corregido: fallback crotal en título de card (color módulo naranja ya oficial, G5 resuelto) |
| `#/explotacion` (ExPro) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: KPIs GMD/ratio/ES/grasa/proteína a es-ES, valores crudos formateados, COSTOS→COSTES, registro(s)→plural real, kg/d→kg/día, `var()+alpha` inválido en conmutadores (glow) |
| `#/carne` · `#/leche` · `#/hibrido` | [OK] | [OK] 2026-07-03 | [OK] 2026-07-04 | Corregidos: "Rebaño treated", "Restan INDEFINIDO días"/"PROHIBIDOd", raza inventada (Assaf/Lacaune→N/D), badges sin borde (`var()+alpha`), plurales DÍA/DÍAS, fallback 'Tratamiento', empty-state rebaños mixtos; tarjetas estandarizadas usando .card-registro con --registro-color |
| `#/zonas` (+detalle) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: UGM/carga a es-ES, "HA"→"ha" (color módulo lima ya aplicado, G5 resuelto) |
| `#/comercializacion` (+albarán/venta) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: rendimiento/ES a es-ES, peso canal formateado, "--°C"→"—" y espacio en °C |
| `#/gastos` (+detalle) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: "LOTE 1 animales", ES medio es-ES, valores crudos, mensajes de vacío referían botón inexistente ("Registrar…"→"Nuevo") |
| `#/informes` | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: typo "Prolifeidad", **datos ficticios como fallback** (Dr. Manuel Ortiz, contratos, ADSG, NIF → 'N/D', 15 casos), "Aforo Máx.", plurales, empty-state censo. Diferido: `toLocaleString()` sin locale (~50 sitios, lote propio) |
| `#/cuaderno` | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: dinero con punto (`toFixed(2)€`→es-ES) en pantalla y PDF, miles es-ES, plurales parto/entrega/animales activos |
| `#/trazabilidad` | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: "undefined" en cabecera de ficha y badge estado, plural días |
| `#/documentos` | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: "Guía DIMOE" para facturas/DIB (mapa tipo→label), "undefined pares/animales", espacio antes de punto; cards estandarizadas usando .card-registro con --registro-color |
| `#/compradores` (+detalle) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: **precio inventado 5,5 €/kg**→'—', badges sin fondo (`var()+alpha`), crash contrato sin tipo, "undefined" en formulario, 'láctico'→'Lácteo' (presentación); cards estandarizadas usando .card-registro con --registro-color |
| `#/proveedores` (+detalle) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: badges sin fondo, categorías con tilde en presentación (`_labelCat`), "undefined" in formulario |
| `#/transportistas` | [OK] | [OK] 2026-07-03 | [OK] 2026-07-04 | Corregidos: badge activo sin fondo, plural animales, ➔→Icons; tarjeta estandarizada usando .card-registro con --registro-color. Pendiente: empty-state con filtro Inactivos. |
| `#/contrato` | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: crash tipo_comprador undefined, 'LÁCTICO'→'LÁCTEO'; card estandarizada usando .card-registro con --registro-color |
| `#/ajustes` | [OK] | [OK] | [OK] | Toggles nuevos OK; cards accent restauradas (G1/G2); cards estandarizadas usando .card-registro con --registro-color |
| `#/manuales` | [OK] | [OK] 2026-07-03 | [PEND] | Corregido: "láctico"→"lácteo". Diferido: hex del visor (criterio) |
| Notificaciones (campana/badge/alertas) | [OK] | [OK] | [OK] | F6 [OK]: ruta `/alertas` + dropdown con contador + prefs efectivas |
| Wizards (9) | [OK] | [OK] 2026-07-03 | [PEND] | Corregidos: **factura con precio inventado 5,5 €/kg** (venta-masiva → 0 + nota "pendiente de fijar"), SVG crudo en toast (guía), €/L y € a es-ES (albarán-leche), GÉRMENES, "Consultá"→"Consulta", "Regla 3"→mensaje claro, empty-state traslado, razas "undefined", plurales, class duplicado (finca), mg/mL |
| Onboarding / Bienvenida | [OK] | [OK] | [OK] | versión unificada ✓ · iconos SVG (norma emoticonos) |
| Menú "Más" (sheet) | [OK] | [OK] | [OK] | G5 resuelto (mapa único); back físico lo cierra (G10a resuelto) |
| Menú desplegable header | [OK] | [OK] | [OK] | G5 resuelto (mapa único) |

**Diferidos del pase de código (criterio/lotes propios):** (a) `toLocaleString()`/`toLocaleDateString()` sin `'es-ES'` explícito — masivo en informes-view y disperso en compradores/proveedores (formato correcto salvo dispositivo en locale extranjero); (b) hex neutros de escala de grises en pantalla (`#fff/#555/#888/#222`) en títulos y empty-states — decidir si merecen token; (c) hex de módulo del visor de manuales y timeline de trazabilidad; (d) empty-state de transportistas con filtro activo; (e) opción de contrato potencialmente duplicada en select de albarán-leche.

---

## 4. Registro de cambios de la auditoría

- **2026-07-02** — F1: reparadas `.card-accent-*` corruptas (G1) y añadida `.card-accent-gold` (G2). Documento creado.
- **2026-07-02** — Marco: haz de luz interior en header y bottom-nav (efecto unión).
- **2026-07-02** — F2: `design-tokens.css` = fuente única de tokens (G3); paleta ampliada en AGENTS.md (naranja/violeta/rosa de módulo); mapa único `js/module-colors.js` consumido por dropdown, header y sheet "Más" (G5). Cambio de color notable: Animales pasa de rojo a **naranja** en la cabecera (coherente con su color de módulo).
- **2026-07-03** — F3 lotes 1-2: 15 vistas + styles.css migradas a tokens (verificado en dispositivo USB: dashboard, Ganadería, ExPro, CoMer). TQM aplicado: pestañas Carne/Cárnico y submódulo Gastos de ExPro → `--c-danger`. **Excepción documentada**: la pestaña GASTOS del conmutador de CoMer se mantiene violeta (`--c-purple`) para no chocar con CARNE (roja) en la misma barra — pendiente criterio de David. Los pares `colorDark` (sombras de gradiente en gastos/produccion) se conservan.
- **2026-07-02** — F4: cascada del back físico (modal → dropdown → sheet Más → wizard vía Cancelar → confirmar salida en dashboard → history.back); confirmación de descarte en WizardManager con pasos avanzados (verificada en preview: aparece diálogo, Continuar mantiene, Salir cierra + onCancel); `/venta-carne` con botón volver (G10).
- **2026-07-03** — Header: pill SVG centrado exacto (grid `1fr auto 1fr`), logo y viñeta de finca pegados al pill; eliminados el punto verde de finca activa y la mini-viñeta de alertas (F6 rediseñará la notificación). Ajustes: nuevo toggle "Haz de luz lateral" (`glow-laterales-off` apaga `body::after`).
- **2026-07-03** — F5 lote 2: unidades kg/mg/kg/°C unificadas, decimales es-ES en informes/gastos/proveedores/compradores/CoMer/dashboard/ExPro, fix somáticas y bacterias en detalle de albarán lácteo, '·' colgante compradores/transportistas, empty-state de trazabilidad sin animal, botones de documentos con iconos SVG (`Icons.imprimir/adjuntar`).
- **2026-07-03** — F5 lote 3 (final): 66 `toFixed` de informes-view a `InformesView._fmt` (es-ES) en pantalla y PDF; F5 completada. Próxima fase: F6 (notificaciones + toasts).
- **2026-07-03** — F6 (final de la auditoría): ruta `/alertas` creada (antes 404), deep-link `?tab=` en Informes reparado, ítem Alertas con contador en el dropdown del header, AlertasService v1.1 respeta las preferencias de Ajustes (antes sin efecto) con recálculo en vivo, toasts semánticos G9 (marcador en cualquier posición, emojis decorativos retirados, aviso por toastError → warning, seed-data unificado). Release v4.8.9 / versionCode 513. **Auditoría completada: F1-F6 [OK].** Pendientes menores heredados: npm audit reporta 3 high en `tar` vía `@capacitor/cli` (tooling de build, sin parche estable aguas arriba; no se embarca en la app).
- **2026-07-03** — Norma de prohibición de emoticonos aplicada: barrido total (~92 líneas en 20+ ficheros: vistas, servicios, asistente, error-handler, index.html) vía codemod protegido (no toca toasts/inferencia/consola) + sustituciones manuales por `Icons.*` SVG (loaders PDF unificados a `.pdf-loader-icon`, asistente/tour de bienvenida, error-handler). Fixes de lógica dependiente de emojis: `zonas-view` (`estadoTexto.split('')[1]` → texto directo), `informes-view` (celda TOTAL de cargas → 'OK'). Este documento migrado a marcadores textuales ([CRIT]/[ALTO]/[MEDIO]/[BAJO], [OK]/[PEND], [AUTO]/[VISUAL]).
- **2026-07-03** — Toasts a API explícita: `App.toast(msg, type, duracionMs)` (número como 2º arg = duración legacy). Codemod con parseo de literales (comillas/backticks/escapes/concatenaciones): 40 llamadas migradas a tipo explícito ('success'/'error'/'warning') + 48 limpiadas de emojis decorativos + 8 ternarios a mano (confirmaciones de guardado → 'success'). `toastError('aviso…')` con marcador → `App.toast(…, 'warning')`. Inferencia por marcador conservada solo como fallback para strings dinámicos. Fuente sin emoticonos: 0 restantes fuera de QA/consola.