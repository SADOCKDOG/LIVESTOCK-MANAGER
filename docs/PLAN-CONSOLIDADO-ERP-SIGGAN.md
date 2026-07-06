# Plan Consolidado de Reorganización ERP — Livestock Manager v4.8.9

> **Fecha:** 2026-07-06  
> **Versión app:** 4.8.9 (versionCode 513)  
> **Base de datos:** IndexedDB v14  
> **Suite QA:** 18 tests SIGGAN (`SigganQA.runAll()`)  
> **Restricción crítica:** No perder ninguna funcionalidad existente

---

## 0. ANÁLISIS EXHAUSTIVO DEL ESTADO ACTUAL

### 0.1 Inventario completo de vistas implementadas

| Vista | Archivo | Líneas | Contenido | Tabs/Secciones |
|---|---|---|---|---|
| **Dashboard** | `dashboard-view.js` | 489 | KPIs diarios, alertas, balance económico, indicadores lácteos, calendario preventivo, accesos rápidos | — |
| **Ganadería** | `ganaderia-view.js` | 158 | Hub con modo (Carne/Leche/Híbrido), accesos Animales/Rebaños/Zonas, balance rendimiento, rebaños del modo, censo reciente | Modo switch |
| **ExPro** | `explotacion-view.js` | 968+ | 3 sub-módulos: Explotación (Carne/Leche/Híbrido), Gastos, Almacén | Explotación/Gastos/Almacén |
| **CoMer** | `comercializacion-view.js` | 538 | 3 tabs: Carne (ventas), Leche (entregas), Gastos (analíticos) | Carne/Leche/Gastos |
| **Carne** | `carne-view.js` | 751 | Evolución mensual, balance, filtros, 3 tabs: Patrimonio, Comercialización, Legislación | 3 tabs con filtros |
| **Leche** | `leche-view.js` | 703 | Evolución mensual, balance, filtros, 3 tabs: Patrimonio, Comercialización, Legislación | 3 tabs con filtros |
| **Híbrido** | `hibrido-view.js` | 762 | Evolución mensual, balance consolidado, filtros, 3 tabs: Patrimonio, Comercialización, Legislación | 3 tabs con filtros |
| **Gastos** | `gastos-view.js` | 214 | Evolución mensual, balance por categoría, tabs: Todos/Alimentación/Sanidad/Fitosanitarios/Electricidad/Personal/Amortización | 7 tabs categoría |
| **Animales** | `animales-view.js` | — | Listado + ficha individual con `App._getAnimalCardProps` | — |
| **Rebaños** | `rebanos-view.js` | — | Listado + ficha de rebaño | — |
| **Zonas** | `zonas-view.js` | — | Listado + ficha de zona (UGM, PAC, aforo) | — |
| **Compradores** | `compradores-view.js` | — | Listado + ficha + formulario | — |
| **Proveedores** | `proveedores-view.js` | — | Listado + ficha + formulario | — |
| **Transportistas** | `transportistas-view.js` | — | Listado + ficha | — |
| **Contratos** | `contratos-view.js` | — | Formulario de contrato | — |
| **Informes** | `informes-view.js` | — | 5 categorías × 22+ sub-tabs | Multi-nivel |
| **Trazabilidad** | `trazabilidad-view.js` | — | Timeline 360° de animal | — |
| **Cuaderno** | `cuaderno-view.js` | — | Cuaderno Digital RD 787/2023 (8 bloques) | — |
| **Documentos** | `documentos-view.js` | — | DIMOE, facturas, DIB, crotales, workflow trámite | — |
| **Alertas** | (InformesView) | — | Delega a Informes con tab=alertas | — |

### 0.2 Funcionalidad existente en vistas Carne/Leche/Híbrido

**IMPORTANTE:** Estas vistas YA contienen funcionalidad que podría parecer "huérfana":

| Funcionalidad | CarneView | LecheView | HibridoView |
|---|---|---|---|
| **Tab Patrimonio** (Animales/Rebaños/Zonas) | ✅ Accesos directos | ✅ Accesos directos | ✅ Accesos directos |
| **Tab Comercialización** (Compradores/Transportistas/Contratos) | ✅ Accesos directos | ✅ Accesos directos | ✅ Accesos directos |
| **Tab Legislación** (Sanidad/Tratamientos/Supresiones) | ✅ Historial + Registrar Tratamiento | ✅ Historial + Alertas Supresión + Registrar | ✅ Historial consolidado + Registrar |
| **Filtros avanzados** (texto + tipo) | ✅ | ✅ | ✅ |
| **Evolución mensual** (barras 6 meses) | ✅ | ✅ | ✅ |
| **KPIs por bloque** | ✅ | ✅ | ✅ |
| **Edición de registros** | ✅ `_abrirOpcionesRegistro` | ✅ `_abrirOpcionesControl` | ✅ `_abrirOpcionesRegistro` |
| **Supresiones activas** | ✅ Carne | ✅ Leche | ✅ Ambas |

### 0.3 Wizards implementados

| Wizard | Archivo | Funcionalidad |
|---|---|---|
| Venta Masiva | `wizard-venta-masiva.js` | Venta carne: animales → comprador → transportista → pricing → liquidación + DIMOE + movimiento |
| Albarán Leche | `wizard-albaran-leche.js` | Entrega leche: cisterna, volumen, precio, laboratorio, antibióticos |
| Gasto | `wizard-gasto.js` | 2 pasos: datos económicos → imputación (categoría, rebaño, proveedor) |
| Tratamiento | `wizard-tratamiento.js` | Sanitario: medicamento, dosis, vía, tiempos espera, veterinario |
| Traslado | `wizard-traslado.js` | Traslado interno animal entre rebaños/zonas |
| Finca | `wizard-finca.js` | Alta finca: nombre, REGA, CCAA, tipo, ADSG, vet, silos |
| Crotales | `wizard-crotales.js` | Pedido oficial crotales ADSG |
| Censo | `wizard-censo.js` | Declaración censal SIGGAN |
| Guía Movimiento | `wizard-guia-movimiento.js` | Guía oficial inter-explotación SIGGAN/BADIGEX |

### 0.4 Servicios de infraestructura

| Servicio | Archivo | Funcionalidad |
|---|---|---|
| EventBus | `event-bus.js` | Pub/sub con 25+ tipos de evento |
| CacheService | `cache-service.js` | Cache en memoria con TTL + invalidación |
| AlertasService | `alertas-service.js` | Alertas centralizadas: sanitarias, trazabilidad, administrativas, calendario |
| BalanceService | `balance-service.js` | Vincula ingresos (ventas/leche) con costes para margen real |
| ComunidadesService | `comunidades-service.js` | Config CCAA (Andalucía/Extremadura): REGA, SIGGAN/BADIGEX, catálogos |
| ExportService | `export-service.js` | Exportación oficial CSV/XML para REGA, SIA, PIGGAN |
| PdfService | `pdf-service.js` | Generación PDF: albaranes, facturas, certificados |

### 0.5 Datos demo CHAMORRO (seed-data.js v6.22.0)

| Entidad | Cantidad | Store |
|---|---|---|
| Finca | 1 (Ganadería CHAMORRO, Mixto, Huelva, 3 zonas) | `fincas` |
| Rebaños | 3 (Frisonas Láctea, Terneros Cebo, Merinas) | `rebanos` |
| Animales | 9 (3 vacas, 2 terneros, 3 ovejas, 1 cordero) | `animales` |
| Pesajes | 5 (vaca1) + 12 (terneros/oveja) | `registro_eventos` |
| Controles Leche | 15 (3 vacas × 5 fechas) + 1 expedición tanque | `registro_eventos` + `produccion_leche` |
| Compradores | 3 (cárnico, lácteo, híbrido) | `compradores` |
| Proveedores | 3 (pienso, vet, maquinaria) | `proveedores` |
| Transportistas | 2 (camión, cisterna) | `transportistas` |
| Contratos | 2 (carne CT-2026-001, leche CT-2026-002) | `contratos_compra` |
| Gastos | 7 (alimentación, sanidad, amortización) | `gastos_ganaderia` |
| Sanitarios | 3 (vacuna, desparasitación, antibiótico) | `sanitarios_ganado` |
| Reproducción | 4 eventos (celo→IA→diagnóstico→parto) | `reproduccion_eventos` |
| Entregas Leche | 3 (con laboratorio completo + MOFA) | `comercializacion_leche` |
| Venta Carne | 1 (ternero2 → Cárnicas Extremeñas + DIMOE) | `comercializacion_carne` + `documentos_legales` |

---

## 0B. INVENTARIO DE PROTECCIÓN — MÓDULOS TRANSVERSALES (NO SE TOCAN)

Estos módulos forman la **capa transversal de cumplimiento y BI**. Ninguna fase del plan los modifica. Se documenta aquí su contenido completo para garantizar que no se pierde nada.

### 0B.1 Informes (`informes-view.js` — v2.3.0)

**5 categorías × 22+ sub-tabs** con exportación PDF/Excel:

| Categoría | Sub-tabs | Contenido |
|---|---|---|
| **Resumen** | General, Por Finca, Alertas | Rentabilidad, censo, márgenes, comparativa mensual, indicadores lácteos |
| **Producción** | Cárnico, Lácteo, Repro, Sanidad, Fitosanitario, Curva | GMD, ventas, calidad leche, fertilidad/IEP, tratamientos, costes sanitarios |
| **Finanzas** | P y G, Flujo Caja, Break-Even, PAC, Coste/Animal, Eficiencia | Cuenta resultados, tesorería, punto equilibrio, subvenciones, rentabilidad por especie |
| **Comercial** | Ventas, Compradores, Proveedores, REGA, Aforos, Rotación | Historial ventas, métricas compradores/proveedores, cargas ganaderas, rotación censo |
| **Exportar** | Exportar | PDF por sección, PDF completo, Excel |

**Funciones protegidas:**
- `_renderGeneral()`, `_renderCarne()`, `_renderLeche()`, `_renderReproductivo()`, `_renderSanidad()`, `_renderCenso()`, `_renderVentas()`, `_renderCompradores()`, `_renderProveedores()`, `_renderFitosanitario()`, `_renderAlertas()`, `_renderPorFinca()`, `_renderRega()`, `_renderExportar()`, `_renderPyG()`, `_renderCosteProd()`, `_renderEficiencia()`, `_renderCargas()`, `_renderRotacion()`, `_renderFlujoCaja()`, `_renderRentabilidadEspecie()`, `_renderCurvaProduccion()`, `_renderBreakEven()`, `_renderSubvenciones()`
- `_exportPDF()`, `_exportExcel()`, `_exportPDFSeccion()`
- Gráficos Chart.js: scatter, barras, doughnut, pie, timeline, curva producción

### 0B.2 Manuales (`manuales-view.js` — v1.1.0)

**18 manuales** con visor iframe y exportación PDF:

| ID | Título | Archivo |
|---|---|---|
| index | Manual de Usuario General | `manual/index.html` |
| carne | Ejemplo Práctico: Ovino de Carne | `manual/ejemplo-ovino-carne.html` |
| leche | Ejemplo Práctico: Ovino de Leche | `manual/ejemplo-ovino-leche.html` |
| produccion | Registros de Producción | `manual/registros-produccion.html` |
| comercializacion | Comercialización | `manual/manual-comercializacion.html` |
| pesadas | Pesadas Individual y por Lote | `manual/manual-pesadas.html` |
| control-lechero | Control Lechero | `manual/manual-control-lechero.html` |
| gastos | Gastos | `manual/manual-gastos.html` |
| compradores | Compradores — Gestión de Clientes | `manual/manual-compradores.html` |
| proveedores | Proveedores — Trazabilidad de Costes | `manual/manual-proveedores.html` |
| transportistas | Transportistas — Bienestar en Transporte | `manual/manual-transportistas.html` |
| animales-rebanos | Animales y Rebaños — Gestión del Censo | `manual/manual-animales-rebanos.html` |
| contratos | Contratos — Acuerdos Comerciales | `manual/manual-contratos.html` |
| sanitarios | Sanitarios — Control de Tratamientos | `manual/manual-sanitarios.html` |
| reproduccion | Reproducción — Ciclo Reproductivo | `manual/manual-reproduccion.html` |
| cuaderno-digital | Cuaderno Digital Ganadero (RD 787/2023) | `manual/manual-cuaderno-digital.html` |
| trazabilidad | Trazabilidad 360° de Animales | `manual/manual-trazabilidad.html` |
| informes-analitica | Informes Premium e Inteligencia Analítica | `manual/manual-informes-analitica.html` |
| gestion-documental | Documentos de Transporte y Guías DIMOE | `manual/manual-gestion-documental.html` |

**Funciones protegidas:**
- `_abrirManual()` — visor iframe en overlay
- `_exportarPDF()` — generación PDF con html2pdf + Capacitor Share
- `_compartirPDF()` — Capacitor nativo / navigator.share / descarga directa

### 0B.3 Cuaderno Digital (`cuaderno-view.js` — v1.0.0)

**8 secciones RD 787/2023** con exportación PDF + CSV SIGGAN:

| Sección | Contenido |
|---|---|
| 1. Explotación | Datos REGA, CEA, NIF, CCAA, ADSG, veterinario, contrato lácteo, INFOLAC |
| 2. Censo | Por especie: total, hembras, machos, categorías |
| 3. Movimientos | Entradas/salidas inter-explotación, libro registro SIGGAN, nacimientos, muertes |
| 4. Sanidad | Tratamientos (medicamento, vía, espera, veterinario, receta), campañas saneamiento ADSG |
| 5. Reproducción | Cubriciones, gestaciones, partos |
| 6. Producción | Leche (litros, entregas), Carne (kg canal, expediciones) |
| 7. Económico | Ingresos carne, ingresos leche |
| 8. Transportistas | Nombre, NIF, matrícula, certificado bienestar |

**Funciones protegidas:**
- `_recopilarDatos()` — agrega 12 stores de IndexedDB
- `_renderContenido()` — vista en pantalla con navegación rápida
- `_exportarPDF()` — PDF completo con barra de progreso
- `_exportarCSV()` — CSV compatible SIGGAN (identificación, censo, entradas, salidas, nacimientos, muertes, tratamientos, saneamientos)
- `_imprimir()` → `_abrirVistaImprimible()` — vista imprimible en overlay
- `_generarHTMLImprimible()` — HTML monoespaciado para PDF
- `_ejecutarShare()` — Capacitor / navigator.share / descarga

### 0B.4 Documentos (`documentos-view.js` — v1.1.0)

**5 tipos de documento** con workflow de trámite (borrador → presentado → aceptado/rechazado):

| Tipo | Contenido | Acciones |
|---|---|---|
| **DIMOE** | Guías de movimiento de ganado | Editar borrador, Imprimir PDF, Guardar acuse |
| **Factura** | Facturas comerciales | Imprimir PDF, Guardar acuse |
| **Certificado** | Certificados oficiales | Imprimir PDF, Guardar acuse |
| **DIB** | Documento Identificación Bovina | Imprimir PDF, Guardar acuse |
| **Crotales** | Pedidos de crotales ADSG | Editar borrador (WizardCrotales), Imprimir PDF, Guardar acuse |

**Funciones protegidas:**
- `_renderHTML()` — lista unificada con KPIs por tipo
- `_abrirAsistenteConsulta()` — wizard para filtrar por tipo (DIMOE, Factura, Certificado, DIB, Crotales, Guías, Libro, Contratos, Cierres, Todos)
- `_editarBorrador()` — abre WizardCrotales o WizardGuiaMovimiento
- `_imprimirDoc()` — genera PDF genérico o específico por tipo
- `_registrarAcuse()` — modal para guardar referencia oficial
- `_exportDocs()` — exportación Excel de todos los documentos
- Normalización de movimientos_ganado y pedidos_crotales como documentos

### 0B.5 Ajustes (`ajustes-view.js` + `config-sistema-view.js`)

**AjustesView (v1.3.0):**

| Sección | Contenido |
|---|---|
| Sistema y Seguridad | Estado backup, tema visual, acento/luz, banners, versión, animales en IDB → enlace a ConfigSistemaView |
| Finca Activa | Nombre, REGA, CCAA, animales → Editar Datos, Zonas/Parcelas |
| Mis Fincas | Listado, cambiar activa, nueva finca (Premium) |
| Sanidad (ADSG) | Listado ADSG, editar, nueva |
| Objetivos | GMD, Fertilidad |
| Especies y Razas | Listado, añadir, eliminar |
| Alertas | Toggles: Sanidad, Trazabilidad, PAC |
| Ayuda | Manual de Usuario (iframe) |
| Footer | Autor, versión |

**ConfigSistemaView (v1.0.0) — 3 tabs:**

| Tab | Contenido |
|---|---|
| **Interfaz** | Modo oscuro OLED, textos contexto, retroiluminación (marco/laterales/botones), wizard iluminación, formato fecha, moneda, color acento global |
| **Seguridad** | Info sistema (versión, DB, fincas, animales), backup exportar/importar, backup automático, limpiar caché |
| **Auditoría** | Registro de actividad (eventos de auditoría, anulaciones, rectificaciones) |

**Wizard de Retroiluminación (4 pasos):**
1. Componentes Activos (marco/laterales/botones)
2. Color del Marco (fijo/dinámico, transparencia banners)
3. Haz de Luz (intensidad, color fijo/dinámico)
4. Botón de Registro (color fijo/dinámico, intensidad brillo)

### 0B.6 Garantía de no-modificación

| Módulo | Archivos | Fases que lo afectan | Acción |
|---|---|---|---|
| Informes | `informes-view.js` | Ninguna | ✅ No se toca |
| Manuales | `manuales-view.js` | Ninguna | ✅ No se toca |
| Cuaderno | `cuaderno-view.js` | Ninguna | ✅ No se toca |
| Documentos | `documentos-view.js` | Ninguna | ✅ No se toca |
| Ajustes | `ajustes-view.js`, `config-sistema-view.js` | Ninguna | ✅ No se toca |
| Alertas | `alertas-service.js` | Ninguna | ✅ No se toca |
| Trazabilidad | `trazabilidad-view.js`, `trazabilidad.js` | Fase 1 (P1) | Solo se añade `checkSupresion()` en wizard-albaran-leche, no se modifica la vista |
| Exportación | `export-service.js` | Ninguna | ✅ No se toca |

---

## 1. HALLAZGOS DE AUDITORÍA (consolidados de ambas revisiones)

### 1.1 Problemas estructurales confirmados

| # | Problema | Severidad | Evidencia |
|---|---|---|---|
| P1 | **`checkSupresion()` no se ejecuta automáticamente en venta de leche** | 🔴 CRÍTICA (normativa) | `wizard-albaran-leche.js` no invoca `MotorTrazabilidad.checkSupresion()` antes de guardar |
| P2 | **Gastos triplicado** | 🟡 Alta | Alta en: ExPro (sub-módulo Gastos), CoMer (tab Gastos), ruta suelta `/gastos` (GastosView) |
| P3 | **Selector de modo duplicado** | 🟡 Media | Ganadería y ExPro tienen `_activeMode` independientes sin sincronizar |
| P4 | **Sanidad sin "dueño" claro** | 🟡 Media | Registrar tratamiento accesible desde: ExPro, CarneView, LecheView, HibridoView (todos usan `WizardTratamiento`) |
| P5 | **Terceros accesibles desde múltiples sitios** | 🟢 Baja | Compradores/Proveedores/Transportistas en "Más" + accesos directos en Carne/Leche/Híbrido/CoMer |

### 1.2 Lo que NO es un problema (funciona correctamente)

| Aspecto | Estado | Evidencia |
|---|---|---|
| Almacén/Silos | ✅ Implementado | `explotacion-view.js` tiene `_renderAlmacenView()` con silos, stock, cargas/consumos |
| Sanidad visible | ✅ Accesible | Carne/Leche/Híbrido tienen tab "Legislación" con historial + botón "Registrar Tratamiento" |
| Terceros visibles | ✅ Accesibles | Carne/Leche/Híbrido tienen tab "Comercialización" con accesos a Compradores/Transportistas |
| Patrimonio visible | ✅ Accesible | Carne/Leche/Híbrido tienen tab "Patrimonio" con accesos a Animales/Rebaños/Zonas |
| Reproducción | ✅ Lógica implementada | `reproduccion.js` con 7 tipos de evento, parto automático, genealogía |
| Movimientos SIGGAN | ✅ Lógica implementada | `movimientos.js` + `wizard-guia-movimiento.js` |
| Saneamientos | ✅ Lógica implementada | `saneamientos.js` con campañas TBC/brucelosis |

---

## 2. PRINCIPIOS IRRENUNCIABLES

1. **No tocar** `_ensureData`, `_cargarDatos`, selectores HTML, ni `seed-data.js`
2. **Usar siempre** `App._cardRegistro(opts)` y `App._getAnimalCardProps(a, r)` para listas
3. **No borrar** ningún módulo, vista, wizard ni servicio existente
4. **Respetar** tokens CSS (`design-tokens.css`), `Icons.*` (cero emojis), `module-colors.js`
5. **Regresión obligatoria:** `SigganQA.runAll()` debe seguir 18/18 verde tras cada fase
6. **Build oficial:** `npm run build:premium` → `cap sync android`; bumpear `CACHE_NAME` y `?v=`
7. **No tocar bottom-nav:** Animales y Rebaños se quedan como nav-items de primera clase
8. **No mover vistas de Terceros:** Compradores/Proveedores/Transportistas mantienen ruta independiente

---

## 3. PLAN DE IMPLEMENTACIÓN POR FASES

### Fase 0 — Baseline de regresión

**Objetivo:** Fotografiar el estado verde antes de tocar nada.

- [ ] Ejecutar `SigganQA.runAll()` en consola. Anotar resultado (esperado: 18/18 verde).
- [ ] Verificar manualmente que las 3 vistas hub (Ganadería, ExPro, CoMer) cargan datos demo.
- [ ] Verificar que Carne/Leche/Híbrido muestran sus 3 tabs correctamente.
- [ ] Commit del baseline.

**Verificación:** 18/18 tests en verde documentados.

---

### Fase 1 — P1: Bloqueo sanitario automático en venta de leche

**Objetivo:** Impedir la expedición de leche cuando hay supresión farmacológica activa.

**Archivos:**
- Modify: `js/views/wizards/wizard-albaran-leche.js`
- Consume: `js/trazabilidad.js` → `MotorTrazabilidad.checkSupresion()`
- Test: `js/qa-siggan.js` (extender TEST 15)

**Pasos:**
- [ ] **Paso 1:** Escribir test que falla. En `qa-siggan.js`, extender TEST 15 con: crear sanitario con `prohibidoLeche=true` sobre rebaño, intentar guardar albarán leche, afirmar que se rechaza.
- [ ] **Paso 2:** Implementar bloqueo. En `wizard-albaran-leche.js`, antes del `db.put('comercializacion_leche', ...)`, invocar `checkSupresion()` para animales del rebaño. Si `apto=false`, abortar con mensaje de `diasRestantes`/`fecha_liberacion`.
- [ ] **Paso 3:** Ejecutar `SigganQA.runAll()` y verificar que TEST 15 pasa.
- [ ] **Paso 4:** Verificación manual: registrar tratamiento con `prohibidoLeche`, confirmar que retirada de leche queda bloqueada.
- [ ] **Paso 5:** Commit (`feat: bloqueo sanitario automatico en venta de leche`).

**Verificación:** No es posible expedir leche de rebaño con supresión activa; 18/18 verde.

---

### Fase 2 — Gastos: eliminar triplicación

**Objetivo:** El **alta** de gasto vive solo en ExPro; CoMer muestra gastos en **lectura** para márgenes; ruta `/gastos` redirige a ExPro.

**Archivos:**
- Modify: `js/views/comercializacion-view.js` (tab Gastos: quitar FAB alta → dejar listado lectura)
- Modify: `js/app.js` (ruta `/gastos` → redirige a `#/explotacion?sub=gastos`)

**Pasos:**
- [ ] **Paso 1:** En `comercializacion-view.js` `_renderGastos()`, sustituir "Registrar Gasto" por enlace "Registrar en Explotación" → `#/explotacion?sub=gastos`. Mantener listado de gastos en lectura.
- [ ] **Paso 2:** En `app.js`, hacer que `/gastos` redirija a `#/explotacion?sub=gastos`.
- [ ] **Paso 3:** Verificar que ExPro sigue siendo el único punto de alta de gasto.
- [ ] **Paso 4:** `SigganQA.runAll()` (18/18) y commit (`refactor: gastos con dueno unico en ExPro`).

**Verificación:** Un único punto de alta de gasto (ExPro); CoMer en lectura; ruta `/gastos` redirige.

**NO SE TOCA:**
- `gastos-view.js` (se mantiene como vista independiente accesible desde "Más")
- La lógica de `Gastos.save()` ni `_ensureData` de ninguna vista

---

### Fase 3 — Sanidad: acceso desde Ganadería

**Objetivo:** Añadir acceso rápido a "Nuevo tratamiento" desde Ganadería, sin eliminar los accesos existentes en ExPro/Carne/Leche/Híbrido.

**Archivos:**
- Modify: `js/views/ganaderia-view.js` (añadir botón "Nuevo tratamiento" → `wizard-tratamiento`)

**Pasos:**
- [ ] **Paso 1:** En `ganaderia-view.js`, añadir en el panel de acciones (junto al FAB "Nuevo Registro") un botón "Nuevo tratamiento" que abra `WizardTratamiento.registrar()` con el rebaño activo del modo.
- [ ] **Paso 2:** Verificar que el botón funciona y produce el mismo registro que los accesos desde ExPro/Carne/Leche/Híbrido.
- [ ] **Paso 3:** `SigganQA.runAll()` (18/18) y commit (`feat: acceso a tratamiento desde Ganaderia`).

**Verificación:** Alta de tratamiento accesible desde Ganadería; los accesos existentes en ExPro/Carne/Leche/Híbrido siguen funcionando.

**NO SE TOCA:**
- Los botones "Tratamiento" en ExPro, CarneView, LecheView, HibridoView
- `wizard-tratamiento.js` ni `sanitarios.js`

---

### Fase 4 — Selector de modo global

**Objetivo:** Unificar el modo carne/leche/híbrido en un filtro de contexto persistente que consumen Ganadería, ExPro y CoMer.

**Archivos:**
- Modify: `js/app.js` (estado global `App.modoActivo` + persistencia)
- Modify: `ganaderia-view.js`, `explotacion-view.js`, `comercializacion-view.js` (leer/escribir modo global)

**Pasos:**
- [ ] **Paso 1:** Introducir `App.modoActivo` persistido en localStorage con método `App.setModo(modo)` que emite evento `modo:changed`.
- [ ] **Paso 2:** En `ganaderia-view.js`, sustituir `_changeMode()` por `App.setModo()`; leer `App.modoActivo` al renderizar.
- [ ] **Paso 3:** En `explotacion-view.js`, sustituir `_cambiarModo()` por `App.setModo()`; escuchar evento `modo:changed` para re-render.
- [ ] **Paso 4:** En `comercializacion-view.js`, leer `App.modoActivo` para el tab por defecto.
- [ ] **Paso 5:** Verificación manual: cambiar modo en Ganadería, confirmar que ExPro refleja el cambio.
- [ ] **Paso 6:** `SigganQA.runAll()` (18/18) y commit (`refactor: selector de modo global`).

**Verificación:** Un solo control de modo; coherente entre los 3 hubs.

**NO SE TOCA:**
- La lógica interna de cada vista (`_ensureData`, `_renderCarne`, etc.)
- `ModoContextoHelper` (se mantiene como helper de filtrado de rebaños)

---

### Fase 5 — Paneles resumen en Ganadería

**Objetivo:** Añadir en Ganadería paneles resumen de Sanidad, Reproducción y Movimientos, usando los datos ya cargados.

**Archivos:**
- Modify: `js/views/ganaderia-view.js` (añadir 3 bloques HTML tras el censo)

**Pasos:**
- [ ] **Paso 1:** En `ganaderia-view.js`, ampliar el `Promise.all` inicial para cargar `sanitarios_ganado`, `reproduccion_eventos`, `movimientos_ganado`.
- [ ] **Paso 2:** Añadir bloque "Sanidad Activa" (últimos 3 tratamientos con `App._cardRegistro`).
- [ ] **Paso 3:** Añadir bloque "Reproducción Reciente" (últimos 5 eventos con `App._cardRegistro`).
- [ ] **Paso 4:** Añadir bloque "Movimientos Oficiales" (últimas 3 guías con `App._cardRegistro`).
- [ ] **Paso 5:** Verificación manual con demo CHAMORRO: confirmar que los paneles muestran datos.
- [ ] **Paso 6:** `SigganQA.runAll()` (18/18) y commit (`feat: paneles resumen en Ganaderia`).

**Verificación:** Ganadería muestra 3 paneles adicionales con datos de la demo; los accesos existentes siguen funcionando.

**NO SE TOCA:**
- La estructura existente de modo, accesos rápidos, balance, rebaños, censo
- `_ensureData` ni selectores HTML

---

### Fase 6 — Accesos rápidos a Terceros desde CoMer

**Objetivo:** Añadir accesos contextuales a Compradores/Proveedores/Transportistas desde cada tab de CoMer.

**Archivos:**
- Modify: `js/views/comercializacion-view.js` (añadir enlaces en cada tab)

**Pasos:**
- [ ] **Paso 1:** En `_renderCarne()`, añadir enlace "Ver Compradores" → `#/compradores`.
- [ ] **Paso 2:** En `_renderLeche()`, añadir enlace "Ver Compradores" → `#/compradores`.
- [ ] **Paso 3:** En `_renderGastos()`, añadir enlace "Ver Proveedores" → `#/proveedores`.
- [ ] **Paso 4:** `SigganQA.runAll()` (18/18) y commit (`feat: accesos rapidos a Terceros desde CoMer`).

**Verificación:** Desde cada tab de CoMer se puede navegar a Terceros; las rutas independientes de Terceros siguen funcionando.

**NO SE TOCA:**
- `compradores-view.js`, `proveedores-view.js`, `transportistas-view.js`
- Los ítems de Terceros en el menú "Más"
- Las rutas `/compradores`, `/proveedores`, `/transportistas`

---

### Fase 7 — Huecos de negocio P2-P5 (posterior/opcional)

**Objetivo:** Cerrar huecos de trazabilidad y rentabilidad. Requieren cambios de modelo de datos.

| Prio | Hueco | Acción |
|---|---|---|
| P2 | Gasto por animal | Añadir `animalId` opcional en `gastos.js` |
| P3 | Producción → Venta | Enlazar `produccion_carne.animalId` con `comercializacion_carne` |
| P4 | Contrato exigido | Validar vigencia/precio del contrato en `wizard-venta-masiva` |
| P5 | Origen de compra | `proveedorId`/`rega_origen` en alta tipo "Compra" |

**Cada P con su test añadido a `SigganQA` y en verde antes de commit.**

---

## 4. LO QUE NO SE HACE (y por qué)

| Propuesta descartada | Razón |
|---|---|
| Quitar Animales/Rebaños del bottom-nav | Son las rutas más usadas. Moverlas añade un click innecesario. |
| Mover vistas de Terceros dentro de CoMer | Ya tienen vista propia y ruta dedicada. Menos accesibles si se mueven. |
| Crear vista propia de Reproducción | Ya es accesible desde Informes. Los paneles resumen en Ganadería son suficientes. |
| Crear vista propia de Movimientos | Ya es accesible desde Documentos. Los paneles resumen en Ganadería son suficientes. |
| Crear módulo Almacén independiente | Ya está implementado en ExPro → sub-módulo Almacén. |
| Eliminar GastosView (`/gastos`) | Se mantiene como vista independiente accesible desde "Más". Solo se redirige la ruta para evitar duplicación de alta. |

---

## 5. ARQUITECTURA FINAL RESULTANTE

```
Bottom Nav (sin cambios):
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  Inicio  │ Animales │  Rebaños │ Ganadería│  ExPro   │  CoMer   │   Más    │
│    /     │/animales │/rebanos  │/ganaderia│/explotac.│/comercial│  (sheet) │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

Ganadería (Centro Operativo):
  ├── Módulos: Animales · Rebaños · Zonas
  ├── Modo: Cárnico · Lácteo · Híbrido (GLOBAL → sincronizado)
  ├── Balance: Lotes · Censo · Zonas
  ├── Rebaños del modo
  ├── Censo reciente
  ├── [FASE 5] Sanidad Activa (3 últimos tratamientos)
  ├── [FASE 5] Reproducción Reciente (5 últimos eventos)
  ├── [FASE 5] Movimientos Oficiales (3 últimas guías)
  └── [FASE 3] FAB "Nuevo tratamiento" → WizardTratamiento

ExPro (Centro Producción):
  ├── Explotación (Carne/Leche/Híbrido — modo GLOBAL):
  │   ├── KPIs (GMD, MOFA, Extracto Seco, Costes)
  │   ├── Acciones Registro (Pesaje/Ordeño + Tratamiento)
  │   ├── Líderes GMD / Calidad Tanque / Ordeños
  │   ├── Silos (stock + barras)
  │   ├── Costes + Cumplimiento
  │   └── Pipeline → CoMer
  ├── Gastos (dueño ÚNICO de alta)
  └── Almacén (silos, cargas, consumos)

CoMer (Centro Comercial):
  ├── Carne: Ventas (SEUROP, DIMOE, trámite) → [FASE 6] acceso Compradores
  ├── Leche: Entregas (lab, MOFA, INFOLAC) → [FASE 6] acceso Compradores
  └── Gastos: Lectura (márgenes) → [FASE 2] sin FAB alta; [FASE 6] acceso Proveedores

Más (Sheet) — sin cambios:
  Leche · Cárnico · Híbrido · Comercial · Compradores · Proveedores ·
  Transportistas · Gastos · Informes · Libro Ventas · Informe REGA ·
  Exportación · Cuaderno · Documentos · Manuales · Ajustes

Vistas Especializadas (en Más) — sin cambios:
  CarneView · LecheView · HibridoView:
    Cada una con 3 tabs: Patrimonio · Comercialización · Legislación
    Cada tab con accesos directos a: Animales, Rebaños, Zonas, Compradores,
    Transportistas, Documentos, Cuaderno
    Cada una con: filtros, evolución mensual, KPIs, edición de registros
```

---

## 6. VERIFICACIÓN FINAL

Tras cada fase:
1. `SigganQA.runAll()` → 18/18 verde
2. Cargar demo CHAMORRO → todas las pantallas con datos
3. Navegación completa: Inicio → Ganadería → ExPro → CoMer → Más → cada submódulo
4. FABs: cada botón de acción funciona y produce el registro esperado
5. Build: `npm run build:premium` → `cap sync android` → verificar en dispositivo

---

## 7. RESUMEN DE FASES

| Fase | Qué hace | Riesgo | Desplegable sola |
|---|---|---|---|
| 0 | Baseline QA (18/18) | Nulo | — |
| 1 | P1: Bloqueo sanitario en venta leche | Bajo | ✅ |
| 2 | Gastos dueño único ExPro | Bajo | ✅ |
| 3 | Sanidad: acceso desde Ganadería | Bajo | ✅ |
| 4 | Selector modo global | Medio | ✅ |
| 5 | Paneles resumen en Ganadería | Bajo | ✅ |
| 6 | Accesos rápidos Terceros desde CoMer | Bajo | ✅ |
| 7 | P2-P5 huecos negocio (opcional) | Alto | Separada |

**Orden deliberado:** primero el hueco normativo (P1), luego consolidaciones de bajo riesgo, modo global después, y los cambios de modelo de datos al final.
