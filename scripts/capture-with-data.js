/**
 * Captura Screenshots con Datos desde Dispositivo Android
 * Introduce datos mientras captura pantallas para manuales realistas
 *
 * Requisitos:
 * 1. ADB instalado (Android SDK)
 * 2. Dispositivo conectado via USB con debugging habilitado
 * 3. npm install chrome-remote-interface
 *
 * Uso: node scripts/capture-with-data.js
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

// Crear directorios
const dirs = ['compr', 'prov', 'trans', 'anim', 'contr', 'san', 'rep'];
dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Plan de capturas con datos
const captureSequence = [
  // COMPRADORES
  {
    name: 'Acceso a Compradores',
    file: 'compr/compr-01.png',
    nav: '#/compradores',
    delay: 1500,
    actions: []
  },
  {
    name: 'Nuevo Comprador - Paso 1',
    file: 'compr/compr-02.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-comprador"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Nuevo Comprador - Paso 2',
    file: 'compr/compr-03.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-comprador"]' },
      { type: 'fill', selector: '[data-test="nombre"]', value: 'Nueva Cárnica Test' },
      { type: 'fill', selector: '[data-test="nif"]', value: 'B12345678' },
      { type: 'wait', ms: 300 }
    ]
  },
  {
    name: 'Cárnicas Extremeñas - Detalle',
    file: 'compr/compr-04.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-comprador-name="Cárnicas Extremeñas SL"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'Historial de Ventas',
    file: 'compr/compr-05.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-comprador-name="Cárnicas Extremeñas SL"]' },
      { type: 'scroll', ms: 1000 },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Lácteos La Serena - Detalle',
    file: 'compr/compr-06.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-comprador-name="Lácteos La Serena SA"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'Contratos',
    file: 'compr/compr-07.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-comprador-name="Cárnicas Extremeñas SL"]' },
      { type: 'scroll', ms: 2000 },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'KPIs Compradores',
    file: 'compr/compr-08.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'scroll', direction: 'up', ms: 2000 },
      { type: 'wait', ms: 500 }
    ]
  },

  // PROVEEDORES
  {
    name: 'Acceso a Proveedores',
    file: 'prov/prov-01.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: []
  },
  {
    name: 'Nuevo Proveedor - Paso 1',
    file: 'prov/prov-02.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-proveedor"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Nuevo Proveedor - Categorías',
    file: 'prov/prov-03.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-proveedor"]' },
      { type: 'scroll', ms: 800 },
      { type: 'wait', ms: 300 }
    ]
  },
  {
    name: 'Piensos El Trébol - Detalle',
    file: 'prov/prov-04.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-proveedor-name="Piensos El Trébol SA"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'Historial de Gastos',
    file: 'prov/prov-05.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-proveedor-name="Piensos El Trébol SA"]' },
      { type: 'scroll', ms: 1000 },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'VetPlus - Detalle',
    file: 'prov/prov-06.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-proveedor-name="Farmacia Veterinaria VetPlus"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'Maquinaria La Vega - Detalle',
    file: 'prov/prov-07.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-proveedor-name="Maquinaria Agrícola La Vega"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'KPIs Proveedores',
    file: 'prov/prov-08.png',
    nav: '#/proveedores',
    delay: 1500,
    actions: [
      { type: 'scroll', direction: 'up', ms: 2000 },
      { type: 'wait', ms: 500 }
    ]
  },

  // TRANSPORTISTAS
  {
    name: 'Acceso a Transportistas',
    file: 'trans/trans-01.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: []
  },
  {
    name: 'Nuevo Transportista',
    file: 'trans/trans-02.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-transportista"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Tipo Vehículo - Select',
    file: 'trans/trans-03.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-transportista"]' },
      { type: 'click', selector: '[data-test="tipo-vehiculo"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Certificado Bienestar',
    file: 'trans/trans-04.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-transportista"]' },
      { type: 'scroll', ms: 800 },
      { type: 'wait', ms: 300 }
    ]
  },
  {
    name: 'Transporte Ganaderos - Detalle',
    file: 'trans/trans-05.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-transportista-name="Transportes Ganaderos del Sur SL"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'Logística Láctea - Detalle',
    file: 'trans/trans-06.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-transportista-name="Logística Láctea Extremeña"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'KPIs Detalle',
    file: 'trans/trans-07.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: [
      { type: 'scroll', direction: 'up', ms: 1000 },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'KPIs Listado',
    file: 'trans/trans-08.png',
    nav: '#/transportistas',
    delay: 1500,
    actions: [
      { type: 'scroll', direction: 'up', ms: 2000 },
      { type: 'wait', ms: 500 }
    ]
  },

  // ANIMALES Y REBAÑOS
  {
    name: 'Estructura - Zonas',
    file: 'anim/anim-01.png',
    nav: '#/estructura',
    delay: 1500,
    actions: []
  },
  {
    name: 'Listado Zonas',
    file: 'anim/anim-02.png',
    nav: '#/zonas',
    delay: 1500,
    actions: []
  },
  {
    name: 'Listado Rebaños',
    file: 'anim/anim-03.png',
    nav: '#/rebanos',
    delay: 1500,
    actions: []
  },
  {
    name: 'Nuevo Rebaño',
    file: 'anim/anim-04.png',
    nav: '#/rebanos',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-rebano"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Animales en Rebaño',
    file: 'anim/anim-05.png',
    nav: '#/animales',
    delay: 1500,
    actions: []
  },
  {
    name: 'Nuevo Animal - Paso 1',
    file: 'anim/anim-06.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-animal"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Nuevo Animal - Paso 2',
    file: 'anim/anim-07.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-nuevo-animal"]' },
      { type: 'scroll', ms: 800 },
      { type: 'wait', ms: 300 }
    ]
  },
  {
    name: 'Escáner de Crotal',
    file: 'anim/anim-08.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-test="btn-scanner"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'Detalle Animal',
    file: 'anim/anim-09.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-animal-name="Vaca1"]' },
      { type: 'wait', ms: 800 }
    ]
  },
  {
    name: 'Vinculación Madre-Cría',
    file: 'anim/anim-10.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-animal-name="Ternero1"]' },
      { type: 'scroll', ms: 1000 },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'KPIs Animales',
    file: 'anim/anim-11.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'scroll', direction: 'up', ms: 2000 },
      { type: 'wait', ms: 500 }
    ]
  },

  // CONTRATOS (3)
  {
    name: 'Panel Contratos',
    file: 'contr/contr-01.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-comprador-name="Cárnicas Extremeñas SL"]' },
      { type: 'scroll', ms: 1500 },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Nuevo Contrato',
    file: 'contr/contr-02.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-comprador-name="Cárnicas Extremeñas SL"]' },
      { type: 'click', selector: '[data-test="btn-nuevo-contrato"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Tabla de Precios',
    file: 'contr/contr-03.png',
    nav: '#/compradores',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-comprador-name="Cárnicas Extremeñas SL"]' },
      { type: 'click', selector: '[data-contrato="CT-2026-001"]' },
      { type: 'scroll', ms: 1000 },
      { type: 'wait', ms: 500 }
    ]
  },

  // SANITARIOS (5)
  {
    name: 'Listado Sanitarios',
    file: 'san/san-01.png',
    nav: '#/rebanos',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-rebano-name="Vacas Frisonas"]' },
      { type: 'click', selector: '[data-tab="sanitarios"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Nuevo Sanitario',
    file: 'san/san-02.png',
    nav: '#/rebanos',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-rebano-name="Vacas Frisonas"]' },
      { type: 'click', selector: '[data-tab="sanitarios"]' },
      { type: 'click', selector: '[data-test="btn-nuevo-sanitario"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Tipos de Tratamiento',
    file: 'san/san-03.png',
    nav: '#/rebanos',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-rebano-name="Vacas Frisonas"]' },
      { type: 'click', selector: '[data-tab="sanitarios"]' },
      { type: 'click', selector: '[data-test="btn-nuevo-sanitario"]' },
      { type: 'click', selector: '[data-test="tipo-tratamiento"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Registro con Alerta',
    file: 'san/san-04.png',
    nav: '#/rebanos',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-rebano-name="Vacas Frisonas"]' },
      { type: 'click', selector: '[data-tab="sanitarios"]' },
      { type: 'scroll', ms: 800 },
      { type: 'wait', ms: 300 }
    ]
  },
  {
    name: 'Historial Sanitario',
    file: 'san/san-05.png',
    nav: '#/rebanos',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-rebano-name="Vacas Frisonas"]' },
      { type: 'click', selector: '[data-tab="sanitarios"]' },
      { type: 'scroll', direction: 'up', ms: 1000 },
      { type: 'wait', ms: 500 }
    ]
  },

  // REPRODUCCIÓN (5)
  {
    name: 'Línea Temporal',
    file: 'rep/rep-01.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-animal-name="Vaca1"]' },
      { type: 'click', selector: '[data-tab="reproduccion"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Nuevo Evento',
    file: 'rep/rep-02.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-animal-name="Vaca1"]' },
      { type: 'click', selector: '[data-tab="reproduccion"]' },
      { type: 'click', selector: '[data-test="btn-nuevo-evento"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Tipos de Evento',
    file: 'rep/rep-03.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-animal-name="Vaca1"]' },
      { type: 'click', selector: '[data-tab="reproduccion"]' },
      { type: 'click', selector: '[data-test="btn-nuevo-evento"]' },
      { type: 'click', selector: '[data-test="tipo-evento"]' },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Ciclo Completo',
    file: 'rep/rep-04.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-animal-name="Vaca1"]' },
      { type: 'click', selector: '[data-tab="reproduccion"]' },
      { type: 'scroll', ms: 1000 },
      { type: 'wait', ms: 500 }
    ]
  },
  {
    name: 'Árbol Genealógico',
    file: 'rep/rep-05.png',
    nav: '#/animales',
    delay: 1500,
    actions: [
      { type: 'click', selector: '[data-animal-name="Vaca1"]' },
      { type: 'scroll', ms: 2000 },
      { type: 'wait', ms: 500 }
    ]
  }
];

async function executeActions(Page, actions) {
  for (const action of actions) {
    if (action.type === 'click') {
      await Page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (el) el.click();
      }, action.selector);
    } else if (action.type === 'fill') {
      await Page.evaluate((selector, value) => {
        const el = document.querySelector(selector);
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, action.selector, action.value);
    } else if (action.type === 'scroll') {
      await Page.evaluate((ms) => {
        window.scrollBy(0, 500);
      }, action.ms);
    } else if (action.type === 'wait') {
      await new Promise(r => setTimeout(r, action.ms));
    }
  }
}

async function captureWithData() {
  console.log('📱 Conectando al navegador del dispositivo...\n');

  // Configurar ADB port forwarding
  try {
    console.log('🔌 Configurando ADB port forwarding...');
    execSync('adb forward tcp:9222 localabstract:chrome_devtools_remote');
  } catch (e) {
    console.error('❌ Error: Asegúrate de que ADB está instalado y el dispositivo está conectado');
    process.exit(1);
  }

  try {
    const client = await CDP({ port: 9222 });
    const { Network, Page } = client;

    await Network.enable();
    await Page.enable();

    console.log('✅ Conectado!\n');

    // Capturar secuencia
    for (let i = 0; i < captureSequence.length; i++) {
      const seq = captureSequence[i];
      const filePath = path.join(SCREENSHOTS_DIR, seq.file);

      console.log(`[${i + 1}/${captureSequence.length}] ${seq.name}`);

      try {
        // Navegar
        await Page.navigate({ url: 'http://localhost' + seq.nav });
        await new Promise(r => setTimeout(r, seq.delay));

        // Ejecutar acciones
        if (seq.actions.length > 0) {
          await executeActions(Page, seq.actions);
        }

        // Capturar
        const { data } = await Page.captureScreenshot({ format: 'png' });
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, buffer);

        console.log(`   ✅ ${seq.file}`);
      } catch (e) {
        console.log(`   ⚠️  ${e.message}`);
      }
    }

    console.log('\n✅ Captura completada!');
    console.log(`📁 Imágenes: www/manual/img/`);
    console.log(`📊 Total: ${captureSequence.length} screenshots\n`);

    await client.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

captureWithData();
