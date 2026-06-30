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
        isMovimiento: true,
        dataRaw: m
      }));

      // Unificar todos los documentos
      // Filtrar de documentos_legales aquellos que ya se representarán a través de movimientos/pedidos para evitar duplicados visuales
      const docsUnificados = [
        ...docs.filter(d => d.tipo !== 'guia_movimiento' && d.tipo !== 'infolac_declaracion'),
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
      main.innerHTML = `<div class="card text-center p-40 text-red">❌ Error: ${e.message}</div>`;
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

    return `
      <div class="card p-12 mb-14 border-222 card-total-3d" style="border-top:5px solid var(--p-gold); width:100%;">
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

      <div class="card p-12 mb-14 border-222 card-dark-gradient border-top-theme pb-24" style="--theme-color: var(--p-gold);">
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

      <div class="card p-12 mb-14 border-222 card-total-3d" style="border-top:5px solid var(--p-gold); width:100%;">
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
      App.toast('✅ Documentos exportados');
    } catch (e) { App.toastError('Error al exportar: ' + e.message); }
  },

  _renderLista(docs, ventaMap) {
    const filtrados = this._currentTab === 'todos'
      ? docs
      : docs.filter(d => (d.tipo || '').toLowerCase() === this._currentTab);

    if (!filtrados.length) {
      return `<div class="empty-state"><div class="empty-state-icon">${Icons.documento()}</div><p class="empty-state-text">No hay documentos ${this._currentTab !== 'todos' ? 'de este tipo' : ''}.</p></div>`;
    }

    const colors = { dimoe: '#10b981', factura: '#3b82f6', certificado: '#f59e0b', dib: '#8b5cf6', crotales: '#d97706' };
    const labels = { dimoe: 'DIMOE (Guía)', factura: 'Factura', certificado: 'Certificado', dib: 'DIB (Identificación)', crotales: 'Pedido Crotales' };

    return `<div class="grid gap-10">
      ${filtrados.map(doc => {
        const color = colors[doc.tipo] || '#666';
        const label = labels[doc.tipo] || doc.tipo;
        const fecha = this._fmtFecha(doc.createdAt || doc.fecha);
        const esBorrador = (doc.estado === 'borrador');
        
        let descHtml = '';
        if (doc.isPedidoCrotales) {
          descHtml = `Especie: <strong>${doc.dataRaw.especie}</strong> &middot; Cantidad: <strong>${doc.dataRaw.cantidad} pares</strong>`;
        } else if (doc.isMovimiento) {
          descHtml = `Movimiento de <strong>${doc.dataRaw.tipo === 'salida' ? 'Salida' : 'Entrada'}</strong> &middot; Animales: <strong>${doc.dataRaw.num_animales}</strong>`;
        } else {
          descHtml = doc.numero || 'Sin número registrado';
        }

        return `
          <div class="card" style="border-left:4px solid ${color};">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-800 text-sm" style="color:${color}; display:flex; align-items:center; gap:6px;">
                  ${doc.tipo === 'crotales' ? Icons.animales() : Icons.documento()}
                  ${label} 
                  ${esBorrador ? `<span class="badge badge-warning ml-6 uppercase font-900" style="background:#f59e0b; color:black; font-size:0.6rem; padding:1px 6px; border-radius:4px;">Borrador</span>` : `<span class="badge badge-success ml-6 uppercase font-900" style="background:#10b981; color:white; font-size:0.6rem; padding:1px 6px; border-radius:4px;">Presentado</span>`}
                </div>
                <div class="font-900 text-white mt-4">${doc.numero || 'S/N'}</div>
              </div>
              <div class="text-xs text-ccc">${fecha}</div>
            </div>
            <div class="mt-6 text-xs text-ccc">
              ${descHtml}
            </div>
            <div class="mt-8 flex gap-6">
              ${esBorrador ? `
                <button class="btn btn-sm btn-outline text-xs" style="color:#f59e0b; border-color:#f59e0b;" onclick="DocumentosView._editarBorrador('${doc.tipo}', ${doc.id})">✏️ Editar Borrador</button>
              ` : `
                <button class="btn btn-sm btn-outline text-xs" onclick="DocumentosView._imprimirDoc('${doc.tipo}', ${doc.id})">🖨 Imprimir PDF</button>
              `}
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
        <div class="card p-16 mb-16 border-222 card-dark-gradient">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-8 text-center">SELECCIONA TIPO DE DOCUMENTO</div>
          <div class="grid grid-cols-2 gap-8">
            ${[
              { id: 'dimoe', label: 'DIMOE (Guías)', icon: Icons.exportar(), color: '#10b981' },
              { id: 'factura', label: 'Facturas', icon: Icons.libroVentas(), color: '#3b82f6' },
              { id: 'certificado', label: 'Certificados', icon: Icons.contratos(), color: '#f59e0b' },
              { id: 'dib', label: 'DIB / Identificación', icon: Icons.informeRega(), color: '#8b5cf6' },
              { id: 'crotales', label: 'Pedidos Crotales', icon: Icons.animales(), color: '#d97706' },
              { id: 'guias', label: 'Guías Movimiento', icon: Icons.exportar(), color: '#10b981' },
              { id: 'libro', label: 'Libro Registro', icon: Icons.libroVentas(), color: '#3b82f6' },
              { id: 'contratos', label: 'Contratos', icon: Icons.contratos(), color: '#8b5cf6' },
              { id: 'cierres', label: 'Cierres / Borradores', icon: Icons.documento(), color: '#f59e0b' },
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
      } else if (tipo === 'dimoe') {
        const m = await window.db.get('movimientos_ganado', Number(id));
        if (m) {
          window.WizardGuiaMovimiento.generarDocumento(finca, m);
        } else { App.toastError("Movimiento no encontrado"); }
      } else {
        App.toast("Impresión nativa disponible en detalles de venta");
      }
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
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    
    let infoExtra = '';
    if (doc.isPedidoCrotales) {
      infoExtra = `
        <div><span class="text-gray">Cantidad:</span> <span class="text-white">${doc.dataRaw.cantidad} pares</span></div>
        <div><span class="text-gray">Especie:</span> <span class="text-white">${doc.dataRaw.especie}</span></div>
        <div><span class="text-gray">Material:</span> <span class="text-white">${doc.dataRaw.tipo}</span></div>
        <div class="col-span-2"><span class="text-gray">ADSG / Destinatario:</span> <span class="text-white">${doc.dataRaw.adsg_nombre}</span></div>
      `;
    } else if (doc.isMovimiento) {
      infoExtra = `
        <div><span class="text-gray">Tipo Mov.:</span> <span class="text-white">${doc.dataRaw.tipo.toUpperCase()}</span></div>
        <div><span class="text-gray">Nº Animales:</span> <span class="text-white">${doc.dataRaw.num_animales}</span></div>
        <div class="col-span-2"><span class="text-gray">REGA Origen:</span> <span class="text-white">${doc.dataRaw.rega_origen}</span></div>
        <div class="col-span-2"><span class="text-gray">REGA Destino:</span> <span class="text-white">${doc.dataRaw.rega_destino}</span></div>
      `;
    } else {
      infoExtra = `<div class="col-span-2"><span class="text-gray-500">Documento General Cargado</span></div>`;
    }

    overlay.innerHTML = `
      <div class="card" style="max-width:500px;width:100%;border-top:4px solid ${color};padding:24px;">
        <div class="flex justify-between items-center mb-14">
          <div>
            <div class="font-800 text-sm" style="color:${color};">${label}</div>
            <div class="font-900 text-white text-lg">${doc.numero || 'S/N'}</div>
          </div>
          <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer;">${Icons.cerrar()}</button>
        </div>
        <div class="grid grid-cols-2 gap-8 text-sm mb-14">
          <div><span class="text-gray">Fecha:</span> <span class="text-white">${this._fmtFecha(doc.createdAt || doc.fecha)}</span></div>
          <div><span class="text-gray">Estado Trámite:</span> <span class="text-gold" style="color:${doc.estado === 'borrador' ? '#f59e0b' : '#10b981'};">${doc.estado.toUpperCase()}</span></div>
          ${infoExtra}
        </div>
        <div class="mt-10 text-center" style="display:flex; gap:10px; justify-content:center;">
          <button class="btn btn-secondary btn-sm" onclick="this.closest('[style]').remove()">Cerrar</button>
          ${doc.estado === 'borrador' ? `
            <button class="btn btn-primary btn-sm" onclick="DocumentosView._editarBorrador('${doc.tipo}', ${doc.id}); this.closest('[style]').remove();">✏️ Editar</button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="DocumentosView._imprimirDoc('${doc.tipo}', ${doc.id}); this.closest('[style]').remove();">🖨 Imprimir</button>
          `}
        </div>
      </div>`;
    document.body.appendChild(overlay);
  },
};

window.DocumentosView = DocumentosView;
