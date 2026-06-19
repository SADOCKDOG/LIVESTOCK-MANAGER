/**
 * Captura Screenshots desde Dispositivo Android
 * Conecta vía ADB al navegador del teléfono
 *
 * Requisitos:
 * 1. ADB instalado (Android SDK)
 * 2. Dispositivo conectado via USB con debugging habilitado
 * 3. npm install chrome-remote-interface
 *
 * Uso: node scripts/capture-from-device.js
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

const screenshots = [
  // Compradores (8)
  { file: 'compr/compr-01.png', nav: '#/compradores', name: 'Acceso a Compradores' },
  { file: 'compr/compr-02.png', nav: '#/compradores', action: 'scroll', name: 'Nuevo Comprador paso 1' },
  { file: 'compr/compr-03.png', nav: '#/compradores', action: 'scroll', name: 'Nuevo Comprador paso 2' },
  { file: 'compr/compr-04.png', nav: '#/compradores', action: 'detail', name: 'Cárnicas Extremeñas' },
  { file: 'compr/compr-05.png', nav: '#/compradores', action: 'history', name: 'Historial Ventas' },
  { file: 'compr/compr-06.png', nav: '#/compradores', action: 'scroll', name: 'Lácteos La Serena' },
  { file: 'compr/compr-07.png', nav: '#/compradores', action: 'contracts', name: 'Contratos' },
  { file: 'compr/compr-08.png', nav: '#/compradores', action: 'kpis', name: 'KPIs' },

  // Proveedores (8)
  { file: 'prov/prov-01.png', nav: '#/proveedores', name: 'Acceso a Proveedores' },
  { file: 'prov/prov-02.png', nav: '#/proveedores', action: 'scroll', name: 'Nuevo Proveedor' },
  { file: 'prov/prov-03.png', nav: '#/proveedores', action: 'scroll', name: 'Categorías' },
  { file: 'prov/prov-04.png', nav: '#/proveedores', action: 'detail', name: 'Piensos El Trébol' },
  { file: 'prov/prov-05.png', nav: '#/proveedores', action: 'expenses', name: 'Gastos' },
  { file: 'prov/prov-06.png', nav: '#/proveedores', action: 'detail2', name: 'VetPlus' },
  { file: 'prov/prov-07.png', nav: '#/proveedores', action: 'detail3', name: 'Maquinaria' },
  { file: 'prov/prov-08.png', nav: '#/proveedores', action: 'kpis', name: 'KPIs' },

  // Transportistas (8)
  { file: 'trans/trans-01.png', nav: '#/transportistas', name: 'Acceso a Transportistas' },
  { file: 'trans/trans-02.png', nav: '#/transportistas', action: 'scroll', name: 'Nuevo Transportista' },
  { file: 'trans/trans-03.png', nav: '#/transportistas', action: 'form', name: 'Tipo Vehículo' },
  { file: 'trans/trans-04.png', nav: '#/transportistas', action: 'form', name: 'Certificado' },
  { file: 'trans/trans-05.png', nav: '#/transportistas', action: 'detail', name: 'Transporte Ganaderos' },
  { file: 'trans/trans-06.png', nav: '#/transportistas', action: 'detail2', name: 'Logística Láctea' },
  { file: 'trans/trans-07.png', nav: '#/transportistas', action: 'detail', name: 'KPIs detalle' },
  { file: 'trans/trans-08.png', nav: '#/transportistas', action: 'kpis', name: 'KPIs listado' },

  // Animales (11)
  { file: 'anim/anim-01.png', nav: '#/estructura', name: 'Estructura Zonas' },
  { file: 'anim/anim-02.png', nav: '#/zonas', name: 'Listado Zonas' },
  { file: 'anim/anim-03.png', nav: '#/rebanos', name: 'Listado Rebaños' },
  { file: 'anim/anim-04.png', nav: '#/rebanos', action: 'form', name: 'Nuevo Rebaño' },
  { file: 'anim/anim-05.png', nav: '#/animales', name: 'Animales' },
  { file: 'anim/anim-06.png', nav: '#/animales', action: 'form1', name: 'Nuevo Animal 1' },
  { file: 'anim/anim-07.png', nav: '#/animales', action: 'form2', name: 'Nuevo Animal 2' },
  { file: 'anim/anim-08.png', nav: '#/animales', action: 'scanner', name: 'Scanner' },
  { file: 'anim/anim-09.png', nav: '#/animales', action: 'detail', name: 'Detalle Animal' },
  { file: 'anim/anim-10.png', nav: '#/animales', action: 'genealogy', name: 'Genealogía' },
  { file: 'anim/anim-11.png', nav: '#/animales', action: 'kpis', name: 'KPIs' },

  // Contratos (3)
  { file: 'contr/contr-01.png', nav: '#/compradores', action: 'contracts', name: 'Panel Contratos' },
  { file: 'contr/contr-02.png', nav: '#/compradores', action: 'form', name: 'Nuevo Contrato' },
  { file: 'contr/contr-03.png', nav: '#/compradores', action: 'prices', name: 'Precios' },

  // Sanitarios (5)
  { file: 'san/san-01.png', nav: '#/rebanos', action: 'health', name: 'Sanitarios' },
  { file: 'san/san-02.png', nav: '#/rebanos', action: 'form', name: 'Nuevo Sanitario' },
  { file: 'san/san-03.png', nav: '#/rebanos', action: 'form', name: 'Tipos' },
  { file: 'san/san-04.png', nav: '#/rebanos', action: 'alert', name: 'Alerta' },
  { file: 'san/san-05.png', nav: '#/rebanos', action: 'history', name: 'Historial' },

  // Reproducción (5)
  { file: 'rep/rep-01.png', nav: '#/animales', action: 'repro', name: 'Línea Temporal' },
  { file: 'rep/rep-02.png', nav: '#/animales', action: 'form', name: 'Nuevo Evento' },
  { file: 'rep/rep-03.png', nav: '#/animales', action: 'form', name: 'Tipos Evento' },
  { file: 'rep/rep-04.png', nav: '#/animales', action: 'cycle', name: 'Ciclo Completo' },
  { file: 'rep/rep-05.png', nav: '#/animales', action: 'genealogy', name: 'Árbol' }
];

async function captureFromDevice() {
  console.log('📱 Conectando al navegador del dispositivo...\n');

  // Configurar ADB port forwarding
  try {
    console.log('🔌 Configurando ADB port forwarding...');
    execSync('adb forward tcp:9222 localabstract:chrome_devtools_remote');
  } catch (e) {
    console.error('❌ Error: Asegúrate de que ADB está instalado y el dispositivo está conectado');
    console.error('   Pasos:');
    console.error('   1. Conecta el dispositivo via USB');
    console.error('   2. Habilita "Debugging USB" en Opciones de Desarrollador');
    console.error('   3. Instala Android SDK (adb)');
    process.exit(1);
  }

  try {
    // Conectar vía CDP
    const client = await CDP({ port: 9222 });

    const { Network, Page } = client;

    await Network.enable();
    await Page.enable();

    console.log('✅ Conectado al navegador del dispositivo!\n');

    // Capturar screenshots
    for (let i = 0; i < screenshots.length; i++) {
      const ss = screenshots[i];
      const filePath = path.join(SCREENSHOTS_DIR, ss.file);

      console.log(`[${i + 1}/${screenshots.length}] ${ss.name}`);

      try {
        // Navegar
        await Page.navigate({ url: 'http://localhost/index.html' + ss.nav });
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Capturar
        const { data } = await Page.captureScreenshot({ format: 'png' });
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, buffer);

        console.log(`   ✅ ${ss.file}`);
      } catch (e) {
        console.log(`   ⚠️  Error: ${e.message}`);
      }
    }

    console.log('\n✅ Captura completada!');
    console.log(`📁 Imágenes guardadas en: www/manual/img/`);
    console.log(`📊 Total: ${screenshots.length} screenshots`);

    await client.close();

  } catch (error) {
    console.error('❌ Error de conexión CDP:', error.message);
    console.error('\nVerifica:');
    console.error('- ADB está instalado: adb --version');
    console.error('- Dispositivo conectado: adb devices');
    console.error('- Chrome/navegador en el dispositivo está abierto');
    process.exit(1);
  }
}

captureFromDevice();
