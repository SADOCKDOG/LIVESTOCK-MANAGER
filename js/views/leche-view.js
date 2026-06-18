/**
 * Livestock Manager - LecheView v2.0.0
 * Vista de Control Lechero con tabs: Todas / Producción / Analíticas / Liquidaciones / MOFA
 * Reutiliza ComunidadesService y CalidadLecheHelper.
 */

const LecheView = {
  _currentTab: 'todas',
  _cachedData: null,

  /** Formatea fecha con seguridad (evita "Invalid Date") */
  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  async render() {
    const main = document.getElementById('app-content');
    // NO forzar overflow-x:hidden — recorta tabs scrollables
    main.style.maxWidth = '100%';
    main.style.boxSizing = 'border-box';
    main.style.paddingLeft = '12px';
    main.style.paddingRight = '12px';

    this._inyectarEstilos();

    main.innerHTML = `
      <div class="mb-14">
        <!-- tabs scrollables sin justify-content:center -->
        <div class="scroll-shadow-container" style="margin:0 -12px 10px -12px; padding:0 12px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; white-space:nowrap;">
          <div class="leche-tabs" style="display:inline-flex; gap:4px; padding:4px 0;">
            <button class="leche-tab active" data-tab="todas" onclick="LecheView._cambiarTab('todas')">🥛 Todas</button>
            <button class="leche-tab" data-tab="produccion" onclick="LecheView._cambiarTab('produccion')">📊 Producción</button>
            <button class="leche-tab" data-tab="analiticas" onclick="LecheView._cambiarTab('analiticas')">🔬 Analíticas</button>
            <button class="leche-tab" data-tab="liquidaciones" onclick="LecheView._cambiarTab('liquidaciones')">💰 Liquidaciones</button>
            <button class="leche-tab" data-tab="mofa" onclick="LecheView._cambiarTab('mofa')">📈 MOFA</button>
          </div>
        </div>
      </div>
      <div id="leche-content"><div class="loader">Cargando datos lácteos...</div></div>`;

    const fincaId = await Fincas.getActiveId();
    const entregas = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []);
    const finca = await Fincas.getActive();

    entregas.sort((a, b) => new Date(b.fechaRecogida || b.fecha || 0) - new Date(a.fechaRecogida || a.fecha || 0));

    // KPIs agregados
    const litrosTotal = entregas.reduce((s, e) => s + (e.cantidad || 0), 0);
    const numEntregas = entregas.length;
    const mediaLitros = numEntregas > 0 ? litrosTotal / numEntregas : 0;
    const precioBaseMedio = numEntregas > 0 ? entregas.reduce((s, e) => s + (e.precioBase || 0), 0) / numEntregas : 0;
    const precioFinalMedio = numEntregas > 0 ? entregas.reduce((s, e) => s + (e.precio_final_unitario || e.precioBase || 0), 0) / numEntregas : 0;
    const importeTotal = entregas.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
    const mofaTotal = entregas.reduce((s, e) => s + (e.mofa || 0), 0);
    const costeAlimTotal = entregas.reduce((s, e) => s + (e.coste_alimentacion_periodo || 0), 0);

    // Analíticas agregadas
    const conLab = entregas.filter(e => e.laboratorio);
    const grasaMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.grasa || 0), 0) / conLab.length : 0;
    const protMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.proteina || 0), 0) / conLab.length : 0;
    const esTotal = conLab.reduce((s, e) => {
      const es = e.laboratorio.extracto_seco || (e.laboratorio.grasa || 0) + (e.laboratorio.proteina || 0);
      return s + es;
    }, 0);
    const esMedia = conLab.length > 0 ? esTotal / conLab.length : 0;
    const somaticasMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.somaticas || 0), 0) / conLab.length : 0;
    const germenesMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.germenes || 0), 0) / conLab.length : 0;

    // Alertas y rechazos
    const alertasCount = entregas.filter(e => e.estadoAnalitica === 'Alerta Crítica' || e.antibioticos === true).length;
    const pendientesCount = entregas.filter(e => !e.estadoAnalitica || e.estadoAnalitica === 'Pendiente').length;
    const validadasCount = entregas.filter(e => e.estadoAnalitica === 'Validado').length;

    // MOFA ratio
    const mofaRatio = importeTotal > 0 ? (mofaTotal / importeTotal) * 100 : 0;

    this._cachedData = {
      entregas, finca,
      kpis: {
        todas: [
          { label: 'Total Litros', value: this._fmt(litrosTotal) + ' L' },
          { label: 'Entregas', value: numEntregas },
          { label: 'Media/Entrega', value: this._fmt(Math.round(mediaLitros)) + ' L' },
          { label: 'Validadas', value: validadasCount },
          { label: 'Alertas', value: alertasCount, color: alertasCount > 0 ? '#ef4444' : '#10b981' },
          { label: 'Pendientes', value: pendientesCount },
        ],
        produccion: [
          { label: 'Total Litros', value: this._fmt(litrosTotal) + ' L' },
          { label: 'Entregas', value: numEntregas },
          { label: 'Media/Entrega', value: this._fmt(Math.round(mediaLitros)) + ' L' },
          { label: 'Precio Medio €/L', value: precioBaseMedio.toFixed(3) + ' €' },
          { label: 'Importe Total', value: this._fmt(Math.round(importeTotal)) + ' €' },
          { label: 'Precio Final Medio', value: precioFinalMedio.toFixed(3) + ' €' },
        ],
        analiticas: [
          { label: 'Grasa Media', value: grasaMedia.toFixed(2) + '%' },
          { label: 'Proteína Media', value: protMedia.toFixed(2) + '%' },
          { label: 'Extracto Seco Medio', value: esMedia.toFixed(2) + '%' },
          { label: 'Cél. Somáticas Medias', value: this._fmt(Math.round(somaticasMedia)) + '/mL' },
          { label: 'UFC Medias', value: this._fmt(Math.round(germenesMedia)) + '/mL' },
          { label: 'Con Laboratorio', value: conLab.length },
        ],
        liquidaciones: [
          { label: 'Precio Base Medio', value: precioBaseMedio.toFixed(3) + ' €' },
          { label: 'Precio Final Medio', value: precioFinalMedio.toFixed(3) + ' €' },
          { label: 'Importe Total', value: this._fmt(Math.round(importeTotal)) + ' €' },
          { label: 'Coste Alimentación', value: this._fmt(Math.round(costeAlimTotal)) + ' €' },
          { label: 'MOFA Total', value: this._fmt(Math.round(mofaTotal)) + ' €', color: mofaTotal >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Ratio MOFA', value: mofaRatio.toFixed(1) + '%', color: mofaRatio >= 20 ? '#10b981' : '#f59e0b' },
        ],
        mofa: [
          { label: 'MOFA Total', value: this._fmt(Math.round(mofaTotal)) + ' €', color: mofaTotal >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Coste Alimentación', value: this._fmt(Math.round(costeAlimTotal)) + ' €' },
          { label: 'Ingresos Totales', value: this._fmt(Math.round(importeTotal)) + ' €' },
          { label: 'MOFA/Entrega', value: numEntregas > 0 ? this._fmt(Math.round(mofaTotal / numEntregas)) + ' €' : '0 €' },
          { label: 'Ratio MOFA', value: mofaRatio.toFixed(1) + '%', color: mofaRatio >= 20 ? '#10b981' : '#f59e0b' },
          { label: 'Entregas', value: numEntregas },
        ],
      }
    };

    this._renderTabActual();

  },

  _inyectarEstilos() {
    if (document.getElementById('leche-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'leche-tab-styles';
    style.textContent = `
      .leche-tabs::-webkit-scrollbar { display: none; }
      .leche-tab {
        flex: 0 0 auto; padding: 9px 18px; border-radius: 18px; border: 1px solid #333;
        background: #1a1a1a; color: #888; font-size: 0.78rem; font-weight: 800;
        cursor: pointer; white-space: nowrap; transition: all 0.2s;
        text-transform: uppercase; letter-spacing: 0.4px;
      }
      .leche-tab.active { background: #d97706; color: #fff; border-color: #d97706; box-shadow: 0 0 14px rgba(217,119,6,0.35); }
      .leche-tab:active { transform: scale(0.95); }
      #leche-content .report-section { max-width:100%; overflow:hidden; }
    `;
    document.head.appendChild(style);
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.leche-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    if (!d) return;
    const content = document.getElementById('leche-content');
    if (!content) return;

    switch (this._currentTab) {
      case 'todas': this._renderTodas(content, d); break;
      case 'produccion': this._renderProduccion(content, d); break;
      case 'analiticas': this._renderAnaliticas(content, d); break;
      case 'liquidaciones': this._renderLiquidaciones(content, d); break;
      case 'mofa': this._renderMOFA(content, d); break;
      default: this._renderTodas(content, d);
    }
  },

  // ========== HELPER: kpi grid genérico (3 columnas) ==========

  _kpiGrid(kpis, color) {
    if (!kpis || !kpis.length) return '';
    return `<div class="grid grid-cols-3 gap-8 mb-12">
      ${kpis.map(k => `
        <div class="leche-kpi-item" style="--kpi-color:${k.color || color}; --kpi-value-color:${k.color || '#fff'}">
          <small class="leche-kpi-label">${k.label}</small>
          <div class="leche-kpi-value">${k.value}</div>
        </div>`).join('')}
    </div>`;
  },

  // ========== TAB: TODAS ==========

  _renderTodas(content, d) {
    const html = `
      <div class="card report-section leche-report-card border-top-3px border-top-3px-orange">
        <div class="leche-report-title">
          <span class="leche-report-icon">🥛</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">Todas las Entregas</div>
            <div class="leche-report-title-sub">${d.kpis.todas.length} indicadores</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.todas, '#f59e0b')}
        <div class="text-center mb-12">
          <button class="btn btn-primary btn-sm leche-action-btn" style="--btn-start-color:#f59e0b; --btn-end-color:#b45309;" onclick="App._abrirWizardAlbaranLeche()">
            ➕ Nueva Entrega
          </button>
        </div>
        <div class="leche-list-header">
          📋 Lista de Entregas (${d.entregas.length})
        </div>
        ${d.entregas.length > 0
          ? d.entregas.slice(0, 50).map(e => this._cardEntrega(e)).join('')
          : `<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">Sin entregas registradas. Usa "Nueva Entrega" para añadir.</p></div>`
        }
      </div>`;
    content.innerHTML = html;
  },

  _cardEntrega(e) {
    const esAlerta = e.estadoAnalitica === 'Alerta Crítica' || e.antibioticos === true;
    const lab = e.laboratorio || {};
    const es = lab.extracto_seco || (lab.grasa != null && lab.proteina != null ? (lab.grasa + lab.proteina).toFixed(1) : '--');
    const badges = window.CalidadLecheHelper ? window.CalidadLecheHelper.badgesCompletos(e) : '';
    const semaforo = window.CalidadLecheHelper ? window.CalidadLecheHelper.semaforoCalidad(e) : { color: '#888', label: '' };

    return `
      <div class="leche-entrega-card" style="--entrega-border-color:${esAlerta ? '#ef4444' : semaforo.color};" onclick="location.hash='/albaran-leche?id=${e.id}'">
        <div class="leche-entrega-content">
          <div class="leche-entrega-left">
            <div class="leche-entrega-vehicle">
              🚛 ${e.matriculaCisterna || '—'}${e.comunidad_autonoma ? ' | ' + (e.comunidad_autonoma === 'andalucia' ? '🌿 Andalucía' : '🌿 Extremadura') : ''}
            </div>
            <div class="leche-entrega-date">
              📅 ${this._fmtFecha(e.fechaRecogida || e.fecha)} | 🌡️ ${e.temperatura || '--'}°C${e.contrato_numero ? ' | 📄 ' + e.contrato_numero : ''}
            </div>
            ${badges ? `<div class="mt-2 flex gap-4 flex-wrap">${badges}</div>` : ''}
          </div>
          <div class="leche-entrega-right">
            <div class="leche-entrega-litros">${(e.cantidad || 0).toLocaleString()} L</div>
            <div class="leche-entrega-precio">
              ${e.precio_final_unitario ? (e.precio_final_unitario).toFixed(3) + ' €/L' : ''}
              ${e.mofa ? '<br>📈 MOFA: ' + (e.mofa >= 0 ? '+' : '') + Math.round(e.mofa) + ' €' : ''}
            </div>
            <div class="leche-entrega-status-badge"
                 style="background:${esAlerta ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'};
                        color:${esAlerta ? '#ef4444' : '#10b981'};
                        border:1px solid ${esAlerta ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'};">${e.estadoAnalitica || 'PENDIENTE'}</div>
          </div>
        </div>
      </div>`;
  },

  // ========== TAB: PRODUCCIÓN ==========

  _renderProduccion(content, d) {
    const html = `
      <div class="card report-section leche-report-card border-top-3px border-top-3px-blue">
        <div class="leche-report-title">
          <span class="leche-report-icon">📊</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">Indicadores de Producción</div>
            <div class="leche-report-title-sub">Métricas agregadas de producción láctea</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.produccion, '#3b82f6')}
        <div class="text-center mb-12">
          <button class="btn btn-primary btn-sm leche-action-btn" style="--btn-start-color:#3b82f6; --btn-end-color:#1d4ed8;" onclick="App._abrirWizardAlbaranLeche()">
            ➕ Nueva Entrega
          </button>
        </div>
        <div class="leche-list-header">
          📋 Últimas entregas
        </div>
        ${d.entregas.slice(0, 20).map(e => `
          <div class="leche-entrega-card" style="--entrega-border-color:#3b82f6;" onclick="location.hash='/albaran-leche?id=${e.id}'">
            <div class="leche-entrega-content">
              <div class="leche-entrega-left">
                <div>📅 ${this._fmtFecha(e.fechaRecogida || e.fecha)} — 🚛 ${e.matriculaCisterna || '—'}</div>
              </div>
              <div class="leche-entrega-right">
                <div class="leche-entrega-litros text-blue">${(e.cantidad || 0).toLocaleString()} L</div>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
    content.innerHTML = html;
  },

  // ========== TAB: ANALÍTICAS ==========

  _renderAnaliticas(content, d) {
    const umbrales = window.ComunidadesService ? window.ComunidadesService.CALIDAD_LECHE_OVINO_UMBRALES : null;
    const html = `
      <div class="card report-section leche-report-card border-top-3px border-top-3px-purple">
        <div class="leche-report-title">
          <span class="leche-report-icon">🔬</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">Resultados Analíticos</div>
            <div class="leche-report-title-sub">Parámetros de calidad láctea y umbrales de referencia</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.analiticas, '#8b5cf6')}
        ${umbrales ? `
        <div class="info-box-sm mb-12">
          <div class="text-xs text-gray font-bold uppercase mb-2">⚡ Umbrales de Calidad (Ovino Leche)</div>
          <div class="grid grid-cols-2 gap-4 text-xs">
            <span>🧈 Grasa: <strong class="text-white">≥${umbrales.grasa.min}%</strong></span>
            <span>🥩 Proteína: <strong class="text-white">≥${umbrales.proteina.min}%</strong></span>
            <span>📊 Extracto Seco: <strong class="text-white">≥${umbrales.extracto_seco.min}%</strong></span>
            <span>🔬 Somáticas: <strong class="text-white">≤${(umbrales.somaticas.max / 1000).toFixed(0)}k/mL</strong></span>
            <span>🦠 Bacterias: <strong class="text-white">≤${(umbrales.bacterias.max / 1000).toFixed(0)}k UFC/mL</strong></span>
            <span>🌡️ Temperatura: <strong class="text-white">≤${umbrales.temperatura.max}°C</strong></span>
          </div>
        </div>` : ''}
        <div class="leche-list-header">
          📋 Analíticas por entrega
        </div>
        ${d.entregas.slice(0, 30).map(e => {
          const lab = e.laboratorio || {};
          const es = lab.extracto_seco || (lab.grasa != null && lab.proteina != null ? (lab.grasa + lab.proteina).toFixed(1) : '--');
          const hasLab = lab.grasa != null || lab.proteina != null;
          return `
            <div class="leche-entrega-card-sm" style="--entrega-border-color-sm:${hasLab ? '#8b5cf6' : '#555'};"
                 onclick="location.hash='/albaran-leche?id=${e.id}'">
              <div class="leche-entrega-content-sm">
                <div class="leche-entrega-left-sm">
                  <div class="leche-entrega-left-main">
                    📅 ${this._fmtFecha(e.fechaRecogida || e.fecha)} — ${e.matriculaCisterna || '—'}
                  </div>
                  <div class="leche-entrega-left-detail">
                    ${hasLab
                      ? `🧈 ${lab.grasa || '--'}% · 🥩 ${lab.proteina || '--'}% · 📊 ${es}% · 🔬 ${lab.somaticas ? (lab.somaticas / 1000).toFixed(0) + 'k' : '--'} · 🦠 ${lab.germenes ? (lab.germenes / 1000).toFixed(0) + 'k' : '--'}`
                      : '⏳ Sin analítica registrada'}
                  </div>
                </div>
                <div class="leche-entrega-right-sm">
                  <div class="leche-analytic-status"
                       style="background:${e.estadoAnalitica === 'Alerta Crítica' || e.antibioticos ? 'rgba(239,68,68,0.15)' : e.estadoAnalitica === 'Validado' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'};
                              color:${e.estadoAnalitica === 'Alerta Crítica' || e.antibioticos ? '#ef4444' : e.estadoAnalitica === 'Validado' ? '#10b981' : '#f59e0b'};">${e.estadoAnalitica || 'PENDIENTE'}</div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
    content.innerHTML = html;
  },

  // ========== TAB: LIQUIDACIONES ==========

  _renderLiquidaciones(content, d) {
    const preciosRef = window.ComunidadesService ? window.ComunidadesService.PRECIO_EXTRACTO_SECO_REF : null;
    const html = `
      <div class="card report-section leche-report-card border-top-3px border-top-3px-green">
        <div class="leche-report-title">
          <span class="leche-report-icon">💰</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">Liquidaciones y Precios</div>
            <div class="leche-report-title-sub">Desglose económico de entregas de leche</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.liquidaciones, '#10b981')}
        ${preciosRef ? `
        <div class="info-box-sm mb-12">
          <div class="text-xs text-gray font-bold uppercase mb-2">📋 PREG — Precios de Referencia</div>
          <div class="grid grid-cols-2 gap-4 text-xs">
            <span>Base: <strong class="text-white">${preciosRef.precio_base_referencia} €/L</strong></span>
            <span>Punto Extracto Seco: <strong class="text-white">${preciosRef.precio_por_punto_extracto} €</strong></span>
            <span>Prima Calidad: <strong class="text-white">+${preciosRef.prima_calidad_extra} €/L</strong></span>
            <span>Tasa INLAC: <strong class="text-white">${preciosRef.tasa_INLAC_defecto} €/L</strong></span>
          </div>
        </div>` : ''}
        <div class="leche-list-header">
          📋 Detalle de liquidaciones
        </div>
        ${d.entregas.slice(0, 30).map(e => {
          const pFinal = e.precio_final_unitario || e.precioBase || 0;
          const iTotal = e.importe_total || (e.cantidad || 0) * (e.precioBase || 0);
          return `
            <div class="leche-entrega-card" style="--entrega-border-color:#10b981;" onclick="location.hash='/albaran-leche?id=${e.id}'">
              <div class="leche-entrega-content">
                <div class="leche-entrega-left">
                  <div class="leche-entrega-vehicle">
                    📅 ${this._fmtFecha(e.fechaRecogida || e.fecha)} — ${(e.cantidad || 0).toLocaleString()} L
                  </div>
                </div>
                <div class="leche-entrega-right">
                  <div class="leche-entrega-litros">${(e.precioBase || 0).toFixed(3)} €/L</div>
                  <div class="leche-entrega-precio">
                    ${e.precio_extracto_seco ? ' · P.Ext.: ' + e.precio_extracto_seco + ' €' : ''}
                    ${e.primas_penalizaciones ? ' · Ajuste: ' + (e.primas_penalizaciones >= 0 ? '+' : '') + e.primas_penalizaciones + ' €' : ''}
                    · Final: ${pFinal.toFixed(3)} €/L
                  </div>
                  <div class="leche-entrega-status-badge">
                    <div class="font-bold text-lg text-green">${Math.round(iTotal).toLocaleString()} €</div>
                    <div class="text-xs text-gray">MOFA: ${e.mofa != null ? (e.mofa >= 0 ? '+' : '') + Math.round(e.mofa) + ' €' : 'N/D'}</div>
                  </div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
    content.innerHTML = html;
  },

  // ========== TAB: MOFA ==========

  _renderMOFA(content, d) {
    const conMOFA = d.entregas.filter(e => e.mofa != null);
    const html = `
      <div class="card report-section leche-report-card border-top-3px border-top-3px-red">
        <div class="leche-report-title">
          <span class="leche-report-icon">📈</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">MOFA — Margen sobre Coste de Alimentación</div>
            <div class="leche-report-title-sub">Ingresos lácteos menos costes de alimentación del período</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.mofa, '#ef4444')}

        <div class="info-box mb-12">
          <div class="text-xs text-gray font-bold uppercase mb-2">💡 ¿Qué es el MOFA?</div>
          <div class="text-sm text-gray leading-normal">
            El <strong class="text-white">MOFA</strong> (Margen sobre Coste de Alimentación) mide la rentabilidad de la actividad láctea
            descontando el principal coste variable: la alimentación del rebaño.
            Un MOFA positivo indica que los ingresos por leche cubren la alimentación.
            <br><strong class="text-green">Objetivo: ≥20%</strong> sobre ingresos totales.
          </div>
        </div>

        <div class="leche-list-header">
          📋 MOFA por entrega ${conMOFA.length < d.entregas.length ? '(solo ' + conMOFA.length + ' de ' + d.entregas.length + ' con datos)' : ''}
        </div>
        ${conMOFA.length > 0
          ? conMOFA.slice(0, 30).map(e => {
              const ratio = e.importe_total > 0 ? (e.mofa / e.importe_total) * 100 : 0;
              return `
                <div class="leche-mofa-card" style="--mofa-border-color:${e.mofa >= 0 ? '#10b981' : '#ef4444'};"
                     onclick="location.hash='/albaran-leche?id=${e.id}'">
                  <div class="leche-mofa-content">
                    <div class="leche-mofa-left">
                      <div class="leche-mofa-left-main">
                        📅 ${this._fmtFecha(e.fechaRecogida || e.fecha)} — ${(e.cantidad || 0).toLocaleString()} L
                      </div>
                      <div class="leche-mofa-left-detail">
                        💰 ${Math.round(e.importe_total || 0).toLocaleString()} € ingresos · 🍽️ ${Math.round(e.coste_alimentacion_periodo || 0).toLocaleString()} € coste alim.
                      </div>
                    </div>
                    <div class="leche-mofa-right">
                      <div class="leche-mofa-amount">
                        ${e.mofa >= 0 ? '+' : ''}${Math.round(e.mofa).toLocaleString()} €
                      </div>
                      <div class="leche-mofa-ratio">
                        ${ratio.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>`;
            }).join('')
          : `<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">Sin datos MOFA. Usa el wizard de albarán lácteo con todos los pasos completados.</p></div>`
        }
      </div>`;
    content.innerHTML = html;
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.LecheView = LecheView;
