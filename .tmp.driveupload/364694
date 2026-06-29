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

    main.innerHTML = `
      ${pipelineInfo ? `
      <div class="card p-12 mb-12 border-222" style="border-left:4px solid #10b981;">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider">Origen de flujo</div>
        <div class="text-sm text-white mt-4">Registro finalizado en <strong>Explotación (${(pipelineInfo.modo_explotacion || '').toUpperCase()})</strong>.</div>
        <div class="text-xs text-aaa mt-4">Fitosanitarios con pendiente/no aptos: <strong style="color:${(pipelineInfo.cumplimiento?.pendientesFitosanitarios || 0) > 0 ? '#ef4444' : '#10b981'}">${pipelineInfo.cumplimiento?.pendientesFitosanitarios || 0}</strong> / ${pipelineInfo.cumplimiento?.totalFitosanitarios || 0}</div>
      </div>` : ''}

      <!-- KPIs globales -->
      <div class="grid grid-cols-3 gap-6 mb-14">
        <div class="info-box-center" style="border-left:3px solid #f59e0b;"><small class="s-lbl">🥩 CARNE</small><div class="inf-val-lg text-amber">${ingresoTotal.toLocaleString()}€</div><small class="text-gray text-xs">${pesoTotal.toFixed(0)} kg · ${ventas.length} ventas</small></div>
        <div class="info-box-center" style="border-left:3px solid #fbbf24;"><small class="s-lbl">🥛 LECHE</small><div class="inf-val-lg text-gold">${litrosTotal.toFixed(0)} L</div><small class="text-gray text-xs">${entregas.length} entregas · MOFA ${(mofaTotal >= 0 ? '+' : '')}${Math.round(mofaTotal).toLocaleString()}€</small></div>
        <div class="info-box-center" style="border-left:3px solid #ef4444;"><small class="s-lbl">💸 GASTOS</small><div class="inf-val-lg text-red">${gastoTotal.toLocaleString()}€</div><small class="text-gray text-xs">${gastosRecords.length} registros</small></div>
      </div>

      <div class="mb-14">
        <div class="tabs-scroll comer-tabs scroll-shadow-container">
          <button class="comer-tab ${this._currentTab === 'carne' ? 'active' : ''}" data-tab="carne" onclick="ComercializacionView._cambiarTab('carne')">🥩 Carne</button>
          <button class="comer-tab ${this._currentTab === 'leche' ? 'active' : ''}" data-tab="leche" onclick="ComercializacionView._cambiarTab('leche')">🥛 Leche</button>
          <button class="comer-tab ${this._currentTab === 'gastos' ? 'active' : ''}" data-tab="gastos" onclick="ComercializacionView._cambiarTab('gastos')">💸 Gastos</button>
        </div>
      </div>
      <div id="comer-content"><div class="loader">Cargando...</div></div>`;

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
    const { icon, title, subtitle, color, colorDark, kpis, registrarLabel, listName, records, emptyMsg, registrarHandler } = opts;

    const recordsHtml = records.length > 0
      ? records.map(r => `
        <div class="card card-animal" onclick="${r.onclick || ''}" style="border-left:4px solid ${color};">
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-6">
                <span class="text-xl">${icon}</span>
                <h3 class="section-h3 m-0 text-ellipsis">${r.title}</h3>
              </div>
              <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                <span>📅 ${r.date}</span>
                ${r.zone ? `<span>·</span><span>📍 ${r.zone}</span>` : ''}
                ${r.meta ? `<span>·</span><span>📋 ${r.meta}</span>` : ''}
              </div>
              ${r.badges ? `<div class="flex flex-wrap gap-6 mt-6">${r.badges}</div>` : ''}
            </div>
            <div class="text-right flex-shrink-0 ml-8">
              <span class="badge badge-sm" style="background:${color}20;color:${color};border:1px solid ${color}40;display:block;margin-bottom:4px;">${r.value}</span>
              ${r.subvalue ? `<div class="kpi-sub" style="font-size:0.75rem; color:#888;">${r.subvalue}</div>` : ''}
              <span class="text-xs text-777 mt-4" style="display:block;">Ver ➔</span>
            </div>
          </div>
        </div>`).join('')
      : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">📭 ${emptyMsg}</span></div>`;

    content.innerHTML = `
      <div class="card report-section p-16 mb-14" style="border-top:3px solid ${color};">
        <div class="flex justify-between items-center mb-16">
          <div class="flex items-center gap-12">
            <span style="font-size:1.6rem;">${icon}</span>
            <div>
              <div class="text-white font-900" style="font-size:1.05rem;">${title}</div>
              ${subtitle ? `<div class="text-gray" style="font-size:0.68rem;">${subtitle}</div>` : ''}
            </div>
          </div>
          <button class="btn btn-create btn-sm" onclick="${registrarHandler}">
            ➕ Nuevo
          </button>
        </div>

        ${kpis ? `
        <div class="flex flex-wrap gap-4 mb-14">
          ${kpis.map((k, idx) => {
            const badgesCls = ['badge-gold', 'badge-blue', 'badge-green', 'badge-purple', 'badge-red'];
            const cls = badgesCls[idx % badgesCls.length];
            return `<span class="badge badge-sm ${cls}">${k.label}: ${k.value}</span>`;
          }).join('')}
        </div>` : ''}

        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222" style="margin-bottom:6px; padding-bottom:5px;">
          📋 ${listName}
        </div>
        <div class="grid gap-10">
          ${recordsHtml}
        </div>
      </div>
      <button class="fab-btn" onclick="${registrarHandler}" aria-label="Nuevo Registro">➕</button>`;
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
        const estadoTramite = (v.estado_tramite || '').toString().trim();
        const badgeTramite = estadoTramite
          ? `<span class="badge badge-sm" style="font-size:0.62rem; border:1px solid rgba(59,130,246,0.3); background:rgba(59,130,246,0.12); color:#93c5fd;">🏛️ ${estadoTramite.toUpperCase()}</span>`
          : '';
        return {
          title: '🔖 ' + (v.razonSocial || 'Matadero Central'),
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
        if (e.estado_tramite_infolac) {
          extraBadges += `<span style="font-size:0.62rem; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(59,130,246,0.12); color:#93c5fd; border:1px solid rgba(59,130,246,0.35);">🏛️ INFOLAC: ${String(e.estado_tramite_infolac).toUpperCase()}</span>`;
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
        <div class="flex justify-end gap-10 mt-20">
          <button class="btn btn-secondary" onclick="location.hash='/comercializacion?tab=leche'">✕ Cancelar</button>
          <button class="btn btn-success" onclick="ComercializacionView._guardarEdicionLeche(${id})">✔ Guardar</button>
        </div>
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
        <div class="flex justify-between items-center mt-20">
          <button class="btn btn-danger" onclick="ComercializacionView._eliminarGasto(${id})">🗑️ Eliminar</button>
          <div class="flex gap-10">
            <button class="btn btn-secondary" onclick="location.hash='/comercializacion?tab=gastos'">✕ Cancelar</button>
            <button class="btn btn-success" onclick="ComercializacionView._guardarEdicionGasto(${id})">✔ Guardar</button>
          </div>
        </div>
      </div>`;
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.ComercializacionView = ComercializacionView;
