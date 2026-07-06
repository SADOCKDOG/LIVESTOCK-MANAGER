/**
 * Livestock Manager - ExplotacionView v1.6.0
 * Vista unificada del Módulo ExPro (Explotación y Producción)
 */
const ExplotacionView = {
  _activeMode: 'leche',
  _activeSubModule: 'explotacion',
  _cachedData: null,
  _cachedFincaId: null,
  _needsDataRefresh: false,
  _loadingPromise: null,

  _cambiarSubModulo(subModulo) {
    this._activeSubModule = subModulo;
    this.render();
  },

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  _fmt(val) {
    if (val == null || isNaN(val)) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 });
  },

  async _ensureData(fincaId, force = false) {
    if (!fincaId) { this._cachedData = null; this._cachedFincaId = null; return; }
    if (!force && !this._needsDataRefresh && this._cachedData && this._cachedFincaId === fincaId) return;
    if (this._loadingPromise) { await this._loadingPromise; return; }

    this._needsDataRefresh = false; // Reset early to avoid double loads
    this._loadingPromise = (async () => {
      const finca = await Fincas?.getActive();
      const [rebanos, animales, eventosRaw, todosGastos, entregasLeche, ventasCarne] = await Promise.all([
        window.db?.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
        window.db?.getAll('animales').catch(() => []),
        window.db?.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []),
        window.db?.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []),
        window.db?.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
        window.db?.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => [])
      ]);

      const eventos = (eventosRaw || []).filter(e => !e?.anulado);
      this._activeMode = window.ModoContextoHelper?.getModeForBlock('explotacion', rebanos) || 'leche';

      const rebanosCarne = window.ModoContextoHelper?.filterRebanosByMode(rebanos, 'carne') || [];
      const rebanosLeche = window.ModoContextoHelper?.filterRebanosByMode(rebanos, 'leche') || [];
      const rebanosHibrido = window.ModoContextoHelper?.filterRebanosByMode(rebanos, 'hibrido') || [];

      // Pesajes: unidad kg
      const pesajes = eventos.filter(e => e.unidad === 'kg' && (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano'));
      pesajes.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

      // Ordeños: unidad L o Litros
      const ordeños = eventos.filter(e => (e.unidad === 'L' || e.unidad === 'Litros') && (e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero'));
      ordeños.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

      const totalLitros = ordeños.reduce((sum, o) => sum + (o.valor_neto || 0), 0);
      const totalIngresosLeche = entregasLeche.reduce((s, e) => s + (e.importe_total || (e.cantidad * e.precioBase || 0)), 0);
      const totalGastosAlim = todosGastos.filter(g => (g.categoria || '').toLowerCase().match(/alimen|pienso/)).reduce((s, g) => s + (g.monto || 0), 0);

      this._cachedData = {
        finca, pesajes, ordeños, totalLitros, totalIngresosLeche, totalGastosAlim,
        animalesFinca: animales.filter(a => rebanos.map(r => r.id).includes(a.rebanoId)),
        rebanosLeche, rebanosCarne, rebanosHibrido,
        mofaLeche: totalIngresosLeche - totalGastosAlim,
        todosGastos: todosGastos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
      };
      this._cachedFincaId = fincaId;
    })();
    await this._loadingPromise;
    this._loadingPromise = null;
  },

  invalidateCache() { this._needsDataRefresh = true; },

  async render(options) {
    const main = document.getElementById('app-content');
    const fincaId = await Fincas?.getActiveId();
    if (!fincaId) { main.innerHTML = `<div class="p-20 text-center"><p class="text-gray">Sin finca activa.</p></div>`; return; }
    await this._ensureData(fincaId, !!options?.force || this._needsDataRefresh);

    const d = this._cachedData;
    if (window.App?.updateHeaderColor) App.updateHeaderColor(this._activeMode);

    main.innerHTML = `
      <div class="mb-14 px-4">
        <div class="comer-mode-switch">
          <button class="comer-mode-btn ${this._activeSubModule === 'explotacion' ? 'active' : ''}" style="--mode-color:var(--c-success);" onclick="ExplotacionView._cambiarSubModulo('explotacion')">${Icons.finca()} Explotación</button>
          <button class="comer-mode-btn ${this._activeSubModule === 'gastos' ? 'active' : ''}" style="--mode-color:var(--c-danger);" onclick="ExplotacionView._cambiarSubModulo('gastos')">${Icons.dinero()} Gastos</button>
        </div>
      </div>
      <div id="expro-main-content"></div>`;

    const container = document.getElementById('expro-main-content');
    if (this._activeSubModule === 'explotacion') this._renderModoExplotacion(container, d);
    else this._renderGastosView(container, d);
  },

  _renderModoExplotacion(container, d) {
    const meta = window.ModoContextoHelper?.getModeMeta(this._activeMode) || { color: 'var(--c-info)', icon: Icons.leche(), label: 'Lácteo' };
    container.innerHTML = `
      <div class="mb-14 px-4">
        <div class="expro-mode-switch">
          <button class="expro-mode-btn ${this._activeMode === 'carne' ? 'active' : ''}" style="--mode-color:var(--c-danger);" onclick="ExplotacionView._cambiarModo('carne')">${Icons.carne()} Carne</button>
          <button class="expro-mode-btn ${this._activeMode === 'leche' ? 'active' : ''}" style="--mode-color:var(--c-info);" onclick="ExplotacionView._cambiarModo('leche')">${Icons.leche()} Leche</button>
        </div>
      </div>
      <div class="report-section px-4">
        <!-- Card de RESUMEN Normalizada -->
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: ${meta.color}">${meta.icon} Balance ${meta.label}</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 flex justify-between items-center border-bottom-222">
              <span class="text-[0.65rem] text-gray uppercase font-900">Producción Total</span>
              <strong class="text-lg font-950">${this._activeMode === 'leche' ? d.totalLitros.toLocaleString() + ' L' : d.pesajes.length + ' pesajes'}</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Margen Estimado</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.mofaLeche).toLocaleString()} €</strong>
            </div>
          </div>
        </div>

        <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          ${Icons.documento()} ACTIVIDAD RECIENTE
        </div>
        <div class="grid gap-10">
          ${(this._activeMode === 'leche' ? d.ordeños : d.pesajes).slice(0, 15).map(e => `
            <div class="card-registro" style="display:flex; gap:10px; align-items:stretch; --registro-color: ${meta.color};" onclick="ExplotacionView._abrirOpcionesRegistro(${e.id}, '${e.tipo_entidad || ''}', ${e.entidad_id || 0})">
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${e.snap_identificacion || 'Registro'}</div>
                <div class="text-[0.6rem] text-gray font-800 uppercase mt-2">${this._fmtFecha(e.fecha)} · ${e.snap_zona || 'Finca'}</div>
              </div>
              <div class="flex flex-col items-end justify-between flex-shrink-0">
                <div style="background:${meta.color}15; color:${meta.color}; border: 1px solid ${meta.color}40; filter: drop-shadow(0 0 4px ${meta.color}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                  ${(e.valor_neto || 0).toLocaleString()} ${e.unidad || ''}
                </div>
                <span style="font-size: 0.7rem; font-weight: 800; color: var(--c-warning); text-transform: uppercase;">Ficha ${Icons.flechaDerecha()}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="fab-container" style="--fab-neon-color: ${meta.color};" onclick="App._abrirAsistenteProduccion('${this._activeMode}', { origen_modulo: 'explotacion', modo_explotacion: this._activeMode })">
        <span class="fab-label">${this._activeMode === 'leche' ? 'Registrar Ordeño' : 'Registrar Pesaje'}</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  _cambiarModo(modo) {
    this._activeMode = modo;
    if (window.ModoContextoHelper) ModoContextoHelper.setModeForBlock('explotacion', modo);
    this.render();
  },

  _renderGastosView(container, d) {
    const gastos = d.todosGastos || [];
    container.innerHTML = `
      <div class="report-section px-4">
        <!-- Card de RESUMEN Normalizada -->
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: var(--c-danger)">${Icons.dinero()} Resumen Gastos</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Total Gastos</span>
              <strong class="text-lg font-950" style="color: var(--c-danger);">${gastos.reduce((s, g) => s + (g.monto || 0), 0).toLocaleString()} €</strong>
            </div>
          </div>
        </div>

        <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          ${Icons.documento()} HISTORIAL DE GASTOS
        </div>
        <div class="grid gap-10">
          ${gastos.slice(0, 15).map(g => `
            <div class="card-registro" style="display:flex; gap:10px; align-items:stretch; --registro-color: var(--c-purple);" onclick="ExplotacionView._abrirOpcionesGasto(${g.id})">
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${g.concepto || g.categoria}</div>
                <div class="text-[0.6rem] text-gray font-800 uppercase mt-2">${this._fmtFecha(g.fecha)} · ${g.categoria}</div>
              </div>
              <div class="flex flex-col items-end justify-between flex-shrink-0">
                <div style="background:var(--c-purple)15; color:var(--c-purple); border: 1px solid var(--c-purple)40; filter: drop-shadow(0 0 4px var(--c-purple)); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                  ${(g.monto || 0).toLocaleString()} €
                </div>
                <span style="font-size: 0.7rem; font-weight: 800; color: var(--c-warning); text-transform: uppercase;">Ficha ${Icons.flechaDerecha()}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="fab-container" style="--fab-neon-color: var(--c-purple);" onclick="App._abrirFormularioGasto({ origenModulo: 'explotacion', modoExplotacion: this._activeMode })">
        <span class="fab-label">Nuevo Gasto</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  async _abrirOpcionesRegistro(eventId, entidadTipo, entidadId) {
    if (entidadTipo === 'animal' && entidadId) {
        location.hash = `#/animal?id=${entidadId}`;
    } else if (entidadTipo === 'rebano' && entidadId) {
        location.hash = `#/rebano?id=${entidadId}`;
    } else {
        App?.toast(`Visualizando registro #${eventId}`);
    }
  },

  async _abrirOpcionesGasto(id) {
    location.hash = `#/gasto?id=${id}`;
  }
};

window.ExplotacionView = ExplotacionView;
