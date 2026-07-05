/**
 * Livestock Manager - DocumentosView v1.1.0
 * Vista de documentos legales: DIMOE, facturas, certificados, DIB y Pedidos de Crotales.
 * Soporta re-impresión de PDFs y edición de borradores.
 */

const DocumentosView = {
  _currentTab: 'todos',

  async render() {
    const main = document.getElementById("app-content");
    main.innerHTML = `<div class="loader">Cargando documentos...</div>`;

    try {
      const docs = await window.db.getAll('documentos_legales').catch(() => []);
      const pedidos = await window.db.getAll('pedidos_crotales').catch(() => []);
      const movimientos = await window.db.getAll('movimientos_ganado').catch(() => []);
      const ventas = await window.db.getAll('comercializacion_carne').catch(() => []);
      
      const ventaMap = {};
      ventas.forEach(v => { ventaMap[v.id] = v; });

      // Normalizar pedidos de crotales para el listado de documentos
      const pedidosNormalizados = pedidos.map(p => ({
        id: p.id,
        tipo: 'crotales',
        numero: p.numero_seguimiento || `PED-${p.id}`,
        fecha: p.fecha_pedido || p.createdAt,
        createdAt: p.fecha_pedido || p.createdAt,
        estado: p.estado || 'borrador',
        acuseManual: p.acuse_manual || p.acuseManual || '',
        isPedidoCrotales: true,
        dataRaw: p
      }));

      // Normalizar movimientos de ganado a DIMOE para que figuren en el listado unificado
      const movimientosNormalizados = movimientos.map(m => ({
        id: m.id,
        tipo: 'dimoe',
        numero: m.numero_guia || 'Borrador',
        fecha: m.fecha || m.creadoEn,
        createdAt: m.creadoEn || m.fecha,
        estado: m.estado_tramite || 'borrador',
        acuseManual: m.acuse_manual || m.acuseManual || '',
        isMovimiento: true,
        dataRaw: m
      }));

      // Unificar todos los documentos
      // Filtrar de documentos_legales aquellos que ya se representarán a través de movimientos/pedidos para evitar duplicados visuales
      const docsNormalizados = docs
        .filter(d => d.tipo !== 'guia_movimiento' && d.tipo !== 'infolac_declaracion')
        .map(d => ({
          id: d.id,
          tipo: d.tipo || 'documento',
          numero: d.numero || d.referencia || 'S/N',
          fecha: d.fecha_emision || d.fecha || d.created_at,
          createdAt: d.created_at || d.fecha_emision || d.fecha,
          estado: d.estado_tramite || d.estado || 'presentado',
          acuseManual: d.acuse_manual || d.acuseManual || '',
          dataRaw: d
        }));

      const docsUnificados = [
        ...docsNormalizados,
        ...pedidosNormalizados,
        ...movimientosNormalizados
      ];

      // Ordenar por fecha descendente
      docsUnificados.sort((a, b) => {
        const fa = a.createdAt || a.fecha || '';
        const fb = b.createdAt || b.fecha || '';
        return fb.localeCompare(fa);
      });

      this._cachedDocs = docsUnificados;
      this._ventaMap = ventaMap;

      main.innerHTML = this._renderHTML(docsUnificados, ventaMap);
      this._setupFilters();
    } catch (e) {
      console.error('[Documentos] Error:', e);
      main.innerHTML = `<div class="card-registro text-center p-40 text-red" style="--registro-color: var(--c-danger);">Error: ${e.message}</div>`;
    }
  },

  _renderHTML(docs, ventaMap) {
    const tiposDoc = ['todos', 'dimoe', 'factura', 'certificado', 'dib', 'crotales'];
    const labels = { 
      todos: `${Icons.documento()} Todos`, 
      dimoe: `${Icons.exportar()} DIMOE`, 
      factura: `${Icons.libroVentas()} Facturas`, 
      certificado: `${Icons.contratos()} Certificados`, 
      dib: `${Icons.informeRega()} DIB`,
      crotales: `${Icons.animales()} Crotales`
    };
    
    const totalDocs = docs.length;
    const porTipo = {};
    docs.forEach(d => { porTipo[d.tipo] = (porTipo[d.tipo] || 0) + 1; });

    const docsRecientes = docs.slice(0, 5);

    const bannerInterno = `
      <div class="card-registro card-dark-gradient border-222 modo-interno-banner mb-14" style="--registro-color: var(--c-warning);"> 
        <div class="section-header-theme" style="--theme-color: var(--c-warning);">${Icons.alerta()} MODO INTERNO SIGGAN</div>
        <p class="text-xs text-aaa mt-6">
          Genera la documentación desde Livestock Manager y sube los ficheros a SIGGAN/BADIGEX de forma manual. Registra aquí el número de acuse o el justificante recibido para mantener la trazabilidad interna.
        </p>
      </div>`;

    return `
      ${bannerInterno}
      <div class="card-registro" style="--registro-color: var(--c-info); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6">${Icons.documento()} DOCUMENTOS</div>
        <div class="grid grid-cols-5 gap-4 mb-6">
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">TOTAL</div>
            <div class="text-base font-black text-blue">${totalDocs}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">DIMOE</div>
            <div class="text-base font-black text-green">${porTipo.dimoe || 0}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">FACTURAS</div>
            <div class="text-base font-black text-amber">${porTipo.factura || 0}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">DIB/REGA</div>
            <div class="text-base font-black text-purple">${porTipo.dib || 0}</div>
          </div>
          <div class="bg-dark rounded-lg p-6 text-center border border-222">
            <div class="text-[0.5rem] text-gray uppercase font-800 tracking-wider">CROTALES</div>
            <div class="text-base font-black text-gold">${porTipo.crotales || 0}</div>
          </div>
        </div>
      </div>

      <div class="card-registro p-12 mb-14 border-222 card-dark-gradient border-top-theme pb-24" style="--theme-color: var(--p-gold); --registro-color: var(--p-gold);">
        <div class="section-header-theme">ACCIONES</div>
        <div class="grid grid-cols-2 gap-10 max-w-320 mx-auto">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="DocumentosView._abrirAsistenteConsulta()">
            ${Icons.buscar()}
            <span class="widget-link-label">Consultar / Imprimir</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-success" onclick="DocumentosView._exportDocs()">
            ${Icons.exportar()}
            <span class="widget-link-label">Exportar Todo</span>
          </button>
        </div>
        <div class="mt-4"><span class="text-xs text-aaa leading-relaxed">${Icons.documento()} Consulta y reimpresión de documentos oficiales por tipo y explotación</span></div>
      </div>

      <div class="card-registro" style="--registro-color: var(--c-info); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6">${Icons.documento()} ÚLTIMOS DOCUMENTOS</div>
        <div id="docs-lista">${this._renderLista(docsRecientes, ventaMap)}</div>
        ${docs.length > 5 ? `<div class="text-center mt-6 pt-6 border-top-222"><span class="text-[0.6rem] text-gray font-900 uppercase tracking-wider">${docs.length - 5} documentos más · usa "Consultar / Imprimir" para ver todos</span></div>` : ''}
      </div>
    `;
  },

  async _exportDocs() {
    try {
      const docs = this._cachedDocs || [];
      if (!docs.length) return App.toastError('No hay documentos para exportar');
      const data = docs.map(d => ({
        Tipo: d.tipo || '', Número: d.numero || '', Fecha: d.fecha || '',
        Estado: d.estado || '', Detalle: d.isPedidoCrotales ? `Pedido Crotales: ${d.dataRaw.cantidad} uds` : (d.isMovimiento ? `Guía Movimiento (${d.dataRaw.tipo})` : '')
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Documentos');
      const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Documentos_${new Date().toISOString().split('T')[0]}.xlsx`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      App.toast('Documentos exportados', 'success');
    } catch (e) { App.toastError('Error al exportar: ' + e.message); }
  },

  _renderLista(docs, ventaMap) {
    const filtrados = this._currentTab === 'todos'
      ? docs
      : docs.filter(d => (d.tipo || '').toLowerCase() === this._currentTab);

    if (!filtrados.length) {
      return `<div class="empty-state"><div class="empty-state-icon">${Icons.documento()}</div><p class="empty-state-text">No hay documentos${this._currentTab !== 'todos' ? ' de este tipo' : ''}.</p></div>`;
    }

    const colors = { dimoe: 'var(--c-success)', factura: 'var(--c-info)', certificado: 'var(--c-warning)', dib: 'var(--c-purple)', crotales: 'var(--c-orange)' };
    const labels = { dimoe: 'DIMOE (Guía)', factura: 'Factura', certificado: 'Certificado', dib: 'DIB (Identificación)', crotales: 'Pedido Crotales' };

    return `<div class="grid gap-10">
      ${filtrados.map(doc => {
        const color = colors[doc.tipo] || '#666';
        const label = labels[doc.tipo] || doc.tipo;
        const fecha = this._fmtFecha(doc.createdAt || doc.fecha);
        const esBorrador = (doc.estado === 'borrador');
        
        let descHtml = '';
        if (doc.isPedidoCrotales) {
          descHtml = `Especie: <strong>${doc.dataRaw.especie ?? '—'}</strong> &middot; Cantidad: <strong>${doc.dataRaw.cantidad ?? '—'}${typeof doc.dataRaw.cantidad === 'number' ? (doc.dataRaw.cantidad === 1 ? ' par' : ' pares') : ''}</strong>`;
        } else if (doc.isMovimiento) {
          descHtml = `Movimiento de <strong>${doc.dataRaw.tipo === 'salida' ? 'Salida' : 'Entrada'}</strong> &middot; Animales: <strong>${doc.dataRaw.num_animales ?? '—'}</strong>`;
        } else {
          descHtml = doc.numero || 'Sin número registrado';
        }

        const acuseHtml = doc.acuseManual
          ? `<div class="text-xs text-green mt-6">${Icons.adjuntar()} Acuse manual: <span class="font-900">${doc.acuseManual}</span></div>`
          : `<div class="text-xs text-red mt-6">${Icons.adjuntar()} Acuse manual pendiente</div>`;

        return `
          <div class="card-registro" style="--registro-color: ${color};">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-800 text-sm" style="color:${color}; display:flex; align-items:center; gap:6px;">
                  ${doc.tipo === 'crotales' ? Icons.animales() : Icons.documento()}
                  ${label} 
                  ${esBorrador ? `<span class="badge badge-warning ml-6 uppercase font-900" style="background:var(--c-warning); color:black; font-size:0.6rem; padding:1px 6px; border-radius:4px;">Borrador</span>` : `<span class="badge badge-success ml-6 uppercase font-900" style="background:var(--c-success); color:white; font-size:0.6rem; padding:1px 6px; border-radius:4px;">Presentado</span>`}
                </div>
                <div class="font-950 text-gold mt-4 uppercase tracking-tight">${doc.numero || 'S/N'}</div>
              </div>
              <div class="text-xs text-ccc">${fecha}</div>
            </div>
            <div class="flex justify-between items-end w-full">
              <div class="flex-1 min-w-0">
                <div class="mt-6 text-xs text-ccc uppercase font-800">
                  ${descHtml}
                </div>
                ${acuseHtml}
              </div>
              <div class="text-right">
                <span style="font-size: 0.7rem; font-weight: 700; color: var(--c-warning); white-space: nowrap;">Ficha -></span>
              </div>
            </div>
            <div class="mt-8 flex gap-6 flex-wrap">
              ${esBorrador ? `
                <button class="btn btn-sm btn-outline text-xs" style="color:var(--c-warning); border-color:var(--c-warning);" onclick="DocumentosView._editarBorrador('${doc.tipo}', ${doc.id})">${Icons.editar()} Editar Borrador</button>
              ` : `
                <button class="btn btn-sm btn-outline text-xs" onclick="DocumentosView._imprimirDoc('${doc.tipo}', ${doc.id})">${Icons.imprimir()} Imprimir PDF</button>
              `}
              <button class="btn btn-sm btn-outline text-xs" onclick="DocumentosView._registrarAcuse(${doc.id}, '${doc.tipo}', ${doc.isMovimiento ? 'true' : 'false'}, ${doc.isPedidoCrotales ? 'true' : 'false'})">${Icons.adjuntar()} Guardar acuse</button>
              <button class="btn btn-sm btn-outline text-xs" onclick="DocumentosView._verDetalle(${doc.id}, '${doc.tipo}')">${Icons.documento()} Detalle</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
  },

  _fmtFecha(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-ES');
    } catch { return dateStr; }
  },

  async _abrirAsistenteConsulta() {
    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.zIndex = '7000';
    overlay.innerHTML = `
      <div class="wizard-header-fixed text-center">
        <button onclick="this.closest('.wizard-full-screen').remove()" class="btn-pesaje-close">${Icons.cerrar()}</button>
        <h2 class="pesaje-titulo-h2">${Icons.buscar()} CONSULTAR / IMPRIMIR</h2>
      </div>
      <div class="wizard-content-scrollable">
        <div class="card-registro p-16 mb-16 border-222 card-dark-gradient" style="--registro-color: var(--c-info);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-8 text-center">SELECCIONA TIPO DE DOCUMENTO</div>
          <div class="grid grid-cols-2 gap-8">
            ${[
              { id: 'dimoe', label: 'DIMOE (Guías)', icon: Icons.exportar(), color: 'var(--c-success)' },
              { id: 'factura', label: 'Facturas', icon: Icons.libroVentas(), color: 'var(--c-info)' },
              { id: 'certificado', label: 'Certificados', icon: Icons.contratos(), color: 'var(--c-warning)' },
              { id: 'dib', label: 'DIB / Identificación', icon: Icons.informeRega(), color: 'var(--c-purple)' },
              { id: 'crotales', label: 'Pedidos Crotales', icon: Icons.animales(), color: 'var(--c-orange)' },
              { id: 'guias', label: 'Guías Movimiento', icon: Icons.exportar(), color: 'var(--c-success)' },
              { id: 'libro', label: 'Libro Registro', icon: Icons.libroVentas(), color: 'var(--c-info)' },
              { id: 'contratos', label: 'Contratos', icon: Icons.contratos(), color: 'var(--c-purple)' },
              { id: 'cierres', label: 'Cierres / Borradores', icon: Icons.documento(), color: 'var(--c-warning)' },
              { id: 'todos', label: 'Todos los documentos', icon: Icons.documento(), color: '#888' },
            ].map(t => `
              <button class="widget-link-btn widget-link-btn--neon" style="--neon-color:${t.color};--neon-glow:${t.color}B0;--neon-inner:${t.color}40;"
                onclick="DocumentosView._filtrarYMostrar('${t.id}');this.closest('.wizard-full-screen').remove()">
                ${t.icon}
                <span class="widget-link-label">${t.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  },

  _filtrarYMostrar(tipo) {
    const docs = this._cachedDocs || [];
    const filtrados = tipo === 'todos' ? docs : docs.filter(d => {
      if (tipo === 'guias') return d.tipo === 'dimoe' || d.isMovimiento;
      if (tipo === 'libro') return d.tipo === 'dib' || d.tipo === 'certificado';
      if (tipo === 'contratos') return d.tipo === 'factura' || d.tipo === 'certificado';
      if (tipo === 'cierres') return d.estado === 'borrador';
      return (d.tipo || '') === tipo;
    });
    const lista = document.getElementById('docs-lista');
    if (lista) {
      lista.innerHTML = this._renderLista(filtrados, this._ventaMap || {});
    }
  },

  _setupFilters() {
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    const lista = document.getElementById('docs-lista');
    if (lista) {
      lista.innerHTML = this._renderLista(this._cachedDocs || [], this._ventaMap || {});
    }
  },

  async _editarBorrador(tipo, id) {
    try {
      if (tipo === 'crotales') {
        const p = await window.db.get('pedidos_crotales', Number(id));
        if (p) {
          await window.WizardCrotales.abrirPedido(p);
        } else { App.toastError("Borrador no encontrado"); }
      } else if (tipo === 'dimoe') {
        const m = await window.db.get('movimientos_ganado', Number(id));
        if (m) {
          await window.WizardGuiaMovimiento.abrir(m);
        } else { App.toastError("Borrador no encontrado"); }
      } else {
        App.toast("Los borradores de este tipo se modifican en sus respectivos módulos");
      }
    } catch (e) {
      App.toastError("Error al abrir borrador: " + e.message);
    }
  },

  async _imprimirDoc(tipo, id) {
    try {
      const finca = await window.Fincas.getActive();
      if (!finca) return App.toastError("No hay finca activa");
      
      if (tipo === 'crotales') {
        const p = await window.db.get('pedidos_crotales', Number(id));
        if (p) {
          await window.WizardCrotales.generarPDF(finca, p, p.id);
        } else { App.toastError("Pedido no encontrado"); }
        return;
      }
      if (tipo === 'dimoe') {
        const m = await window.db.get('movimientos_ganado', Number(id));
        if (m) {
          window.WizardGuiaMovimiento.generarDocumento(finca, m);
        } else { App.toastError("Movimiento no encontrado"); }
        return;
      }

      // Para el resto de tipos (factura, certificado, dib), generar PDF genérico
      const doc = (this._cachedDocs || []).find(d => d.id === id && d.tipo === tipo);
      if (!doc) { App.toastError("Documento no encontrado"); return; }

      const color = { dimoe: 'var(--c-success)', factura: 'var(--c-info)', certificado: 'var(--c-warning)', dib: 'var(--c-purple)', crotales: 'var(--c-orange)' }[tipo] || '#666';
      const label = { dimoe: 'DIMOE (Guía)', factura: 'Factura', certificado: 'Certificado', dib: 'DIB (Identificación)', crotales: 'Pedido Crotales' }[tipo] || tipo;

      const overlay = document.createElement('div');
      overlay.id = 'doc-pdf-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:6000;background:#fff;color:#000;display:flex;flex-direction:column;';
      overlay.innerHTML = `
        <div id="doc-pdf-content" style="flex:1;padding:40px;font-family:serif;overflow-y:auto;">
          <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:30px;">
            <h1 style="margin:0;font-size:1.4rem;text-transform:uppercase;">${label}</h1>
            <p style="color:#555;margin:5px 0 0 0;">${finca.nombre} · ${finca.codigo_REGA || finca.rega || ''}</p>
          </div>
          <div style="margin-bottom:20px;font-size:0.9rem;">
            <p><strong>Número:</strong> ${doc.numero || 'S/N'}</p>
            <p><strong>Fecha:</strong> ${this._fmtFecha(doc.createdAt || doc.fecha)}</p>
            <p><strong>Estado:</strong> ${(doc.estado || '').toUpperCase()}</p>
            ${doc.isPedidoCrotales ? `<p><strong>Especie:</strong> ${doc.dataRaw.especie ?? '—'} · <strong>Cantidad:</strong> ${doc.dataRaw.cantidad ?? '—'}${typeof doc.dataRaw.cantidad === 'number' ? (doc.dataRaw.cantidad === 1 ? ' par' : ' pares') : ''} · <strong>Material:</strong> ${doc.dataRaw.tipo ?? '—'}</p>` : ''}
            ${doc.isMovimiento ? `<p><strong>Tipo:</strong> ${doc.dataRaw.tipo ?? '—'} · <strong>Animales:</strong> ${doc.dataRaw.num_animales ?? '—'}</p>` : ''}
          </div>
          <div style="padding:20px;border:1px solid #ccc;background:#f9f9f9;font-size:0.85rem;margin-top:40px;">
            <p style="margin:0;"><strong>Documento generado por Livestock Manager Premium</strong></p>
            <p style="margin:5px 0 0 0;color:#555;">Plataforma profesional de gestión ganadera y trazabilidad industrial.</p>
          </div>
        </div>
        <div style="text-align:center;padding:16px;display:flex;gap:10px;justify-content:center;background:#eee;">
          <button class="btn btn-primary" id="btn-doc-descargar" style="width:auto;padding:0 30px;background:${color};color:#fff;font-weight:bold;">${Icons.exportar()} DESCARGAR</button>
          <button class="btn btn-secondary" onclick="document.getElementById('doc-pdf-overlay').remove()" style="width:auto;padding:0 30px;">CERRAR</button>
        </div>`;
      document.body.appendChild(overlay);

      overlay.querySelector('#btn-doc-descargar').onclick = async () => {
        try {
          const el = document.getElementById('doc-pdf-content');
          if (!el) return App.toastError("Contenido no disponible");
          const filename = `${label.replace(/\s+/g, '_')}_${doc.numero || doc.id}_${Date.now()}.pdf`;
          if (typeof html2pdf !== 'undefined') {
            await html2pdf().set({ margin: 10, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(el).save(filename);
          } else {
            const win = window.open('', '_blank');
            if (win) { win.document.write('<html><head><title>' + filename + '</title><style>body{font-family:serif;padding:40px;color:#000;background:#fff;}</style></head><body>' + el.innerHTML + '</body></html>'); win.document.close(); win.print(); }
          }
          App.toast("Documento descargado", 'success');
        } catch (e) { App.toastError("Error: " + e.message); }
      };
    } catch (e) {
      App.toastError("Error al imprimir: " + e.message);
    }
  },

  async _verDetalle(docId, tipo) {
    const doc = (this._cachedDocs || []).find(d => d.id === docId && d.tipo === tipo);
    if (!doc) { App.toastError('Documento no encontrado'); return; }
    
    const colors = { dimoe: '#10b981', factura: '#3b82f6', certificado: '#f59e0b', dib: '#8b5cf6', crotales: '#d97706' };
    const labels = { dimoe: 'DIMOE (Guía)', factura: 'Factura', certificado: 'Certificado', dib: 'DIB (Identificación)', crotales: 'Pedido Crotales' };
    const color = colors[doc.tipo] || '#666';
    const label = labels[doc.tipo] || doc.tipo;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.id = `doc-detail-overlay-${docId}`;
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    let infoExtra = '';
    if (doc.isPedidoCrotales) {
      infoExtra = `
        <div><span class="text-gray">Cantidad:</span> <span class="text-white">${doc.dataRaw.cantidad ?? '—'}${typeof doc.dataRaw.cantidad === 'number' ? (doc.dataRaw.cantidad === 1 ? ' par' : ' pares') : ''}</span></div>
        <div><span class="text-gray">Especie:</span> <span class="text-white">${doc.dataRaw.especie ?? '—'}</span></div>
        <div><span class="text-gray">Material:</span> <span class="text-white">${doc.dataRaw.tipo ?? '—'}</span></div>
        <div class="col-span-2"><span class="text-gray">ADSG / Destinatario:</span> <span class="text-white">${doc.dataRaw.adsg_nombre || '—'}</span></div>
      `;
    } else if (doc.isMovimiento) {
      infoExtra = `
        <div><span class="text-gray">Tipo Mov.:</span> <span class="text-white">${(doc.dataRaw.tipo || '').toUpperCase()}</span></div>
        <div><span class="text-gray">Nº Animales:</span> <span class="text-white">${doc.dataRaw.num_animales ?? '—'}</span></div>
        <div class="col-span-2"><span class="text-gray">REGA Origen:</span> <span class="text-white">${doc.dataRaw.rega_origen || '—'}</span></div>
        <div class="col-span-2"><span class="text-gray">REGA Destino:</span> <span class="text-white">${doc.dataRaw.rega_destino || '—'}</span></div>
      `;
    } else {
      infoExtra = `<div class="col-span-2"><span class="text-gray-500">Documento general cargado</span></div>`;
    }

    const acuseTexto = doc.acuseManual
      ? `<span class="text-green">${Icons.adjuntar()} Acuse manual: ${doc.acuseManual}</span>`
      : `<span class="text-red">${Icons.adjuntar()} Acuse manual pendiente</span>`;

    overlay.innerHTML = `
      <div class="card-registro" style="max-width:520px;width:100%;padding:24px;; --registro-color: var(--c-gray);">
        <div class="flex justify-between items-start mb-10">
          <div>
            <div class="font-800 text-sm" style="color:${color};">${label}</div>
            <div class="font-900 text-white text-lg">${doc.numero || 'S/N'}</div>
            <div class="text-xs text-ccc mt-2">${this._fmtFecha(doc.createdAt || doc.fecha)}</div>
          </div>
          <button onclick="document.getElementById('doc-detail-overlay-${docId}').remove()" style="background:none;border:none;color:#888;font-size:1.3rem;cursor:pointer;">${Icons.cerrar()}</button>
        </div>
        <div class="grid grid-cols-2 gap-8 text-xs text-ccc mb-8">
          <div><span class="text-gray">Estado:</span> <span class="text-white">${(doc.estado || 'desconocido').toUpperCase()}</span></div>
          <div><span class="text-gray">Tipo:</span> <span class="text-white">${doc.tipo}</span></div>
          ${infoExtra}
        </div>
        <div class="text-xs mb-8">${acuseTexto}</div>
        <div class="flex flex-wrap gap-8 justify-end text-xs">
          <button class="btn btn-sm" onclick="document.getElementById('doc-detail-overlay-${docId}').remove()">Cerrar</button>
          <button class="btn btn-sm btn-outline" onclick="DocumentosView._registrarAcuse(${doc.id}, '${doc.tipo}', ${doc.isMovimiento ? 'true' : 'false'}, ${doc.isPedidoCrotales ? 'true' : 'false'})">${Icons.adjuntar()} Registrar acuse</button>
          ${doc.estado === 'borrador' ? `
            <button class="btn btn-sm btn-primary" onclick="DocumentosView._editarBorrador('${doc.tipo}', ${doc.id}); document.getElementById('doc-detail-overlay-${docId}').remove();">${Icons.editar()} Editar</button>
          ` : `
            <button class="btn btn-sm btn-primary" onclick="DocumentosView._imprimirDoc('${doc.tipo}', ${doc.id}); document.getElementById('doc-detail-overlay-${docId}').remove();">${Icons.imprimir()} Imprimir</button>
          `}
        </div>
      </div>`;
    document.body.appendChild(overlay);
  },

  async _registrarAcuse(docId, tipo, esMovimiento, esPedidoCrotales) {
    try {
      const detailOverlay = document.getElementById(`doc-detail-overlay-${docId}`);
      if (detailOverlay) detailOverlay.remove();

      let registro = null;
      if (esMovimiento) {
        registro = await window.db.get('movimientos_ganado', Number(docId));
      } else if (esPedidoCrotales) {
        registro = await window.db.get('pedidos_crotales', Number(docId));
      } else {
        registro = await window.db.get('documentos_legales', Number(docId));
      }
      if (!registro) throw new Error('Documento no encontrado');

      const valorActual = registro.acuse_manual || '';
      this._mostrarAcuseModal({
        docId,
        tipo,
        esMovimiento,
        esPedidoCrotales,
        valorActual
      });
    } catch (e) {
      App.toastError('Error al abrir acuse: ' + e.message);
    }
  },

  _mostrarAcuseModal({ docId, tipo, esMovimiento, esPedidoCrotales, valorActual }) {
    const existing = document.getElementById('acuse-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'acuse-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const docLabels = { dimoe: 'Guía DIMOE', factura: 'Factura', certificado: 'Certificado', dib: 'DIB (Identificación)', crotales: 'Pedido de Crotales' };
    const docLabel = esPedidoCrotales ? 'Pedido de Crotales' : (docLabels[tipo] || 'Documento');
    overlay.innerHTML = `
      <div class="card-registro" style="max-width:520px;width:100%;padding:24px;; --registro-color: var(--c-gray);">
        <div class="flex justify-between items-center mb-8">
          <div>
            <div class="font-900 text-sm" style="color:var(--c-warning);">${docLabel}</div>
            <div class="text-xs text-aaa">Introduce el número de acuse o referencia oficial</div>
          </div>
          <button id="acuse-close" style="background:none;border:none;color:#888;font-size:1.3rem;cursor:pointer;">${Icons.cerrar()}</button>
        </div>
        <label class="text-xs text-gray mb-2" for="acuse-input">Referencia / justificante</label>
        <input id="acuse-input" type="text" class="wizard-input font-800" placeholder="Ej: SIGGAN-2026-000123" value="${valorActual.replace(/"/g, '&quot;')}">
        <div class="text-[0.65rem] text-aaa mt-2">Puedes pegar el código del acuse, URL o anotación breve.</div>
        <div class="flex gap-8 justify-end mt-10">
          <button class="btn btn-sm" id="acuse-cancel">Cancelar</button>
          <button class="btn btn-sm btn-primary" id="acuse-save">Guardar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const input = overlay.querySelector('#acuse-input');
    setTimeout(() => { input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); }, 120);

    overlay.querySelector('#acuse-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#acuse-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#acuse-save').addEventListener('click', async () => {
      const valor = input.value;
      const ok = await this._guardarAcuseValor({ docId, tipo, esMovimiento, esPedidoCrotales, valor });
      if (ok) overlay.remove();
    });
  },

  async _guardarAcuseValor({ docId, tipo, esMovimiento, esPedidoCrotales, valor }) {
    const referencia = (valor || '').trim();
    if (!referencia) {
      App.toastError('Referencia vacía. No se registró ningún acuse.');
      return false;
    }

    try {
      if (esMovimiento) {
        const movimiento = await window.db.get('movimientos_ganado', Number(docId));
        if (!movimiento) throw new Error('Movimiento no encontrado');
        movimiento.acuse_manual = referencia;
        movimiento.actualizadoEn = new Date().toISOString();
        await window.db.put('movimientos_ganado', movimiento);
      } else if (esPedidoCrotales) {
        const pedido = await window.db.get('pedidos_crotales', Number(docId));
        if (!pedido) throw new Error('Pedido no encontrado');
        pedido.acuse_manual = referencia;
        pedido.actualizadoEn = new Date().toISOString();
        await window.db.put('pedidos_crotales', pedido);
      } else {
        const registro = await window.db.get('documentos_legales', Number(docId));
        if (!registro) throw new Error('Documento no encontrado');
        registro.acuse_manual = referencia;
        registro.actualizadoEn = new Date().toISOString();
        await window.db.put('documentos_legales', registro);
      }

      App.toast('Acuse manual registrado');
      this.render();
      return true;
    } catch (e) {
      App.toastError('Error al registrar acuse: ' + e.message);
      return false;
    }
  },
};

window.DocumentosView = DocumentosView;
