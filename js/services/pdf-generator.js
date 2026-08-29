/**
 * pdf-generator.js
 *
 * Servicio centralizado para generar PDFs a partir de plantillas HTML
 * y mostrarlos mediante DocumentViewer.show(). Provee una API única
 * reutilizable por cualquier wizard o vista que necesite generar un
 * documento oficial (crotales, guías de movimiento, albaranes, etc.).
 *
 * API:
 *   generateAndShowPDF(opts: GeneratePDFOptions): Promise<void>
 *
 *   GeneratePDFOptions {
 *     title: string;                     // Título que aparecerá en la cabecera del PDF
 *     html: string;                        // HTML completo del contenido del PDF (sin wrapper)
 *     filename: string;                    // Nombre base del archivo (se añadirá .pdf)
 *     shareTitle?: string;                 // Título usado en el selector de compartir
 *     shareText?: string;                  // Texto usado en el selector de compartir
 *     onClose?: () => void;                // Callback opcional al cerrar el overlay
 *   }
 *
 * El servicio usa html2pdf (cuando está disponible) para crear el Blob
 * y luego muestra el documento mediante DocumentViewer.show(). En
 * Android WebView se aplica el fallback de compartir mediante
 * Capacitor Plugins.Share + Filesystem cuando navigator.share no está
 * disponible.
 *
 * Todos los wizards deberán importar este módulo y llamar a
 *   generateAndShowPDF(opts) en lugar de construir su propio HTML y
 *   invocar directamente DocumentViewer.show().
 */

const DocumentViewer = window.DocumentViewer; // Ya está expuesto globalmente

/**
 * Construye el wrapper HTML que DocumentViewer espera (cabecera, footer,
 * botones de acción, etc.) a partir de la plantilla básica.
 *
 * @param {Object} opts - Opciones de generación.
 * @returns {string} HTML completo del documento.
 * @private
 */
function buildPDFDocument(opts) {
  const { title, html, filename, shareTitle, shareText, onClose } = opts;

  // Cabecera y footer comunes
  return `
    <div style="padding:40px;font-family:serif;max-width:800px;margin:0 auto;color:#000;background:#fff;">
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:30px;">
        <h1 style="margin:0;font-size:1.5rem;text-transform:uppercase;">${title}</h1>
        ${shareTitle ? `<h3 style="margin:5px 0 0;color:#555;">${shareTitle}</h3>` : ''}
      </div>
      ${html}
      <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:0.8rem;">
        <div style="text-align:center;border-top:1px solid #999;padding-top:6px;color:#555;">
          <strong>Generado por Livestock Manager Premium</strong>
        </div>
        <div style="text-align:right;font-size:0.75rem;color:#777;">
          versión 4.8
        </div>
      </div>
    </div>
  `;
}

/**
 * Convierte una cadena HTML en un Blob PDF usando html2pdf.
 * Si html2pdf no está disponible, simplemente devuelve el HTML
 * como texto (el visor lo mostrará sin convertirlo a PDF, pero seguirá
 * funcionando para visualización y compartir).
 *
 * @param {string} html - HTML a convertir.
 * @returns {Promise<Blob>} Blob con el PDF generado.
 * @private
 */
async function htmlToPdfBlob(html) {
  // Esperar a que html2pdf esté disponible (App._ensureHtml2Pdf() lo carga bajo demanda)
  if (typeof html2pdf === 'undefined') {
    await App._ensureHtml2Pdf();
  }

  const opt = {
    margin: [12, 10, 12, 10],
    filename: 'temp.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 800,
      scrollX: 0,
      scrollY: 0,
      height: 0 // se ajustará automáticamente al contenido
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  // eslint-disable-next-line no-return-in-promise
  return html2pdf().set(opt).from(document.createElement('div')).html(html).output('blob');
}

/**
 * Genera el PDF y lo muestra mediante DocumentViewer.
 *
 * @param {GeneratePDFOptions} opts - Opciones de generación.
 * @returns {Promise<void>}
 */
export async function generateAndShowPDF(opts) {
  const { title, html, filename, shareTitle, shareText, onClose } = opts;

  // Construir el HTML completo que tendrá el wrapper del visor
  const fullHtml = buildPDFDocument(opts);

  // Crear un contenedor temporal para pasar a html2pdf (necesario para
  // que la función encuentre un elemento del DOM con contenido).
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = fullHtml;
  document.body.appendChild(tempContainer);

  try {
    // Convertir a PDF Blob
    const pdfBlob = await htmlToPdfBlob(fullHtml);

    // Preparar datos para compartir
    const shareData = {
      blob: pdfBlob,
      fileName: `${filename}.pdf`,
      mimeType: 'application/pdf',
      shareTitle: shareTitle || title,
      shareText: shareText,
      titulo: title
    };

    // Mostrar el PDF mediante DocumentViewer (este módulo ya gestiona
    // la lógica de fallback de compartir en Android).
    DocumentViewer.show({
      id: `doc-viewer-${Date.now()}`, // ID único para cada llamada
      title: shareData.shareTitle || title,
      html: fullHtml,
      filename,
      shareTitle: shareData.shareTitle,
      shareText: shareData.shareText,
      onClose: onClose
    });
  } catch (e) {
    console.error('[pdf-generator] Error al generar PDF:', e);
    App.toastError('No se pudo generar el documento PDF');
  } finally {
    // Limpiar contenedor temporal
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

// Exponer globalmente para uso sin módulos
if (typeof window !== 'undefined') {
  window.generateAndShowPDF = generateAndShowPDF;
}

/**
 * @typedef {Object} GeneratePDFOptions
 * @property {string} title                - Título principal del documento.
 * @property {string} html                 - HTML del contenido (sin wrapper).
 * @property {string} filename             - Nombre base del archivo (sin extensión).
 * @property {string} [shareTitle]         - Título usado en la hoja de compartir.
 * @property {string} [shareText]          - Texto usado en la hoja de compartir.
 * @property {Function} [onClose]          - Callback opcional al cerrar el overlay.
 */