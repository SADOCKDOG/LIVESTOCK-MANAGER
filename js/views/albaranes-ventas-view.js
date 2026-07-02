/**
 * Livestock Manager - AlbaranesVentasView v1.0.0
 * Historial integrado de albaranes de leche y registros de ventas de carne para todos los tipos de explotación.
 * Soporta re-impresión de albaranes y edición de borradores.
 */

const AlbaranesVentasView = {
  _currentTab: 'todos',
  _searchQuery: '',

  async render() {
    const main = document.getElementById("app-content");
    main.innerHTML = `<div class="loader">Cargando albaranes y ventas...</div>`;

    try {
      const fincaId = await window.Fincas.getActiveId();
      if (!fincaId) return App.toastError("No hay finca activa");

      const ventasCarne = await window.db.getAllFromIndex('comercializacion_carne', 'fincaId', Number(fincaId)).catch(() => []);
      const ventasLeche = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', Number(fincaId)).catch(() => []);

      // Normalizar registros de carne
      const carneNormalizados = ventasCarne.map(v => ({
        id: v.id,
        tipo: 'carne',
        titulo: `Venta de Animales`,
        comprador: v.razonSocial || 'Comprador Desconocido',
        fecha: v.fecha || v.fechaSacrificio || v.creadoEn,
        cantidad: v.num_animales || (v.animalId ? v.animalId.length : 1),
        unidad: 'cabezas',
        importe: v.importe_total || (v.precio_total || 0),
        estado: v.estado_tramite || 'presentado', // Las ventas de carne suelen guardarse presentadas
        numero: v.numero_albaran || `ALB-C-${v.id}`,
        dataRaw: v
      }));

      // Normalizar registros de leche
      const lecheNormalizados = ventasLeche.map(v => ({
        id: v.id,
        tipo: 'leche',
        titulo: `Entrega de Leche`,
        comprador: v.comprador_nombre || 'Compradora Láctea',
        fecha: v.fechaRecogida || v.creadoEn,
        cantidad: v.cantidad,
        unidad: 'litros',
        importe: v.importe_total || 0,
        estado: v.estado_tramite_infolac || 'borrador', // Infolac admite borrador
        numero: v.numero_infolac || `ALB-L-${v.id}`,
        dataRaw: v
      }));

      // Unificar listado
      const todosRegistros = [...carneNormalizados, ...lecheNormalizados];

      // Ordenar por fecha descendente
      todosRegistros.sort((a, b) => {
        const fa = a.fecha || '';
        const fb = b.fecha || '';
        return fb.localeCompare(fa);
      });

      this._cachedRegistros = todosRegistros;

      main.innerHTML = this._renderHTML(todosRegistros);
    } catch (e) {
      console.error('[AlbaranesVentasView] Error:', e);
      main.innerHTML = `<div class="card text-center p-40 text-red">❌ Error: ${e.message}</div>`;
    }
  },

  _renderHTML(registros) {
    const tipos = ['todos', 'leche', 'carne'];
    const labels = {
      todos: `${Icons.comercial()} Todos`,
      leche: `${Icons.leche()} Leche`,
      carne: `${Icons.carne()} Carne`
    };

    // Calcular estadísticas sumarias
    const totalVentas = registros.length;
    const totalLeche = registros.filter(r => r.tipo === 'leche').reduce((acc, r) => acc + (r.importe || 0), 0);
    const totalCarne = registros.filter(r => r.tipo === 'carne').reduce((acc, r) => acc + (r.importe || 0), 0);
    const totalImporte = totalLeche + totalCarne;

    return `
      <div class="grid grid-cols-4 gap-6 mb-14">
        <div class="info-box-center border-left-blue"><small class="s-lbl">TOTAL REGISTROS</small><div class="inf-val-lg text-blue">${totalVentas}</div></div>
        <div class="info-box-center border-left-green"><small class="s-lbl">TOTAL FACTURADO</small><div class="inf-val-lg text-green">${totalImporte.toFixed(2)} €</div></div>
        <div class="info-box-center border-left-amber"><small class="s-lbl">ENTREGAS LECHE</small><div class="inf-val-lg text-amber">${totalLeche.toFixed(2)} €</div></div>
        <div class="info-box-center border-left-gold"><small class="s-lbl">VENTAS CARNE</small><div class="inf-val-lg text-gold">${totalCarne.toFixed(2)} €</div></div>
      </div>

      <div class="card p-14 mb-14 flex items-center justify-between gap-10">
        <div class="flex-1">
          <input type="text" id="sales-search-input" placeholder="Buscar por comprador, número de albarán..." class="wizard-input text-sm" value="${this._searchQuery}" oninput="AlbaranesVentasView._buscar(this.value)">
        </div>
      </div>

      <div class="mb-16">
        <div class="flex gap-6 mb-10">
          <div class="tabs-scroll scroll-shadow-container flex-1 nowrap">
            ${tipos.map(t => `
              <button class="filter-pill filter-pill-gold font-800 uppercase inline-flex gap-4 ${this._currentTab === t ? 'active' : ''}"
                onclick="AlbaranesVentasView._cambiarTab('${t}')"
                style="letter-spacing:0.3px;">
                ${labels[t] || t}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div id="sales-lista">${this._renderLista(registros)}</div>
    `;
  },

  _renderLista(registros) {
    let filtrados = this._currentTab === 'todos' 
      ? registros 
      : registros.filter(r => r.tipo === this._currentTab);

    if (this._searchQuery.trim()) {
      const q = this._searchQuery.toLowerCase();
      filtrados = filtrados.filter(r => 
        r.comprador.toLowerCase().includes(q) || 
        r.numero.toLowerCase().includes(q) || 
        r.titulo.toLowerCase().includes(q)
      );
    }

    if (!filtrados.length) {
      return `<div class="empty-state"><div class="empty-state-icon">${Icons.comercial()}</div><p class="empty-state-text">No hay registros de comercialización.</p></div>`;
    }

    const colors = { leche: 'var(--c-warning)', carne: 'var(--c-warning)' };
    const badgeColors = { borrador: 'var(--c-warning)', presentado: 'var(--c-success)', validado: 'var(--c-info)' };

    return `<div class="grid gap-10">
      ${filtrados.map(reg => {
        const color = colors[reg.tipo] || '#666';
        const badgeColor = badgeColors[reg.estado] || '#666';
        const fecha = this._fmtFecha(reg.fecha);
        const esBorrador = reg.estado === 'borrador';

        return `
          <div class="card" style="border-left:4px solid ${color};">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-800 text-xs" style="color:${color}; display:flex; align-items:center; gap:6px;">
                  ${reg.tipo === 'leche' ? Icons.leche() : Icons.carne()}
                  ${reg.tipo.toUpperCase()}
                  <span class="badge uppercase font-900 ml-6" style="background:${badgeColor}; color:${reg.estado === 'borrador' ? 'black' : 'white'}; font-size:0.6rem; padding:1px 6px; border-radius:4px;">
                    ${reg.estado}
                  </span>
                </div>
                <div class="font-900 text-white text-base mt-4">${reg.titulo} (${reg.numero})</div>
              </div>
              <div class="text-xs text-ccc">${fecha}</div>
            </div>
            <div class="mt-8 grid grid-cols-2 gap-4 text-xs text-ccc">
              <div>Comprador: <span class="text-white font-800">${reg.comprador}</span></div>
              <div>Importe: <span class="text-green font-950">${reg.importe.toFixed(2)} €</span></div>
              <div>Volumen: <span class="text-gold font-800">${reg.cantidad.toLocaleString()} ${reg.unidad}</span></div>
            </div>
            <div class="mt-10 flex gap-6">
              ${esBorrador ? `
                <button class="btn btn-sm btn-outline text-xs" style="color:var(--c-warning); border-color:var(--c-warning);" onclick="AlbaranesVentasView._editarBorrador('${reg.tipo}', ${reg.id})">${Icons.editar()} Editar Borrador</button>
              ` : `
                <button class="btn btn-sm btn-outline text-xs" onclick="AlbaranesVentasView._imprimirDoc('${reg.tipo}', ${reg.id})">${Icons.exportar()} Imprimir Albarán</button>
              `}
              <button class="btn btn-sm btn-outline text-xs" onclick="AlbaranesVentasView._verDetalle(${reg.id}, '${reg.tipo}')">${Icons.documento()} Ver Detalle</button>
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

  _cambiarTab(tab) {
    this._currentTab = tab;
    const lista = document.getElementById('sales-lista');
    if (lista) {
      lista.innerHTML = this._renderLista(this._cachedRegistros || []);
    }
  },

  _buscar(query) {
    this._searchQuery = query;
    const lista = document.getElementById('sales-lista');
    if (lista) {
      lista.innerHTML = this._renderLista(this._cachedRegistros || []);
    }
  },

  async _editarBorrador(tipo, id) {
    try {
      const reg = await window.db.get(tipo === 'leche' ? 'comercializacion_leche' : 'comercializacion_carne', Number(id));
      if (!reg) return App.toastError("Registro no encontrado");
      
      if (tipo === 'leche') {
        await window.AlbaranLecheWizard.open(reg);
      } else {
        await window.VentaMasivaWizard.open(reg);
      }
    } catch (e) {
      App.toastError("Error al abrir borrador: " + e.message);
    }
  },

  async _imprimirDoc(tipo, id) {
    try {
      const reg = await window.db.get(tipo === 'leche' ? 'comercializacion_leche' : 'comercializacion_carne', Number(id));
      if (!reg) return App.toastError("Registro no encontrado");
      
      const est = await window.Trazabilidad.generarEstructuraAlbaran(window.db, reg, tipo);
      await App.imprimirAlbaran(est, tipo);
    } catch (e) {
      App.toastError("Error al imprimir: " + e.message);
    }
  },

  async _verDetalle(id, tipo) {
    try {
      const reg = await window.db.get(tipo === 'leche' ? 'comercializacion_leche' : 'comercializacion_carne', Number(id));
      if (!reg) return App.toastError("Registro no encontrado");

      const colors = { leche: 'var(--c-warning)', carne: 'var(--c-warning)' };
      const color = colors[tipo] || '#666';
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

      let detalleHtml = '';
      if (tipo === 'leche') {
        detalleHtml = `
          <div><span class="text-gray">Litros:</span> <span class="text-white">${reg.cantidad.toLocaleString()} L</span></div>
          <div><span class="text-gray">Temperatura:</span> <span class="text-white">${reg.temperatura} ºC</span></div>
          <div><span class="text-gray">Grasa:</span> <span class="text-white">${reg.laboratorio?.grasa || 0} %</span></div>
          <div><span class="text-gray">Proteína:</span> <span class="text-white">${reg.laboratorio?.proteina || 0} %</span></div>
          <div><span class="text-gray">Cél. Somáticas:</span> <span class="text-white">${reg.laboratorio?.somaticas || 0} k/mL</span></div>
          <div><span class="text-gray">Bacterias:</span> <span class="text-white">${reg.laboratorio?.germenes || 0} k/mL</span></div>
          <div><span class="text-gray">Inhibidores/Antibi.:</span> <span class="text-white" style="color:${reg.antibioticos ? 'var(--c-danger)' : 'var(--c-success)'};">${reg.antibioticos ? 'POSITIVO' : 'NEGATIVO'}</span></div>
          <div><span class="text-gray">Cisterna:</span> <span class="text-white">${reg.matriculaCisterna || '—'}</span></div>
        `;
      } else {
        detalleHtml = `
          <div><span class="text-gray">Nº Animales:</span> <span class="text-white">${reg.num_animales || 1}</span></div>
          <div><span class="text-gray">Matadero:</span> <span class="text-white">${reg.codigoMatadero || '—'}</span></div>
          <div><span class="text-gray">ICA:</span> <span class="text-white">${reg.codigoDocumento_ICA || '—'}</span></div>
          <div><span class="text-gray">Guía:</span> <span class="text-white">${reg.numero_Guia_Sanitaria || '—'}</span></div>
          <div><span class="text-gray">IVA / Ret.:</span> <span class="text-white">${reg.IVA || 0}% / ${reg.retencionREAGP || 0}%</span></div>
          <div><span class="text-gray">Transportista:</span> <span class="text-white">${reg.nombreTransportista || '—'} (${reg.matriculaTransportista || '—'})</span></div>
        `;
      }

      overlay.innerHTML = `
        <div class="card" style="max-width:550px;width:100%;padding:24px;">
          <div class="flex justify-between items-center mb-14">
            <div>
              <div class="font-800 text-sm" style="color:${color};">${tipo === 'leche' ? 'ENTREGA DE LECHE' : 'VENTA DE CARNE'}</div>
              <div class="font-900 text-white text-lg">${reg.numero_albaran || reg.numero_infolac || `Registro #${reg.id}`}</div>
            </div>
            <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer;">${Icons.cerrar()}</button>
          </div>
          <div class="grid grid-cols-2 gap-8 text-sm mb-14">
            <div><span class="text-gray">Fecha:</span> <span class="text-white">${this._fmtFecha(reg.fechaRecogida || reg.fecha || reg.creadoEn)}</span></div>
            <div><span class="text-gray">Importe Total:</span> <span class="text-green font-900">${(reg.importe_total || reg.precio_total || 0).toFixed(2)} €</span></div>
            ${detalleHtml}
          </div>
          <div class="mt-10 text-center" style="display:flex; gap:10px; justify-content:center;">
            <button class="btn btn-secondary btn-sm" onclick="this.closest('[style]').remove()">Cerrar</button>
            ${reg.estado_tramite_infolac === 'borrador' || reg.estado === 'borrador' ? `
              <button class="btn btn-primary btn-sm" onclick="AlbaranesVentasView._editarBorrador('${tipo}', ${reg.id}); this.closest('[style]').remove();">${Icons.editar()} Editar</button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="AlbaranesVentasView._imprimirDoc('${tipo}', ${reg.id}); this.closest('[style]').remove();">${Icons.exportar()} Imprimir</button>
            `}
          </div>
        </div>`;
      document.body.appendChild(overlay);
    } catch (e) {
      App.toastError("Error al ver detalle: " + e.message);
    }
  }
};

window.AlbaranesVentasView = AlbaranesVentasView;
