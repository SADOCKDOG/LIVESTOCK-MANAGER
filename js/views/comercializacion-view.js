/**
 * Livestock Manager - ComercializacionView v2.5.0
 * Vista de Comercialización unificada con tabs tipo ProduccionView/GastosView.
 * Carne / Leche / Gastos con KPIs, botón registrar, listados filtrados.
 */

const ComercializacionView = {
  _currentTab: 'leche',
  _cachedData: null,
  _cachedFincaId: null,
  _needsDataRefresh: false,
  _loadingPromise: null,
  _filters: {
    dateFrom: '',
    dateTo: '',
    search: ''
  },

  async _ensureData(fincaId, force = false) {
    if (!fincaId) {
      this._cachedData = { ventas: [], entregas: [], gastosRecords: [], kpis: { carne: [], leche: [], gastos: [] } };
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
      const [ventas, entregas, gastosRecords] = await Promise.all([
        window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
        window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
        Gastos.list(fincaId).catch(() => [])
      ]);

      ventas.sort((a, b) => new Date(b.fechaSacrificio || 0) - new Date(a.fechaSacrificio || 0));
      entregas.sort((a, b) => new Date(b.fechaRecogida || 0) - new Date(a.fechaRecogida || 0));
      gastosRecords.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

      const pesoTotal = ventas.reduce((s, v) => s + (v.pesoCanal || v.pesoVivo || 0), 0);
      const rendProm = ventas.length > 0 ? ventas.reduce((s, v) => s + (v.rendimientoCanal || 0), 0) / ventas.length : 0;
      const ingresoTotal = ventas.reduce((s, v) => s + (v.precio_total || 0), 0);
      const litrosTotal = entregas.reduce((s, e) => s + (e.cantidad || 0), 0);
      const mofaTotal = entregas.reduce((s, e) => s + (e.mofa || 0), 0);
      const gastoTotal = gastosRecords.reduce((s, g) => s + (g.monto || 0), 0);

      this._cachedData = {
        ventas,
        entregas,
        gastosRecords,
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
          ],
          gastos: [
            { label: 'Total (€)', value: this._fmt(gastoTotal) + ' €' },
            { label: 'Registros', value: gastosRecords.length },
            { label: 'Media/Registro', value: gastosRecords.length > 0 ? this._fmt(Math.round(gastoTotal / gastosRecords.length)) + ' €' : '0 €' }
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
    const tab = (params && params.get ? params.get("tab") : null) || this._currentTab;
    this._currentTab = tab;

    const fincaId = await Fincas.getActiveId();
    if (!fincaId) {
      main.innerHTML = `<div class="p-20 text-center"><p class="text-gray">No hay ninguna finca seleccionada.</p></div>`;
      return;
    }

    const data = await this._ensureData(fincaId, this._needsDataRefresh);
    const meta = this._getTabMeta(this._currentTab);

    if (window.App && App.updateHeaderColor) {
      App.updateHeaderColor(this._currentTab === 'gastos' ? null : this._currentTab);
    }

    main.innerHTML = `
      <div class="mb-14">
        <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
          <span style="color: ${meta.color}; font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> COMERCIALIZACIÓN
        </div>
        <div class="comer-mode-switch" style="display: flex; gap: 8px;">
          <button class="comer-mode-btn ${this._currentTab === 'carne' ? 'active' : ''}" style="--mode-color:var(--c-danger); color: ${this._currentTab === 'carne' ? '#000' : 'var(--c-danger)'}; flex: 1; padding: 10px;" onclick="ComercializacionView._cambiarTab('carne')">${Icons.carne()} Carne</button>
          <button class="comer-mode-btn ${this._currentTab === 'leche' ? 'active' : ''}" style="--mode-color:var(--c-info); color: ${this._currentTab === 'leche' ? '#000' : 'var(--c-info)'}; flex: 1; padding: 10px;" onclick="ComercializacionView._cambiarTab('leche')">${Icons.leche()} Leche</button>
          <button class="comer-mode-btn ${this._currentTab === 'gastos' ? 'active' : ''}" style="--mode-color:var(--c-purple); color: ${this._currentTab === 'gastos' ? '#000' : 'var(--c-purple)'}; flex: 1; padding: 10px;" onclick="ComercializacionView._cambiarTab('gastos')">${Icons.gastos()} Gastos</button>
        </div>
      </div>

      <div class="explotacion-kpis mb-14">
        ${this._renderKPIsTab()}
      </div>

      <div id="comer-content"><div class="loader">Cargando datos comerciales...</div></div>`;

    this._renderTabActual();
  },

  _getTabMeta(tab) {
    const map = {
      carne: { color: 'var(--c-danger)', label: 'Cárnico', icon: Icons.carne() },
      leche: { color: 'var(--c-info)', label: 'Lácteo', icon: Icons.leche() },
      gastos: { color: 'var(--c-purple)', label: 'Gastos', icon: Icons.gastos() }
    };
    return map[tab] || map.carne;
  },

  _renderKPIsTab() {
    const d = this._cachedData;
    const tab = this._currentTab;
    const kpis = d.kpis[tab] || [];
    const meta = this._getTabMeta(tab);

    return `
      <div class="card-registro p-12 mb-14 border-222 card-total-3d card-resumen" style="--registro-color: ${meta.color}; width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
          <span class="flex items-center gap-6">${meta.icon} Balance ${meta.label}</span>
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

  _cambiarTab(tab) {
    this._currentTab = tab;
    this.render();
  },

  _renderTabActual() {
    const d = this._cachedData;
    if (!d) return;
    const content = document.getElementById('comer-content');
    if (!content) return;

    switch (this._currentTab) {
      case 'carne': this._renderCarne(content, d); break;
      case 'leche': this._renderLeche(content, d); break;
      case 'gastos': this._renderGastos(content, d); break;
      default: this._renderCarne(content, d);
    }
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
      <div class="card-registro p-14 border-222" style="--registro-color: ${color};">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-6">
          ${Icons.documento()} ${listName}
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

  _renderCarne(content, d) {
    this._renderSeccion(content, {
      icon: Icons.carne(), title: 'Ventas Carne', color: 'var(--c-danger)',
      registrarLabel: 'REGISTRAR VENTA',
      listName: 'Lista de Ventas',
      registrarHandler: "App._abrirWizardVentaMasiva()",
      records: d.ventas.slice(0, 50).map(v => ({
        title: v.razonSocial || 'Matadero',
        metadata: `<span>${new Date(v.fechaSacrificio).toLocaleDateString()}</span><span>·</span><span>${v.pesoCanal || 0} kg canal</span>`,
        badge: `${Math.round(v.importe_total || 0).toLocaleString()} €`,
        onclick: `App._abrirDetalleVentaCarne(${v.id})`
      })),
      emptyMsg: 'Sin ventas de carne registradas.'
    });
  },

  _renderLeche(content, d) {
    this._renderSeccion(content, {
      icon: Icons.leche(), title: 'Entregas Leche', color: 'var(--c-info)',
      registrarLabel: 'REGISTRAR RETIRADA',
      listName: 'Lista de Entregas',
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

  _renderGastos(content, d) {
    const records = d.gastosRecords.slice(0, 50);
    const recordsHtml = records.length > 0
      ? records.map(g => App._cardRegistro({
          icon: Icons.gastos(),
          title: g.concepto || 'Gasto',
          metadata: `<span>${new Date(g.fecha).toLocaleDateString()}</span><span>·</span><span>${g.categoria || 'Varios'}</span>`,
          badge: `${(g.monto || 0).toLocaleString()} €`,
          color: 'var(--c-purple)',
          onClick: `App.renderDetalleGasto(new URLSearchParams('id=${g.id}'))`
        })).join('')
      : `<div class="p-16 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-sm">${Icons.buscar()} Sin gastos registrados.</span></div>`;

    content.innerHTML = `
      <div class="card-registro p-14 border-222" style="--registro-color: var(--c-purple);">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-6">
          ${Icons.gastos()} Lista de Gastos (solo lectura)
        </div>
        <div class="grid gap-10">
          ${recordsHtml}
        </div>
      </div>
      <div class="card-registro p-14 mb-14 border-222" style="--registro-color: var(--c-info);">
        <div class="text-xs text-white font-900 uppercase tracking-wider mb-6 flex items-center gap-6">
          ${Icons.info()} Gestión de Gastos
        </div>
        <p class="text-xs text-gray mb-10">
          Los gastos se registran en el módulo de <strong class="text-white">Explotación</strong> y se muestran aquí en solo lectura para calcular márgenes comerciales.
        </p>
        <a href="#/explotacion?sub=gastos" class="widget-link-btn widget-link-btn--neon neon-info w-full" style="text-decoration: none; text-align: center;">
          ${Icons.agregar()}
          <span class="widget-link-label">Registrar Gasto en Explotación</span>
        </a>
      </div>`;
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.ComercializacionView = ComercializacionView;
