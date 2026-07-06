/**
 * Livestock Manager - ComercializacionView v2.3.0
 * Refactorizada bajo patrón "Aglutinadora" y Neon Branding.
 */
const ComercializacionView = {
  _currentTab: 'leche',
  _cachedData: null,

  async render(params) {
    const main = document.getElementById('app-content');
    const tab = (params?.get ? params.get("tab") : null) || this._currentTab;
    this._currentTab = tab;

    const fincaId = await Fincas.getActiveId();
    const [ventas, entregas, gastosRecords] = await Promise.all([
      window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
      Gastos.list(fincaId).catch(() => [])
    ]);

    const kpis = this._calcKPIs(ventas, entregas, gastosRecords);

    main.innerHTML = `
      <div class="mb-14 px-4">
        <div class="comer-mode-switch">
          <button class="comer-mode-btn ${this._currentTab === 'carne' ? 'active' : ''}" style="--mode-color:#FF4444;" onclick="ComercializacionView._cambiarTab('carne')">${Icons.carne()} Carne</button>
          <button class="comer-mode-btn ${this._currentTab === 'leche' ? 'active' : ''}" style="--mode-color:#3b82f6;" onclick="ComercializacionView._cambiarTab('leche')">${Icons.leche()} Leche</button>
          <button class="comer-mode-btn ${this._currentTab === 'gastos' ? 'active' : ''}" style="--mode-color:#a855f7;" onclick="ComercializacionView._cambiarTab('gastos')">${Icons.gastos()} Gastos</button>
        </div>
      </div>
      <div id="comer-content" class="px-4"></div>`;

    this._cachedData = { ventas, entregas, gastosRecords, kpis };
    this._renderTabActual();
  },

  _renderTabActual() {
    const d = this._cachedData;
    const content = document.getElementById('comer-content');
    const meta = this._getTabMeta(this._currentTab);

    content.innerHTML = `
      <div class="mb-10">
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="flex justify-between items-center mb-6">
            <span class="text-xs text-white font-black uppercase tracking-wider flex items-center gap-6">${meta.icon} Balance ${meta.label}</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            ${d.kpis[this._currentTab].map(k => `
              <div class="py-10 border-bottom-222 flex justify-between items-center">
                <span class="text-[0.65rem] text-gray uppercase font-900">${k.label}</span>
                <strong class="text-lg font-950" style="color: ${k.color || '#fff'}">${k.value}</strong>
              </div>`).join('')}
          </div>
        </div>

        <div class="flex gap-8 items-center mb-12">
          <div class="relative flex-1 min-w-0">
            <input type="search" placeholder="Filtrar historial..." oninput="ComercializacionView._filtrar(this.value)" class="search-input w-full">
          </div>
        </div>

        <div id="comer-lista" class="grid gap-10">
          ${this._getRecordsHtml()}
        </div>
      </div>
      <div class="fab-container" style="--fab-neon-color: ${meta.color};" onclick="${this._currentTab === 'carne' ? 'App._abrirWizardVentaMasiva()' : (this._currentTab === 'leche' ? 'App._abrirWizardAlbaranLeche()' : 'App._abrirFormularioGasto()')}">
        <span class="fab-label">${this._currentTab === 'carne' ? 'Nueva Venta Carne' : (this._currentTab === 'leche' ? 'Nueva Entrega Leche' : 'Nuevo Gasto')}</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  _getRecordsHtml(filtro = '') {
    const d = this._cachedData;
    const f = filtro.toLowerCase();
    if (this._currentTab === 'carne') {
      return d.ventas.filter(v => (v.razonSocial || '').toLowerCase().includes(f)).slice(0, 20).map(v => this._cardRegistro({
        icon: Icons.documento(), title: v.razonSocial || 'Matadero', color: '#FF4444', onClick: `App._abrirDetalleVentaCarne(${v.id})`,
        metadata: `<span>${new Date(v.fechaSacrificio).toLocaleDateString()}</span>`,
        badge: `${Math.round(v.importe_total || 0).toLocaleString()} €`
      })).join('');
    } else if (this._currentTab === 'leche') {
      return d.entregas.filter(e => (e.matriculaCisterna || '').toLowerCase().includes(f)).slice(0, 20).map(e => this._cardRegistro({
        icon: Icons.leche(), title: `Cisterna: ${e.matriculaCisterna || 'S/N'}`, color: '#3b82f6', onClick: `location.hash='/albaran-leche?id=${e.id}'`,
        metadata: `<span>${new Date(e.fechaRecogida || e.fecha).toLocaleDateString()}</span>`,
        badge: `${(e.cantidad || 0).toLocaleString()} L`
      })).join('');
    } else {
      return d.gastosRecords.filter(g => (g.concepto || '').toLowerCase().includes(f)).slice(0, 20).map(g => this._cardRegistro({
        icon: Icons.gastos(), title: g.concepto || 'Gasto', color: '#a855f7', onClick: `ExplotacionView._abrirOpcionesGasto(${g.id})`,
        metadata: `<span>${new Date(g.fecha).toLocaleDateString()}</span><span>·</span><span>${g.categoria}</span>`,
        badge: `${(g.monto || 0).toLocaleString()} €`
      })).join('');
    }
  },

  _filtrar(texto) {
    const lista = document.getElementById('comer-lista');
    if (lista) lista.innerHTML = this._getRecordsHtml(texto);
  },

  _getTabMeta(tab) {
    const map = { carne: { color: '#FF4444', label: 'Cárnico', icon: Icons.carne() }, leche: { color: '#3b82f6', label: 'Lácteo', icon: Icons.leche() }, gastos: { color: '#a855f7', label: 'Gastos', icon: Icons.gastos() } };
    return map[tab] || map.leche;
  },

  _calcKPIs(ventas, entregas, gastos) {
    return {
      carne: [{ label: 'Ingreso Total', value: ventas.reduce((s, v) => s + (v.importe_total || 0), 0).toLocaleString() + ' €', color: 'var(--c-success)' }, { label: 'Ventas', value: ventas.length }],
      leche: [{ label: 'Total Litros', value: entregas.reduce((s, e) => s + (e.cantidad || 0), 0).toLocaleString() + ' L', color: 'var(--c-info)' }, { label: 'Facturación', value: Math.round(entregas.reduce((s, e) => s + (e.importe_total || 0), 0)).toLocaleString() + ' €', color: 'var(--c-success)' }],
      gastos: [{ label: 'Gasto Total', value: gastos.reduce((s, g) => s + (g.monto || 0), 0).toLocaleString() + ' €', color: 'var(--c-danger)' }]
    };
  },

  _cambiarTab(tab) { this._currentTab = tab; this.render(); },

  _cardRegistro(opts) {
    const color = opts.color || 'var(--c-info)';
    return `
      <div class="card-registro" onclick="${opts.onClick}" style="display:flex; gap:10px; align-items:stretch; --registro-color: ${color}; cursor:pointer; padding:12px;">
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-10 min-w-0">
            <span class="text-xl" style="color:${color};">${opts.icon}</span>
            <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${opts.title}</div>
          </div>
          <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">${opts.metadata}</div>
        </div>
        <div class="flex flex-col items-end justify-between flex-shrink-0">
          <div class="top-part">
            ${opts.badge ? `
              <div style="background:${color}15; color:${color}; border:1px solid ${color}40; filter: drop-shadow(0 0 4px ${color}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                ${opts.badge}
              </div>` : ''}
          </div>
          <div class="bottom-part">
            <span style="color:var(--c-warning); font-weight:800; font-size:0.7rem; text-transform:uppercase;">
              Ficha ${Icons.flechaDerecha()}
            </span>
          </div>
        </div>
      </div>`;
  }
};
window.ComercializacionView = ComercializacionView;
