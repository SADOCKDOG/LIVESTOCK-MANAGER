/**
 * Captura desde WebView de la app Livestock Manager via ADB CDP
 * Puerto 9222 ya configurado: adb forward tcp:9222 localabstract:webview_devtools_remote_32383
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../www/manual/img');

const dirs = ['compr', 'prov', 'trans', 'anim', 'contr', 'san', 'rep'];
dirs.forEach(dir => {
  const dirPath = path.join(SCREENSHOTS_DIR, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const screenshots = [
  { file: 'compr/compr-01.png', hash: '/compradores',   name: 'Compradores listado' },
  { file: 'compr/compr-02.png', hash: '/compradores',   name: 'Nuevo Comprador' },
  { file: 'compr/compr-03.png', hash: '/compradores',   name: 'Formulario' },
  { file: 'compr/compr-04.png', hash: '/compradores',   name: 'Cárnicas Extremeñas' },
  { file: 'compr/compr-05.png', hash: '/compradores',   name: 'Historial Ventas' },
  { file: 'compr/compr-06.png', hash: '/compradores',   name: 'Lácteos La Serena' },
  { file: 'compr/compr-07.png', hash: '/compradores',   name: 'Contratos' },
  { file: 'compr/compr-08.png', hash: '/compradores',   name: 'KPIs' },

  { file: 'prov/prov-01.png', hash: '/proveedores',     name: 'Proveedores listado' },
  { file: 'prov/prov-02.png', hash: '/proveedores',     name: 'Nuevo Proveedor' },
  { file: 'prov/prov-03.png', hash: '/proveedores',     name: 'Categorías' },
  { file: 'prov/prov-04.png', hash: '/proveedores',     name: 'Piensos El Trébol' },
  { file: 'prov/prov-05.png', hash: '/proveedores',     name: 'Gastos' },
  { file: 'prov/prov-06.png', hash: '/proveedores',     name: 'VetPlus' },
  { file: 'prov/prov-07.png', hash: '/proveedores',     name: 'Maquinaria' },
  { file: 'prov/prov-08.png', hash: '/proveedores',     name: 'KPIs' },

  { file: 'trans/trans-01.png', hash: '/transportistas', name: 'Transportistas listado' },
  { file: 'trans/trans-02.png', hash: '/transportistas', name: 'Nuevo Transportista' },
  { file: 'trans/trans-03.png', hash: '/transportistas', name: 'Tipo Vehículo' },
  { file: 'trans/trans-04.png', hash: '/transportistas', name: 'Certificado' },
  { file: 'trans/trans-05.png', hash: '/transportistas', name: 'Transporte Ganaderos' },
  { file: 'trans/trans-06.png', hash: '/transportistas', name: 'Logística Láctea' },
  { file: 'trans/trans-07.png', hash: '/transportistas', name: 'KPIs detalle' },
  { file: 'trans/trans-08.png', hash: '/transportistas', name: 'KPIs listado' },

  { file: 'anim/anim-01.png', hash: '/estructura',      name: 'Estructura' },
  { file: 'anim/anim-02.png', hash: '/zonas',           name: 'Zonas' },
  { file: 'anim/anim-03.png', hash: '/rebanos',         name: 'Rebaños' },
  { file: 'anim/anim-04.png', hash: '/rebanos',         name: 'Nuevo Rebaño' },
  { file: 'anim/anim-05.png', hash: '/animales',        name: 'Animales' },
  { file: 'anim/anim-06.png', hash: '/animales',        name: 'Nuevo Animal 1' },
  { file: 'anim/anim-07.png', hash: '/animales',        name: 'Nuevo Animal 2' },
  { file: 'anim/anim-08.png', hash: '/animales',        name: 'Escáner' },
  { file: 'anim/anim-09.png', hash: '/animales',        name: 'Detalle Animal' },
  { file: 'anim/anim-10.png', hash: '/animales',        name: 'Genealogía' },
  { file: 'anim/anim-11.png', hash: '/animales',        name: 'KPIs' },

  { file: 'contr/contr-01.png', hash: '/compradores',   name: 'Contratos panel' },
  { file: 'contr/contr-02.png', hash: '/compradores',   name: 'Nuevo Contrato' },
  { file: 'contr/contr-03.png', hash: '/compradores',   name: 'Tabla Precios' },

  { file: 'san/san-01.png', hash: '/rebanos',           name: 'Sanitarios' },
  { file: 'san/san-02.png', hash: '/rebanos',           name: 'Nuevo Sanitario' },
  { file: 'san/san-03.png', hash: '/rebanos',           name: 'Tipos Tratamiento' },
  { file: 'san/san-04.png', hash: '/rebanos',           name: 'Alerta' },
  { file: 'san/san-05.png', hash: '/rebanos',           name: 'Historial' },

  { file: 'rep/rep-01.png', hash: '/animales',          name: 'Reproducción' },
  { file: 'rep/rep-02.png', hash: '/animales',          name: 'Nuevo Evento' },
  { file: 'rep/rep-03.png', hash: '/animales',          name: 'Tipos Evento' },
  { file: 'rep/rep-04.png', hash: '/animales',          name: 'Ciclo Completo' },
  { file: 'rep/rep-05.png', hash: '/animales',          name: 'Genealogía' }
];

async function navigate(Page, hash) {
  await Page.navigate({ url: 'https://localhost/#' + hash });
  await new Promise(r => setTimeout(r, 1800));
}

async function capture() {
  console.log('📱 Conectando al WebView de la app...\n');

  let client;
  try {
    client = await CDP({ port: 9222, timeout: 10000 });
  } catch (e) {
    console.error('❌ No se pudo conectar. Verifica:');
    console.error('   adb forward tcp:9222 localabstract:webview_devtools_remote_32383');
    process.exit(1);
  }

  const { Page, Emulation } = client;
  await Page.enable();

  // Ajustar viewport al tamaño del teléfono
  await Emulation.setDeviceMetricsOverride({
    width: 1080, height: 2176,
    deviceScaleFactor: 1, mobile: true
  });

  console.log('✅ Conectado al WebView!\n');
  console.log('📷 Capturando 48 screenshots desde el teléfono...\n');

  let ok = 0;
  for (let i = 0; i < screenshots.length; i++) {
    const ss = screenshots[i];
    const filePath = path.join(SCREENSHOTS_DIR, ss.file);

    process.stdout.write(`[${String(i + 1).padStart(2)}/48] ${ss.name.padEnd(28)} `);

    try {
      await navigate(Page, ss.hash);
      const { data } = await Page.captureScreenshot({ format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log('✅');
      ok++;
    } catch (e) {
      console.log(`❌ ${e.message.substring(0, 40)}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ Completado: ${ok}/48`);
  console.log(`📁 Guardados en www/manual/img/\n`);

  await client.close();
}

capture();
