/**
 * LIVESTOCK MANAGER - VALIDACION VISUAL AUTOMATIZADA CON CAPTURA DE PANTALLA
 * Sdog Farm Software Factory - sadogfarm.onmicrosoft.com
 * Monta TrazabilidadPorcinaView en un navegador headless y captura evidencias PNG.
 */

const fs = require("fs");
const path = require("path");

async function runVisualValidation() {
  console.log("Iniciando validacion visual de Trazabilidad Porcina...");

  let chromium;
  try {
    const pw = require("@playwright/test");
    chromium = pw.chromium;
  } catch (e) {
    try {
      const puppeteer = require("puppeteer");
      chromium = puppeteer;
    } catch (e2) {
      console.error("Playwright o Puppeteer no encontrados para captura visual.");
      return;
    }
  }

  const screenshotsDir = path.join(__dirname, "..", "docs", "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  // Crear contenido HTML de prueba autónomo que carga el servicio y la vista
  const serviceCode = fs.readFileSync(path.join(__dirname, "..", "js", "services", "porcine-traceability.js"), "utf8");
  const viewCode = fs.readFileSync(path.join(__dirname, "..", "js", "views", "trazabilidad-porcina-view.js"), "utf8");

  const testHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Validacion Visual Trazabilidad Porcina</title>
      <style>
        body { margin: 0; padding: 20px; background: #09090b; font-family: Inter, system-ui, sans-serif; }
      </style>
    </head>
    <body>
      <div id="app-content"></div>
      <script>
        ${serviceCode}
      </script>
      <script>
        ${viewCode}
      </script>
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          TrazabilidadPorcinaView.render('app-content');
        });
      </script>
    </body>
    </html>
  `;

  await page.setContent(testHtml, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // 1. Captura Estado Autorizado Nominal
  const shotApto = path.join(screenshotsDir, "trazabilidad_porcina_autorizada.png");
  await page.screenshot({ path: shotApto, fullPage: true });
  console.log("  [CAPTURA GENERADA]:", shotApto);

  // 2. Simular Tratamiento y Bloqueo Zoosanitario
  await page.click("#chk-simular-tratamiento");
  await page.click("#btn-evaluar-movimiento");
  await page.click("#btn-ejecutar-tests");
  await page.waitForTimeout(400);

  // Captura Estado Bloqueado con Tests Superados
  const shotBloqueo = path.join(screenshotsDir, "trazabilidad_porcina_bloqueada_supresion.png");
  await page.screenshot({ path: shotBloqueo, fullPage: true });
  console.log("  [CAPTURA GENERADA]:", shotBloqueo);

  await browser.close();
  console.log("\nVALIDACION VISUAL COMPLETADA SATISFACTORIAMENTE.\n");
}

runVisualValidation().catch((err) => {
  console.error("Error en validacion visual:", err);
  process.exit(1);
});
