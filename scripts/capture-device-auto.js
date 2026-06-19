#!/usr/bin/env node
/**
 * Captura Screenshots desde Android Device - Automático
 * 1. Verifica ADB y dispositivo
 * 2. Abre Chrome automáticamente
 * 3. Navega a la app y captura 35 screenshots
 *
 * Uso: node scripts/capture-device-auto.js
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

// Crear directorios
const dirs = ['compr', 'prov', 'trans', 'anim', 'contr', 'san', 'rep'];
dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Secuencia de capturas simplificada
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

async function verifyAdb() {
  console.log('🔍 Verificando ADB...');
  try {
    const result = execSync('adb devices', { encoding: 'utf8' });
    if (!result.includes('device')) {
      throw new Error('No devices found');
    }
    console.log('✅ ADB disponible\n');
  } catch (e) {
    console.error('❌ ADB no disponible o sin dispositivos');
    console.error('   Pasos:');
    console.error('   1. Instala Android SDK');
    console.error('   2. Conecta dispositivo via USB');
    console.error('   3. Habilita debugging USB');
    process.exit(1);
  }
}

async function openChromeOnDevice() {
  console.log('📱 Abriendo Chrome en el dispositivo...');
  try {
    // Activar depuración remota en Chrome
    execSync('adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main', { stdio: 'pipe' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('✅ Chrome abierto\n');
  } catch (e) {
    console.log('⚠️  Chrome puede estar abierto ya o no disponible\n');
  }
}

async function setupAdbForwarding() {
  console.log('🔌 Configurando port forwarding ADB...');
  try {
    // Limpiar forward previos
    try {
      execSync('adb forward --remove tcp:9222', { stdio: 'pipe' });
    } catch (e) {}

    // Configurar nuevo forward
    execSync('adb forward tcp:9222 localabstract:chrome_devtools_remote', { stdio: 'pipe' });

    // Dar un poco de tiempo
    await new Promise(r => setTimeout(r, 1000));
    console.log('✅ Port forwarding configurado\n');
  } catch (e) {
    console.error('❌ Error configurando port forwarding');
    process.exit(1);
  }
}

async function captureFromDevice() {
  let client;

  try {
    console.log('📸 Conectando a Chrome para capturar...\n');

    // Conectar vía CDP con reintentos
    let connected = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!connected && attempts < maxAttempts) {
      try {
        client = await CDP({ port: 9222, timeout: 5000 });
        connected = true;
      } catch (e) {
        attempts++;
        console.log(`⏳ Intento ${attempts}/${maxAttempts}... esperando Chrome...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!connected) {
      console.error('❌ No se pudo conectar a Chrome después de 5 intentos');
      console.error('   Verifica que:');
      console.error('   - Chrome está abierto en el dispositivo');
      console.error('   - La app está cargada en localhost (192.168.1.X:5173)');
      process.exit(1);
    }

    const { Network, Page } = client;

    await Network.enable();
    await Page.enable();

    console.log('✅ Conectado!\n');
    console.log('📷 Capturando 35 screenshots...\n');

    // Capturar secuencia
    let successful = 0;
    for (let i = 0; i < captureSequence.length; i++) {
      const seq = captureSequence[i];
      const filePath = path.join(SCREENSHOTS_DIR, seq.file);

      process.stdout.write(`[${i + 1}/35] ${seq.name.padEnd(25)} `);

      try {
        // Navegar (10.0.2.2 para emulador Android, localhost para dispositivo físico)
        const baseUrl = 'http://10.0.2.2:5173';
        await Page.navigate({ url: baseUrl + seq.nav });
        await new Promise(r => setTimeout(r, 1500));

        // Capturar
        const { data } = await Page.captureScreenshot({ format: 'png' });
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, buffer);

        console.log('✅');
        successful++;
      } catch (e) {
        console.log(`⚠️  ${e.message}`);
      }

      // Pequeña pausa entre capturas
      if (i < captureSequence.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    console.log(`\n✅ Captura completada!`);
    console.log(`📁 ${successful}/35 screenshots guardados en www/manual/img/`);
    console.log(`💾 Directorio: ${SCREENSHOTS_DIR}\n`);

    await client.close();

  } catch (error) {
    console.error('❌ Error durante la captura:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    await verifyAdb();
    await openChromeOnDevice();
    await setupAdbForwarding();
    await captureFromDevice();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
