/**
 * Livestock Manager - GastosView v2.2.0
 * Vista de Gastos refactorizada bajo patrón "Aglutinadora"
 */
const GastosView = {
  _currentTab: 'todos',
  _cachedData: null,

  async render() {
    const main = document.getElementById('app-content');
    const fincaId = await Fincas?.getActiveId();
    const gastosRecords = await Gastos.list(fincaId);

    const totalGeneral = gastosRecords.reduce((s, g) => s + (g.monto || 0), 0);
    const categorias = ['Alimentacion', 'Sanidad', 'Electricidad', 'Personal', 'Otros'];

    main.innerHTML = `
      <div class="card-registro mb-10 mx-4" style="--registro-color: var(--c-danger);">
        <div class="flex items-center gap-12 mb-12">
          <span class="text-3xl" style="color:var(--c-danger);">${Icons.dinero()}</span>
          <div>
            <div class="text-white font-900 text-lg uppercase">Gestión de Gastos</div>
            <div class="text-gray" style="font-size:0.68rem;">Control financiero de la explotación</div>
          </div>
        </div>

        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="flex justify-between items-center mb-6">
            <span class="text-xs text-white font-black uppercase tracking-wider flex items-center gap-6">${Icons.gastos()} Resumen de Gastos</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 border-bottom-222 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Total Global</span>
              <strong class="text-lg font-950" style="color: var(--c-danger);">${totalGeneral.toLocaleString()} €</strong>
            </div>
            ${categorias.map(cat => `
              <div class="py-10 border-bottom-222 flex justify-between items-center">
                <span class="text-[0.65rem] text-gray uppercase font-900">${cat}</span>
                <strong class="text-md font-900" style="color: #fff;">${gastosRecords.filter(g => g.categoria === cat).reduce((s, g) => s + (g.monto || 0), 0).toLocaleString()} €</strong>
              </div>`).join('')}
          </div>
        </div>

        <div class="flex gap-8 items-center mb-12">
          <div class="relative flex-1 min-w-0">
            <input type="search" placeholder="Buscar gasto..." oninput="GastosView._filtrar(this.value)" class="search-input w-full">
          </div>
        </div>

        <div id="gasto-lista" class="grid gap-10">
          ${this._getRecordsHtml(gastosRecords)}
        </div>
      </div>
      <div class="fab-container" onclick="App._abrirFormularioGasto()">
        <span class="fab-label">Nuevo Gasto</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;

    this._cachedData = { gastosRecords };
  },

  _getRecordsHtml(records, filtro = '') {
    const f = filtro.toLowerCase();
    return records.filter(g => (g.concepto || '').toLowerCase().includes(f)).slice(0, 30).map(g => `
      <div class="card-registro" onclick="ProduccionView._abrirOpcionesGasto(${g.id})" style="display:flex; gap:10px; align-items:stretch; --registro-color: var(--c-purple); cursor:pointer;">
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-10 min-w-0">
            <span class="text-xl" style="color:var(--c-purple);">${Icons.gastos()}</span>
            <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold);">${g.concepto || g.categoria}</div>
          </div>
          <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">
            <span>${new Date(g.fecha).toLocaleDateString()}</span><span>·</span><span>${g.categoria}</span>
          </div>
        </div>
        <div class="flex flex-col items-end justify-between flex-shrink-0">
          <div class="top-part"><span class="text-gold font-950">${(g.monto || 0).toLocaleString()} €</span></div>
          <div class="bottom-part"><span style="color:var(--c-warning); font-weight:700; font-size:0.7rem; text-transform:uppercase;">Ficha ➔</span></div>
        </div>
      </div>`).join('');
  },

  _filtrar(texto) {
    const lista = document.getElementById('gasto-lista');
    if (lista) lista.innerHTML = this._getRecordsHtml(this._cachedData.gastosRecords, texto);
  }
};
window.GastosView = GastosView;
