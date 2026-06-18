/**
 * Livestock Manager - ManualesView v1.1.0
 * Lista todos los manuales de usuario, los visualiza dentro de la app
 * y permite exportarlos a PDF.
 */
const ManualesView = {
  _MANUALES: [
    {
      id: 'index',
      titulo: 'Manual de Usuario General',
      descripcion: 'Guía completa de la aplicación: configuración, animales, producción, comercialización, informes y documentos.',
      icono: '📖',
      archivo: 'manual/index.html',
      color: '#c9851f',
    },
    {
      id: 'carne',
      titulo: 'Ejemplo Práctico: Ovino de Carne',
      descripcion: 'Creación de explotación de ovino de carne desde cero. Cortijo San Pedro, raza Merina, Cádiz. 12 pasos detallados.',
      icono: '🐑🥩',
      archivo: 'manual/ejemplo-ovino-carne.html',
      color: '#8b5e3c',
    },
    {
      id: 'leche',
      titulo: 'Ejemplo Práctico: Ovino de Leche',
      descripcion: 'Creación de explotación de ovino de leche. Quesería Los Llanos, raza Manchega, Granada. Control lechero y MOFA.',
      icono: '🐑🧀',
      archivo: 'manual/ejemplo-ovino-leche.html',
      color: '#2563eb',
    },
    {
      id: 'produccion',
      titulo: 'Registros de Producción',
      descripcion: 'Todos los flujos de producción cárnica y láctea: pesajes, GMD, control lechero, analíticas, liquidaciones y MOFA.',
      icono: '📊',
      archivo: 'manual/registros-produccion.html',
      color: '#9333ea',
    },
    {
      id: 'comercializacion',
      titulo: 'Comercialización',
      descripcion: 'Venta Masiva de animales (5 pasos) y Albarán de Leche (6 pasos): trazabilidad, pesajes, compradores, SEUROP, transportista, analíticas, precio y MOFA.',
      icono: '💰',
      archivo: 'manual/manual-comercializacion.html',
      color: '#8b5e3c',
    },
    {
      id: 'pesadas',
      titulo: 'Pesadas Individual y por Lote',
      descripcion: 'Pesada individual de animal y pesaje por lote de rebaño en producción cárnica: asistente, búsqueda, registro de peso y GMD.',
      icono: '⚖️',
      archivo: 'manual/manual-pesadas.html',
      color: '#8b5e3c',
    },
    {
      id: 'control-lechero',
      titulo: 'Control Lechero',
      descripcion: 'Control lechero individual, control por lote y expedición de tanque (albarán de leche 6 pasos): calidad, analíticas, precio y MOFA.',
      icono: '🥛',
      archivo: 'manual/manual-control-lechero.html',
      color: '#2563eb',
    },
    {
      id: 'gastos',
      titulo: 'Gastos',
      descripcion: 'Control de costes analítico: categorías contables (alimentación, sanidad, electricidad, personal), imputación a rebaño/zona y rentabilidad.',
      icono: '💰',
      archivo: 'manual/manual-gastos.html',
      color: '#f59e0b',
    },
  ],

  async render() {
    const main = document.getElementById('app-content');
    main.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <h2 class="page-title">📚 Manuales</h2>
          <p class="page-subtitle">Guías de usuario y ejemplos prácticos</p>
        </div>
        <div id="manuales-list" style="display:flex; flex-direction:column; gap:14px; padding:0 0 20px;">
          ${this._renderLista()}
        </div>
        <div class="text-center text-gray text-xs" style="margin-top:20px; padding-bottom:30px;">
          Pulsa sobre un manual para leerlo.<br>
          Usa el botón PDF para generar una copia imprimible.
        </div>
      </div>`;
  },

  _renderLista() {
    return this._MANUALES.map(m => `
      <div class="card manual-card" style="border-left:4px solid ${m.color}; padding:16px; cursor:pointer;"
           onclick="ManualesView._abrirManual('${m.archivo}')">
        <div style="display:flex; align-items:center; gap:14px;">
          <span style="font-size:2rem; flex-shrink:0;">${m.icono}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:800; font-size:0.95rem; color:#fff; margin-bottom:4px;">${m.titulo}</div>
            <div style="font-size:0.78rem; color:#999; line-height:1.3;">${m.descripcion}</div>
          </div>
          <button class="btn btn-sm" style="flex-shrink:0; background:${m.color}; color:#fff; border:none; border-radius:8px; padding:8px 12px; font-size:0.7rem; font-weight:700;"
                  onclick="event.stopPropagation(); ManualesView._exportarPDF('${m.archivo}', '${m.titulo}')">
            📄 PDF
          </button>
        </div>
      </div>
    `).join('');
  },

  async _abrirManual(archivo) {
    // Cargar el manual dentro de un overlay con iframe y botón de salir
    const overlay = document.createElement('div');
    overlay.id = 'manual-viewer-overlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; right:0; bottom:0; z-index:9999;
      background:#fff; display:flex; flex-direction:column;
    `;

    overlay.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between;
                  background:#1a1a2e; padding:8px 14px; flex-shrink:0; min-height:48px;">
        <button id="btn-cerrar-manual"
                style="background:rgba(255,255,255,0.15); border:none; color:#fff; font-size:0.85rem;
                       padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:700;
                       display:flex; align-items:center; gap:6px;">
          ✕ Volver
        </button>
        <span style="color:#e0a83a; font-weight:800; font-size:0.85rem;">📚 Manual</span>
        <div style="width:70px;"></div>
      </div>
      <iframe id="manual-frame" src="${archivo}"
              style="flex:1; width:100%; border:none;"
              onerror="this.parentElement.innerHTML='<div style=\\'padding:40px;text-align:center;color:#999;\\'>Error al cargar el manual.</div>'">
      </iframe>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cerrar-manual').onclick = () => {
      overlay.remove();
    };
  },

  async _exportarPDF(archivo, titulo) {
    try {
      App.toast('Preparando PDF...');

      if (typeof html2pdf === 'undefined') {
        App.toastError('La librería de PDF no está disponible. Abre el manual y usa imprimir → guardar como PDF.');
        return;
      }

      const container = document.createElement('div');
      // Visible y SIN límite de altura: html2canvas no rasteriza elementos fuera de pantalla
      // (PDF en blanco) y 'height:100vh;overflow:hidden' recortaría a una sola página.
      container.style.cssText = 'position:fixed;left:0;top:0;width:794px;z-index:99999;background:#fff;color:#000;';
      document.body.appendChild(container);

      try {
        const resp = await fetch(archivo);
        if (!resp.ok) throw new Error('No se pudo cargar el manual');
        const html = await resp.text();

        // Un documento HTML completo dentro de innerHTML de un <div> NO se renderiza
        // (el navegador descarta <html>/<head>/<body>) -> PDF en blanco.
        // Extraemos los <style> del head y el contenido del <body>.
        const styles = (html.match(/<style[\s\S]*?<\/style>/gi) || []).join('\n');
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        let bodyContent = (bodyMatch ? bodyMatch[1] : html).replace(/src="img\//g, 'src="manual/img/');
        const extraCss = `<style>
            * { box-sizing:border-box !important; }
            body { color:#1a1a1a; background:#fff; font-size:12px; overflow-wrap:break-word; word-wrap:break-word; margin:0; }
            .portada { background:#1a3050 !important; color:#fff !important; padding:34px 18px !important; }
            .portada h1 { color:#e0a83a !important; }
            .portada .logo, .portada h1, .portada .sub, .portada .badge { max-width:100%; }
            .wrap { max-width:100% !important; padding:0 14px !important; }
            .seccion { page-break-inside:avoid; padding:14px 0 !important; max-width:100%; }
            .card, .nota, .tip, .aviso, ol.pasos > li, .indice, figure { max-width:100%; overflow-wrap:break-word; }
            h2.modulo { font-size:1.3rem !important; overflow-wrap:break-word; }
            table { width:100% !important; table-layout:fixed; border-collapse:collapse; }
            td, th { overflow-wrap:break-word; word-break:break-word; padding:4px 6px; }
            figure img { max-width:230px !important; box-shadow:none !important; height:auto; }
            img { max-width:100% !important; height:auto; }
            a { color:#1a1a1a !important; text-decoration:none !important; word-break:break-word; }
            .indice ol { columns:2; }
            pre, code, kbd { white-space:pre-wrap; word-break:break-word; }
          </style>`;
        container.innerHTML = styles + extraCss + bodyContent;

        // Esperar a que TODAS las imágenes carguen antes de rasterizar (si no, salen en blanco)
        await Promise.all(Array.from(container.querySelectorAll('img')).map(img =>
          img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
        ));
        await new Promise(r => setTimeout(r, 400));

        const opt = {
          margin:       [10, 8, 10, 8],
          filename:     titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim() + '.pdf',
          image:        { type: 'jpeg', quality: 0.85 },
          html2canvas:  { scale: 1.5, useCORS: true, logging: false, height: container.scrollHeight, windowHeight: container.scrollHeight },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
        await ManualesView._compartirPDF(pdfBlob, opt.filename, titulo);
      } finally {
        document.body.removeChild(container);
      }
    } catch (e) {
      console.error('Error al exportar PDF:', e);
      App.toastError('Error al generar PDF: ' + e.message);
    }
  },

  /** Comparte/guarda el PDF generado. En Capacitor usa Filesystem(CACHE)+Share (las descargas de navegador no funcionan en el WebView). */
  async _compartirPDF(blob, fileName, titulo) {
    // 1) Capacitor nativo: escribir en CACHE y compartir (no requiere permisos)
    try {
      const cap = window.Capacitor;
      const fsPlugin = cap?.Plugins?.Filesystem;
      const sharePlugin = cap?.Plugins?.Share;
      if (fsPlugin && sharePlugin) {
        const dataUri = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
        const result = await fsPlugin.writeFile({ path: fileName, data: dataUri.split(',')[1], directory: 'CACHE' });
        await sharePlugin.share({ title: titulo, text: titulo, url: result.uri, files: [result.uri], dialogTitle: 'Compartir ' + titulo });
        App.toast('✅ PDF listo para compartir');
        return;
      }
    } catch (e) { console.warn('[Manual Share] falló:', e?.message || e); }
    // 2) navigator.share con File (web/PWA)
    try {
      if (navigator.share) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        await navigator.share({ title: titulo, files: [file] });
        return;
      }
    } catch (e) { if (e.name === 'AbortError') return; }
    // 3) Fallback: descarga directa (navegador de escritorio)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    App.toast('✅ PDF descargado');
  },
};

window.ManualesView = ManualesView;
