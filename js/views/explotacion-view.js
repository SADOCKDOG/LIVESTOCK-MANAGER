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
  _filtroActividad: '',

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
      const [rebanos, animales, eventosRaw, todosGastos, entregasLeche, ventasCarne, silos] = await Promise.all([
        window.db?.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
        window.db?.getAll('animales').catch(() => []),
        window.db?.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []),
        window.db?.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []),
        window.db?.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
        window.db?.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
        window.db?.getAll('config_silos').catch(() => [])
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
      const mofaLeche = totalIngresosLeche - totalGastosAlim;

      // Métricas complementarias de calidad láctea (coherente con LecheView)
      const totalLitrosControles = ordeños.reduce((s, o) => s + (o.valor_neto || 0), 0);
      const conLab = entregasLeche.filter(e => e.laboratorio);
      const grasaMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.grasa || 0), 0) / conLab.length : 0;
      const protMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.proteina || 0), 0) / conLab.length : 0;

      // GMD (Ganancia Media Diaria) por animal, coherente con CarneView
      const pesajesPorAnimal = {};
      pesajes.forEach(p => {
        if (p.tipo_entidad === 'animal' && p.entidad_id) {
          if (!pesajesPorAnimal[p.entidad_id]) pesajesPorAnimal[p.entidad_id] = [];
          pesajesPorAnimal[p.entidad_id].push(p);
        }
      });
      const gmdList = [];
      for (const animId in pesajesPorAnimal) {
        const pts = pesajesPorAnimal[animId].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        if (pts.length >= 2) {
          const pIni = pts[0].valor_neto || 0;
          const pFin = pts[pts.length - 1].valor_neto || 0;
          const dias = (new Date(pts[pts.length - 1].fecha) - new Date(pts[0].fecha)) / (1000 * 60 * 60 * 24);
          if (dias > 0) {
            gmdList.push({ animalId: animId, gmd: (pFin - pIni) / dias, ultimoPeso: pFin, primerPeso: pIni, dias });
          }
        }
      }

      // Margen Comercial Neto Real de Carne (coherente con ComercializacionView)
      const totalIngresosCarne = (ventasCarne || []).reduce((s, v) => s + (v.precio_total || 0), 0);
      const gastoTransporteCarne = (ventasCarne || []).reduce((s, v) => s + (parseFloat(v.Gasto_Transporte) || 0), 0);
      const gastoMatanzaCarne = (ventasCarne || []).reduce((s, v) => s + (parseFloat(v.Gasto_Matanza) || 0), 0);
      const margenCarne = totalIngresosCarne - gastoTransporteCarne - gastoMatanzaCarne;

      this._cachedData = {
        fincaId, finca, pesajes, ordeños, totalLitros, totalIngresosLeche, totalGastosAlim,
        animalesFinca: animales.filter(a => rebanos.map(r => r.id).includes(a.rebanoId)),
        mofaLeche,
        totalLitrosControles,
        grasaMedia,
        protMedia,
        gmdList,
        margenCarne,
        margenHibrido: mofaLeche + margenCarne,
        ventasCarne,
        silosCriticos: (silos || []).filter(s => {
          const cap = Number(s.capacidad) || 0;
          const pct = cap > 0 ? (Number(s.cantidadActual) || 0) / cap * 100 : 100;
          return pct < 15;
        }),
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

    // Inicializar sub-módulo activo por defecto si no está definido
    if (!this._activeSubModule) {
      this._activeSubModule = 'explotacion';
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
          <div class="pestanas-premium-switch" role="tablist" aria-label="Secciones de Explotación y Soporte">
            <button class="pestanas-premium-btn ${this._activeSubModule === 'explotacion' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'explotacion'}" style="--mode-color:var(--c-success);" onclick="ExplotacionView._cambiarSubModulo('explotacion')">${Icons.finca()} EXPRO</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'silos' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'silos'}" style="--mode-color:var(--c-success);" onclick="ExplotacionView._cambiarSubModulo('silos')">${Icons.silos()} SILOS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'fitosanitarios' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'fitosanitarios'}" style="--mode-color:var(--c-purple);" onclick="ExplotacionView._cambiarSubModulo('fitosanitarios')">${Icons.sanidad()} FITOSANITARIOS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'gastos' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'gastos'}" style="--mode-color:var(--c-purple);" onclick="ExplotacionView._cambiarSubModulo('gastos')">${Icons.dinero()} FINANZAS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'proveedores' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'proveedores'}" style="--mode-color:var(--c-purple);" onclick="ExplotacionView._cambiarSubModulo('proveedores')">${Icons.proveedores()} PROVEEDORES</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'tramites' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'tramites'}" style="--mode-color:var(--c-info);" onclick="ExplotacionView._cambiarSubModulo('tramites')">${Icons.documento()} TRÁMITES</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'traslado' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'traslado'}" style="--mode-color:var(--c-warning);" onclick="ExplotacionView._cambiarSubModulo('traslado')">${Icons.documento()} TRASLADO</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'censo' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'censo'}" style="--mode-color:var(--c-warning);" onclick="ExplotacionView._cambiarSubModulo('censo')">${Icons.documento()} CENSO</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'crotales' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'crotales'}" style="--mode-color:var(--c-warning);" onclick="ExplotacionView._cambiarSubModulo('crotales')">${Icons.documento()} CROTALES</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'guia' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'guia'}" style="--mode-color:var(--c-warning);" onclick="ExplotacionView._cambiarSubModulo('guia')">${Icons.documento()} GUÍA MOVIMIENTO</button>
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
      case 'explotacion':
        const d = this._cachedData || (await this._ensureData(fincaId, this._needsDataRefresh) || this._cachedData);
        this._renderModoExplotacion(document.getElementById('expro-tab-content'), d);
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
      case 'tramites':
        await this._renderTramitesView(document.getElementById('expro-tab-content'), fincaId);
        break;
      case 'traslado':
        let oldHash = location.hash;
        try {
          if (window.App && window.App._abrirWizardTraslado) await window.App._abrirWizardTraslado();
          else if (window.WizardTraslado) await window.WizardTraslado.abrir();
        } finally {
          if (!location.hash.startsWith('#/expro')) {
            location.hash = oldHash;
          }
        }
        break;
      case 'censo':
        let oldHash = location.hash;
        try {
          if (window.App && window.App._abrirWizardCenso) await window.App._abrirWizardCenso();
          else if (window.WizardCenso) await window.WizardCenso.abrir();
        } finally {
          if (!location.hash.startsWith('#/expro')) {
            location.hash = oldHash;
          }
        }
        break;
      case 'crotales':
        let oldHash = location.hash;
        try {
          if (window.App && window.App._abrirWizardCrotales) await window.App._abrirWizardCrotales();
          else if (window.WizardCrotales) await window.WizardCrotales.abrir();
        } finally {
          if (!location.hash.startsWith('#/expro')) {
            location.hash = oldHash;
          }
        }
        break;
      case 'guia':
        let oldHash = location.hash;
        try {
          if (window.App && window.App._abrirWizardGuiaMovimiento) await window.App._abrirWizardGuiaMovimiento();
          else if (window.WizardGuiaMovimiento) await window.WizardGuiaMovimiento.abrir();
        } finally {
          if (!location.hash.startsWith('#/expro')) {
            location.hash = oldHash;
          }
        }
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
          <button class="expro-mode-btn ${this._activeMode === 'hibrido' ? 'active' : ''}" style="--mode-color:var(--c-success);" onclick="ExplotacionView._cambiarModo('hibrido')">${Icons.rotacion()} HÍBRIDO</button>
        </div>
      </div>
      <div class="report-section px-4">
        ${guia365BannerHtml}
        ${(d.silosCriticos && d.silosCriticos.length > 0) ? `
        <div class="card p-14 mb-14 border-222 card-resumen" style="background: rgba(255, 68, 68, 0.03); border-left: 4px solid var(--c-danger);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6" style="color:var(--c-danger);">
            ${Icons.alerta()} TELEMETRÍA DE ALIMENTACIÓN: STOCK BAJO (&lt;15%)
          </div>
          <div class="flex flex-col gap-6 mt-6">
            ${d.silosCriticos.map(s => {
              const cap = Number(s.capacidad) || 0;
              const pct = cap > 0 ? Math.round((Number(s.cantidadActual) || 0) / cap * 100) : 0;
              return `<div class="flex items-center justify-between p-8 rounded-sm" style="background:#080808; border:1px solid #1a1a1a;">
                <span class="text-[0.65rem] font-black text-white uppercase">${s.nombre || 'Silo'} (${s.alimento || 'Pienso'})</span>
                <span class="text-xs font-mono font-950" style="color:var(--c-danger);">${(Number(s.cantidadActual)||0).toLocaleString()} / ${cap.toLocaleString()} kg (${pct}%)</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: ${meta.color}">${meta.icon} BALANCE ${meta.label.toUpperCase()}</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 flex justify-between items-center border-bottom-222">
              <span class="text-[0.65rem] text-gray uppercase font-900">Producción Total</span>
              <strong class="text-lg font-950">${this._activeMode === 'leche' ? d.totalLitros.toLocaleString() + ' L' : this._activeMode === 'carne' ? d.pesajes.length + ' pesajes' : d.totalLitros.toLocaleString() + ' L / ' + d.pesajes.length + ' pesajes'}</strong>
            </div>

            <!-- Mode-specific metrics -->
            ${this._activeMode === 'leche' ? `
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">MOFA (Leche)</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.mofaLeche).toLocaleString()} €</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Litros Totales</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${d.totalLitros.toLocaleString()} L</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Litros Control</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${d.totalLitrosControles.toLocaleString()} L</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Grasa Media</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${d.grasaMedia.toFixed(2)}%</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Proteína Media</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${d.protMedia.toFixed(2)}%</strong>
            </div>` : this._activeMode === 'carne' ? `
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Margen Neto (Carne)</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.margenCarne).toLocaleString()} €</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">GMD (Ganancia Media Diaria)</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularGMDCarne() > 0 ? this._calcularGMDCarne().toFixed(2) + ' kg/día' : '0.00 kg/día'}</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Peso Total Ganado</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularPesoTotalCarne().toLocaleString()} kg</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">ICA (Conversión Alimenticia)</span>
              <strong class="text-lg font-950" style="color: ${this._calcularICACarne().ica > 0 && this._calcularICACarne().ica <= 6 ? 'var(--c-success)' : this._calcularICACarne().ica > 8 ? 'var(--c-danger)' : 'var(--c-warning)'};">${this._calcularICACarne().ica > 0 ? this._calcularICACarne().ica.toFixed(2) + ' : 1' : 'N/D'}</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Costo/kg Ganancia</span>
              <strong class="text-lg font-950" style="color: var(--c-warning);">${this._calcularICACarne().costePorKgGanancia > 0 ? this._calcularICACarne().costePorKgGanancia.toFixed(2) + ' €/kg' : '0.00 €/kg'}</strong>
            </div>` : `
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Margen Consolidado</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.margenHibrido).toLocaleString()} €</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">MOFA (Leche)</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${Math.round(d.mofaLeche).toLocaleString()} €</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Peso Total Ganado (Carne)</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${this._calcularPesoTotalCarne().toLocaleString()} kg</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">ICA Promedio</span>
              <strong class="text-lg font-950" style="color: var(--c-info);">${this._calcularICACarne().ica > 0 ? this._calcularICACarne().ica.toFixed(2) + ' : 1' : 'N/D'}</strong>
            </div>`
          }
          </div>
        </div>

        <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          <span style="color: ${meta.color}; margin-right: 4px;">|</span> ${Icons.documento()} ACTIVIDAD RECIENTE
        </div>
        <div class="mb-10 relative">
          <input type="text" id="expro-search-actividad" class="wizard-input font-bold uppercase py-12 px-16 pr-40 text-sm"
                 placeholder="BUSCAR POR CROTAL O ZONA..." value="${this._filtroActividad}"
                 oninput="ExplotacionView._filtrarActividad(this.value)">
          <div style="position:absolute; right:15px; top:50%; transform:translateY(-50%); pointer-events:none; color:${meta.color};">
            ${Icons.buscar()}
          </div>
        </div>
        <div class="grid gap-10" id="expro-actividad-grid">
          ${this._renderActividadItems()}
        </div>
      </div>
      <div class="fab-container" style="--fab-neon-color: ${meta.color};" onclick="App._abrirAsistenteProduccion('${this._activeMode}', { origen_modulo: 'explotacion', modo_explotacion: this._activeMode })">
        <span class="fab-label">${this._activeMode === 'leche' ? 'Registrar Ordeño' : this._activeMode === 'carne' ? 'Registrar Pesaje' : 'Registrar Producción'}</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  _cambiarModo(modo) {
    this._activeMode = modo;
    this._filtroActividad = '';
    if (window.ModoContextoHelper) ModoContextoHelper.setModeForBlock('explotacion', modo);
    this.render();
  },

  /** Filtra la lista de "Actividad Reciente" por crotal o zona, sin re-renderizar toda la vista (conserva el foco del buscador). */
  _filtrarActividad(texto) {
    this._filtroActividad = texto;
    const grid = document.getElementById('expro-actividad-grid');
    if (!grid) return;
    grid.innerHTML = this._renderActividadItems();
  },

  _renderActividadItems() {
    const d = this._cachedData;
    if (!d) return '';
    const meta = { color: this._activeMode === 'carne' ? 'var(--c-danger)' : this._activeMode === 'leche' ? 'var(--c-info)' : 'var(--c-success)' };
    const texto = (this._filtroActividad || '').trim().toLowerCase();
    let items = this._activeMode === 'leche' ? d.ordeños : d.pesajes;
    if (texto) {
      items = items.filter(e =>
        (e.snap_identificacion || '').toLowerCase().includes(texto) ||
        (e.snap_zona || '').toLowerCase().includes(texto)
      );
    }
    if (!items.length) {
      return `<div class="empty-state py-30 text-center"><p class="empty-state-text text-gray-500 font-bold uppercase text-xs">Sin registros que coincidan con la búsqueda.</p></div>`;
    }
    return items.slice(0, 50).map(e => App._cardRegistro({
      icon: this._activeMode === 'leche' ? Icons.leche() : Icons.carne(),
      title: e.snap_identificacion || 'Registro',
      metadata: `<span>${this._fmtFecha(e.fecha)}</span><span>·</span><span>${e.snap_zona || 'Finca'}</span>`,
      badge: `${(e.valor_neto || 0).toLocaleString()} ${e.unidad || ''}`,
      color: meta.color,
      onClick: `ExplotacionView._abrirOpcionesRegistro(${e.id}, '${this._activeMode}')`
    })).join('');
  },

  // Helper methods for calculating carne-specific metrics
  _calcularGMDCarne() {
    const { gmdList = [] } = this._cachedData || {};
    if (!gmdList.length) return 0;
    const totalGMD = gmdList.reduce((sum, item) => sum + (item.gmd || 0), 0);
    return totalGMD / gmdList.length;
  },

  _calcularPesoTotalCarne() {
    const { gmdList = [] } = this._cachedData || {};
    return gmdList.reduce((sum, item) => sum + (item.ultimoPeso || 0) - (item.primerPeso || 0), 0);
  },

  _calcularICACarne() {
    // Reuse existing ICA calculation logic (returns { ica, kgPienso, costePorKgGanancia })
    return this._cachedData || {};
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

  // Pestaña TRÁMITES: hub administrativo consolidado (Tarea B.1 del plan v5).
  // Reúne los tres trámites oficiales dispersos —INFOLAC, guías DIMOE y Censo— en
  // un único punto, delegando las acciones a los wizards existentes.
  async _renderTramitesView(container, fincaId) {
    if (!container) return;
    container.innerHTML = `<div class="p-16 text-center text-gray text-xs uppercase font-800">Cargando trámites…</div>`;

    const [guias, entregasLeche] = await Promise.all([
      window.db?.getAll('documentos_legales').catch(() => []),
      window.db?.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => [])
    ]);

    // Guías DIMOE registradas para esta finca
    const guiasFinca = (guias || []).filter(g =>
      (g.tipo === 'guia_movimiento' || g.tipo_documento === 'guia_movimiento') &&
      (g.fincaId === undefined || Number(g.fincaId) === Number(fincaId)) && !g.anulado
    ).sort((a, b) => new Date(b.fecha || b.creadoEn || 0) - new Date(a.fecha || a.creadoEn || 0));

    // Estado INFOLAC: entregas del mes en curso sin declaración presentada/aceptada
    const mesActual = new Date().toISOString().slice(0, 7);
    const entregasMes = (entregasLeche || []).filter(e => (e.fechaRecogida || e.fecha || '').slice(0, 7) === mesActual && !e.anulado);
    const infolacPendiente = entregasMes.filter(e => !['presentado', 'aceptado'].includes(e.estado_tramite_infolac)).length;

    const badge = (txt, color) => `<span class="text-[0.6rem] font-950 uppercase px-8 py-4 rounded-sm" style="background:color-mix(in srgb, ${color} 12%, transparent); border:1px solid color-mix(in srgb, ${color} 30%, transparent); color:${color};">${txt}</span>`;

    const tramiteCard = (icon, titulo, subtitulo, estadoHtml, accionLabel, onclick, color) => `
      <div class="card p-14 mb-12 border-222 card-resumen" style="background: rgba(255,255,255,0.02); border-left: 4px solid ${color};">
        <div class="flex items-center justify-between gap-8 mb-8">
          <span class="flex items-center gap-8 text-white font-900 text-sm uppercase tracking-wider" style="color:${color};">${icon} ${titulo}</span>
          ${estadoHtml}
        </div>
        <div class="text-[0.65rem] text-gray font-bold uppercase tracking-wide mb-12">${subtitulo}</div>
        <button class="btn btn-secondary w-full text-xs uppercase font-800 py-8" style="background:#141414; border:1px solid ${color}; color:${color}; border-radius:6px;" onclick="${onclick}">${accionLabel}</button>
      </div>`;

    container.innerHTML = `
      <div class="report-section px-4">
        <div class="inf-section-title mb-12 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          <span style="color: var(--c-info); margin-right: 4px;">|</span> ${Icons.documento()} GESTIÓN DE TRÁMITES OFICIALES
        </div>

        ${tramiteCard(
          Icons.leche(), 'INFOLAC',
          'Declaración mensual de producción láctea (Letra Q / Paquete Lácteo UE).',
          infolacPendiente > 0
            ? badge(`${infolacPendiente} entregas sin declarar`, 'var(--c-danger)')
            : badge(entregasMes.length > 0 ? 'Al día' : 'Sin entregas este mes', entregasMes.length > 0 ? 'var(--c-success)' : 'var(--c-gray)'),
          'Ver comercialización láctea',
          "window.location.hash='#/comercializacion'",
          'var(--c-info)'
        )}

        ${tramiteCard(
          Icons.documento(), 'GUÍAS DIMOE',
          `${guiasFinca.length} guía(s) de movimiento registrada(s).${guiasFinca[0] ? ' Última: ' + this._fmtFecha(guiasFinca[0].fecha || guiasFinca[0].creadoEn) + '.' : ''}`,
          badge(guiasFinca.length > 0 ? `${guiasFinca.length} emitidas` : 'Ninguna', guiasFinca.length > 0 ? 'var(--c-success)' : 'var(--c-gray)'),
          'Emitir nueva guía DIMOE',
          "if(window.App&&App._abrirWizardGuiaMovimiento)App._abrirWizardGuiaMovimiento();else if(window.WizardGuiaMovimiento)WizardGuiaMovimiento.abrir();",
          'var(--c-info)'
        )}

        ${tramiteCard(
          Icons.documento(), 'CENSO ANUAL',
          'Declaración censal oficial por especie, edad y sexo a fecha de referencia.',
          badge('Bajo demanda', 'var(--c-warning)'),
          'Generar censo oficial',
          "if(window.App&&App._abrirWizardCenso)App._abrirWizardCenso();else if(window.WizardCenso)WizardCenso.abrir();",
          'var(--c-info)'
        )}

        ${guiasFinca.length > 0 ? `
        <div class="inf-section-title mt-16 mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          <span style="color: var(--c-info); margin-right: 4px;">|</span> GUÍAS DIMOE RECIENTES
        </div>
        <div class="grid gap-10">
          ${guiasFinca.slice(0, 10).map(g => App._cardRegistro({
            icon: Icons.documento(),
            title: g.numero_documento || g.numero || `Guía #${g.id}`,
            metadata: `<span>${this._fmtFecha(g.fecha || g.creadoEn)}</span><span>·</span><span>${(g.destino || g.motivo || 'Movimiento').toString().toUpperCase()}</span>`,
            badge: (g.estado_tramite || 'registrada').toString().toUpperCase(),
            color: 'var(--c-info)'
          })).join('')}
        </div>` : ''}
      </div>`;
  },

  _getSubModuleMeta(sub) {
    const map = {
      explotacion: { color: 'var(--c-success)' },
      silos: { color: 'var(--c-success)' },
      fitosanitarios: { color: 'var(--c-purple)' },
      gastos: { color: 'var(--c-purple)' },
      proveedores: { color: 'var(--c-purple)' },
      tramites: { color: 'var(--c-info)' }
    };
    return map[sub] || map.explotacion;
  }
};

window.ExplotacionView = ExplotacionView;
