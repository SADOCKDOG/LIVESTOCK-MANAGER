/**
 * Screenshot Capture Script para Manuales
 * Captura 35 imágenes automáticamente usando Puppeteer
 *
 * Uso: node scripts/capture-screenshots.js
 * Requiere: npm install puppeteer
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
  { file: 'compr/compr-01.png', nav: '#/compradores', name: 'Acceso a Compradores' },
  { file: 'compr/compr-02.png', nav: '#/compradores', name: 'Nuevo Comprador paso 1' },
  { file: 'compr/compr-03.png', nav: '#/compradores', name: 'Nuevo Comprador paso 2' },
  { file: 'compr/compr-04.png', nav: '#/compradores', name: 'Cárnicas Extremeñas detalle' },
  { file: 'compr/compr-05.png', nav: '#/compradores', name: 'Historial Ventas' },
  { file: 'compr/compr-06.png', nav: '#/compradores', name: 'Lácteos La Serena' },
  { file: 'compr/compr-07.png', nav: '#/compradores', name: 'Contratos panel' },
  { file: 'compr/compr-08.png', nav: '#/compradores', name: 'KPIs globales' },

  // Proveedores (8)
  { file: 'prov/prov-01.png', nav: '#/proveedores', name: 'Acceso a Proveedores' },
  { file: 'prov/prov-02.png', nav: '#/proveedores', name: 'Nuevo Proveedor paso 1' },
  { file: 'prov/prov-03.png', nav: '#/proveedores', name: 'Nuevo Proveedor paso 2' },
  { file: 'prov/prov-04.png', nav: '#/proveedores', name: 'Piensos El Trébol' },
  { file: 'prov/prov-05.png', nav: '#/proveedores', name: 'Historial de Gastos' },
  { file: 'prov/prov-06.png', nav: '#/proveedores', name: 'VetPlus detalle' },
  { file: 'prov/prov-07.png', nav: '#/proveedores', name: 'Maquinaria La Vega' },
  { file: 'prov/prov-08.png', nav: '#/proveedores', name: 'KPIs Proveedores' },

  // Transportistas (8)
  { file: 'trans/trans-01.png', nav: '#/transportistas', name: 'Acceso a Transportistas' },
  { file: 'trans/trans-02.png', nav: '#/transportistas', name: 'Nuevo Transportista' },
  { file: 'trans/trans-03.png', nav: '#/transportistas', name: 'Tipo Vehículo select' },
  { file: 'trans/trans-04.png', nav: '#/transportistas', name: 'Certificado Bienestar' },
  { file: 'trans/trans-05.png', nav: '#/transportistas', name: 'Transporte Ganaderos' },
  { file: 'trans/trans-06.png', nav: '#/transportistas', name: 'Logística Láctea' },
  { file: 'trans/trans-07.png', nav: '#/transportistas', name: 'KPIs detalle' },
  { file: 'trans/trans-08.png', nav: '#/transportistas', name: 'KPIs listado' },

  // Animales y Rebaños (11)
  { file: 'anim/anim-01.png', nav: '#/estructura', name: 'Estructura Finca Zonas' },
  { file: 'anim/anim-02.png', nav: '#/zonas', name: 'Zonas listado' },
  { file: 'anim/anim-03.png', nav: '#/rebanos', name: 'Rebaños listado' },
  { file: 'anim/anim-04.png', nav: '#/rebanos', name: 'Nuevo Rebaño' },
  { file: 'anim/anim-05.png', nav: '#/animales', name: 'Animales en Rebaño' },
  { file: 'anim/anim-06.png', nav: '#/animales', name: 'Nuevo Animal paso 1' },
  { file: 'anim/anim-07.png', nav: '#/animales', name: 'Nuevo Animal paso 2' },
  { file: 'anim/anim-08.png', nav: '#/animales', name: 'Escáner de Crotal' },
  { file: 'anim/anim-09.png', nav: '#/animales', name: 'Vaca1 detalle' },
  { file: 'anim/anim-10.png', nav: '#/animales', name: 'Vinculación Madre-Cría' },
  { file: 'anim/anim-11.png', nav: '#/animales', name: 'KPIs Animales' },

  // Contratos (3)
  { file: 'contr/contr-01.png', nav: '#/compradores', name: 'Contratos panel' },
  { file: 'contr/contr-02.png', nav: '#/compradores', name: 'Nuevo Contrato' },
  { file: 'contr/contr-03.png', nav: '#/compradores', name: 'Tabla de Precios' },

  // Sanitarios (5)
  { file: 'san/san-01.png', nav: '#/rebanos', name: 'Listado Sanitarios' },
  { file: 'san/san-02.png', nav: '#/rebanos', name: 'Nuevo Sanitario' },
  { file: 'san/san-03.png', nav: '#/rebanos', name: 'Tipos de Tratamiento' },
  { file: 'san/san-04.png', nav: '#/rebanos', name: 'Registro con Alerta' },
  { file: 'san/san-05.png', nav: '#/rebanos', name: 'Historial Sanitario' },

  // Reproducción (5)
  { file: 'rep/rep-01.png', nav: '#/animales', name: 'Línea temporal eventos' },
  { file: 'rep/rep-02.png', nav: '#/animales', name: 'Nuevo Evento' },
  { file: 'rep/rep-03.png', nav: '#/animales', name: 'Tipos de Evento' },
  { file: 'rep/rep-04.png', nav: '#/animales', name: 'Ciclo Completo vaca1' },
  { file: 'rep/rep-05.png', nav: '#/animales', name: 'Genealogía' }
];

async function captureScreenshots() {
  console.log('🚀 Iniciando captura de 35 screenshots...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 1024 }
  });

  try {
    const page = await browser.newPage();

    // Ir a la aplicación
    console.log('📱 Navegando a ' + BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Cargar demo
    console.log('📦 Cargando demo CHAMORRO...');
    await page.evaluate(() => {
      if (window.SeedData && window.SeedData.run) {
        return window.SeedData.run();
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capturar screenshots
    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i];
      const filePath = path.join(SCREENSHOTS_DIR, ss.file);

      console.log(`[${i + 1}/${screenshots.length}] ${ss.name}...`);

      // Navegar
      await page.goto(BASE_URL + ss.nav, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 500));

      // Capturar
      await page.screenshot({
        path: filePath,
        fullPage: false
      });

      console.log(`   ✅ Guardado: ${ss.file}`);
    }

    console.log('\n✅ Captura completada!');
    console.log(`📁 Imágenes guardadas en: www/manual/img/`);
    console.log(`📊 Total: ${screenshots.length} screenshots`);

  } catch (error) {
    console.error('❌ Error durante la captura:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
