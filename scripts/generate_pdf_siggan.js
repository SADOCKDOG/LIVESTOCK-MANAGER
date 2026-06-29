const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  try {
    console.log("Iniciando Puppeteer para compilar PDF de SIGGAN...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const htmlPath = path.resolve(__dirname, '../manual/manual_siggan.html');
    console.log(`Cargando archivo HTML: ${htmlPath}`);
    
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0'
    });
    
    console.log("Generando PDF...");
    const pdfPath = path.resolve(__dirname, '../livestock_manager_siggan.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm'
      }
    });
    
    console.log(`PDF generado con éxito en: ${pdfPath}`);
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("Error generating PDF:", error);
    process.exit(1);
  }
})();
