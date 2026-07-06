/**
 * Livestock Manager - LecheView v3.4.0
 * Vista del Módulo de Leche refactorizada bajo patrón "Aglutinadora"
 */
const LecheView = {
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

    const [rebanos, animales, entregas, sanitariosGanado, todosGastos] = await Promise.all([
      window.db?.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db?.getAll('animales').catch(() => []),
      window.db?.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
      window.db?.getAll('sanitarios_ganado').catch(() => []),
      window.db?.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => [])
    ]);

    entregas?.sort((a, b) => new Date(b?.fechaRecogida || b?.fecha || 0) - new Date(a?.fechaRecogida || a?.fecha || 0));

    const rebanosLeche = rebanos?.filter(r => r?.tipo?.toLowerCase()?.match(/leche|láct|mixt|híbr|doble/)) || [];
    const rebanosLecheIds = rebanosLeche.map(r => r.id);
    const animalesLeche = animales?.filter(a => rebanosLecheIds.includes(a?.rebanoId)) || [];
    const sanitariosLeche = sanitariosGanado?.filter(s => rebanosLecheIds.includes(s?.rebanoId)) || [];

    // KPIs
    const numEntregas = entregas?.length || 0;
    const litrosTotal = entregas?.reduce((s, e) => s + (e?.cantidad || 0), 0) || 0;
    const importeTotal = entregas?.reduce((s, e) => s + (e?.importe_total || (e?.cantidad || 0) * (e?.precioBase || 0) || 0), 0) || 0;

    const totalGastosAlim = todosGastos?.filter(g =>
      (g?.categoria || '').toLowerCase()?.includes('alimentaci') ||
      (g?.concepto || '').toLowerCase()?.includes('pienso')
    ).reduce((s, g) => s + (g?.monto || 0), 0) || 0;

    main.innerHTML = `
      <div class="mb-14 px-4">
        <div class="scroll-shadow-container scroll-tabs-row mb-10">
          <div class="leche-tabs">
            <button class="leche-tab active" data-tab="patrimonio" onclick="LecheView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio</button>
            <button class="leche-tab" data-tab="comercializacion" onclick="LecheView._cambiarTab('comercializacion')">${Icons.transportistas()} Comercialización</button>
            <button class="leche-tab" data-tab="legislacion" onclick="LecheView._cambiarTab('legislacion')">${Icons.documento()} Sanidad</button>
          </div>
        </div>
      </div>
      <div id="leche-content"></div>`;

    this._cachedData = {
      entregas, rebanosLeche, animalesLeche, sanitariosLeche,
      kpis: {
        patrimonio: [
          { label: 'Censo Leche', value: animalesLeche.length + ' cab.' },
          { label: 'Lotes Leche', value: rebanosLeche.length },
          { label: 'Raza Principal', value: animalesLeche[0]?.raza || 'N/D' }
        ],
        comercializacion: [
          { label: 'Entregado', value: litrosTotal.toLocaleString() + ' L', color: 'var(--c-warning)' },
          { label: 'Entregas', value: numEntregas },
          { label: 'Facturación', value: Math.round(importeTotal).toLocaleString() + ' €', color: 'var(--c-success)' }
        ],
        legislacion: [
          { label: 'Sanitarios', value: sanitariosLeche.length, color: 'var(--c-purple)' },
          { label: 'Alimentación', value: totalGastosAlim.toLocaleString() + ' €', color: 'var(--c-danger)' }
        ]
      }
    };
    this._renderTabActual();
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.leche-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    const content = document.getElementById('leche-content');
    if (!d || !content) return;

    let color = this._currentTab === 'patrimonio' ? 'var(--c-warning)' : (this._currentTab === 'comercializacion' ? 'var(--c-success)' : 'var(--c-purple)');
    let icon = this._currentTab === 'patrimonio' ? Icons.edificio() : (this._currentTab === 'comercializacion' ? Icons.transportistas() : Icons.documento());

    content.innerHTML = `
      <div class="mb-10 mx-4">
        <div class="flex items-center gap-12 mb-12">
          <span class="text-3xl" style="color:${color};">${icon}</span>
          <div>
            <div class="text-white font-900 text-lg uppercase">${this._currentTab} Leche</div>
            <div class="text-gray" style="font-size:0.68rem;">Gestión integral del sector lácteo</div>
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
            <input type="search" placeholder="Buscar en registros..." oninput="LecheView._filtrar(this.value)" class="search-input w-full">
          </div>
        </div>

        <div id="leche-lista" class="grid gap-10">
          ${this._getRecordsHtml()}
        </div>
      </div>
      <div class="fab-container" style="--fab-neon-color: ${color};" onclick="${this._currentTab === 'patrimonio' ? 'location.hash=&apos;/animal&apos;' : (this._currentTab === 'comercializacion' ? 'App._abrirWizardAlbaranLeche()' : 'App._registrarTratamientoRebano(null)')}">
        <span class="fab-label">${this._currentTab === 'patrimonio' ? 'Nuevo Animal' : (this._currentTab === 'comercializacion' ? 'Nueva Entrega Leche' : 'Nuevo Tratamiento')}</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  _getRecordsHtml(filtro = '') {
    const d = this._cachedData;
    const f = filtro.toLowerCase();
    if (this._currentTab === 'patrimonio') {
      return d.animalesLeche.filter(a => (a.nombre || a.numero_identificacion || '').toLowerCase().includes(f)).slice(0, 15).map(a => this._renderCardAnimal(a)).join('');
    } else if (this._currentTab === 'comercializacion') {
      return d.entregas.filter(e => (e.matriculaCisterna || '').toLowerCase().includes(f)).slice(0, 15).map(e => this._cardEntrega(e)).join('');
    } else {
      return d.sanitariosLeche.filter(s => (s.medicamento || '').toLowerCase().includes(f)).slice(0, 15).map(s => {
          const enSup = (s.tiempo_espera_leche_dias || 0) > 0;
          return App._cardRegistro({
            icon: Icons.sanidad(), title: s.medicamento || 'Tratamiento', color: enSup ? 'var(--c-danger)' : 'var(--c-purple)', onClick: `location.hash='/sanitario?id=${s.id}'`,
            metadata: `<span>${this._fmtFecha(s.fecha)}</span><span>·</span><span>Espera: ${s.tiempo_espera_leche_dias || 0}d</span>`,
            badge: enSup ? 'SUPRESIÓN' : 'LIBRE'
          });
      }).join('');
    }
  },

  _renderCardAnimal(a) {
    return App._cardRegistro(App._getAnimalCardProps(a, null));
  },

  _cardEntrega(e) {
      return App._cardRegistro({
        color: 'var(--c-success)', icon: Icons.leche(), title: `Cisterna: ${e.matriculaCisterna || 'S/N'}`, onClick: `location.hash='/albaran-leche?id=${e.id}'`,
        metadata: `<span>${this._fmtFecha(e.fechaRecogida || e.fecha)}</span>`,
        badge: `${(e.cantidad || 0).toLocaleString()} L`
      });
  },

  _filtrar(texto) {
    const lista = document.getElementById('leche-lista');
    if (lista) lista.innerHTML = this._getRecordsHtml(texto);
  }
,

  async _abrirAsistenteTratamientoLeche() {
    const d = this._cachedData;
    if (!d || d.rebanosLeche.length === 0) { App?.toastError("No hay rebaños lecheros."); return; }
    if (d.rebanosLeche.length === 1) { await window.WizardTratamiento?.registrar(d.rebanosLeche[0].id); return; }

    const overlay = document.createElement("div");
    overlay.className = "wizard-full-screen flex justify-center items-center bg-black/80";
    overlay.innerHTML = `
      <div class="card-registro p-25 w-full max-w-[380px]" style="--registro-color: var(--c-warning);">
        <h3 class="mt-0 text-white font-900 flex items-center gap-8">${Icons.sanidad()} TRATAMIENTO LÁCTEO</h3>
        <label class="wizard-label mb-10 uppercase font-800 text-xs">Selecciona el rebaño:</label>
        <select id="w-treat-reb" class="wizard-input mb-20 bg-black text-white border-222">
          ${d.rebanosLeche.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('')}
        </select>
        <div class="flex gap-10">
          <button class="btn btn-primary flex-1" id="btn-treat-next">CONTINUAR</button>
          <button class="btn btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">CANCELAR</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#btn-treat-next').onclick = async () => {
      const rebId = parseInt(document.getElementById('w-treat-reb').value);
      overlay.remove();
      await window.WizardTratamiento?.registrar(rebId);
      setTimeout(() => LecheView.render(), 1000);
    };
  },
};

window.LecheView = LecheView;
