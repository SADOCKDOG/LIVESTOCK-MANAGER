/**
 * Screenshot Capture Script para Manuales - LIVESTOCK MANAGER v4.10.1
 * Captura todas las pantallas principales usando Puppeteer con demo CHAMORRO
 *
 * Uso: node scripts/capture-screenshots.js
 * Requiere: npm install puppeteer
 * Pre-requisito: Servidor local en http://localhost:5173 (npm run dev)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

// Crear estructura de directorios completa
const dirs = [
  // Dashboard & Ganadería
  'dash', 'gan', 'anim', 'reb', 'zon',
  // Explotación & Producción
  'expro', 'lact', 'tanq', 'silos',
  // Comercialización
  'com', 'compr', 'prov', 'trans', 'contr', 'alb',
  // Informes
  'inf', 'inf-gegan', 'inf-expro', 'inf-comer', 'inf-lib',
  // Sanidad & Reproducción
  'san', 'bot', 'fito', 'sane', 'wiz-san', 'wiz-vac', 'bit', 'marg',
  // Configuración & Documentos
  'ajust', 'sist', 'doc', 'cuad', 'traz', 'subex', 'agen', 'patr', 'gast', 'inst', 'rfid', 'man'
];

dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const screenshots = [
  // ============================================================
  // 1. DASHBOARD & GANADERÍA (18 capturas)
  // ============================================================
  { file: 'dash/dash-01.png', nav: '#/', name: 'Dashboard Principal - KPIs y Alertas' },
  { file: 'dash/dash-02.png', nav: '#/', name: 'Dashboard - Registro Rápido (Bento 12 tarjetas)' },
  { file: 'dash/dash-03.png', nav: '#/', name: 'Dashboard - Indicadores Lácteos 12 meses' },
  { file: 'dash/dash-04.png', nav: '#/', name: 'Dashboard - Calendario Preventivo' },
  { file: 'dash/dash-05.png', nav: '#/', name: 'Dashboard - Banner Free/Premium' },

  { file: 'gan/gan-01.png', nav: '#/ganaderia', name: 'Ganadería - Consola Unificada (Carrusel 5 submódulos)' },
  { file: 'gan/gan-02.png', nav: '#/ganaderia', name: 'Ganadería - Submódulo Animales' },
  { file: 'gan/gan-03.png', nav: '#/ganaderia', name: 'Ganadería - Submódulo Rebaños' },
  { file: 'gan/gan-04.png', nav: '#/ganaderia', name: 'Ganadería - Submódulo Zonas' },
  { file: 'gan/gan-05.png', nav: '#/ganaderia', name: 'Ganadería - Submódulo Sanidad' },

  { file: 'anim/anim-01.png', nav: '#/animales', name: 'Animales - Listado con badges estado' },
  { file: 'anim/anim-02.png', nav: '#/animales', name: 'Animales - Ficha Animal (10 secciones)' },
  { file: 'anim/anim-03.png', nav: '#/animales', name: 'Animales - Validación Crotal (ES 12 díg / Equino 15 díg)' },
  { file: 'anim/anim-04.png', nav: '#/animales', name: 'Animales - Escáner RFID' },
  { file: 'anim/anim-05.png', nav: '#/animales', name: 'Animales - Vinculación Madre-Cría' },
  { file: 'anim/anim-06.png', nav: '#/animales', name: 'Animales - Margen Económico por Animal' },
  { file: 'anim/anim-07.png', nav: '#/animales', name: 'Animales - Notificación REGA / SANDACH' },

  { file: 'reb/reb-01.png', nav: '#/rebanos', name: 'Rebaños - Listado con KPIs (kg carne, L leche)' },
  { file: 'reb/reb-02.png', nav: '#/rebanos', name: 'Rebaños - Wizard 5 pasos (Especie → Tipo REGA)' },

  { file: 'zon/zon-01.png', nav: '#/zonas', name: 'Zonas - Parcelas con UGM/ha y Carga Ganadera' },
  { file: 'zon/zon-02.png', nav: '#/zonas', name: 'Zonas - Alerta Sobrepastoreo (>1.0 UGM/ha)' },
  { file: 'zon/zon-03.png', nav: '#/zonas', name: 'Zonas - Rotación Pastos y Bloqueo Fitosanitario' },

  // ============================================================
  // 2. EXPLOTACIÓN & PRODUCCIÓN (20 capturas)
  // ============================================================
  { file: 'expro/expro-01.png', nav: '#/explotacion', name: 'Explotación - Carrusel 11 tabs (EXPRO, LÁCTEA, SILOS...)' },
  { file: 'expro/expro-02.png', nav: '#/explotacion', name: 'Explotación - Pestaña EXPRO: Balance Unificado Leche/Carne' },
  { file: 'expro/expro-03.png', nav: '#/explotacion', name: 'Explotación - Banner Guía 365 SIGGAN' },
  { file: 'expro/expro-04.png', nav: '#/explotacion', name: 'Explotación - Alerta Silos <15%' },
  { file: 'expro/expro-05.png', nav: '#/explotacion', name: 'Explotación - Actividad Reciente (filtrada por flags)' },
  { file: 'expro/expro-06.png', nav: '#/explotacion', name: 'Explotación - Wizards directos: Traslado, Censo, Crotales, Guía' },

  { file: 'lact/lact-01.png', nav: '#/explotacion?sub=lacteo&subtab=dashboard', name: 'Láctea - Dashboard: Tanques, KPIs, Última Analítica' },
  { file: 'lact/lact-02.png', nav: '#/explotacion?sub=lacteo&subtab=dashboard', name: 'Láctea - Alertas MotorLacteo (DANGER/WARNING)' },
  { file: 'lact/lact-03.png', nav: '#/explotacion?sub=lacteo&subtab=tanques', name: 'Láctea - Tanques: Stock, Temp, Limpiezas' },
  { file: 'lact/lact-04.png', nav: '#/explotacion?sub=lacteo&subtab=control', name: 'Láctea - Control: Analíticas + Controles DHI' },
  { file: 'lact/lact-05.png', nav: '#/explotacion?sub=lacteo&subtab=balance', name: 'Láctea - Balance: Entradas/Salidas/Mermas/Ajustes' },
  { file: 'lact/lact-06.png', nav: '#/explotacion?sub=lacteo&subtab=graficos', name: 'Láctea - Gráficos: 5 Chart.js (Producción, Calidad, Composición...)' },

  { file: 'tanq/tanq-01.png', nav: '#/explotacion?sub=tanques', name: 'Tanques - Listado con Gauge Circular (%)' },
  { file: 'tanq/tanq-02.png', nav: '#/explotacion?sub=tanques', name: 'Tanques - Historial Movimientos por Tanque' },
  { file: 'tanq/tanq-03.png', nav: '#/explotacion?sub=tanques', name: 'Tanques - Wizard Tanque (Letra Q MAPA único)' },

  { file: 'silos/sil-01.png', nav: '#/explotacion?sub=silos', name: 'Silos - Telemetría SVG Circular Animada' },
  { file: 'silos/sil-02.png', nav: '#/explotacion?sub=silos', name: 'Silos - Autonomía (consumo real 30d)' },
  { file: 'silos/sil-03.png', nav: '#/explotacion?sub=silos', name: 'Silos - Cargar/Consumir (genera Gasto + Evento ICA)' },
  { file: 'silos/sil-04.png', nav: '#/explotacion?sub=silos', name: 'Silos - Ficha Técnica Modal + Recalibración' },

  // ============================================================
  // 3. COMERCIALIZACIÓN (20 capturas)
  // ============================================================
  { file: 'com/com-01.png', nav: '#/comercializacion', name: 'Comercialización - Carrusel 5 submódulos (Leche, Carne, Compradores...)' },
  { file: 'com/com-02.png', nav: '#/comercializacion?tab=carne', name: 'Comercialización - Carne: KPIs + Wizard Venta Masiva' },
  { file: 'com/com-03.png', nav: '#/comercializacion?tab=leche', name: 'Comercialización - Leche: KPIs + Wizard Albarán Leche' },

  // Wizard Venta Masiva (5 pasos)
  { file: 'com/wiz-venta-01.png', nav: '#/comercializacion?tab=carne', name: 'Venta Masiva - Paso 1: Análisis Aptitud (supresión, edad, DIB, gestación)' },
  { file: 'com/wiz-venta-02.png', nav: '#/comercializacion?tab=carne', name: 'Venta Masiva - Paso 2: Trazabilidad Logística (ICA, Guía, Fitosanitaria)' },
  { file: 'com/wiz-venta-03.png', nav: '#/comercializacion?tab=carne', name: 'Venta Masiva - Paso 3: Datos Económicos (peso vivo/canal, precio, gastos)' },
  { file: 'com/wiz-venta-04.png', nav: '#/comercializacion?tab=carne', name: 'Venta Masiva - Paso 4: Liquidación y Cliente (Comprador, IVA, SEUROP, Contrato)' },
  { file: 'com/wiz-venta-05.png', nav: '#/comercializacion?tab=carne', name: 'Venta Masiva - Paso 5: Logística y Autorización (Transportista ATG, Vet)' },

  // Compradores (independiente)
  { file: 'compr/compr-01.png', nav: '#/compradores', name: 'Compradores - Listado con Badges Tipo (cárnico/lácteo/híbrido)' },
  { file: 'compr/compr-02.png', nav: '#/compradores', name: 'Compradores - Detalle: Historial Ventas + Contratos' },
  { file: 'compr/compr-03.png', nav: '#/compradores', name: 'Compradores - Nuevo (Paso 1: Datos, Paso 2: REGA/CCAA)' },

  // Proveedores
  { file: 'prov/prov-01.png', nav: '#/proveedores', name: 'Proveedores - Listado por Categorías' },
  { file: 'prov/prov-02.png', nav: '#/proveedores', name: 'Proveedores - Detalle: Historial Gastos' },
  { file: 'prov/prov-03.png', nav: '#/proveedores', name: 'Proveedores - Nuevo (2 pasos)' },

  // Transportistas
  { file: 'trans/trans-01.png', nav: '#/transportistas', name: 'Transportistas - Listado con Semáforo Certificados' },
  { file: 'trans/trans-02.png', nav: '#/transportistas', name: 'Transportistas - Nuevo: ATG, Desinsectación, Bienestar' },

  // Contratos
  { file: 'contr/contr-01.png', nav: '#/contratos', name: 'Contratos - Listado con Alertas Vencimiento (≤30d)' },
  { file: 'contr/contr-02.png', nav: '#/contratos', name: 'Contratos - Detalle: Tabla Precios Multi-producto (kg/L/UD/CAB)' },
  { file: 'contr/contr-03.png', nav: '#/contratos', name: 'Contratos - Nuevo/Editar' },

  // Albaranes
  { file: 'alb/alb-01.png', nav: '#/albaranes-ventas', name: 'Albaranes - Historial Integrado (Tabs: Todo/Leche/Carne)' },
  { file: 'alb/alb-02.png', nav: '#/albaranes-ventas', name: 'Albaranes - Detalle: DIMOE, PDF, Factura' },

  // ============================================================
  // 4. INFORMES (25 capturas)
  // ============================================================
  { file: 'inf/inf-01.png', nav: '#/informes', name: 'Informes - Vista Principal: 5 Categorías, 32 Sub-tabs' },
  { file: 'inf/inf-02.png', nav: '#/informes', name: 'Informes - Botones Exportación: COMPLETO / GENERAL / CSV SIGGAN / Compartir' },
  { file: 'inf/inf-03.png', nav: '#/informes', name: 'Informes - Modal Pre-flight Validación Exportación' },

  // General (5 tabs)
  { file: 'inf/inf-gen-01.png', nav: '#/informes?cat=general&sub=general', name: 'General - Balance: Ingresos, Gastos, Rentabilidad %' },
  { file: 'inf/inf-gen-02.png', nav: '#/informes?cat=general&sub=por-finca', name: 'General - Por Finca (Multi-finca Premium)' },
  { file: 'inf/inf-gen-03.png', nav: '#/informes?cat=general&sub=alertas', name: 'General - Alertas Consolidadas' },
  { file: 'inf/inf-gen-04.png', nav: '#/informes?cat=general&sub=eficiencia', name: 'General - Eficiencia Técnica (KPIs Semáforo)' },
  { file: 'inf/inf-gen-05.png', nav: '#/informes?cat=general&sub=rent-esp', name: 'General - Rentabilidad por Especie' },

  // GeGan (6 tabs) - GANADERÍA
  { file: 'inf-gegan/gegan-01.png', nav: '#/informes?cat=gegan&sub=censo', name: 'GeGan - Censo: Total/Activos/Vendidos, Pirámide Edad, Tasas' },
  { file: 'inf-gegan/gegan-02.png', nav: '#/informes?cat=gegan&sub=rotacion', name: 'GeGan - Rotación: Nacimientos, Compras, Ventas, Bajas' },
  { file: 'inf-gegan/gegan-03.png', nav: '#/informes?cat=gegan&sub=reproductivo', name: 'GeGan - Reproductivo: Fertilidad %, IEP, Prolificidad' },
  { file: 'inf-gegan/gegan-04.png', nav: '#/informes?cat=gegan&sub=sanidad', name: 'GeGan - Sanidad: Tratamientos, Supresiones, Coste/Animal' },
  { file: 'inf-gegan/gegan-05.png', nav: '#/informes?cat=gegan&sub=carne', name: 'GeGan - Cárnico: Pesajes, GMD, Rendimiento, ICA Tandas' },
  { file: 'inf-gegan/gegan-06.png', nav: '#/informes?cat=gegan&sub=coste-prod', name: 'GeGan - Coste/Animal: Margen Neto, Scatter Peso vs Margen' },

  // ExPro (9 tabs) - EXPLOTACIÓN/PRODUCCIÓN
  { file: 'inf-expro/expro-01.png', nav: '#/informes?cat=expro&sub=produccion', name: 'ExPro - Producción: Registros 90d, Types, kg, Evolución (Fase B)' },
  { file: 'inf-expro/expro-02.png', nav: '#/informes?cat=expro&sub=leche', name: 'ExPro - Lácteo: Litros, Precio, Calidad, Stock Tanques, MOFA' },
  { file: 'inf-expro/expro-03.png', nav: '#/informes?cat=expro&sub=curva-prod', name: 'ExPro - Curva: kg/L Totales, Metas, % Cumplimiento, Tabla Mensual' },
  { file: 'inf-expro/expro-04.png', nav: '#/informes?cat=expro&sub=cargas', name: 'ExPro - Aforos: Zonas, Ocupación, Carga UGM/ha, Semáforo' },
  { file: 'inf-expro/expro-05.png', nav: '#/informes?cat=expro&sub=fitosanitario', name: 'ExPro - Fitosanitario: Inversión, Aplicaciones, Período Seguridad' },
  { file: 'inf-expro/expro-06.png', nav: '#/informes?cat=expro&sub=silos', name: 'ExPro - Silos: Stock, Capacidad, Autonomía' },
  { file: 'inf-expro/expro-07.png', nav: '#/informes?cat=expro&sub=tramites', name: 'ExPro - Trámites: Censo, Movimientos, Crotales, Saneamientos' },
  { file: 'inf-expro/expro-08.png', nav: '#/informes?cat=expro&sub=proveedores', name: 'ExPro - Proveedores: Facturas, Categorías, Gastos' },
  { file: 'inf-expro/expro-09.png', nav: '#/informes?cat=expro&sub=gastos', name: 'ExPro - Gastos: Total, Cats, Proveedores, Evolución 6m (Fase B)' },

  // CoMer (6 tabs) - COMERCIALIZACIÓN
  { file: 'inf-comer/comer-01.png', nav: '#/informes?cat=comer&sub=ventas', name: 'CoMer - Ventas: Libro Ventas (Albarán, Comprador, kg, €/kg, IVA, DIMOE)' },
  { file: 'inf-comer/comer-02.png', nav: '#/informes?cat=comer&sub=margenes', name: 'CoMer - Márgenes: Margen Carne Neto, MOFA Leche, Doughnut (Fase B)' },
  { file: 'inf-comer/comer-03.png', nav: '#/informes?cat=comer&sub=compradores', name: 'CoMer - Compradores: Ventas, kg, Precio Medio, % Ingresos, Contrato' },
  { file: 'inf-comer/comer-04.png', nav: '#/informes?cat=comer&sub=contratos-vencimiento', name: 'CoMer - Contratos: Vencimientos, Estado, Precios' },
  { file: 'inf-comer/comer-05.png', nav: '#/informes?cat=comer&sub=transportistas-resumen', name: 'CoMer - Transportistas: Capacidad, Certificados, Desinsectación' },
  { file: 'inf-comer/comer-06.png', nav: '#/informes?cat=comer&sub=albaranes', name: 'CoMer - Albaranes: Total, Importe, kg, Tabla con Estados (Fase B)' },

  // Libros (6 tabs)
  { file: 'inf-lib/lib-01.png', nav: '#/informes?cat=libros&sub=pyg', name: 'Libros - P y G: Ingresos Leche/Carne, Gastos 6 Cats, EBITDA' },
  { file: 'inf-lib/lib-02.png', nav: '#/informes?cat=libros&sub=flujo-caja', name: 'Libros - Flujo Caja: Mensual, Entradas/Salidas, Acumulado' },
  { file: 'inf-lib/lib-03.png', nav: '#/informes?cat=libros&sub=breakeven', name: 'Libros - Break-Even: Costes Fijos/Variables, kg/L, Margen Seguridad (Fase B)' },
  { file: 'inf-lib/lib-04.png', nav: '#/informes?cat=libros&sub=subvenciones', name: 'Libros - PAC: Solicitado/Cobrado/Pendiente, Resumen Año (Fase B)' },
  { file: 'inf-lib/lib-05.png', nav: '#/informes?cat=libros&sub=exportar', name: 'Libros - Exportar: PDF 30 secciones, Excel 8 hojas, CSV SIGGAN, XML' },
  { file: 'inf-lib/lib-06.png', nav: '#/informes?cat=libros&sub=rega', name: 'Libros - REGA: Censo + Explotación (XML) para SIGGAN/BADIGEX' },

  // ============================================================
  // 5. SANIDAD & REPRODUCCIÓN (20 capturas)
  // ============================================================
  { file: 'san/san-01.png', nav: '#/sanidad', name: 'Sanidad - Vista Principal: Alertas Supresión + Historial + Vacunaciones ADSG' },
  { file: 'san/san-02.png', nav: '#/sanidad', name: 'Sanidad - Alertas Supresión SIEMPRE VISIBLES (gradiente rojo, pulse, badge CARNE/LECHE)' },
  { file: 'san/san-03.png', nav: '#/sanidad', name: 'Sanidad - Historial Clínico: Badges Estado (ESPERA X DÍAS / SIN SUPRESIÓN / PROHIBIDO)' },
  { file: 'san/san-04.png', nav: '#/sanidad', name: 'Sanidad - Calculadora Dosis (Peso × mg/kg ÷ Conc. = mL)' },
  { file: 'san/san-05.png', nav: '#/sanidad', name: 'Sanidad - Vacunaciones Libro ADSG: ABIERTA/CERRADA/ANULADA' },

  { file: 'bot/bot-01.png', nav: '#/botiquin', name: 'Botiquín - Listado: Stock, Lotes, Caducidades, Alertas FEFO' },
  { file: 'bot/bot-02.png', nav: '#/botiquin', name: 'Botiquín - Detalle Producto: Historial Entradas/Consumos (Verde+/Rojo-)' },
  { file: 'bot/bot-03.png', nav: '#/botiquin', name: 'Botiquín - Alertas: STOCK BAJO, CADUCADO, CADUCA EN X DÍAS' },

  { file: 'fito/fito-01.png', nav: '#/fitosanitarios', name: 'Fitosanitarios - Cuaderno RD 787/2023: KPIs, Historial' },
  { file: 'fito/fito-02.png', nav: '#/fitosanitarios', name: 'Fitosanitarios - Control Normativo: Registro, Dosis, Plazo, Apto' },
  { file: 'fito/fito-03.png', nav: '#/fitosanitarios', name: 'Fitosanitarios - Badge Período Seguridad: COMPLETADO (verde) / BLOQUEADO (rojo pulse)' },
  { file: 'fito/fito-04.png', nav: '#/fitosanitarios', name: 'Fitosanitarios - Export PDF Libro Oficial' },

  { file: 'sane/sane-01.png', nav: '#/saneamientos', name: 'Saneamientos - Campañas ADSG: Calificación, Examinados/Positivos, Restricción Movimientos' },
  { file: 'sane/sane-02.png', nav: '#/saneamientos', name: 'Saneamientos - Wizard Creación (Validación: positivos ≤ examinados)' },

  // Wizards Sanidad
  { file: 'wiz-san/wiz-trat-01.png', nav: '#/sanidad', name: 'Wizard Tratamiento - Paso 1: Catálogo SIGGAN + Calculadora Dosis' },
  { file: 'wiz-san/wiz-trat-02.png', nav: '#/sanidad', name: 'Wizard Tratamiento - Paso 2: Libro Tratamientos Oficial (Motivo, Vía, Receta, Vet, Lote)' },
  { file: 'wiz-san/wiz-vac-01.png', nav: '#/sanidad', name: 'Wizard Vacunación - Paso 1: Cabecera + hasta 4 Tipos Vacuna (Lote, Dosis, Comercial)' },
  { file: 'wiz-san/wiz-vac-02.png', nav: '#/sanidad', name: 'Wizard Vacunación - Paso 2: Animales Por Categoría o Individuales, % Censo' },

  { file: 'bit/bit-01.png', nav: '#/animal?id=X/bitacora', name: 'Bitácora Animal - Comentarios, Cond. Corporal (BCS/9), Reubicaciones' },
  { file: 'marg/marg-01.png', nav: '#/sanidad', name: 'Margen Animal - Ranking Margen Neto (Rentable éxito/No Rentable danger)' },

  // ============================================================
  // 6. CONFIGURACIÓN & DOCUMENTOS (22 capturas)
  // ============================================================
  { file: 'ajust/ajust-01.png', nav: '#/ajustes', name: 'Ajustes - Sistema/Seguridad, Finca Activa, Multi-finca (Free 1 vs Premium ∞)' },
  { file: 'ajust/ajust-02.png', nav: '#/ajustes', name: 'Ajustes - ADSG, Objetivos (GMD, Fertilidad), Especies/Razas CRUD' },
  { file: 'ajust/ajust-03.png', nav: '#/ajustes', name: 'Ajustes - Alertas (6 toggles), Guías Interactivas, Wizard Retroiluminación (4 pasos)' },
  { file: 'ajust/ajust-04.png', nav: '#/ajustes', name: 'Ajustes - Banner FREE Persistente + Botón ACTUALIZAR A PREMIUM' },

  { file: 'sist/sist-01.png', nav: '#/sistema?tab=interfaz', name: 'Sistema - Interfaz: OLED, Paleta, Retroiluminación, Formatos, Color Acento (8)' },
  { file: 'sist/sist-02.png', nav: '#/sistema?tab=seguridad', name: 'Sistema - Seguridad: Exportar/Importar Backup, Auto-backup, Limpiar Caché' },
  { file: 'sist/sist-03.png', nav: '#/sistema?tab=auditoria', name: 'Sistema - Auditoría: Últimos 50 (anulado=rojo, rectificado=ámbar)' },

  { file: 'doc/doc-01.png', nav: '#/documentos', name: 'Documentos - 8 Tipos Unificados (DIMOE, Factura, Certificado, DIB, Crotales, Albaranes, Contratos)' },
  { file: 'doc/doc-02.png', nav: '#/documentos', name: 'Documentos - Lista: Badge Estado (Borrador/Presentado), Acuse Manual (rojo/ámbar/gris/verde)' },
  { file: 'doc/doc-03.png', nav: '#/documentos', name: 'Documentos - Modal Consultar/Imprimir (Grid 2×5 tipos) + PDF por tipo' },
  { file: 'doc/doc-04.png', nav: '#/documentos', name: 'Documentos - Banner Interno SIGGAN: Genera → Sube Manual → Registra Acuse' },

  { file: 'cuad/cuad-01.png', nav: '#/cuaderno-digital', name: 'Cuaderno Digital - 8 Secciones RD 787/2023 + 2 Extras (Saneamientos, Económico)' },
  { file: 'cuad/cuad-02.png', nav: '#/cuaderno-digital', name: 'Cuaderno Digital - Export: PDF Completo, CSV SIGGAN (8 secciones ; BOM), Imprimir' },

  { file: 'traz/traz-01.png', nav: '#/trazabilidad/:id', name: 'Trazabilidad 360° - Timeline 6 Fuentes (Nacimiento→Venta), Orden Ascendente' },
  { file: 'traz/traz-02.png', nav: '#/trazabilidad/:id', name: 'Trazabilidad - Evento Sanitario: Supresión Carne (rojo), Prohibido Leche, Vet+Colegiado, Receta' },
  { file: 'traz/traz-03.png', nav: '#/trazabilidad/:id', name: 'Trazabilidad - Evento Venta: Comprador, Peso Vivo/Canal, Rendimiento, SEUROP Gold, DIMOE, Transportista' },
  { file: 'traz/traz-04.png', nav: '#/trazabilidad/:id', name: 'Trazabilidad - Export PDF (Cabecera Finca/Animal + Timeline Completo)' },

  { file: 'subex/subex-01.png', nav: '#/subexplotaciones', name: 'Subexplotaciones - Gap SIGGAN: Capa Aditiva por Especie (REGA + Tipo + Sistema)' },
  { file: 'subex/subex-02.png', nav: '#/subexplotaciones', name: 'Subexplotaciones - Wizard Creación + Soft Delete (anulada=true)' },

  { file: 'agen/agen-01.png', nav: '#/agenda', name: 'Agenda - Carrusel Sticky 8 Módulos, Filtros Estado/Prioridad, Widget Embebible' },
  { file: 'agen/agen-02.png', nav: '#/agenda', name: 'Agenda - Tareas: Badge Prioridad (rojo/ámbar/verde), Alerta 🔔, Vencida, WizardTarea' },

  { file: 'patr/patr-01.png', nav: '#/patrimonio', name: 'Patrimonio - Censo/Valor Estimado, KPI Grid (Censo, Lotes, Valor, ICA, Coste/kg)' },
  { file: 'patr/patr-02.png', nav: '#/patrimonio', name: 'Patrimonio - ICA 2 Niveles: Cierre Tanda (SIGGAN entrada→matadero) + Control Mensual 6m (desvío >20% rojo)' },
  { file: 'patr/patr-03.png', nav: '#/patrimonio', name: 'Patrimonio - ICA Panel: Cierre (coloreado, estado CERRADO/ABIERTO) + Control Mensual (barras)' },

  { file: 'gast/gast-01.png', nav: '#/gastos', name: 'Gastos - Tabs 7 Categorías Contable (sticky, scroll-shadow, badge deslizar)' },
  { file: 'gast/gast-02.png', nav: '#/gastos', name: 'Gastos - Evolución 6m Barras (rojo>70%, ámbar>40%, verde≤40%) + Balance Global' },
  { file: 'gast/gast-03.png', nav: '#/gastos', name: 'Gastos - Cards: Concepto, Subtítulo fecha|zona|cat, Importe color cat, Badge "Ficha ->"' },

  { file: 'inst/inst-01.png', nav: '#/instalaciones', name: 'Instalaciones - Catálogo SIEX: Tipo, m², Plazas, m³, Código SIEX' },
  { file: 'inst/inst-02.png', nav: '#/instalaciones', name: 'Instalaciones - Wizard Creación + Soft Delete' },

  { file: 'rfid/rfid-01.png', nav: '#/importar-rfid', name: 'Importador RFID - 3 Pasos: Archivo → Detección Tipo → Progreso → Resultado (ok/errores)' },

  { file: 'man/man-01.png', nav: '#/manuales', name: 'Manuales - Catálogo 18 Manuales + Overlay Iframe + Export PDF (html2pdf + Share)' },
];

async function captureScreenshots() {
  console.log('🚀 Iniciando captura de', screenshots.length, 'screenshots para Manual Profesional v4.10.1...\n');
  console.log('📱 Viewport: Móvil 390x844 (Xiaomi)\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Viewport móvil (Xiaomi típico)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });

    // Configurar timeouts más generosos
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Ir a la aplicación
    console.log('📱 Navegando a', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Esperar a que la app esté lista (App.init completado)
    await page.waitForFunction(() => window.App && window.App._initialized, { timeout: 30000 }).catch(() => {});

    // Cargar demo CHAMORRO
    console.log('📦 Cargando demo CHAMORRO...');
    await page.evaluate(() => {
      if (window.SeedData && window.SeedData.run) {
        return window.SeedData.run(true); // force=true para recargar si ya existe
      }
    });

    // Esperar a que termine el seed (el toast desaparece o timeout)
    await new Promise(r => setTimeout(r, 5000));

    console.log('✅ Demo cargada, iniciando capturas...\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i];
      const filePath = path.join(SCREENSHOTS_DIR, ss.file);

      console.log(`[${i + 1}/${screenshots.length}] ${ss.name} → ${ss.file}`);

      try {
        // Navegar a la ruta
        await page.goto(BASE_URL + ss.nav, { waitUntil: 'networkidle2', timeout: 30000 });

        // Esperar renderizado (animaciones, charts, etc.)
        await new Promise(r => setTimeout(r, 1500));

        // Scroll al top para consistencia
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 300));

        // Capturar (viewport móvil 390x844)
        await page.screenshot({
          path: filePath,
          fullPage: false,
          clip: { x: 0, y: 0, width: 390, height: 844 }
        });

        console.log(`   ✅ Guardado (${(fs.statSync(filePath).size / 1024).toFixed(0)} KB)`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failCount++;

        // Crear placeholder para mantener estructura
        const placeholder = `
          <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1024">
            <rect width="100%" height="100%" fill="#1a1a2e"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                  font-family="system-ui" font-size="24" fill="#666">
              CAPTURA FALLIDA: ${ss.name}
            </text>
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
                  font-family="system-ui" font-size="16" fill="#444">
              ${ss.nav} | ${error.message.substring(0, 80)}
            </text>
          </svg>
        `;
        fs.writeFileSync(filePath.replace('.png', '.svg'), placeholder);
      }
    }

    console.log('\n═══════════════════════════════════');
    console.log('✅ CAPTURA COMPLETADA');
    console.log('═══════════════════════════════════');
    console.log(`📁 Directorio: ${SCREENSHOTS_DIR}`);
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Fallidas: ${failCount}`);
    console.log(`📊 Total: ${screenshots.length} screenshots planificados`);

    // Generar índice de capturas para el manual
    const index = {
      version: '4.10.1',
      fecha: new Date().toISOString(),
      demo: 'CHAMORRO',
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
    console.error('❌ Error crítico durante la captura:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshots();