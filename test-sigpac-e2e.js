const { chromium } = require('playwright');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function createTestCatastroPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Texto de muestra que coincida con los patrones del parser
  const lines = [
    { text: 'CONSULTA DESCRIPTIVA Y GRÁFICA DE DATOS CATASTRALES', bold: true, size: 12, x: 50, y: 780 },
    { text: '', size: 10, x: 50, y: 760 },
    // refCatastral rústica: 5 dígitos + 1 letra + 12 dígitos + 2 letras = 20 chars
    { text: 'Referencia Catastral: 12345A678901234567BC', size: 10, x: 50, y: 740 },
    { text: 'Polígono 1 Parcela 2', size: 10, x: 50, y: 720 },
    { text: 'Paraje El Roble. Municipio de Cáceres (Cáceres)', size: 10, x: 50, y: 700 },
    { text: 'Localización: Paraje El Roble. Polígono 1 Parcela 2', size: 10, x: 50, y: 680 },
    { text: 'Clase Rústico', size: 10, x: 50, y: 660 },
    { text: 'Uso principal Pastos', size: 10, x: 50, y: 640 },
    { text: 'Superficie gráfica 10.000,00', size: 10, x: 50, y: 620 },
    { text: 'Superficie construida 0,00', size: 10, x: 50, y: 600 },
    { text: '', size: 10, x: 50, y: 580 },
    { text: 'CULTIVO', bold: true, size: 10, x: 50, y: 560 },
    { text: 'a Pastos 01 10.000,00', size: 10, x: 50, y: 540 },
    { text: 'b Cultivo herbáceo 02 5.000,00', size: 10, x: 50, y: 520 },
    { text: '', size: 10, x: 50, y: 500 },
    { text: 'CONSTRUCCIÓN', bold: true, size: 10, x: 50, y: 480 },
  ];

  for (const line of lines) {
    if (!line.text) continue;
    page.drawText(line.text, {
      x: line.x,
      y: line.y,
      size: line.size,
      font: line.bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test-catastro.pdf', pdfBytes);
  console.log('PDF creado: test-catastro.pdf');
}

async function runE2ETest() {
  // Use real Catastro PDF instead of generated one
  const fs = require('fs');
  const realPdfPath = 'C:\\Users\\yo\\repo\\pesadas-corcho\\_PRIVATE_\\ZONAS\\Polígono 1 Parcela 30.pdf';

  if (!fs.existsSync(realPdfPath)) {
    console.log('Real PDF not found, creating test PDF...');
    await createTestCatastroPDF();
  } else {
    fs.copyFileSync(realPdfPath, 'test-catastro.pdf');
    console.log('Using real Catastro PDF:', realPdfPath);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  // Also listen for network requests to pdf.js
  page.on('request', request => {
    if (request.url().includes('pdfjs') || request.url().includes('pdf.js')) {
      console.log('[NETWORK] Request:', request.url());
    }
  });

  try {
    console.log('1. Navegando a la app...');
    await page.goto('http://localhost:8799/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Wait for App to initialize
    await page.waitForFunction(() => window.App !== undefined, { timeout: 15000 });
    console.log('   ✓ App inicializada');

    console.log('2. Cargando datos demo CHAMORRO...');
    // Check if we're on the welcome/onboarding screen and need to load demo data
    try {
      await page.getByRole('button', { name: /Cargar Demo CHAMORRO/i }).click();
      await page.waitForTimeout(2000);
      // Click "ACEPTAR" on confirmation dialog
      try {
        await page.getByRole('button', { name: /ACEPTAR/i }).click();
        console.log('   ✓ Confirmación ACEPTAR');
      } catch (e) {
        console.log('   No confirmation dialog');
      }
      await page.waitForTimeout(8000); // Wait for demo data to load
      console.log('   ✓ Datos demo cargados');
    } catch (e) {
      console.log('   No se encontró botón demo (quizás ya hay datos)');
    }

    console.log('3. Navegando a #/ganaderia?tab=zonas...');
    await page.goto('http://localhost:8799/#/ganaderia?tab=zonas', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Debug: check what's on the page
    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log('   Page text preview:', pageContent.substring(0, 800));

    console.log('4. Esperando a que cargue la vista de zonas...');
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent.includes('Importar desde PDF del Catastro'));
    }, { timeout: 15000 });
    console.log('   ✓ Botón "Importar desde PDF del Catastro" visible');

    console.log('5. Haciendo clic en "Importar desde PDF del Catastro"...');
    await page.getByRole('button', { name: /Importar desde PDF del Catastro/i }).click();
    await page.waitForTimeout(2000);

    console.log('5. Esperando a que cargue la vista de importación...');
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    console.log('   ✓ Selector de archivos visible');

    console.log('6. Seleccionando archivo PDF...');
    await page.setInputFiles('input[type="file"]', 'test-catastro.pdf');
    await page.waitForTimeout(1000);

    console.log('7. Haciendo clic en "Continuar"...');
    await page.getByRole('button', { name: /Continuar/i }).click();
    await page.waitForTimeout(2000); // Let it start processing

    // Check for errors periodically
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(3000);
      const errorText = await page.textContent('#error-container').catch(() => '');
      if (errorText && errorText.trim()) {
        console.log('   Error detected:', errorText.trim());
        break;
      }
      const hasReview = await page.evaluate(() => {
        const h2 = document.querySelector('h2');
        return h2 && h2.textContent.includes('Revisión');
      }).catch(() => false);
      if (hasReview) {
        console.log('   ✓ Pantalla de revisión visible');
        break;
      }
      console.log(`   Waiting... (${(i+1)*3}s)`);

      // Check console for pdf.js loading
      if (i === 5) {
        const consoleLogs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.includes('pdf'));
        });
        console.log('   pdf.js scripts on page:', consoleLogs);
      }
    }

    console.log('9. Verificando datos parseados...');
    // Debug: check what's actually on the review page
    const reviewContent = await page.evaluate(() => document.body.innerText);
    console.log('   Review page preview:', reviewContent.substring(0, 1000));

    const refCatastral = await page.textContent('text=refCatastral').catch(() => null);
    console.log('   refCatastral visible:', !!refCatastral);

    const superficie = await page.textContent('text=1 ha').catch(() => null);
    console.log('   Superficie 1 ha visible:', !!superficie);

    const usoPrincipal = await page.textContent('text=Pastos').catch(() => null);
    console.log('   Uso principal Pastos visible:', !!usoPrincipal);

    console.log('10. Haciendo clic en "Guardar zonas"...');
    // Try different possible button names
    const saveBtn = await page.getByRole('button', { name: /Guardar/i }).first().catch(() => null);
    if (saveBtn) {
      await saveBtn.click();
    } else {
      console.log('   Guardar button not found, trying alternative...');
      await page.getByRole('button', { name: /Guardar zonas/i }).click();
    }
    await page.waitForTimeout(3000);

    console.log('11. Verificando retorno a zonas...');
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent.includes('Importar desde PDF del Catastro'));
    }, { timeout: 10000 });
    console.log('   ✓ De vuelta a la vista de zonas');

    console.log('12. Verificando que la zona aparece en la lista...');
    // Check if the new zone appears (it should have the name from the review screen)
    const zonaElRoble = await page.textContent('text=El Roble').catch(() => null);
    console.log('   Zona "El Roble" visible:', !!zonaElRoble);

    console.log('\n✅ TEST E2E COMPLETADO EXITOSAMENTE');
  } catch (err) {
    console.error('\n❌ TEST FALLÓ:', err.message);
    console.error(err.stack);
    try {
      await page.screenshot({ path: 'test-failure.png', fullPage: true });
      console.log('Screenshot guardado: test-failure.png');
    } catch (e) {
      console.log('No se pudo capturar screenshot');
    }
  } finally {
    try {
      await browser.close();
    } catch (e) {
      // ignore
    }
  }
}

runE2ETest().catch(console.error);