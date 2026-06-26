const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Configurar viewport móvil (iPhone 12/13/14 format)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    
    const dest = 'G:\\Mi unidad\\PLAYCONSOLE\\Imágenes';
    
    console.log("Conectando con localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    // Cargar datos de prueba
    try {
        console.log("Cargando datos de Demo CHAMORRO...");
        await page.evaluate(() => {
            if (window.SeedData && window.SeedData.run) {
                return window.SeedData.run();
            } else {
                // Alternativa: Si hay un botón con texto específico, intentar hacerle click
                const btns = Array.from(document.querySelectorAll('button'));
                const demoBtn = btns.find(b => b.textContent.includes('CHAMORRO'));
                if (demoBtn) demoBtn.click();
            }
        });
        
        console.log("Esperando 15 segundos para que se asienten los datos...");
        await new Promise(r => setTimeout(r, 15000));
        
        console.log("Refrescando la página...");
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        
    } catch (e) {
        console.log("Error al cargar datos de demo:", e);
    }

    // 1. Pantalla principal / Dashboard
    console.log("Tomando captura 1: Inicio");
    await page.screenshot({ path: path.join(dest, '1_Inicio.png') });
    
    // 2. Navegar a Compradores (según el README esto existe)
    console.log("Tomando captura 2: Compradores");
    await page.goto('http://localhost:5173/#/compradores', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(dest, '2_Compradores.png') });

    // 3. Navegar a Proveedores
    console.log("Tomando captura 3: Proveedores");
    await page.goto('http://localhost:5173/#/proveedores', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(dest, '3_Proveedores.png') });

    // 4. Navegar a Animales (intento deducir la ruta basándome en el plan)
    console.log("Tomando captura 4: Animales");
    await page.goto('http://localhost:5173/#/animales', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(dest, '4_Animales.png') });

    await browser.close();
    console.log("Capturas completadas y guardadas en G:\\Mi unidad\\PLAYCONSOLE\\Imágenes");
    
  } catch (error) {
    console.error("Error al ejecutar Puppeteer:", error);
    process.exit(1);
  }
})();
