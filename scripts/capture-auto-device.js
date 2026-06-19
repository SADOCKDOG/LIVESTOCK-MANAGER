#!/usr/bin/env node
/**
 * Captura Screenshots - Detecta dispositivo automáticamente
 * Usa CDP vía ADB con reintentos automáticos
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

// Secuencia simplificada
const captureSequence = [
  { file: 'compr/compr-01.png', nav: '#/compradores', name: 'Compradores' },
  { file: 'compr/compr-02.png', nav: '#/compradores', name: 'Nuevo Comprador' },
  { file: 'compr/compr-03.png', nav: '#/compradores', name: 'Formulario' },
  { file: 'compr/compr-04.png', nav: '#/compradores', name: 'Detalle' },
  { file: 'compr/compr-05.png', nav: '#/compradores', name: 'Historial' },
  { file: 'compr/compr-06.png', nav: '#/compradores', name: 'Lácteos' },
  { file: 'compr/compr-07.png', nav: '#/compradores', name: 'Contratos' },
  { file: 'compr/compr-08.png', nav: '#/compradores', name: 'KPIs' },

  { file: 'prov/prov-01.png', nav: '#/proveedores', name: 'Proveedores' },
  { file: 'prov/prov-02.png', nav: '#/proveedores', name: 'Nuevo Proveedor' },
  { file: 'prov/prov-03.png', nav: '#/proveedores', name: 'Categorías' },
  { file: 'prov/prov-04.png', nav: '#/proveedores', name: 'Piensos El Trébol' },
  { file: 'prov/prov-05.png', nav: '#/proveedores', name: 'Gastos' },
  { file: 'prov/prov-06.png', nav: '#/proveedores', name: 'VetPlus' },
  { file: 'prov/prov-07.png', nav: '#/proveedores', name: 'Maquinaria' },
  { file: 'prov/prov-08.png', nav: '#/proveedores', name: 'KPIs' },

  { file: 'trans/trans-01.png', nav: '#/transportistas', name: 'Transportistas' },
  { file: 'trans/trans-02.png', nav: '#/transportistas', name: 'Nuevo Transportista' },
  { file: 'trans/trans-03.png', nav: '#/transportistas', name: 'Tipo Vehículo' },
  { file: 'trans/trans-04.png', nav: '#/transportistas', name: 'Certificado' },
  { file: 'trans/trans-05.png', nav: '#/transportistas', name: 'Transporte Ganaderos' },
  { file: 'trans/trans-06.png', nav: '#/transportistas', name: 'Logística Láctea' },
  { file: 'trans/trans-07.png', nav: '#/transportistas', name: 'KPIs detalle' },
  { file: 'trans/trans-08.png', nav: '#/transportistas', name: 'KPIs listado' },

  { file: 'anim/anim-01.png', nav: '#/estructura', name: 'Estructura' },
  { file: 'anim/anim-02.png', nav: '#/zonas', name: 'Zonas' },
  { file: 'anim/anim-03.png', nav: '#/rebanos', name: 'Rebaños' },
  { file: 'anim/anim-04.png', nav: '#/rebanos', name: 'Nuevo Rebaño' },
  { file: 'anim/anim-05.png', nav: '#/animales', name: 'Animales' },
  { file: 'anim/anim-06.png', nav: '#/animales', name: 'Nuevo Animal 1' },
  { file: 'anim/anim-07.png', nav: '#/animales', name: 'Nuevo Animal 2' },
  { file: 'anim/anim-08.png', nav: '#/animales', name: 'Escáner' },
  { file: 'anim/anim-09.png', nav: '#/animales', name: 'Detalle Animal' },
  { file: 'anim/anim-10.png', nav: '#/animales', name: 'Genealogía' },
  { file: 'anim/anim-11.png', nav: '#/animales', name: 'KPIs' },

  { file: 'contr/contr-01.png', nav: '#/compradores', name: 'Contratos' },
  { file: 'contr/contr-02.png', nav: '#/compradores', name: 'Nuevo Contrato' },
  { file: 'contr/contr-03.png', nav: '#/compradores', name: 'Precios' },

  { file: 'san/san-01.png', nav: '#/rebanos', name: 'Sanitarios' },
  { file: 'san/san-02.png', nav: '#/rebanos', name: 'Nuevo Sanitario' },
  { file: 'san/san-03.png', nav: '#/rebanos', name: 'Tipos Tratamiento' },
  { file: 'san/san-04.png', nav: '#/rebanos', name: 'Alerta' },
  { file: 'san/san-05.png', nav: '#/rebanos', name: 'Historial' },

  { file: 'rep/rep-01.png', nav: '#/animales', name: 'Reproducción' },
  { file: 'rep/rep-02.png', nav: '#/animales', name: 'Nuevo Evento' },
  { file: 'rep/rep-03.png', nav: '#/animales', name: 'Tipos Evento' },
  { file: 'rep/rep-04.png', nav: '#/animales', name: 'Ciclo Completo' },
  { file: 'rep/rep-05.png', nav: '#/animales', name: 'Árbol Genealógico' }
];

function getActiveDevice() {
  console.log('🔍 Detectando dispositivo activo...');
  try {
    const output = execSync('adb devices', { encoding: 'utf8' });
    const lines = output.split('\n');

    let activeDevice = null;
    for (const line of lines) {
      const match = line.match(/^(\S+)\s+device/);
      if (match) {
        activeDevice = match[1];
        break;
      }
    }

    if (!activeDevice) {
      throw new Error('No devices found');
    }

    console.log(`✅ Dispositivo: ${activeDevice}\n`);
    return activeDevice;
  } catch (e) {
    console.error('❌ Error detectando dispositivo');
    console.error('   Verifica: adb devices');
    process.exit(1);
  }
}

function setupForwarding(device) {
  console.log('🔌 Configurando port forwarding...');
  try {
    // Limpiar
    try {
      execSync(`adb -s ${device} forward --remove tcp:9222`, { stdio: 'pipe' });
    } catch (e) {}

    // Configurar
    execSync(`adb -s ${device} forward tcp:9222 localabstract:chrome_devtools_remote`, { stdio: 'pipe' });

    console.log('✅ Port forwarding configurado\n');
  } catch (e) {
    console.error('❌ Error en port forwarding:', e.message);
    process.exit(1);
  }
}

async function captureFromDevice() {
  let client;

  try {
    console.log('📸 Conectando a Chrome...\n');

    // Conectar con reintentos
    let connected = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        client = await CDP({ port: 9222, timeout: 10000 });
        connected = true;
        break;
      } catch (e) {
        console.log(`⏳ Intento ${attempt}/5...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!connected) {
      console.error('❌ No se pudo conectar a Chrome');
      console.error('   Verifica que Chrome está abierto en el dispositivo');
      process.exit(1);
    }

    const { Network, Page } = client;
    await Network.enable();
    await Page.enable();

    console.log('✅ Conectado a Chrome!\n');
    console.log('📷 Capturando 35 screenshots...\n');

    let successful = 0;
    for (let i = 0; i < captureSequence.length; i++) {
      const seq = captureSequence[i];
      const filePath = path.join(SCREENSHOTS_DIR, seq.file);

      process.stdout.write(`[${String(i + 1).padStart(2)}] ${seq.name.padEnd(25)} `);

      try {
        await Page.navigate({ url: 'http://localhost' + seq.nav });
        await new Promise(r => setTimeout(r, 1200));

        const { data } = await Page.captureScreenshot({ format: 'png' });
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, buffer);

        console.log('✅');
        successful++;
      } catch (e) {
        console.log(`⚠️  ${e.message}`);
      }

      if (i < captureSequence.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`\n✅ Captura completada: ${successful}/35`);
    console.log(`📁 Guardados en: www/manual/img/\n`);

    await client.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function main() {
  const device = getActiveDevice();
  setupForwarding(device);
  await captureFromDevice();
}

main();
