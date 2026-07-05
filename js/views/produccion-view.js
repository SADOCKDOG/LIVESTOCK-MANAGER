/**
 * Livestock Manager - ProduccionView v3.4.0
 * Vista de Producción refactorizada bajo patrón "Aglutinadora"
 */
const ProduccionView = {
  _currentTab: 'carne',
  _cachedData: null,

  async render() {
    const main = document.getElementById("app-content");
    const fincaId = await Fincas.getActiveId();
    const [eventos] = await Promise.all([
      window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => [])
    ]);

    const carneEvents = eventos.filter(e => e?.unidad === 'kg' && !e?.anulado);
    const lecheEvents = eventos.filter(e => e?.unidad?.match(/L|Litros/) && !e?.anulado);

    main.innerHTML = `
      <div class="mb-14 px-4">
        <div class="tabs-scroll prod-tabs">
          <button class="prod-tab active" data-tab="carne" onclick="ProduccionView._cambiarTab('carne')">${Icons.carne()} Cárnica</button>
          <button class="prod-tab" data-tab="leche" onclick="ProduccionView._cambiarTab('leche')">${Icons.leche()} Láctea</button>
        </div>
      </div>
      <div id="prod-content" class="px-4"></div>`;

    this._cachedData = { carneEvents, lecheEvents };
    this._renderTabActual();
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.prod-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    this._renderTabActual();
  },

  _renderTabActual() {
    const d = this._cachedData;
    const content = document.getElementById('prod-content');
    const isCarne = this._currentTab === 'carne';
    const color = isCarne ? 'var(--c-danger)' : 'var(--c-info)';
    const events = isCarne ? d.carneEvents : d.lecheEvents;

    content.innerHTML = `
      <div class="card-registro mb-10" style="--registro-color: ${color};">
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="flex justify-between items-center mb-6">
            <span class="text-xs text-white font-black uppercase tracking-wider flex items-center gap-6">${isCarne ? Icons.carne() : Icons.leche()} Producción ${this._currentTab}</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 border-bottom-222 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Total Acumulado</span>
              <strong class="text-lg font-950" style="color: ${color};">${events.reduce((s, e) => s + (e.valor_neto || 0), 0).toLocaleString()} ${isCarne ? 'kg' : 'L'}</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Registros</span>
              <strong class="text-lg font-950" style="color: #fff;">${events.length}</strong>
            </div>
          </div>
        </div>

        <div class="flex gap-8 items-center mb-12">
          <div class="relative flex-1 min-w-0">
            <input type="search" placeholder="Buscar pesada/control..." oninput="ProduccionView._filtrar(this.value)" class="search-input w-full">
          </div>
        </div>

        <div id="prod-lista" class="grid gap-10">
          ${this._getRecordsHtml(events)}
        </div>
      </div>`;
  },

  _getRecordsHtml(events, filtro = '') {
    const f = filtro.toLowerCase();
    const isCarne = this._currentTab === 'carne';
    const color = isCarne ? 'var(--c-danger)' : 'var(--c-info)';
    return events.filter(e => (e.snap_identificacion || '').toLowerCase().includes(f)).slice(0, 25).map(e => `
      <div class="card-registro" onclick="ProduccionView._abrirOpcionesRegistro(${e.id})" style="display:flex; gap:10px; align-items:stretch; --registro-color: ${color}; cursor:pointer;">
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-10 min-w-0">
            <span class="text-xl" style="color:${color};">${isCarne ? Icons.carne() : Icons.leche()}</span>
            <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${e.snap_identificacion || 'Control'}</div>
          </div>
          <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">
            <span>${new Date(e.fecha).toLocaleDateString()}</span><span>·</span><span>${e.snap_zona || 'Finca'}</span>
          </div>
        </div>
        <div class="flex flex-col items-end justify-between flex-shrink-0">
          <div class="top-part">
             <div style="background:${color}15; color:${color}; border: 1px solid ${color}40; filter: drop-shadow(0 0 4px ${color}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                ${(e.valor_neto || 0).toLocaleString()} ${isCarne ? 'kg' : 'L'}
             </div>
          </div>
          <div class="bottom-part">
            <span style="color:var(--c-warning); font-weight:800; font-size:0.7rem; text-transform:uppercase;">
              Ficha ${Icons.flechaDerecha()}
            </span>
          </div>
        </div>
      </div>`).join('');
  },

  _filtrar(texto) {
    const list = this._currentTab === 'carne' ? this._cachedData.carneEvents : this._cachedData.lecheEvents;
    const div = document.getElementById('prod-lista');
    if (div) div.innerHTML = this._getRecordsHtml(list, texto);
  },

  async _abrirOpcionesRegistro(id) {
    if (window.ExplotacionView && typeof window.ExplotacionView._abrirOpcionesRegistro === 'function') {
      window.ExplotacionView._abrirOpcionesRegistro(id, this._currentTab);
    }
  }
};
window.ProduccionView = ProduccionView;
