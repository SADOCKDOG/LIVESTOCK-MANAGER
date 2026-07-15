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

    // Periodos de supresión activos de carne y de leche (cálculo centralizado en SanidadView)
    const sanitariosEnriquecidos = window.SanidadView ? SanidadView.enriquecer(sanitariosFinca) : [];
    const supresionesCarne = sanitariosEnriquecidos.filter(t => t.enSupresionCarne);
    const supresionesLeche = sanitariosEnriquecidos.filter(t => t.enSupresionLeche);

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
            <button class="hibrido-tab ${this._currentTab === 'comercializacion' ? 'active' : ''}" data-tab="comercializacion" onclick="HibridoView._cambiarTab('comercializacion')">${Icons.transportistas()} Logística y Ventas</button>
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

  // ========== BLOQUE 3: LOGÍSTICA Y VENTAS (dueño único del dato: ComercializacionView) ==========
  _renderComercializacion(content, d) {
    const html = `
      <div class="card p-16 mb-14" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="flex items-center gap-12 mb-16">
          <span class="text-3xl" style="color: var(--c-success);">${Icons.transportistas()}</span>
          <div>
            <h2 class="text-white font-900 text-lg uppercase tracking-wider style-none m-0" style="line-height:1.2;">
              <span style="color: var(--c-success); margin-right:4px;">|</span> LOGÍSTICA Y VENTAS
            </h2>
            <div class="text-gray text-[0.62rem] uppercase font-800 tracking-wider">Ventas de carne, entregas de leche, compradores y transporte</div>
          </div>
        </div>

        ${this._kpiGrid(d.kpis.comercializacion, 'var(--c-success)')}

        <div class="text-[0.62rem] text-gray-500 font-bold uppercase tracking-wide mb-10">
          Las ventas, entregas y contratos se registran y consultan en Comercialización, para mantener un único histórico.
        </div>

        <div class="text-center">
          <a href="#/comercializacion?tab=carne" class="widget-link-btn">${Icons.carne()} Ventas Carne</a>
          <a href="#/comercializacion?tab=leche" class="widget-link-btn">${Icons.leche()} Entregas Leche</a>
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  // ========== BLOQUE 4: SANIDAD Y LEGISLACIÓN (cálculo/edición centralizados en SanidadView) ==========
  _renderLegislacion(content, d) {
    const html = `
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

        ${window.SanidadView ? SanidadView.renderFragmentHTML(d.sanitariosFinca, { limit: 15, tituloHistorial: `Historial Sanitario Consolidado (${d.sanitariosFinca.length})` }) : ''}
      </div>
    `;
    content.innerHTML = html;
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