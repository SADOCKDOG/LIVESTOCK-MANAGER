/**
 * Livestock Manager - ExplotacionView v1.8.0
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

  async _ensureData(fincaIdRaw, force = false) {
    const fincaId = Number(fincaIdRaw);
    if (!fincaId) { this._cachedData = null; this._cachedFincaId = null; return; }
    if (!force && !this._needsDataRefresh && this._cachedData && this._cachedFincaId === fincaId) return;
    if (this._loadingPromise) { await this._loadingPromise; return; }

    this._needsDataRefresh = false;
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

      // Filtrado ultra-permisivo para asegurar visibilidad en Demo
      const pesajes = eventos.filter(e =>
        (e.unidad?.toLowerCase().startsWith('k') || (e.unit || '').toLowerCase().startsWith('k')) &&
        (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano')
      );

      const ordeños = eventos.filter(e =>
        (e.unidad?.toLowerCase().startsWith('l') || (e.unit || '').toLowerCase().startsWith('l')) &&
        (e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero')
      );

      pesajes.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      ordeños.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

      const totalLitros = ordeños.reduce((sum, o) => sum + (o.valor_neto || 0), 0);
      const totalIngresosLeche = entregasLeche.reduce((s, e) => s + (e.importe_total || (e.cantidad * (e.precioBase || 0) || 0)), 0);
      const totalGastosAlim = todosGastos.filter(g => (g.categoria || '').toLowerCase().match(/alimen|pienso/)).reduce((s, g) => s + (g.monto || 0), 0);

      this._cachedData = {
        fincaId, finca, pesajes, ordeños, totalLitros, totalIngresosLeche, totalGastosAlim,
        animalesFinca: animales.filter(a => rebanos.map(r => r.id).includes(a.rebanoId)),
        mofaLeche: totalIngresosLeche - totalGastosAlim,
        todosGastos: todosGastos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)),
        entregasLeche,
        proConsolidada: [...pesajes, ...ordeños].sort((a,b) => new Date(b.fecha) - new Date(a.fecha))
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

    if (window.App?.updateHeaderColor) App.updateHeaderColor('explotacion');

    // Inicializar sub-módulo activo por defecto si no está definido o es el antiguo legado 'explotacion'
    if (!this._activeSubModule || this._activeSubModule === 'explotacion') {
      this._activeSubModule = 'zonas';
    }

    main.innerHTML = `
      <!-- Cabecera Maestra ExPro Consolidada -->
      <div class="flex items-center gap-12 mb-14 px-4">
        <span class="text-2xl" style="color:var(--c-success); display:inline-flex; align-items:center;">${Icons.finca()}</span>
        <div>
          <h1 class="text-white font-900 text-lg uppercase tracking-wider" style="margin:0; line-height:1.2;">
            <span style="color:var(--c-success); margin-right:4px;">|</span> EXPLOTACIÓN & SOPORTE
          </h1>
          <div class="text-gray" style="font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
            GESTIÓN DE INFRAESTRUCTURA, INSUMOS Y SOPORTE TERRESTRE
          </div>
        </div>
      </div>

      <!-- Barra de Navegación Multipestaña Horizontal ExPro (Scrollable) Premium con Indicadores Animados -->
      <div class="pestanas-premium-wrapper mb-14" style="--mode-color: ${this._getSubModuleMeta(this._activeSubModule).color};">
        <div class="pestana-indicador-flecha pestana-flecha-izq" style="opacity: 0; pointer-events: none;" onclick="this.parentElement.querySelector('.pestanas-premium-container').scrollBy({ left: -100, behavior: 'smooth' })">
          ${Icons.atras()}
        </div>
        <div class="pestanas-premium-container" onscroll="App.evaluarScrollPestanas(this)">
          <div class="pestanas-premium-switch">
            <button class="pestanas-premium-btn ${this._activeSubModule === 'zonas' ? 'active' : ''}" style="--mode-color:var(--c-success);" onclick="ExplotacionView._cambiarSubModulo('zonas')">${Icons.zonas()} ZONAS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'silos' ? 'active' : ''}" style="--mode-color:var(--c-success);" onclick="ExplotacionView._cambiarSubModulo('silos')">${Icons.silos()} SILOS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'fitosanitarios' ? 'active' : ''}" style="--mode-color:var(--c-purple);" onclick="ExplotacionView._cambiarSubModulo('fitosanitarios')">${Icons.sanidad()} FITOSANITARIOS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'gastos' ? 'active' : ''}" style="--mode-color:var(--c-purple);" onclick="ExplotacionView._cambiarSubModulo('gastos')">${Icons.dinero()} FINANZAS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'proveedores' ? 'active' : ''}" style="--mode-color:var(--c-purple);" onclick="ExplotacionView._cambiarSubModulo('proveedores')">${Icons.proveedores()} PROVEEDORES</button>
          </div>
        </div>
        <div class="pestana-indicador-flecha pestana-flecha-der" style="opacity: 0; pointer-events: none;" onclick="this.parentElement.querySelector('.pestanas-premium-container').scrollBy({ left: 100, behavior: 'smooth' })">
          ${Icons.siguiente()}
        </div>
      </div>
      
      <!-- Contenedor Dinámico para la pestaña activa -->
      <div id="expro-tab-content"></div>`;

    // Delegación dinámica de renderizado
    switch (this._activeSubModule) {
      case 'zonas':
        if (window.ZonasView) await ZonasView.render();
        break;
      case 'silos':
        if (window.SilosView) await SilosView.render();
        break;
      case 'fitosanitarios':
        if (window.FitosanitariosView) await FitosanitariosView.render();
        break;
      case 'gastos':
        if (window.GastosView) await GastosView.render();
        break;
      case 'proveedores':
        if (window.ProveedoresView) await ProveedoresView.render();
        break;
    }

    // Inicializar scroll dinámico para la barra de pestañas
    const containerPestanas = document.querySelector('.pestanas-premium-container');
    if (containerPestanas && window.App?.inicializarScrollPestanas) {
      window.App.inicializarScrollPestanas(containerPestanas);
    }
  },

  _renderModoExplotacion(container, d) {
    const meta = window.ModoContextoHelper?.getModeMeta(this._activeMode) || { color: 'var(--c-info)', icon: Icons.leche(), label: 'Lácteo' };
    
    const ccaa = d.finca?.comunidad_autonoma || '';
    const configCCAA = window.ComunidadesService?.getConfiguracionCCAA ? window.ComunidadesService.getConfiguracionCCAA(ccaa) : null;
    const supportsGuia365 = configCCAA?.guia_automatica_si_saneada || false;

    let guia365BannerHtml = '';
    if (supportsGuia365) {
      const isSaneada = d.finca?.calificacion_sanitaria === 'indemne' || d.finca?.calificacion_sanitaria === 'calificada';
      const isGuia365Active = d.finca?.guia_365_habilitada && isSaneada;

      guia365BannerHtml = `
        <div class="card p-12 mb-14 border-222 animate-fade-in" style="background: linear-gradient(135deg, rgba(20,20,20,0.8), rgba(10,10,10,0.9)); border-left: 4px solid ${isGuia365Active ? 'var(--c-success)' : 'var(--c-warning)'}; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
          <div class="flex items-center justify-between gap-10">
            <div class="flex items-center gap-10">
              <div class="flex items-center justify-center rounded-sm" style="width:36px; height:36px; background:#181818; color:${isGuia365Active ? 'var(--c-success)' : 'var(--c-warning)'}; border:1px solid #222; font-weight:900; font-size: 0.8rem;">
                365
              </div>
              <div>
                <div class="text-xs font-black text-white uppercase tracking-wider">GUÍA SANITARIA 365 DÍAS (SIGGAN)</div>
                <div class="text-[0.6rem] font-bold text-gray-400 uppercase tracking-tight mt-2 flex items-center gap-6">
                  <span>${configCCAA?.label || 'Andalucía'}</span>
                  <span>•</span>
                  <span>ESTADO: <strong style="color:${isGuia365Active ? 'var(--c-success)' : 'var(--c-warning)'};">${isGuia365Active ? 'AUTORIZADA / ACTIVA' : 'INACTIVA (REQUIERE SANEAMIENTO)'}</strong></span>
                </div>
              </div>
            </div>
            <button onclick="window.WizardFinca.editar()" class="widget-link-btn widget-link-btn--neon neon-info px-10 py-6 min-h-0 h-auto" style="font-size:0.6rem; font-weight:800; text-transform:uppercase;">
              ${Icons.editar()} Ajustes
            </button>
          </div>
          ${!isGuia365Active ? `
          <div class="text-[0.55rem] text-gray-500 font-bold uppercase tracking-wide mt-8 border-top-222 pt-8">
            Para auto-autorizar guías anuales de 365 días en Andalucía, la explotación debe estar calificada sanitariamente como Oficialmente Indemne (T3/M3/B4) y tener habilitada la opción en ajustes.
          </div>` : `
          <div class="text-[0.55rem] text-gray-400 font-bold uppercase tracking-wide mt-8 border-top-222 pt-8 flex items-center gap-4">
            <span style="color:var(--c-success);">✓</span> Emisión automática de guías habilitada por saneamiento. No requiere confirmación previa por lote.
          </div>`}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="mb-14 px-4">
        <div class="expro-mode-switch">
          <button class="expro-mode-btn ${this._activeMode === 'carne' ? 'active' : ''}" style="--mode-color:var(--c-danger);" onclick="ExplotacionView._cambiarModo('carne')">${Icons.carne()} CARNE</button>
          <button class="expro-mode-btn ${this._activeMode === 'leche' ? 'active' : ''}" style="--mode-color:var(--c-info);" onclick="ExplotacionView._cambiarModo('leche')">${Icons.leche()} LECHE</button>
        </div>
      </div>
      <div class="report-section px-4">
        ${guia365BannerHtml}
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: ${meta.color}">${meta.icon} BALANCE ${meta.label.toUpperCase()}</span>
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
          <span style="color: ${meta.color}; margin-right: 4px;">|</span> ${Icons.documento()} ACTIVIDAD RECIENTE
        </div>
        <div class="grid gap-10">
          ${(this._activeMode === 'leche' ? d.ordeños : d.pesajes).slice(0, 50).map(e => App._cardRegistro({
            icon: this._activeMode === 'leche' ? Icons.leche() : Icons.carne(),
            title: e.snap_identificacion || 'Registro',
            metadata: `<span>${this._fmtFecha(e.fecha)}</span><span>·</span><span>${e.snap_zona || 'Finca'}</span>`,
            badge: `${(e.valor_neto || 0).toLocaleString()} ${e.unidad || ''}`,
            color: meta.color,
            onClick: `ExplotacionView._abrirOpcionesRegistro(${e.id}, '${this._activeMode}')`
          })).join('')}
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
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: var(--c-danger)">${Icons.dinero()} RESUMEN GASTOS</span>
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
          <span style="color: var(--c-purple); margin-right: 4px;">|</span> ${Icons.documento()} HISTORIAL DE GASTOS
        </div>
        <div class="grid gap-10">
          ${gastos.slice(0, 15).map(g => App._cardRegistro({
            icon: Icons.dinero(),
            title: g.concepto || g.categoria,
            metadata: `<span>${this._fmtFecha(g.fecha)}</span><span>·</span><span>${g.categoria}</span>`,
            badge: `${(g.monto || 0).toLocaleString()} €`,
            color: 'var(--c-purple)',
            onClick: `App.renderDetalleGasto(new URLSearchParams('id=${g.id}'))`
          })).join('')}
        </div>
      </div>
      <div class="fab-container" style="--fab-neon-color: var(--c-purple);" onclick="App._abrirFormularioGasto({ origenModulo: 'explotacion' })">
        <span class="fab-label">Nuevo Gasto</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  async _abrirOpcionesRegistro(eventId, modo) {
    if (modo === 'leche') {
      if (window.ProduccionView) await window.ProduccionView._abrirOpcionesRegistro(eventId);
    } else if (modo === 'carne') {
      if (window.CarneView) await window.CarneView._abrirOpcionesRegistro(eventId);
    } else {
      App?.toast(`Visualizando registro #${eventId} en modo ${modo}`);
    }
  },

  _getSubModuleMeta(sub) {
    const map = {
      zonas: { color: 'var(--c-success)' },
      silos: { color: 'var(--c-success)' },
      fitosanitarios: { color: 'var(--c-purple)' },
      gastos: { color: 'var(--c-purple)' },
      proveedores: { color: 'var(--c-purple)' }
    };
    return map[sub] || map.zonas;
  }
};

window.ExplotacionView = ExplotacionView;
