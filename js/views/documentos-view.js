/**
 * Livestock Manager - DocumentosView v1.0.0
 * Vista de documentos legales: DIMOE, facturas, certificados, DIB.
 */

const DocumentosView = {
  _currentTab: 'todos',

  async render() {
    const main = document.getElementById("app-content");
    main.innerHTML = `<div class="loader">Cargando documentos...</div>`;

    try {
      const docs = await window.db.getAll('documentos_legales').catch(() => []);
      const ventas = await window.db.getAll('comercializacion_carne').catch(() => []);
      const ventaMap = {};
      ventas.forEach(v => { ventaMap[v.id] = v; });

      // Ordenar por fecha descendente
      docs.sort((a, b) => {
        const fa = a.createdAt || a.fecha || '';
        const fb = b.createdAt || b.fecha || '';
        return fb.localeCompare(fa);
      });

      this._cachedDocs = docs;
      this._ventaMap = ventaMap;

      main.innerHTML = this._renderHTML(docs, ventaMap);
      this._setupFilters();
    } catch (e) {
      console.error('[Documentos] Error:', e);
      main.innerHTML = `<div class="card text-center p-40 text-red">❌ Error: ${e.message}</div>`;
    }
  },

  _renderHTML(docs, ventaMap) {
    const tiposDoc = ['todos', 'dimoe', 'factura', 'certificado', 'dib'];
    const labels = { todos: '📋 Todos', dimoe: '📄 DIMOE', factura: '🧾 Facturas', certificado: '📜 Certificados', dib: '🏛️ DIB' };
    const colors = { dimoe: '#10b981', factura: '#3b82f6', certificado: '#f59e0b', dib: '#8b5cf6' };

    return `
      <div class="mb-16">
        <div class="tabs-scroll scroll-shadow-container mb-12" style="overflow-x:auto; -webkit-overflow-scrolling:touch; white-space:nowrap;">
          ${tiposDoc.map(t => `
            <button class="filter-pill filter-pill-gold font-800 ${this._currentTab === t ? 'active' : ''}"
              onclick="DocumentosView._cambiarTab('${t}')"
              style="text-transform:uppercase; letter-spacing:0.3px; display:inline-flex; gap:4px;">
              ${labels[t] || t}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="docs-lista">${this._renderLista(docs, ventaMap)}</div>
    `;
  },

  _renderLista(docs, ventaMap) {
    const filtrados = this._currentTab === 'todos'
      ? docs
      : docs.filter(d => (d.tipo || '').toLowerCase() === this._currentTab);

    if (!filtrados.length) {
      return `<div class="empty-state"><div class="empty-state-icon">📄</div><p class="empty-state-text">No hay documentos ${this._currentTab !== 'todos' ? 'de este tipo' : ''}.</p></div>`;
    }

    const colors = { dimoe: '#10b981', factura: '#3b82f6', certificado: '#f59e0b', dib: '#8b5cf6' };
    const labels = { dimoe: 'DIMOE', factura: 'Factura', certificado: 'Certificado', dib: 'DIB' };

    return `<div class="grid gap-10">
      ${filtrados.map(doc => {
        const venta = doc.ventaId ? ventaMap[doc.ventaId] : null;
        const color = colors[doc.tipo] || '#666';
        const label = labels[doc.tipo] || doc.tipo;
        const numAlbaran = venta ? (venta.numero_albaran || `#${venta.id}`) : '—';
        const fecha = this._fmtFecha(doc.createdAt || doc.fecha);
        return `
          <div class="card" style="border-left:4px solid ${color};">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-800 text-sm" style="color:${color};">${label}</div>
                <div class="font-900 text-white">${doc.numero || 'S/N'}</div>
              </div>
              <div class="text-xs text-ccc">${fecha}</div>
            </div>
            <div class="mt-6 text-xs text-ccc">
              Albarán: ${numAlbaran}
              ${venta ? `<span class="text-gold ml-10">${venta.comprador_nombre || ''}</span>` : ''}
            </div>
            <div class="mt-8 flex gap-6">
              <button class="btn btn-sm btn-outline text-xs" onclick="DocumentosView._verVenta(${doc.ventaId || 0})">👁 Ver venta</button>
              <button class="btn btn-sm btn-outline text-xs" onclick="DocumentosView._verDetalle(${doc.id || 0})">📄 Detalle</button>
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

  _setupFilters() {
    // Scroll shadows via MutationObserver automático
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    const lista = document.getElementById('docs-lista');
    if (lista) {
      lista.innerHTML = this._renderLista(this._cachedDocs || [], this._ventaMap || {});
    }
  },

  _verVenta(ventaId) {
    if (ventaId) {
      location.hash = `#/trazabilidad?id=${ventaId}`;
    } else {
      App.toast('Venta no encontrada');
    }
  },

  _verDetalle(docId) {
    const doc = (this._cachedDocs || []).find(d => d.id === docId);
    if (!doc) { App.toastError('Documento no encontrado'); return; }
    const venta = doc.ventaId ? (this._ventaMap || {})[doc.ventaId] : null;
    const colors = { dimoe: '#10b981', factura: '#3b82f6', certificado: '#f59e0b', dib: '#8b5cf6' };
    const labels = { dimoe: 'DIMOE', factura: 'Factura', certificado: 'Certificado', dib: 'DIB' };
    const color = colors[doc.tipo] || '#666';
    const label = labels[doc.tipo] || doc.tipo;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="card" style="max-width:500px;width:100%;border-top:4px solid ${color};padding:24px;">
        <div class="flex justify-between items-center mb-14">
          <div>
            <div class="font-800 text-sm" style="color:${color};">${label}</div>
            <div class="font-900 text-white text-lg">${doc.numero || 'S/N'}</div>
          </div>
          <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer;">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-8 text-sm mb-14">
          <div><span class="text-gray">Fecha:</span> <span class="text-white">${this._fmtFecha(doc.createdAt || doc.fecha)}</span></div>
          <div><span class="text-gray">Tipo:</span> <span class="text-white" style="color:${color};">${label}</span></div>
          ${venta ? `
            <div><span class="text-gray">Albarán:</span> <span class="text-white">${venta.numero_albaran || '#' + venta.id}</span></div>
            <div><span class="text-gray">Comprador:</span> <span class="text-white">${venta.comprador_nombre || '—'}</span></div>
            <div><span class="text-gray">Importe:</span> <span class="text-white">${(venta.precio_total || 0).toFixed(2)} €</span></div>
            <div><span class="text-gray">Kg:</span> <span class="text-white">${(venta.peso_canal || 0).toFixed(1)} kg</span></div>
          ` : '<div class="col-span-2"><span class="text-gray-500">Sin venta asociada</span></div>'}
        </div>
        <div class="mt-10 text-center">
          <button class="btn btn-secondary btn-sm" onclick="this.closest('[style]').remove()">Cerrar</button>
          ${doc.ventaId ? `<button class="btn btn-primary btn-sm ml-10" onclick="DocumentosView._verVenta(${doc.ventaId}); this.closest('[style]').remove();">👁 Ver venta</button>` : ''}
        </div>
      </div>`;
    document.body.appendChild(overlay);
  },
};

window.DocumentosView = DocumentosView;
