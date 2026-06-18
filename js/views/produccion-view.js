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

    eventos.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    gastosRecords.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    const carneEvents = eventos.filter(e => e.unidad === 'kg' || e.motivo_tarea === 'control');
    const lecheEvents = eventos.filter(e => e.unidad === 'L' || e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero');
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
      ? records.map(r => `
        <div class="card mb-6" onclick="${r.onclick || ''}"
             style="border-left:4px solid ${color}; padding:12px 14px; cursor:pointer; background:rgba(0,0,0,0.3);">
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <div class="text-white font-800 nowrap" style="font-size:0.88rem; overflow:hidden; text-overflow:ellipsis;">${r.title}</div>
              <div class="text-gray" style="font-size:0.72rem; margin-top:3px;">📅 ${r.date}${r.zone ? ' | 📍 ' + r.zone : ''}</div>
            </div>
            <div class="text-right flex-shrink-0 ml-8">
              <div class="font-900" style="font-size:1rem; color:${color};">${r.value}</div>
            </div>
          </div>
        </div>`).join('')
      : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">📭 ${emptyMsg}</span></div>`;

    content.innerHTML = `
      <div class="card report-section p-16 mb-14" style="border-top:3px solid ${color};">
        <div class="flex items-center gap-12 mb-12">
          <span style="font-size:1.6rem;">${icon}</span>
          <div>
            <div class="text-white font-900" style="font-size:1.05rem;">${title}</div>
            ${subtitle ? `<div class="text-gray" style="font-size:0.68rem;">${subtitle}</div>` : ''}
          </div>
        </div>
        ${kpis ? `<div class="grid grid-cols-2 gap-8 mb-12">
          ${kpis.map(k => `
            <div class="bg-dark" style="padding:10px 8px; border-radius:8px; border-left:3px solid ${color};">
              <small class="text-gray text-tiny" style="text-transform:uppercase; font-weight:700; letter-spacing:0.3px;">${k.label}</small>
              <div class="text-white font-900" style="font-size:1.1rem;">${k.value}</div>
            </div>`).join('')}
        </div>` : ''}
        <div class="text-center mb-12">
          <button class="btn btn-primary btn-sm" onclick="${registrarHandler}"
            style="background:linear-gradient(135deg,${color},${colorDark}); box-shadow:none;">
            ➕ ${registrarLabel}
          </button>
        </div>
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222" style="margin-bottom:6px; padding-bottom:5px;">
          📋 ${listName}
        </div>
        ${recordsHtml}
      </div>`;
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
      records: d.carneEvents.slice(0, 20).map(e => ({
        title: '⚖️ Pesada: ' + (e.snap_especie || 'General'),
        date: e.fecha ? new Date(e.fecha).toLocaleDateString() : '-',
        zone: e.snap_zona || '',
        value: (e.valor_neto || 0) + ' kg',
        onclick: "ProduccionView._abrirOpcionesRegistro(" + e.id + ")"
      })),
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
      records: d.lecheEvents.slice(0, 20).map(e => ({
        title: '🥛 Control Lechero',
        date: e.fecha ? new Date(e.fecha).toLocaleDateString() : '-',
        zone: e.snap_zona || '',
        value: (e.valor_neto || 0) + ' L',
        onclick: "ProduccionView._abrirOpcionesRegistro(" + e.id + ")"
      })),
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
      const overlay = document.createElement("div");
      overlay.className = "wizard-full-screen";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
      overlay.innerHTML = `
          <div class="card p-25" style="max-width:400px; border-top:5px solid #d97706;">
              <h3 class="mt-0 text-gold">Opciones de Registro</h3>
              <p class="text-base text-ccc">Registro de ${evento.motivo_tarea}</p>
              <div class="wizard-input-group mt-20">
                  <label class="wizard-label">Valor Neto (${evento.unidad})</label>
                  <input type="number" id="edit-reg-valor" value="${evento.valor_neto}" step="0.1" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                  <label class="wizard-label">Fecha</label>
                  <input type="date" id="edit-reg-fecha" value="${evento.fecha}" class="wizard-input">
              </div>
              <div class="flex gap-10 mt-30">
                  <button class="wizard-btn-action wizard-btn-primary flex-1" id="btn-save-reg" style="flex:2;">💾 Guardar</button>
                  <button class="wizard-btn-action wizard-btn-danger flex-1" id="btn-del-reg">🗑️ Borrar</button>
              </div>
              <button class="wizard-btn-action wizard-btn-secondary mt-10 w-full" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
          </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#btn-save-reg').onclick = async () => {
        const val = parseFloat(overlay.querySelector('#edit-reg-valor').value);
        const fecha = overlay.querySelector('#edit-reg-fecha').value;
        if (isNaN(val) || val <= 0) return App.toastError("Valor inválido");
        evento.valor_neto = val;
        evento.fecha = fecha;
        await window.db.put('registro_eventos', evento);
        App.toast("Registro actualizado");
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
      const gasto = await window.db.get('gastos_ganaderia', Number(id));
      if (!gasto) return;
      const overlay = document.createElement("div");
      overlay.className = "wizard-full-screen";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
      overlay.innerHTML = `
        <div class="card p-25" style="max-width:400px; border-top:5px solid #8b5cf6;">
          <h3 class="mt-0 text-gold text-md">🧾 Detalle del Gasto</h3>
          <div class="my-15">
            <div class="flex justify-between py-8 border-bottom-222">
              <span class="text-gray text-xs">CONCEPTO</span>
              <span class="text-white font-bold">${gasto.concepto || gasto.categoria || 'Gasto'}</span>
            </div>
            <div class="flex justify-between py-8 border-bottom-222">
              <span class="text-gray text-xs">MONTO</span>
              <span class="text-purple font-black">${(gasto.monto || 0)} €</span>
            </div>
            <div class="flex justify-between py-8 border-bottom-222">
              <span class="text-gray text-xs">FECHA</span>
              <span class="text-white">${gasto.fecha || '-'}</span>
            </div>
            ${gasto.descripcion ? `<div class="flex justify-between py-8 border-bottom-222">
              <span class="text-gray text-xs">DESCRIPCIÓN</span>
              <span class="text-white">${gasto.descripcion}</span>
            </div>` : ''}
            ${gasto.categoria ? `<div class="flex justify-between py-8 border-bottom-222">
              <span class="text-gray text-xs">CATEGORÍA</span>
              <span class="text-white">${gasto.categoria}</span>
            </div>` : ''}
          </div>
          <button class="wizard-btn-action wizard-btn-secondary w-full" onclick="this.closest('.wizard-full-screen').remove()">Cerrar</button>
        </div>`;
      document.body.appendChild(overlay);
    } catch (e) { App.toastError(e.message); }
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.ProduccionView = ProduccionView;
