/**
 * Screenshot Capture via ADB Native - LIVESTOCK MANAGER v4.10.1
 * Usa adb shell input + screencap para capturar en dispositivo real (Xiaomi)
 * Evita problemas de CDP/WebSocket en WebView Android
 *
 * Requisitos:
 * - Dispositivo conectado USB con depuración activada
 * - App LIVESTOCK-MANAGER instalada y corriendo
 * - ADB configurado
 *
 * Uso: node scripts/capture-screenshots-adb.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB_SERIAL = '485abd240000';
const PKG = 'com.livestockmanager.app.manual';
const ACTIVITY = '.MainActivity';
const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

// Helper para ejecutar comandos ADB
function adb(args) {
  return execSync(`adb -s ${ADB_SERIAL} ${args}`, { encoding: 'buffer', timeout: 30000 });
}

function adbShell(cmd) {
  return adb(`shell ${cmd}`);
}

// Crear directorios
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

// Coordenadas aproximadas para navegación (Xiaomi ~1080x2400)
// Se pueden calibrar con: adb shell getevent -l
const COORDS = {
  // Header / Navigation
  header_finca: { x: 540, y: 100 },           // Tap en nombre de finca (cambiar finca)
  fab: { x: 980, y: 2200 },                   // FAB flotante
  tab_ganaderia: { x: 180, y: 2300 },         // Carrusel Ganadería
  tab_explotacion: { x: 360, y: 2300 },       // Carrusel Explotación
  tab_comercializacion: { x: 540, y: 2300 },  // Carrusel Comercialización
  tab_informes: { x: 720, y: 2300 },          // Carrusel Informes
  tab_ajustes: { x: 900, y: 2300 },           // Carrusel Ajustes

  // Sub-tabs Ganadería
  sub_animales: { x: 180, y: 350 },
  sub_rebanos: { x: 360, y: 350 },
  sub_zonas: { x: 540, y: 350 },
  sub_sanidad: { x: 720, y: 350 },

  // Sub-tabs Explotación
  sub_expro: { x: 100, y: 350 },
  sub_lacteo: { x: 250, y: 350 },
  sub_tanques: { x: 400, y: 350 },
  sub_control: { x: 550, y: 350 },
  sub_balance: { x: 700, y: 350 },
  sub_graficos: { x: 850, y: 350 },
  sub_silos: { x: 1000, y: 350 },

  // Sub-tabs Comercialización
  sub_carne: { x: 180, y: 350 },
  sub_leche: { x: 360, y: 350 },
  sub_compradores: { x: 540, y: 350 },
  sub_transportistas: { x: 720, y: 350 },
  sub_contratos: { x: 900, y: 350 },

  // Generic
  back_button: { x: 60, y: 120 },             // Flecha atrás header
  list_item_1: { x: 540, y: 600 },            // Primer item lista
  list_item_2: { x: 540, y: 800 },            // Segundo item
  wizard_next: { x: 980, y: 2250 },           // Botón Siguiente wizard
  wizard_prev: { x: 100, y: 2250 },           // Botón Anterior wizard
  close_modal: { x: 1020, y: 180 },           // Cerrar modal (X)
};

function tap(x, y) {
  adbShell(`input tap ${x} ${y}`);
}

function swipe(x1, y1, x2, y2, duration = 300) {
  adbShell(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreen(filename) {
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  try {
    // Capturar pantalla
    const pngBuffer = adb('exec-out screencap -p');
    fs.writeFileSync(filePath, pngBuffer);
    const sizeKB = (pngBuffer.length / 1024).toFixed(0);
    console.log(`   ✅ ${filename} (${sizeKB} KB)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error capturando: ${error.message}`);
    return false;
  }
}

async function goHome() {
  // Ir a Dashboard (home)
  tap(COORDS.tab_ganaderia.x, COORDS.tab_ganaderia.y); // Tap ganadería para reset
  await sleep(500);
  tap(COORDS.header_finca.x, COORDS.header_finca.y); // Tap header
  await sleep(500);
}

async function navigateToTab(mainTab, subTab = null) {
  // Tap tab principal
  tap(mainTab.x, mainTab.y);
  await sleep(800);

  if (subTab) {
    tap(subTab.x, subTab.y);
    await sleep(800);
  }
}

async function openDrawer() {
  // Swipe desde borde izquierdo para drawer (si existe)
  swipe(0, 1200, 500, 1200, 300);
  await sleep(500);
}

async function main() {
  console.log('🚀 Iniciando captura ADB nativa en Xiaomi...');
  console.log(`📱 Device: ${ADB_SERIAL}`);
  console.log(`📦 Package: ${PKG}\n`);

  // Asegurar app en foreground
  adbShell(`am start -n ${PKG}/${ACTIVITY}`);
  await sleep(3000);

  // Cargar demo CHAMORRO via intent o UI
  console.log('📦 Cargando demo CHAMORRO...');
  // Ejecutar via ADB shell am broadcast o intent personalizado
  try {
    adbShell(`am broadcast -a com.livestockmanager.LOAD_DEMO --es force true`);
    await sleep(5000);
  } catch (e) {
    console.log('⚠️  Broadcast no disponible, intentando por UI...');
  }

  // Lista de capturas planificadas
  const captures = [
    // DASHBOARD & GANADERÍA
    { file: 'dash/dash-01.png', action: () => navigateToTab(COORDS.tab_ganaderia), name: 'Dashboard Principal' },
    { file: 'dash/dash-02.png', action: () => navigateToTab(COORDS.tab_ganaderia), name: 'Dashboard Bento 12', wait: 1000 },
    { file: 'dash/dash-03.png', action: () => navigateToTab(COORDS.tab_ganaderia), name: 'Indicadores Lácteos', wait: 1000 },
    { file: 'dash/dash-04.png', action: () => navigateToTab(COORDS.tab_ganaderia), name: 'Calendario Preventivo', wait: 1000 },
    { file: 'dash/dash-05.png', action: () => navigateToTab(COORDS.tab_ganaderia), name: 'Banner Free/Premium', wait: 500 },

    { file: 'gan/gan-01.png', action: () => navigateToTab(COORDS.tab_ganaderia), name: 'Ganadería Consola' },
    { file: 'gan/gan-02.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Submódulo Animales' },
    { file: 'gan/gan-03.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_rebanos), name: 'Submódulo Rebaños' },
    { file: 'gan/gan-04.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_zonas), name: 'Submódulo Zonas' },
    { file: 'gan/gan-05.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Submódulo Sanidad' },

    { file: 'anim/anim-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Animales Listado' },
    { file: 'anim/anim-02.png', action: async () => {
      await navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales);
      tap(COORDS.list_item_1.x, COORDS.list_item_1.y);
      await sleep(1000);
    }, name: 'Ficha Animal' },
    { file: 'anim/anim-03.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Validación Crotal', wait: 500 },
    { file: 'anim/anim-04.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Escáner RFID', wait: 500 },
    { file: 'anim/anim-05.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Madre-Cría', wait: 500 },
    { file: 'anim/anim-06.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Margen Económico', wait: 500 },
    { file: 'anim/anim-07.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Notificación REGA', wait: 500 },

    { file: 'reb/reb-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_rebanos), name: 'Rebaños Listado' },
    { file: 'reb/reb-02.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_rebanos), name: 'Wizard Rebaño', wait: 500 },

    { file: 'zon/zon-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_zonas), name: 'Zonas Parcelas' },
    { file: 'zon/zon-02.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_zonas), name: 'Alerta Sobrepastoreo', wait: 500 },
    { file: 'zon/zon-03.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_zonas), name: 'Rotación Pastos', wait: 500 },

    // EXPLOTACIÓN & PRODUCCIÓN
    { file: 'expro/expro-01.png', action: () => navigateToTab(COORDS.tab_explotacion), name: 'Explotación Carrusel 11' },
    { file: 'expro/expro-02.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_expro), name: 'Balance Unificado' },
    { file: 'expro/expro-03.png', action: () => navigateToTab(COORDS.tab_explotacion), name: 'Banner Guía 365', wait: 500 },
    { file: 'expro/expro-04.png', action: () => navigateToTab(COORDS.tab_explotacion), name: 'Alerta Silos', wait: 500 },
    { file: 'expro/expro-05.png', action: () => navigateToTab(COORDS.tab_explotacion), name: 'Actividad Reciente', wait: 500 },
    { file: 'expro/expro-06.png', action: () => navigateToTab(COORDS.tab_explotacion), name: 'Wizards Directos', wait: 500 },

    { file: 'lact/lact-01.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_lacteo), name: 'Láctea Dashboard' },
    { file: 'lact/lact-02.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_lacteo), name: 'Alertas MotorLacteo', wait: 500 },
    { file: 'lact/lact-03.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_tanques), name: 'Tanques' },
    { file: 'lact/lact-04.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_control), name: 'Control Analíticas' },
    { file: 'lact/lact-05.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_balance), name: 'Balance Entradas/Salidas' },
    { file: 'lact/lact-06.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_graficos), name: 'Gráficos 5 Chart.js' },

    { file: 'tanq/tanq-01.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_tanques), name: 'Tanques Gauge' },
    { file: 'tanq/tanq-02.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_tanques), name: 'Historial Tanques', wait: 500 },
    { file: 'tanq/tanq-03.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_tanques), name: 'Wizard Tanque', wait: 500 },

    { file: 'silos/sil-01.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_silos), name: 'Silos Telemetría' },
    { file: 'silos/sil-02.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_silos), name: 'Autonomía Silos', wait: 500 },
    { file: 'silos/sil-03.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_silos), name: 'Cargar/Consumir', wait: 500 },
    { file: 'silos/sil-04.png', action: () => navigateToTab(COORDS.tab_explotacion, COORDS.sub_silos), name: 'Ficha Técnica', wait: 500 },

    // COMERCIALIZACIÓN
    { file: 'com/com-01.png', action: () => navigateToTab(COORDS.tab_comercializacion), name: 'Comercialización Carrusel' },
    { file: 'com/com-02.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_carne), name: 'Carne KPIs' },
    { file: 'com/com-03.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_leche), name: 'Leche KPIs' },

    { file: 'com/wiz-venta-01.png', action: async () => {
      await navigateToTab(COORDS.tab_comercializacion, COORDS.sub_carne);
      // Tap FAB para nueva venta
      tap(COORDS.fab.x, COORDS.fab.y);
      await sleep(1000);
    }, name: 'Venta Paso 1 Aptitud' },
    { file: 'com/wiz-venta-02.png', action: async () => { tap(COORDS.wizard_next.x, COORDS.wizard_next.y); await sleep(800); }, name: 'Venta Paso 2 Trazabilidad' },
    { file: 'com/wiz-venta-03.png', action: async () => { tap(COORDS.wizard_next.x, COORDS.wizard_next.y); await sleep(800); }, name: 'Venta Paso 3 Económicos' },
    { file: 'com/wiz-venta-04.png', action: async () => { tap(COORDS.wizard_next.x, COORDS.wizard_next.y); await sleep(800); }, name: 'Venta Paso 4 Liquidación' },
    { file: 'com/wiz-venta-05.png', action: async () => { tap(COORDS.wizard_next.x, COORDS.wizard_next.y); await sleep(800); }, name: 'Venta Paso 5 Logística' },

    { file: 'compr/compr-01.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_compradores), name: 'Compradores Listado' },
    { file: 'compr/compr-02.png', action: async () => {
      await navigateToTab(COORDS.tab_comercializacion, COORDS.sub_compradores);
      tap(COORDS.list_item_1.x, COORDS.list_item_1.y);
      await sleep(800);
    }, name: 'Comprador Detalle' },
    { file: 'compr/compr-03.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_compradores), name: 'Nuevo Comprador', wait: 500 },

    { file: 'prov/prov-01.png', action: () => navigateToTab(COORDS.tab_comercializacion, {x: 540, y: 350}), name: 'Proveedores' }, // approx
    { file: 'prov/prov-02.png', action: () => navigateToTab(COORDS.tab_comercializacion), name: 'Proveedor Detalle', wait: 500 },
    { file: 'prov/prov-03.png', action: () => navigateToTab(COORDS.tab_comercializacion), name: 'Nuevo Proveedor', wait: 500 },

    { file: 'trans/trans-01.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_transportistas), name: 'Transportistas' },
    { file: 'trans/trans-02.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_transportistas), name: 'Nuevo Transportista', wait: 500 },

    { file: 'contr/contr-01.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_contratos), name: 'Contratos' },
    { file: 'contr/contr-02.png', action: async () => {
      await navigateToTab(COORDS.tab_comercializacion, COORDS.sub_contratos);
      tap(COORDS.list_item_1.x, COORDS.list_item_1.y);
      await sleep(800);
    }, name: 'Contrato Detalle' },
    { file: 'contr/contr-03.png', action: () => navigateToTab(COORDS.tab_comercializacion, COORDS.sub_contratos), name: 'Nuevo Contrato', wait: 500 },

    { file: 'alb/alb-01.png', action: () => navigateToTab(COORDS.tab_comercializacion), name: 'Albaranes Historial' }, // may need specific nav
    { file: 'alb/alb-02.png', action: () => navigateToTab(COORDS.tab_comercializacion), name: 'Albarán Detalle', wait: 500 },

    // INFORMES
    { file: 'inf/inf-01.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Informes Principal' },
    { file: 'inf/inf-02.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Exportación Botones', wait: 500 },
    { file: 'inf/inf-03.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Pre-flight Validación', wait: 500 },

    { file: 'inf/inf-gen-01.png', action: () => navigateToTab(COORDS.tab_informes), name: 'General Balance' },
    { file: 'inf/inf-gen-02.png', action: () => navigateToTab(COORDS.tab_informes), name: 'General Por Finca', wait: 500 },
    { file: 'inf/inf-gen-03.png', action: () => navigateToTab(COORDS.tab_informes), name: 'General Alertas', wait: 500 },
    { file: 'inf/inf-gen-04.png', action: () => navigateToTab(COORDS.tab_informes), name: 'General Eficiencia', wait: 500 },
    { file: 'inf/inf-gen-05.png', action: () => navigateToTab(COORDS.tab_informes), name: 'General Rentabilidad', wait: 500 },

    { file: 'inf-gegan/gegan-01.png', action: () => navigateToTab(COORDS.tab_informes), name: 'GeGan Censo' },
    { file: 'inf-gegan/gegan-02.png', action: () => navigateToTab(COORDS.tab_informes), name: 'GeGan Rotación', wait: 500 },
    { file: 'inf-gegan/gegan-03.png', action: () => navigateToTab(COORDS.tab_informes), name: 'GeGan Reproductivo', wait: 500 },
    { file: 'inf-gegan/gegan-04.png', action: () => navigateToTab(COORDS.tab_informes), name: 'GeGan Sanidad', wait: 500 },
    { file: 'inf-gegan/gegan-05.png', action: () => navigateToTab(COORDS.tab_informes), name: 'GeGan Cárnico', wait: 500 },
    { file: 'inf-gegan/gegan-06.png', action: () => navigateToTab(COORDS.tab_informes), name: 'GeGan Coste/Animal', wait: 500 },

    { file: 'inf-expro/expro-01.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Producción' },
    { file: 'inf-expro/expro-02.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Lácteo', wait: 500 },
    { file: 'inf-expro/expro-03.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Curva', wait: 500 },
    { file: 'inf-expro/expro-04.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Aforos', wait: 500 },
    { file: 'inf-expro/expro-05.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Fitosanitario', wait: 500 },
    { file: 'inf-expro/expro-06.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Silos', wait: 500 },
    { file: 'inf-expro/expro-07.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Trámites', wait: 500 },
    { file: 'inf-expro/expro-08.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Proveedores', wait: 500 },
    { file: 'inf-expro/expro-09.png', action: () => navigateToTab(COORDS.tab_informes), name: 'ExPro Gastos', wait: 500 },

    { file: 'inf-comer/comer-01.png', action: () => navigateToTab(COORDS.tab_informes), name: 'CoMer Ventas' },
    { file: 'inf-comer/comer-02.png', action: () => navigateToTab(COORDS.tab_informes), name: 'CoMer Márgenes', wait: 500 },
    { file: 'inf-comer/comer-03.png', action: () => navigateToTab(COORDS.tab_informes), name: 'CoMer Compradores', wait: 500 },
    { file: 'inf-comer/comer-04.png', action: () => navigateToTab(COORDS.tab_informes), name: 'CoMer Contratos', wait: 500 },
    { file: 'inf-comer/comer-05.png', action: () => navigateToTab(COORDS.tab_informes), name: 'CoMer Transportistas', wait: 500 },
    { file: 'inf-comer/comer-06.png', action: () => navigateToTab(COORDS.tab_informes), name: 'CoMer Albaranes', wait: 500 },

    { file: 'inf-lib/lib-01.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Libros P y G' },
    { file: 'inf-lib/lib-02.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Libros Flujo Caja', wait: 500 },
    { file: 'inf-lib/lib-03.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Libros Break-Even', wait: 500 },
    { file: 'inf-lib/lib-04.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Libros PAC', wait: 500 },
    { file: 'inf-lib/lib-05.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Libros Exportar', wait: 500 },
    { file: 'inf-lib/lib-06.png', action: () => navigateToTab(COORDS.tab_informes), name: 'Libros REGA XML', wait: 500 },

    // SANIDAD & REPRODUCCIÓN
    { file: 'san/san-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Sanidad Principal' },
    { file: 'san/san-02.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Alertas Supresión', wait: 500 },
    { file: 'san/san-03.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Historial Clínico', wait: 500 },
    { file: 'san/san-04.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Calculadora Dosis', wait: 500 },
    { file: 'san/san-05.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Vacunaciones ADSG', wait: 500 },

    { file: 'bot/bot-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Botiquín Listado' },
    { file: 'bot/bot-02.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Botiquín Detalle', wait: 500 },
    { file: 'bot/bot-03.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Botiquín Alertas', wait: 500 },

    { file: 'fito/fito-01.png', action: async () => { /* navegar a fitosanitarios - aprox */ navigateToTab(COORDS.tab_explotacion); }, name: 'Fitosanitarios Cuaderno' },
    { file: 'fito/fito-02.png', action: () => {}, name: 'Fitosanitarios Control', wait: 500 },
    { file: 'fito/fito-03.png', action: () => {}, name: 'Fitosanitarios Período Seguridad', wait: 500 },
    { file: 'fito/fito-04.png', action: () => {}, name: 'Fitosanitarios Export PDF', wait: 500 },

    { file: 'sane/sane-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Saneamientos ADSG' },
    { file: 'sane/sane-02.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Wizard Saneamiento', wait: 500 },

    { file: 'wiz-san/wiz-trat-01.png', action: async () => {
      await navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad);
      tap(COORDS.fab.x, COORDS.fab.y); await sleep(800);
    }, name: 'Wizard Tratamiento Paso 1' },
    { file: 'wiz-san/wiz-trat-02.png', action: async () => { tap(COORDS.wizard_next.x, COORDS.wizard_next.y); await sleep(800); }, name: 'Wizard Tratamiento Paso 2' },
    { file: 'wiz-san/wiz-vac-01.png', action: async () => {
      await navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad);
      // tap vacunación FAB
      tap(COORDS.fab.x, COORDS.fab.y); await sleep(800);
    }, name: 'Wizard Vacunación Paso 1' },
    { file: 'wiz-san/wiz-vac-02.png', action: async () => { tap(COORDS.wizard_next.x, COORDS.wizard_next.y); await sleep(800); }, name: 'Wizard Vacunación Paso 2' },

    { file: 'bit/bit-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Bitácora Animal' },
    { file: 'marg/marg-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_sanidad), name: 'Margen Animal' },

    // CONFIGURACIÓN & DOCUMENTOS
    { file: 'ajust/ajust-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Ajustes Sistema' },
    { file: 'ajust/ajust-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Ajustes ADSG', wait: 500 },
    { file: 'ajust/ajust-03.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Ajustes Alertas/Guías', wait: 500 },
    { file: 'ajust/ajust-04.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Banner FREE', wait: 500 },

    { file: 'sist/sist-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Sistema Interfaz' },
    { file: 'sist/sist-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Sistema Seguridad', wait: 500 },
    { file: 'sist/sist-03.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Sistema Auditoría', wait: 500 },

    { file: 'doc/doc-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Documentos 8 Tipos' },
    { file: 'doc/doc-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Documentos Lista', wait: 500 },
    { file: 'doc/doc-03.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Documentos Modal', wait: 500 },
    { file: 'doc/doc-04.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Documentos Banner SIGGAN', wait: 500 },

    { file: 'cuad/cuad-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Cuaderno Digital 8 Secc' },
    { file: 'cuad/cuad-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Cuaderno Export', wait: 500 },

    { file: 'traz/traz-01.png', action: () => navigateToTab(COORDS.tab_ganaderia, COORDS.sub_animales), name: 'Trazabilidad 360°' },
    { file: 'traz/traz-02.png', action: () => {}, name: 'Trazabilidad Evento Sanitario', wait: 500 },
    { file: 'traz/traz-03.png', action: () => {}, name: 'Trazabilidad Evento Venta', wait: 500 },
    { file: 'traz/traz-04.png', action: () => {}, name: 'Trazabilidad Export PDF', wait: 500 },

    { file: 'subex/subex-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Subexplotaciones SIGGAN' },
    { file: 'subex/subex-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Subex Wizard', wait: 500 },

    { file: 'agen/agen-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Agenda Carrusel' },
    { file: 'agen/agen-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Agenda Tareas', wait: 500 },

    { file: 'patr/patr-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Patrimonio KPI Grid' },
    { file: 'patr/patr-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Patrimonio ICA 2 Niveles', wait: 500 },
    { file: 'patr/patr-03.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Patrimonio ICA Panel', wait: 500 },

    { file: 'gast/gast-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Gastos 7 Cats' },
    { file: 'gast/gast-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Gastos Evolución 6m', wait: 500 },
    { file: 'gast/gast-03.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Gastos Cards', wait: 500 },

    { file: 'inst/inst-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Instalaciones SIEX' },
    { file: 'inst/inst-02.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Instalaciones Wizard', wait: 500 },

    { file: 'rfid/rfid-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Importador RFID' },
    { file: 'man/man-01.png', action: () => navigateToTab(COORDS.tab_ajustes), name: 'Manuales Catálogo' },
  ];

  console.log(`📋 ${captures.length} capturas planificadas\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < captures.length; i++) {
    const cap = captures[i];
    console.log(`[${i + 1}/${captures.length}] ${cap.name} → ${cap.file}`);

    try {
      if (cap.action) {
        await cap.action();
      }
      if (cap.wait) await sleep(cap.wait);
      else await sleep(800);

      const ok = await captureScreen(cap.file);
      if (ok) successCount++; else failCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n═══════════════════════════════════');
  console.log('✅ CAPTURA ADB COMPLETADA');
  console.log('═══════════════════════════════════');
  console.log(`📁 Directorio: ${SCREENSHOTS_DIR}`);
  console.log(`✅ Exitosas: ${successCount}`);
  console.log(`❌ Fallidas: ${failCount}`);
  console.log(`📊 Total: ${captures.length}`);

  // Índice
  const index = {
    version: '4.10.1',
    fecha: new Date().toISOString(),
    demo: 'CHAMORRO',
    dispositivo: 'Xiaomi (ADB Native screencap)',
    total: captures.length,
    exitosas: successCount,
    fallidas: failCount,
    capturas: captures.map((c, i) => ({
      orden: i + 1,
      archivo: c.file,
      nombre: c.name
    }))
  };

  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, '..', 'capturas-index.json'),
    JSON.stringify(index, null, 2)
  );
  console.log('\n📋 Índice: www/manual/capturas-index.json');
}

main().catch(console.error);