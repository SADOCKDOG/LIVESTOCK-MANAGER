/**
 * Screenshot Capture via CDP (Mobile WebView) - LIVESTOCK MANAGER v4.10.1
 * Conecta al WebView del dispositivo via ADB port-forward (puerto 9225)
 * Captura todas las pantallas principales usando la demo CHAMORRO
 *
 * Requisitos:
 * - Dispositivo conectado USB con depuración activada
 * - ADB forward: adb forward tcp:9225 localabstract:webview_devtools_remote_<PID>
 * - App LIVESTOCK-MANAGER corriendo en el dispositivo
 * - Servidor local accesible desde el móvil (adb reverse tcp:5173 tcp:5173)
 *
 * Uso: node scripts/capture-screenshots-cdp.js
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

const CDP_WS_URL = 'ws://localhost:9226/devtools/page/AE7A326148CB00EFA9213E12F12CFF52';
const BASE_URL = 'http://10.0.2.2:5173';  // 10.0.2.2 = localhost del host desde Android emulator/device
const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

// Crear estructura de directorios
const dirs = [
  'dash', 'gan', 'anim', 'reb', 'zon',
  'expro', 'lact', 'tanq', 'silos',
  'com', 'compr', 'prov', 'trans', 'contr', 'alb',
  'inf', 'inf-gegan', 'inf-expro', 'inf-comer', 'inf-lib',
  'san', 'bot', 'fito', 'sane', 'wiz-san', 'wiz-vac', 'bit', 'marg',
  'ajust', 'sist', 'doc', 'cuad', 'traz', 'subex', 'agen', 'patr', 'gast', 'inst', 'rfid', 'man'
];

dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const screenshots = [
  // ============================================================
  // 1. DASHBOARD & GANADERÍA (18 capturas)
  // ============================================================
  { file: 'dash/dash-01.png', nav: '#/www/', name: 'Dashboard Principal - KPIs y Alertas' },
  { file: 'dash/dash-02.png', nav: '#/www/', name: 'Dashboard - Registro Rápido (Bento 12 tarjetas)' },
  { file: 'dash/dash-03.png', nav: '#/www/', name: 'Dashboard - Indicadores Lácteos 12 meses' },
  { file: 'dash/dash-04.png', nav: '#/www/', name: 'Dashboard - Calendario Preventivo' },
  { file: 'dash/dash-05.png', nav: '#/www/', name: 'Dashboard - Banner Free/Premium' },

  { file: 'gan/gan-01.png', nav: '#/www/ganaderia', name: 'Ganadería - Consola Unificada (Carrusel 5 submódulos)' },
  { file: 'gan/gan-02.png', nav: '#/www/ganaderia', name: 'Ganadería - Submódulo Animales' },
  { file: 'gan/gan-03.png', nav: '#/www/ganaderia', name: 'Ganadería - Submódulo Rebaños' },
  { file: 'gan/gan-04.png', nav: '#/www/ganaderia', name: 'Ganadería - Submódulo Zonas' },
  { file: 'gan/gan-05.png', nav: '#/www/ganaderia', name: 'Ganadería - Submódulo Sanidad' },

  { file: 'anim/anim-01.png', nav: '#/www/animales', name: 'Animales - Listado con badges estado' },
  { file: 'anim/anim-02.png', nav: '#/www/animales', name: 'Animales - Ficha Animal (10 secciones)' },
  { file: 'anim/anim-03.png', nav: '#/www/animales', name: 'Animales - Validación Crotal (ES 12 díg / Equino 15 díg)' },
  { file: 'anim/anim-04.png', nav: '#/www/animales', name: 'Animales - Escáner RFID' },
  { file: 'anim/anim-05.png', nav: '#/www/animales', name: 'Animales - Vinculación Madre-Cría' },
  { file: 'anim/anim-06.png', nav: '#/www/animales', name: 'Animales - Margen Económico por Animal' },
  { file: 'anim/anim-07.png', nav: '#/www/animales', name: 'Animales - Notificación REGA / SANDACH' },

  { file: 'reb/reb-01.png', nav: '#/www/rebanos', name: 'Rebaños - Listado con KPIs (kg carne, L leche)' },
  { file: 'reb/reb-02.png', nav: '#/www/rebanos', name: 'Rebaños - Wizard 5 pasos (Especie → Tipo REGA)' },

  { file: 'zon/zon-01.png', nav: '#/www/zonas', name: 'Zonas - Parcelas con UGM/ha y Carga Ganadera' },
  { file: 'zon/zon-02.png', nav: '#/www/zonas', name: 'Zonas - Alerta Sobrepastoreo (>1.0 UGM/ha)' },
  { file: 'zon/zon-03.png', nav: '#/www/zonas', name: 'Zonas - Rotación Pastos y Bloqueo Fitosanitario' },

  // ============================================================
  // 2. EXPLOTACIÓN & PRODUCCIÓN (20 capturas)
  // ============================================================
  { file: 'expro/expro-01.png', nav: '#/www/explotacion', name: 'Explotación - Carrusel 11 tabs (EXPRO, LÁCTEA, SILOS...)' },
  { file: 'expro/expro-02.png', nav: '#/www/explotacion', name: 'Explotación - Pestaña EXPRO: Balance Unificado Leche/Carne' },
  { file: 'expro/expro-03.png', nav: '#/www/explotacion', name: 'Explotación - Banner Guía 365 SIGGAN' },
  { file: 'expro/expro-04.png', nav: '#/www/explotacion', name: 'Explotación - Alerta Silos <15%' },
  { file: 'expro/expro-05.png', nav: '#/www/explotacion', name: 'Explotación - Actividad Reciente (filtrada por flags)' },
  { file: 'expro/expro-06.png', nav: '#/www/explotacion', name: 'Explotación - Wizards directos: Traslado, Censo, Crotales, Guía' },

  { file: 'lact/lact-01.png', nav: '#/www/explotacion?sub=lacteo', name: 'Láctea - Dashboard: Tanques, KPIs, Última Analítica' },
  { file: 'lact/lact-02.png', nav: '#/www/explotacion?sub=lacteo', name: 'Láctea - Alertas MotorLacteo (DANGER/WARNING)' },
  { file: 'lact/lact-03.png', nav: '#/www/explotacion?sub=lacteo&subtab=tanques', name: 'Láctea - Tanques: Stock, Temp, Limpiezas' },
  { file: 'lact/lact-04.png', nav: '#/www/explotacion?sub=lacteo&subtab=control', name: 'Láctea - Control: Analíticas + Controles DHI' },
  { file: 'lact/lact-05.png', nav: '#/www/explotacion?sub=lacteo&subtab=balance', name: 'Láctea - Balance: Entradas/Salidas/Mermas/Ajustes' },
  { file: 'lact/lact-06.png', nav: '#/www/explotacion?sub=lacteo&subtab=graficos', name: 'Láctea - Gráficos: 5 Chart.js (Producción, Calidad, Composición...)' },

  { file: 'tanq/tanq-01.png', nav: '#/www/explotacion?sub=tanques', name: 'Tanques - Listado con Gauge Circular (%)' },
  { file: 'tanq/tanq-02.png', nav: '#/www/tanques', name: 'Tanques - Historial Movimientos por Tanque' },
  { file: 'tanq/tanq-03.png', nav: '#/www/explotacion?sub=tanques', name: 'Tanques - Wizard Tanque (Letra Q MAPA único)' },

  { file: 'silos/sil-01.png', nav: '#/www/explotacion?sub=silos', name: 'Silos - Telemetría SVG Circular Animada' },
  { file: 'silos/sil-02.png', nav: '#/www/explotacion?sub=silos', name: 'Silos - Autonomía (consumo real 30d)' },
  { file: 'silos/sil-03.png', nav: '#/www/explotacion?sub=silos', name: 'Silos - Cargar/Consumir (genera Gasto + Evento ICA)' },
  { file: 'silos/sil-04.png', nav: '#/www/explotacion?sub=silos', name: 'Silos - Ficha Técnica Modal + Recalibración' },

  // ============================================================
  // 3. COMERCIALIZACIÓN (20 capturas)
  // ============================================================
  { file: 'com/com-01.png', nav: '#/www/comercializacion', name: 'Comercialización - Carrusel 5 submódulos (Leche, Carne, Compradores...)' },
  { file: 'com/com-02.png', nav: '#/www/comercializacion?tab=carne', name: 'Comercialización - Carne: KPIs + Wizard Venta Masiva' },
  { file: 'com/com-03.png', nav: '#/www/comercializacion?tab=leche', name: 'Comercialización - Leche: KPIs + Wizard Albarán Leche' },

  { file: 'com/wiz-venta-01.png', nav: '#/www/comercializacion?tab=carne', name: 'Venta Masiva - Paso 1: Análisis Aptitud (supresión, edad, DIB, gestación)' },
  { file: 'com/wiz-venta-02.png', nav: '#/www/comercializacion?tab=carne', name: 'Venta Masiva - Paso 2: Trazabilidad Logística (ICA, Guía, Fitosanitaria)' },
  { file: 'com/wiz-venta-03.png', nav: '#/www/comercializacion?tab=carne', name: 'Venta Masiva - Paso 3: Datos Económicos (peso vivo/canal, precio, gastos)' },
  { file: 'com/wiz-venta-04.png', nav: '#/www/comercializacion?tab=carne', name: 'Venta Masiva - Paso 4: Liquidación y Cliente (Comprador, IVA, SEUROP, Contrato)' },
  { file: 'com/wiz-venta-05.png', nav: '#/www/comercializacion?tab=carne', name: 'Venta Masiva - Paso 5: Logística y Autorización (Transportista ATG, Vet)' },

  { file: 'compr/compr-01.png', nav: '#/www/compradores', name: 'Compradores - Listado con Badges Tipo (cárnico/lácteo/híbrido)' },
  { file: 'compr/compr-02.png', nav: '#/www/compradores', name: 'Compradores - Detalle: Historial Ventas + Contratos' },
  { file: 'compr/compr-03.png', nav: '#/www/compradores', name: 'Compradores - Nuevo (Paso 1: Datos, Paso 2: REGA/CCAA)' },

  { file: 'prov/prov-01.png', nav: '#/www/proveedores', name: 'Proveedores - Listado por Categorías' },
  { file: 'prov/prov-02.png', nav: '#/www/proveedores', name: 'Proveedores - Detalle: Historial Gastos' },
  { file: 'prov/prov-03.png', nav: '#/www/proveedores', name: 'Proveedores - Nuevo (2 pasos)' },

  { file: 'trans/trans-01.png', nav: '#/www/transportistas', name: 'Transportistas - Listado con Semáforo Certificados' },
  { file: 'trans/trans-02.png', nav: '#/www/transportistas', name: 'Transportistas - Nuevo: ATG, Desinsectación, Bienestar' },

  { file: 'contr/contr-01.png', nav: '#/www/contratos', name: 'Contratos - Listado con Alertas Vencimiento (≤30d)' },
  { file: 'contr/contr-02.png', nav: '#/www/contratos', name: 'Contratos - Detalle: Tabla Precios Multi-producto (kg/L/UD/CAB)' },
  { file: 'contr/contr-03.png', nav: '#/www/contratos', name: 'Contratos - Nuevo/Editar' },

  { file: 'alb/alb-01.png', nav: '#/www/albaranes-ventas', name: 'Albaranes - Historial Integrado (Tabs: Todo/Leche/Carne)' },
  { file: 'alb/alb-02.png', nav: '#/www/albaranes-ventas', name: 'Albaranes - Detalle: DIMOE, PDF, Factura' },

  // ============================================================
  // 4. INFORMES (25 capturas)
  // ============================================================
  { file: 'inf/inf-01.png', nav: '#/www/informes', name: 'Informes - Vista Principal: 5 Categorías, 32 Sub-tabs' },
  { file: 'inf/inf-02.png', nav: '#/www/informes', name: 'Informes - Botones Exportación: COMPLETO / GENERAL / CSV SIGGAN / Compartir' },
  { file: 'inf/inf-03.png', nav: '#/www/informes', name: 'Informes - Modal Pre-flight Validación Exportación' },

  { file: 'inf/inf-gen-01.png', nav: '#/www/informes?cat=general&sub=general', name: 'General - Balance: Ingresos, Gastos, Rentabilidad %' },
  { file: 'inf/inf-gen-02.png', nav: '#/www/informes?cat=general&sub=por-finca', name: 'General - Por Finca (Multi-finca Premium)' },
  { file: 'inf/inf-gen-03.png', nav: '#/www/informes?cat=general&sub=alertas', name: 'General - Alertas Consolidadas' },
  { file: 'inf/inf-gen-04.png', nav: '#/www/informes?cat=general&sub=eficiencia', name: 'General - Eficiencia Técnica (KPIs Semáforo)' },
  { file: 'inf/inf-gen-05.png', nav: '#/www/informes?cat=general&sub=rent-esp', name: 'General - Rentabilidad por Especie' },

  { file: 'inf-gegan/gegan-01.png', nav: '#/www/informes?cat=gegan&sub=censo', name: 'GeGan - Censo: Total/Activos/Vendidos, Pirámide Edad, Tasas' },
  { file: 'inf-gegan/gegan-02.png', nav: '#/www/informes?cat=gegan&sub=rotacion', name: 'GeGan - Rotación: Nacimientos, Compras, Ventas, Bajas' },
  { file: 'inf-gegan/gegan-03.png', nav: '#/www/informes?cat=gegan&sub=reproductivo', name: 'GeGan - Reproductivo: Fertilidad %, IEP, Prolificidad' },
  { file: 'inf-gegan/gegan-04.png', nav: '#/www/informes?cat=gegan&sub=sanidad', name: 'GeGan - Sanidad: Tratamientos, Supresiones, Coste/Animal' },
  { file: 'inf-gegan/gegan-05.png', nav: '#/www/informes?cat=gegan&sub=carne', name: 'GeGan - Cárnico: Pesajes, GMD, Rendimiento, ICA Tandas' },
  { file: 'inf-gegan/gegan-06.png', nav: '#/www/informes?cat=gegan&sub=coste-prod', name: 'GeGan - Coste/Animal: Margen Neto, Scatter Peso vs Margen' },

  { file: 'inf-expro/expro-01.png', nav: '#/www/informes?cat=expro&sub=produccion', name: 'ExPro - Producción: Registros 90d, Types, kg, Evolución (Fase B)' },
  { file: 'inf-expro/expro-02.png', nav: '#/www/informes?cat=expro&sub=leche', name: 'ExPro - Lácteo: Litros, Precio, Calidad, Stock Tanques, MOFA' },
  { file: 'inf-expro/expro-03.png', nav: '#/www/informes?cat=expro&sub=curva-prod', name: 'ExPro - Curva: kg/L Totales, Metas, % Cumplimiento, Tabla Mensual' },
  { file: 'inf-expro/expro-04.png', nav: '#/www/informes?cat=expro&sub=cargas', name: 'ExPro - Aforos: Zonas, Ocupación, Carga UGM/ha, Semáforo' },
  { file: 'inf-expro/expro-05.png', nav: '#/www/informes?cat=expro&sub=fitosanitario', name: 'ExPro - Fitosanitario: Inversión, Aplicaciones, Período Seguridad' },
  { file: 'inf-expro/expro-06.png', nav: '#/www/informes?cat=expro&sub=silos', name: 'ExPro - Silos: Stock, Capacidad, Autonomía' },
  { file: 'inf-expro/expro-07.png', nav: '#/www/informes?cat=expro&sub=tramites', name: 'ExPro - Trámites: Censo, Movimientos, Crotales, Saneamientos' },
  { file: 'inf-expro/expro-08.png', nav: '#/www/informes?cat=expro&sub=proveedores', name: 'ExPro - Proveedores: Facturas, Categorías, Gastos' },
  { file: 'inf-expro/expro-09.png', nav: '#/www/informes?cat=expro&sub=gastos', name: 'ExPro - Gastos: Total, Cats, Proveedores, Evolución 6m (Fase B)' },

  { file: 'inf-comer/comer-01.png', nav: '#/www/informes?cat=comer&sub=ventas', name: 'CoMer - Ventas: Libro Ventas (Albarán, Comprador, kg, €/kg, IVA, DIMOE)' },
  { file: 'inf-comer/comer-02.png', nav: '#/www/informes?cat=comer&sub=margenes', name: 'CoMer - Márgenes: Margen Carne Neto, MOFA Leche, Doughnut (Fase B)' },
  { file: 'inf-comer/comer-03.png', nav: '#/www/informes?cat=comer&sub=compradores', name: 'CoMer - Compradores: Ventas, kg, Precio Medio, % Ingresos, Contrato' },
  { file: 'inf-comer/comer-04.png', nav: '#/www/informes?cat=comer&sub=contratos-vencimiento', name: 'CoMer - Contratos: Vencimientos, Estado, Precios' },
  { file: 'inf-comer/comer-05.png', nav: '#/www/informes?cat=comer&sub=transportistas-resumen', name: 'CoMer - Transportistas: Capacidad, Certificados, Desinsectación' },
  { file: 'inf-comer/comer-06.png', nav: '#/www/informes?cat=comer&sub=albaranes', name: 'CoMer - Albaranes: Total, Importe, kg, Tabla con Estados (Fase B)' },

  { file: 'inf-lib/lib-01.png', nav: '#/www/informes?cat=libros&sub=pyg', name: 'Libros - P y G: Ingresos Leche/Carne, Gastos 6 Cats, EBITDA' },
  { file: 'inf-lib/lib-02.png', nav: '#/www/informes?cat=libros&sub=flujo-caja', name: 'Libros - Flujo Caja: Mensual, Entradas/Salidas, Acumulado' },
  { file: 'inf-lib/lib-03.png', nav: '#/www/informes?cat=libros&sub=breakeven', name: 'Libros - Break-Even: Costes Fijos/Variables, kg/L, Margen Seguridad (Fase B)' },
  { file: 'inf-lib/lib-04.png', nav: '#/www/informes?cat=libros&sub=subvenciones', name: 'Libros - PAC: Solicitado/Cobrado/Pendiente, Resumen Año (Fase B)' },
  { file: 'inf-lib/lib-05.png', nav: '#/www/informes?cat=libros&sub=exportar', name: 'Libros - Exportar: PDF 30 secciones, Excel 8 hojas, CSV SIGGAN, XML' },
  { file: 'inf-lib/lib-06.png', nav: '#/www/informes?cat=libros&sub=rega', name: 'Libros - REGA: Censo + Explotación (XML) para SIGGAN/BADIGEX' },

  // ============================================================
  // 5. SANIDAD & REPRODUCCIÓN (20 capturas)
  // ============================================================
  { file: 'san/san-01.png', nav: '#/www/sanidad', name: 'Sanidad - Vista Principal: Alertas Supresión + Historial + Vacunaciones ADSG' },
  { file: 'san/san-02.png', nav: '#/www/sanidad', name: 'Sanidad - Alertas Supresión SIEMPRE VISIBLES (gradiente rojo, pulse, badge CARNE/LECHE)' },
  { file: 'san/san-03.png', nav: '#/www/sanidad', name: 'Sanidad - Historial Clínico: Badges Estado (ESPERA X DÍAS / SIN SUPRESIÓN / PROHIBIDO)' },
  { file: 'san/san-04.png', nav: '#/www/sanidad', name: 'Sanidad - Calculadora Dosis (Peso × mg/kg ÷ Conc. = mL)' },
  { file: 'san/san-05.png', nav: '#/www/sanidad', name: 'Sanidad - Vacunaciones Libro ADSG: ABIERTA/CERRADA/ANULADA' },

  { file: 'bot/bot-01.png', nav: '#/www/botiquin', name: 'Botiquín - Listado: Stock, Lotes, Caducidades, Alertas FEFO' },
  { file: 'bot/bot-02.png', nav: '#/www/botiquin', name: 'Botiquín - Detalle Producto: Historial Entradas/Consumos (Verde+/Rojo-)' },
  { file: 'bot/bot-03.png', nav: '#/www/botiquin', name: 'Botiquín - Alertas: STOCK BAJO, CADUCADO, CADUCA EN X DÍAS' },

  { file: 'fito/fito-01.png', nav: '#/www/fitosanitarios', name: 'Fitosanitarios - Cuaderno RD 787/2023: KPIs, Historial' },
  { file: 'fito/fito-02.png', nav: '#/www/fitosanitarios', name: 'Fitosanitarios - Control Normativo: Registro, Dosis, Plazo, Apto' },
  { file: 'fito/fito-03.png', nav: '#/www/fitosanitarios', name: 'Fitosanitarios - Badge Período Seguridad: COMPLETADO / BLOQUEADO' },
  { file: 'fito/fito-04.png', nav: '#/www/fitosanitarios', name: 'Fitosanitarios - Export PDF Libro Oficial' },

  { file: 'sane/sane-01.png', nav: '#/www/saneamientos', name: 'Saneamientos - Campañas ADSG: Calificación, Examinados/Positivos, Restricción Movimientos' },
  { file: 'sane/sane-02.png', nav: '#/www/saneamientos', name: 'Saneamientos - Wizard Creación (Validación: positivos ≤ examinados)' },

  { file: 'wiz-san/wiz-trat-01.png', nav: '#/www/sanidad', name: 'Wizard Tratamiento - Paso 1: Catálogo SIGGAN + Calculadora Dosis' },
  { file: 'wiz-san/wiz-trat-02.png', nav: '#/www/sanidad', name: 'Wizard Tratamiento - Paso 2: Libro Tratamientos Oficial (Motivo, Vía, Receta, Vet, Lote)' },
  { file: 'wiz-san/wiz-vac-01.png', nav: '#/www/sanidad', name: 'Wizard Vacunación - Paso 1: Cabecera + hasta 4 Tipos Vacuna (Lote, Dosis, Comercial)' },
  { file: 'wiz-san/wiz-vac-02.png', nav: '#/www/sanidad', name: 'Wizard Vacunación - Paso 2: Animales Por Categoría o Individuales, % Censo' },

  { file: 'bit/bit-01.png', nav: '#/www/animal?id=X/bitacora', name: 'Bitácora Animal - Comentarios, Cond. Corporal (BCS/9), Reubicaciones' },
  { file: 'marg/marg-01.png', nav: '#/www/sanidad', name: 'Margen Animal - Ranking Margen Neto (Rentable éxito/No Rentable danger)' },

  // ============================================================
  // 6. CONFIGURACIÓN & DOCUMENTOS (22 capturas)
  // ============================================================
  { file: 'ajust/ajust-01.png', nav: '#/www/ajustes', name: 'Ajustes - Sistema/Seguridad, Finca Activa, Multi-finca (Free 1 vs Premium ∞)' },
  { file: 'ajust/ajust-02.png', nav: '#/www/ajustes', name: 'Ajustes - ADSG, Objetivos (GMD, Fertilidad), Especies/Razas CRUD' },
  { file: 'ajust/ajust-03.png', nav: '#/www/ajustes', name: 'Ajustes - Alertas (6 toggles), Guías Interactivas, Wizard Retroiluminación (4 pasos)' },
  { file: 'ajust/ajust-04.png', nav: '#/www/ajustes', name: 'Ajustes - Banner FREE Persistente + Botón ACTUALIZAR A PREMIUM' },

  { file: 'sist/sist-01.png', nav: '#/www/sistema?tab=interfaz', name: 'Sistema - Interfaz: OLED, Paleta, Retroiluminación, Formatos, Color Acento (8)' },
  { file: 'sist/sist-02.png', nav: '#/www/sistema?tab=seguridad', name: 'Sistema - Seguridad: Exportar/Importar Backup, Auto-backup, Limpiar Caché' },
  { file: 'sist/sist-03.png', nav: '#/www/sistema?tab=auditoria', name: 'Sistema - Auditoría: Últimos 50 (anulado=rojo, rectificado=ámbar)' },

  { file: 'doc/doc-01.png', nav: '#/www/documentos', name: 'Documentos - 8 Tipos Unificados (DIMOE, Factura, Certificado, DIB, Crotales, Albaranes, Contratos)' },
  { file: 'doc/doc-02.png', nav: '#/www/documentos', name: 'Documentos - Lista: Badge Estado (Borrador/Presentado), Acuse Manual (rojo/ámbar/gris/verde)' },
  { file: 'doc/doc-03.png', nav: '#/www/documentos', name: 'Documentos - Modal Consultar/Imprimir (Grid 2×5 tipos) + PDF por tipo' },
  { file: 'doc/doc-04.png', nav: '#/www/documentos', name: 'Documentos - Banner Interno SIGGAN: Genera → Sube Manual → Registra Acuse' },

  { file: 'cuad/cuad-01.png', nav: '#/www/cuaderno-digital', name: 'Cuaderno Digital - 8 Secciones RD 787/2023 + 2 Extras (Saneamientos, Económico)' },
  { file: 'cuad/cuad-02.png', nav: '#/www/cuaderno-digital', name: 'Cuaderno Digital - Export: PDF Completo, CSV SIGGAN (8 secciones ; BOM), Imprimir' },

  { file: 'traz/traz-01.png', nav: '#/www/trazabilidad/1', name: 'Trazabilidad 360° - Timeline 6 Fuentes (Nacimiento→Venta), Orden Ascendente' },
  { file: 'traz/traz-02.png', nav: '#/www/trazabilidad/1', name: 'Trazabilidad - Evento Sanitario: Supresión Carne (rojo), Prohibido Leche, Vet+Colegiado, Receta' },
  { file: 'traz/traz-03.png', nav: '#/www/trazabilidad/1', name: 'Trazabilidad - Evento Venta: Comprador, Peso Vivo/Canal, Rendimiento, SEUROP Gold, DIMOE, Transportista' },
  { file: 'traz/traz-04.png', nav: '#/www/trazabilidad/1', name: 'Trazabilidad - Export PDF (Cabecera Finca/Animal + Timeline Completo)' },

  { file: 'subex/subex-01.png', nav: '#/www/subexplotaciones', name: 'Subexplotaciones - Gap SIGGAN: Capa Aditiva por Especie (REGA + Tipo + Sistema)' },
  { file: 'subex/subex-02.png', nav: '#/www/subexplotaciones', name: 'Subexplotaciones - Wizard Creación + Soft Delete (anulada=true)' },

  { file: 'agen/agen-01.png', nav: '#/www/agenda', name: 'Agenda - Carrusel Sticky 8 Módulos, Filtros Estado/Prioridad, Widget Embebible' },
  { file: 'agen/agen-02.png', nav: '#/www/agenda', name: 'Agenda - Tareas: Badge Prioridad (rojo/ámbar/verde), Alerta, Vencida, WizardTarea' },

  { file: 'patr/patr-01.png', nav: '#/www/patrimonio', name: 'Patrimonio - Censo/Valor Estimado, KPI Grid (Censo, Lotes, Valor, ICA, Coste/kg)' },
  { file: 'patr/patr-02.png', nav: '#/www/patrimonio', name: 'Patrimonio - ICA 2 Niveles: Cierre Tanda + Control Mensual 6m (desvío >20% rojo)' },
  { file: 'patr/patr-03.png', nav: '#/www/patrimonio', name: 'Patrimonio - ICA Panel: Cierre (coloreado, CERRADO/ABIERTO) + Control Mensual (barras)' },

  { file: 'gast/gast-01.png', nav: '#/www/gastos', name: 'Gastos - Tabs 7 Categorías Contable (sticky, scroll-shadow, badge deslizar)' },
  { file: 'gast/gast-02.png', nav: '#/www/gastos', name: 'Gastos - Evolución 6m Barras (rojo>70%, ámbar>40%, verde≤40%) + Balance Global' },
  { file: 'gast/gast-03.png', nav: '#/www/gastos', name: 'Gastos - Cards: Concepto, Subtítulo fecha|zona|cat, Importe color cat, Badge "Ficha ->"' },

  { file: 'inst/inst-01.png', nav: '#/www/instalaciones', name: 'Instalaciones - Catálogo SIEX: Tipo, m², Plazas, m³, Código SIEX' },
  { file: 'inst/inst-02.png', nav: '#/www/instalaciones', name: 'Instalaciones - Wizard Creación + Soft Delete' },

  { file: 'rfid/rfid-01.png', nav: '#/www/importar-rfid', name: 'Importador RFID - 3 Pasos: Archivo → Detección Tipo → Progreso → Resultado (ok/errores)' },

  { file: 'man/man-01.png', nav: '#/www/manuales', name: 'Manuales - Catálogo 18 Manuales + Overlay Iframe + Export PDF (html2pdf + Share)' },
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  console.log('🚀 Conectando a CDP WebView (Xiaomi)...');
  console.log(`📱 Target: ${CDP_WS_URL}\n`);

  let client;
  try {
    // Conectar a CDP via WebSocket
    client = await CDP({ target: CDP_WS_URL });
    const { Page, Runtime, Emulation, Network } = client;

    // Habilitar dominios necesarios
    await Page.enable();
    await Runtime.enable();
    await Network.enable();
    await Emulation.enable();

    // Configurar viewport móvil (Xiaomi típico ~390x844 viewport)
    await Emulation.setDeviceMetricsOverride({
      width: 390,
      height: 844,
      deviceScaleFactor: 2.75,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });

    console.log('✅ CDP conectado. Navegando a la app...\n');

    // Navegar a la app (usando 10.0.2.2 para acceder al localhost del host)
    await Page.navigate({ url: BASE_URL });
    await Page.loadEventFired();
    console.log(`📱 Cargado: ${BASE_URL}`);

    // Esperar a que la app se inicialice
    await delay(3000);

    // Cargar demo CHAMORRO via Runtime.evaluate
    console.log('📦 Cargando demo CHAMORRO...');
    try {
      await Runtime.evaluate({
        expression: `
          if (window.SeedData && window.SeedData.run) {
            window.SeedData.run(true);
          }
        `,
        awaitPromise: true
      });
      console.log('✅ Demo CHAMORRO iniciada');
    } catch (e) {
      console.log('⚠️  SeedData no disponible, continuando...');
    }

    // Esperar a que termine el seed
    await delay(5000);

    console.log('✅ Demo cargada, iniciando capturas...\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i];
      const filePath = path.join(SCREENSHOTS_DIR, ss.file);
      const fullUrl = BASE_URL + ss.nav;

      console.log(`[${i + 1}/${screenshots.length}] ${ss.name}`);
      console.log(`   ${fullUrl}`);

      try {
        // Navegar a la ruta
        await Page.navigate({ url: fullUrl });
        await Page.loadEventFired();

        // Esperar renderizado
        await delay(2000);

        // Scroll al top
        await Runtime.evaluate({
          expression: 'window.scrollTo(0, 0)',
          awaitPromise: true
        });
        await delay(500);

        // Capturar screenshot
        const screenshot = await Page.captureScreenshot({
          format: 'png',
          clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 }
        });

        // Guardar archivo
        const buffer = Buffer.from(screenshot.data, 'base64');
        fs.writeFileSync(filePath, buffer);

        const sizeKB = (buffer.length / 1024).toFixed(0);
        console.log(`   ✅ Guardado (${sizeKB} KB)`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failCount++;

        // Crear placeholder SVG
        const placeholder = `
          <svg xmlns="http://www.w3.org/2000/svg" width="390" height="844">
            <rect width="100%" height="100%" fill="#1a1a2e"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                  font-family="system-ui" font-size="14" fill="#666">
              CAPTURA FALLIDA: ${ss.name}
            </text>
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
                  font-family="system-ui" font-size="10" fill="#444">
              ${ss.nav} | ${error.message.substring(0, 80)}
            </text>
          </svg>
        `;
        fs.writeFileSync(filePath.replace('.png', '.svg'), placeholder);
      }
    }

    console.log('\n═══════════════════════════════════');
    console.log('✅ CAPTURA COMPLETADA (Xiaomi WebView)');
    console.log('═══════════════════════════════════');
    console.log(`📁 Directorio: ${SCREENSHOTS_DIR}`);
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Fallidas: ${failCount}`);
    console.log(`📊 Total: ${screenshots.length} screenshots planificados`);

    // Generar índice
    const index = {
      version: '4.10.1',
      fecha: new Date().toISOString(),
      demo: 'CHAMORRO',
      dispositivo: 'Xiaomi (WebView CDP)',
      total: screenshots.length,
      exitosas: successCount,
      fallidas: failCount,
      capturas: screenshots.map((s, i) => ({
        orden: i + 1,
        archivo: s.file,
        nombre: s.name,
        ruta: s.nav
      }))
    };

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, '..', 'capturas-index.json'),
      JSON.stringify(index, null, 2)
    );

    console.log('\n📋 Índice generado: www/manual/capturas-index.json');

  } catch (error) {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

captureScreenshots();