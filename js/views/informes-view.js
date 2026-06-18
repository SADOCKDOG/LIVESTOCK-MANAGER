/**
 * Livestock Manager - InformesView v2.3.0
 * Panel de Inteligencia Analítica — cabecera compacta, fuentes grandes,
 * exportación PDF/Excel con compartición nativa, botón flotante, indicadores.
 * Copia espejo de www/js/views/informes-view.js
 */

const InformesView = {
  _currentTab: 'general',
  _cachedData: null,

  async render() {
    const main = document.getElementById("app-content");
    // NO forzar overflow-x:hidden — recorta tabs. Usar box-sizing solo.
    main.style.maxWidth = '100%';
    main.style.boxSizing = 'border-box';
    main.style.paddingLeft = '12px';
    main.style.paddingRight = '12px';

    main.innerHTML = `
      <div id="inf-kpis-bar" class="grid grid-cols-4 gap-6 mb-14" style="display:none;">
        <div class="info-box-center" style="border-left:3px solid #10b981;"><small class="s-lbl">CENSO</small><div class="inf-val-lg text-green" id="inf-kpi-censo">—</div></div>
        <div class="info-box-center" style="border-left:3px solid #f59e0b;"><small class="s-lbl">BALANCE</small><div class="inf-val-lg" id="inf-kpi-balance" style="color:#10b981;">—</div></div>
        <div class="info-box-center" style="border-left:3px solid #3b82f6;"><small class="s-lbl">INGRESOS</small><div class="inf-val-lg text-blue" id="inf-kpi-ingresos">—</div></div>
        <div class="info-box-center" style="border-left:3px solid #ef4444;"><small class="s-lbl">GASTOS</small><div class="inf-val-lg text-red" id="inf-kpi-gastos">—</div></div>
      </div>
      <div class="mb-14">
        <div class="scroll-shadow-container" style="margin:0 -12px 8px -12px; padding:0 12px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; white-space:nowrap;">
          <div class="informes-tabs" style="display:inline-flex; gap:6px; padding:4px 0;">
            <button class="inf-tab active" data-tab="general" onclick="InformesView._cambiarTab('general')">📊 General</button>
            <button class="inf-tab" data-tab="carne" onclick="InformesView._cambiarTab('carne')">🥩 Cárnico</button>
            <button class="inf-tab" data-tab="leche" onclick="InformesView._cambiarTab('leche')">🥛 Lácteo</button>
            <button class="inf-tab" data-tab="reproductivo" onclick="InformesView._cambiarTab('reproductivo')">🧬 Reproductivo</button>
            <button class="inf-tab" data-tab="sanidad" onclick="InformesView._cambiarTab('sanidad')">⚕️ Sanidad</button>
            <button class="inf-tab" data-tab="censo" onclick="InformesView._cambiarTab('censo')">🐑 Censo</button>
            <button class="inf-tab" data-tab="ventas" onclick="InformesView._cambiarTab('ventas')">📒 Ventas</button>
            <button class="inf-tab" data-tab="compradores" onclick="InformesView._cambiarTab('compradores')">🏢 Compradores</button>
            <button class="inf-tab" data-tab="proveedores" onclick="InformesView._cambiarTab('proveedores')">📦 Proveedores</button>
            <button class="inf-tab" data-tab="fitosanitario" onclick="InformesView._cambiarTab('fitosanitario')">🧪 Fitosanitario</button>
            <button class="inf-tab" data-tab="alertas" onclick="InformesView._cambiarTab('alertas')">🚨 Alertas</button>
            <button class="inf-tab" data-tab="por-finca" onclick="InformesView._cambiarTab('por-finca')">🏠 Por Finca</button>
            <button class="inf-tab" data-tab="rega" onclick="InformesView._cambiarTab('rega')">📋 REGA</button>
            <button class="inf-tab" data-tab="exportar" onclick="InformesView._cambiarTab('exportar')">📤 Exportar</button>
            <button class="inf-tab" data-tab="pyg" onclick="InformesView._cambiarTab('pyg')">💰 PyG</button>
            <button class="inf-tab" data-tab="coste-prod" onclick="InformesView._cambiarTab('coste-prod')">🐄 Coste/Animal</button>
            <button class="inf-tab" data-tab="eficiencia" onclick="InformesView._cambiarTab('eficiencia')">📊 Eficiencia</button>
            <button class="inf-tab" data-tab="cargas" onclick="InformesView._cambiarTab('cargas')">📐 Aforos</button>
            <button class="inf-tab" data-tab="rotacion" onclick="InformesView._cambiarTab('rotacion')">🔄 Rotación</button>
            <button class="inf-tab" data-tab="flujo-caja" onclick="InformesView._cambiarTab('flujo-caja')">📈 Flujo Caja</button>
            <button class="inf-tab" data-tab="rent-esp" onclick="InformesView._cambiarTab('rent-esp')">🧬 Rent. Especie</button>
            <button class="inf-tab" data-tab="curva-prod" onclick="InformesView._cambiarTab('curva-prod')">📉 Curva Prod.</button>
            <button class="inf-tab" data-tab="breakeven" onclick="InformesView._cambiarTab('breakeven')">⚖️ Break-Even</button>
            <button class="inf-tab" data-tab="subvenciones" onclick="InformesView._cambiarTab('subvenciones')">🌾 PAC</button>
          </div>
        </div>
      </div>
      <div id="informes-content"><div class="loader">Cargando indicadores...</div></div>`;

    // Inyectar estilos para los tabs
    this._inyectarEstilosTabs();

    // Cargar datos
    const fId = await Fincas.getActiveId();
    try {
      const [
        rent, margenA, rentZ, censo, kpisRepro,
        estadisticasSanidad, lecheStats, gastosCat,
        gmdData, ventasHist, animales, rebanos,
        finca, ventasCompleto, docsLegales, transportistas, eventos, rawLeche,
        compradoresData, proveedoresData,         fitosanitarioData, alertasData, porFincaData,
        ventasPorRebano, lechePorRebano,
        pygData, costeProdData, rotacionData, cargasData, eficienciaData, flujoCajaData,
        rentEspData, curvaProdData, breakEvenData, pacData, sanitariosRaw
      ] = await Promise.all([
        Analitica.obtenerRentabilidadFinca(fId).catch(() => null),
        Analitica.obtenerMargenPorAnimal(fId).catch(() => []),
        Analitica.obtenerRentabilidadZonas(fId).catch(() => []),
        Analitica.obtenerCensoRebanos(fId).catch(() => []),
        Reproduccion.getKPIs(fId).catch(() => ({})),
        Analitica.obtenerEstadisticasSanitarias(fId).catch(() => ({})),
        this._obtenerMetricasLeche(fId),
        this._obtenerGastosPorCategoria(fId),
        this._obtenerGananciaDiaria(fId),
        this._obtenerHistorialVentas(fId),
        window.db.getAll('animales').catch(() => []),
        Rebanos.list().catch(() => []),
        Fincas.getActive().catch(() => null),
        window.db.getAll('comercializacion_carne').catch(() => []),
        window.db.getAll('documentos_legales').catch(() => []),
        window.db.getAll('transportistas').catch(() => []),
        window.db.getAll('registro_eventos').catch(() => []),
        window.db.getAll('comercializacion_leche').catch(() => []),
        this._obtenerMetricasCompradores(fId),
        this._obtenerMetricasProveedores(fId),
        this._obtenerDatosFitosanitarios(fId),
        this._obtenerAlertas(),
        this._obtenerDatosPorFinca(fId),
        this._obtenerVentasPorRebano(fId),
        this._obtenerLechePorRebano(fId),
        Analitica.obtenerCuentaResultados(fId).catch(() => ({ porMes: [], totalIngresos: 0, totalGastos: 0, totalBalance: 0, gastosPorCategoria: [], numMeses: 0, rentabilidad: '0.0' })),
        Analitica.obtenerCosteProduccionDiario(fId).catch(() => ({ porRebano: [], totalGasto: 0, totalAnimales: 0, costeMedioCabeza: 0, costeMedioDia: 0 })),
        Analitica.obtenerRotacionCenso(fId).catch(() => ({ ultimos90: {}, ultimos30: {}, totalAnimales: 0, activos: 0, tasaReposicion: '0%', tasaBajas: '0%', periodo: '90 días' })),
        Analitica.obtenerCargasAforos(fId).catch(() => ({ porZona: [], totalAforo: 0, totalOcupacion: 0, pctGlobal: '0', alertas: [], numAlertas: 0, numZonas: 0 })),
        Analitica.obtenerEficienciaTecnica(fId).catch(() => ({ kpis: [], activos: 0, totalLecheros: 0, numRebanos: 0, totalAnimales: 0 })),
        Analitica.obtenerFlujoCaja(fId).catch(() => ({ porMes: [], totalEntradas: 0, totalSalidas: 0, totalNeto: 0, saldoFinal: 0 })),
        Analitica.obtenerRentabilidadEspecie(fId).catch(() => ({ porEspecie: [], totalIngresos: 0, totalGastos: 0, totalBalance: 0 })),
        Analitica.obtenerCurvaProduccion(fId).catch(() => ({ porMes: [], totalKg: 0, totalLitros: 0, totalIngresos: 0, metaKg: 0, metaLitros: 0, pctCumplimientoKg: '0', pctCumplimientoLitros: '0' })),
        Analitica.obtenerBreakEven(fId).catch(() => ({ costesFijos: 0, costesVariables: 0, ingresosTotal: 0, breakEvenKg: 0, breakEvenLitros: 0, margenSeguridadKg: '0%', margenSeguridadLitros: '0%', cubiertoCarne: false, cubiertoLeche: false, numRebanos: 0, numMeses: 0 })),
        this._obtenerDatosPAC(fId),
        window.db.getAll('sanitarios_ganado').catch(() => []),
      ]);

      // Poblar barra de KPIs globales
      const kpiBar = document.getElementById('inf-kpis-bar');
      if (kpiBar) {
        const totalCenso = censo.reduce((s, r) => s + r.total, 0);
        document.getElementById('inf-kpi-censo').textContent = totalCenso;
        const balance = rent?.balance || 0;
        const balEl = document.getElementById('inf-kpi-balance');
        balEl.textContent = (balance >= 0 ? '+' : '') + balance.toLocaleString() + '€';
        balEl.style.color = balance >= 0 ? '#10b981' : '#ef4444';
        document.getElementById('inf-kpi-ingresos').textContent = (rent?.ingresos || 0).toLocaleString() + '€';
        document.getElementById('inf-kpi-gastos').textContent = (rent?.gastos || 0).toLocaleString() + '€';
        kpiBar.style.display = 'grid';
      }

      // Cachear data para los tabs
      this._cachedData = {
        _cachedLeche: rawLeche || [],
        rent, margenA, rentZ, censo, kpisRepro,
        estadisticasSanidad, lecheStats, gastosCat,
        gmdData, ventasHist, animales, rebanos, fId,
        finca, ventasCompleto, docsLegales, transportistas, eventos,
        compradoresData, proveedoresData, fitosanitarioData, alertasData, porFincaData,
        ventasPorRebano, lechePorRebano,
        pygData, costeProdData, rotacionData, cargasData, eficienciaData, flujoCajaData,
        rentEspData, curvaProdData, breakEvenData, pacData, sanitariosRaw
      };

      this._renderTabActual();
    } catch (e) {
      document.getElementById("informes-content").innerHTML =
        `<div class="card empty-state"><p class="text-red">Error al cargar datos: ${e.message}</p></div>`;
    }
  },

  _inyectarEstilosTabs() {
    if (document.getElementById('inf-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'inf-tab-styles';
    style.textContent = `
      .informes-tabs { scrollbar-width: none; }
      .informes-tabs::-webkit-scrollbar { display: none; }
      .inf-tab {
        flex: 0 0 auto; padding: 7px 12px; border-radius: 16px; border: 1px solid #333;
        background: #1a1a1a; color: #888; font-size: 0.75rem; font-weight: 800;
        cursor: pointer; white-space: nowrap; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.3px;
      }
      .inf-tab.active { background: #d97706; color: #fff; border-color: #d97706; box-shadow: 0 0 12px rgba(217,119,6,0.3); }
      .inf-tab:active { transform: scale(0.95); }
      .chart-wrap { position:relative; width:100%; max-width:100%; overflow:hidden; }
      .chart-wrap canvas { max-width:100% !important; height:auto !important; }
      .table-scroll { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .table-scroll table { min-width:450px; }
      .reporte-table td, .reporte-table th { white-space:nowrap; padding:10px 12px; }
      .report-section { max-width:100%; overflow:hidden; }

      /* 🌟 BIGGER FONTS — override inline styles for better readability */
      .inf-report h3 { font-size: 1.15rem !important; }
      .inf-report .s-lbl { font-size: 0.7rem !important; letter-spacing: 0.5px; color: #888; }
      .inf-report .inf-val-lg { font-size: 1.35rem !important; font-weight: 900; }
      .inf-report .inf-val-md { font-size: 1.1rem !important; font-weight: 800; }
      .inf-report .inf-table { font-size: 0.85rem !important; }
      .inf-report .inf-small { font-size: 0.75rem !important; }
      .inf-report .inf-card-title { font-size: 1.1rem !important; font-weight: 800; margin: 0 0 10px 0; }
    `;
    document.head.appendChild(style);
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.inf-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    this._renderTabActual();
  },

  _renderTabActual() {
    const d = this._cachedData;
    if (!d) return;
    const content = document.getElementById("informes-content");
    if (!content) return;

    try {
      switch (this._currentTab) {
        case 'general': this._renderGeneral(content, d); break;
        case 'carne': this._renderCarne(content, d); break;
        case 'leche': this._renderLeche(content, d); break;
        case 'reproductivo': this._renderReproductivo(content, d); break;
        case 'sanidad': this._renderSanidad(content, d); break;
        case 'censo': this._renderCenso(content, d); break;
        case 'ventas': this._renderVentas(content, d); break;
        case 'compradores': this._renderCompradores(content, d); break;
        case 'proveedores': this._renderProveedores(content, d); break;
        case 'fitosanitario': this._renderFitosanitario(content, d); break;
        case 'alertas': this._renderAlertas(content, d); break;
        case 'por-finca': this._renderPorFinca(content, d); break;
        case 'rega': this._renderRega(content, d); break;
        case 'exportar': this._renderExportar(content, d); break;
        case 'pyg': this._renderPyG(content, d); break;
        case 'coste-prod': this._renderCosteProd(content, d); break;
        case 'eficiencia': this._renderEficiencia(content, d); break;
        case 'cargas': this._renderCargas(content, d); break;
        case 'rotacion': this._renderRotacion(content, d); break;
        case 'flujo-caja': this._renderFlujoCaja(content, d); break;
        case 'rent-esp': this._renderRentabilidadEspecie(content, d); break;
        case 'curva-prod': this._renderCurvaProduccion(content, d); break;
        case 'breakeven': this._renderBreakEven(content, d); break;
        case 'subvenciones': this._renderSubvenciones(content, d); break;
        default: this._renderGeneral(content, d);
      }
    } catch (e) {
      console.error('[InformesView] Error en render:', e);
      content.innerHTML = `<div class="card empty-state"><p class="text-red" style="font-size:1rem;">❌ Error al mostrar: ${e.message}</p><p class="text-gray text-xs mt-6">Comprueba la consola para más detalles.</p></div>`;
    }
    // Scroll up after tab switch
    window.scrollTo(0, 0);
  },

  // ===================== RENDER POR TABS =====================

  /** Genera barra de acciones PDF+Excel centrada con marco */
  _sectionActionsHTML(seccion, label) {
    return `<div class="mb-12" style="display:flex; justify-content:center;">
      <div style="display:inline-flex; gap:6px; align-items:center; background:rgba(194,65,12,0.05); border:1px solid rgba(194,65,12,0.15); border-radius:14px; padding:8px 16px;">
        <button class="btn btn-primary btn-sm" onclick="InformesView._exportPDF()" style="padding:4px 10px; font-size:0.7rem; background:#b45309;">📄 Completo</button>
        <span style="width:1px; height:18px; background:rgba(194,65,12,0.2); display:inline-block;"></span>
        <button class="btn btn-primary btn-sm" onclick="InformesView._exportPDFSeccion('${seccion}')" style="padding:4px 10px; font-size:0.7rem; background:#c2410c;">📄 ${label}</button>
        <span style="width:1px; height:18px; background:rgba(16,185,129,0.2); display:inline-block;"></span>
        <button class="btn btn-primary btn-sm" onclick="InformesView._exportExcel()" style="background:linear-gradient(135deg,#065f46,#059669); border-color:#10b981; padding:4px 10px; font-size:0.7rem;">📊 Excel</button>
      </div>
    </div>`;
  },

  _renderGeneral(content, d) {
    const { rent, censo, kpisRepro, estadisticasSanidad, lecheStats, margenA } = d;
    const balanceTotal = rent?.balance || 0;
    const pctRent = rent?.ingresos > 0 ? ((balanceTotal / rent.ingresos) * 100).toFixed(1) : '0.0';
    const totalAnimales = censo.reduce((s, r) => s + r.total, 0);
    const alertas = estadisticasSanidad?.retencionesActivas > 0;

    content.innerHTML = this._sectionActionsHTML('general', 'General') + `
      <!-- KPIs compactos -->
      <div class="inf-report">
      <div class="grid grid-cols-3 gap-8 mb-15">
        <div class="summary-cell summary-cell-kpi"><div class="s-lbl">BALANCE</div><div class="s-val inf-val-lg" style="color:${balanceTotal >= 0 ? '#10b981' : '#ef4444'};">${balanceTotal.toLocaleString()}€</div></div>
        <div class="summary-cell summary-cell-kpi"><div class="s-lbl">RENTAB.</div><div class="s-val inf-val-lg" style="color:${parseFloat(pctRent) > 0 ? '#10b981' : '#ef4444'};">${pctRent}%</div></div>
        <div class="summary-cell summary-cell-kpi"><div class="s-lbl">CENSO</div><div class="s-val inf-val-lg" style="color:#3b82f6;">${totalAnimales}</div></div>
        <div class="summary-cell summary-cell-kpi"><div class="s-lbl">CARNE</div><div class="s-val inf-val-lg" style="color:#f59e0b;">${(rent?.detalles?.carne || 0).toLocaleString()}€</div></div>
        <div class="summary-cell summary-cell-kpi"><div class="s-lbl">LECHE</div><div class="s-val inf-val-lg" style="color:#fbbf24;">${(rent?.detalles?.leche || 0).toLocaleString()}€</div></div>
        <div class="summary-cell summary-cell-kpi"><div class="s-lbl">GASTOS</div><div class="s-val inf-val-lg" style="color:#ef4444;">${(rent?.gastos || 0).toLocaleString()}€</div></div>
      </div>

      ${alertas ? `<div class="card inf-alert-red">
          <div class="flex items-center gap-10">
            <span style="font-size:1.8rem;">🚨</span>
            <div><strong class="text-red text-md">${estadisticasSanidad.retencionesActivas} lotes</strong><span class="text-aaa text-sm" style="display:block;">con supresión de venta activa</span></div>
          </div>
        </div>` : ''}

      <!-- Rentabilidad -->
      <div class="card report-section border-top-3px border-top-3px-green report-card">
        <div class="inf-card-title pb-8">💰 Rentabilidad General</div>
        <div class="grid grid-cols-2 gap-10 mb-10">
          <div class="info-box border-left-red">
            <small class="s-lbl">CÁRNICA</small>
            <div class="inf-val-lg text-amber">${(rent?.detalles?.carne || 0).toLocaleString()}€</div>
          </div>
          <div class="info-box border-left-gold">
            <small class="s-lbl">LÁCTEA</small>
            <div class="inf-val-lg text-gold">${(rent?.detalles?.leche || 0).toLocaleString()}€</div>
          </div>
        </div>
        <div class="info-box border-left-green">
          <div class="flex justify-between">
            <div><small class="s-lbl">BALANCE NETO</small><div class="inf-val-lg" style="color:${balanceTotal >= 0 ? '#10b981' : '#ef4444'};">${balanceTotal.toLocaleString()}€</div></div>
            <div class="text-right"><small class="s-lbl">RENTABILIDAD</small><div class="inf-val-lg" style="color:${parseFloat(pctRent) > 0 ? '#10b981' : '#ef4444'};">${pctRent}%</div></div>
          </div>
        </div>
      </div>

      <!-- Margen Neto -->
      <div class="card report-section border-top-3px border-top-3px-green report-card">
        <div class="inf-card-title">📊 Margen Neto por Animal</div>
        ${margenA && margenA.length > 0
        ? '<div class="chart-wrap"><canvas id="chart-margen-animal" class="chart-canvas"></canvas></div>'
        : '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p class="empty-state-text">No hay datos de ventas para calcular márgenes individuales. Registra ventas de carne para ver esta gráfica.</p></div>'}
      </div>

      <!-- Repro y Sanidad compactos -->
      <div class="grid grid-cols-2 gap-12 mb-14">
        <div class="card border-top-3px border-top-3px-purple p-14">
          <div class="inf-card-title mb-8">🧬 Reproductivo</div>
          <div class="flex justify-between text-sm text-aaa">
            <div>Fertilidad: <strong class="text-violet">${kpisRepro.tasaFertilidadPct}%</strong></div>
            <div>IEP: <strong class="text-violet">${kpisRepro.intervaloEntrePartosDias}d</strong></div>
            <div>Prolif: <strong class="text-violet">${kpisRepro.indiceProlificidad}</strong></div>
          </div>
        </div>
        <div class="card border-top-3px border-top-3px-red p-14">
          <div class="inf-card-title mb-8">⚕️ Sanidad</div>
          <div class="flex justify-between text-sm text-aaa">
            <div>Tratamientos: <strong class="text-red">${estadisticasSanidad.totalTratamientos || 0}</strong></div>
            <div>Supresión: <strong class="text-red">${estadisticasSanidad.retencionesActivas || 0}</strong></div>
          </div>
        </div>
      </div>

      <!-- Leche mini -->
      <!-- Comparativa mensual PyG -->
      ${d.pygData?.porMes?.length > 0 ? (() => {
        const meses = d.pygData.porMes.filter(m => m.ingresos > 0 || m.gastos > 0);
        const actual = meses[meses.length - 1];
        const anterior = meses[meses.length - 2];
        if (!actual) return '';
        const diffBalance = actual.balance - (anterior?.balance || 0);
        const diffIngresos = actual.ingresos - (anterior?.ingresos || 0);
        return `<div class="card report-section border-top-3px border-top-3px-blue report-card">
          <div class="inf-card-title">📅 Comparativa Mensual</div>
          <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="info-box border-left-blue">
              <small class="s-lbl">MES ACTUAL</small>
              <div class="inf-val-md text-white">${actual.mes}</div>
              <div class="text-sm mt-4">Ingresos: <strong class="text-green">${actual.ingresos.toLocaleString()}€</strong></div>
              <div class="text-sm">Gastos: <strong class="text-red">${actual.gastos.toLocaleString()}€</strong></div>
              <div class="text-sm">Balance: <strong style="color:${actual.balance >= 0 ? '#10b981' : '#ef4444'}">${actual.balance.toLocaleString()}€</strong></div>
            </div>
            <div class="info-box border-left-amber">
              <small class="s-lbl">VS MES ANTERIOR</small>
              <div class="inf-val-md text-white">${anterior?.mes || '—'}</div>
              <div class="text-sm mt-4">Ingresos: <strong style="color:${diffIngresos >= 0 ? '#10b981' : '#ef4444'}">${diffIngresos >= 0 ? '+' : ''}${diffIngresos.toLocaleString()}€</strong></div>
              <div class="text-sm">Balance: <strong style="color:${diffBalance >= 0 ? '#10b981' : '#ef4444'}">${diffBalance >= 0 ? '+' : ''}${diffBalance.toLocaleString()}€</strong></div>
            </div>
          </div>
        </div>`;
      })() : ''}

      ${lecheStats.totalLitros > 0 ? `<div class="card report-section border-top-3px border-top-3px-amber report-card">
        <div class="inf-card-title">🥛 Producción Lechera</div>
        <div class="grid grid-cols-3 gap-8 mb-10">
          <div class="info-box-sm text-center"><div class="s-lbl">TOTAL</div><div class="inf-val-lg text-gold">${lecheStats.totalLitros.toFixed(1)}</div></div>
          <div class="info-box-sm text-center"><div class="s-lbl">PROM/DÍA</div><div class="inf-val-lg text-amber">${lecheStats.promedioDiario.toFixed(1)}</div></div>
          <div class="info-box-sm text-center"><div class="s-lbl">PRECIO</div><div class="inf-val-lg text-dark-gold">${lecheStats.precioMedio.toFixed(3)}€</div></div>
        </div>
        ${lecheStats.timeline?.length > 1 ? '<div class="chart-wrap"><canvas id="chart-leche-timeline" class="chart-canvas-sm"></canvas></div>' : ''}
      </div>` : ''}
      </div>`;

    // Renderizar gráficos del tab general
    this._renderGraficosGeneral(d);
  },

  _renderCarne(content, d) {
    const { rent, margenA, ventasHist, gastosCat, rentZ, ventasPorRebano, eventos } = d;
    const totalIngresos = rent?.detalles?.carne || 0;
    const totalVentas = ventasHist.length;
    const kgTotal = ventasHist.reduce((s, v) => s + (v.kg || 0), 0);
    const precioMedioKg = kgTotal > 0 ? (totalIngresos / kgTotal) : 0;
    // GMD media simple desde eventos de control
    const eventosCarne = (eventos || []).filter(e => e.motivo_tarea === 'control' && e.unidad === 'kg');
    const gmdMedia = eventosCarne.length > 1 ? (() => {
      const sorted = eventosCarne.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      const primero = sorted[0], ultimo = sorted[sorted.length - 1];
      const dias = Math.max(1, (new Date(ultimo.fecha) - new Date(primero.fecha)) / (1000 * 60 * 60 * 24));
      return ((ultimo.valor_neto - primero.valor_neto) / dias).toFixed(3);
    })() : null;

    content.innerHTML = this._sectionActionsHTML('carne', 'Cárnico') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-orange report-card">
        <div class="inf-card-title">🥩 Resumen Cárnico</div>
        <div class="grid grid-cols-2 gap-10 mb-12">
          <div class="info-box border-left-amber">
            <small class="s-lbl">INGRESOS TOTALES</small>
            <div class="inf-val-lg text-amber">${totalIngresos.toLocaleString()}€</div>
          </div>
          <div class="info-box border-left-blue">
            <small class="s-lbl">VENTAS REALIZADAS</small>
            <div class="inf-val-lg text-blue">${totalVentas}</div>
          </div>
          <div class="info-box border-left-green">
            <small class="s-lbl">KG TOTALES</small>
            <div class="inf-val-lg text-green">${kgTotal.toFixed(1)}</div>
          </div>
          <div class="info-box border-left-purple">
            <small class="s-lbl">PRECIO MEDIO KG</small>
            <div class="inf-val-lg text-violet">${precioMedioKg.toFixed(2)}€</div>
          </div>
          <div class="info-box" style="border-left:3px solid ${gmdMedia !== null && parseFloat(gmdMedia) > 0 ? '#10b981' : '#6b7280'};">
            <small class="s-lbl">GMD MEDIA GLOBAL</small>
            <div class="inf-val-lg" style="color:${gmdMedia !== null && parseFloat(gmdMedia) > 0 ? '#10b981' : '#6b7280'}">${gmdMedia !== null ? gmdMedia + ' kg' : '—'}</div>
            ${gmdMedia !== null ? '<small class="text-gray text-xs">Ganancia Media Diaria</small>' : '<small class="text-gray text-xs">Se necesitan 2+ pesajes</small>'}
          </div>
        </div>

        ${margenA && margenA.length > 0
        ? `<div class="chart-wrap mb-12"><canvas id="chart-margen-animal-carne" class="chart-canvas"></canvas></div>`
        : '<div class="empty-state mb-12"><div class="empty-state-icon">⚠️</div><p class="empty-state-text">No hay datos de márgenes individuales</p></div>'}

        ${rentZ && rentZ.length > 0
        ? `<div class="chart-wrap mb-12"><canvas id="chart-rentabilidad-zonas-carne" class="chart-canvas"></canvas></div>`
        : ''}

        ${ventasHist.length > 0 ? `
        <div class="inf-section-title">Últimas ventas</div>
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table" style="--tbl-accent:#f59e0b;">
            <thead><tr><th>Fecha</th><th>Animales</th><th>Kg</th><th>Total</th></tr></thead>
            <tbody>${ventasHist.slice(0, 10).map(v => `
              <tr><td>${v.fecha || '-'}</td><td>${v.animales || 1}</td><td>${v.kg || '-'}</td><td class="text-green">${(v.total || 0).toLocaleString()}€</td></tr>`).join('')}</tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">Sin ventas registradas</p></div>'}

        ${ventasPorRebano?.length > 0 ? `
        <div class="inf-section-title">Rentabilidad por rebaño</div>
        <div class="grid grid-cols-1 gap-6 mb-10">
          ${ventasPorRebano.map(r => `
            <div class="info-box-sm flex justify-between items-center">
              <span class="text-aaa text-sm">🐑 ${r.rebano}</span>
              <div class="text-right">
                <span class="text-amber font-800">${r.total.toLocaleString()}€</span>
                <span class="text-gray text-xs ml-6">${r.kg.toFixed(1)} kg</span>
                <span class="text-blue text-xs ml-6">${r.numVentas} ventas</span>
              </div>
            </div>`).join('')}
        </div>` : ''}
      </div>
    `;

    // Render gráficos si hay datos
    setTimeout(() => {
      try {
        if (margenA?.length > 0) this._renderScatter('chart-margen-animal-carne', margenA, '#f59e0b');
        if (rentZ?.length > 0) this._renderBarrasZonas('chart-rentabilidad-zonas-carne', rentZ);
      } catch (e) { console.error('[Carne charts]', e); }
    }, 50);
  },

  _renderLeche(content, d) {
    const { lecheStats, lechePorRebano, _cachedLeche } = d;
    const rawLeche = _cachedLeche || [];
    if (!lecheStats || lecheStats.totalLitros === 0) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🥛</div><p class="empty-state-text">No hay datos de producción lechera registrados.</p></div>`;
      return;
    }
    // Calcular métricas de calidad desde los datos crudos
    const conLab = rawLeche.filter(e => e.laboratorio?.grasa != null);
    const grasaMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.grasa || 0), 0) / conLab.length : 0;
    const protMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.proteina || 0), 0) / conLab.length : 0;
    const esMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.extracto_seco || (e.laboratorio.grasa + e.laboratorio.proteina) || 0), 0) / conLab.length : 0;
    const somaticasMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.somaticas || 0), 0) / conLab.length : 0;
    // MOFA
    const mofaTotal = rawLeche.reduce((s, e) => s + (e.mofa || 0), 0);
    const importeTotal = rawLeche.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
    const mofaRatio = importeTotal > 0 ? ((mofaTotal / importeTotal) * 100).toFixed(1) : 0;
    // Umbrales de calidad
    const umbrales = window.ComunidadesService?.CALIDAD_LECHE_OVINO_UMBRALES || null;
    const semaforo = (valor, min, max) => {
      if (valor == null) return '#555';
      if (min != null && valor < min) return '#ef4444';
      if (max != null && valor > max) return '#ef4444';
      return '#10b981';
    };

    content.innerHTML = this._sectionActionsHTML('leche', 'Lácteo') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-amber report-card">
        <div class="inf-card-title">🥛 Producción Láctea</div>
        <div class="grid grid-cols-3 gap-10 mb-12">
          <div class="info-box border-left-gold">
            <small class="s-lbl">TOTAL LITROS</small>
            <div class="inf-val-lg text-gold">${lecheStats.totalLitros.toFixed(1)}</div>
          </div>
          <div class="info-box border-left-amber">
            <small class="s-lbl">PROMEDIO/DÍA</small>
            <div class="inf-val-lg text-amber">${lecheStats.promedioDiario.toFixed(1)} L</div>
          </div>
          <div class="info-box border-left-dark-gold">
            <small class="s-lbl">PRECIO MEDIO</small>
            <div class="inf-val-lg text-dark-gold">${lecheStats.precioMedio.toFixed(3)}€</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-10 mb-12">
          <div class="info-box border-left-green">
            <small class="s-lbl">REGISTROS</small>
            <div class="inf-val-md text-white">${lecheStats.totalRegistros}</div>
          </div>
          <div class="info-box" style="border-left:3px solid ${mofaTotal >= 0 ? '#10b981' : '#ef4444'};">
            <small class="s-lbl">MOFA TOTAL</small>
            <div class="inf-val-md" style="color:${mofaTotal >= 0 ? '#10b981' : '#ef4444'}">${(mofaTotal >= 0 ? '+' : '')}${Math.round(mofaTotal).toLocaleString()}€</div>
            <small class="text-gray text-xs">Ratio: ${mofaRatio}% sobre ingresos</small>
          </div>
        </div>

        ${conLab.length > 0 ? `
        <div class="card" style="background:rgba(251,191,36,0.05);margin-bottom:14px;padding:12px;">
          <div class="inf-section-title mb-8">🔬 Calidad de la Leche (${conLab.length} analíticas)</div>
          <div class="grid grid-cols-2 gap-6">
            <div class="info-box-sm" style="border-left:3px solid ${semaforo(grasaMedia, umbrales?.grasa?.min, null)};">
              <small class="s-lbl">GRASA</small>
              <div class="inf-val-md" style="color:${semaforo(grasaMedia, umbrales?.grasa?.min, null)}">${grasaMedia.toFixed(2)}%</div>
              ${umbrales ? `<small class="text-gray text-xs">Obj: ≥${umbrales.grasa.min}%</small>` : ''}
            </div>
            <div class="info-box-sm" style="border-left:3px solid ${semaforo(protMedia, umbrales?.proteina?.min, null)};">
              <small class="s-lbl">PROTEÍNA</small>
              <div class="inf-val-md" style="color:${semaforo(protMedia, umbrales?.proteina?.min, null)}">${protMedia.toFixed(2)}%</div>
              ${umbrales ? `<small class="text-gray text-xs">Obj: ≥${umbrales.proteina.min}%</small>` : ''}
            </div>
            <div class="info-box-sm" style="border-left:3px solid ${semaforo(esMedia, umbrales?.extracto_seco?.min, null)};">
              <small class="s-lbl">EXTRACTO SECO</small>
              <div class="inf-val-md" style="color:${semaforo(esMedia, umbrales?.extracto_seco?.min, null)}">${esMedia.toFixed(2)}%</div>
              ${umbrales ? `<small class="text-gray text-xs">Obj: ≥${umbrales.extracto_seco.min}%</small>` : ''}
            </div>
            <div class="info-box-sm" style="border-left:3px solid ${semaforo(somaticasMedia, null, umbrales?.somaticas?.max)};">
              <small class="s-lbl">CÉL. SOMÁTICAS</small>
              <div class="inf-val-md" style="color:${semaforo(somaticasMedia, null, umbrales?.somaticas?.max)}">${Math.round(somaticasMedia).toLocaleString()}/mL</div>
              ${umbrales ? `<small class="text-gray text-xs">Obj: ≤${(umbrales.somaticas.max / 1000).toFixed(0)}k</small>` : ''}
            </div>
          </div>
        </div>` : ''}

        ${lechePorRebano?.length > 0 ? `
        <div class="inf-section-title">Producción por rebaño</div>
        <div class="grid grid-cols-1 gap-6 mb-10">
          ${lechePorRebano.map(r => `
            <div class="info-box-sm flex justify-between items-center">
              <span class="text-aaa text-sm">🥛 ${r.rebano}</span>
              <div class="text-right">
                <span class="text-gold font-800">${r.litros.toFixed(1)} L</span>
                <span class="text-gray text-xs ml-6">${r.importe.toLocaleString()}€</span>
                <span class="text-blue text-xs ml-6">${r.numRegistros} registros</span>
              </div>
            </div>`).join('')}
        </div>` : ''}

        ${lecheStats.timeline?.length > 1
        ? '<div class="chart-wrap"><canvas id="chart-leche-timeline" class="chart-canvas"></canvas></div>'
        : '<div class="inf-small p-16 text-center text-555">Se necesitan al menos 2 registros para mostrar la evolución.</div>'}
      </div>
    `;
    setTimeout(() => {
      if (lecheStats.timeline?.length > 1) this._renderLecheTimeline('chart-leche-timeline', lecheStats.timeline);
    }, 50);
  },

  _renderReproductivo(content, d) {
    const { kpisRepro, eventos } = d;
    // Calcular distribución estacional de partos desde eventos
    const partos = (eventos || []).filter(e => e.motivo_tarea === 'parto' || e.motivo_tarea === 'nacimiento');
    const porTrimestre = { 'Q1 (Ene-Mar)': 0, 'Q2 (Abr-Jun)': 0, 'Q3 (Jul-Sep)': 0, 'Q4 (Oct-Dic)': 0 };
    partos.forEach(e => {
      const m = new Date(e.fecha).getMonth();
      if (m < 3) porTrimestre['Q1 (Ene-Mar)']++;
      else if (m < 6) porTrimestre['Q2 (Abr-Jun)']++;
      else if (m < 9) porTrimestre['Q3 (Jul-Sep)']++;
      else porTrimestre['Q4 (Oct-Dic)']++;
    });
    const abortos = (eventos || []).filter(e => e.motivo_tarea === 'aborto').length;
    const totalEventos = partos.length + abortos;
    const tasaAbortos = totalEventos > 0 ? ((abortos / totalEventos) * 100).toFixed(1) : 0;

    content.innerHTML = this._sectionActionsHTML('reproductivo', 'Reproductivo') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-purple report-card">
        <div class="inf-card-title">🧬 KPIs Reproductivos</div>
        <div class="grid grid-cols-2 gap-10 mb-12">
          <div class="info-box border-left-violet">
            <small class="s-lbl">FERTILIDAD</small>
            <div class="inf-val-lg text-purple">${kpisRepro.tasaFertilidadPct}%</div>
          </div>
          <div class="info-box border-left-violet">
            <small class="s-lbl">IEP</small>
            <div class="inf-val-lg text-purple">${kpisRepro.intervaloEntrePartosDias}d</div>
          </div>
          <div class="info-box border-left-violet">
            <small class="s-lbl">PROLIFICIDAD</small>
            <div class="inf-val-lg text-purple">${kpisRepro.indiceProlificidad}</div>
          </div>
          <div class="info-box border-left-violet">
            <small class="s-lbl">PARTOS</small>
            <div class="inf-val-lg text-purple">${kpisRepro.totalPartosAnalizados}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-10 mb-12">
          <div class="info-box" style="border-left:3px solid ${parseFloat(tasaAbortos) > 10 ? '#ef4444' : '#10b981'};">
            <small class="s-lbl">RATIO DE ABORTOS</small>
            <div class="inf-val-lg" style="color:${parseFloat(tasaAbortos) > 10 ? '#ef4444' : '#10b981'}">${tasaAbortos}%</div>
            <small class="text-gray text-xs">${abortos} abortos de ${totalEventos} gestaciones</small>
          </div>
          <div class="info-box border-left-blue">
            <small class="s-lbl">DISTRIBUCIÓN DE PARTOS</small>
            <div class="inf-val-md text-white">${partos.length} partos</div>
          </div>
        </div>
        ${partos.length > 0 ? `
        <div class="grid grid-cols-2 gap-6 mb-12">
          ${Object.entries(porTrimestre).filter(([_, v]) => v > 0).map(([trim, count]) => `
            <div class="info-box-sm flex justify-between items-center">
              <span class="text-aaa text-sm">${trim}</span>
              <span class="font-bold text-white">${count} <span class="text-gray text-xs">(${((count / partos.length) * 100).toFixed(0)}%)</span></span>
            </div>`).join('')}
        </div>` : ''}
        <div class="mt-12"><canvas id="chart-repro-kpis" class="chart-canvas"></canvas></div>
      </div>
    `;
    setTimeout(() => {
      const ctxR = document.getElementById("chart-repro-kpis");
      if (ctxR && kpisRepro.tasaFertilidadPct !== undefined) {
        new Chart(ctxR.getContext("2d"), {
          type: 'doughnut',
          data: { labels: ['Éxito', 'Fallo'], datasets: [{ data: [kpisRepro.tasaFertilidadPct, 100 - kpisRepro.tasaFertilidadPct], backgroundColor: ['#8b5cf6', '#3730a3'], borderColor: '#111', borderWidth: 4 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
      }
    }, 50);
  },

  _renderSanidad(content, d) {
    const { estadisticasSanidad, gastosCat, rebanos, animales, eventos, sanitariosRaw } = d;
    // Calcular coste sanitario por animal
    const gastosSanitarios = (gastosCat || []).filter(g => (g.categoria || '').toLowerCase() === 'sanidad');
    const totalGastoSanidad = gastosSanitarios.reduce((s, g) => s + g.total, 0);
    const totalAnimalesActivos = (animales || []).filter(a => a.estado === 'activo').length;
    const costeSanitarioAnimal = totalAnimalesActivos > 0 ? (totalGastoSanidad / totalAnimalesActivos) : 0;
    // Tratamientos por rebaño
    const sanitariosTotal = sanitariosRaw || [];
    const tratPorRebano = {};
    const mapaReb = {};
    (rebanos || []).forEach(r => { mapaReb[r.id] = r; });
    sanitariosTotal.forEach(s => {
      const nom = mapaReb[s.rebanoId]?.nombre || 'Sin rebaño';
      tratPorRebano[nom] = (tratPorRebano[nom] || 0) + 1;
    });

    content.innerHTML = this._sectionActionsHTML('sanidad', 'Sanidad') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-red report-card">
        <div class="inf-card-title">⚕️ Sanidad y Tratamientos</div>
        <div class="grid grid-cols-3 gap-10 mb-12">
          <div class="info-box border-left-red">
            <small class="s-lbl">TRATAMIENTOS</small>
            <div class="inf-val-lg text-red">${estadisticasSanidad.totalTratamientos || 0}</div>
          </div>
          <div class="info-box border-left-red">
            <small class="s-lbl">SUPRESIÓN ACTIVA</small>
            <div class="inf-val-lg text-red">${estadisticasSanidad.retencionesActivas || 0}</div>
          </div>
          <div class="info-box border-left-${costeSanitarioAnimal > 0 ? 'amber' : 'gray'}">
            <small class="s-lbl">COSTE SANITARIO/ANIMAL</small>
            <div class="inf-val-lg text-amber">${costeSanitarioAnimal > 0 ? costeSanitarioAnimal.toFixed(2) + '€' : '—'}</div>
          </div>
        </div>
        ${Object.keys(tratPorRebano).length > 0 ? `
        <div class="mb-12">
          <div class="inf-section-title">Tratamientos por rebaño</div>
          <div class="grid grid-cols-2 gap-6">
            ${Object.entries(tratPorRebano).sort((a, b) => b[1] - a[1]).map(([nom, cnt]) => `
              <div class="info-box-sm flex justify-between items-center">
                <span class="text-aaa text-sm">${nom}</span>
                <span class="font-bold text-red">${cnt}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}
        ${estadisticasSanidad.porCategoria?.length > 0
        ? '<div class="chart-wrap"><canvas id="chart-sanidad-kpis" class="chart-canvas"></canvas></div>'
        : '<div class="empty-state"><div class="empty-state-icon">💊</div><p class="empty-state-text">Sin tratamientos registrados.</p></div>'}
      </div>
      ${gastosCat.length > 0 ? `
      <div class="inf-report card report-section border-top-3px border-top-3px-red report-card">
        <div class="inf-card-title">💸 Gastos por Categoría</div>
        <div class="grid grid-cols-2 gap-10 mb-10">
          ${gastosCat.slice(0, 6).map(g => `
            <div class="info-box-sm">
              <div class="s-lbl">${g.categoria}</div>
              <div class="inf-val-md text-red">${g.total.toLocaleString()}€</div>
            </div>`).join('')}
        </div>
      </div>` : ''}
    `;
    setTimeout(() => {
      const ctxS = document.getElementById("chart-sanidad-kpis");
      if (ctxS && estadisticasSanidad.porCategoria?.length > 0) {
        new Chart(ctxS.getContext("2d"), {
          type: 'pie',
          data: {
            labels: estadisticasSanidad.porCategoria.map(c => c.categoria),
            datasets: [{ data: estadisticasSanidad.porCategoria.map(c => c.cantidad), backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'], borderColor: '#111', borderWidth: 2 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
      }
    }, 50);
  },

  _renderCenso(content, d) {
    const { censo, rebanos, animales } = d;
    const totalAnimales = censo.reduce((s, r) => s + r.total, 0);
    const totalActivos = censo.reduce((s, r) => s + r.activos, 0);
    const totalVendidos = censo.reduce((s, r) => s + r.vendidos, 0);

    // Agrupar por especie
    const porEspecie = {};
    censo.forEach(r => {
      const esp = r.tipo || 'Sin tipo';
      porEspecie[esp] = (porEspecie[esp] || 0) + r.total;
    });

    content.innerHTML = this._sectionActionsHTML('censo', 'Censo') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-gold report-card">
        <div class="inf-card-title">🐑 Censo General</div>
        <div class="grid grid-cols-3 gap-10 mb-12">
          <div class="info-box-center border-left-blue">
            <small class="s-lbl">TOTAL</small>
            <div class="inf-val-lg text-blue">${totalAnimales}</div>
          </div>
          <div class="info-box-center border-left-green">
            <small class="s-lbl">ACTIVOS</small>
            <div class="inf-val-lg text-green">${totalActivos}</div>
          </div>
          <div class="info-box-center border-left-red">
            <small class="s-lbl">VENDIDOS</small>
            <div class="inf-val-lg text-red">${totalVendidos}</div>
          </div>
        </div>

        ${Object.keys(porEspecie).length > 0 ? `
        <div class="inf-section-title">Por especie/tipo</div>
        <div class="grid grid-cols-2 gap-8 mb-12">
          ${Object.entries(porEspecie).map(([esp, count]) => `
            <div class="info-box-sm flex justify-between">
              <span class="inf-small text-aaa">${esp}</span>
              <span class="inf-val-md text-white">${count}</span>
            </div>`).join('')}
        </div>` : ''}

        ${animales?.length > 0 ? (() => {
          const porCategoria = {};
          animales.forEach(a => { const cat = a.categoria || 'Sin categoría'; porCategoria[cat] = (porCategoria[cat] || 0) + 1; });
          const totalCats = Object.keys(porCategoria).length;
          return totalCats > 0 ? `
        <div class="inf-section-title">Por categoría productiva</div>
        <div class="grid grid-cols-2 gap-6 mb-12">
          ${Object.entries(porCategoria).map(([cat, cnt]) => `
            <div class="info-box-sm flex justify-between items-center">
              <span class="inf-small text-aaa">${cat}</span>
              <div class="text-right"><span class="font-bold text-white">${cnt}</span><span class="text-gray text-xs ml-4">(${((cnt / animales.length) * 100).toFixed(1)}%)</span></div>
            </div>`).join('')}
        </div>` : '';
        })() : ''}

        <div class="inf-section-title">Detalle por rebaño</div>
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table" style="--tbl-accent:#10b981;">
            <thead><tr><th>Rebaño</th><th>Tipo</th><th>Total</th><th>Activos</th><th class="text-red">Vendidos</th></tr></thead>
            <tbody>${censo.map(r => `
              <tr><td><strong>${r.nombre}</strong></td><td class="text-gray">${r.tipo}</td><td class="font-800">${r.total}</td><td class="text-green">${r.activos}</td><td class="text-red">${r.vendidos}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ===================== LIBRO DE VENTAS =====================

  _renderVentas(content, d) {
    const { ventasCompleto, docsLegales, finca } = d;
    const ventas = (ventasCompleto || []).sort((a, b) => new Date(b.fechaSacrificio || b.fecha_emision || 0) - new Date(a.fechaSacrificio || a.fecha_emision || 0));

    const totalKg = ventas.reduce((s, v) => s + (v.pesoCanal || v.pesoVivo || 0), 0);
    const totalImporte = ventas.reduce((s, v) => s + (v.precio_total || 0), 0);
    const totalIVA = ventas.reduce((s, v) => s + (v.importe_iva || 0), 0);
    const totalRetencion = ventas.reduce((s, v) => s + (v.importe_retencion || 0), 0);

    content.innerHTML = this._sectionActionsHTML('ventas', 'Ventas') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-blue report-card">
        <div class="inf-card-title">📒 Libro de Ventas</div>
        <div class="grid grid-cols-3 gap-10 mb-14">
          <div class="info-box border-left-blue">
            <small class="s-lbl">TOTAL VENTAS</small>
            <div class="inf-val-lg text-blue">${ventas.length}</div>
          </div>
          <div class="info-box border-left-green">
            <small class="s-lbl">PESO TOTAL (kg)</small>
            <div class="inf-val-lg text-green">${totalKg.toFixed(1)}</div>
          </div>
          <div class="info-box border-left-amber">
            <small class="s-lbl">IMPORTE TOTAL</small>
            <div class="inf-val-lg text-amber">${totalImporte.toLocaleString()}€</div>
          </div>
        </div>

        ${ventas.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">No hay ventas registradas</p></div>' : `
        <div class="table-scroll scroll-shadow-container mt-10">
          <table class="inf-table" style="--tbl-accent:#3b82f6;">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>ALBARÁN</th>
                <th>COMPRADOR</th>
                <th>NIF</th>
                <th class="text-right">KG</th>
                <th class="text-right">BASE</th>
                <th class="text-right">IVA</th>
                <th class="text-right">TOTAL</th>
                <th class="text-center">DIMOE</th>
              </tr>
            </thead>
            <tbody>
              ${ventas.map(v => {
                const tieneDimoe = (docsLegales || []).some(d => d.tipo === 'dimoe' && Number(d.ventaId) === Number(v.id));
                return `<tr>
                  <td class="nowrap">${v.fechaSacrificio || v.fecha_emision || '-'}</td>
                  <td>${v.numero_albaran || '-'}</td>
                  <td>${v.razonSocial || v.nombreComprador || '-'}</td>
                  <td>${v.nifComprador || v.nif || '-'}</td>
                  <td class="text-right">${(v.pesoCanal || v.pesoVivo || 0).toFixed(1)}</td>
                  <td class="text-right">${((v.precio_total || 0) - (v.importe_iva || 0)).toFixed(2)}€</td>
                  <td class="text-right">${(v.importe_iva || 0).toFixed(2)}€</td>
                  <td class="text-right font-bold text-amber">${(v.precio_total || 0).toFixed(2)}€</td>
                  <td class="text-center">${tieneDimoe ? '✅' : '❌'}</td>
                </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right text-gray">TOTALES</td>
                <td class="text-right">${totalKg.toFixed(1)}</td>
                <td class="text-right">${(totalImporte - totalIVA).toFixed(2)}€</td>
                <td class="text-right">${totalIVA.toFixed(2)}€</td>
                <td class="text-right text-amber">${totalImporte.toFixed(2)}€</td>
                <td class="text-center">—</td>
              </tr>
            </tfoot>
          </table>
        </div>`}

        ${ventas.length > 1 ? (() => {
          const porComp = {};
          ventas.forEach(v => {
            const nom = v.razonSocial || v.nombreComprador || 'Sin comprador';
            if (!porComp[nom]) porComp[nom] = { kg: 0, total: 0, num: 0 };
            porComp[nom].kg += v.pesoCanal || v.pesoVivo || 0;
            porComp[nom].total += v.precio_total || 0;
            porComp[nom].num++;
          });
          const comps = Object.entries(porComp).map(([nom, d]) => ({
            nombre: nom, kg: d.kg, total: d.total, num: d.num,
            precioMedio: d.kg > 0 ? (d.total / d.kg) : 0
          })).sort((a, b) => b.total - a.total);
          if (comps.length < 2) return '';
          return `
        <div class="card report-section border-top-3px border-top-3px-green report-card mt-14">
          <div class="inf-card-title">📊 Precio Medio por Comprador</div>
          <div class="table-scroll scroll-shadow-container">
            <table class="inf-table inf-table-sm" style="--tbl-accent:#10b981;">
              <thead><tr><th>Comprador</th><th class="text-center">Ventas</th><th class="text-right">Kg</th><th class="text-right">Total</th><th class="text-right">€/Kg</th></tr></thead>
              <tbody>${comps.map(c => `
                <tr>
                  <td><strong>${c.nombre}</strong></td>
                  <td class="text-center">${c.num}</td>
                  <td class="text-right">${c.kg.toFixed(1)}</td>
                  <td class="text-right font-bold text-amber">${c.total.toLocaleString()}€</td>
                  <td class="text-right font-bold text-green">${c.precioMedio.toFixed(2)}€</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
        })() : ''}
      </div>
    `;
  },

  // ===================== INFORME COMPRADORES =====================

  _renderCompradores(content, d) {
    const { compradoresData } = d;
    const data = compradoresData || [];
    const totalIngresos = data.reduce((s, c) => s + c.total, 0);
    const totalKg = data.reduce((s, c) => s + c.kg, 0);
    const totalVentas = data.reduce((s, c) => s + c.numVentas, 0);
    const topComprador = data.length > 0 ? data[0] : null;

    content.innerHTML = this._sectionActionsHTML('compradores', 'Compradores') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-blue report-card">
        <div class="inf-card-title">🏢 Informe por Comprador</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-blue">
            <small class="s-lbl">COMPRADORES</small>
            <div class="inf-val-lg text-blue">${data.length}</div>
          </div>
          <div class="info-box-center border-left-green">
            <small class="s-lbl">INGRESOS TOTALES</small>
            <div class="inf-val-lg text-green">${totalIngresos.toLocaleString()}€</div>
          </div>
          <div class="info-box-center border-left-amber">
            <small class="s-lbl">VENTAS</small>
            <div class="inf-val-lg text-amber">${totalVentas}</div>
          </div>
          <div class="info-box-center border-left-purple">
            <small class="s-lbl">KG TOTALES</small>
            <div class="inf-val-lg text-purple">${totalKg.toFixed(1)}</div>
          </div>
        </div>
        ${topComprador ? `
        <div class="card" style="background:rgba(59,130,246,0.08);margin-bottom:14px;">
          <div class="flex justify-between items-center px-14 py-10">
            <div><span class="text-gray text-xs">COMPRADOR PRINCIPAL</span><div class="text-white font-800 text-md mt-4">${topComprador.nombre}</div></div>
            <div class="text-right"><span class="text-gray text-xs">TOTAL</span><div class="text-amber font-900 text-md">${topComprador.total.toLocaleString()}€</div></div>
          </div>
        </div>` : ''}

        ${data.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🏢</div><p class="empty-state-text">No hay ventas registradas con compradores.</p></div>' : `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table" style="--tbl-accent:#3b82f6;">
            <thead><tr>
              <th>Comprador</th>
              <th>NIF</th>
              <th>Tipo</th>
              <th class="text-right">Ventas</th>
              <th class="text-right">Kg</th>
              <th class="text-right">Total €</th>
              <th>Última</th>
            </tr></thead>
            <tbody>${data.map(c => `
              <tr>
                <td><strong>${c.nombre}</strong></td>
                <td class="text-gray text-xs">${c.nif || '-'}</td>
                <td><span class="badge badge-sm ${c.tipo === 'cárnico' ? 'badge-amber' : c.tipo === 'lácteo' ? 'badge-gold' : 'badge-blue'}">${c.tipo || 'mixto'}</span></td>
                <td class="text-right">${c.numVentas}</td>
                <td class="text-right">${c.kg.toFixed(1)}</td>
                <td class="text-right font-bold text-amber">${c.total.toLocaleString()}€</td>
                <td class="text-gray text-xs">${c.ultimaVenta || '-'}</td>
              </tr>`).join('')}</tbody>
            <tfoot><tr>
              <td colspan="3" class="text-right text-gray">TOTALES</td>
              <td class="text-right font-bold">${totalVentas}</td>
              <td class="text-right font-bold">${totalKg.toFixed(1)}</td>
              <td class="text-right font-bold text-amber">${totalIngresos.toLocaleString()}€</td>
              <td></td>
            </tr></tfoot>
          </table>
        </div>`}
      </div>
    `;
    // Gráfico si hay datos
    setTimeout(() => {
      if (data.length > 1) {
        const ctx = document.getElementById('chart-compradores');
        // Insertar canvas después del primer render
        const card = content.querySelector('.inf-report');
        if (card && !document.getElementById('chart-compradores')) {
          const canvasWrap = document.createElement('div');
          canvasWrap.className = 'chart-wrap mt-14';
          canvasWrap.innerHTML = '<canvas id="chart-compradores" class="chart-canvas"></canvas>';
          card.appendChild(canvasWrap);
          const c = document.getElementById('chart-compradores');
          if (c) {
            new Chart(c.getContext("2d"), {
              type: 'bar',
              data: {
                labels: data.slice(0, 8).map(c => c.nombre.length > 15 ? c.nombre.substring(0,15)+'…' : c.nombre),
                datasets: [{
                  label: 'Ingresos (€)',
                  data: data.slice(0, 8).map(c => c.total),
                  backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#ec4899','#14b8a6','#f97316'],
                  borderRadius: 4
                }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
          }
        }
      }
    }, 100);
  },

  // ===================== INFORME PROVEEDORES =====================

  _renderProveedores(content, d) {
    const { proveedoresData } = d;
    const data = proveedoresData || [];
    const totalGasto = data.reduce((s, p) => s + p.total, 0);
    const totalFacturas = data.reduce((s, p) => s + p.numFacturas, 0);
    const topProv = data.length > 0 ? data[0] : null;

    content.innerHTML = this._sectionActionsHTML('proveedores', 'Proveedores') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-amber report-card">
        <div class="inf-card-title">📦 Informe por Proveedor</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-amber">
            <small class="s-lbl">PROVEEDORES</small>
            <div class="inf-val-lg text-amber">${data.length}</div>
          </div>
          <div class="info-box-center border-left-red">
            <small class="s-lbl">GASTO TOTAL</small>
            <div class="inf-val-lg text-red">${totalGasto.toLocaleString()}€</div>
          </div>
          <div class="info-box-center border-left-blue">
            <small class="s-lbl">FACTURAS</small>
            <div class="inf-val-lg text-blue">${totalFacturas}</div>
          </div>
          <div class="info-box-center border-left-green">
            <small class="s-lbl">MEDIA/PROV</small>
            <div class="inf-val-lg text-green">${data.length > 0 ? (totalGasto / data.length).toLocaleString() : 0}€</div>
          </div>
        </div>
        ${topProv ? `
        <div class="card" style="background:rgba(245,158,11,0.08);margin-bottom:14px;">
          <div class="flex justify-between items-center px-14 py-10">
            <div><span class="text-gray text-xs">PRINCIPAL PROVEEDOR</span><div class="text-white font-800 text-md mt-4">${topProv.nombre}</div></div>
            <div class="text-right"><span class="text-gray text-xs">TOTAL</span><div class="text-red font-900 text-md">${topProv.total.toLocaleString()}€</div></div>
          </div>
        </div>` : ''}

        ${data.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📦</div><p class="empty-state-text">No hay gastos registrados con proveedores.</p></div>' : `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table" style="--tbl-accent:#f59e0b;">
            <thead><tr>
              <th>Proveedor</th>
              <th>NIF</th>
              <th class="text-right">Facturas</th>
              <th class="text-right">Total €</th>
              <th>Categorías</th>
              <th>Última</th>
            </tr></thead>
            <tbody>${data.map(p => {
              const cats = Object.entries(p.categorias).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return `<tr>
                <td><strong>${p.nombre}</strong></td>
                <td class="text-gray text-xs">${p.nif || '-'}</td>
                <td class="text-right">${p.numFacturas}</td>
                <td class="text-right font-bold text-red">${p.total.toLocaleString()}€</td>
                <td class="text-xs">${cats.map(([c, t]) => `${c}: ${t.toLocaleString()}€`).join(', ')}</td>
                <td class="text-gray text-xs">${p.ultimaCompra || '-'}</td>
              </tr>`;
            }).join('')}</tbody>
            <tfoot><tr>
              <td colspan="2" class="text-right text-gray">TOTALES</td>
              <td class="text-right font-bold">${totalFacturas}</td>
              <td class="text-right font-bold text-red">${totalGasto.toLocaleString()}€</td>
              <td colspan="2"></td>
            </tr></tfoot>
          </table>
        </div>`}
      </div>
    `;
    // Gráfico
    setTimeout(() => {
      if (data.length > 1) {
        const card = content.querySelector('.inf-report');
        if (card && !document.getElementById('chart-proveedores')) {
          const canvasWrap = document.createElement('div');
          canvasWrap.className = 'chart-wrap mt-14';
          canvasWrap.innerHTML = '<canvas id="chart-proveedores" class="chart-canvas"></canvas>';
          card.appendChild(canvasWrap);
          const ctx = document.getElementById('chart-proveedores');
          if (ctx) {
            // Doughnut: categorías agregadas
            const cats = {};
            data.forEach(p => { Object.entries(p.categorias).forEach(([c, t]) => { cats[c] = (cats[c] || 0) + t; }); });
            const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
            new Chart(ctx.getContext("2d"), {
              type: 'doughnut',
              data: {
                labels: entries.map(e => e[0]),
                datasets: [{ data: entries.map(e => e[1]), backgroundColor: ['#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#ec4899'], borderColor: '#111', borderWidth: 3 }]
              },
              options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#888', boxWidth: 12, font: { size: 9 } } } } }
            });
          }
        }
      }
    }, 100);
  },

  // ===================== INFORME FITOSANITARIO =====================

  _renderFitosanitario(content, d) {
    const { fitosanitarioData } = d;
    const data = fitosanitarioData || { registros: [], total: 0, numRegistros: 0, numZonas: 0, zonas: [], mediaPorOperacion: 0 };

    content.innerHTML = this._sectionActionsHTML('fitosanitario', 'Fitosanitario') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-green report-card">
        <div class="inf-card-title">🧪 Informe Fitosanitario</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-green">
            <small class="s-lbl">GASTO TOTAL</small>
            <div class="inf-val-lg text-green">${data.total.toLocaleString()}€</div>
          </div>
          <div class="info-box-center border-left-blue">
            <small class="s-lbl">OPERACIONES</small>
            <div class="inf-val-lg text-blue">${data.numRegistros}</div>
          </div>
          <div class="info-box-center border-left-amber">
            <small class="s-lbl">ZONAS</small>
            <div class="inf-val-lg text-amber">${data.numZonas}</div>
          </div>
          <div class="info-box-center border-left-purple">
            <small class="s-lbl">MEDIA/OP</small>
            <div class="inf-val-lg text-purple">${data.mediaPorOperacion.toFixed(2)}€</div>
          </div>
        </div>

        ${data.zonas.length > 0 ? `
        <div class="flex flex-wrap gap-6 mb-14">
          ${data.zonas.map(z => `<span class="badge badge-green" style="font-size:0.7rem;">🌱 ${z}</span>`).join('')}
        </div>` : ''}

        ${data.registros.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🧪</div><p class="empty-state-text">No hay gastos fitosanitarios registrados.</p></div>' : `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table" style="--tbl-accent:#10b981;">
            <thead><tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Producto</th>
              <th>Zona</th>
              <th class="text-right">Monto</th>
            </tr></thead>
            <tbody>${data.registros.map(r => `
              <tr>
                <td class="nowrap">${r.fecha || '-'}</td>
                <td>${r.proveedor || r.proveedorNombre || '-'}</td>
                <td>${r.descripcion || r.producto || '-'}</td>
                <td>${r.snap_zona || '-'}</td>
                <td class="text-right font-bold text-red">${(r.monto || 0).toLocaleString()}€</td>
              </tr>`).join('')}</tbody>
            <tfoot><tr>
              <td colspan="4" class="text-right text-gray">TOTAL</td>
              <td class="text-right font-bold text-red">${data.total.toLocaleString()}€</td>
            </tr></tfoot>
          </table>
        </div>`}
      </div>
    `;
  },

  // ===================== INFORME ALERTAS =====================

  _renderAlertas(content, d) {
    const { alertasData } = d;
    const alertas = alertasData || { sanitarias: [], trazabilidad: [], administrativas: [], calendario: { titulo: '', sugerencias: [] } };
    const totalAlertas = (alertas.sanitarias?.length || 0) + (alertas.trazabilidad?.length || 0) + (alertas.administrativas?.length || 0);
    const rojas = (alertas.sanitarias?.filter(a => a.urgencia === 'rojo').length || 0) +
                  (alertas.trazabilidad?.filter(a => a.urgencia === 'rojo').length || 0) +
                  (alertas.administrativas?.filter(a => a.urgencia === 'rojo').length || 0);

    content.innerHTML = this._sectionActionsHTML('alertas', 'Alertas') + `
      <div class="inf-report mb-14">
        <div class="card report-section border-top-3px border-top-3px-red report-card">
          <div class="inf-card-title">🚨 Panel de Alertas</div>
          <div class="grid grid-cols-3 gap-10 mb-14">
            <div class="info-box-center border-left-red">
              <small class="s-lbl">TOTAL ALERTAS</small>
              <div class="inf-val-lg text-red">${totalAlertas}</div>
            </div>
            <div class="info-box-center border-left-red">
              <small class="s-lbl">🔴 CRÍTICAS</small>
              <div class="inf-val-lg" style="color:#dc2626;">${rojas}</div>
            </div>
            <div class="info-box-center border-left-amber">
              <small class="s-lbl">🟡 ADVERTENCIAS</small>
              <div class="inf-val-lg text-amber">${totalAlertas - rojas}</div>
            </div>
          </div>

          ${alertas.sanitarias?.length > 0 ? `
          <div class="inf-section-title" style="color:#ef4444;">🔴 Alertas Sanitarias (${alertas.sanitarias.length})</div>
          <div class="table-scroll scroll-shadow-container mb-14">
            <table class="inf-table inf-table-sm" style="--tbl-accent:#ef4444;">
              <thead><tr><th>Medicamento</th><th>Rebaño</th><th>Fecha</th><th class="text-right">Días rest.</th><th class="text-center">Urgencia</th></tr></thead>
              <tbody>${alertas.sanitarias.map(a => `
                <tr>
                  <td>${a.medicamento || '-'}</td>
                  <td>${a.rebanoNombre || '-'}</td>
                  <td>${a.fecha || '-'}</td>
                  <td class="text-right font-bold ${a.diasRestantes <= 7 ? 'text-red' : a.diasRestantes <= 15 ? 'text-amber' : 'text-green'}">${a.diasRestantes}</td>
                  <td class="text-center">${a.urgencia === 'rojo' ? '🔴' : a.urgencia === 'amarillo' ? '🟡' : '🟢'}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>` : ''}

          ${alertas.trazabilidad?.length > 0 ? `
          <div class="inf-section-title" style="color:#f59e0b;">🟠 Alertas de Trazabilidad (${alertas.trazabilidad.length})</div>
          <div class="table-scroll scroll-shadow-container mb-14">
            <table class="inf-table inf-table-sm" style="--tbl-accent:#f59e0b;">
              <thead><tr><th>Animal/Venta</th><th>Mensaje</th><th>Urgencia</th></tr></thead>
              <tbody>${alertas.trazabilidad.map(a => `
                <tr>
                  <td>${a.crotal || '-'}</td>
                  <td class="text-xs">${a.mensaje || '-'}</td>
                  <td class="text-center">${a.urgencia === 'rojo' ? '🔴' : '🟡'}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>` : ''}

          ${alertas.administrativas?.length > 0 ? `
          <div class="inf-section-title" style="color:#8b5cf6;">🟣 Alertas Administrativas (${alertas.administrativas.length})</div>
          <div class="table-scroll scroll-shadow-container mb-14">
            <table class="inf-table inf-table-sm" style="--tbl-accent:#8b5cf6;">
              <thead><tr><th>Sección</th><th>Mensaje</th><th>Urgencia</th></tr></thead>
              <tbody>${alertas.administrativas.map(a => `
                <tr>
                  <td>${a.seccion || '-'}</td>
                  <td class="text-xs">${a.mensaje || '-'}</td>
                  <td class="text-center">${a.urgencia === 'rojo' ? '🔴' : a.urgencia === 'amarillo' ? '🟡' : '🟢'}</td>
                </tr>`).join('')}</tbody>
            </table>
          </div>` : ''}

          ${alertas.calendario?.sugerencias?.length > 0 ? `
          <div class="card border-top-3px border-top-3px-blue p-14">
            <div class="inf-card-title mb-8">📅 ${alertas.calendario.titulo || 'Calendario Preventivo'}</div>
            <ul style="margin:0;padding-left:18px;">
              ${alertas.calendario.sugerencias.map(s => `<li class="text-sm text-gray mb-4">${s}</li>`).join('')}
            </ul>
          </div>` : ''}

          ${totalAlertas === 0 ? '<div class="empty-state"><div class="empty-state-icon">✅</div><p class="empty-state-text">No hay alertas activas. Todo correcto.</p></div>' : ''}
        </div>
      </div>
    `;
  },

  // ===================== INFORME POR FINCA =====================

  _renderPorFinca(content, d) {
    const { finca, rent, censo, animales, rebanos } = d;
    if (!finca) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏠</div><p class="empty-state-text">No hay datos de explotación. Configura una finca primero.</p></div>`;
      return;
    }
    const balanceTotal = rent?.balance || 0;
    const totalAnimales = (animales || []).length;
    const activos = (animales || []).filter(a => a.estado === 'activo' || a.estado === 'Activo').length;
    const numRebanos = (rebanos || []).length;

    content.innerHTML = this._sectionActionsHTML('por-finca', 'Por Finca') + `
      <div class="inf-report mb-14">
        <!-- Ficha Explotación -->
        <div class="card report-section border-top-3px border-top-3px-gold report-card">
          <div class="inf-card-title">🏠 ${finca.nombre || 'Explotación'}</div>
          <div class="grid grid-cols-2 gap-10 mb-14">
            <div class="info-box border-left-gold">
              <small class="s-lbl">REGA</small>
              <div class="inf-val-md text-gold">${finca.codigo_REGA || finca.rega || 'N/D'}</div>
            </div>
            <div class="info-box border-left-blue">
              <small class="s-lbl">PROPIETARIO</small>
              <div class="inf-val-md text-white">${finca.propietario || 'N/D'}</div>
            </div>
            <div class="info-box border-left-amber">
              <small class="s-lbl">CENSO TOTAL</small>
              <div class="inf-val-md text-amber">${totalAnimales}</div>
            </div>
            <div class="info-box border-left-green">
              <small class="s-lbl">ACTIVOS</small>
              <div class="inf-val-md text-green">${activos}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-8 text-sm mb-14">
            <div><span class="text-gray">Municipio:</span> <strong>${finca.municipio || 'N/D'}</strong></div>
            <div><span class="text-gray">Provincia:</span> <strong>${finca.provincia || 'N/D'}</strong></div>
            <div><span class="text-gray">CCAA:</span> <strong>${finca.comunidad_autonoma || finca.comunidad || 'N/D'}</strong></div>
            <div><span class="text-gray">Rebaños:</span> <strong>${numRebanos}</strong></div>
            <div><span class="text-gray">ADSG:</span> <strong>${finca.adsg || 'N/D'}</strong></div>
            <div><span class="text-gray">NIF/CIF:</span> <strong>${finca.nif_cif || 'N/D'}</strong></div>
          </div>
        </div>

        <!-- Resumen Económico -->
        ${rent ? `
        <div class="card report-section border-top-3px border-top-3px-green report-card">
          <div class="inf-card-title">💰 Resumen Económico</div>
          <div class="grid grid-cols-3 gap-10">
            <div class="info-box border-left-amber">
              <small class="s-lbl">INGRESOS</small>
              <div class="inf-val-lg text-amber">${(rent.ingresos || 0).toLocaleString()}€</div>
            </div>
            <div class="info-box border-left-red">
              <small class="s-lbl">GASTOS</small>
              <div class="inf-val-lg text-red">${(rent.gastos || 0).toLocaleString()}€</div>
            </div>
            <div class="info-box border-left-green">
              <small class="s-lbl">BALANCE</small>
              <div class="inf-val-lg" style="color:${balanceTotal >= 0 ? '#10b981' : '#ef4444'};">${balanceTotal.toLocaleString()}€</div>
            </div>
          </div>
        </div>` : ''}

        <!-- Rebaños -->
        ${rebanos?.length > 0 ? `
        <div class="card report-section border-top-3px border-top-3px-purple report-card">
          <div class="inf-card-title">🐑 Rebaños</div>
          <div class="table-scroll scroll-shadow-container">
            <table class="inf-table inf-table-sm" style="--tbl-accent:#8b5cf6;">
              <thead><tr><th>Rebaño</th><th>Tipo</th><th class="text-center">Animales</th><th class="text-center">Activos</th></tr></thead>
              <tbody>${rebanos.map(r => {
                const cnt = (animales || []).filter(a => Number(a.rebanoId) === Number(r.id)).length;
                const act = (animales || []).filter(a => Number(a.rebanoId) === Number(r.id) && (a.estado === 'activo' || a.estado === 'Activo')).length;
                return `<tr><td>${r.nombre}</td><td class="text-gray">${r.tipo || '-'}</td><td class="text-center font-bold">${cnt}</td><td class="text-center text-green">${act}</td></tr>`;
              }).join('')}</tbody>
            </table>
          </div>
        </div>` : ''}
      </div>
    `;
  },

  // ===================== INFORME REGA =====================

  _renderRega(content, d) {
    const { finca, censo, rebanos, animales, eventos, ventasCompleto } = d;
    if (!finca) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p class="empty-state-text">No hay datos de explotación registrados. Configura la finca primero.</p></div>`;
      return;
    }

    const totalAnimales = (animales || []).length;
    const activos = (animales || []).filter(a => a.estado === 'activo' || a.estado === 'Activo').length;
    const totalVentas = (ventasCompleto || []).length;
    const eventosRecientes = (eventos || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 15);

    // Agrupar censo por especie
    const porEspecie = {};
    (animales || []).forEach(a => {
      const esp = a.especie || 'Sin especie';
      if (!porEspecie[esp]) porEspecie[esp] = { total: 0, activos: 0 };
      porEspecie[esp].total++;
      if (a.estado === 'activo' || a.estado === 'Activo') porEspecie[esp].activos++;
    });

    const numRebanos = (rebanos || []).length;
    const especies = Object.keys(porEspecie);
    content.innerHTML = this._sectionActionsHTML('rega', 'REGA') + `
      <div class="inf-report mb-14">
        <!-- KPIs -->
        <div class="grid grid-cols-4 gap-6 mb-14">
          <div class="info-box-center" style="border-left:3px solid #10b981;"><small class="s-lbl">CENSO TOTAL</small><div class="inf-val-lg text-green">${totalAnimales}</div></div>
          <div class="info-box-center" style="border-left:3px solid #3b82f6;"><small class="s-lbl">ACTIVOS</small><div class="inf-val-lg text-blue">${activos}</div></div>
          <div class="info-box-center" style="border-left:3px solid #f59e0b;"><small class="s-lbl">REBAÑOS</small><div class="inf-val-lg text-amber">${numRebanos}</div></div>
          <div class="info-box-center" style="border-left:3px solid #8b5cf6;"><small class="s-lbl">ESPECIES</small><div class="inf-val-lg text-purple">${especies.length}</div></div>
        </div>
        <!-- Datos Explotación -->
        <div class="card report-section border-top-3px border-top-3px-gold report-card">
          <div class="inf-card-title">📋 Datos de la Explotación</div>
          <div class="grid grid-cols-2 gap-8 text-sm">
            <div><span class="text-gray">Nombre:</span> <strong>${finca.nombre || 'N/D'}</strong></div>
            <div><span class="text-gray">REGA:</span> <strong class="text-gold">${finca.codigo_REGA || finca.rega || 'N/D'}</strong></div>
            <div><span class="text-gray">CEA:</span> <strong>${finca.codigo_CEA || finca.cea || 'N/D'}</strong></div>
            <div><span class="text-gray">Propietario:</span> <strong>${finca.propietario || 'N/D'}</strong></div>
            <div><span class="text-gray">NIF/CIF:</span> <strong>${finca.nif_cif || 'N/D'}</strong></div>
            <div><span class="text-gray">Dirección:</span> <strong>${finca.direccion || 'N/D'}</strong></div>
            <div><span class="text-gray">Municipio:</span> <strong>${finca.municipio || 'N/D'}</strong></div>
            <div><span class="text-gray">Provincia:</span> <strong>${finca.provincia || 'N/D'}</strong></div>
            <div><span class="text-gray">Comunidad:</span> <strong>${finca.comunidad_autonoma || finca.comunidad || 'N/D'}</strong></div>
            <div><span class="text-gray">ADSG:</span> <strong>${finca.adsg || 'N/D'}</strong></div>
            <div><span class="text-gray">Teléfono:</span> <strong>${finca.telefono || 'N/D'}</strong></div>
            <div><span class="text-gray">Email:</span> <strong>${finca.email || 'N/D'}</strong></div>
          </div>
        </div>

        <!-- Resumen Censo -->
        <div class="card report-section border-top-3px border-top-3px-green report-card">
          <div class="inf-card-title">🐑 Censo Actual</div>
          <div class="grid grid-cols-3 gap-10 mb-12">
            <div class="info-box-center border-left-blue">
              <small class="s-lbl">TOTAL ANIMALES</small>
              <div class="inf-val-lg text-blue">${totalAnimales}</div>
            </div>
            <div class="info-box-center border-left-green">
              <small class="s-lbl">ACTIVOS</small>
              <div class="inf-val-lg text-green">${activos}</div>
            </div>
            <div class="info-box-center border-left-amber">
              <small class="s-lbl">VENTAS</small>
              <div class="inf-val-lg text-amber">${totalVentas}</div>
            </div>
          </div>

          ${Object.keys(porEspecie).length > 0 ? `
          <div class="inf-section-title mt-8 mb-8">Por especie</div>
          <div class="grid grid-cols-2 gap-6">
            ${Object.entries(porEspecie).map(([esp, data]) => `
              <div class="info-box-sm flex justify-between items-center">
                <span class="text-aaa text-sm">${esp}</span>
                <span><strong class="text-white">${data.total}</strong> <span class="text-green text-xs">(${data.activos} activos)</span></span>
              </div>`).join('')}
          </div>` : ''}

          ${rebanos?.length > 0 ? `
          <div class="inf-section-title mt-10 mb-6">Por rebaño</div>
          <div class="table-scroll scroll-shadow-container">
            <table class="inf-table inf-table-sm" style="--tbl-accent:#10b981;">
              <thead><tr>
                <th>REBAÑO</th>
                <th class="text-center">TOTAL</th>
                <th class="text-center">ACTIVOS</th>
              </tr></thead>
              <tbody>${rebanos.map(r => {
                const cnt = (animales || []).filter(a => Number(a.rebanoId) === Number(r.id)).length;
                const act = (animales || []).filter(a => Number(a.rebanoId) === Number(r.id) && (a.estado === 'activo' || a.estado === 'Activo')).length;
                return `<tr>
                  <td>${r.nombre}</td>
                  <td class="text-center font-bold">${cnt}</td>
                  <td class="text-center text-green">${act}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : ''}
        </div>

        <!-- Movimientos recientes -->
        <div class="card report-section border-top-3px border-top-3px-purple report-card">
          <div class="inf-card-title">📦 Últimos Movimientos</div>
          ${eventosRecientes.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📦</div><p class="empty-state-text">Sin movimientos registrados</p></div>' : `
          <div class="table-scroll scroll-shadow-container">
            <table class="inf-table inf-table-sm" style="--tbl-accent:#8b5cf6;">
              <thead><tr>
                <th>FECHA</th>
                <th>TIPO</th>
                <th>MOTIVO</th>
                <th>ENTIDAD</th>
              </tr></thead>
              <tbody>${eventosRecientes.map(e => {
                const tipos = { 'expedicion': '📦 Expedición', 'ALTA_IMPORTACION': '📥 Importación', 'baja': '❌ Baja', 'control': '✅ Control', 'alta': '➕ Alta' };
                return `<tr>
                  <td class="nowrap">${e.fecha || '-'}</td>
                  <td>${tipos[e.motivo_tarea] || e.motivo_tarea || 'Otro'}</td>
                  <td>${e.motivo_tarea || '-'}</td>
                  <td>${e.entidad_id || '-'}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>`}
        </div>
      </div>
    `;
  },

  // ===================== NUEVOS INFORMES =====================

  /** PyG: Cuenta de Resultados mensual */
  _renderPyG(content, d) {
    const { pygData } = d;
    const data = pygData || { porMes: [], totalIngresos: 0, totalGastos: 0, totalBalance: 0, gastosPorCategoria: [], numMeses: 0, rentabilidad: '0.0' };
    content.innerHTML = this._sectionActionsHTML('pyg', 'PyG') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-green report-card">
        <div class="inf-card-title">💰 Cuenta de Resultados</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-green"><small class="s-lbl">INGRESOS</small><div class="inf-val-lg text-green">${data.totalIngresos.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-red"><small class="s-lbl">GASTOS</small><div class="inf-val-lg text-red">${data.totalGastos.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-${data.totalBalance >= 0 ? 'green' : 'red'}"><small class="s-lbl">BALANCE</small><div class="inf-val-lg" style="color:${data.totalBalance >= 0 ? '#10b981' : '#ef4444'}">${data.totalBalance.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-blue"><small class="s-lbl">RENTABILIDAD</small><div class="inf-val-lg text-blue">${data.rentabilidad}%</div></div>
        </div>
        ${data.porMes.length > 0 ? `
        <div class="table-scroll scroll-shadow-container mb-14">
          <table class="inf-table" style="--tbl-accent:#10b981;">
            <thead><tr><th>Mes</th><th class="text-right text-green">Ingresos</th><th class="text-right text-red">Gastos</th><th class="text-right">Balance</th><th class="text-right">Acumulado</th></tr></thead>
            <tbody>${data.porMes.filter(m => m.ingresos > 0 || m.gastos > 0).map(m => `
              <tr>
                <td><strong>${m.mes}</strong></td>
                <td class="text-right text-green">${m.ingresos.toLocaleString()}€</td>
                <td class="text-right text-red">${m.gastos.toLocaleString()}€</td>
                <td class="text-right font-bold" style="color:${m.balance >= 0 ? '#10b981' : '#ef4444'}">${m.balance.toLocaleString()}€</td>
                <td class="text-right text-gray">—</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">💰</div><p class="empty-state-text">Sin datos económicos registrados. Añade ventas y gastos para ver la cuenta de resultados.</p></div>'}
        ${data.gastosPorCategoria.length > 0 ? `
        <div class="inf-section-title">Gastos por Categoría</div>
        <div class="grid grid-cols-2 gap-6 mb-10">
          ${data.gastosPorCategoria.map(g => `
            <div class="info-box-sm flex justify-between items-center">
              <span class="inf-small text-aaa">${g.categoria}</span>
              <span class="font-bold text-red">${g.total.toLocaleString()}€ <span class="text-gray text-xs">(${data.totalGastos > 0 ? ((g.total / data.totalGastos) * 100).toFixed(1) : 0}%)</span></span>
            </div>`).join('')}
        </div>` : ''}
      </div>`;
  },

  /** Coste de Producción por Animal/Día */
  _renderCosteProd(content, d) {
    const { costeProdData } = d;
    const data = costeProdData || { porRebano: [], totalGasto: 0, totalAnimales: 0, costeMedioCabeza: 0, costeMedioDia: 0 };
    content.innerHTML = this._sectionActionsHTML('coste-prod', 'Coste Producción') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-purple report-card">
        <div class="inf-card-title">🐄 Coste de Producción por Animal</div>
        <div class="grid grid-cols-3 gap-8 mb-14">
          <div class="info-box-center border-left-purple"><small class="s-lbl">COSTE MEDIO/CABEZA</small><div class="inf-val-lg text-purple">${data.costeMedioCabeza.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-blue"><small class="s-lbl">COSTE/DÍA</small><div class="inf-val-lg text-blue">${data.costeMedioDia}€</div></div>
          <div class="info-box-center border-left-green"><small class="s-lbl">ANIMALES</small><div class="inf-val-lg text-green">${data.totalAnimales}</div></div>
        </div>
        ${data.totalGasto > 0 ? `<div class="info-box mb-14"><small class="s-lbl">GASTO TOTAL</small><div class="inf-val-md text-red">${data.totalGasto.toLocaleString()}€</div></div>` : ''}
        ${data.porRebano.length > 0 ? `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table inf-table-sm" style="--tbl-accent:#8b5cf6;">
            <thead><tr><th>Rebaño</th><th class="text-center">Animales</th><th class="text-right">Gasto Total</th><th class="text-right">€/Cabeza</th><th class="text-right">€/Día</th><th class="text-right">%Alim</th><th class="text-right">%Sanidad</th></tr></thead>
            <tbody>${data.porRebano.map(r => `
              <tr>
                <td><strong>${r.nombre}</strong> <span class="text-gray text-xs">${r.especie}</span></td>
                <td class="text-center">${r.numAnimales}</td>
                <td class="text-right font-bold text-red">${r.totalGasto.toLocaleString()}€</td>
                <td class="text-right">${r.costePorCabeza.toLocaleString()}€</td>
                <td class="text-right text-blue">${r.costePorDia}€</td>
                <td class="text-right">${r.pctAlimentacion}%</td>
                <td class="text-right">${r.pctSanidad}%</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">🐄</div><p class="empty-state-text">Sin datos de gastos asociados a rebaños.</p></div>'}
      </div>`;
  },

  /** Panel de Eficiencia Técnica */
  _renderEficiencia(content, d) {
    const { eficienciaData } = d;
    const data = eficienciaData || { kpis: [], activos: 0, totalLecheros: 0, numRebanos: 0, totalAnimales: 0 };
    const semaforo = (s) => s === 'verde' ? '#10b981' : s === 'amarillo' ? '#f59e0b' : '#ef4444';
    content.innerHTML = this._sectionActionsHTML('eficiencia', 'Eficiencia Técnica') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-blue report-card">
        <div class="inf-card-title">📊 Panel de Eficiencia Técnica</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-blue"><small class="s-lbl">REBAÑOS</small><div class="inf-val-lg text-blue">${data.numRebanos}</div></div>
          <div class="info-box-center border-left-green"><small class="s-lbl">ACTIVOS</small><div class="inf-val-lg text-green">${data.activos}</div></div>
          <div class="info-box-center border-left-amber"><small class="s-lbl">HEMBRAS LECH.</small><div class="inf-val-lg text-amber">${data.totalLecheros}</div></div>
          <div class="info-box-center border-left-purple"><small class="s-lbl">TOTAL</small><div class="inf-val-lg text-purple">${data.totalAnimales}</div></div>
        </div>
        ${data.kpis.length > 0 ? `
        <div class="grid grid-cols-3 gap-8 mb-10">
          ${data.kpis.map(k => `
            <div class="info-box-sm" style="border-left:3px solid ${semaforo(k.status)};">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <small class="s-lbl">${k.label}</small>
                <span style="width:10px;height:10px;border-radius:50%;background:${semaforo(k.status)};display:inline-block;"></span>
              </div>
              <div class="inf-val-md text-white">${k.value}</div>
              <small class="text-gray text-xs">Objetivo: ${k.objetivo}${k.unidad}</small>
            </div>`).join('')}
        </div>` : '<div class="empty-state"><div class="empty-state-icon">📊</div><p class="empty-state-text">No hay suficientes datos para calcular KPIs de eficiencia.</p></div>'}
      </div>`;
  },

  /** Cargas y Aforos por zona */
  _renderCargas(content, d) {
    const { cargasData } = d;
    const data = cargasData || { porZona: [], totalAforo: 0, totalOcupacion: 0, pctGlobal: '0', alertas: [], numAlertas: 0, numZonas: 0 };
    const colorPct = (p) => p > 100 ? '#ef4444' : p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : '#6b7280';
    content.innerHTML = this._sectionActionsHTML('cargas', 'Aforos') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-amber report-card">
        <div class="inf-card-title">📐 Cargas y Aforos</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-blue"><small class="s-lbl">ZONAS</small><div class="inf-val-lg text-blue">${data.numZonas}</div></div>
          <div class="info-box-center border-left-green"><small class="s-lbl">AFORO TOTAL</small><div class="inf-val-lg text-green">${data.totalAforo}</div></div>
          <div class="info-box-center border-left-amber"><small class="s-lbl">OCUPACIÓN</small><div class="inf-val-lg text-amber">${data.totalOcupacion}</div></div>
          <div class="info-box-center" style="border-left:3px solid ${colorPct(parseFloat(data.pctGlobal))};"><small class="s-lbl">% GLOBAL</small><div class="inf-val-lg" style="color:${colorPct(parseFloat(data.pctGlobal))}">${data.pctGlobal}%</div></div>
        </div>
        ${data.numAlertas > 0 ? `<div class="card" style="background:rgba(239,68,68,0.1);margin-bottom:14px;padding:12px;">
          <div class="flex items-center gap-8"><span style="font-size:1.4rem;">🚨</span><div><strong class="text-red">${data.numAlertas} alertas</strong><span class="text-gray text-sm" style="display:block;">Zonas con sobrecarga o infrautilización</span></div></div>
        </div>` : ''}
        ${data.porZona.length > 0 ? `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table inf-table-sm" style="--tbl-accent:#f59e0b;">
            <thead><tr><th>Zona</th><th class="text-center">Superficie</th><th class="text-center">Aforo</th><th class="text-center">Ocupación</th><th class="text-center">%</th><th>Estado</th></tr></thead>
            <tbody>${data.porZona.map(z => `
              <tr>
                <td><strong>${z.nombre}</strong>${z.especie ? `<br><span class="text-gray text-xs">${z.especie}</span>` : ''}</td>
                <td class="text-center">${z.superficie} ha</td>
                <td class="text-center">${z.aforo}</td>
                <td class="text-center">${z.ocupacion}</td>
                <td class="text-center font-bold" style="color:${colorPct(z.pctOcupacion)}">${z.pctOcupacion}%</td>
                <td class="text-center"><span class="badge badge-sm ${z.estado === 'sobrecarga' ? 'badge-red' : z.estado === 'optimo' ? 'badge-green' : z.estado === 'aceptable' ? 'badge-amber' : 'badge-gray'}">${z.estado}</span></td>
              </tr>`).join('')}</tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">📐</div><p class="empty-state-text">Sin zonas configuradas o sin datos de ocupación.</p></div>'}
      </div>`;
  },

  /** Rotación de Censo */
  _renderRotacion(content, d) {
    const { rotacionData } = d;
    const data = rotacionData || { ultimos90: {}, ultimos30: {}, totalAnimales: 0, activos: 0, tasaReposicion: '0%', tasaBajas: '0%', periodo: '90 días' };
    const u90 = data.ultimos90 || {};
    const u30 = data.ultimos30 || {};
    content.innerHTML = this._sectionActionsHTML('rotacion', 'Rotación Censo') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-blue report-card">
        <div class="inf-card-title">🔄 Rotación de Censo (${data.periodo})</div>
        <div class="grid grid-cols-3 gap-8 mb-14">
          <div class="info-box-center border-left-green"><small class="s-lbl">CENSO TOTAL</small><div class="inf-val-lg text-green">${data.totalAnimales}</div></div>
          <div class="info-box-center border-left-blue"><small class="s-lbl">ACTIVOS</small><div class="inf-val-lg text-blue">${data.activos}</div></div>
          <div class="info-box-center border-left-amber"><small class="s-lbl">ENTRADA NETA</small><div class="inf-val-lg" style="color:${(u90.entradaNeta || 0) >= 0 ? '#10b981' : '#ef4444'}">${(u90.entradaNeta || 0) >= 0 ? '+' : ''}${u90.entradaNeta || 0}</div></div>
        </div>
        <div class="grid grid-cols-2 gap-8 mb-14">
          <div class="info-box border-left-green"><small class="s-lbl">TASA REPOSICIÓN</small><div class="inf-val-lg text-green">${data.tasaReposicion}</div></div>
          <div class="info-box border-left-red"><small class="s-lbl">TASA BAJAS</small><div class="inf-val-lg text-red">${data.tasaBajas}</div></div>
        </div>
        <div class="grid grid-cols-4 gap-8 mb-10">
          <div class="info-box-sm text-center border-left-green"><small class="s-lbl">NACIMIENTOS</small><div class="inf-val-md text-green">${u90.nacimientos || 0}</div></div>
          <div class="info-box-sm text-center border-left-blue"><small class="s-lbl">COMPRAS</small><div class="inf-val-md text-blue">${u90.compras || 0}</div></div>
          <div class="info-box-sm text-center border-left-red"><small class="s-lbl">VENTAS</small><div class="inf-val-md text-red">${u90.ventas || 0}</div></div>
          <div class="info-box-sm text-center border-left-gray"><small class="s-lbl">BAJAS</small><div class="inf-val-md text-gray">${u90.bajas || 0}</div></div>
        </div>
        ${data.totalAnimales === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔄</div><p class="empty-state-text">Sin datos de censo registrados.</p></div>' : ''}
      </div>`;
  },

  /** Flujo de Caja mensual */
  _renderFlujoCaja(content, d) {
    const { flujoCajaData } = d;
    const data = flujoCajaData || { porMes: [], totalEntradas: 0, totalSalidas: 0, totalNeto: 0, saldoFinal: 0 };
    content.innerHTML = this._sectionActionsHTML('flujo-caja', 'Flujo Caja') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-teal report-card">
        <div class="inf-card-title">📈 Flujo de Caja</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-green"><small class="s-lbl">ENTRADAS</small><div class="inf-val-lg text-green">${data.totalEntradas.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-red"><small class="s-lbl">SALIDAS</small><div class="inf-val-lg text-red">${data.totalSalidas.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-${data.totalNeto >= 0 ? 'green' : 'red'}"><small class="s-lbl">NETO</small><div class="inf-val-lg" style="color:${data.totalNeto >= 0 ? '#10b981' : '#ef4444'}">${data.totalNeto.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-blue"><small class="s-lbl">SALDO FINAL</small><div class="inf-val-lg text-blue">${data.saldoFinal.toLocaleString()}€</div></div>
        </div>
        ${data.porMes.length > 0 ? `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table inf-table-sm" style="--tbl-accent:#14b8a6;">
            <thead><tr><th>Mes</th><th class="text-right text-green">Entradas</th><th class="text-right text-red">Salidas</th><th class="text-right">Neto</th><th class="text-right">Acumulado</th></tr></thead>
            <tbody>${data.porMes.filter(m => m.entradas > 0 || m.salidas > 0).map(m => `
              <tr>
                <td><strong>${m.mes}</strong></td>
                <td class="text-right text-green">${m.entradas.toLocaleString()}€</td>
                <td class="text-right text-red">${m.salidas.toLocaleString()}€</td>
                <td class="text-right font-bold" style="color:${m.neto >= 0 ? '#10b981' : '#ef4444'}">${m.neto.toLocaleString()}€</td>
                <td class="text-right text-blue font-bold">${m.acumulado.toLocaleString()}€</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">📈</div><p class="empty-state-text">Sin datos de ingresos o gastos para calcular flujo de caja.</p></div>'}
      </div>`;
  },

  /** Rentabilidad por Especie */
  _renderRentabilidadEspecie(content, d) {
    const { rentEspData } = d;
    const data = rentEspData || { porEspecie: [], totalIngresos: 0, totalGastos: 0, totalBalance: 0 };
    content.innerHTML = this._sectionActionsHTML('rent-esp', 'Rent. Especie') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-purple report-card">
        <div class="inf-card-title">🧬 Rentabilidad por Especie</div>
        <div class="grid grid-cols-3 gap-8 mb-14">
          <div class="info-box-center border-left-green"><small class="s-lbl">INGRESOS</small><div class="inf-val-lg text-green">${data.totalIngresos.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-red"><small class="s-lbl">GASTOS</small><div class="inf-val-lg text-red">${data.totalGastos.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-${data.totalBalance >= 0 ? 'green' : 'red'}"><small class="s-lbl">BALANCE</small><div class="inf-val-lg" style="color:${data.totalBalance >= 0 ? '#10b981' : '#ef4444'}">${data.totalBalance.toLocaleString()}€</div></div>
        </div>
        ${data.porEspecie.length > 0 ? `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table" style="--tbl-accent:#8b5cf6;">
            <thead><tr><th>Especie</th><th class="text-center">Rebaños</th><th class="text-center">Animales</th><th class="text-right text-green">Ingresos</th><th class="text-right text-red">Gastos</th><th class="text-right">Balance</th><th class="text-center">Vtas Carne</th><th class="text-center">Vtas Leche</th></tr></thead>
            <tbody>${data.porEspecie.map(e => `
              <tr>
                <td><strong>${e.especie}</strong></td>
                <td class="text-center">${e.numRebanos}</td>
                <td class="text-center font-bold">${e.numAnimales}</td>
                <td class="text-right text-green font-bold">${e.ingresos.toLocaleString()}€</td>
                <td class="text-right text-red">${e.gastos.toLocaleString()}€</td>
                <td class="text-right font-bold" style="color:${e.balance >= 0 ? '#10b981' : '#ef4444'}">${e.balance.toLocaleString()}€</td>
                <td class="text-center">${e.numVentasCarne}</td>
                <td class="text-center">${e.numVentasLeche}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">🧬</div><p class="empty-state-text">Sin datos de especies o ventas. Registra rebaños con especie asignada.</p></div>'}
      </div>`;
  },

  /** Curva de Producción */
  _renderCurvaProduccion(content, d) {
    const { curvaProdData } = d;
    const data = curvaProdData || { porMes: [], totalKg: 0, totalLitros: 0, totalIngresos: 0, metaKg: 0, metaLitros: 0, pctCumplimientoKg: '0', pctCumplimientoLitros: '0' };
    content.innerHTML = this._sectionActionsHTML('curva-prod', 'Curva Producción') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-blue report-card">
        <div class="inf-card-title">📉 Curva de Producción</div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-amber"><small class="s-lbl">KG TOTAL</small><div class="inf-val-lg text-amber">${data.totalKg.toFixed(1)}</div></div>
          <div class="info-box-center border-left-gold"><small class="s-lbl">LITROS TOTAL</small><div class="inf-val-lg text-gold">${data.totalLitros.toFixed(1)}</div></div>
          <div class="info-box-center border-left-green"><small class="s-lbl">META KG</small><div class="inf-val-lg text-green">${Math.round(data.metaKg)}</div></div>
          <div class="info-box-center border-left-blue"><small class="s-lbl">META L</small><div class="inf-val-lg text-blue">${Math.round(data.metaLitros)}</div></div>
        </div>
        <div class="grid grid-cols-2 gap-8 mb-14">
          <div class="info-box" style="border-left:3px solid ${parseFloat(data.pctCumplimientoKg) >= 100 ? '#10b981' : '#f59e0b'};">
            <small class="s-lbl">CUMPLIMIENTO CARNE</small>
            <div class="inf-val-lg" style="color:${parseFloat(data.pctCumplimientoKg) >= 100 ? '#10b981' : '#f59e0b'}">${data.pctCumplimientoKg}%</div>
          </div>
          <div class="info-box" style="border-left:3px solid ${parseFloat(data.pctCumplimientoLitros) >= 100 ? '#10b981' : '#f59e0b'};">
            <small class="s-lbl">CUMPLIMIENTO LECHE</small>
            <div class="inf-val-lg" style="color:${parseFloat(data.pctCumplimientoLitros) >= 100 ? '#10b981' : '#f59e0b'}">${data.pctCumplimientoLitros}%</div>
          </div>
        </div>
        ${data.porMes.length > 0 ? `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table inf-table-sm" style="--tbl-accent:#3b82f6;">
            <thead><tr><th>Mes</th><th class="text-right text-amber">Kg</th><th class="text-right text-gold">Litros</th><th class="text-right text-amber">Kg Acum</th><th class="text-right text-gold">L Acum</th><th class="text-right text-green">Ingresos</th></tr></thead>
            <tbody>${data.porMes.map(m => `
              <tr>
                <td><strong>${m.mes}</strong></td>
                <td class="text-right text-amber">${m.kg.toFixed(1)}</td>
                <td class="text-right text-gold">${m.litros.toFixed(1)}</td>
                <td class="text-right font-bold">${m.kgAcum.toFixed(1)}</td>
                <td class="text-right font-bold">${m.litrosAcum.toFixed(1)}</td>
                <td class="text-right text-green">${m.ingresos.toLocaleString()}€</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">📉</div><p class="empty-state-text">Sin datos de producción registrados.</p></div>'}
      </div>`;
  },

  /** Break-Even: Punto Muerto */
  _renderBreakEven(content, d) {
    const { breakEvenData } = d;
    const data = breakEvenData || { costesFijos: 0, costesVariables: 0, ingresosTotal: 0, breakEvenKg: 0, breakEvenLitros: 0, margenSeguridadKg: '0%', margenSeguridadLitros: '0%', cubiertoCarne: false, cubiertoLeche: false, numRebanos: 0, numMeses: 0 };
    content.innerHTML = this._sectionActionsHTML('breakeven', 'Break-Even') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-red report-card">
        <div class="inf-card-title">⚖️ Análisis de Punto Muerto (Break-Even)</div>
        <div class="grid grid-cols-3 gap-8 mb-14">
          <div class="info-box-center border-left-red"><small class="s-lbl">COSTES FIJOS</small><div class="inf-val-lg text-red">${data.costesFijos.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-amber"><small class="s-lbl">COSTES VARIABLES</small><div class="inf-val-lg text-amber">${data.costesVariables.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-green"><small class="s-lbl">INGRESOS TOTALES</small><div class="inf-val-lg text-green">${data.ingresosTotal.toLocaleString()}€</div></div>
        </div>
        <div class="grid grid-cols-2 gap-10 mb-14">
          <div class="card" style="background:rgba(16,185,129,0.05);padding:14px;">
            <div class="inf-card-title mb-6" style="font-size:0.9rem;">🥩 Carne</div>
            <div class="grid grid-cols-2 gap-6">
              <div><small class="s-lbl">Precio Medio Kg</small><div class="inf-val-md text-amber">${data.precioMedioKg.toFixed(2)}€</div></div>
              <div><small class="s-lbl">Coste Var. Kg</small><div class="inf-val-md text-red">${data.costeVarKg.toFixed(2)}€</div></div>
              <div><small class="s-lbl">Break-Even</small><div class="inf-val-md" style="color:${data.cubiertoCarne ? '#10b981' : '#ef4444'}">${data.breakEvenKg} kg</div></div>
              <div><small class="s-lbl">Margen Seguridad</small><div class="inf-val-md text-blue">${data.margenSeguridadKg}</div></div>
            </div>
          </div>
          <div class="card" style="background:rgba(251,191,36,0.05);padding:14px;">
            <div class="inf-card-title mb-6" style="font-size:0.9rem;">🥛 Leche</div>
            <div class="grid grid-cols-2 gap-6">
              <div><small class="s-lbl">Precio Medio L</small><div class="inf-val-md text-gold">${data.precioMedioLitro.toFixed(3)}€</div></div>
              <div><small class="s-lbl">Coste Var. L</small><div class="inf-val-md text-red">${data.costeVarLitro.toFixed(3)}€</div></div>
              <div><small class="s-lbl">Break-Even</small><div class="inf-val-md" style="color:${data.cubiertoLeche ? '#10b981' : '#ef4444'}">${data.breakEvenLitros} L</div></div>
              <div><small class="s-lbl">Margen Seguridad</small><div class="inf-val-md text-blue">${data.margenSeguridadLitros}</div></div>
            </div>
          </div>
        </div>
        <div class="info-box mb-10">
          <small class="s-lbl">PERÍODO ANALIZADO</small>
          <div class="inf-val-md text-white">${data.numMeses} meses · ${data.numRebanos} rebaños</div>
        </div>
        ${data.ingresosTotal === 0 ? '<div class="empty-state"><div class="empty-state-icon">⚖️</div><p class="empty-state-text">Sin datos económicos. Añade ventas y gastos para calcular el punto muerto.</p></div>' : ''}
      </div>`;
  },

  /** Subvenciones PAC */
  _renderSubvenciones(content, d) {
    const { pacData } = d;
    const data = pacData || { registros: [], totalSolicitado: 0, totalCobrado: 0, totalPendiente: 0, numRegistros: 0, porAnio: [] };
    content.innerHTML = this._sectionActionsHTML('subvenciones', 'PAC') + `
      <div class="inf-report card report-section border-top-3px border-top-3px-green report-card">
        <div class="flex justify-between items-center mb-14">
          <div class="inf-card-title" style="margin:0;">🌾 Subvenciones PAC</div>
          <button class="btn btn-primary btn-sm" onclick="InformesView._agregarPAC()" style="background:linear-gradient(135deg,#065f46,#059669);padding:6px 14px;font-size:0.75rem;">➕ Añadir</button>
        </div>
        <div class="grid grid-cols-4 gap-8 mb-14">
          <div class="info-box-center border-left-green"><small class="s-lbl">SOLICITADO</small><div class="inf-val-lg text-green">${data.totalSolicitado.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-blue"><small class="s-lbl">COBRADO</small><div class="inf-val-lg text-blue">${data.totalCobrado.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-${data.totalPendiente > 0 ? 'amber' : 'green'}"><small class="s-lbl">PENDIENTE</small><div class="inf-val-lg" style="color:${data.totalPendiente > 0 ? '#f59e0b' : '#10b981'}">${data.totalPendiente.toLocaleString()}€</div></div>
          <div class="info-box-center border-left-purple"><small class="s-lbl">REGISTROS</small><div class="inf-val-lg text-purple">${data.numRegistros}</div></div>
        </div>
        ${data.porAnio.length > 0 ? `
        <div class="inf-section-title">Resumen por año</div>
        <div class="grid grid-cols-1 gap-4 mb-14">
          ${data.porAnio.map(a => `
            <div class="info-box-sm flex justify-between items-center">
              <span class="font-bold text-white">${a.anio}</span>
              <span class="text-gray text-xs">${a.num} ayudas</span>
              <div class="text-right">
                <span class="text-green">${a.cobrado.toLocaleString()}€</span>
                <span class="text-gray mx-4">/</span>
                <span class="text-amber">${a.solicitado.toLocaleString()}€</span>
              </div>
            </div>`).join('')}
        </div>` : ''}
        ${data.registros.length > 0 ? `
        <div class="table-scroll scroll-shadow-container">
          <table class="inf-table inf-table-sm" style="--tbl-accent:#10b981;">
            <thead><tr><th>Año</th><th>Concepto</th><th>Régimen</th><th class="text-right">Solicitado</th><th class="text-right">Cobrado</th><th class="text-center">Estado</th></tr></thead>
            <tbody>${data.registros.map(r => {
              const pct = r.importe_solicitado > 0 ? ((r.importe_cobrado || 0) / r.importe_solicitado * 100).toFixed(0) : 0;
              const est = pct >= 100 ? '✅ Cobrado' : pct > 0 ? '🔄 Parcial' : '⏳ Pendiente';
              return `<tr>
                <td class="font-bold">${r.anio || '-'}</td>
                <td>${r.concepto || r.descripcion || 'PAC'}</td>
                <td class="text-gray text-xs">${r.regimen || '—'}</td>
                <td class="text-right">${(r.importe_solicitado || 0).toLocaleString()}€</td>
                <td class="text-right text-green font-bold">${(r.importe_cobrado || 0).toLocaleString()}€</td>
                <td class="text-center text-xs">${est}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-state-icon">🌾</div><p class="empty-state-text">Sin subvenciones PAC registradas. Usa "Añadir" para registrar ayudas de la PAC, PDR, incorporación jóvenes u otras subvenciones.</p></div>'}
      </div>
    `;
  },

  /** Agrega un registro de subvención PAC vía overlay simple */
  async _agregarPAC() {
    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
    overlay.innerHTML = `
      <div class="card p-25" style="max-width:380px;border-top:5px solid #10b981;">
        <h3 class="mt-0 text-green">🌾 Nueva Subvención PAC</h3>
        <div class="wizard-input-group">
          <label class="wizard-label">Año</label>
          <input type="number" id="pac-anio" value="${new Date().getFullYear()}" class="wizard-input">
        </div>
        <div class="wizard-input-group">
          <label class="wizard-label">Concepto</label>
          <input type="text" id="pac-concepto" placeholder="PAC, PDR, Incorporación Jóvenes..." class="wizard-input">
        </div>
        <div class="wizard-input-group">
          <label class="wizard-label">Régimen</label>
          <select id="pac-regimen" class="wizard-input wizard-select">
            <option value="PAC Base">PAC Base</option>
            <option value="PAC Verde">PAC Verde</option>
            <option value="PDR">PDR</option>
            <option value="Incorporación Jóvenes">Incorporación Jóvenes</option>
            <option value="Bienestar Animal">Bienestar Animal</option>
            <option value="Producción Ecológica">Producción Ecológica</option>
            <option value="Otra">Otra</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-10">
          <div class="wizard-input-group">
            <label class="wizard-label">Importe Solicitado (€)</label>
            <input type="number" id="pac-solicitado" step="0.01" class="wizard-input">
          </div>
          <div class="wizard-input-group">
            <label class="wizard-label">Importe Cobrado (€)</label>
            <input type="number" id="pac-cobrado" step="0.01" value="0" class="wizard-input">
          </div>
        </div>
        <div class="flex gap-10 mt-20">
          <button class="wizard-btn-action wizard-btn-primary flex-1" id="btn-pac-guardar">💾 Guardar</button>
          <button class="wizard-btn-action wizard-btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#btn-pac-guardar').onclick = async () => {
      const anio = parseInt(document.getElementById('pac-anio').value);
      const concepto = document.getElementById('pac-concepto').value.trim();
      const regimen = document.getElementById('pac-regimen').value;
      const solicitado = parseFloat(document.getElementById('pac-solicitado').value) || 0;
      const cobrado = parseFloat(document.getElementById('pac-cobrado').value) || 0;
      if (!concepto || solicitado <= 0) { App.toastError("Concepto e importe solicitado obligatorios"); return; }
      try {
        await window.db.add('documentos_legales', {
          tipo: 'pac', anio, concepto, regimen,
          importe_solicitado: solicitado, importe_cobrado: cobrado,
          fecha_emision: new Date().toISOString().split('T')[0],
          fincaId: await Fincas.getActiveId(),
          creadoEn: new Date().toISOString()
        });
        App.toast('✅ Subvención registrada');
        overlay.remove();
        if (window.InformesView) { InformesView._cachedData = null; await InformesView.render(); }
      } catch (e) { App.toastError("Error: " + e.message); }
    };
  },

  // ===================== GRÁFICOS =====================

  _renderGraficosGeneral(d) {
    const { margenA, lecheStats, kpisRepro, estadisticasSanidad } = d;
    setTimeout(() => {
      if (margenA?.length > 0) this._renderScatter('chart-margen-animal', margenA, '#10b981');
      if (lecheStats?.timeline?.length > 1) this._renderLecheTimeline('chart-leche-timeline', lecheStats.timeline);
    }, 50);
  },

  _renderScatter(canvasId, data, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    new Chart(ctx.getContext("2d"), {
      type: "scatter",
      data: { datasets: [{ label: "Animales", data, backgroundColor: color, pointRadius: 5 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { grid: { color: "#222" }, title: { display: true, text: 'Peso Vivo (kg)', color: '#888' } }, y: { grid: { color: "#222" }, title: { display: true, text: 'Margen (€)', color: '#888' } } },
        plugins: { legend: { display: false } }
      }
    });
  },

  _renderBarrasZonas(canvasId, rentZ) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: rentZ.map(z => z.zona), datasets: [
          { label: "Ingresos", data: rentZ.map(z => z.ingresos), backgroundColor: "#10b981" },
          { label: "Gastos", data: rentZ.map(z => z.gastos), backgroundColor: "#ef4444" }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#888", boxWidth: 12 } } } }
    });
  },

  _renderLecheTimeline(canvasId, timeline) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    new Chart(ctx.getContext("2d"), {
      type: 'line',
      data: {
        labels: timeline.map(r => { const d = r.fecha.split('-'); return d[1] + '/' + d[2]; }),
        datasets: [{ label: 'Litros', data: timeline.map(r => r.litros), borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)', fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#fbbf24' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { grid: { color: '#222' }, ticks: { color: '#888', font: { size: 9 } } }, y: { grid: { color: '#222' }, beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  },

  // ===================== MÉTODOS DE DATOS =====================

  async _obtenerMetricasLeche(fincaId) {
    try {
      // 1. Intentar con comercializacion_leche (datos sin cifrar, campo 'cantidad')
      let registros = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', Number(fincaId));
      if (!registros || registros.length === 0) {
        // 2. Fallback: produccion_leche cifrada (campo 'cantidad_litros')
        const cifrados = await Produccion.listLeche(fincaId);
        if (cifrados && cifrados.length > 0) {
          registros = cifrados.map(r => ({
            fecha: r.fecha,
            cantidad: r.cantidad_litros || r.cantidad || 0,
            precioBase: r.precioBase || 0.45
          }));
        }
      }
      if (!registros || registros.length === 0)
        return { totalLitros: 0, promedioDiario: 0, precioMedio: 0, totalRegistros: 0, timeline: [] };
      const totalLitros = registros.reduce((s, r) => s + (r.cantidad || 0), 0);
      const precioMedio = registros.reduce((s, r) => s + (r.precioBase || 0.45), 0) / registros.length;
      const timeline = registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(-30)
        .map(r => ({ fecha: r.fecha, litros: r.cantidad || 0 }));
      const diasDiff = Math.max(1, Math.ceil((new Date(timeline[timeline.length - 1]?.fecha || Date.now()) - new Date(timeline[0]?.fecha || Date.now())) / (1000 * 60 * 60 * 24)));
      return { totalLitros, promedioDiario: totalLitros / diasDiff, precioMedio, totalRegistros: registros.length, timeline };
    } catch (e) { return { totalLitros: 0, promedioDiario: 0, precioMedio: 0, totalRegistros: 0, timeline: [] }; }
  },

  async _obtenerGastosPorCategoria(fincaId) {
    try {
      const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', Number(fincaId));
      if (!gastos?.length) return [];
      const porCat = {};
      gastos.forEach(g => { const c = g.categoria || 'Otros'; porCat[c] = (porCat[c] || 0) + (g.monto || 0); });
      return Object.entries(porCat).map(([c, t]) => ({ categoria: c, total: t })).sort((a, b) => b.total - a.total);
    } catch (e) { return []; }
  },

  async _obtenerGananciaDiaria(fincaId) {
    try {
      const rebanos = await window.db.getAllFromIndex('rebanos', 'fincaId', Number(fincaId));
      const resultados = [];
      for (const r of rebanos) {
        const animales = await window.db.getAllFromIndex('animales', 'rebanoId', r.id);
        for (const a of animales.slice(0, 10)) {
          try {
            const gmd = await Produccion.calcularGananciaDiaria(a.id);
            if (gmd?.gananciaDiaria != null) resultados.push({ label: `${a.numero_identificacion} (${r.nombre})`, gananciaDiaria: gmd.gananciaDiaria });
          } catch (e) { }
        }
      }
      return resultados;
    } catch (e) { return []; }
  },

  async _obtenerHistorialVentas(fincaId) {
    try {
      let ventas = await Produccion.listVentas(fincaId);
      if (ventas?.length) {
        return ventas.sort((a, b) => new Date(b.fechaSacrificio || b.fecha_venta || b.fecha || 0) - new Date(a.fechaSacrificio || a.fecha_venta || a.fecha || 0))
          .map(v => ({ fecha: v.fechaSacrificio || v.fecha_venta || v.fecha || '-', animales: v.animal_id_list?.length || v.cantidad || 1, kg: v.pesoCanal || v.pesoTotal || 0, total: v.precio_total || 0 }));
      }
      // Fallback: comercializacion_carne (sin cifrar)
      const cc = await window.db.getAllFromIndex('comercializacion_carne', 'fincaId', Number(fincaId));
      if (cc?.length) {
        return cc.map(c => ({
          fecha: c.fechaSacrificio || c.fecha_emision || '-',
          animales: c.animal_id_list?.length || c.cantidad || 1,
          kg: c.pesoCanal || c.pesoVivo || 0,
          total: c.precio_total || 0
        })).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      }
      return [];
    } catch (e) { return []; }
  },

  // ===================== NUEVOS DATA LOADERS =====================

  /** Agrupa ventas de carne y leche por comprador */
  async _obtenerMetricasCompradores(fId) {
    try {
      const [ventasCarne, ventasLeche, compradores] = await Promise.all([
        window.db.getAllFromIndex('comercializacion_carne', 'fincaId', Number(fId)).catch(() => []),
        window.db.getAllFromIndex('comercializacion_leche', 'fincaId', Number(fId)).catch(() => []),
        window.db.getAll('compradores').catch(() => []),
      ]);
      // Mapa de compradores por id
      const mapaCompradores = {};
      compradores.forEach(c => { mapaCompradores[c.id] = c; });

      const agrupado = {};

      // Procesar ventas de carne
      ventasCarne.forEach(v => {
        const id = v.compradorId || `nuevo_${v.nifComprador || v.razonSocial || 'unknown'}`;
        if (!agrupado[id]) agrupado[id] = { id, nombre: v.razonSocial || 'N/D', nif: v.nifComprador || '', tipo: '', total: 0, kg: 0, numVentas: 0, ultimaVenta: '', ventasCarne: 0, ventasLeche: 0 };
        const comp = mapaCompradores[v.compradorId];
        if (comp) { agrupado[id].nombre = comp.nombre; agrupado[id].nif = comp.nif_cif || ''; agrupado[id].tipo = comp.tipo_comprador || ''; }
        agrupado[id].total += v.precio_total || 0;
        agrupado[id].kg += v.pesoCanal || v.pesoVivo || 0;
        agrupado[id].numVentas++;
        agrupado[id].ventasCarne += v.precio_total || 0;
        const fecha = v.fechaSacrificio || v.fecha_emision || '';
        if (fecha > (agrupado[id].ultimaVenta || '')) agrupado[id].ultimaVenta = fecha;
      });

      // Procesar ventas de leche
      ventasLeche.forEach(v => {
        const id = v.compradorId || `nuevo_l_${v.nombreComprador || 'unknown'}`;
        if (!agrupado[id]) {
          const comp = mapaCompradores[v.compradorId];
          agrupado[id] = { id, nombre: comp?.nombre || v.nombreComprador || 'N/D', nif: comp?.nif_cif || v.nifComprador || '', tipo: comp?.tipo_comprador || '', total: 0, kg: 0, numVentas: 0, ultimaVenta: '', ventasCarne: 0, ventasLeche: 0 };
        }
        const importe = (v.cantidad || 0) * (v.precioBase || 0.45);
        agrupado[id].total += importe;
        agrupado[id].kg += v.cantidad || 0;
        agrupado[id].numVentas++;
        agrupado[id].ventasLeche += importe;
        const fecha = v.fechaRecogida || v.fecha || '';
        if (fecha > (agrupado[id].ultimaVenta || '')) agrupado[id].ultimaVenta = fecha;
      });

      return Object.values(agrupado).sort((a, b) => b.total - a.total);
    } catch (e) { console.error('[Compradores]', e); return []; }
  },

  /** Agrupa gastos por proveedor */
  async _obtenerMetricasProveedores(fId) {
    try {
      const [gastos, proveedores] = await Promise.all([
        window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', Number(fId)).catch(() => []),
        window.db.getAll('proveedores').catch(() => []),
      ]);
      const mapaProv = {};
      proveedores.forEach(p => { mapaProv[p.id] = p; });

      const agrupado = {};
      gastos.forEach(g => {
        const id = g.proveedorId || `nuevo_${g.proveedor || 'sin_proveedor'}`;
        if (!agrupado[id]) {
          const prov = mapaProv[g.proveedorId];
          agrupado[id] = { id, nombre: prov?.nombre || g.proveedor || 'Sin proveedor', nif: prov?.nif_cif || '', categorias: {}, total: 0, numFacturas: 0, ultimaCompra: '' };
        }
        agrupado[id].categorias[g.categoria || 'Otros'] = (agrupado[id].categorias[g.categoria || 'Otros'] || 0) + (g.monto || 0);
        agrupado[id].total += g.monto || 0;
        agrupado[id].numFacturas++;
        const fecha = g.fecha || '';
        if (fecha > (agrupado[id].ultimaCompra || '')) agrupado[id].ultimaCompra = fecha;
      });

      return Object.values(agrupado).sort((a, b) => b.total - a.total);
    } catch (e) { console.error('[Proveedores]', e); return []; }
  },

  /** Gastos fitosanitarios + tratamientos relacionados */
  async _obtenerDatosFitosanitarios(fId) {
    try {
      const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', Number(fId)).catch(() => []);
      const fitosanitarios = gastos.filter(g => (g.categoria || '').toLowerCase() === 'fitosanitarios');
      const total = fitosanitarios.reduce((s, g) => s + (g.monto || 0), 0);
      const zonas = new Set(fitosanitarios.map(g => g.snap_zona).filter(Boolean));
      return {
        registros: fitosanitarios.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)),
        total,
        numRegistros: fitosanitarios.length,
        numZonas: zonas.size,
        zonas: [...zonas],
        mediaPorOperacion: fitosanitarios.length > 0 ? (total / fitosanitarios.length) : 0,
      };
    } catch (e) { console.error('[Fitosanitario]', e); return { registros: [], total: 0, numRegistros: 0, numZonas: 0, zonas: [], mediaPorOperacion: 0 }; }
  },

  /** Obtener alertas desde AlertasService */
  async _obtenerAlertas() {
    try {
      if (!window.AlertasService) return { sanitarias: [], trazabilidad: [], administrativas: [], calendario: { titulo: '', sugerencias: [] } };
      return await AlertasService.getAll();
    } catch (e) { console.error('[Alertas]', e); return { sanitarias: [], trazabilidad: [], administrativas: [], calendario: { titulo: '', sugerencias: [] } }; }
  },

  /** Datos de la finca activa */
  async _obtenerDatosPorFinca(fId) {
    try {
      return await Fincas.getActive();
    } catch (e) { return null; }
  },

  /** Ventas de carne agrupadas por rebaño */
  async _obtenerVentasPorRebano(fId) {
    try {
      const ventas = await window.db.getAllFromIndex('comercializacion_carne', 'fincaId', Number(fId)).catch(() => []);
      const rebanos = await Rebanos.list().catch(() => []);
      const mapaReb = {};
      rebanos.forEach(r => { mapaReb[r.id] = r; });

      const porReb = {};
      ventas.forEach(v => {
        const rebId = v.snap_rebano || v.rebanoId || 'sin_rebano';
        if (!porReb[rebId]) porReb[rebId] = { rebano: mapaReb[rebId]?.nombre || 'Sin rebaño', total: 0, kg: 0, numVentas: 0 };
        porReb[rebId].total += v.precio_total || 0;
        porReb[rebId].kg += v.pesoCanal || v.pesoVivo || 0;
        porReb[rebId].numVentas++;
      });

      return Object.values(porReb).sort((a, b) => b.total - a.total);
    } catch (e) { console.error('[VentasPorRebano]', e); return []; }
  },

  /** Producción de leche agrupada por rebaño */
  async _obtenerLechePorRebano(fId) {
    try {
      const registros = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', Number(fId)).catch(() => []);
      const rebanos = await Rebanos.list().catch(() => []);
      const mapaReb = {};
      rebanos.forEach(r => { mapaReb[r.id] = r; });

      const porReb = {};
      registros.forEach(r => {
        const rebId = r.snap_rebano || r.rebanoId || 'sin_rebano';
        if (!porReb[rebId]) porReb[rebId] = { rebano: mapaReb[rebId]?.nombre || 'Sin rebaño', litros: 0, numRegistros: 0, importe: 0 };
        porReb[rebId].litros += r.cantidad || 0;
        porReb[rebId].numRegistros++;
        porReb[rebId].importe += (r.cantidad || 0) * (r.precioBase || 0.45);
      });

      return Object.values(porReb).sort((a, b) => b.litros - a.litros);
    } catch (e) { console.error('[LechePorRebano]', e); return []; }
  },

  /** Datos de Subvenciones PAC desde documentos_legales */
  async _obtenerDatosPAC(fId) {
    try {
      const docs = await window.db.getAll('documentos_legales').catch(() => []);
      const pac = docs.filter(d => d.tipo === 'pac');
      const totalSolicitado = pac.reduce((s, p) => s + (p.importe_solicitado || 0), 0);
      const totalCobrado = pac.reduce((s, p) => s + (p.importe_cobrado || 0), 0);
      const totalPendiente = totalSolicitado - totalCobrado;
      const porAnio = {};
      pac.forEach(p => {
        const a = p.anio || '—';
        if (!porAnio[a]) porAnio[a] = { anio: a, solicitado: 0, cobrado: 0, num: 0 };
        porAnio[a].solicitado += p.importe_solicitado || 0;
        porAnio[a].cobrado += p.importe_cobrado || 0;
        porAnio[a].num++;
      });
      return {
        registros: pac.sort((a, b) => (b.anio || '0') - (a.anio || '0')),
        totalSolicitado, totalCobrado, totalPendiente,
        numRegistros: pac.length,
        porAnio: Object.values(porAnio).sort((a, b) => b.anio - a.anio)
      };
    } catch (e) { console.error('[PAC]', e); return { registros: [], totalSolicitado: 0, totalCobrado: 0, totalPendiente: 0, numRegistros: 0, porAnio: [] }; }
  },

  // ===================== EXPORTACIÓN EXCEL =====================

  async _exportExcel() {
    try {
      if (typeof XLSX === 'undefined') return App.toastError("Librería Excel no disponible");
      App.toast("Generando Excel...");

      const fId = await Fincas.getActiveId();
      const finca = await Fincas.getActive();
      const [animales, ventas, leche, gastos, sanitarios, rebanos, censo] = await Promise.all([
        window.db.getAll('animales').catch(() => []),
        Produccion.listVentas(fId).catch(() => []),
        Produccion.listLeche(fId).catch(() => []),
        window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fId).catch(() => []),
        window.db.getAll('sanitarios_ganado').catch(() => []),
        Rebanos.list().catch(() => []),
        Analitica.obtenerCensoRebanos(fId).catch(() => []),
      ]);
      const cd = this._cachedData || {};

      const wb = XLSX.utils.book_new();

      // Hoja 1: Animales
      if (animales.length > 0) {
        const data = animales.map(a => ({
          ID: a.numero_identificacion, Especie: a.especie, Sexo: a.sexo,
          Raza: a.raza, 'F. Nacimiento': a.fecha_nacimiento, Estado: a.estado,
          'Código RFID': a.rfid_codigo, Notas: a.notas
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Animales');
      }

      // Hoja 2: Ventas Carne
      if (ventas.length > 0) {
        const data = ventas.map(v => ({
          Fecha: v.fechaSacrificio || v.fecha_venta, Animales: v.animal_id_list?.length || v.cantidad || 1,
          'Peso Canal': v.pesoCanal, 'Precio Total': v.precio_total,
          'Precio Kg': v.precioKg, Comprador: v.comprador
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Ventas Carne');
      }

      // Hoja 3: Leche
      if (leche.length > 0) {
        const data = leche.map(l => ({
          Fecha: l.fecha, Litros: l.cantidad, 'Precio Base': l.precioBase,
          'Total €': (l.cantidad || 0) * (l.precioBase || 0.45), Calidad: l.estadoAnalitica
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Producción Leche');
      }

      // Hoja 4: Gastos
      if (gastos.length > 0) {
        const data = gastos.map(g => ({
          Fecha: g.fecha, Categoría: g.categoria, Monto: g.monto,
          Descripción: g.descripcion, Rebaño: g.rebanoId
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Gastos');
      }

      // Hoja 5: Sanitarios
      if (sanitarios.length > 0) {
        const data = sanitarios.map(s => ({
          Fecha: s.fecha, Animal: s.animalId, 'Tipo Tratamiento': s.tipo_tratamiento,
          Medicamento: s.medicamento, 'Dias Supresión Carne': s.tiempo_espera_carne_dias,
          'Dias Supresión Leche': s.tiempo_espera_leche_dias
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Sanitarios');
      }

      // Hoja 6: Censo
      if (censo.length > 0) {
        const data = censo.map(r => ({
          Rebaño: r.nombre, Tipo: r.tipo, Total: r.total,
          Activos: r.activos, Vendidos: r.vendidos
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Censo');
      }

      // Hoja 7: Compradores
      const compradoresData = cd.compradoresData || [];
      if (compradoresData.length > 0) {
        const data = compradoresData.map(c => ({
          Comprador: c.nombre, NIF: c.nif, Tipo: c.tipo,
          Ventas: c.numVentas, Kg: c.kg,
          'Total €': c.total, 'Última Venta': c.ultimaVenta
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Compradores');
      }

      // Hoja 8: Proveedores
      const proveedoresData = cd.proveedoresData || [];
      if (proveedoresData.length > 0) {
        const data = proveedoresData.map(p => ({
          Proveedor: p.nombre, NIF: p.nif,
          Facturas: p.numFacturas, 'Total €': p.total,
          'Última Compra': p.ultimaCompra,
          Categorias: Object.keys(p.categorias || {}).join(', ')
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Proveedores');
      }

      // Generar blob y compartir
      const nombre = `Livestock_${finca?.codigo_REGA || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      await this._exportarConCompartir(
        () => excelBlob,
        'Excel', nombre,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        null
      );
    } catch (e) {
      console.error('[Excel Export]', e);
      App.toastError("Error al exportar Excel");
    }
  },

  // ===================== EXPORTACIÓN PDF CON LOGO =====================

  async _exportPDFSeccion(seccion) {
    await this._exportPDF(seccion);
  },

  async _exportPDF(seccion) {
    let loader;
    try {
      // Crear overlay de carga con barra de proceso
      loader = document.createElement('div');
      loader.id = 'pdf-loader-overlay';
      loader.style.cssText = `
        position:fixed; top:0; left:0; right:0; bottom:0; z-index:100000;
        background:rgba(0,0,0,0.85); display:flex; flex-direction:column;
        align-items:center; justify-content:center; color:#fff; font-family:sans-serif;
      `;
      loader.innerHTML = `
        <div style="width:280px; text-align:center;">
          <div style="font-size:3rem; margin-bottom:20px; animation: bounce 2s infinite;">📄</div>
          <div style="font-weight:800; font-size:1.1rem; margin-bottom:8px;">Generando PDF</div>
          <div style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">Informe: ${seccion || 'Completo'}</div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; position:relative;">
            <div id="pdf-progress-bar" style="position:absolute; left:0; top:0; height:100%; width:10%; background:#c9851f; transition:width 0.4s ease; border-radius:10px;"></div>
          </div>
          <div id="pdf-progress-text" style="font-size:0.7rem; color:#888; margin-top:8px; font-weight:700;">PROCESANDO...</div>
        </div>
        <style>
          @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-20px);} 60% {transform: translateY(-10px);} }
        </style>
      `;
      document.body.appendChild(loader);

      const updateProgress = (pct, text) => {
        const bar = loader.querySelector('#pdf-progress-bar');
        const txt = loader.querySelector('#pdf-progress-text');
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = text.toUpperCase();
      };

      if (typeof html2pdf === 'undefined') {
        App.toastError("Librería PDF no disponible");
        loader.remove();
        this._exportFallback();
        return;
      }

      updateProgress(20, 'Cargando recursos...');
      const logoBase64 = await this._getLogoBase64();
      const finca = await Fincas.getActive();
      const d = this._cachedData;
      const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

      updateProgress(40, 'Generando contenido...');
      // Crear contenedor del PDF
      const pdfEl = document.createElement('div');
      pdfEl.style.cssText = 'position:absolute; left:0; top:0; width:800px; z-index:-1000; background:#fff; color:#000; overflow:visible; padding:30px; font-family:"Inter",system-ui,sans-serif;';
      const uid = `pdf-${Date.now()}`;

      // Generar secciones según el tipo
      let seccionesHtml = '';
      if (!seccion || seccion === 'general') {
        seccionesHtml += this._pdfSeccionEconomico(d, finca) + this._pdfSeccionCenso(d);
      }
      if (!seccion || seccion === 'carne') {
        seccionesHtml += this._pdfSeccionCarne(d);
      }
      if (!seccion || seccion === 'leche') {
        seccionesHtml += this._pdfSeccionLeche(d);
      }
      if (!seccion || seccion === 'reproductivo') {
        seccionesHtml += this._pdfSeccionReproductivo(d);
      }
      if (!seccion || seccion === 'sanidad') {
        seccionesHtml += this._pdfSeccionSanidad(d);
      }
      if (!seccion || seccion === 'censo') {
        seccionesHtml += this._pdfSeccionCenso(d);
      }
      if (!seccion || seccion === 'ventas') {
        seccionesHtml += this._pdfSeccionVentas(d);
      }
      if (!seccion || seccion === 'compradores') {
        seccionesHtml += this._pdfSeccionCompradores(d);
      }
      if (!seccion || seccion === 'proveedores') {
        seccionesHtml += this._pdfSeccionProveedores(d);
      }
      if (!seccion || seccion === 'fitosanitario') {
        seccionesHtml += this._pdfSeccionFitosanitario(d);
      }
      if (!seccion || seccion === 'alertas') {
        seccionesHtml += this._pdfSeccionAlertas(d);
      }
      if (!seccion || seccion === 'por-finca') {
        seccionesHtml += this._pdfSeccionPorFinca(d);
      }
      if (!seccion || seccion === 'rega') {
        seccionesHtml += this._pdfSeccionRega(d);
      }
      if (!seccion || seccion === 'pyg') {
        seccionesHtml += this._pdfSeccionPyG(d);
      }
      if (!seccion || seccion === 'coste-prod') {
        seccionesHtml += this._pdfSeccionCosteProd(d);
      }
      if (!seccion || seccion === 'eficiencia') {
        seccionesHtml += this._pdfSeccionEficiencia(d);
      }
      if (!seccion || seccion === 'cargas') {
        seccionesHtml += this._pdfSeccionCargas(d);
      }
      if (!seccion || seccion === 'rotacion') {
        seccionesHtml += this._pdfSeccionRotacion(d);
      }
      if (!seccion || seccion === 'flujo-caja') {
        seccionesHtml += this._pdfSeccionFlujoCaja(d);
      }
      if (!seccion || seccion === 'rent-esp') {
        seccionesHtml += this._pdfSeccionRentabilidadEspecie(d);
      }
      if (!seccion || seccion === 'curva-prod') {
        seccionesHtml += this._pdfSeccionCurvaProduccion(d);
      }
      if (!seccion || seccion === 'breakeven') {
        seccionesHtml += this._pdfSeccionBreakEven(d);
      }

      pdfEl.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #d97706; padding-bottom:18px; margin-bottom:20px; width:100%;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${logoBase64 ? `<img src="${logoBase64}" style="height:50px; width:auto;" alt="Logo">` : ''}
            <div>
              <h1 style="margin:0; font-size:1.3rem; font-weight:900; color:#d97706; text-transform:uppercase;">Livestock Manager</h1>
              <p style="margin:2px 0 0 0; font-size:0.7rem; color:#666;">${seccion ? seccion.charAt(0).toUpperCase() + seccion.slice(1) : 'Informe completo'}</p>
            </div>
          </div>
          <div style="text-align:right; font-size:0.7rem; color:#888;">
            <div><strong>${finca?.nombre || 'Explotación'}</strong></div>
            <div>REGA: ${finca?.codigo_REGA || 'N/D'}</div>
            <div>${fecha}</div>
          </div>
        </div>
        <div style="width:100%;">${seccionesHtml}</div>
        <div style="margin-top:30px; padding-top:12px; border-top:1px solid #ddd; text-align:center; font-size:0.65rem; color:#999; width:100%;">
          Informe generado por Livestock Manager Premium — ${fecha}
        </div>
      `;

      document.body.appendChild(pdfEl);

      // Añadir estilos anti-corte a todos los elementos del PDF
      pdfEl.querySelectorAll('.card, table, h3, h4, .report-section, [class*="border-top"]').forEach(el => {
        if (el) el.style.cssText += ';page-break-inside:avoid;';
      });

      updateProgress(70, 'Rasterizando PDF...');
      const opt = {
        margin: [12, 10, 12, 10],
        filename: `Livestock_${finca?.codigo_REGA || 'export'}_${seccion || 'completo'}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 800,
          scrollX: 0,
          scrollY: 0,
          height: pdfEl.scrollHeight,
          windowHeight: pdfEl.scrollHeight
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      const fileName = opt.filename;
      const seccionLabel = seccion || 'completo';

      // Usar el nuevo sistema de compartir
      await this._exportarConCompartir(
        async () => {
          const pdfBlob = await html2pdf().set(opt).from(pdfEl).toPdf().output('blob');
          document.body.removeChild(pdfEl);
          updateProgress(100, '¡Listo!');
          await new Promise(r => setTimeout(r, 400));
          loader.remove();
          return pdfBlob;
        },
        'PDF', fileName, 'application/pdf', seccionLabel
      );
    } catch (e) {
      console.error('[PDF Export]', e);
      App.toastError("Error al exportar PDF: " + e.message);
      if (loader) loader.remove();
      this._exportFallback();
    }
  },

  // ========= SECCIONES PDF =========

  _pdfSeccionEconomico(d) {
    const { rent } = d;
    if (!rent) return '';
    const balanceTotal = rent.balance || 0;
    return `
      <h3 style="color:#d97706; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">💰 Resumen Económico</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:15px;">
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Ingresos Cárnicos</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${(rent.detalles?.carne || 0).toLocaleString()} €</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Ingresos Lácteos</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${(rent.detalles?.leche || 0).toLocaleString()} €</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Total Gastos</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold; color:#cc0000;">${(rent.gastos || 0).toLocaleString()} €</td></tr>
        <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">BALANCE NETO</td><td style="padding:8px; text-align:right; font-weight:bold; font-size:1rem; color:${balanceTotal >= 0 ? '#10b981' : '#cc0000'};">${balanceTotal.toLocaleString()} €</td></tr>
      </table>
    `;
  },

  _pdfSeccionCarne(d) {
    const { rent, ventasHist } = d;
    const total = rent?.detalles?.carne || 0;
    const kgTotal = ventasHist.reduce((s, v) => s + (v.kg || 0), 0);
    return `
      <h3 style="color:#f59e0b; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🥩 Informe Cárnico</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:12px;">
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Ingresos Totales Carne</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${total.toLocaleString()} €</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Ventas Registradas</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right;">${ventasHist.length}</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Kilos Totales</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${kgTotal.toFixed(1)} kg</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Precio Medio por Kg</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${kgTotal > 0 ? (total / kgTotal).toFixed(2) : '0.00'} €</td></tr>
      </table>
      ${ventasHist.length > 0 ? `
      <table style="width:100%; border-collapse:collapse; font-size:0.7rem; margin-top:10px;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:6px; border-bottom:2px solid #ddd; text-align:left;">Fecha</th><th style="padding:6px; border-bottom:2px solid #ddd; text-align:center;">Kg</th><th style="padding:6px; border-bottom:2px solid #ddd; text-align:right;">Total</th></tr></thead>
        <tbody>${ventasHist.slice(0, 20).map(v => `<tr><td style="padding:4px 6px; border-bottom:1px solid #eee;">${v.fecha}</td><td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:center;">${v.kg || '-'}</td><td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right;">${(v.total || 0).toLocaleString()}€</td></tr>`).join('')}</tbody>
      </table>` : ''}
    `;
  },

  _pdfSeccionLeche(d) {
    const { lecheStats } = d;
    if (!lecheStats || lecheStats.totalLitros === 0) return '';
    return `
      <h3 style="color:#fbbf24; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🥛 Informe Lácteo</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:12px;">
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Total Litros Producidos</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${lecheStats.totalLitros.toFixed(1)} L</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Promedio Diario</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right;">${lecheStats.promedioDiario.toFixed(1)} L/día</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Precio Medio</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${lecheStats.precioMedio.toFixed(3)} €/L</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Registros</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right;">${lecheStats.totalRegistros}</td></tr>
      </table>
    `;
  },

  _pdfSeccionReproductivo(d) {
    const { kpisRepro } = d;
    return `
      <h3 style="color:#8b5cf6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🧬 Informe Reproductivo</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Tasa de Fertilidad</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${kpisRepro.tasaFertilidadPct || 0}%</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Intervalo Entre Partos</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right;">${kpisRepro.intervaloEntrePartosDias || 0} días</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Índice de Prolificidad</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${kpisRepro.indiceProlificidad || 0}</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Partos Analizados</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right;">${kpisRepro.totalPartosAnalizados || 0}</td></tr>
      </table>
    `;
  },

  _pdfSeccionSanidad(d) {
    const { estadisticasSanidad } = d;
    return `
      <h3 style="color:#ef4444; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">⚕️ Informe Sanitario</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Total Tratamientos</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${estadisticasSanidad.totalTratamientos || 0}</td></tr>
        <tr><td style="padding:6px 8px; border-bottom:1px solid #eee;">Supresiones Activas</td><td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold; color:#cc0000;">${estadisticasSanidad.retencionesActivas || 0}</td></tr>
      </table>
      ${estadisticasSanidad.porCategoria?.length > 0 ? `
      <table style="width:100%; border-collapse:collapse; font-size:0.7rem; margin-top:10px;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:6px; border-bottom:2px solid #ddd; text-align:left;">Categoría</th><th style="padding:6px; border-bottom:2px solid #ddd; text-align:right;">Cantidad</th></tr></thead>
        <tbody>${estadisticasSanidad.porCategoria.map(c => `<tr><td style="padding:4px 6px; border-bottom:1px solid #eee;">${c.categoria}</td><td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right;">${c.cantidad}</td></tr>`).join('')}</tbody>
      </table>` : ''}
    `;
  },

  _pdfSeccionCenso(d) {
    const { censo } = d;
    if (!censo?.length) return '';
    const totalAnimales = censo.reduce((s, r) => s + r.total, 0);
    return `
      <h3 style="color:#000; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🐑 Censo de Animales</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:6px 8px; border-bottom:2px solid #d97706; text-align:left;">Rebaño</th><th style="padding:6px 8px; border-bottom:2px solid #d97706; text-align:center;">Total</th><th style="padding:6px 8px; border-bottom:2px solid #d97706; text-align:center;">Activos</th><th style="padding:6px 8px; border-bottom:2px solid #d97706; text-align:center;">Vendidos</th></tr></thead>
        <tbody>${censo.map(r => `<tr><td style="padding:4px 6px; border-bottom:1px solid #eee;">${r.nombre}</td><td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:center; font-weight:bold;">${r.total}</td><td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:center;">${r.activos}</td><td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:center;">${r.vendidos}</td></tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f9f9f9;"><td style="padding:6px 8px; font-weight:bold;">TOTAL</td><td style="padding:6px 8px; text-align:center; font-weight:bold;">${totalAnimales}</td><td style="padding:6px 8px; text-align:center;">${censo.reduce((s, r) => s + r.activos, 0)}</td><td style="padding:6px 8px; text-align:center;">${censo.reduce((s, r) => s + r.vendidos, 0)}</td></tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionVentas(d) {
    const { ventasCompleto, docsLegales } = d;
    if (!ventasCompleto?.length) return '';
    const ventas = ventasCompleto.sort((a, b) => new Date(b.fechaSacrificio || b.fecha_emision || 0) - new Date(a.fechaSacrificio || a.fecha_emision || 0));
    const totalKg = ventas.reduce((s, v) => s + (v.pesoCanal || v.pesoVivo || 0), 0);
    const totalImporte = ventas.reduce((s, v) => s + (v.precio_total || 0), 0);
    const totalIVA = ventas.reduce((s, v) => s + (v.importe_iva || 0), 0);
    return `
      <h3 style="color:#3b82f6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">📒 Libro de Ventas</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.7rem; margin-bottom:10px;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:left;">Fecha</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:left;">Albarán</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:left;">Comprador</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:right;">Kg</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:right;">Base</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:right;">IVA</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:right;">Total</th>
        </tr></thead>
        <tbody>${ventas.slice(0, 50).map(v => `
          <tr><td style="padding:4px 6px; border-bottom:1px solid #eee;">${v.fechaSacrificio || v.fecha_emision || '-'}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee;">${v.numero_albaran || '-'}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee;">${v.razonSocial || v.nombreComprador || '-'}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right;">${(v.pesoCanal || v.pesoVivo || 0).toFixed(1)}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right;">${((v.precio_total || 0) - (v.importe_iva || 0)).toFixed(2)}€</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right;">${(v.importe_iva || 0).toFixed(2)}€</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${(v.precio_total || 0).toFixed(2)}€</td>
        </tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f5f5f5;">
          <td colspan="3" style="padding:8px; font-weight:bold; text-align:right;">TOTALES</td>
          <td style="padding:8px; text-align:right; font-weight:bold;">${totalKg.toFixed(1)}</td>
          <td style="padding:8px; text-align:right; font-weight:bold;">${(totalImporte - totalIVA).toFixed(2)}€</td>
          <td style="padding:8px; text-align:right; font-weight:bold;">${totalIVA.toFixed(2)}€</td>
          <td style="padding:8px; text-align:right; font-weight:bold; font-size:0.9rem;">${totalImporte.toFixed(2)}€</td>
        </tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionRega(d) {
    const { finca, animales, rebanos, eventos, censo } = d;
    if (!finca) return '';
    const totalAnimales = (animales || []).length;
    const activos = (animales || []).filter(a => a.estado === 'activo' || a.estado === 'Activo').length;
    const movimientos = (eventos || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 20);
    const porEspecie = {};
    (animales || []).forEach(a => {
      const esp = a.especie || 'Sin especie';
      porEspecie[esp] = (porEspecie[esp] || 0) + 1;
    });
    return `
      <h3 style="color:#d97706; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">📋 INFORME REGA</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Nombre Explotación</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.nombre || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">REGA</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.codigo_REGA || finca.rega || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">CEA</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.codigo_CEA || finca.cea || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Propietario</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.propietario || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">NIF/CIF</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.nif_cif || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Dirección</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.direccion || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Municipio / Provincia</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.municipio || ''} / ${finca.provincia || ''}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Comunidad Autónoma</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.comunidad_autonoma || finca.comunidad || 'N/D'}</td></tr>
      </table>

      <h4 style="color:#10b981; border-bottom:1px solid #ddd; padding-bottom:3px; margin-top:15px;">🐑 Resumen Censo</h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Total Animales</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${totalAnimales}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Animales Activos</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#10b981;">${activos}</td></tr>
        ${Object.entries(porEspecie).map(([esp, cnt]) => `
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">&nbsp;&nbsp;— ${esp}</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${cnt}</td></tr>
        `).join('')}
      </table>

      ${rebanos?.length > 0 ? `
      <h4 style="color:#f59e0b; border-bottom:1px solid #ddd; padding-bottom:3px; margin-top:15px;">📦 Detalle por Rebaño</h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem; margin-bottom:10px;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:4px 6px; border-bottom:2px solid #f59e0b; text-align:left;">Rebaño</th>
          <th style="padding:4px 6px; border-bottom:2px solid #f59e0b; text-align:center;">Total</th>
          <th style="padding:4px 6px; border-bottom:2px solid #f59e0b; text-align:center;">Activos</th>
        </tr></thead>
        <tbody>${rebanos.map(r => {
          const cnt = (animales || []).filter(a => Number(a.rebanoId) === Number(r.id)).length;
          const act = (animales || []).filter(a => Number(a.rebanoId) === Number(r.id) && (a.estado === 'activo' || a.estado === 'Activo')).length;
          return `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;">${r.nombre}</td>
            <td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center; font-weight:bold;">${cnt}</td>
            <td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center;">${act}</td></tr>`;
        }).join('')}</tbody>
      </table>` : ''}

      ${movimientos.length > 0 ? `
      <h4 style="color:#8b5cf6; border-bottom:1px solid #ddd; padding-bottom:3px; margin-top:15px;">📦 Últimos Movimientos</h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.7rem; margin-bottom:10px;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:4px 6px; border-bottom:2px solid #8b5cf6; text-align:left;">Fecha</th>
          <th style="padding:4px 6px; border-bottom:2px solid #8b5cf6; text-align:left;">Tipo</th>
          <th style="padding:4px 6px; border-bottom:2px solid #8b5cf6; text-align:left;">Motivo</th>
        </tr></thead>
        <tbody>${movimientos.map(e => `
          <tr><td style="padding:3px 6px; border-bottom:1px solid #eee;">${e.fecha || '-'}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #eee;">${e.motivo_tarea || '-'}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #eee;">${e.observaciones?.substring(0, 40) || '-'}</td></tr>
        `).join('')}</tbody>
      </table>` : ''}
    `;
  },

  // ========= SECCIONES PDF NUEVAS =========

  _pdfSeccionCompradores(d) {
    const { compradoresData } = d;
    const data = compradoresData || [];
    if (!data.length) return '';
    const totalIngresos = data.reduce((s, c) => s + c.total, 0);
    const totalKg = data.reduce((s, c) => s + c.kg, 0);
    return `
      <h3 style="color:#3b82f6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🏢 Informe por Comprador</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:left;">Comprador</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:left;">NIF</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:center;">Ventas</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:right;">Kg</th>
          <th style="padding:6px; border-bottom:2px solid #3b82f6; text-align:right;">Total</th>
        </tr></thead>
        <tbody>${data.map(c => `
          <tr><td style="padding:4px 6px; border-bottom:1px solid #eee;"><strong>${c.nombre}</strong></td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee;">${c.nif || '-'}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:center;">${c.numVentas}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right;">${c.kg.toFixed(1)}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${c.total.toLocaleString()}€</td>
        </tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f5f5f5;">
          <td colspan="2" style="padding:8px; font-weight:bold; text-align:right;">TOTALES</td>
          <td style="padding:8px; text-align:center; font-weight:bold;">${data.reduce((s, c) => s + c.numVentas, 0)}</td>
          <td style="padding:8px; text-align:right; font-weight:bold;">${totalKg.toFixed(1)}</td>
          <td style="padding:8px; text-align:right; font-weight:bold; font-size:0.9rem;">${totalIngresos.toLocaleString()}€</td>
        </tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionProveedores(d) {
    const { proveedoresData } = d;
    const data = proveedoresData || [];
    if (!data.length) return '';
    const totalGasto = data.reduce((s, p) => s + p.total, 0);
    return `
      <h3 style="color:#f59e0b; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">📦 Informe por Proveedor</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:6px; border-bottom:2px solid #f59e0b; text-align:left;">Proveedor</th>
          <th style="padding:6px; border-bottom:2px solid #f59e0b; text-align:center;">Facturas</th>
          <th style="padding:6px; border-bottom:2px solid #f59e0b; text-align:right;">Total</th>
        </tr></thead>
        <tbody>${data.map(p => `
          <tr><td style="padding:4px 6px; border-bottom:1px solid #eee;"><strong>${p.nombre}</strong></td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:center;">${p.numFacturas}</td>
          <td style="padding:4px 6px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${p.total.toLocaleString()}€</td>
        </tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f5f5f5;">
          <td style="padding:8px; font-weight:bold; text-align:right;">TOTALES</td>
          <td style="padding:8px; text-align:center; font-weight:bold;">${data.reduce((s, p) => s + p.numFacturas, 0)}</td>
          <td style="padding:8px; text-align:right; font-weight:bold; font-size:0.9rem;">${totalGasto.toLocaleString()}€</td>
        </tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionFitosanitario(d) {
    const { fitosanitarioData } = d;
    const data = fitosanitarioData || { registros: [], total: 0 };
    if (!data.registros.length) return '';
    return `
      <h3 style="color:#10b981; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🧪 Informe Fitosanitario</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem; margin-bottom:10px;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:6px; border-bottom:2px solid #10b981; text-align:left;">Fecha</th>
          <th style="padding:6px; border-bottom:2px solid #10b981; text-align:left;">Proveedor</th>
          <th style="padding:6px; border-bottom:2px solid #10b981; text-align:left;">Producto</th>
          <th style="padding:6px; border-bottom:2px solid #10b981; text-align:right;">Monto</th>
        </tr></thead>
        <tbody>${data.registros.slice(0, 30).map(r => `
          <tr><td style="padding:3px 6px; border-bottom:1px solid #eee;">${r.fecha || '-'}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #eee;">${r.proveedor || '-'}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #eee;">${r.descripcion || '-'}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${(r.monto || 0).toLocaleString()}€</td>
        </tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f5f5f5;">
          <td colspan="3" style="padding:6px; font-weight:bold; text-align:right;">TOTAL</td>
          <td style="padding:6px; text-align:right; font-weight:bold;">${data.total.toLocaleString()}€</td>
        </tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionAlertas(d) {
    const { alertasData } = d;
    const alertas = alertasData || { sanitarias: [], trazabilidad: [], administrativas: [], calendario: { titulo: '', sugerencias: [] } };
    const totalAlertas = (alertas.sanitarias?.length || 0) + (alertas.trazabilidad?.length || 0) + (alertas.administrativas?.length || 0);
    if (!totalAlertas) return '';
    const rojas = (alertas.sanitarias?.filter(a => a.urgencia === 'rojo').length || 0) +
                  (alertas.trazabilidad?.filter(a => a.urgencia === 'rojo').length || 0) +
                  (alertas.administrativas?.filter(a => a.urgencia === 'rojo').length || 0);
    let html = `
      <h3 style="color:#ef4444; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🚨 Informe de Alertas</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Total Alertas Activas</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#cc0000; font-weight:bold;">${totalAlertas}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Críticas (🔴)</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#cc0000;">${rojas}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Advertencias (🟡/🟢)</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${totalAlertas - rojas}</td></tr>
      </table>`;
    if (alertas.sanitarias?.length > 0) {
      html += `<h4 style="color:#ef4444;">🔴 Sanitarias</h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.7rem; margin-bottom:10px;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Medicamento</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Rebaño</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Días</th></tr></thead>
        <tbody>${alertas.sanitarias.slice(0, 10).map(a => `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;">${a.medicamento || '-'}</td><td style="padding:3px 6px; border-bottom:1px solid #eee;">${a.rebanoNombre || '-'}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${a.diasRestantes}</td></tr>`).join('')}</tbody>
      </table>`;
    }
    if (alertas.trazabilidad?.length > 0) {
      html += `<h4 style="color:#f59e0b;">🟠 Trazabilidad</h4>
      <p style="font-size:0.7rem; color:#666;">${alertas.trazabilidad.length} alertas activas. Revisar identificaciones y documentación.</p>`;
    }
    if (alertas.administrativas?.length > 0) {
      html += `<h4 style="color:#8b5cf6;">🟣 Administrativas</h4>
      <p style="font-size:0.7rem; color:#666;">${alertas.administrativas.length} alertas activas. Revisar contratos, PAC y vencimientos.</p>`;
    }
    return html;
  },

  _pdfSeccionPorFinca(d) {
    const { finca, rent, animales, rebanos } = d;
    if (!finca) return '';
    const balanceTotal = rent?.balance || 0;
    const totalAnimales = (animales || []).length;
    const activos = (animales || []).filter(a => a.estado === 'activo' || a.estado === 'Activo').length;
    return `
      <h3 style="color:#d97706; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🏠 Ficha de Explotación</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Nombre</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.nombre || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">REGA</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.codigo_REGA || finca.rega || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Propietario</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.propietario || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Municipio</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.municipio || ''}, ${finca.provincia || ''}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">CCAA</td><td style="padding:4px 8px; border-bottom:1px solid #eee;">${finca.comunidad_autonoma || finca.comunidad || 'N/D'}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Censo Total</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${totalAnimales}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Animales Activos</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#10b981;">${activos}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Rebaños</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${(rebanos || []).length}</td></tr>
      </table>
      ${rent ? `
      <h4 style="color:#10b981; border-bottom:1px solid #ddd; padding-bottom:3px; margin-top:15px;">💰 Resumen Económico</h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Ingresos Totales</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${(rent.ingresos || 0).toLocaleString()}€</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Gastos Totales</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold; color:#cc0000;">${(rent.gastos || 0).toLocaleString()}€</td></tr>
        <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">BALANCE NETO</td><td style="padding:8px; text-align:right; font-weight:bold; font-size:0.9rem; color:${balanceTotal >= 0 ? '#10b981' : '#cc0000'};">${balanceTotal.toLocaleString()}€</td></tr>
      </table>` : ''}
    `;
  },

  // ========= SECCIONES PDF NUEVOS INFORMES =========

  _pdfSeccionPyG(d) {
    const { pygData } = d;
    if (!pygData || pygData.totalIngresos === 0) return '';
    return `
      <h3 style="color:#10b981; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">💰 Cuenta de Resultados</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Total Ingresos</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${pygData.totalIngresos.toLocaleString()}€</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Total Gastos</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#cc0000;">${pygData.totalGastos.toLocaleString()}€</td></tr>
        <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">BALANCE NETO</td><td style="padding:8px; text-align:right; font-weight:bold; font-size:0.9rem; color:${pygData.totalBalance >= 0 ? '#10b981' : '#cc0000'};">${pygData.totalBalance.toLocaleString()}€</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Rentabilidad</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${pygData.rentabilidad}%</td></tr>
      </table>
      ${pygData.gastosPorCategoria?.length > 0 ? `
      <h4 style="color:#ef4444; border-bottom:1px solid #ddd; padding-bottom:3px; margin-top:12px;">Gastos por Categoría</h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Categoría</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Total</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">%</th></tr></thead>
        <tbody>${pygData.gastosPorCategoria.map(g => `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;">${g.categoria}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${g.total.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${pygData.totalGastos > 0 ? ((g.total / pygData.totalGastos) * 100).toFixed(1) : 0}%</td></tr>`).join('')}</tbody>
      </table>` : ''}
    `;
  },

  _pdfSeccionCosteProd(d) {
    const { costeProdData } = d;
    if (!costeProdData?.porRebano?.length) return '';
    return `
      <h3 style="color:#8b5cf6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🐄 Coste de Producción por Animal</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Rebaño</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:center;">Animales</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Gasto Total</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">€/Cabeza</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">€/Día</th></tr></thead>
        <tbody>${costeProdData.porRebano.map(r => `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;"><strong>${r.nombre}</strong> (${r.especie})</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center;">${r.numAnimales}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${r.totalGasto.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${r.costePorCabeza.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${r.costePorDia}€</td></tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f9f9f9;"><td style="padding:6px; font-weight:bold;">MEDIA GLOBAL</td><td style="padding:6px; text-align:center; font-weight:bold;">${costeProdData.totalAnimales}</td><td style="padding:6px; text-align:right; font-weight:bold;">${costeProdData.totalGasto.toLocaleString()}€</td><td style="padding:6px; text-align:right; font-weight:bold;">${costeProdData.costeMedioCabeza.toLocaleString()}€</td><td style="padding:6px; text-align:right; font-weight:bold;">${costeProdData.costeMedioDia}€</td></tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionEficiencia(d) {
    const { eficienciaData } = d;
    if (!eficienciaData?.kpis?.length) return '';
    const semaforoPdf = (s) => s === 'verde' ? '#10b981' : s === 'amarillo' ? '#f59e0b' : '#cc0000';
    return `
      <h3 style="color:#3b82f6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">📊 Panel de Eficiencia Técnica</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        ${eficienciaData.kpis.map(k => `<tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">${k.label}</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold; color:${semaforoPdf(k.status)};">${k.value}</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#888;">Obj: ${k.objetivo}${k.unidad}</td></tr>`).join('')}
      </table>
      <p style="font-size:0.65rem; color:#888;">🟢 Óptimo · 🟡 Alerta · 🔴 Crítico</p>
    `;
  },

  _pdfSeccionCargas(d) {
    const { cargasData } = d;
    if (!cargasData?.porZona?.length) return '';
    return `
      <h3 style="color:#f59e0b; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">📐 Cargas y Aforos</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Zona</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:center;">Aforo</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:center;">Ocupación</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:center;">%</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:center;">Estado</th></tr></thead>
        <tbody>${cargasData.porZona.map(z => `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;"><strong>${z.nombre}</strong></td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center;">${z.aforo}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center;">${z.ocupacion}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center;">${z.pctOcupacion}%</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center;">${z.estado}</td></tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f9f9f9;"><td style="padding:6px; font-weight:bold;">TOTAL</td><td style="padding:6px; text-align:center; font-weight:bold;">${cargasData.totalAforo}</td><td style="padding:6px; text-align:center; font-weight:bold;">${cargasData.totalOcupacion}</td><td style="padding:6px; text-align:center; font-weight:bold;">${cargasData.pctGlobal}%</td><td style="padding:6px; text-align:center;">${cargasData.numAlertas > 0 ? '⚠️ ' + cargasData.numAlertas + ' alertas' : '✅'}</td></tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionRotacion(d) {
    const { rotacionData } = d;
    if (!rotacionData || rotacionData.totalAnimales === 0) return '';
    const u90 = rotacionData.ultimos90 || {};
    return `
      <h3 style="color:#3b82f6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🔄 Rotación de Censo (${rotacionData.periodo})</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:8px;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Censo Total</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${rotacionData.totalAnimales}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Animales Activos</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${rotacionData.activos}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Nacimientos</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#10b981;">${u90.nacimientos || 0}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Compras</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#3b82f6;">${u90.compras || 0}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Ventas</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#cc0000;">${u90.ventas || 0}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Bajas</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; color:#888;">${u90.bajas || 0}</td></tr>
        <tr style="background:#f5f5f5;"><td style="padding:8px; font-weight:bold;">Entrada Neta</td><td style="padding:8px; text-align:right; font-weight:bold; font-size:0.9rem; color:${(u90.entradaNeta || 0) >= 0 ? '#10b981' : '#cc0000'};">${(u90.entradaNeta >= 0 ? '+' : '')}${u90.entradaNeta || 0}</td></tr>
      </table>
      <p style="font-size:0.65rem; color:#888;">Tasa reposición: ${rotacionData.tasaReposicion} · Tasa bajas: ${rotacionData.tasaBajas}</p>
    `;
  },

  _pdfSeccionFlujoCaja(d) {
    const { flujoCajaData } = d;
    if (!flujoCajaData?.porMes?.length) return '';
    const meses = flujoCajaData.porMes.filter(m => m.entradas > 0 || m.salidas > 0);
    if (!meses.length) return '';
    return `
      <h3 style="color:#14b8a6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">📈 Flujo de Caja</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Mes</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Entradas</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Salidas</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Neto</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Acumulado</th></tr></thead>
        <tbody>${meses.map(m => `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;"><strong>${m.mes}</strong></td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${m.entradas.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${m.salidas.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right; color:${m.neto >= 0 ? '#10b981' : '#cc0000'};">${m.neto.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${m.acumulado.toLocaleString()}€</td></tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f9f9f9;"><td style="padding:6px; font-weight:bold;">TOTAL</td><td style="padding:6px; text-align:right; font-weight:bold;">${flujoCajaData.totalEntradas.toLocaleString()}€</td><td style="padding:6px; text-align:right; font-weight:bold;">${flujoCajaData.totalSalidas.toLocaleString()}€</td><td style="padding:6px; text-align:right; font-weight:bold; color:${flujoCajaData.totalNeto >= 0 ? '#10b981' : '#cc0000'};">${flujoCajaData.totalNeto.toLocaleString()}€</td><td style="padding:6px; text-align:right; font-weight:bold;">${flujoCajaData.saldoFinal.toLocaleString()}€</td></tr></tfoot>
      </table>
    `;
  },

  // ========= SECCIONES PDF RENTABILIDAD ESPECIE, CURVA PRODUCCIÓN, BREAK-EVEN =========

  _pdfSeccionRentabilidadEspecie(d) {
    const { rentEspData } = d;
    if (!rentEspData?.porEspecie?.length) return '';
    return `
      <h3 style="color:#8b5cf6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">🧬 Rentabilidad por Especie</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Especie</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:center;">Animales</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Ingresos</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Gastos</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Balance</th></tr></thead>
        <tbody>${rentEspData.porEspecie.map(e => `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;"><strong>${e.especie}</strong></td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:center;">${e.numAnimales}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${e.ingresos.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${e.gastos.toLocaleString()}€</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right; font-weight:bold; color:${e.balance >= 0 ? '#10b981' : '#cc0000'};">${e.balance.toLocaleString()}€</td></tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f9f9f9;"><td style="padding:6px; font-weight:bold;">TOTAL</td><td style="padding:6px; text-align:center; font-weight:bold;">${rentEspData.porEspecie.reduce((s, e) => s + e.numAnimales, 0)}</td><td style="padding:6px; text-align:right; font-weight:bold;">${rentEspData.totalIngresos.toLocaleString()}€</td><td style="padding:6px; text-align:right; font-weight:bold;">${rentEspData.totalGastos.toLocaleString()}€</td><td style="padding:6px; text-align:right; font-weight:bold; color:${rentEspData.totalBalance >= 0 ? '#10b981' : '#cc0000'};">${rentEspData.totalBalance.toLocaleString()}€</td></tr></tfoot>
      </table>
    `;
  },

  _pdfSeccionCurvaProduccion(d) {
    const { curvaProdData } = d;
    if (!curvaProdData?.porMes?.length) return '';
    return `
      <h3 style="color:#3b82f6; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">📉 Curva de Producción</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.7rem;">
        <thead><tr style="background:#f0f0f0;"><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;">Mes</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Kg</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Litros</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Kg Acum</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">L Acum</th><th style="padding:4px 6px; border-bottom:1px solid #ddd; text-align:right;">Ingresos</th></tr></thead>
        <tbody>${curvaProdData.porMes.map(m => `<tr><td style="padding:3px 6px; border-bottom:1px solid #eee;"><strong>${m.mes}</strong></td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${m.kg.toFixed(1)}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${m.litros.toFixed(1)}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${m.kgAcum.toFixed(1)}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${m.litrosAcum.toFixed(1)}</td><td style="padding:3px 6px; border-bottom:1px solid #eee; text-align:right;">${m.ingresos.toLocaleString()}€</td></tr>`).join('')}</tbody>
        <tfoot><tr style="background:#f9f9f9;"><td style="padding:6px; font-weight:bold;">TOTAL</td><td style="padding:6px; text-align:right; font-weight:bold;">${curvaProdData.totalKg.toFixed(1)}</td><td style="padding:6px; text-align:right; font-weight:bold;">${curvaProdData.totalLitros.toFixed(1)}</td><td style="padding:6px; text-align:right; font-weight:bold;">—</td><td style="padding:6px; text-align:right; font-weight:bold;">—</td><td style="padding:6px; text-align:right; font-weight:bold;">${curvaProdData.totalIngresos.toLocaleString()}€</td></tr></tfoot>
      </table>
      <p style="font-size:0.65rem; color:#888;">Meta kg: ${Math.round(curvaProdData.metaKg)} · Meta litros: ${Math.round(curvaProdData.metaLitros)} · Cumplimiento: ${curvaProdData.pctCumplimientoKg}% kg / ${curvaProdData.pctCumplimientoLitros}% L</p>
    `;
  },

  _pdfSeccionBreakEven(d) {
    const { breakEvenData } = d;
    if (!breakEvenData || breakEvenData.ingresosTotal === 0) return '';
    return `
      <h3 style="color:#ef4444; border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:20px;">⚖️ Análisis de Punto Muerto (Break-Even)</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:10px;">
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Costes Fijos</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${breakEvenData.costesFijos.toLocaleString()}€</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Costes Variables</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${breakEvenData.costesVariables.toLocaleString()}€</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Break-Even Carne</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${breakEvenData.breakEvenKg} kg <span style="color:${breakEvenData.cubiertoCarne ? '#10b981' : '#cc0000'};">(${breakEvenData.cubiertoCarne ? '✅ Cubierto' : '❌ No cubierto'})</span></td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee; font-weight:bold;">Break-Even Leche</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">${breakEvenData.breakEvenLitros} L <span style="color:${breakEvenData.cubiertoLeche ? '#10b981' : '#cc0000'};">(${breakEvenData.cubiertoLeche ? '✅ Cubierto' : '❌ No cubierto'})</span></td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Margen Seguridad Carne</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${breakEvenData.margenSeguridadKg}</td></tr>
        <tr><td style="padding:4px 8px; border-bottom:1px solid #eee;">Margen Seguridad Leche</td><td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${breakEvenData.margenSeguridadLitros}</td></tr>
      </table>
    `;
  },

  // ========= LOGO Y FALLBACK =========

  // ===================== HERRAMIENTA COMPARTIR CON BOTÓN FLOTANTE =====================

  _btnFlotanteEl: null,
  _btnFlotanteTimeout: null,

  /** Muestra un botón flotante "Compartir" que preserva el gesto del usuario */
  _mostrarBotonFlotante(fileObj) {
    this._ocultarBotonFlotante();
    // Guardar en global para que el botón lo use
    window.__shareFile = fileObj;

    const el = document.createElement('div');
    el.id = 'floating-share-btn';
    el.style.cssText = `
      position:fixed; bottom:140px; left:50%; transform:translateX(-50%);
      z-index:9999; background:linear-gradient(135deg,#d97706,#b45309);
      color:#fff; border:none; border-radius:50px;
      padding:16px 28px; font-size:1rem; font-weight:900;
      box-shadow:0 8px 32px rgba(217,119,6,0.5);
      cursor:pointer; display:flex; align-items:center; gap:10px;
      animation:fadeInUp 0.3s ease-out;
      letter-spacing:0.3px;
    `;
    el.innerHTML = `📤 Compartir ${fileObj.titulo}`;
    el.onclick = async () => {
      el.innerHTML = '⏳ Compartiendo...';
      el.style.pointerEvents = 'none';
      await this._ejecutarShare(fileObj);
      this._ocultarBotonFlotante();
    };
    document.body.appendChild(el);
    this._btnFlotanteEl = el;

    // Auto-ocultar tras 30s
    this._btnFlotanteTimeout = setTimeout(() => this._ocultarBotonFlotante(), 30000);
  },

  _ocultarBotonFlotante() {
    if (this._btnFlotanteTimeout) {
      clearTimeout(this._btnFlotanteTimeout);
      this._btnFlotanteTimeout = null;
    }
    if (this._btnFlotanteEl) {
      this._btnFlotanteEl.remove();
      this._btnFlotanteEl = null;
    }
    window.__shareFile = null;
  },

  /** Intenta compartir por todos los medios disponibles */
  async _ejecutarShare(fileObj) {
    const { blob, fileName, mimeType, titulo, shareTitle, shareText } = fileObj;

    // 1️⃣ Capacitor Native Share (Android nativo)
    try {
      const cap = window.Capacitor;
      const fsPlugin = cap?.Plugins?.Filesystem;
      const sharePlugin = cap?.Plugins?.Share;
      if (fsPlugin && sharePlugin) {
        const dataUri = await this._blobToBase64(blob);
        const result = await fsPlugin.writeFile({
          path: fileName,
          data: dataUri.split(',')[1],
          directory: 'CACHE'
        });
        await sharePlugin.share({
          title: shareTitle || 'Livestock Manager',
          text: shareText || '',
          url: result.uri,
          dialogTitle: `Compartir ${titulo} con…`
        });
        App.toast(`${titulo} compartido ✅`);
        return true;
      }
    } catch (e) {
      console.warn(`[Capacitor Share ${titulo}]`, e?.message || e);
    }

    // 2️⃣ navigator.share (Web/PWA)
    try {
      if (navigator.share) {
        const file = new File([blob], fileName, { type: mimeType });
        await navigator.share({
          title: shareTitle || 'Livestock Manager',
          text: shareText || '',
          files: [file]
        });
        App.toast(`${titulo} compartido ✅`);
        return true;
      }
    } catch (e) {
      if (e.name === 'AbortError') return true; // usuario canceló
      console.warn(`[navigator.share ${titulo}]`, e?.message || e);
    }

    // 3️⃣ Fallback: descarga directa
    App.toast(`Descargando ${titulo}...`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    App.toast(`${titulo} descargado ✅`);
    return false;
  },

  /** Simplifica la exportación: genera blob y muestra botón flotante */
  async _exportarConCompartir(generador, titulo, fileName, mimeType, seccion) {
    App.toast(`Generando ${titulo}...`);
    try {
      const blob = await generador();
      App.toast(`${titulo} listo ✅`);

      const finca = await window.Fincas?.getActive().catch(() => null) || null;
      const shareTitle = 'Informe Livestock Manager';
      const shareText = `Informe ${seccion || 'completo'} — ${finca?.nombre || 'Explotación'}`;
      const fileObj = { blob, fileName, mimeType, titulo, seccion, shareTitle, shareText };

      // Intentar compartir directamente con Capacitor (no necesita gesto)
      const exito = await this._ejecutarShare(fileObj);
      if (!exito) {
        // Mostrar botón flotante para reintentar con gesto fresco
        this._mostrarBotonFlotante(fileObj);
        App.toast(`Toca "Compartir ${titulo}" para enviar`);
      }
    } catch (e) {
      console.error(`[Exportar ${titulo}]`, e);
      App.toastError(`Error al generar ${titulo}`);
    }
  },

  async _getLogoBase64() {
    try {
      const resp = await fetch('icons/Logo SDOGFARMCORE.png');
      if (!resp.ok) {
        const resp2 = await fetch('icons/Logo aplicación.png');
        if (!resp2.ok) return null;
        return await this._blobToBase64(await resp2.blob());
      }
      return await this._blobToBase64(await resp.blob());
    } catch (e) { return null; }
  },

  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  },

  // ==========================================
  // TAB: EXPORTACIÓN OFICIAL (REGA / SIA / PIGGAN)
  // ==========================================
  _renderExportar(content, d) {
    if (!window.ExportService) {
      content.innerHTML = `<div class="card empty-state">📤 ExportService no disponible. Recarga la aplicación.</div>`;
      return;
    }

    content.innerHTML = `
    <div class="mb-20">
      <h3 class="text-gold mb-6">📤 Exportación Oficial</h3>
      <p class="text-gray text-sm">Genera ficheros compatibles con REGA, SIA/PIGGAN y plataformas autonómicas.</p>
    </div>
    <div class="grid gap-15">
      <div class="card card-left-amber">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-white mb-4">📋 REGA — Censo y Explotación</h4>
            <p class="text-gray text-xs m-0">CSV del censo actual + XML estructurado con datos de la explotación. Compatible con SIGGAN/BADIGEX.</p>
          </div>
          <button class="btn btn-primary btn-download" onclick="InformesView._exportREGA()" style="background:#f59e0b;">⬇ Descargar</button>
        </div>
      </div>
      <div class="card card-left-blue">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-white mb-4">🔄 SIA/PIGGAN — Movimientos</h4>
            <p class="text-gray text-xs m-0">CSV de altas, bajas y expediciones. Incluye crotal, especie, motivo y destino/origen.</p>
          </div>
          <button class="btn btn-primary btn-download" onclick="InformesView._exportMovimientos()" style="background:#3b82f6;">⬇ Descargar</button>
        </div>
      </div>
      <div class="card card-left-green">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-white mb-4">📊 PIGGAN — Producción</h4>
            <p class="text-gray text-xs m-0">CSV de producción láctea (litros, calidad) y cárnica (peso canal, precio).</p>
          </div>
          <button class="btn btn-primary btn-download" onclick="InformesView._exportProduccion()" style="background:#10b981;">⬇ Descargar</button>
        </div>
      </div>
      <div class="card card-left-purple" style="background:rgba(139,92,246,0.05);">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-white mb-4">📦 Exportación Completa</h4>
            <p class="text-gray text-xs m-0">Descarga todos los ficheros: REGA (CSV+XML), movimientos SIA y producción PIGGAN.</p>
          </div>
          <button class="btn btn-primary btn-download" onclick="InformesView._exportCompleto()" style="background:linear-gradient(135deg,#7c3aed,#8b5cf6);">⬇ Todo</button>
        </div>
      </div>
    </div>
    <div class="inf-export-note">
      <strong class="text-gold">ℹ️ Formatos:</strong> CSV (Excel/LibreOffice, UTF-8 BOM) y XML (SIGGAN/BADIGEX). Los nombres incluyen REGA + fecha.
    </div>`;
  },

  // =========== EXPORT HANDLERS ===========
  async _exportREGA() {
    const d = InformesView._cachedData;
    if (!d || !window.ExportService) return App.toastError('Datos no disponibles');
    App.toast('Generando exportación REGA...');
    await ExportService.exportarREGA(d.finca, d.animales, d.rebanos);
  },
  async _exportMovimientos() {
    const d = InformesView._cachedData;
    if (!d || !window.ExportService) return App.toastError('Datos no disponibles');
    App.toast('Generando exportación movimientos...');
    await ExportService.exportarMovimientos(d.eventos, d.animales, d.finca);
  },
  async _exportProduccion() {
    const d = InformesView._cachedData;
    if (!d || !window.ExportService) return App.toastError('Datos no disponibles');
    const prodLeche = InformesView._cachedLeche || [];
    App.toast('Generando exportación producción...');
    await ExportService.exportarProduccion(prodLeche, d.ventasCompleto || []);
  },
  async _exportCompleto() {
    const d = InformesView._cachedData;
    if (!d || !window.ExportService) return App.toastError('Datos no disponibles');
    const prodLeche = InformesView._cachedLeche || [];
    App.toast('Generando exportación completa...');
    await ExportService.exportarCompleto(d.finca, d.animales, d.rebanos, d.eventos, prodLeche, d.ventasCompleto || []);
  },

  _exportFallback() {
    App.toast("Abriendo vista de impresión...");
    Fincas.getActive().then(f => {
      const win = window.open('', '_blank');
      if (!win) { App.toastError("Bloqueador de pop-ups activo"); return; }
      win.document.write(`<html><head><title>Informe Livestock Manager</title>
        <style>body{font-family:"Inter",system-ui,sans-serif;padding:30px;color:#000;background:#fff;}
        table{width:100%;border-collapse:collapse;margin:12px 0;} th,td{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left;font-size:0.8rem;}
        th{background:#f0f0f0;border-bottom:2px solid #d97706;}</style></head><body>
        <h1 style="color:#d97706;">Livestock Manager</h1>
        <p>Informe generado el ${new Date().toLocaleDateString()}.</p>
        <p><em>Usa la exportación PDF para una versión completa.</em></p>
        <hr><p style="color:#999;font-size:0.7rem;">Livestock Manager Premium</p>
      </body></html>`);
      win.document.close();
      win.focus();
    });
  }
};

window.InformesView = InformesView;
