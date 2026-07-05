/**
 * Livestock Manager - HibridoView v2.2.0
 * Consola Híbrida/Mixta refactorizada bajo patrón "Aglutinadora"
 */
const HibridoView = {
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
    const finca = await Fincas?.getActive();

    const [rebanos, animales, ventasCarne, entregasLeche, sanitariosGanado, todosGastos] = await Promise.all([
      window.db?.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db?.getAll('animales').catch(() => []),
      window.db?.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
      window.db?.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
      window.db?.getAll('sanitarios_ganado').catch(() => []),
      window.db?.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => [])
    ]);

    const rebanosIds = rebanos.map(r => r.id);
    const animalesFinca = animales.filter(a => rebanosIds.includes(a.rebanoId));
    const sanitariosFinca = sanitariosGanado.filter(s => rebanosIds.includes(s.rebanoId));

    const totalIngresos = (ventasCarne?.reduce((s, v) => s + (v.importe_total || 0), 0) || 0) + (entregasLeche?.reduce((s, e) => s + (e.importe_total || 0), 0) || 0);
    const totalGastosAlim = todosGastos?.filter(g =>
      (g?.categoria || '').toLowerCase()?.includes('alimentaci') ||
      (g?.concepto || '').toLowerCase()?.includes('pienso')
    ).reduce((s, g) => s + (g?.monto || 0), 0) || 0;

    main.innerHTML = `
      <div class="mb-14 px-4">
        <div class="scroll-shadow-container scroll-tabs-row mb-10">
          <div class="hibrido-tabs">
            <button class="hibrido-tab active" data-tab="patrimonio" onclick="HibridoView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio</button>
            <button class="hibrido-tab" data-tab="comercializacion" onclick="HibridoView._cambiarTab('comercializacion')">${Icons.transportistas()} Ventas</button>
            <button class="hibrido-tab" data-tab="legislacion" onclick="HibridoView._cambiarTab('legislacion')">${Icons.documento()} Sanidad</button>
          </div>
        </div>
      </div>
      <div id="hibrido-content"></div>`;

    this._cachedData = {
      rebanos, animalesFinca, ventasCarne, entregasLeche, sanitariosFinca,
      kpis: {
        patrimonio: [
          { label: 'Censo Global', value: animalesFinca.length + ' cab.' },
          { label: 'Lotes Mixtos', value: rebanos.length }
        ],
        comercializacion: [
          { label: 'Ingreso Global', value: Math.round(totalIngresos).toLocaleString() + ' €', color: 'var(--c-success)' },
          { label: 'Ratio Gasto Alim.', value: totalIngresos > 0 ? ((totalGastosAlim / totalIngresos) * 100).toFixed(1) + '%' : '0%', color: 'var(--c-danger)' }
        ],
        legislacion: [
          { label: 'Sanitarios', value: sanitariosFinca.length, color: 'var(--c-purple)' }
        ]
      }
    };
    this._renderTabActual();
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.hibrido-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    const content = document.getElementById('hibrido-content');
    if (!d || !content) return;

    let color = 'var(--c-warning)';
    let icon = Icons.edificio();

    content.innerHTML = `
      <div class="card-registro mb-10 mx-4" style="--registro-color: ${color};">
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
            <input type="search" placeholder="Filtrar consola..." oninput="HibridoView._filtrar(this.value)" class="search-input w-full">
          </div>
        </div>

        <div id="hibrido-lista" class="grid gap-10">
          ${this._getRecordsHtml()}
        </div>
      </div>`;
  },

  _getRecordsHtml(filtro = '') {
    const d = this._cachedData;
    const f = filtro.toLowerCase();
    if (this._currentTab === 'patrimonio') {
      return d.rebanos.filter(r => (r.nombre || '').toLowerCase().includes(f)).map(r => this._cardRegistro({
        icon: Icons.rebanos(), title: r.nombre, color: 'var(--c-warning)', onClick: `location.hash='/rebano?id=${r.id}'`,
        metadata: `<span>${r.tipo}</span><span>·</span><span>${r.especie}</span>`
      })).join('');
    } else if (this._currentTab === 'comercializacion') {
      const list = [...d.ventasCarne.map(v => ({ ...v, t: 'carne' })), ...d.entregasLeche.map(e => ({ ...e, t: 'leche' }))];
      list.sort((a, b) => new Date(b.fecha || b.fechaSacrificio || 0) - new Date(a.fecha || a.fechaSacrificio || 0));
      return list.filter(i => (i.razonSocial || 'Entrega').toLowerCase().includes(f)).slice(0, 15).map(i => this._cardRegistro({
        icon: i.t === 'carne' ? Icons.carne() : Icons.leche(), title: i.razonSocial || 'Entrega Mixta', color: i.t === 'carne' ? 'var(--c-danger)' : 'var(--c-info)', onClick: i.t === 'carne' ? `App._abrirDetalleVentaCarne(${i.id})` : `location.hash='/albaran-leche?id=${i.id}'`,
        metadata: `<span>${this._fmtFecha(i.fecha || i.fechaSacrificio)}</span>`,
        badge: `<span class="text-gold font-950">${Math.round(i.importe_total || 0).toLocaleString()} €</span>`
      })).join('');
    } else {
      return d.sanitariosFinca.filter(s => (s.medicamento || '').toLowerCase().includes(f)).slice(0, 15).map(s => this._cardRegistro({
        icon: Icons.sanidad(), title: s.medicamento || 'Tratamiento', color: 'var(--c-purple)', onClick: `location.hash='/sanitario?id=${s.id}'`,
        metadata: `<span>${this._fmtFecha(s.fecha)}</span>`
      })).join('');
    }
  },

  _filtrar(texto) {
    const lista = document.getElementById('hibrido-lista');
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
window.HibridoView = HibridoView;
