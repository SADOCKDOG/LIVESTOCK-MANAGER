/**
 * Livestock Manager - ProduccionView v3.1.0
 * Vista de Producción con tabs — Cárnica y Láctea.
 * NOTA: Ventas y Gastos se gestionan desde Comercial (antes "Ventas Carne").
 * Copia espejo de www/js/views/produccion-view.js
 */

const ProduccionView = {
  _currentTab: 'carne',
  _cachedData: null,

  async render() {
    const main = document.getElementById("app-content");
    main.style.overflowX = 'hidden';
    main.style.maxWidth = '100%';
    main.style.boxSizing = 'border-box';
    main.style.paddingLeft = '12px';
    main.style.paddingRight = '12px';

    this._inyectarEstilos();

    // Cabecera compacta + tabs
    main.innerHTML = `
      <div class="mb-14">
        <div class="tabs-scroll prod-tabs scroll-shadow-container">
          <button class="prod-tab active" data-tab="carne" onclick="ProduccionView._cambiarTab('carne')">⚖️ Cárnica</button>
          <button class="prod-tab" data-tab="leche" onclick="ProduccionView._cambiarTab('leche')">🥛 Láctea</button>
        </div>
      </div>
      <div id="prod-content"><div class="loader">Cargando registros...</div></div>`;

    // Cargar datos
    const fincaId = await Fincas.getActiveId();
    const [eventos, gastosRecords, lecheEntregas] = await Promise.all([
      window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => [])
    ]);

    console.log('[DEBUG ProdView] fincaId:', fincaId, 'total eventos cargados:', eventos.length);
    if (eventos.length > 0) {
      console.log('[DEBUG ProdView] primer evento:', JSON.stringify({id: eventos[0].id, fecha: eventos[0].fecha, unidad: eventos[0].unidad, motivo: eventos[0].motivo_tarea, valor: eventos[0].valor_neto}));
      console.log('[DEBUG ProdView] último evento:', JSON.stringify({id: eventos[eventos.length-1].id, fecha: eventos[eventos.length-1].fecha, unidad: eventos[eventos.length-1].unidad, motivo: eventos[eventos.length-1].motivo_tarea, valor: eventos[eventos.length-1].valor_neto}));
    }
    console.log('[DEBUG ProdView] valores unidad en eventos:', [...new Set(eventos.map(e => e.unidad))]);
    console.log('[DEBUG ProdView] valores motivo_tarea en eventos:', [...new Set(eventos.map(e => e.motivo_tarea))]);

    eventos.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    gastosRecords.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    const carneEvents = eventos.filter(e =>
      (e.unidad === 'kg' && e.motivo_tarea !== 'control_lechero' && e.motivo_tarea !== 'control_peso') ||
      (e.motivo_tarea === 'expedicion' && e.unidad !== 'L' && e.unidad !== 'Litros')
    );
    console.log('[DEBUG ProdView] carneEvents filtrados:', carneEvents.length, 'de', eventos.length);
    const lecheEvents = eventos.filter(e =>
      (e.unidad === 'L' || e.unidad === 'Litros') &&
      (e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero' || e.motivo_tarea === 'expedicion')
    );
    const ventaEvents = eventos.filter(e => e.motivo_tarea === 'expedicion' || e.rol_contable === 'VENTA');

    // Extracto seco medio desde comercializacion_leche
    const conLab = lecheEntregas.filter(e => e.laboratorio?.grasa != null);
    const esTotal = conLab.reduce((s, e) => {
      const es = e.laboratorio.extracto_seco || (e.laboratorio.grasa || 0) + (e.laboratorio.proteina || 0);
      return s + es;
    }, 0);
    const esMedia = conLab.length > 0 ? esTotal / conLab.length : 0;

    this._cachedData = {
      carneEvents, lecheEvents, ventaEvents, gastosRecords,
      kgTotal: carneEvents.reduce((s, e) => s + (e.valor_neto || 0), 0),
      kgCount: carneEvents.length,
      litrosTotal: lecheEvents.reduce((s, e) => s + (e.valor_neto || 0), 0),
      litrosCount: lecheEvents.length,
      ventasTotal: ventaEvents.reduce((s, e) => s + (e.importe_total || e.valor_neto || 0), 0),
      gastosTotal: gastosRecords.reduce((s, g) => s + (g.monto || 0), 0),
      extractoSecoMedio: esMedia,       // NUEVO
      numAnaliticas: conLab.length,      // NUEVO
    };

    this._renderTabActual();

      },

  _inyectarEstilos() {
    if (document.getElementById('prod-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'prod-tab-styles';
    style.textContent = `
      .prod-tabs::-webkit-scrollbar { display: none; }
      .prod-tab {
        flex: 0 0 auto; padding: 9px 18px; border-radius: 18px; border: 1px solid #333;
        background: #1a1a1a; color: #888; font-size: 0.78rem; font-weight: 800;
        cursor: pointer; white-space: nowrap; transition: all 0.2s;
        text-transform: uppercase; letter-spacing: 0.4px;
      }
      .prod-tab.active { background: #d97706; color: #fff; border-color: #d97706; box-shadow: 0 0 14px rgba(217,119,6,0.35); }
      .prod-tab:active { transform: scale(0.95); }
      #prod-content .report-section { max-width:100%; overflow:hidden; }
    `;
    document.head.appendChild(style);
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.prod-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    if (!d) return;
    const content = document.getElementById('prod-content');
    if (!content) return;

    switch (this._currentTab) {
      case 'carne': this._renderCarne(content, d); break;
      case 'leche': this._renderLeche(content, d); break;
      default: this._renderCarne(content, d);
    }
  },

  // ===================== SECCIONES POR TAB =====================

  _renderSeccion(content, opts) {
    const { icon, title, subtitle, color, colorDark, kpis, registrarLabel, listName, records, emptyMsg, registrarHandler } = opts;
    const recordsHtml = records.length > 0
      ? records.map(r => {
        const borderCls = r.typeColor || color;
        return `
        <div class="card card-animal" onclick="${r.onclick || ''}" style="border-left:4px solid ${borderCls};">
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-6">
                <span class="text-xl">${icon}</span>
                <h3 class="section-h3 m-0 text-ellipsis">${r.title}</h3>
              </div>
              <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                <span>📅 ${r.date}</span>
                ${r.zone ? `<span>·</span><span>📍 ${r.zone}</span>` : ''}
                ${r.meta ? `<span>·</span><span>📋 ${r.meta}</span>` : ''}
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-8">
              <span class="badge badge-sm" style="background:${borderCls}20;color:${borderCls};border:1px solid ${borderCls}40;display:block;margin-bottom:4px;">${r.value}</span>
              <span class="text-xs text-777">Ver ➔</span>
            </div>
          </div>
        </div>`;
      }).join('')
      : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">📭 ${emptyMsg}</span></div>`;

    content.innerHTML = `
      <div class="card report-section p-16 mb-14" style="border-top:3px solid ${color};">
        <div class="flex justify-between items-center mb-16">
          <div class="flex items-center gap-12">
            <span style="font-size:1.6rem;">${icon}</span>
            <div>
              <div class="text-white font-900" style="font-size:1.05rem;">${title}</div>
              ${subtitle ? `<div class="text-gray" style="font-size:0.68rem;">${subtitle}</div>` : ''}
            </div>
          </div>
          <button class="btn btn-create btn-sm" onclick="${registrarHandler}">
            ➕ Nuevo
          </button>
        </div>

        ${kpis ? `
        <div class="flex flex-wrap gap-4 mb-14">
          ${kpis.map((k, idx) => {
            const badgesCls = ['badge-gold', 'badge-blue', 'badge-green', 'badge-purple', 'badge-red'];
            const cls = badgesCls[idx % badgesCls.length];
            return `<span class="badge badge-sm ${cls}">${k.label}: ${k.value}</span>`;
          }).join('')}
        </div>` : ''}

        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222" style="margin-bottom:6px; padding-bottom:5px;">
          📋 ${listName}
        </div>
        <div class="grid gap-10">
          ${recordsHtml}
        </div>
      </div>
      <button class="fab-btn" onclick="${registrarHandler}" aria-label="Nuevo Registro">➕</button>`;
  },

  _renderCarne(content, d) {
    this._renderSeccion(content, {
      icon: '⚖️', title: 'Producción Cárnica (kg)', subtitle: 'Pesajes individuales y por lote',
      color: '#ef4444', colorDark: '#b91c1c',
      kpis: [
        { label: 'Total kg', value: this._fmt(d.kgTotal) + ' kg' },
        { label: 'Pesadas', value: d.kgCount }
      ],
      registrarLabel: 'Cárnica', listName: 'Lista PRO Cárnica',
      registrarHandler: "App._abrirAsistenteProduccion('carne')",
      records: d.carneEvents.slice(0, 30).map(e => {
        const isInd = e.tipo_entidad === 'animal';
        const label = isInd ? '👤 INDIVIDUAL' : '🐄 LOTE';
        const idDisplay = e.snap_identificacion || (e.lote_crotales ? `LOTE ${e.lote_animales_count || '?'} animales` : (e.snap_tipo || 'S/N'));
        return {
          title: `${label}: ${idDisplay}`,
          date: e.fecha ? new Date(e.fecha).toLocaleDateString() : '-',
          zone: e.snap_zona || '',
          value: (e.valor_neto || 0) + ' kg',
          typeColor: isInd ? '#ef4444' : '#f59e0b',
          onclick: "ProduccionView._abrirOpcionesRegistro(" + e.id + ")"
        };
      }),
      emptyMsg: 'Sin registros cárnicos. Usa "Registrar Cárnica" para añadir.'
    });
  },

  _renderLeche(content, d) {
    this._renderSeccion(content, {
      icon: '🥛', title: 'Producción Láctea (L)', subtitle: 'Control lechero individual y de lote',
      color: '#3b82f6', colorDark: '#1d4ed8',
      kpis: [
        { label: 'Total litros', value: this._fmt(d.litrosTotal) + ' L' },
        { label: 'Registros', value: d.litrosCount },
        { label: 'Extracto Seco Medio', value: d.extractoSecoMedio > 0 ? d.extractoSecoMedio.toFixed(2) + '%' : 'N/D' },
      ],
      registrarLabel: 'Láctea', listName: 'Lista PRO Láctea',
      registrarHandler: "App._abrirAsistenteProduccion('leche')",
      records: d.lecheEvents.slice(0, 30).map(e => {
        const isInd = e.tipo_entidad === 'animal';
        const isLote = e.tipo_entidad === 'rebano';
        const isTanque = e.tipo_entidad === 'finca' || e.motivo_tarea === 'expedicion';

        let label = '🥛 CONTROL';
        if (isInd) label = '👤 INDIVIDUAL';
        if (isLote) label = '🐄 LOTE';
        if (isTanque) label = '🚛 TANQUE';

        const idDisplayLeche = e.snap_identificacion || (e.lote_crotales ? `LOTE ${e.lote_animales_count || '?'} animales` : (e.snap_tipo || 'S/N'));
        return {
          title: `${label}: ${idDisplayLeche}`,
          date: e.fecha ? new Date(e.fecha).toLocaleDateString() : '-',
          zone: e.snap_zona || '',
          value: (e.valor_neto || 0) + ' L',
          typeColor: isInd ? '#3b82f6' : (isLote ? '#8b5cf6' : '#10b981'),
          onclick: "ProduccionView._abrirOpcionesRegistro(" + e.id + ")"
        };
      }),
      emptyMsg: 'Sin registros lácteos. Usa "Registrar Láctea" para añadir.'
    });
  },

  _renderVentas(content, d) {
    this._renderSeccion(content, {
      icon: '🚚', title: 'Venta Masiva / Matadero', subtitle: 'Expediciones y ventas de ganado',
      color: '#f59e0b', colorDark: '#b45309',
      kpis: [
        { label: 'Total ventas', value: this._fmt(d.ventasTotal) + ' €' },
        { label: 'Expediciones', value: d.ventaEvents.length }
      ],
      registrarLabel: 'Venta', listName: 'Lista Ventas',
      registrarHandler: "App._abrirAsistenteProduccion('venta_masiva')",
      records: d.ventaEvents.slice(0, 20).map(e => ({
        title: '🚚 Expedición: ' + (e.snap_especie || 'Ganado'),
        date: e.fecha ? new Date(e.fecha).toLocaleDateString() : '-',
        zone: e.snap_zona || '',
        value: (e.importe_total || e.valor_neto || 0) + ' €',
        onclick: "ProduccionView._abrirOpcionesRegistro(" + e.id + ")"
      })),
      emptyMsg: 'Sin ventas registradas. Usa "Registrar Venta" para añadir.'
    });
  },

  _renderGastos(content, d) {
    this._renderSeccion(content, {
      icon: '🧾', title: 'Gastos Analíticos', subtitle: 'Costes operativos y de explotación',
      color: '#8b5cf6', colorDark: '#6d28d9',
      kpis: [
        { label: 'Total gastos', value: this._fmt(d.gastosTotal) + ' €' },
        { label: 'Registros', value: d.gastosRecords.length }
      ],
      registrarLabel: 'Gasto', listName: 'Lista Gastos',
      registrarHandler: "App._abrirAsistenteProduccion('gasto')",
      records: d.gastosRecords.slice(0, 20).map(g => ({
        title: '🧾 ' + (g.concepto || g.categoria || 'Gasto'),
        date: g.fecha ? new Date(g.fecha).toLocaleDateString() : '-',
        zone: g.snap_zona || '',
        value: (g.monto || 0) + ' €',
        onclick: "ProduccionView._abrirOpcionesGasto(" + g.id + ")"
      })),
      emptyMsg: 'Sin gastos registrados. Usa "Registrar Gasto" para añadir.'
    });
  },

  async _abrirOpcionesRegistro(id) {
    try {
      const evento = await window.db.get('registro_eventos', id);
      if (!evento) return;

      const [rebanos, finca] = await Promise.all([
        window.db.getAll('rebanos'),
        Fincas.getActive()
      ]);
      const zonas = finca?.zonas || [];

      const overlay = document.createElement("div");
      overlay.className = "wizard-full-screen";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
      overlay.innerHTML = `
          <div class="card p-25" style="max-width:420px; border-top:5px solid #d97706; overflow-y:auto; max-height:90vh;">
              <h3 class="mt-0 text-gold">Editar Registro</h3>
              <p class="text-xs text-gray mb-15">ID Interno: ${evento.id}</p>

              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                    <label class="wizard-label">Valor (${evento.unidad})</label>
                    <input type="number" id="edit-reg-valor" value="${evento.valor_neto}" step="0.1" class="wizard-input">
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">Fecha</label>
                    <input type="date" id="edit-reg-fecha" value="${evento.fecha}" class="wizard-input">
                </div>
              </div>

              <div class="wizard-input-group">
                  <label class="wizard-label">Identificación (Crotal/Lote)</label>
                  <input type="text" id="edit-reg-ident" value="${evento.snap_identificacion || ''}" class="wizard-input">
              </div>

              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                    <label class="wizard-label">Zona</label>
                    <select id="edit-reg-zona" class="wizard-input wizard-select">
                      <option value="">Sin zona</option>
                      ${zonas.map(z => `<option value="${z.nombre}" ${evento.snap_zona === z.nombre ? 'selected' : ''}>${z.nombre}</option>`).join('')}
                    </select>
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">Tipo Animal</label>
                    <input type="text" id="edit-reg-tipo" value="${evento.snap_tipo || ''}" class="wizard-input">
                </div>
              </div>

              <div class="wizard-input-group">
                  <label class="wizard-label">Especie</label>
                  <select id="edit-reg-especie" class="wizard-input wizard-select">
                    <option value="Vacas" ${evento.snap_especie === 'Vacas' ? 'selected' : ''}>Vacas</option>
                    <option value="Ovejas" ${evento.snap_especie === 'Ovejas' ? 'selected' : ''}>Ovejas</option>
                    <option value="Cabras" ${evento.snap_especie === 'Cabras' ? 'selected' : ''}>Cabras</option>
                  </select>
              </div>

              <div class="flex gap-10 mt-20">
                  <button class="wizard-btn-action wizard-btn-primary flex-1" id="btn-save-reg" style="flex:2;">💾 Guardar</button>
                  <button class="wizard-btn-action wizard-btn-danger flex-1" id="btn-del-reg">🗑️ Borrar</button>
              </div>
              <button class="wizard-btn-action wizard-btn-secondary mt-10 w-full" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
          </div>`;
      document.body.appendChild(overlay);

      overlay.querySelector('#btn-save-reg').onclick = async () => {
        const val = parseFloat(overlay.querySelector('#edit-reg-valor').value);
        const fecha = overlay.querySelector('#edit-reg-fecha').value;
        const ident = overlay.querySelector('#edit-reg-ident').value.trim();
        const zona = overlay.querySelector('#edit-reg-zona').value;
        const tipo = overlay.querySelector('#edit-reg-tipo').value.trim();
        const especie = overlay.querySelector('#edit-reg-especie').value;

        if (isNaN(val) || val <= 0) return App.toastError("Valor inválido");

        evento.valor_neto = val;
        evento.fecha = fecha;
        evento.snap_identificacion = ident;
        evento.snap_zona = zona;
        evento.snap_tipo = tipo;
        evento.snap_especie = especie;
        evento.actualizadoEn = new Date().toISOString();

        await window.db.put('registro_eventos', evento);
        App.toast("Registro actualizado correctamente");
        overlay.remove();
        ProduccionView.render();
      };

      overlay.querySelector('#btn-del-reg').onclick = async () => {
        if (!confirm("¿Eliminar este registro de forma permanente?")) return;
        await window.db.delete('registro_eventos', id);
        App.toast("Registro eliminado");
        overlay.remove();
        ProduccionView.render();
      };
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _abrirOpcionesGasto(id) {
    try {
      const numId = Number(id);
      const gasto = await window.db.get('gastos_ganaderia', numId);
      if (!gasto) return;

      const [rebanos, proveedores] = await Promise.all([
        window.db.getAll('rebanos'),
        window.db.getAll('proveedores')
      ]);

      const overlay = document.createElement("div");
      overlay.className = "wizard-full-screen";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
      overlay.innerHTML = `
        <div class="card p-25" style="max-width:400px; border-top:5px solid #8b5cf6;">
          <h3 class="mt-0 text-gold text-md">🧾 Editar Gasto</h3>

          <div class="wizard-input-group mt-15">
            <label class="wizard-label">Concepto</label>
            <input type="text" id="edit-gasto-concepto" value="${gasto.concepto || ''}" class="wizard-input">
          </div>

          <div class="grid grid-cols-2 gap-10">
            <div class="wizard-input-group">
              <label class="wizard-label">Monto (€)</label>
              <input type="number" id="edit-gasto-monto" value="${gasto.monto}" step="0.01" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">Fecha</label>
              <input type="date" id="edit-gasto-fecha" value="${gasto.fecha}" class="wizard-input">
            </div>
          </div>

          <div class="wizard-input-group">
            <label class="wizard-label">Proveedor</label>
            <select id="edit-gasto-prov" class="wizard-input wizard-select">
              <option value="">Sin proveedor</option>
              ${proveedores.map(p => `<option value="${p.id}" ${gasto.proveedorId === p.id ? 'selected' : ''}>${p.nombre}</option>`).join('')}
            </select>
          </div>

          <div class="wizard-input-group">
            <label class="wizard-label">Rebaño / Lote</label>
            <select id="edit-gasto-reb" class="wizard-input wizard-select">
              <option value="">Sin rebaño</option>
              ${rebanos.map(r => `<option value="${r.id}" ${gasto.rebanoId === r.id ? 'selected' : ''}>${r.nombre}</option>`).join('')}
            </select>
          </div>

          <div class="flex gap-10 mt-20">
            <button class="wizard-btn-action wizard-btn-primary flex-1" id="btn-save-gasto">💾 Guardar</button>
            <button class="wizard-btn-action wizard-btn-danger flex-1" id="btn-del-gasto">🗑️ Borrar</button>
          </div>
          <button class="wizard-btn-action wizard-btn-secondary mt-10 w-full" onclick="this.closest('.wizard-full-screen').remove()">Cerrar</button>
        </div>`;
      document.body.appendChild(overlay);

      overlay.querySelector('#btn-save-gasto').onclick = async () => {
        const concepto = document.getElementById('edit-gasto-concepto').value.trim();
        const monto = parseFloat(document.getElementById('edit-gasto-monto').value);
        const fecha = document.getElementById('edit-gasto-fecha').value;
        const proveedorId = document.getElementById('edit-gasto-prov').value;
        const rebanoId = document.getElementById('edit-gasto-reb').value;

        if (!concepto || isNaN(monto)) return App.toastError("Concepto y monto obligatorios");

        gasto.concepto = concepto;
        gasto.monto = monto;
        gasto.fecha = fecha;
        gasto.proveedorId = proveedorId ? Number(proveedorId) : null;
        gasto.rebanoId = rebanoId ? Number(rebanoId) : null;
        gasto.actualizadoEn = new Date().toISOString();

        await window.db.put('gastos_ganaderia', gasto);
        App.toast("Gasto actualizado");
        overlay.remove();
        if (window.GastosView && GastosView._cachedData) GastosView.render();
        else ProduccionView.render();
      };

      overlay.querySelector('#btn-del-gasto').onclick = async () => {
        if (!confirm("¿Eliminar este gasto de forma permanente?")) return;
        await window.db.delete('gastos_ganaderia', numId);
        App.toast("Gasto eliminado");
        overlay.remove();
        if (window.GastosView && GastosView._cachedData) GastosView.render();
        else ProduccionView.render();
      };

    } catch (e) { App.toastError(e.message); }
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.ProduccionView = ProduccionView;
