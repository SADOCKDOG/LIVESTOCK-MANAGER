/**
 * Livestock Manager - ComercializacionView v2.0.0
 * Vista de Comercialización unificada con tabs tipo ProduccionView/GastosView.
 * Carne / Leche / Gastos con KPIs, botón registrar, listados filtrados.
 * Copia espejo de js/views/comercializacion-view.js
 */

const ComercializacionView = {
  _currentTab: 'leche',
  _cachedData: null,

  async render(params) {
    const main = document.getElementById('app-content');
    const tab = (params && params.get ? params.get("tab") : null) || this._currentTab;
    this._currentTab = tab;

    const fincaId = await Fincas.getActiveId();
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
    let pipelineInfo = null;
    try {
      pipelineInfo = JSON.parse(sessionStorage.getItem('lm.explotacion_pipeline') || 'null');
    } catch (_) {
      pipelineInfo = null;
    }

    this._cachedData = {
      ventas, entregas, gastosRecords,
      kpis: {
        carne: [
          { label: 'Peso Canal (kg)', value: this._fmt(pesoTotal) + ' kg' },
          { label: 'Animales', value: ventas.length },
          { label: 'Rend. Prom.', value: rendProm.toFixed(1) + '%' },
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

    const meta = this._getTabMeta(this._currentTab);

    // Sincronizar color de cabecera con el tab activo
    if (window.App && App.updateHeaderColor) {
      App.updateHeaderColor(this._currentTab === 'gastos' ? null : this._currentTab);
    }

    main.innerHTML = `
      <!-- Selector de Modo Comercial Superior -->
      <div class="card p-14 mb-14 border-222">
        <div class="text-center mb-10">
          <div class="section-header-neon" style="--neon-color: ${meta.color}; max-width: 520px; margin: 0 auto;">${Icons.transportistas()} COMERCIALIZACIÓN ${Icons.dinero()}</div>
          <div class="comer-mode-switch">
            <button class="comer-mode-btn ${this._currentTab === 'carne' ? 'active' : ''}" style="--mode-color:#ef4444;" data-tab="carne" onclick="ComercializacionView._cambiarTab('carne')">${Icons.carne()} Carne</button>
            <button class="comer-mode-btn ${this._currentTab === 'leche' ? 'active' : ''}" style="--mode-color:#3b82f6;" data-tab="leche" onclick="ComercializacionView._cambiarTab('leche')">${Icons.leche()} Leche</button>
            <button class="comer-mode-btn ${this._currentTab === 'gastos' ? 'active' : ''}" style="--mode-color:#8b5cf6;" data-tab="gastos" onclick="ComercializacionView._cambiarTab('gastos')">${Icons.gastos()} Gastos</button>
          </div>
        </div>
        <div class="pt-8 border-top-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider flex items-center gap-4">${meta.color === '#ef4444' ? Icons.carne() : meta.color === '#3b82f6' ? Icons.leche() : Icons.gastos()} Contexto: ${meta.label}</div>
          <div class="text-xs text-aaa mt-4 leading-relaxed">Gestión de ventas, entregas y gastos comerciales con registro rápido y acceso a documentación.</div>
        </div>
      </div>

      ${pipelineInfo ? `
      <div class="card p-12 mb-14 border-222" style="border-left:4px solid #10b981; background: rgba(16,185,129,0.05);">
        <div class="text-[0.65rem] text-gray uppercase font-extrabold tracking-wider">Flujo activo</div>
        <div class="text-sm text-white mt-4 font-700">Procedente de <strong>Explotación (${(pipelineInfo.modo_explotacion || '').toUpperCase()})</strong>.</div>
        <div class="text-[0.62rem] text-aaa mt-4">Fitosanitarios pendientes: <strong class="${(pipelineInfo.cumplimiento?.pendientesFitosanitarios || 0) > 0 ? 'text-red' : 'text-green'}">${pipelineInfo.cumplimiento?.pendientesFitosanitarios || 0}</strong></div>
      </div>` : ''}

      <!-- KPIs dinámicos del Tab -->
      <div class="explotacion-kpis mb-14">
        ${this._renderKPIsTab()}
      </div>

      <div id="comer-content"><div class="loader">Cargando...</div></div>`;

    this._renderTabActual();
  },

  _getTabMeta(tab) {
    const map = {
      carne: { color: '#ef4444', label: 'Cárnico' },
      leche: { color: '#3b82f6', label: 'Lácteo' },
      gastos: { color: '#8b5cf6', label: 'Gastos' }
    };
    return map[tab] || map.carne;
  },

  _renderKPIsTab() {
    const d = this._cachedData;
    const tab = this._currentTab;
    const kpis = d.kpis[tab] || [];
    const meta = this._getTabMeta(tab);
    const icons = {
      'Peso Canal (kg)': Icons.balanza(),
      'Animales': Icons.animales(),
      'Rend. Prom.': Icons.grafico(),
      'Ingreso Total': Icons.dinero(),
      'Total Litros': Icons.leche(),
      'Entregas': Icons.paquete(),
      'Promedio': Icons.grafico(),
      'MOFA Total': Icons.dinero(),
      'Total (€)': Icons.dinero(),
      'Registros': Icons.paquete(),
      'Media/Registro': Icons.grafico(),
    };
    const valueColors = {
      'Peso Canal (kg)': 'var(--c-warning)',
      'Animales': 'var(--c-info)',
      'Rend. Prom.': 'var(--c-success)',
      'Ingreso Total': 'var(--c-success)',
      'Total Litros': 'var(--c-info)',
      'Entregas': 'var(--c-warning)',
      'Promedio': 'var(--c-info)',
      'MOFA Total': 'var(--c-success)',
      'Total (€)': 'var(--c-danger)',
      'Registros': 'var(--c-warning)',
      'Media/Registro': 'var(--c-info)',
    };

    const headerIcons = { carne: Icons.carne(), leche: Icons.leche(), gastos: Icons.gastos() };
    const headerLabels = { carne: 'Balance Cárnico', leche: 'Balance Lácteo', gastos: 'Resumen Gastos' };

    return `
      <div class="card p-16 mb-16 border-222 card-total-3d" style="border-top: 5px solid ${meta.color}; width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-10 flex items-center gap-6">
          ${headerIcons[tab] || Icons.info()} ${headerLabels[tab] || 'Resumen'}
        </div>
        <div class="flex flex-col">
          ${kpis.map(k => `
            <div class="py-12 flex justify-between items-center ${kpis.indexOf(k) < kpis.length - 1 ? 'border-bottom-222' : ''}">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${icons[k.label] || Icons.info()} ${k.label}</span>
              <strong class="text-xl font-950" style="color:${valueColors[k.label] || meta.color};">${k.value}</strong>
            </div>
          `).join('')}
        </div>
      </div>`;
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.comer-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    const meta = this._getTabMeta(tab);
    const headerNeon = document.querySelector('.section-header-neon');
    if (headerNeon) headerNeon.style.setProperty('--neon-color', meta.color);

    // Sincronizar color de cabecera
    if (window.App && App.updateHeaderColor) {
      const mode = (tab === 'leche') ? 'leche' : (tab === 'carne' ? 'carne' : null);
      App.updateHeaderColor(mode);
    }

    // Re-renderizar KPIs con el tab activo
    const kpisContainer = document.querySelector('.explotacion-kpis');
    if (kpisContainer) kpisContainer.innerHTML = this._renderKPIsTab();

    this._renderTabActual();
    window.scrollTo(0, 0);
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
      ? records.map(r => `
        <div class="card card-animal no-underline" onclick="${r.onclick || ''}" style="border-left:4px solid ${color}; padding:12px; margin-bottom:8px; width:100%;">
          <div class="flex flex-col" style="width:100%;">
            <div class="flex justify-between items-start gap-6 w-full">
              <span class="text-sm font-black text-white uppercase tracking-tight overflow-hidden text-ellipsis" style="white-space:nowrap; flex:1; min-width:0;">${r.title.replace(/<\/?[^>]+(>|$)/g, "")}</span>
              <span class="text-lg font-950 flex-shrink-0 ml-4" style="color:${color};">${r.value}</span>
            </div>
            <div class="flex flex-wrap gap-x-8 gap-y-1 text-[0.6rem] text-gray font-700 uppercase mt-2 leading-tight w-full">
              <span class="flex items-center gap-3">${Icons.calendar()} ${r.date}</span>
              ${r.zone ? `<span class="flex items-center gap-3">${Icons.zonas()} ${r.zone}</span>` : ''}
              ${r.subvalue ? `<span class="flex items-center gap-3 text-aaa">${Icons.info()} ${r.subvalue}</span>` : ''}
              ${r.meta ? `<span class="flex items-center gap-3 text-aaa">${Icons.documento()} ${r.meta}</span>` : ''}
            </div>
            ${r.badges ? `<div class="flex flex-wrap gap-3 mt-3 w-full">${r.badges}</div>` : ''}
          </div>
        </div>`).join('')
      : `<div class="p-16 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-sm">${Icons.buscar()} ${emptyMsg}</span></div>`;

    content.innerHTML = `
      <!-- PANEL DE ACCIONES COMERCIALES (ESTILO NEÓN) -->
      <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24" style="--theme-color: ${color};">
        <div class="section-header-theme">ACCIONES</div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto">
          <button class="widget-link-btn widget-link-btn--neon" style="--neon-color: ${color}; --neon-glow: ${color}B0; --neon-inner: ${color}40" onclick="${registrarHandler}">
            ${Icons.agregar()}
            <span class="widget-link-label">${registrarLabel}</span>
          </button>
        </div>
        <div class="text-right mt-4"><span class="text-xs text-aaa leading-relaxed">${Icons.comercial()} Registro de ventas, entregas y gastos con acceso a documentación comercial</span></div>
      </div>

      <div class="card p-14 border-222">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-6">
          ${Icons.documento()} ${listName}
        </div>
        <div class="grid">
          ${recordsHtml}
        </div>
      </div>
      <button class="fab-btn" onclick="${registrarHandler}" style="background: ${color};" aria-label="Nuevo Registro">${Icons.agregar()}</button>`;
  },

  // ===================== TAB CARNE =====================

  _renderCarne(content, d) {
    const badgeHtml = (v) => {
      let cls = (v.clasificacion?.seurop || "S/C").toUpperCase();
      return `<span class="badge badge-red" style="font-size:0.62rem; border:1px solid rgba(239,68,68,0.2);">${cls}</span>`;
    };

    this._renderSeccion(content, {
      icon: Icons.carne(), title: 'Ventas de Carne', subtitle: 'Expediciones a matadero y venta directa',
      color: '#ef4444',
      registrarLabel: 'REGISTRAR VENTA',
      listName: 'Lista de Ventas',
      registrarHandler: "App._abrirWizardVentaMasiva()",
      records: d.ventas.slice(0, 50).map(v => {
        const estadoTramite = (v.estado_tramite || '').toString().trim();
        const badgeTramite = estadoTramite
          ? `<span class="badge badge-sm" style="font-size:0.62rem; border:1px solid rgba(59,130,246,0.3); background:rgba(59,130,246,0.12); color:#93c5fd;">${Icons.edificio()} ${estadoTramite.toUpperCase()}</span>`
          : '';
        return {
          title: (v.razonSocial || 'Matadero Central'),
          date: v.fechaSacrificio ? new Date(v.fechaSacrificio).toLocaleDateString() : '-',
          zone: v.snap_zona || '',
          value: (v.pesoCanal || 0) + ' kg',
          subvalue: 'Rend: ' + (v.rendimientoCanal || 0) + '%',
          badges: [badgeHtml(v), badgeTramite].filter(Boolean).join(' '),
          onclick: "App._abrirDetalleVentaCarne(" + v.id + ")"
        };
      }),
      emptyMsg: 'Sin ventas de carne registradas. Usa "Registrar Venta" para añadir una expedición.'
    });
  },

  // ===================== TAB LECHE =====================

  _renderLeche(content, d) {
    this._renderSeccion(content, {
      icon: Icons.leche(), title: 'Entregas de Leche', subtitle: 'Retiradas de tanque y albaranes',
      color: '#3b82f6', // Azul Lácteo consistente
      registrarLabel: 'REGISTRAR RETIRADA',
      listName: 'Lista de Entregas',
      registrarHandler: "App._abrirWizardAlbaranLeche()",
      records: d.entregas.slice(0, 50).map(e => {
        const esAlerta = e.estadoAnalitica === "Alerta Crítica" || e.antibioticos === true;
        const lab = e.laboratorio || {};
        const es = lab.extracto_seco || (lab.grasa != null && lab.proteina != null ? (lab.grasa + lab.proteina).toFixed(1) : '--');
        const badges = window.CalidadLecheHelper ? window.CalidadLecheHelper.badgesCompletos(e) : '';

        // Añadir precio final y MOFA como badges si existen
        const extraBadges = [];
        if (e.precio_final_unitario) {
          extraBadges.push(window.CalidadLecheHelper.badgeParametro('Precio', e.precio_final_unitario.toFixed(3) + ' €/L', true, Icons.dinero()));
        }
        if (e.mofa != null) {
          extraBadges.push(window.CalidadLecheHelper.badgeParametro('MOFA', Math.round(e.mofa) + ' €', e.mofa >= 0, Icons.grafico()));
        }
        if (e.comunidad_autonoma) {
          const label = e.comunidad_autonoma === 'andalucia' ? 'AND' : 'EXT';
          extraBadges.push(window.CalidadLecheHelper.badgeParametro('CCAA', label, true, Icons.zonas()));
        }
        if (e.estado_tramite_infolac) {
          extraBadges.push(window.CalidadLecheHelper.badgeParametro('INFOLAC', String(e.estado_tramite_infolac).toUpperCase(), true, Icons.edificio()));
        }
        const allBadges = [badges, ...extraBadges].filter(Boolean).join('');

        return {
          title: 'Cisterna: ' + (e.matriculaCisterna || 'S/N'),
          date: e.fechaRecogida ? new Date(e.fechaRecogida).toLocaleDateString() : '-',
          zone: '',
          value: (e.cantidad || 0).toLocaleString() + ' L',
          subvalue: (e.temperatura || '--') + 'ºC' + (es !== '--' ? ' · ES: ' + es + '%' : ''),
          badges: allBadges,
          onclick: "location.hash='/albaran-leche?id=" + e.id + "'"
        };
      }),
      emptyMsg: 'Sin entregas de leche registradas. Usa "Registrar Retirada" para añadir.'
    });
  },

  // ===================== TAB GASTOS =====================

  _renderGastos(content, d) {
    this._renderSeccion(content, {
      icon: Icons.gastos(), title: 'Gastos Analíticos', subtitle: 'Costes operativos y de explotación',
      color: '#8b5cf6',
      registrarLabel: 'REGISTRAR GASTO',
      listName: 'Lista de Gastos',
      registrarHandler: "App._abrirFormularioGasto()",
      records: d.gastosRecords.slice(0, 50).map(g => ({
        title: (g.concepto || g.categoria || 'Gasto'),
        date: g.fecha ? new Date(g.fecha).toLocaleDateString() : '-',
        zone: g.snap_zona || '',
        meta: (g.categoria || ''),
        value: (g.monto || 0).toLocaleString() + ' €',
        onclick: "ProduccionView._abrirOpcionesGasto(" + g.id + ")"
      })),
      emptyMsg: 'Sin gastos registrados. Usa "Registrar Gasto" para añadir.'
    });
  },

  // ===================== ELIMINAR / EDITAR (desde app.js) =====================

  async _eliminarVentaCarne(id) {
    if (!await Confirm.confirm("Eliminar Registro de Venta", "¿Eliminar registro de venta? El animal volverá a estar ACTIVO.", true)) return;
    try {
      const v = await window.db.get("comercializacion_carne", id);
      const a = await window.db.get("animales", v.animalId);
      if (a) {
        a.estado = "activo";
        await Animales.save(a);
      }
      if (v?.movimientoId && window.Movimientos?.delete) {
        await window.Movimientos.delete(v.movimientoId).catch(() => {});
      }
      await window.db.delete("comercializacion_carne", id);
      App.toast("Venta eliminada.");
      this._cachedData = null;
      this.render(new Map([["tab", "carne"]]));
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _eliminarGasto(id) {
    if (!await Confirm.confirm("Eliminar Gasto", "¿Eliminar este registro de gasto?", true)) return;
    try {
      await Gastos.delete(id);
      App.toast("Gasto eliminado.");
      this._cachedData = null;
      this.render(new Map([["tab", "gastos"]]));
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _guardarEdicionLeche(id) {
    try {
      const e = await window.db.get("comercializacion_leche", id);
      e.cantidad = parseFloat(document.getElementById("le-cant").value) || e.cantidad;
      e.precioBase = parseFloat(document.getElementById("le-pb").value) || e.precioBase;
      e.laboratorio = {
        grasa: parseFloat(document.getElementById("le-grasa").value) || 0,
        proteina: parseFloat(document.getElementById("le-prot").value) || 0,
        somaticas: parseInt(document.getElementById("le-som").value) || 0,
        germenes: parseInt(document.getElementById("le-ger").value) || 0,
        antibioticos: document.getElementById("le-ant").value === "true",
        extracto_seco: +((parseFloat(document.getElementById("le-grasa").value) || 0) + (parseFloat(document.getElementById("le-prot").value) || 0)).toFixed(2),
      };
      e.antibioticos = e.laboratorio.antibioticos;
      e.estadoAnalitica = e.antibioticos ? "Alerta Crítica" : "Validado";

      // Recalcular campos económicos derivados
      const precioExtracto = e.precio_extracto_seco || 0.012;
      const extractoSeco = e.laboratorio.extracto_seco || 0;
      e.precio_final_unitario = +(e.precioBase + extractoSeco * precioExtracto + (e.primas_penalizaciones || 0)).toFixed(4);
      e.importe_total = +(e.cantidad * e.precio_final_unitario).toFixed(2);
      if (e.coste_alimentacion_periodo != null) {
        e.mofa = +(e.importe_total - e.coste_alimentacion_periodo).toFixed(2);
      }

      await window.db.put("comercializacion_leche", e);
      App.toast("Registro lácteo actualizado.");
      this._cachedData = null;
      this.render(new Map([["tab", "leche"]]));
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _guardarEdicionGasto(id) {
    try {
      const g = await window.db.get("gastos_ganaderia", id);
      g.concepto = document.getElementById("ge-con").value.trim();
      g.monto = parseFloat(document.getElementById("ge-mon").value);
      if (!g.concepto) return App.toastError("El concepto es obligatorio");
      if (isNaN(g.monto) || g.monto <= 0) return App.toastError("El monto debe ser mayor a 0");
      await Gastos.save(g);
      App.toast("Gasto actualizado.");
      this._cachedData = null;
      this.render(new Map([["tab", "gastos"]]));
    } catch (e) {
      App.toastError(e.message);
    }
  },

  // ===================== DETALLE LECHE (albaran) =====================

  async renderDetalleLeche(params) {
    const id = params.get("id");
    const e = await window.db.get("comercializacion_leche", parseInt(id));
    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/comercializacion?tab=leche" class="link-back">← Volver</a><h2>${Icons.leche()} Analítica de Tanque</h2></div>
      <div class="card border-top-5-gold">
        <div class="grid grid-cols-2 gap-12">
          <div><label>Volumen (L)</label><input type="number" id="le-cant" value="${e.cantidad}" class="premium-input"></div>
          <div><label>Precio (€/L)</label><input type="number" id="le-pb" value="${e.precioBase}" class="premium-input"></div>
        </div>
        <div class="mt-20 grid grid-cols-2 gap-12">
          <div><label>Materia Grasa (%)</label><input type="number" id="le-grasa" value="${e.laboratorio?.grasa || 0}" step="0.01" class="premium-input"></div>
          <div><label>Proteína (%)</label><input type="number" id="le-prot" value="${e.laboratorio?.proteina || 0}" step="0.01" class="premium-input"></div>
        </div>
        <div class="mt-12 grid grid-cols-2 gap-12">
          <div><label>Somáticas (cel/mL)</label><input type="number" id="le-som" value="${e.laboratorio?.somaticas || 0}" class="premium-input"></div>
          <div><label>Gérmenes (UFC/mL)</label><input type="number" id="le-ger" value="${e.laboratorio?.germenes || 0}" class="premium-input"></div>
        </div>
        <div class="mt-20"><label>Control de Antibióticos</label><select id="le-ant" class="premium-input"><option value="false" ${!e.antibioticos ? "selected" : ""}>NEGATIVO (Apto)</option><option value="true" ${e.antibioticos ? "selected" : ""}>POSITIVO (Alerta Crítica)</option></select></div>
        <div class="flex justify-end gap-10 mt-20">
          <button class="btn btn-secondary" onclick="location.hash='/comercializacion?tab=leche'">${Icons.cerrar()} Cancelar</button>
          <button class="btn btn-success" onclick="ComercializacionView._guardarEdicionLeche(${id})">${Icons.guardar()} Guardar</button>
        </div>
      </div>`;
  },

  // ===================== DETALLE GASTO (edicion) =====================

  async renderDetalleGasto(params) {
    const id = params.get("id");
    const g = await window.db.get("gastos_ganaderia", parseInt(id));
    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/comercializacion?tab=gastos" class="link-back">← Volver</a><h2>${Icons.gastos()} Ficha de Gasto</h2></div>
      <div class="card border-top-4-blue">
        <label>Concepto</label><input type="text" id="ge-con" value="${g.concepto}" class="premium-input mb-10">
        <label>Monto (€)</label><input type="number" id="ge-mon" value="${g.monto}" class="premium-input">
        <div class="flex justify-between items-center mt-20">
          <button class="btn btn-danger" onclick="ComercializacionView._eliminarGasto(${id})">${Icons.eliminar()} Eliminar</button>
          <div class="flex gap-10">
            <button class="btn btn-secondary" onclick="location.hash='/comercializacion?tab=gastos'">${Icons.cerrar()} Cancelar</button>
            <button class="btn btn-success" onclick="ComercializacionView._guardarEdicionGasto(${id})">${Icons.guardar()} Guardar</button>
          </div>
        </div>
      </div>`;
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.ComercializacionView = ComercializacionView;





