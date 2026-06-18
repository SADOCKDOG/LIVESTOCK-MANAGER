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
    let loader;
    try {
      // Crear overlay de carga con barra de proceso
      loader = document.createElement('div');
      loader.id = 'pdf-loader-overlay';
      loader.style.cssText = `
        position:fixed; top:0; left:0; right:0; bottom:0; z-index:100000;
        background:rgba(0,0,0,0.85); display:flex; flex-direction:column;
        align-items:center; justify-content:center; color:#fff; font-family:sans-serif;
      `;
      loader.innerHTML = `
        <div style="width:280px; text-align:center;">
          <div style="font-size:3rem; margin-bottom:20px; animation: bounce 2s infinite;">📄</div>
          <div style="font-weight:800; font-size:1.1rem; margin-bottom:8px;">Generando PDF</div>
          <div style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">${titulo}</div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; position:relative;">
            <div id="pdf-progress-bar" style="position:absolute; left:0; top:0; height:100%; width:10%; background:#c9851f; transition:width 0.4s ease; border-radius:10px;"></div>
          </div>
          <div id="pdf-progress-text" style="font-size:0.7rem; color:#888; margin-top:8px; font-weight:700;">PROCESANDO...</div>
        </div>
        <style>
          @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-20px);} 60% {transform: translateY(-10px);} }
        </style>
      `;
      document.body.appendChild(loader);

      const updateProgress = (pct, text) => {
        const bar = loader.querySelector('#pdf-progress-bar');
        const txt = loader.querySelector('#pdf-progress-text');
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = text.toUpperCase();
      };

      if (typeof html2pdf === 'undefined') {
        App.toastError('La librería de PDF no está disponible.');
        loader.remove();
        return;
      }

      updateProgress(20, 'Descargando manual...');
      const container = document.createElement('div');
      // Contenedor temporal para renderizado. Se usa position: absolute y z-index negativo.
      container.style.cssText = 'position:absolute; left:0; top:0; width:800px; z-index:-1000; background:#fff; color:#000; overflow:visible;';
      document.body.appendChild(container);

      try {
        const resp = await fetch(archivo);
        if (!resp.ok) throw new Error('No se pudo cargar el manual');
        const html = await resp.text();

        updateProgress(40, 'Procesando contenido...');
        // Extraemos los <style> del head y el contenido del <body>.
        const styles = (html.match(/<style[\s\S]*?<\/style>/gi) || []).join('\n');
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        let bodyContent = (bodyMatch ? bodyMatch[1] : html);

        if (!bodyMatch) {
            bodyContent = bodyContent.replace(/<head[\s\S]*?<\/head>/gi, '')
                                     .replace(/<script[\s\S]*?<\/script>/gi, '')
                                     .replace(/<html[^>]*>/gi, '')
                                     .replace(/<\/html>/gi, '');
        }
        bodyContent = bodyContent.replace(/src="img\//g, 'src="manual/img/');

        // Estilos específicos para PDF
        const extraCss = `<style>
            @page { size: A4; margin: 0; }
            .pdf-export-body {
                color:#1a1a1a !important; background:#fff !important; font-size:13px !important;
                margin:0 !important; padding:0 !important;
                -webkit-print-color-adjust:exact !important;
                font-family: Arial, sans-serif !important;
                width: 800px !important;
                display: block !important;
            }
            .portada {
                background: linear-gradient(160deg, #1a1a2e, #16213e) !important;
                color:#ffffff !important;
                padding: 45px 30px !important;
                text-align: center !important;
                width: 800px !important;
                box-sizing: border-box !important;
                margin: 0 0 30px 0 !important;
                border-bottom: 8px solid #c9851f !important;
                display: block !important;
                overflow: visible !important;
                height: auto !important;
                min-height: 150px !important;
            }
            .portada .logo-img {
                max-width: 70px !important;
                height: auto !important;
                margin: 0 auto 12px !important;
                display: block !important;
                border-radius: 12px !important;
            }
            .portada .logo {
                font-size: 20px !important;
                font-weight: 800 !important;
                margin: 0 0 8px 0 !important;
                display: block !important;
                color: #fff !important;
                height: auto !important;
            }
            .portada .logo span { color: #e0a83a !important; }
            .portada h1 {
                color:#e0a83a !important;
                font-size: 26px !important;
                margin: 10px 0 !important;
                line-height: 1.2 !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
            }
            .portada .sub {
                color: #cccccc !important;
                font-size: 14px !important;
                margin: 5px 0 !important;
                line-height: 1.4 !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
            }
            .portada .badge {
                display: inline-block !important;
                border: 1px solid #e0a83a !important;
                color: #e0a83a !important;
                padding: 4px 14px !important;
                border-radius: 20px !important;
                margin-top: 15px !important;
                font-size: 10px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                font-weight: 700 !important;
                height: auto !important;
            }
            .wrap { width: 800px !important; padding:0 35px !important; box-sizing: border-box !important; }
            .seccion { page-break-inside: auto !important; padding: 25px 0 !important; border-bottom: 1px solid #eeeeee !important; clear: both; }
            .modulo { border-left: 6px solid #c9851f !important; padding-left: 18px !important; margin: 20px 0 10px !important; font-size: 20px !important; }

            .nota, .aviso, .tip, .info-tecnica, .resumen-ejemplo, .panel-ejemplo, .indice {
                page-break-inside: avoid !important;
                margin: 20px 0 !important;
                padding: 15px 20px !important;
                border-radius: 8px !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                box-sizing: border-box !important;
                width: 100% !important;
            }
            .indice { background: #f4f4f9 !important; border: 1px solid #ddd !important; }
            .indice ol { columns: 2 !important; column-gap: 30px !important; margin: 0 !important; padding-left: 25px !important; }

            figure { page-break-inside: avoid !important; margin: 25px 0 !important; text-align: center !important; width: 100% !important; }
            figure img { max-width: 85% !important; height: auto !important; border-radius: 10px !important; border: 1px solid #ddd !important; }

            table { width: 100% !important; border-collapse: collapse !important; margin: 20px 0 !important; table-layout: fixed !important; }
            th, td { border: 1px solid #eee !important; padding: 8px 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
            th { background-color: #f8f8f8 !important; font-weight: bold !important; }

            a { color: #1a1a1a !important; text-decoration: none !important; }
            p { margin: 10px 0 !important; line-height: 1.5 !important; }
            * { box-sizing: border-box !important; }
          </style>`;

        container.innerHTML = `<div class="pdf-export-body">${styles}${extraCss}${bodyContent}</div>`;

        updateProgress(60, 'Cargando imágenes...');
        // Esperar a que TODAS las imágenes carguen antes de rasterizar
        await Promise.all(Array.from(container.querySelectorAll('img')).map(img =>
          img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
        ));
        await new Promise(r => setTimeout(r, 600));

        updateProgress(80, 'Rasterizando PDF...');
        const opt = {
          margin:       [12, 10, 12, 10],
          filename:     titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim() + '.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            width: 800,
            scrollX: 0,
            scrollY: 0,
            height: container.scrollHeight,
            windowHeight: container.scrollHeight
          },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
        updateProgress(100, '¡Listo!');
        await new Promise(r => setTimeout(r, 400));
        await ManualesView._compartirPDF(pdfBlob, opt.filename, titulo);
      } finally {
        document.body.removeChild(container);
        if (loader) loader.remove();
      }
    } catch (e) {
      console.error('Error al exportar PDF:', e);
      App.toastError('Error al generar PDF: ' + e.message);
      if (loader) loader.remove();
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
