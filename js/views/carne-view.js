/**
 * Livestock Manager - CarneView v3.2.0
 * Vista del Módulo de Carne refactorizada bajo patrón "Aglutinadora"
 */
const CarneView = {
  _currentTab: 'patrimonio',
  _cachedData: null,

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  async render() {
    const main = document.getElementById('app-content');
    const fincaId = await Fincas?.getActiveId();

    const [rebanos, animales, ventasCarne, sanitariosGanado, todosGastos] = await Promise.all([
      window.db?.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db?.getAll('animales').catch(() => []),
      window.db?.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
      window.db?.getAll('sanitarios_ganado').catch(() => []),
      window.db?.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => [])
    ]);

    const rebanosCarne = rebanos?.filter(r => (r?.tipo || '').toLowerCase().match(/carne|cárn|mixt|híbr|doble/)) || [];
    const rebanosIds = new Set(rebanosCarne.map(r => r.id));
    const animalesCarne = animales?.filter(a => rebanosIds.has(a?.rebanoId)) || [];
    const sanitariosCarne = sanitariosGanado?.filter(s => rebanosIds.has(s?.rebanoId)) || [];

    const totalVentas = ventasCarne?.reduce((s, v) => s + (v?.importe_total || v?.valor_neto || 0), 0) || 0;
    const totalGastoAlim = todosGastos?.filter(g =>
      (g?.categoria || '').toLowerCase()?.includes('alimentaci') ||
      (g?.concepto || '').toLowerCase()?.includes('pienso')
    ).reduce((s, g) => s + (g?.monto || 0), 0) || 0;

    main.innerHTML = `
      <div class="mb-14 px-4">
        <div class="scroll-shadow-container scroll-tabs-row mb-10">
          <div class="carne-tabs">
            <button class="carne-tab active" data-tab="patrimonio" onclick="CarneView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio</button>
            <button class="carne-tab" data-tab="comercializacion" onclick="CarneView._cambiarTab('comercializacion')">${Icons.transportistas()} Ventas</button>
            <button class="carne-tab" data-tab="legislacion" onclick="CarneView._cambiarTab('legislacion')">${Icons.documento()} Sanidad</button>
          </div>
        </div>
      </div>
      <div id="carne-content"></div>`;

    this._cachedData = {
      rebanosCarne, animalesCarne, ventasCarne, sanitariosCarne,
      kpis: {
        patrimonio: [
          { label: 'Censo', value: animalesCarne.length + ' cab.' },
          { label: 'Lotes Activos', value: rebanosCarne.length }
        ],
        comercializacion: [
          { label: 'Facturación', value: totalVentas.toLocaleString() + ' €', color: 'var(--c-success)' },
          { label: 'Expediciones', value: ventasCarne.length }
        ],
        legislacion: [
          { label: 'Sanitarios', value: sanitariosCarne.length, color: 'var(--c-purple)' },
          { label: 'Alimentación', value: totalGastoAlim.toLocaleString() + ' €', color: 'var(--c-danger)' }
        ]
      }
    };
    this._renderTabActual();
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.carne-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    const content = document.getElementById('carne-content');
    if (!d || !content) return;

    let color = this._currentTab === 'patrimonio' ? 'var(--c-info)' : (this._currentTab === 'comercializacion' ? 'var(--c-success)' : 'var(--c-purple)');
    let icon = this._currentTab === 'patrimonio' ? Icons.edificio() : (this._currentTab === 'comercializacion' ? Icons.transportistas() : Icons.documento());

    content.innerHTML = `
      <div class="card-registro mb-10 mx-4" style="--registro-color: ${color};">
        <div class="flex items-center gap-12 mb-12">
          <span class="text-3xl" style="color:${color};">${icon}</span>
          <div>
            <div class="text-white font-900 text-lg uppercase">${this._currentTab} Carne</div>
            <div class="text-gray" style="font-size:0.68rem;">Histórico y censo cárnico</div>
          </div>
        </div>

        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="flex justify-between items-center mb-6">
            <span class="text-xs text-white font-black uppercase tracking-wider flex items-center gap-6">${icon} Resumen ${this._currentTab}</span>
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
            <input type="search" placeholder="Filtrar registros..." oninput="CarneView._filtrar(this.value)" class="search-input w-full">
          </div>
        </div>

        <div id="carne-lista" class="grid gap-10">
          ${this._getRecordsHtml()}
        </div>
      </div>`;
  },

  _getRecordsHtml(filtro = '') {
    const d = this._cachedData;
    const f = filtro.toLowerCase();
    if (this._currentTab === 'patrimonio') {
      return d.animalesCarne.filter(a => (a.nombre || a.numero_identificacion || '').toLowerCase().includes(f)).slice(0, 15).map(a => this._cardRegistro({
        icon: Icons.animales(), title: a.nombre || a.numero_identificacion || 'Animal', color: 'var(--c-info)', onClick: `location.hash='/animal?id=${a.id}'`,
        metadata: `<span>${a.raza || 'Sin raza'}</span><span>·</span><span>Lote: ${a.rebanoId}</span>`
      })).join('');
    } else if (this._currentTab === 'comercializacion') {
      return d.ventasCarne.filter(v => (v.razonSocial || '').toLowerCase().includes(f)).slice(0, 15).map(v => this._cardRegistro({
        icon: Icons.documento(), title: v.razonSocial || 'Matadero', color: 'var(--c-success)', onClick: `App._abrirDetalleVentaCarne(${v.id})`,
        metadata: `<span>${this._fmtFecha(v.fechaSacrificio)}</span>`,
        badge: `<span class="text-gold font-950">${Math.round(v.importe_total || 0).toLocaleString()} €</span>`
      })).join('');
    } else {
      return d.sanitariosCarne.filter(s => (s.medicamento || '').toLowerCase().includes(f)).slice(0, 15).map(s => this._cardRegistro({
        icon: Icons.sanidad(), title: s.medicamento || 'Tratamiento', color: 'var(--c-purple)', onClick: `location.hash='/sanitario?id=${s.id}'`,
        metadata: `<span>${this._fmtFecha(s.fecha)}</span><span>·</span><span>Espera: ${s.tiempo_espera_carne_dias || 0}d</span>`
      })).join('');
    }
  },

  _filtrar(texto) {
    const lista = document.getElementById('carne-lista');
    if (lista) lista.innerHTML = this._getRecordsHtml(texto);
  },

  _cardRegistro(opts) {
    return `
      <div class="card-registro" onclick="${opts.onClick}" style="display:flex; gap:10px; align-items:stretch; --registro-color: ${opts.color}; cursor:pointer;">
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-10 min-w-0">
            <span class="text-xl" style="color:${opts.color};">${opts.icon}</span>
            <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold);">${opts.title}</div>
          </div>
          <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">${opts.metadata}</div>
        </div>
        <div class="flex flex-col items-end justify-between flex-shrink-0">
          <div class="top-part">${opts.badge || ''}</div>
          <div class="bottom-part"><span style="color:var(--c-warning); font-weight:700; font-size:0.7rem; text-transform:uppercase;">Ficha ➔</span></div>
        </div>
      </div>`;
  }
};
window.CarneView = CarneView;
