/**
 * Captura desde la app ya cargada en Chrome
 * Verifica que la demo está lista y captura navegando por cada ruta
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

const dirs = ['compr', 'prov', 'trans', 'anim', 'contr', 'san', 'rep'];
dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const screenshots = [
  { file: 'compr/compr-01.png', path: '/compradores', name: 'Compradores' },
  { file: 'compr/compr-02.png', path: '/compradores', name: 'Nuevo Comprador' },
  { file: 'compr/compr-03.png', path: '/compradores', name: 'Formulario' },
  { file: 'compr/compr-04.png', path: '/compradores', name: 'Detalle' },
  { file: 'compr/compr-05.png', path: '/compradores', name: 'Historial Ventas' },
  { file: 'compr/compr-06.png', path: '/compradores', name: 'Lácteos La Serena' },
  { file: 'compr/compr-07.png', path: '/compradores', name: 'Contratos' },
  { file: 'compr/compr-08.png', path: '/compradores', name: 'KPIs' },
  { file: 'prov/prov-01.png', path: '/proveedores', name: 'Proveedores' },
  { file: 'prov/prov-02.png', path: '/proveedores', name: 'Nuevo Proveedor' },
  { file: 'prov/prov-03.png', path: '/proveedores', name: 'Categorías' },
  { file: 'prov/prov-04.png', path: '/proveedores', name: 'Piensos El Trébol' },
  { file: 'prov/prov-05.png', path: '/proveedores', name: 'Gastos' },
  { file: 'prov/prov-06.png', path: '/proveedores', name: 'VetPlus' },
  { file: 'prov/prov-07.png', path: '/proveedores', name: 'Maquinaria' },
  { file: 'prov/prov-08.png', path: '/proveedores', name: 'KPIs' },
  { file: 'trans/trans-01.png', path: '/transportistas', name: 'Transportistas' },
  { file: 'trans/trans-02.png', path: '/transportistas', name: 'Nuevo Transportista' },
  { file: 'trans/trans-03.png', path: '/transportistas', name: 'Tipo Vehículo' },
  { file: 'trans/trans-04.png', path: '/transportistas', name: 'Certificado' },
  { file: 'trans/trans-05.png', path: '/transportistas', name: 'Transporte Ganaderos' },
  { file: 'trans/trans-06.png', path: '/transportistas', name: 'Logística Láctea' },
  { file: 'trans/trans-07.png', path: '/transportistas', name: 'KPIs detalle' },
  { file: 'trans/trans-08.png', path: '/transportistas', name: 'KPIs listado' },
  { file: 'anim/anim-01.png', path: '/estructura', name: 'Estructura' },
  { file: 'anim/anim-02.png', path: '/zonas', name: 'Zonas' },
  { file: 'anim/anim-03.png', path: '/rebanos', name: 'Rebaños' },
  { file: 'anim/anim-04.png', path: '/rebanos', name: 'Nuevo Rebaño' },
  { file: 'anim/anim-05.png', path: '/animales', name: 'Animales' },
  { file: 'anim/anim-06.png', path: '/animales', name: 'Nuevo Animal 1' },
  { file: 'anim/anim-07.png', path: '/animales', name: 'Nuevo Animal 2' },
  { file: 'anim/anim-08.png', path: '/animales', name: 'Escáner' },
  { file: 'anim/anim-09.png', path: '/animales', name: 'Detalle Animal' },
  { file: 'anim/anim-10.png', path: '/animales', name: 'Genealogía' },
  { file: 'anim/anim-11.png', path: '/animales', name: 'KPIs' },
  { file: 'contr/contr-01.png', path: '/compradores', name: 'Contratos' },
  { file: 'contr/contr-02.png', path: '/compradores', name: 'Nuevo Contrato' },
  { file: 'contr/contr-03.png', path: '/compradores', name: 'Precios' },
  { file: 'san/san-01.png', path: '/rebanos', name: 'Sanitarios' },
  { file: 'san/san-02.png', path: '/rebanos', name: 'Nuevo Sanitario' },
  { file: 'san/san-03.png', path: '/rebanos', name: 'Tipos' },
  { file: 'san/san-04.png', path: '/rebanos', name: 'Alerta' },
  { file: 'san/san-05.png', path: '/rebanos', name: 'Historial' },
  { file: 'rep/rep-01.png', path: '/animales', name: 'Reproducción' },
  { file: 'rep/rep-02.png', path: '/animales', name: 'Nuevo Evento' },
  { file: 'rep/rep-03.png', path: '/animales', name: 'Tipos Evento' },
  { file: 'rep/rep-04.png', path: '/animales', name: 'Ciclo Completo' },
  { file: 'rep/rep-05.png', path: '/animales', name: 'Genealogía' }
];

async function captureScreenshots() {
  console.log('🚀 Captura desde app LIVE\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 1024 }
  });

  try {
    const page = await browser.newPage();

    console.log('📱 Conectando a app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Verificar que la demo está cargada
    console.log('✓ Verificando demo...');
    const demoLoaded = await page.waitForSelector('body', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!demoLoaded) {
      throw new Error('Demo no cargó correctamente');
    }

    console.log('✅ Demo detectada\n📷 Capturando:\n');

    let successful = 0;
    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i];
      const filePath = path.join(SCREENSHOTS_DIR, ss.file);

      process.stdout.write(`[${String(i + 1).padStart(2)}/48] ${ss.name.padEnd(25)} `);

      try {
        // Navegar directamente a la ruta
        await page.goto(BASE_URL + ss.path, {
          waitUntil: 'networkidle0',
          timeout: 8000
        });

        // Esperar a que Vue renderice
        await new Promise(r => setTimeout(r, 600));

        // Capturar
        await page.screenshot({
          path: filePath,
          fullPage: false
        });

        console.log('✅');
        successful++;
      } catch (e) {
        console.log(`❌`);
      }

      if (i < screenshots.length - 1) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    console.log(`\n✅ Completado: ${successful}/48\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
