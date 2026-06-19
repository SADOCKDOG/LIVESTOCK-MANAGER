/**
 * Captura Final - Usando JavaScript para navegar las rutas
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
  { file: 'compr/compr-01.png', hash: '#/compradores', name: 'Compradores' },
  { file: 'compr/compr-02.png', hash: '#/compradores', name: 'Nuevo Comprador' },
  { file: 'compr/compr-03.png', hash: '#/compradores', name: 'Formulario' },
  { file: 'compr/compr-04.png', hash: '#/compradores', name: 'Detalle' },
  { file: 'compr/compr-05.png', hash: '#/compradores', name: 'Historial Ventas' },
  { file: 'compr/compr-06.png', hash: '#/compradores', name: 'Lácteos La Serena' },
  { file: 'compr/compr-07.png', hash: '#/compradores', name: 'Contratos' },
  { file: 'compr/compr-08.png', hash: '#/compradores', name: 'KPIs' },

  // Proveedores (8)
  { file: 'prov/prov-01.png', hash: '#/proveedores', name: 'Proveedores' },
  { file: 'prov/prov-02.png', hash: '#/proveedores', name: 'Nuevo Proveedor' },
  { file: 'prov/prov-03.png', hash: '#/proveedores', name: 'Categorías' },
  { file: 'prov/prov-04.png', hash: '#/proveedores', name: 'Piensos El Trébol' },
  { file: 'prov/prov-05.png', hash: '#/proveedores', name: 'Gastos' },
  { file: 'prov/prov-06.png', hash: '#/proveedores', name: 'VetPlus' },
  { file: 'prov/prov-07.png', hash: '#/proveedores', name: 'Maquinaria' },
  { file: 'prov/prov-08.png', hash: '#/proveedores', name: 'KPIs' },

  // Transportistas (8)
  { file: 'trans/trans-01.png', hash: '#/transportistas', name: 'Transportistas' },
  { file: 'trans/trans-02.png', hash: '#/transportistas', name: 'Nuevo Transportista' },
  { file: 'trans/trans-03.png', hash: '#/transportistas', name: 'Tipo Vehículo' },
  { file: 'trans/trans-04.png', hash: '#/transportistas', name: 'Certificado' },
  { file: 'trans/trans-05.png', hash: '#/transportistas', name: 'Transporte Ganaderos' },
  { file: 'trans/trans-06.png', hash: '#/transportistas', name: 'Logística Láctea' },
  { file: 'trans/trans-07.png', hash: '#/transportistas', name: 'KPIs detalle' },
  { file: 'trans/trans-08.png', hash: '#/transportistas', name: 'KPIs listado' },

  // Animales (11)
  { file: 'anim/anim-01.png', hash: '#/estructura', name: 'Estructura' },
  { file: 'anim/anim-02.png', hash: '#/zonas', name: 'Zonas' },
  { file: 'anim/anim-03.png', hash: '#/rebanos', name: 'Rebaños' },
  { file: 'anim/anim-04.png', hash: '#/rebanos', name: 'Nuevo Rebaño' },
  { file: 'anim/anim-05.png', hash: '#/animales', name: 'Animales' },
  { file: 'anim/anim-06.png', hash: '#/animales', name: 'Nuevo Animal 1' },
  { file: 'anim/anim-07.png', hash: '#/animales', name: 'Nuevo Animal 2' },
  { file: 'anim/anim-08.png', hash: '#/animales', name: 'Escáner' },
  { file: 'anim/anim-09.png', hash: '#/animales', name: 'Detalle Animal' },
  { file: 'anim/anim-10.png', hash: '#/animales', name: 'Genealogía' },
  { file: 'anim/anim-11.png', hash: '#/animales', name: 'KPIs' },

  // Contratos (3)
  { file: 'contr/contr-01.png', hash: '#/compradores', name: 'Contratos' },
  { file: 'contr/contr-02.png', hash: '#/compradores', name: 'Nuevo Contrato' },
  { file: 'contr/contr-03.png', hash: '#/compradores', name: 'Precios' },

  // Sanitarios (5)
  { file: 'san/san-01.png', hash: '#/rebanos', name: 'Sanitarios' },
  { file: 'san/san-02.png', hash: '#/rebanos', name: 'Nuevo Sanitario' },
  { file: 'san/san-03.png', hash: '#/rebanos', name: 'Tipos' },
  { file: 'san/san-04.png', hash: '#/rebanos', name: 'Alerta' },
  { file: 'san/san-05.png', hash: '#/rebanos', name: 'Historial' },

  // Reproducción (5)
  { file: 'rep/rep-01.png', hash: '#/animales', name: 'Reproducción' },
  { file: 'rep/rep-02.png', hash: '#/animales', name: 'Nuevo Evento' },
  { file: 'rep/rep-03.png', hash: '#/animales', name: 'Tipos Evento' },
  { file: 'rep/rep-04.png', hash: '#/animales', name: 'Ciclo Completo' },
  { file: 'rep/rep-05.png', hash: '#/animales', name: 'Genealogía' }
];

async function captureScreenshots() {
  console.log('🚀 Captura Final (48 screenshots)...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 1024 }
  });

  try {
    const page = await browser.newPage();

    // Cargar una sola vez
    console.log('📱 Cargando aplicación...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Cargar demo
    console.log('📦 Cargando demo...');
    await page.evaluate(() => {
      if (window.SeedData && window.SeedData.run) {
        window.SeedData.run();
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log('✅ Listo\n📷 Capturando:\n');

    // Capturar
    let successful = 0;
    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i];
      const filePath = path.join(SCREENSHOTS_DIR, ss.file);

      process.stdout.write(`[${String(i + 1).padStart(2)}/48] ${ss.name.padEnd(25)} `);

      try {
        // Cambiar hash usando JavaScript
        await page.evaluate((hash) => {
          window.location.hash = hash;
        }, ss.hash);

        // Esperar a que la vista cambie
        await new Promise(r => setTimeout(r, 800));

        // Capturar
        await page.screenshot({
          path: filePath,
          fullPage: false
        });

        console.log('✅');
        successful++;
      } catch (e) {
        console.log(`❌ ${e.message.substring(0, 30)}`);
      }

      if (i < screenshots.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`\n✅ Completado: ${successful}/48`);
    console.log(`📁 Guardados en www/manual/img/\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
