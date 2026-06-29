const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    console.log("Iniciando Puppeteer para capturar Wizard Finca...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Viewport móvil similar a los otros screenshots
    await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
    
    console.log("Cargando la aplicación desde localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    console.log("Cargando datos demo...");
    await page.evaluate(async () => {
      if (window.SeedData && window.SeedData.run) {
        await window.SeedData.run();
      }
    });
    
    console.log("Esperando a que los datos se carguen...");
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Navegando a Ajustes...");
    await page.evaluate(() => {
      window.location.hash = '#/ajustes';
    });
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Abriendo el Wizard de Editar Finca...");
    await page.evaluate(() => {
      if (window.App && window.App._editarFincaActiva) {
        window.App._editarFincaActiva();
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    
    // Tomar captura de pantalla
    const destDir = path.join(__dirname, '../manual/img');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, 'sc_18_wizard_finca.png');
    
    console.log(`Guardando captura en: ${destPath}`);
    await page.screenshot({ path: destPath });
    
    console.log("¡Captura tomada con éxito!");
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al capturar:", error);
    process.exit(1);
  }
})();
