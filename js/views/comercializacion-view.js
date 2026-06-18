/**
 * Livestock Manager - ComercializacionView v2.0.0
 * Vista de Comercialización unificada con tabs tipo ProduccionView/GastosView.
 * Carne / Leche / Gastos con KPIs, botón registrar, listados filtrados.
 * Copia espejo de js/views/comercializacion-view.js
 */

const ComercializacionView = {
  _currentTab: 'carne',
  _cachedData: null,

  async render(params) {
    const tab = (params && params.get ? params.get("tab") : null) || this._currentTab;
    this._currentTab = tab;

    const main = document.getElementById("app-content");
    main.style.overflowX = 'hidden';
    main.style.maxWidth = '100%';
    main.style.boxSizing = 'border-box';
    main.style.paddingLeft = '12px';
    main.style.paddingRight = '12px';

    this._inyectarEstilos();

    main.innerHTML = `
      <div class="mb-14">
        <div class="tabs-scroll comer-tabs scroll-shadow-container">
          <button class="comer-tab ${this._currentTab === 'carne' ? 'active' : ''}" data-tab="carne" onclick="ComercializacionView._cambiarTab('carne')">🥩 Carne</button>
          <button class="comer-tab ${this._currentTab === 'leche' ? 'active' : ''}" data-tab="leche" onclick="ComercializacionView._cambiarTab('leche')">🥛 Leche</button>
          <button class="comer-tab ${this._currentTab === 'gastos' ? 'active' : ''}" data-tab="gastos" onclick="ComercializacionView._cambiarTab('gastos')">💸 Gastos</button>
        </div>
      </div>
      <div id="comer-content"><div class="loader">Cargando...</div></div>`;

    // Cargar datos
    const fincaId = await Fincas.getActiveId();
    const [ventas, entregas, gastosRecords] = await Promise.all([
      window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
      Gastos.list(fincaId).catch(() => [])
    ]);

    ventas.sort((a, b) => new Date(b.fechaSacrificio || 0) - new Date(a.fechaSacrificio || 0));
    entregas.sort((a, b) => new Date(b.fechaRecogida || 0) - new Date(a.fechaRecogida || 0));
    gastosRecords.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    const pesoTotal = ventas.reduce((s, v) => s + (v.pesoCanal || 0), 0);
    const rendProm = ventas.length > 0
      ? ventas.reduce((s, v) => s + (v.rendimientoCanal || 0), 0) / ventas.length
      : 0;

    const litrosTotal = entregas.reduce((s, e) => s + (e.cantidad || 0), 0);

    this._cachedData = {
      ventas, entregas, gastosRecords,
      kpis: {
        carne: [
          { label: 'Peso Canal (kg)', value: this._fmt(pesoTotal) + ' kg' },
          { label: 'Animales', value: ventas.length },
          { label: 'Rend. Prom.', value: rendProm.toFixed(1) + '%' }
        ],
        leche: [
          { label: 'Total Litros', value: this._fmt(litrosTotal) + ' L' },
          { label: 'Entregas', value: entregas.length },
          { label: 'Promedio', value: entregas.length > 0 ? this._fmt(Math.round(litrosTotal / entregas.length)) + ' L' : '0 L' }
        ],
        gastos: [
          { label: 'Total (€)', value: this._fmt(gastosRecords.reduce((s, g) => s + (g.monto || 0), 0)) + ' €' },
          { label: 'Registros', value: gastosRecords.length }
        ]
      }
    };

    this._renderTabActual();

      },

  _inyectarEstilos() {
    if (document.getElementById('comer-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'comer-tab-styles';
    style.textContent = `
      .comer-tabs::-webkit-scrollbar { display: none; }
      .comer-tab {
        flex: 0 0 auto; padding: 9px 18px; border-radius: 18px; border: 1px solid #333;
        background: #1a1a1a; color: #888; font-size: 0.78rem; font-weight: 800;
        cursor: pointer; white-space: nowrap; transition: all 0.2s;
        text-transform: uppercase; letter-spacing: 0.4px;
      }
      .comer-tab.active { background: #d97706; color: #fff; border-color: #d97706; box-shadow: 0 0 14px rgba(217,119,6,0.35); }
      .comer-tab:active { transform: scale(0.95); }
      #comer-content .report-section { max-width:100%; overflow:hidden; }
    `;
    document.head.appendChild(style);
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.comer-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
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
    const { icon, title, subtitle, color, colorDark, kpis, registrarLabel, listName, records, emptyMsg, registrarHandler, threeColKpis } = opts;

    const recordsHtml = records.length > 0
      ? records.map(r => `
        <div class="card" style="border-left:4px solid ${color}; padding:10px 12px; margin-bottom:5px; cursor:pointer; background:rgba(0,0,0,0.3);"
             onclick="${r.onclick || ''}">
          <div class="flex justify-between items-start">
            <div style="flex:1; min-width:0;">
              <div class="font-extrabold truncate" style="font-size:0.88rem;">${r.title}</div>
              <div class="text-xs text-gray mt-4">📅 ${r.date}${r.zone ? ' | 📍 ' + r.zone : ''}${r.meta || ''}</div>
            </div>
            <div class="text-right flex-shrink-0 ml-8">
              <div class="font-black" style="font-size:1rem; color:${color};">${r.value}</div>
              ${r.subvalue ? `<div class="kpi-sub">${r.subvalue}</div>` : ''}
            </div>
          </div>
          ${r.badges ? `<div class="flex flex-wrap gap-6 mt-6">${r.badges}</div>` : ''}
        </div>`).join('')
      : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555" style="font-size:0.78rem;">📭 ${emptyMsg}</span></div>`;

    content.innerHTML = `
      <div class="card report-section" style="border-top:3px solid ${color}; padding:16px; margin-bottom:14px;">
        <div class="flex items-center gap-12 mb-12">
          <span class="text-2xl">${icon}</span>
          <div>
            <div class="font-black text-lg text-white">${title}</div>
            ${subtitle ? `<div class="text-xs text-gray">${subtitle}</div>` : ''}
          </div>
        </div>
        ${kpis ? `<div style="display:grid; ${threeColKpis ? 'grid-template-columns:1fr 1fr 1fr' : 'grid-template-columns:1fr 1fr'}; gap:8px; margin-bottom:12px;">
          ${kpis.map(k => `
            <div class="bg-dark" style="padding:10px 8px; border-radius:8px; border-left:3px solid ${color};">
              <small class="text-gray uppercase font-bold tracking-wide text-tiny">${k.label}</small>
              <div class="font-black text-white" style="font-size:1.1rem;">${k.value}</div>
            </div>`).join('')}
        </div>` : ''}
        <div class="text-center mb-12">
          <button class="btn btn-primary btn-sm" onclick="${registrarHandler}"
            style="background:linear-gradient(135deg,${color},${colorDark}); box-shadow:none;">
            ➕ ${registrarLabel}
          </button>
        </div>
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider mb-6 border-bottom-222" style="padding-bottom:5px;">
          📋 ${listName}
        </div>
        ${recordsHtml}
      </div>`;
  },

  // ===================== TAB CARNE =====================

  _renderCarne(content, d) {
    const badgeHtml = (v) => {
      let cls = (v.clasificacion?.seurop || "S/C").toUpperCase();
      return `<span class="badge badge-red" style="font-size:0.62rem; border:1px solid rgba(239,68,68,0.2);">${cls}</span>`;
    };

    this._renderSeccion(content, {
      icon: '🥩', title: 'Ventas de Carne', subtitle: 'Expediciones a matadero y venta directa',
      color: '#ef4444', colorDark: '#b91c1c',
      threeColKpis: true,
      kpis: d.kpis.carne,
      registrarLabel: 'Registrar Venta',
      listName: 'Lista de Ventas',
      registrarHandler: "App._abrirWizardVentaMasiva()",
      records: d.ventas.slice(0, 50).map(v => {
        const badge = badgeHtml(v);
        return {
          title: '🔖 ' + (v.razonSocial || 'Matadero Central'),
          date: v.fechaSacrificio ? new Date(v.fechaSacrificio).toLocaleDateString() : '-',
          zone: v.snap_zona || '',
          value: (v.pesoCanal || 0) + ' kg',
          subvalue: 'Rend: ' + (v.rendimientoCanal || 0) + '%',
          badges: badgeHtml(v),
          onclick: "App._abrirDetalleVentaCarne(" + v.id + ")"
        };
      }),
      emptyMsg: 'Sin ventas de carne registradas. Usa "Registrar Venta" para añadir una expedición.'
    });
  },

  // ===================== TAB LECHE =====================

  _renderLeche(content, d) {
    this._renderSeccion(content, {
      icon: '🥛', title: 'Entregas de Leche', subtitle: 'Retiradas de tanque y albaranes',
      color: '#f59e0b', colorDark: '#b45309',
      threeColKpis: true,
      kpis: d.kpis.leche,
      registrarLabel: 'Registrar Retirada',
      listName: 'Lista de Entregas',
      registrarHandler: "App._abrirWizardAlbaranLeche()",
      records: d.entregas.slice(0, 50).map(e => {
        const esAlerta = e.estadoAnalitica === "Alerta Crítica" || e.antibioticos === true;
        const lab = e.laboratorio || {};
        const es = lab.extracto_seco || (lab.grasa != null && lab.proteina != null ? (lab.grasa + lab.proteina).toFixed(1) : '--');
        const badges = window.CalidadLecheHelper ? window.CalidadLecheHelper.badgesCompletos(e) : '';

        // Añadir precio final y MOFA como badges si existen
        let extraBadges = '';
        if (e.precio_final_unitario) extraBadges += `<span style="font-size:0.62rem; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.3);">💰 ${e.precio_final_unitario.toFixed(3)} €/L</span>`;
        if (e.mofa != null) {
          const color = e.mofa >= 0 ? '#10b981' : '#ef4444';
          extraBadges += `<span style="font-size:0.62rem; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(${e.mofa >= 0 ? '16,185,129' : '239,68,68'},0.1); color:${color}; border:1px solid rgba(${e.mofa >= 0 ? '16,185,129' : '239,68,68'},0.3);">📈 MOFA: ${Math.round(e.mofa)} €</span>`;
        }
        if (e.comunidad_autonoma) {
          extraBadges += `<span style="font-size:0.62rem; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(139,92,246,0.1); color:#8b5cf6; border:1px solid rgba(139,92,246,0.3);">${e.comunidad_autonoma === 'andalucia' ? '🌿 AND' : '🌿 EXT'}</span>`;
        }
        const allBadges = [badges, extraBadges].filter(Boolean).join(' ');

        return {
          title: '🚛 Cisterna: ' + (e.matriculaCisterna || 'S/N'),
          date: e.fechaRecogida ? new Date(e.fechaRecogida).toLocaleDateString() : '-',
          zone: '',
          value: (e.cantidad || 0).toLocaleString() + ' L',
          subvalue: '🌡️ ' + (e.temperatura || '--') + 'ºC' + (es !== '--' ? ' · 📊 ES: ' + es + '%' : ''),
          badges: allBadges || `<span style="font-size:0.62rem; font-weight:700; padding:2px 8px; border-radius:4px; background:${esAlerta ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; color:${esAlerta ? '#ef4444' : '#10b981'}; border:1px solid ${esAlerta ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'};">${e.estadoAnalitica || 'PENDIENTE'}</span>`,
          onclick: "location.hash='/albaran-leche?id=" + e.id + "'"
        };
      }),
      emptyMsg: 'Sin entregas de leche registradas. Usa "Registrar Retirada" para añadir.'
    });
  },

  // ===================== TAB GASTOS =====================

  _renderGastos(content, d) {
    this._renderSeccion(content, {
      icon: '💸', title: 'Gastos Analíticos', subtitle: 'Costes operativos y de explotación',
      color: '#8b5cf6', colorDark: '#6d28d9',
      threeColKpis: false,
      kpis: d.kpis.gastos,
      registrarLabel: 'Registrar Gasto',
      listName: 'Lista de Gastos',
      registrarHandler: "App._abrirFormularioGasto()",
      records: d.gastosRecords.slice(0, 50).map(g => ({
        title: '🧾 ' + (g.concepto || g.categoria || 'Gasto'),
        date: g.fecha ? new Date(g.fecha).toLocaleDateString() : '-',
        zone: g.snap_zona || '',
        meta: ' 🏷️ ' + (g.categoria || ''),
        value: (g.monto || 0).toLocaleString() + ' €',
        onclick: "ProduccionView._abrirOpcionesGasto(" + g.id + ")"
      })),
      emptyMsg: 'Sin gastos registrados. Usa "Registrar Gasto" para añadir.'
    });
  },

  // ===================== ELIMINAR / EDITAR (desde app.js) =====================

  async _eliminarVentaCarne(id) {
    if (!confirm("¿Eliminar registro de venta? El animal volverá a estar ACTIVO.")) return;
    try {
      const v = await window.db.get("comercializacion_carne", id);
      const a = await window.db.get("animales", v.animalId);
      if (a) {
        a.estado = "activo";
        await Animales.save(a);
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
    if (!confirm("¿Eliminar este registro de gasto?")) return;
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
      e.cantidad = parseFloat(document.getElementById("le-cant").value);
      e.precioBase = parseFloat(document.getElementById("le-pb").value);
      e.laboratorio = {
        grasa: parseFloat(document.getElementById("le-grasa").value),
        proteina: parseFloat(document.getElementById("le-prot").value),
        somaticas: parseInt(document.getElementById("le-som").value),
        germenes: parseInt(document.getElementById("le-ger").value),
        antibioticos: document.getElementById("le-ant").value === "true",
      };
      e.antibioticos = e.laboratorio.antibioticos;
      e.estadoAnalitica = e.antibioticos ? "Alerta Crítica" : "Validado";
      await window.db.put("comercializacion_leche", e);
      App.toast("Registro lácteo actualizado.");
      this._cachedData = null;
      this.render(new Map([["tab", "leche"]]));
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _guardarEdicionGasto(id) {
    const g = await window.db.get("gastos_ganaderia", id);
    g.concepto = document.getElementById("ge-con").value;
    g.monto = parseFloat(document.getElementById("ge-mon").value);
    await window.db.put("gastos_ganaderia", g);
    App.toast("Gasto actualizado.");
    this._cachedData = null;
    this.render(new Map([["tab", "gastos"]]));
  },

  // ===================== DETALLE LECHE (albaran) =====================

  async renderDetalleLeche(params) {
    const id = params.get("id");
    const e = await window.db.get("comercializacion_leche", parseInt(id));
    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/comercializacion?tab=leche" class="link-back">← Volver</a><h2>🥛 Analítica de Tanque</h2></div>
      <div class="card" style="border-top:5px solid #fbbf24;">
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
        <button class="btn btn-primary" onclick="ComercializacionView._guardarEdicionLeche(${id})" style="margin-top:25px; background:#fbbf24; color:#000;">ACTUALIZAR RESULTADOS</button>
      </div>`;
  },

  // ===================== DETALLE GASTO (edicion) =====================

  async renderDetalleGasto(params) {
    const id = params.get("id");
    const g = await window.db.get("gastos_ganaderia", parseInt(id));
    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/comercializacion?tab=gastos" class="link-back">← Volver</a><h2>💸 Ficha de Gasto</h2></div>
      <div class="card" style="border-top:4px solid #3b82f6;">
        <label>Concepto</label><input type="text" id="ge-con" value="${g.concepto}" class="premium-input mb-10">
        <label>Monto (€)</label><input type="number" id="ge-mon" value="${g.monto}" class="premium-input">
        <div class="flex gap-10" style="margin-top:25px;">
          <button class="btn btn-primary" onclick="ComercializacionView._guardarEdicionGasto(${id})" style="flex:2; background:#3b82f6;">💾 GUARDAR</button>
          <button class="btn btn-secondary" onclick="ComercializacionView._eliminarGasto(${id})" style="flex:1; background:#450a0a; color:white;">🗑️ BORRAR</button>
        </div>
      </div>`;
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.ComercializacionView = ComercializacionView;
