/**
 * Captura Screenshots - Versión Mejorada
 * Espera a que Vue Router cambie las vistas correctamente
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

// Crear directorios
const dirs = ['compr', 'prov', 'trans', 'anim', 'contr', 'san', 'rep'];
dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const screenshots = [
  // Compradores (8)
  { file: 'compr/compr-01.png', nav: '#/compradores', name: 'Compradores', waitFor: '.compradores-container' },
  { file: 'compr/compr-02.png', nav: '#/compradores', name: 'Nuevo Comprador', waitFor: '.btn-nuevo' },
  { file: 'compr/compr-03.png', nav: '#/compradores', name: 'Formulario', waitFor: 'input[name="nombre"]' },
  { file: 'compr/compr-04.png', nav: '#/compradores', name: 'Detalle', waitFor: '.detalle-comprador' },
  { file: 'compr/compr-05.png', nav: '#/compradores', name: 'Historial Ventas', waitFor: '.historial-ventas' },
  { file: 'compr/compr-06.png', nav: '#/compradores', name: 'Lácteos La Serena', waitFor: '.comprador-item' },
  { file: 'compr/compr-07.png', nav: '#/compradores', name: 'Contratos', waitFor: '.contratos-section' },
  { file: 'compr/compr-08.png', nav: '#/compradores', name: 'KPIs', waitFor: '.kpi-card' },

  // Proveedores (8)
  { file: 'prov/prov-01.png', nav: '#/proveedores', name: 'Proveedores', waitFor: '.proveedores-container' },
  { file: 'prov/prov-02.png', nav: '#/proveedores', name: 'Nuevo Proveedor', waitFor: '.btn-nuevo' },
  { file: 'prov/prov-03.png', nav: '#/proveedores', name: 'Categorías', waitFor: 'select' },
  { file: 'prov/prov-04.png', nav: '#/proveedores', name: 'Piensos El Trébol', waitFor: '.proveedor-item' },
  { file: 'prov/prov-05.png', nav: '#/proveedores', name: 'Gastos', waitFor: '.gastos-table' },
  { file: 'prov/prov-06.png', nav: '#/proveedores', name: 'VetPlus', waitFor: '.proveedor-detalle' },
  { file: 'prov/prov-07.png', nav: '#/proveedores', name: 'Maquinaria', waitFor: '.proveedor-item' },
  { file: 'prov/prov-08.png', nav: '#/proveedores', name: 'KPIs', waitFor: '.kpi-card' },

  // Transportistas (8)
  { file: 'trans/trans-01.png', nav: '#/transportistas', name: 'Transportistas', waitFor: '.transportistas-container' },
  { file: 'trans/trans-02.png', nav: '#/transportistas', name: 'Nuevo Transportista', waitFor: '.btn-nuevo' },
  { file: 'trans/trans-03.png', nav: '#/transportistas', name: 'Tipo Vehículo', waitFor: 'select' },
  { file: 'trans/trans-04.png', nav: '#/transportistas', name: 'Certificado', waitFor: 'input[type="checkbox"]' },
  { file: 'trans/trans-05.png', nav: '#/transportistas', name: 'Transporte Ganaderos', waitFor: '.transportista-item' },
  { file: 'trans/trans-06.png', nav: '#/transportistas', name: 'Logística Láctea', waitFor: '.transportista-item' },
  { file: 'trans/trans-07.png', nav: '#/transportistas', name: 'KPIs detalle', waitFor: '.kpi-card' },
  { file: 'trans/trans-08.png', nav: '#/transportistas', name: 'KPIs listado', waitFor: '.list-kpi' },

  // Animales (11)
  { file: 'anim/anim-01.png', nav: '#/estructura', name: 'Estructura', waitFor: '.estructura-container' },
  { file: 'anim/anim-02.png', nav: '#/zonas', name: 'Zonas', waitFor: '.zonas-list' },
  { file: 'anim/anim-03.png', nav: '#/rebanos', name: 'Rebaños', waitFor: '.rebanos-list' },
  { file: 'anim/anim-04.png', nav: '#/rebanos', name: 'Nuevo Rebaño', waitFor: '.btn-nuevo' },
  { file: 'anim/anim-05.png', nav: '#/animales', name: 'Animales', waitFor: '.animales-list' },
  { file: 'anim/anim-06.png', nav: '#/animales', name: 'Nuevo Animal 1', waitFor: '.btn-nuevo' },
  { file: 'anim/anim-07.png', nav: '#/animales', name: 'Nuevo Animal 2', waitFor: 'input[name="crotal"]' },
  { file: 'anim/anim-08.png', nav: '#/animales', name: 'Escáner', waitFor: '.scanner-icon' },
  { file: 'anim/anim-09.png', nav: '#/animales', name: 'Detalle Animal', waitFor: '.detalle-animal' },
  { file: 'anim/anim-10.png', nav: '#/animales', name: 'Genealogía', waitFor: '.genealogia-section' },
  { file: 'anim/anim-11.png', nav: '#/animales', name: 'KPIs', waitFor: '.kpi-card' },

  // Contratos (3)
  { file: 'contr/contr-01.png', nav: '#/compradores', name: 'Contratos', waitFor: '.contratos-section' },
  { file: 'contr/contr-02.png', nav: '#/compradores', name: 'Nuevo Contrato', waitFor: '.btn-nuevo-contrato' },
  { file: 'contr/contr-03.png', nav: '#/compradores', name: 'Precios', waitFor: '.tabla-precios' },

  // Sanitarios (5)
  { file: 'san/san-01.png', nav: '#/rebanos', name: 'Sanitarios', waitFor: '.sanitarios-section' },
  { file: 'san/san-02.png', nav: '#/rebanos', name: 'Nuevo Sanitario', waitFor: '.btn-nuevo-sanitario' },
  { file: 'san/san-03.png', nav: '#/rebanos', name: 'Tipos', waitFor: '.tipos-tratamiento' },
  { file: 'san/san-04.png', nav: '#/rebanos', name: 'Alerta', waitFor: '.sanitario-alert' },
  { file: 'san/san-05.png', nav: '#/rebanos', name: 'Historial', waitFor: '.historial-sanitario' },

  // Reproducción (5)
  { file: 'rep/rep-01.png', nav: '#/animales', name: 'Reproducción', waitFor: '.reproduccion-section' },
  { file: 'rep/rep-02.png', nav: '#/animales', name: 'Nuevo Evento', waitFor: '.btn-nuevo-evento' },
  { file: 'rep/rep-03.png', nav: '#/animales', name: 'Tipos Evento', waitFor: '.tipos-evento' },
  { file: 'rep/rep-04.png', nav: '#/animales', name: 'Ciclo Completo', waitFor: '.ciclo-completo' },
  { file: 'rep/rep-05.png', nav: '#/animales', name: 'Genealogía', waitFor: '.arbol-genealogico' }
];

async function captureScreenshots() {
  console.log('🚀 Iniciando captura mejorada (48 screenshots)...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 1024 }
  });

  try {
    const page = await browser.newPage();

    // Cargar página principal
    console.log('📱 Cargando aplicación...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Cargar demo una sola vez
    console.log('📦 Cargando demo CHAMORRO...');
    await page.evaluate(() => {
      if (window.SeedData && window.SeedData.run) {
        return window.SeedData.run();
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log('✅ Listo\n');
    console.log('📷 Capturando...\n');

    // Capturar screenshots
    let successful = 0;
    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i];
      const filePath = path.join(SCREENSHOTS_DIR, ss.file);

      process.stdout.write(`[${String(i + 1).padStart(2)}/48] ${ss.name.padEnd(25)} `);

      try {
        // Navegar a la ruta
        await page.goto(BASE_URL + ss.nav, { waitUntil: 'networkidle0', timeout: 10000 });

        // Esperar a que el router cambie la vista
        // Usa timeout más corto con fallback
        try {
          await page.waitForSelector(ss.waitFor || '.main-container', { timeout: 2000 });
        } catch (e) {
          // Si no encuentra el selector, solo espera tiempo
          await new Promise(r => setTimeout(r, 1000));
        }

        // Capturar
        await page.screenshot({
          path: filePath,
          fullPage: false
        });

        console.log('✅');
        successful++;
      } catch (e) {
        console.log(`⚠️  ${e.message}`);
      }

      if (i < screenshots.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    console.log(`\n✅ Captura completada: ${successful}/48`);
    console.log(`📁 Guardados en: www/manual/img/\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
