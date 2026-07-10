/**
 * Livestock Manager - ComercializacionView v3.0.0
 * Consola unificada de Comercialización (CoMer) multipestaña con soporte premium.
 * Agrupa: Leche, Carne, Clientes, Contratos y Logística.
 */

const ComercializacionView = {
  _activeSubModule: 'leche', // 'leche', 'carne', 'compradores', 'contratos', 'transportistas'
  _cachedData: null,
  _cachedFincaId: null,
  _needsDataRefresh: false,
  _loadingPromise: null,

  async _ensureData(fincaId, force = false) {
    if (!fincaId) {
      this._cachedData = { ventas: [], entregas: [], kpis: { carne: [], leche: [] } };
      this._cachedFincaId = null;
      this._needsDataRefresh = false;
      return this._cachedData;
    }

    if (!force && !this._needsDataRefresh && this._cachedData && this._cachedFincaId === fincaId) {
      return this._cachedData;
    }

    if (this._loadingPromise) {
      await this._loadingPromise;
      return this._cachedData;
    }

    this._loadingPromise = (async () => {
      const [ventas, entregas] = await Promise.all([
        window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
        window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => [])
      ]);

      ventas.sort((a, b) => new Date(b.fechaSacrificio || 0) - new Date(a.fechaSacrificio || 0));
      entregas.sort((a, b) => new Date(b.fechaRecogida || 0) - new Date(a.fechaRecogida || 0));

      const pesoTotal = ventas.reduce((s, v) => s + (v.pesoCanal || v.pesoVivo || 0), 0);
      const rendProm = ventas.length > 0 ? ventas.reduce((s, v) => s + (v.rendimientoCanal || 0), 0) / ventas.length : 0;
      const ingresoTotal = ventas.reduce((s, v) => s + (v.precio_total || 0), 0);
      const litrosTotal = entregas.reduce((s, e) => s + (e.cantidad || 0), 0);
      const mofaTotal = entregas.reduce((s, e) => s + (e.mofa || 0), 0);

      this._cachedData = {
        ventas,
        entregas,
        kpis: {
          carne: [
            { label: 'Peso Canal (kg)', value: this._fmt(pesoTotal) + ' kg' },
            { label: 'Animales', value: ventas.length },
            { label: 'Rend. Prom.', value: rendProm.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%' },
            { label: 'Ingreso Total', value: this._fmt(ingresoTotal) + ' €' },
          ],
          leche: [
            { label: 'Total Litros', value: this._fmt(litrosTotal) + ' L' },
            { label: 'Entregas', value: entregas.length },
            { label: 'Promedio', value: entregas.length > 0 ? this._fmt(Math.round(litrosTotal / entregas.length)) + ' L' : '0 L' },
            { label: 'MOFA Total', value: this._fmt(Math.round(mofaTotal)) + ' €' }
          ]
        }
      };

      this._cachedFincaId = fincaId;
      this._needsDataRefresh = false;
      return this._cachedData;
    })();

    try {
      return await this._loadingPromise;
    } finally {
      this._loadingPromise = null;
    }
  },

  invalidateCache() {
    this._needsDataRefresh = true;
  },

  async render(params) {
    const main = document.getElementById('app-content');
    const tab = (params && params.get ? params.get("tab") : null) || this._activeSubModule;
    this._activeSubModule = tab;

    const fincaId = await Fincas.getActiveId();
    if (!fincaId) {
      main.innerHTML = `<div class="p-20 text-center"><p class="text-gray">No hay ninguna finca seleccionada.</p></div>`;
      return;
    }

    const currentMeta = this._getSubModuleMeta(this._activeSubModule);

    if (window.App && App.updateHeaderColor) {
      App.updateHeaderColor(currentMeta.headerColorKey);
    }

    main.innerHTML = `
      <div class="mb-14">
        <div class="text-left mb-6 uppercase" style="letter-spacing: 0.5px;">
          <h1 style="font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0; display: flex; items-center;">
            <span style="color:${currentMeta.color}; margin-right:4px;">|</span> ${currentMeta.title}
          </h1>
          <div class="text-gray" style="font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
            ${currentMeta.desc}
          </div>
        </div>
      </div>

      <!-- Barra de Navegación Multipestaña Horizontal Comercialización (Scrollable) Premium con Indicadores Animados -->
      <div class="pestanas-premium-wrapper mb-14" style="--mode-color: ${currentMeta.color};">
        <div class="pestana-indicador-flecha pestana-flecha-izq" style="opacity: 0; pointer-events: none;" onclick="this.parentElement.querySelector('.pestanas-premium-container').scrollBy({ left: -100, behavior: 'smooth' })">
          ${Icons.atras()}
        </div>
        <div class="pestanas-premium-container" onscroll="App.evaluarScrollPestanas(this)">
          <div class="pestanas-premium-switch">
            <button class="pestanas-premium-btn ${this._activeSubModule === 'leche' ? 'active' : ''}" style="--mode-color:var(--c-info);" onclick="ComercializacionView._cambiarSubModulo('leche')">${Icons.leche()} LECHE</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'carne' ? 'active' : ''}" style="--mode-color:var(--c-danger);" onclick="ComercializacionView._cambiarSubModulo('carne')">${Icons.carne()} CARNE</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'compradores' ? 'active' : ''}" style="--mode-color:var(--c-purple);" onclick="ComercializacionView._cambiarSubModulo('compradores')">${Icons.compradores()} CLIENTES</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'contratos' ? 'active' : ''}" style="--mode-color:var(--c-purple);" onclick="ComercializacionView._cambiarSubModulo('contratos')">${Icons.documento()} CONTRATOS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'transportistas' ? 'active' : ''}" style="--mode-color:var(--c-pink);" onclick="ComercializacionView._cambiarSubModulo('transportistas')">${Icons.transportistas()} LOGÍSTICA</button>
          </div>
        </div>
        <div class="pestana-indicador-flecha pestana-flecha-der" style="opacity: 0; pointer-events: none;" onclick="this.parentElement.querySelector('.pestanas-premium-container').scrollBy({ left: 100, behavior: 'smooth' })">
          ${Icons.siguiente()}
        </div>
      </div>
      
      <!-- Contenedor Dinámico para la pestaña activa -->
      <div id="comercializacion-tab-content" class="animate-fade-in"></div>`;

    // Delegación dinámica de renderizado de pestañas
    switch (this._activeSubModule) {
      case 'leche':
        await this._renderLecheSubTab();
        break;
      case 'carne':
        await this._renderCarneSubTab();
        break;
      case 'compradores':
        if (window.CompradoresView) {
          CompradoresView._activeModule = 'compradores';
          await CompradoresView.render();
        }
        break;
      case 'contratos':
        if (window.ContratosView) {
          await ContratosView.render();
        }
        break;
      case 'transportistas':
        if (window.TransportistasView) {
          await TransportistasView.render();
        }
        break;
    }

    // Inicializar scroll dinámico para la barra de pestañas
    const containerPestanas = document.querySelector('.pestanas-premium-container');
    if (containerPestanas && window.App?.inicializarScrollPestanas) {
      window.App.inicializarScrollPestanas(containerPestanas);
    }
  },

  _cambiarSubModulo(subModulo) {
    this._activeSubModule = subModulo;
    this.render();
  },

  _getSubModuleMeta(sub) {
    const map = {
      leche: { color: 'var(--c-info)', title: 'CONTRATOS Y ENTREGAS LÁCTEAS', desc: 'Control de cisternas, analíticas y albaranes de leche', headerColorKey: 'leche' },
      carne: { color: 'var(--c-danger)', title: 'COMERCIALIZACIÓN CÁRNICA', desc: 'Ventas de ganado, rendimientos de canal y facturación', headerColorKey: 'carne' },
      compradores: { color: 'var(--c-purple)', title: 'CARTERA DE CLIENTES', desc: 'Registro de mataderos, cooperativas y centrales lecheras', headerColorKey: 'compradores' },
      contratos: { color: 'var(--c-purple)', title: 'CONTRATOS DE COMPRA', desc: 'Acuerdos comerciales de suministro y trazabilidad de precios', headerColorKey: 'contratos' },
      transportistas: { color: 'var(--c-pink)', title: 'LOGÍSTICA Y TRANSPORTISTAS', desc: 'Flota de transporte ganadero calificado y cisternas', headerColorKey: 'transportistas' }
    };
    return map[sub] || map.leche;
  },

  async _renderLecheSubTab() {
    const container = document.getElementById('comercializacion-tab-content');
    if (!container) return;
    const fincaId = await Fincas.getActiveId();
    const d = await this._ensureData(fincaId, this._needsDataRefresh);

    const kpisHtml = this._renderKPIsSubTab('leche', d.kpis.leche, 'var(--c-info)', Icons.leche());
    
    container.innerHTML = `
      <div class="explotacion-kpis mb-14">
        ${kpisHtml}
      </div>
      <div id="comer-sub-content"></div>`;

    const subContent = document.getElementById('comer-sub-content');
    this._renderSeccion(subContent, {
      icon: Icons.leche(),
      title: 'Entregas Leche',
      color: 'var(--c-info)',
      registrarLabel: 'REGISTRAR RETIRADA',
      listName: 'LISTA DE ENTREGAS',
      registrarHandler: "App._abrirWizardAlbaranLeche()",
      records: d.entregas.slice(0, 50).map(e => ({
        title: `Cisterna: ${e.matriculaCisterna || 'S/N'}`,
        metadata: `<span>${new Date(e.fechaRecogida || e.fecha).toLocaleDateString()}</span><span>·</span><span>${(e.cantidad || 0).toLocaleString()} L</span>`,
        badge: e.estadoAnalitica || 'PENDIENTE',
        onclick: `location.hash='/albaran-leche?id=${e.id}'`
      })),
      emptyMsg: 'Sin entregas de leche registradas.'
    });
  },

  async _renderCarneSubTab() {
    const container = document.getElementById('comercializacion-tab-content');
    if (!container) return;
    const fincaId = await Fincas.getActiveId();
    const d = await this._ensureData(fincaId, this._needsDataRefresh);

    const kpisHtml = this._renderKPIsSubTab('carne', d.kpis.carne, 'var(--c-danger)', Icons.carne());
    
    container.innerHTML = `
      <div class="explotacion-kpis mb-14">
        ${kpisHtml}
      </div>
      <div id="comer-sub-content"></div>`;

    const subContent = document.getElementById('comer-sub-content');
    this._renderSeccion(subContent, {
      icon: Icons.carne(),
      title: 'Ventas Carne',
      color: 'var(--c-danger)',
      registrarLabel: 'REGISTRAR VENTA',
      listName: 'LISTA DE VENTAS',
      registrarHandler: "App._abrirWizardVentaMasiva()",
      records: d.ventas.slice(0, 50).map(v => ({
        title: v.razonSocial || 'Matadero',
        metadata: `<span>${new Date(v.fechaSacrificio || v.fecha || 0).toLocaleDateString()}</span><span>·</span><span>${v.pesoCanal || 0} kg canal</span>`,
        badge: `${Math.round(v.importe_total || 0).toLocaleString()} €`,
        onclick: `App._abrirDetalleVentaCarne(${v.id})`
      })),
      emptyMsg: 'Sin ventas de carne registradas.'
    });
  },

  _renderKPIsSubTab(tabKey, kpis, color, icon) {
    const labelMap = { leche: 'LÁCTEO', carne: 'CÁRNICO' };
    return `
      <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
          <span class="flex items-center gap-6"><span style="color: ${color}; margin-right: 4px;">|</span> ${icon} BALANCE ${labelMap[tabKey]}</span>
          <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
        </div>
        <div class="resumen-body flex flex-col">
          ${kpis.map(k => `
            <div class="py-12 flex justify-between items-center ${kpis.indexOf(k) < kpis.length - 1 ? 'border-bottom-222' : ''}">
              <span class="text-xs text-gray uppercase font-900">${k.label}</span>
              <strong class="text-xl font-950" style="color:${k.color || '#fff'};">${k.value}</strong>
            </div>
          `).join('')}
        </div>
      </div>`;
  },

  _renderSeccion(content, opts) {
    const { icon, title, color, registrarLabel, listName, records, emptyMsg, registrarHandler } = opts;

    const recordsHtml = records.length > 0
      ? records.map(r => App._cardRegistro({
          icon: r.icon || icon,
          title: r.title,
          metadata: r.metadata,
          badge: r.badge,
          color: color,
          onClick: r.onclick
        })).join('')
      : `<div class="p-16 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-sm">${Icons.buscar()} ${emptyMsg}</span></div>`;

    content.innerHTML = `
      <div class="card p-14 border-222" style="background: rgba(255,255,255,0.02);">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-6">
          <span style="color: ${color}; margin-right: 4px;">|</span> ${Icons.documento()} ${listName}
        </div>
        <div class="grid gap-10">
          ${recordsHtml}
        </div>
      </div>
      <div class="fab-container" style="--fab-neon-color: ${color};" onclick="${registrarHandler}">
        <span class="fab-label">${registrarLabel}</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.ComercializacionView = ComercializacionView;
