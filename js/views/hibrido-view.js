/**
 * Livestock Manager - HibridoView v3.0.0
 * Vista de Consola Híbrida/Mixta con las 4 pestañas modulares de gestión unificada
 */

const HibridoView = {
  _currentTab: 'patrimonio',
  _filtroActivo: {
    texto: '',
    tipo: ''
  },
  async render() {
    if (window.App) App.updateHeaderColor('hibrido');
    const main = document.getElementById("ganaderia-tab-content") || document.getElementById("app-content");
    const fincaId = await Fincas.getActiveId();
    const finca = await Fincas.getActive();

    // Cargar datos
    const [rebanos, animales, eventos, ventasCarne, entregasLeche, todosSanitarios, todosGastos] = await Promise.all([
      window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('animales').catch(() => []),
      window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('sanitarios_ganado').catch(() => []),
      window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => [])
    ]);

    const rebanosIds = rebanos.map(r => r.id);
    const animalesFinca = animales.filter(a => rebanosIds.includes(a.rebanoId));

    // 1. Producción mixta consolidada
    const proConsolidada = eventos.filter(e =>
      (e.unidad === 'kg' || e.unidad === 'L' || e.unidad === 'Litros') &&
      (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano')
    );
    proConsolidada.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    // 2. Sanitarios
    const sanitariosFinca = todosSanitarios.filter(s => rebanosIds.includes(s.rebanoId));
    sanitariosFinca.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Periodos de supresión activos de carne y de leche
    const hoy = new Date();
    const supresionesCarne = [];
    const supresionesLeche = [];
    sanitariosFinca.forEach(s => {
      const fechaApli = new Date(s.fecha);

      // Carne
      const dCarne = s.tiempo_espera_carne_dias || 0;
      if (dCarne > 0) {
        const fFinC = new Date(fechaApli.getTime() + dCarne * 24 * 60 * 60 * 1000);
        if (fFinC > hoy) {
          supresionesCarne.push({
            ...s,
            diasRestantes: Math.ceil((fFinC - hoy) / (24 * 60 * 60 * 1000)),
            fechaFin: fFinC.toISOString().split('T')[0]
          });
        }
      }

      // Leche
      const dLeche = s.tiempo_espera_leche_dias || 0;
      if (dLeche > 0 || s.prohibidoLeche) {
        const fFinL = new Date(fechaApli.getTime() + (s.prohibidoLeche ? 999 * 24 : dLeche * 24) * 60 * 60 * 1000);
        if (fFinL > hoy) {
          supresionesLeche.push({
            ...s,
            diasRestantes: s.prohibidoLeche ? 'PROHIBIDO' : Math.ceil((fFinL - hoy) / (24 * 60 * 60 * 1000)),
            fechaFin: s.prohibidoLeche ? 'INDEFINIDO' : fFinL.toISOString().split('T')[0]
          });
        }
      }
    });

    // 3. Totales económicos y MOFA consolidado
    const totalIngresosCarne = ventasCarne.reduce((s, v) => s + (v.importe_total || v.valor_neto || 0), 0);
    const totalIngresosLeche = entregasLeche.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
    const totalIngresosConsolidados = totalIngresosCarne + totalIngresosLeche;

    const gastosAlim = todosGastos.filter(g =>
      (g.categoria || '').toLowerCase() === 'alimentacion' ||
      (g.categoria || '').toLowerCase() === 'alimentación' ||
      (g.concepto || '').toLowerCase().includes('pienso') ||
      (g.concepto || '').toLowerCase().includes('forraje') ||
      (g.concepto || '').toLowerCase().includes('pasto')
    );
    const totalGastosAlim = gastosAlim.reduce((s, g) => s + (g.monto || 0), 0);
    const mofaConsolidado = totalIngresosConsolidados - totalGastosAlim;
    const ratioMofaConsolidado = totalIngresosConsolidados > 0 ? (mofaConsolidado / totalIngresosConsolidados) * 100 : 0;

    // Proporciones
    const pctCarne = totalIngresosConsolidados > 0 ? (totalIngresosCarne / totalIngresosConsolidados) * 100 : 0;
    const pctLeche = totalIngresosConsolidados > 0 ? (totalIngresosLeche / totalIngresosConsolidados) * 100 : 0;

    // Resumen mensual (últimos 6 meses) - basado en fechas de ventas carne y entregas leche
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const porMes = {};
    const hoyFecha = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoyFecha.getFullYear(), hoyFecha.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      porMes[key] = { label: meses[d.getMonth()] + ' ' + d.getFullYear(), total: 0 };
    }

    // Contar ingresos por mes (carne + leche)
    [...ventasCarne, ...entregasLeche].forEach(item => {
      const fechaStr = item.fechaSacrificio || item.fechaRecogida || item.fecha;
      if (fechaStr) {
        const key = fechaStr.substring(0, 7); // YYYY-MM
        if (porMes[key]) porMes[key].total++;
      }
    });

    const mesesHtml = Object.values(porMes).reverse().map(m => {
      const max = Math.max(1, ...Object.values(porMes).map(m => m.total));
      const pct = Math.max(0, Math.min(100, (m.total / max) * 100));
      const color = pct > 70 ? 'var(--c-danger)' : pct > 40 ? 'var(--c-warning)' : 'var(--c-success)';
      return `<div class="flex-1 text-center min-w-0">
        <div class="text-xs text-gray mb-2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.label}</div>
        <div class="hibrido-bar-wrap">
          <div style="position:absolute;bottom:0;width:100%;height:${pct}%;background:${color};border-radius:6px;opacity:0.8;transition:height 0.3s;"></div>
        </div>
        <div class="text-xs font-bold mt-2" style="color:${color};">${m.total}</div>
      </div>`;
    }).join('');

    // Guardar datos brutos para filtrado
    this._cachedDataRaw = {
      fincaId,
      siloEventos: eventos.filter(e => e.tipo_entidad === 'silo_pienso'),
      rebanos,
      animalesFinca,
      proConsolidada,
      ventasCarne,
      entregasLeche,
      sanitariosFinca,
      supresionesCarne,
      supresionesLeche,
      gastosAlim,
      finca,
      kpis: {
        patrimonio: [
          { label: 'Censo Mixto', value: animalesFinca.length + ' cabezas' },
          { label: 'Lotes/Rebaños', value: rebanos.length },
          { label: 'Finca Activa', value: finca?.nombre || 'Mixta' }
        ],
        explotacion: [
          { label: 'Margen Global', value: Math.round(mofaConsolidado).toLocaleString() + ' €', color: mofaConsolidado >= 0 ? 'var(--c-success)' : 'var(--c-danger)' },
          { label: 'Coste Piensos', value: totalGastosAlim.toLocaleString() + ' €', color: 'var(--c-danger)' },
          { label: 'Ratio MOFA', value: ratioMofaConsolidado.toFixed(1) + '%' }
        ],
        comercializacion: [
          { label: 'Ingresos Totales', value: totalIngresosConsolidados.toLocaleString() + ' €', color: 'var(--c-success)' },
          { label: 'Ventas Leche', value: `${pctLeche.toFixed(0)}%` },
          { label: 'Ventas Carne', value: `${pctCarne.toFixed(0)}%` }
        ],
        legislacion: [
          { label: 'Supresiones Carne', value: supresionesCarne.length, color: supresionesCarne.length > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
          { label: 'Supresiones Leche', value: supresionesLeche.length, color: supresionesLeche.length > 0 ? 'var(--c-info)' : 'var(--c-success)' }
        ]
      },
      totalIngresosCarne,
      totalIngresosLeche,
      totalIngresosConsolidados,
      totalGastosAlim,
      mofaConsolidado,
      pctCarne,
      pctLeche
    };

    // Aplicar filtros iniciales
    const filteredData = this._aplicarFiltrosToData(this._cachedDataRaw);

    main.innerHTML = `
      <!-- Plantilla estandarizada: Agregado + Filtros + Lista + FAB -->
      <div class="card mb-14 p-12" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="flex justify-between items-center mb-6">
          <span class="text-xs text-gray font-black uppercase"><span style="color: var(--c-info); margin-right: 4px;">|</span> EVOLUCIÓN MENSUAL (últimos 6 meses)</span>
          <span class="text-xs text-gray">${filteredData.ventasCarne.length + filteredData.entregasLeche.length} total</span>
        </div>
        <div class="flex gap-6">${mesesHtml}</div>
      </div>

      <!-- Balance Consolidado (Colapsable con App.toggleResumen) -->
      <div class="mb-14">
        <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
          <span style="color: var(--c-info); font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> RESUMEN DE CONSOLIDADO
        </div>
        <div id="resumen-hibrido" class="space-y-6 text-white">
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.edificio()} Patrimonio Ganadero</span>
            <strong class="text-xl font-950" style="color: var(--c-info);">${filteredData.animalesFinca.length} ${filteredData.animalesFinca.length === 1 ? "cabeza" : "cabezas"}</strong>
          </div>
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.dinero()} Márgenes Económicos</span>
            <strong class="text-xl font-950" style="color: ${filteredData.mofaConsolidado >= 0 ? 'var(--c-success)' : 'var(--c-danger)'};">${filteredData.mofaConsolidado.toLocaleString()} €</strong>
          </div>
          <div class="py-8 flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.alerta()} Estado Sanitario</span>
            <strong class="text-xl font-950" style="color: ${filteredData.supresionesCarne.length + filteredData.supresionesLeche.length > 0 ? 'var(--c-danger)' : 'var(--c-success)'};">${filteredData.supresionesCarne.length + filteredData.supresionesLeche.length}</strong>
          </div>
        </div>
      </div>

      <!-- Filtro de búsqueda integrado (controla el listado) -->
      <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-5">
        ${Icons.documento()} Historial Consolidado: Ventas Carne, Entregas Leche, Tratamientos
      </div>
      <div class="flex gap-8 items-center mb-12">
        <div class="relative flex-1 min-w-0">
          <input type="search" id="search-hibrido" placeholder="Buscar por concepto, vehículo, lote o medicamento..."
                 oninput="HibridoView._setFiltro('texto', this.value)"
                 class="search-input w-full">
        </div>
        <select id="hibrido-filtro-tipo" class="form-select-info"
                onchange="HibridoView._setFiltro('tipo', this.value)"
                style="width:140px; min-width:130px; flex-shrink:0;">
          <option value="">Todos los tipos</option>
          <option value="carne" ${this._filtroActivo.tipo === 'carne' ? 'selected' : ''}>Ventas Carne</option>
          <option value="leche" ${this._filtroActivo.tipo === 'leche' ? 'selected' : ''}>Entregas Leche</option>
          <option value="tratamiento" ${this._filtroActivo.tipo === 'tratamiento' ? 'selected' : ''}>Tratamientos</option>
          <option value="gasto" ${this._filtroActivo.tipo === 'gasto' ? 'selected' : ''}>Gastos</option>
        </select>
      </div>

      <!-- Tabs -->
      <div class="mb-14">
        <div class="scroll-shadow-container scroll-tabs-row mb-10">
          <div class="hibrido-tabs">
            <button class="hibrido-tab ${this._currentTab === 'patrimonio' ? 'active' : ''}" data-tab="patrimonio" onclick="HibridoView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio y Ganadería</button>
            <button class="hibrido-tab ${this._currentTab === 'comercializacion' ? 'active' : ''}" data-tab="comercializacion" onclick="HibridoView._cambiarTab('comercializacion')">${Icons.transportistas()} Logística y Transporte, Comercialización Ventas</button>
            <button class="hibrido-tab ${this._currentTab === 'legislacion' ? 'active' : ''}" data-tab="legislacion" onclick="HibridoView._cambiarTab('legislacion')">${Icons.documento()} Registros Legislación, Cumplimiento Sanitario</button>
          </div>
        </div>
      </div>
      <div id="hibrido-content"><div class="loader">Cargando datos de la consola híbrida...</div></div>
      <!-- Botón Flotante de Acción con viñeta -->
      <div class="fab-container" style="--fab-neon-color: var(--c-success);" onclick="App._abrirSubmenuRegistros({ origen_modulo: 'hibrido' })">
        <span class="fab-label">Registrar Actividad</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;

    // Actualizar datos filtrados para el contenido
    this._cachedData = filteredData;
    this._renderTabActual();
  },

  _aplicarFiltrosToData(data) {
    // Aplicar filtros a los datos según el tipo seleccionado
    let filteredData = { ...data };

    // Filtrar por tipo de registro
    if (this._filtroActivo.tipo) {
      switch (this._filtroActivo.tipo) {
        case 'carne':
          filteredData.ventasCarne = data.ventasCarne.filter(v =>
            (v.numero_albaran || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (v.razonSocial || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (v.matriculaCisterna || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        case 'leche':
          filteredData.entregasLeche = data.entregasLeche.filter(e =>
            (e.matriculaCisterna || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (e.concepto || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (e.razonSocialComprador || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        case 'tratamiento':
          filteredData.sanitariosFinca = data.sanitariosFinca.filter(s =>
            (s.medicamento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (s.tipo_tratamiento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          filteredData.supresionesCarne = data.supresionesCarne.filter(s =>
            (s.medicamento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          filteredData.supresionesLeche = data.supresionesLeche.filter(s =>
            (s.medicamento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        case 'gasto':
          filteredData.gastosAlim = data.gastosAlim.filter(g =>
            (g.concepto || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        default:
          // Si no se especifica tipo, aplicar búsqueda de texto a todos los campos relevantes
          if (this._filtroActivo.texto.trim()) {
            const q = this._filtroActivo.texto.toLowerCase();
            filteredData.ventasCarne = data.ventasCarne.filter(v =>
              (v.numero_albaran || '').toLowerCase().includes(q) ||
              (v.razonSocial || '').toLowerCase().includes(q) ||
              (v.matriculaCisterna || '').toLowerCase().includes(q)
            );
            filteredData.entregasLeche = data.entregasLeche.filter(e =>
              (e.matriculaCisterna || '').toLowerCase().includes(q) ||
              (e.concepto || '').toLowerCase().includes(q) ||
              (e.razonSocialComprador || '').toLowerCase().includes(q)
            );
            filteredData.sanitariosFinca = data.sanitariosFinca.filter(s =>
              (s.medicamento || '').toLowerCase().includes(q) ||
              (s.tipo_tratamiento || '').toLowerCase().includes(q)
            );
            filteredData.supresionesCarne = data.supresionesCarne.filter(s =>
              (s.medicamento || '').toLowerCase().includes(q)
            );
            filteredData.supresionesLeche = data.supresionesLeche.filter(s =>
              (s.medicamento || '').toLowerCase().includes(q)
            );
            filteredData.gastosAlim = data.gastosAlim.filter(g =>
              (g.concepto || '').toLowerCase().includes(q)
            );
          }
          break;
      }
    } else if (this._filtroActivo.texto.trim()) {
      // Si no hay tipo seleccionado pero sí texto, aplicar búsqueda general
      const q = this._filtroActivo.texto.toLowerCase();
      filteredData.ventasCarne = data.ventasCarne.filter(v =>
        (v.numero_albaran || '').toLowerCase().includes(q) ||
        (v.razonSocial || '').toLowerCase().includes(q) ||
        (v.matriculaCisterna || '').toLowerCase().includes(q)
      );
      filteredData.entregasLeche = data.entregasLeche.filter(e =>
        (e.matriculaCisterna || '').toLowerCase().includes(q) ||
        (e.concepto || '').toLowerCase().includes(q) ||
        (e.razonSocialComprador || '').toLowerCase().includes(q)
      );
      filteredData.sanitariosFinca = data.sanitariosFinca.filter(s =>
        (s.medicamento || '').toLowerCase().includes(q) ||
        (s.tipo_tratamiento || '').toLowerCase().includes(q)
      );
      filteredData.supresionesCarne = data.supresionesCarne.filter(s =>
        (s.medicamento || '').toLowerCase().includes(q)
      );
      filteredData.supresionesLeche = data.supresionesLeche.filter(s =>
        (s.medicamento || '').toLowerCase().includes(q)
      );
      filteredData.gastosAlim = data.gastosAlim.filter(g =>
        (g.concepto || '').toLowerCase().includes(q)
      );
    }

    // Recalcular KPIs basados en datos filtrados
    const totalIngresosCarne = filteredData.ventasCarne.reduce((s, v) => s + (v.importe_total || v.valor_neto || 0), 0);
    const totalIngresosLeche = filteredData.entregasLeche.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
    const totalIngresosConsolidados = totalIngresosCarne + totalIngresosLeche;
    const totalGastosAlim = filteredData.gastosAlim.reduce((s, g) => s + (g.monto || 0), 0);
    const mofaConsolidado = totalIngresosConsolidados - totalGastosAlim;
    const ratioMofaConsolidado = totalIngresosConsolidados > 0 ? (mofaConsolidado / totalIngresosConsolidados) * 100 : 0;
    const pctCarne = totalIngresosConsolidados > 0 ? (totalIngresosCarne / totalIngresosConsolidados) * 100 : 0;
    const pctLeche = totalIngresosConsolidados > 0 ? (totalIngresosLeche / totalIngresosConsolidados) * 100 : 0;

    return {
      ...filteredData,
      kpis: data.kpis,
      totalIngresosCarne,
      totalIngresosLeche,
      totalIngresosConsolidados,
      totalGastosAlim,
      mofaConsolidado,
      pctCarne,
      pctLeche
    };
  },

  _setFiltro(type, value) {
    this._filtroActivo[type] = value;
    this._aplicarFiltros();
  },

  _aplicarFiltros() {
    if (!this._cachedDataRaw) return;
    const filteredData = this._aplicarFiltrosToData(this._cachedDataRaw);
    this._cachedData = filteredData;
    this._renderTabActual();
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.hibrido-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    if (!d) return;
    const content = document.getElementById('hibrido-content');
    if (!content) return;

    switch (this._currentTab) {
      case 'patrimonio': this._renderPatrimonio(content, d); break;
      case 'comercializacion': this._renderComercializacion(content, d); break;
      case 'legislacion': this._renderLegislacion(content, d); break;
      default: this._renderPatrimonio(content, d);
    }
  },

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

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  // ========== BLOQUE 1: PATRIMONIO Y GANADERIA ==========
  _renderPatrimonio(content, d) {
    const html = `
      <div class="card p-16 mb-14" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="flex items-center gap-12 mb-16">
          <span class="text-3xl" style="color: var(--c-warning);">${Icons.edificio()}</span>
          <div>
            <h2 class="text-white font-900 text-lg uppercase tracking-wider style-none m-0" style="line-height:1.2;">
              <span style="color: var(--c-warning); margin-right:4px;">|</span> PATRIMONIO GANADERO CONSOLIDADO
            </h2>
            <div class="text-gray text-[0.62rem] uppercase font-800 tracking-wider">Organización ganadera de doble aptitud</div>
          </div>
        </div>

        ${this._kpiGrid(d.kpis.patrimonio, 'var(--c-warning)')}

        <!-- Accesos directos táctiles -->
        <div class="grid grid-cols-3 gap-8 mb-16">
          <a href="#/animales" class="widget-link-btn">${Icons.animales()} Animales</a>
          <a href="#/rebanos" class="widget-link-btn">${Icons.rebanos()} Rebaños</a>
          <a href="#/zonas" class="widget-link-btn">${Icons.zonas()} Zonas</a>
        </div>

        <div class="leche-list-header">
          ${Icons.documento()} Rebaños Mixtos Activos (${d.rebanos.length})
        </div>
        <div class="grid gap-10">
          ${d.rebanos.length > 0
            ? d.rebanos.map(r => `
                <div class="card-registro" onclick="location.hash='/rebano?id=${r.id}'" style="--registro-color: var(--c-warning);">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-6">
                        <span class="text-xl">${Icons.rebanos()}</span>
                        <h3 class="section-h3 m-0 text-ellipsis">${r.nombre}</h3>
                      </div>
                      <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                        <span>Aptitud: ${r.tipo} · Especie: ${r.especie}</span>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-8">
                      <span class="badge badge-sm badge-gold block mb-4">${(c => c + " " + (c === 1 ? "cabeza" : "cabezas"))(d.animalesFinca.filter(a => a.rebanoId === r.id && (a.estado || "").toLowerCase() === "activo").length)}</span>
                    </div>
                  </div>
                </div>`).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">${Icons.buscar()} Sin rebaños mixtos activos.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  // ========== BLOQUE 3: LOGÍSTICA Y TRANSPORTE, COMERCIALIZACIÓN VENTAS ==========
  _renderComercializacion(content, d) {
    // Liquidaciones unificadas
    const lList = [];
    d.ventasCarne.forEach(v => {
      lList.push({
        id: v.id,
        tipo: 'carne',
        titulo: `${Icons.carne()} Carne: ${v.numero_albaran || 'Albarán'} - ${v.razonSocial || 'Matadero'}`,
        fecha: v.fechaSacrificio || v.fecha,
        valor: v.importe_total || v.valor_neto || 0,
        detalle: `${v.pesoCanal || 0} kg canal`,
        onclick: `App._abrirDetalleVentaCarne(${v.id})`
      });
    });
    d.entregasLeche.forEach(e => {
      lList.push({
        id: e.id,
        tipo: 'leche',
        titulo: `${Icons.leche()} Leche: Entrega de ${(e.cantidad || 0).toLocaleString()} L`,
        fecha: e.fechaRecogida || e.fecha,
        valor: e.importe_total || e.cantidad * e.precioBase || 0,
        detalle: `Vehículo: ${e.matriculaCisterna || '—'}`,
        onclick: `location.hash='/albaran-leche?id=${e.id}'`
      });
    });
    lList.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    const html = `
      <div class="card p-16 mb-14" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="flex justify-between items-center mb-16">
          <div class="flex items-center gap-12">
            <span class="text-3xl" style="color: var(--c-success);">${Icons.transportistas()}</span>
            <div>
              <h2 class="text-white font-900 text-lg uppercase tracking-wider style-none m-0" style="line-height:1.2;">
                <span style="color: var(--c-success); margin-right:4px;">|</span> LOGÍSTICA Y VENTAS CONSOLIDADO
              </h2>
              <div class="text-gray text-[0.62rem] uppercase font-800 tracking-wider">Logística, transporte, compradores, contratos y ventas consolidado</div>
            </div>
          </div>
          <div class="flex gap-4">
            <button class="btn btn-create btn-sm" onclick="App._abrirWizardVentaMasiva()">
              ${Icons.agregar()} Venta Carne
            </button>
            <button class="btn btn-success btn-sm" onclick="App._abrirWizardAlbaranLeche()">
              ${Icons.agregar()} Albarán Leche
            </button>
          </div>
        </div>

        ${this._kpiGrid(d.kpis.comercializacion, 'var(--c-success)')}

        <!-- Accesos directos comerciales -->
        <div class="grid grid-cols-3 gap-8 mb-16">
          <a href="#/compradores" class="widget-link-btn">${Icons.compradores()} Compradores</a>
          <a href="#/transportistas" class="widget-link-btn">${Icons.transportistas()} Logística</a>
          <a href="#/comercializacion" class="widget-link-btn">${Icons.comercial()} Comercial</a>
        </div>

        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Historial de Ventas e Ingresos Mixtos (${lList.length})
        </div>
        <div class="grid gap-10">
          ${lList.slice(0, 15).map(l => {
            const color = l.tipo === 'carne' ? 'var(--c-danger)' : 'var(--c-info)';
            return `
              <div class="card-registro" onclick="${l.onclick}" style="--registro-color: ${color};">
                <div class="flex justify-between items-start">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-6">
                      <span class="text-xl">${l.tipo === 'carne' ? Icons.carne() : Icons.leche()}</span>
                      <h3 class="section-h3 m-0 text-ellipsis">${l.titulo}</h3>
                    </div>
                    <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                      <span>${Icons.calendar()} ${this._fmtFecha(l.fecha)}</span>
                      <span>·</span>
                      <span>${l.detalle}</span>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0 ml-8">
                    <span class="badge badge-sm text-green font-bold text-lg" style="background:rgba(204,255,0,0.1); border:1px solid rgba(204,255,0,0.3); display:block;">${Math.round(l.valor).toLocaleString()} €</span>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  // ========== BLOQUE 4: REGISTROS, LEGISLACIÓN Y CUMPLIMIENTO SANITARIO ==========
  _renderLegislacion(content, d) {
    // Alertas de supresión
    let alertasHtml = '';
    if (d.supresionesCarne.length > 0 || d.supresionesLeche.length > 0) {
      alertasHtml = `
        <div class="supresion-alerta-box">
          <strong>${Icons.alerta()} ALERTAS SANITARIAS ACTIVAS:</strong>
          <ul class="mt-4 pl-20 m-0">
            ${d.supresionesCarne.map(s => `
              <li><span class="sup-badge sup-badge-carne">CARNE</span> Rebaño <strong class="text-white">${s.rebanoId}</strong> — Restan <strong class="text-white">${s.diasRestantes} ${s.diasRestantes === 1 ? 'día' : 'días'}</strong> para matadero.</li>
            `).join('')}
            ${d.supresionesLeche.map(s => `
              <li><span class="sup-badge sup-badge-leche">LECHE</span> Rebaño <strong class="text-white">${s.rebanoId}</strong> — ${typeof s.diasRestantes === 'number' ? `Restan <strong class="text-white">${s.diasRestantes} ${s.diasRestantes === 1 ? 'día' : 'días'}</strong> para ordeño.` : '<strong class="text-white">Ordeño prohibido durante el tratamiento.</strong>'}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    const html = `
      ${alertasHtml}
      <div class="card p-16 mb-14" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="flex justify-between items-center mb-16">
          <div class="flex items-center gap-12">
            <span class="text-3xl" style="color: var(--c-purple);">${Icons.documento()}</span>
            <div>
              <h2 class="text-white font-900 text-lg uppercase tracking-wider style-none m-0" style="line-height:1.2;">
                <span style="color: var(--c-purple); margin-right:4px;">|</span> SANIDAD Y LEGISLACIÓN CONSOLIDADO
              </h2>
              <div class="text-gray text-[0.62rem] uppercase font-800 tracking-wider">Cuaderno de explotación consolidado, Letra Q y supresiones</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" style="background:var(--c-purple); border-color:var(--c-purple);" onclick="HibridoView._abrirAsistenteTratamientoMix()">
            ${Icons.agregar()} Registrar Tratamiento
          </button>
        </div>

        ${this._kpiGrid(d.kpis.legislacion, 'var(--c-purple)')}

        <!-- Accesos directos de legislación -->
        <div class="grid grid-cols-2 gap-8 mb-16">
          <a href="#/documentos" class="widget-link-btn">${Icons.documento()} Documentos</a>
          <a href="#/cuaderno" class="widget-link-btn">${Icons.cuaderno()} Cuaderno de Explotación</a>
        </div>

        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Historial Sanitario Consolidado (${d.sanitariosFinca.length})
        </div>
        <div class="grid gap-10">
          ${d.sanitariosFinca.length > 0
            ? d.sanitariosFinca.slice(0, 15).map(s => {
                const enSupC = d.supresionesCarne.some(ts => ts.id === s.id);
                const enSupL = d.supresionesLeche.some(ts => ts.id === s.id);
                const color = (enSupC || enSupL) ? 'var(--c-danger)' : 'var(--c-purple)';
                return `
                  <div class="card-registro" style="--registro-color: ${color};">
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-6">
                          <span class="text-xl">${Icons.sanidad()}</span>
                          <h3 class="section-h3 m-0 text-ellipsis">${s.medicamento || s.tipo_tratamiento || 'Tratamiento'}</h3>
                        </div>
                        <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                          <span>${Icons.calendar()} ${this._fmtFecha(s.fecha)}</span>
                          <span>·</span>
                          <span>Carne: <strong>${s.tiempo_espera_carne_dias || 0}d</strong> · Leche: <strong>${s.tiempo_espera_leche_dias || 0}d</strong></span>
                        </div>
                      </div>
                      <div class="text-right flex-shrink-0 ml-8">
                        ${enSupC ? `<span class="badge badge-sm badge-red block mb-2">SUP. CARNE</span>` : ''}
                        ${enSupL ? `<span class="badge badge-sm badge-blue block">SUP. LECHE</span>` : ''}
                        ${!enSupC && !enSupL ? `<span class="badge badge-sm block" style="background:rgba(168,85,247,0.15); color:var(--c-purple); border:1px solid color-mix(in srgb, var(--c-purple) 25%, transparent);">LIBRE</span>` : ''}
                      </div>
                    </div>
                  </div>`;
              }).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">${Icons.buscar()} Sin tratamientos sanitarios.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  async _abrirOpcionesRegistro(id, tipo) {
    if (tipo === 'carne' && window.CarneView) {
      await window.CarneView._abrirOpcionesRegistro(id);
      setTimeout(() => HibridoView.render(), 500);
    } else {
      // Editar registro lácteo
      try {
        const evento = await window.db.get('registro_eventos', id);
        if (!evento) return;

        const overlay = document.createElement("div");
        overlay.className = "wizard-full-screen";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
        overlay.innerHTML = `
            <div class="card p-25" style="max-width:420px; width: 100%; border: 1px solid var(--c-gray); background: #1e1e1e;">
                <h3 class="mt-0 text-gold font-900 uppercase tracking-wider"><span style="color: var(--c-gray); margin-right: 4px;">|</span> EDITAR REGISTRO LÁCTEO</h3>
                <p class="text-xs text-gray mb-15">ID Interno: ${evento.id}</p>

                <div class="grid grid-cols-2 gap-10">
                  <div class="wizard-input-group">
                      <label class="wizard-label">Litros (L)</label>
                      <input type="number" id="edit-reg-valor" value="${evento.valor_neto}" step="0.1" class="wizard-input">
                  </div>
                  <div class="wizard-input-group">
                      <label class="wizard-label">Fecha</label>
                      <input type="date" id="edit-reg-fecha" value="${evento.fecha}" class="wizard-input">
                  </div>
                </div>

                <div class="wizard-input-group">
                    <label class="wizard-label">Identificación (Crotal/Lote)</label>
                    <input type="text" id="edit-reg-ident" value="${evento.snap_identificacion || ''}" class="wizard-input">
                </div>

                <div class="flex gap-10 mt-20">
                    <button class="wizard-btn-action wizard-btn-primary flex-2" id="btn-save-reg">${Icons.guardar()} Guardar</button>
                    <button class="wizard-btn-action wizard-btn-danger flex-1" id="btn-del-reg">${Icons.eliminar()} Borrar</button>
                </div>
                <button class="wizard-btn-action wizard-btn-secondary mt-10 w-full" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
            </div>`;
        document.body.appendChild(overlay);

        overlay.querySelector('#btn-save-reg').onclick = async () => {
          const val = parseFloat(overlay.querySelector('#edit-reg-valor').value);
          const fecha = overlay.querySelector('#edit-reg-fecha').value;
          const ident = overlay.querySelector('#edit-reg-ident').value.trim();

          if (isNaN(val) || val <= 0) return App.toastError("Valor inválido");

          evento.valor_neto = val;
          evento.fecha = fecha;
          evento.snap_identificacion = ident;
          evento.actualizadoEn = new Date().toISOString();

          await window.db.put('registro_eventos', evento);
          App.toast("Registro lácteo actualizado", "success");
          overlay.remove();
          HibridoView.render();
        };

        overlay.querySelector('#btn-del-reg').onclick = async () => {
          if (!await Confirm.confirm("Eliminar Control", "¿Eliminar este control de forma permanente?", true)) return;
          await window.db.delete('registro_eventos', id);
          App.toast("Registro lácteo eliminado", "success");
          overlay.remove();
          HibridoView.render();
        };
      } catch (e) {
        App.toastError(e.message);
      }
    }
  },

  async _abrirAsistenteTratamientoMix() {
    const d = this._cachedData;
    if (!d || d.rebanos.length === 0) {
      App.toastError("No hay rebaños en esta finca para tratar.");
      return;
    }

    if (d.rebanos.length === 1) {
      await window.WizardTratamiento.registrar(d.rebanos[0].id);
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "wizard-full-screen";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.innerHTML = `
      <div class="card p-25" style="max-width:380px; width: 100%; border: 1px solid var(--c-gray); background: #1e1e1e;">
        <h3 class="mt-0 text-white font-900 flex items-center gap-8"><span style="color: var(--c-gray); margin-right: 4px;">|</span> ${Icons.sanidad()} APLICAR TRATAMIENTO VETERINARIO</h3>
        <label class="wizard-label mb-10">Selecciona el rebaño a tratar:</label>
        <select id="w-treat-reb" class="wizard-input wizard-select mb-15">
          ${d.rebanos.map(r => `<option value="${r.id}">${r.nombre} (${r.tipo} · ${r.especie})</option>`).join('')}
        </select>
        <div class="flex gap-10">
          <button class="wizard-btn-action wizard-btn-primary flex-1" id="btn-treat-next">Proceder ${Icons.siguiente()}</button>
          <button class="wizard-btn-action wizard-btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-treat-next').onclick = async () => {
      const rebId = parseInt(overlay.querySelector('#w-treat-reb').value);
      overlay.remove();
      await window.WizardTratamiento.registrar(rebId);
      setTimeout(() => HibridoView.render(), 1000);
    };
  },
};

window.HibridoView = HibridoView;