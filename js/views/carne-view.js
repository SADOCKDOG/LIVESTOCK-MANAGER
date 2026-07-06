/**
 * Livestock Manager - CarneView v2.0.0
 * Vista del Módulo de Carne con los 4 bloques unificados de gestión
 */

const CarneView = {
  _currentTab: 'patrimonio',
  _filtroActivo: {
    texto: '',
    tipo: ''
  },
  async render() {
    if (window.App) App.updateHeaderColor('carne');
    const main = document.getElementById('app-content');
    const fincaId = await Fincas.getActiveId();
    const finca = await Fincas.getActive();

    // Cargar datos
    const [rebanos, animales, eventos, ventasCarne, todosSanitarios, todosGastos] = await Promise.all([
      window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('animales').catch(() => []),
      window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('sanitarios_ganado').catch(() => []),
      window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => [])
    ]);

    // Filtrar rebanos cárnicos o mixtos
    const rebanosCarne = rebanos.filter(r =>
      r.tipo.toLowerCase().includes('carne') ||
      r.tipo.toLowerCase().includes('cárn') ||
      r.tipo.toLowerCase().includes('mixt') ||
      r.tipo.toLowerCase().includes('híbr') ||
      r.tipo.toLowerCase().includes('doble')
    );
    const rebanosIds = rebanosCarne.map(r => r.id);

    // Filtrar animales de rebanos cárnicos
    const animalesCarne = animales.filter(a => rebanosIds.includes(a.rebanoId));

    // Filtrar pesajes (unidad kg) de carne
    const pesajes = eventos.filter(e =>
      e.unidad === 'kg' &&
      (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano') &&
      (rebanosIds.includes(e.rebanoId) || e.snap_tipo?.toLowerCase()?.includes('carne') || e.snap_tipo?.toLowerCase()?.includes('cárn') || e.snap_tipo?.toLowerCase()?.includes('mixt'))
    );
    pesajes.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    // Filtrar tratamientos cárnicos
    const sanitariosCarne = todosSanitarios.filter(s => rebanosIds.includes(s.rebanoId));
    sanitariosCarne.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Calcular periodos de supresión cárnicos activos
    const hoy = new Date();
    const tratamientosSupresion = [];
    sanitariosCarne.forEach(s => {
      const fechaApli = new Date(s.fecha);
      const diasEspera = s.tiempo_espera_carne_dias || 0;
      if (diasEspera > 0) {
        const fechaFin = new Date(fechaApli.getTime() + diasEspera * 24 * 60 * 60 * 1000);
        if (fechaFin > hoy) {
          const diasRestantes = Math.ceil((fechaFin - hoy) / (24 * 60 * 60 * 1000));
          tratamientosSupresion.push({
            ...s,
            diasRestantes,
            fechaFin: fechaFin.toISOString().split('T')[0]
          });
        }
      }
    });

    // Calcular GMD (Ganancia Media Diaria)
    const pesajesPorAnimal = {};
    pesajes.forEach(p => {
      if (p.tipo_entidad === 'animal' && p.entidad_id) {
        if (!pesajesPorAnimal[p.entidad_id]) pesajesPorAnimal[p.entidad_id] = [];
        pesajesPorAnimal[p.entidad_id].push(p);
      }
    });

    let gmdAcumulado = 0;
    let countGmd = 0;
    const gmdList = [];
    for (const animId in pesajesPorAnimal) {
      const pts = pesajesPorAnimal[animId].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      if (pts.length >= 2) {
        const pIni = pts[0].valor_neto || 0;
        const pFin = pts[pts.length - 1].valor_neto || 0;
        const fIni = new Date(pts[0].fecha);
        const fFin = new Date(pts[pts.length - 1].fecha);
        const dias = (fFin - fIni) / (1000 * 60 * 60 * 24);
        if (dias > 0) {
          const gmd = (pFin - pIni) / dias;
          gmdAcumulado += gmd;
          countGmd++;
          gmdList.push({
            animalId: animId,
            crotal: pts[0].snap_identificacion || 'Crotal #' + animId,
            gmd,
            ultimoPeso: pFin,
            primerPeso: pIni,
            dias,
            fechaUltimo: pts[pts.length - 1].fecha,
            rebano: pts[0].snap_tipo || 'Carne'
          });
        }
      }
    }
    const gmdMedio = countGmd > 0 ? gmdAcumulado / countGmd : 0;

    // Calcular patrimonio estimado ganadero
    const pesoMedioFinca = animalesCarne.length > 0 ? (animalesCarne.reduce((s, a) => s + (a.peso_actual || 0), 0) / animalesCarne.length) : 350;
    const valorEstimadoCabeza = pesoMedioFinca * 3.20; // 3.20 €/kg vivo de referencia
    const valorPatrimonioTotal = animalesCarne.length * valorEstimadoCabeza;

    // Explotación KPIs
    const totalKgPesados = pesajes.reduce((s, e) => s + (e.valor_neto || 0), 0);
    const numPesajes = pesajes.length;

    // Logística y Comercialización KPIs
    ventasCarne.sort((a, b) => new Date(b.fechaSacrificio || b.fecha || 0) - new Date(a.fechaSacrificio || a.fecha || 0));
    const totalVentasEuros = ventasCarne.reduce((s, v) => s + (v.importe_total || v.valor_neto || 0), 0);
    const totalKgMatadero = ventasCarne.reduce((s, v) => s + (v.pesoCanal || 0), 0);
    const rendimientoMedio = ventasCarne.length > 0 ? (ventasCarne.reduce((s, v) => s + (v.rendimientoCanal || 0), 0) / ventasCarne.length) : 0;

    // Costes y Almacén
    const gastosAlim = todosGastos.filter(g =>
      (g.categoria || '').toLowerCase() === 'alimentacion' ||
      (g.categoria || '').toLowerCase() === 'alimentación' ||
      (g.concepto || '').toLowerCase().includes('pienso') ||
      (g.concepto || '').toLowerCase().includes('forraje') ||
      (g.concepto || '').toLowerCase().includes('pasto')
    );
    const totalGastosAlim = gastosAlim.reduce((s, g) => s + (g.monto || 0), 0);
    const mofaCarne = totalVentasEuros - totalGastosAlim;
    const ratioMofaCarne = totalVentasEuros > 0 ? (mofaCarne / totalVentasEuros) * 100 : 0;

    // Guardar datos brutos para filtrado
    this._cachedDataRaw = {
      fincaId,
      rebanosCarne,
      animalesCarne,
      pesajes,
      ventasCarne,
      sanitariosCarne,
      tratamientosSupresion,
      gmdList,
      gastosAlim,
      eventos,
      valorPatrimonioTotal,
      totalKgPesados,
      numPesajes,
      totalVentasEuros,
      totalKgMatadero,
      rendimientoMedio,
      totalGastosAlim,
      mofaCarne,
      ratioMofaCarne
    };

    // Resumen mensual (últimos 6 meses) - basado en fechas de ventas
    const hoyMensual = new Date();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const porMes = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoyMensual.getFullYear(), hoyMensual.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      porMes[key] = { label: meses[d.getMonth()] + ' ' + d.getFullYear(), total: 0 };
    }
    // Contar ventas por mes
    const rawData = this._cachedDataRaw ? this._cachedDataRaw.ventasCarne : [];
    rawData.forEach(v => {
      if (v.fechaSacrificio) {
        const fechaStr = v.fechaSacrificio;
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
        <div class="carne-bar-wrap">
          <div style="position:absolute;bottom:0;width:100%;height:${pct}%;background:${color};border-radius:6px;opacity:0.8;transition:height 0.3s;"></div>
        </div>
        <div class="text-xs font-bold mt-2" style="color:${color};">${m.total}</div>
      </div>`;
    }).join('');

    // Aplicar filtros iniciales
    const filteredData = this._aplicarFiltrosToData(this._cachedDataRaw);

    main.innerHTML = `
      <!-- Plantilla estandarizada: Agregado + Filtros + Lista + FAB -->
      <div class="card-registro mb-14 p-12" style="--registro-color: var(--c-danger); background:rgba(255,68,68,0.03);">
        <div class="flex justify-between items-center mb-6">
          <span class="text-xs text-gray font-bold uppercase">EVOLUCIÓN MENSUAL (últimos 6 meses)</span>
          <span class="text-xs text-gray">${filteredData.ventasCarne.length} total</span>
        </div>
        <div class="flex gap-6">${mesesHtml}</div>
      </div>

      <!-- Balance Consolidado (Colapsable con App.toggleResumen) -->
      <div class="mb-14">
        <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
          <span style="color: var(--c-danger); font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> RESUMEN DE CARNE
        </div>
        <div id="resumen-carne" class="space-y-6 text-white">
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.edificio()} Patrimonio Ganadero</span>
            <strong class="text-xl font-950" style="color: var(--c-danger);">${Math.round(filteredData.valorPatrimonioTotal).toLocaleString()} €</strong>
          </div>
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.documento()} Censo Cárnico</span>
            <strong class="text-xl font-950 text-green">${filteredData.animalesCarne.length} ${filteredData.animalesCarne.length === 1 ? "cabeza" : "cabezas"}</strong>
          </div>
          <div class="py-8 flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.transportistas()} Ventas Matadero</span>
            <strong class="text-xl font-950 text-blue">$${filteredData.totalVentasEuros.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <!-- Filtro de búsqueda integrado (controla el listado) -->
      <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-5">
        ${Icons.documento()} Historial de Ventas y Movimientos
      </div>
      <div class="flex gap-8 items-center mb-12">
        <div class="relative flex-1 min-w-0">
          <input type="search" id="search-carne" placeholder="Buscar por número de albarán, concepto o medicamento..."
                 oninput="CarneView._setFiltro('texto', this.value)"
                 class="search-input w-full">
        </div>
        <select id="carne-filtro-tipo" class="form-select-danger"
                onchange="CarneView._setFiltro('tipo', this.value)"
                style="width:120px; min-width:110px; flex-shrink:0;">
          <option value="">Todos los tipos</option>
          <option value="venta" ${this._filtroActivo.tipo === 'venta' ? 'selected' : ''}>Ventas</option>
          <option value="pesaje" ${this._filtroActivo.tipo === 'pesaje' ? 'selected' : ''}>Pesajes</option>
          <option value="tratamiento" ${this._filtroActivo.tipo === 'tratamiento' ? 'selected' : ''}>Tratamientos</option>
          <option value="gasto" ${this._filtroActivo.tipo === 'gasto' ? 'selected' : ''}>Gastos</option>
        </select>
      </div>

      <!-- Tabs -->
      <div class="mb-14">
        <div class="scroll-shadow-container scroll-tabs-row mb-10">
          <div class="carne-tabs">
            <button class="carne-tab ${this._currentTab === 'patrimonio' ? 'active' : ''}" data-tab="patrimonio" onclick="CarneView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio y Ganadería</button>
            <button class="carne-tab ${this._currentTab === 'comercializacion' ? 'active' : ''}" data-tab="comercializacion" onclick="CarneView._cambiarTab('comercializacion')">${Icons.transportistas()} Logística y Transporte, Comercialización Ventas</button>
            <button class="carne-tab ${this._currentTab === 'legislacion' ? 'active' : ''}" data-tab="legislacion" onclick="CarneView._cambiarTab('legislacion')">${Icons.documento()} Registros Legislación, Cumplimiento Sanitario</button>
          </div>
        </div>
      </div>
      <div id="carne-content"><div class="loader">Cargando datos...</div></div>
      <!-- Botón Flotante de Acción con viñeta -->
      <div class="fab-container" style="--fab-neon-color: var(--c-danger);" onclick="App._abrirAsistenteProduccion('carne', { origen_modulo: 'carne' })">
        <span class="fab-label">Nuevo Registro</span>
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
        case 'venta':
          filteredData.ventasCarne = data.ventasCarne.filter(v =>
            (v.numero_albaran || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (v.razonSocial || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (v.concepto || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        case 'pesaje':
          filteredData.pesajes = data.pesajes.filter(p =>
            (p.snap_identificacion || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (p.concepto || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        case 'tratamiento':
          filteredData.sanitariosCarne = data.sanitariosCarne.filter(s =>
            (s.medicamento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (s.tipo_tratamiento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          filteredData.tratamientosSupresion = data.tratamientosSupresion.filter(s =>
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
              (v.concepto || '').toLowerCase().includes(q)
            );
            filteredData.pesajes = data.pesajes.filter(p =>
              (p.snap_identificacion || '').toLowerCase().includes(q) ||
              (p.concepto || '').toLowerCase().includes(q)
            );
            filteredData.sanitariosCarne = data.sanitariosCarne.filter(s =>
              (s.medicamento || '').toLowerCase().includes(q) ||
              (s.tipo_tratamiento || '').toLowerCase().includes(q)
            );
            filteredData.tratamientosSupresion = data.tratamientosSupresion.filter(s =>
              (s.medicamento || '').toLowerCase().includes(q)
            );
            filteredData.gastosAlim = data.gastosAlim.filter(g =>
              (g.concepto || '').toLowerCase().includes(q)
            );
          }
          break;
      }
    } else if (this._filtroActivo.texto.trim()) {
      // Si no hay tipo seleccionado pero sí texto, aplicar búsqueda General
      const q = this._filtroActivo.texto.toLowerCase();
      filteredData.ventasCarne = data.ventasCarne.filter(v =>
        (v.numero_albaran || '').toLowerCase().includes(q) ||
        (v.razonSocial || '').toLowerCase().includes(q) ||
        (v.concepto || '').toLowerCase().includes(q)
      );
      filteredData.pesajes = data.pesajes.filter(p =>
        (p.snap_identificacion || '').toLowerCase().includes(q) ||
        (p.concepto || '').toLowerCase().includes(q)
      );
      filteredData.sanitariosCarne = data.sanitariosCarne.filter(s =>
        (s.medicamento || '').toLowerCase().includes(q) ||
        (s.tipo_tratamiento || '').toLowerCase().includes(q)
      );
      filteredData.tratamientosSupresion = data.tratamientosSupresion.filter(s =>
        (s.medicamento || '').toLowerCase().includes(q)
      );
      filteredData.gastosAlim = data.gastosAlim.filter(g =>
        (g.concepto || '').toLowerCase().includes(q)
      );
    }

    // Recalcular KPIs basados en datos filtrados
    const pesoMedioFinca = filteredData.animalesCarne.length > 0 ?
      (filteredData.animalesCarne.reduce((s, a) => s + (a.peso_actual || 0), 0) / filteredData.animalesCarne.length) : 350;
    const valorEstimadoCabeza = pesoMedioFinca * 3.20;
    const valorPatrimonioTotal = filteredData.animalesCarne.length * valorEstimadoCabeza;

    const totalKgPesados = filteredData.pesajes.reduce((s, e) => s + (e.valor_neto || 0), 0);
    const numPesajes = filteredData.pesajes.length;

    const totalVentasEuros = filteredData.ventasCarne.reduce((s, v) => s + (v.importe_total || v.valor_neto || 0), 0);
    const totalKgMatadero = filteredData.ventasCarne.reduce((s, v) => s + (v.pesoCanal || 0), 0);
    const rendimientoMedio = filteredData.ventasCarne.length > 0 ?
      (filteredData.ventasCarne.reduce((s, v) => s + (v.rendimientoCanal || 0), 0) / filteredData.ventasCarne.length) : 0;

    const totalGastosAlim = filteredData.gastosAlim.reduce((s, g) => s + (g.monto || 0), 0);
    const mofaCarne = totalVentasEuros - totalGastosAlim;
    const ratioMofaCarne = totalVentasEuros > 0 ? (mofaCarne / totalVentasEuros) * 100 : 0;

    return {
      ...filteredData,
      kpis: data.kpis,
      valorPatrimonioTotal,
      totalKgPesados,
      numPesajes,
      totalVentasEuros,
      totalKgMatadero,
      rendimientoMedio,
      totalGastosAlim,
      mofaCarne,
      ratioMofaCarne
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
    document.querySelectorAll('.carne-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    if (!d) return;
    const content = document.getElementById('carne-content');
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
    return `<div class="grid grid-cols-3 gap-6 mb-12">
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
      <div class="card-registro report-section p-16 border-top-3px border-top-3px-orange" style="--registro-color: var(--c-warning);">
        <div class="flex justify-between items-center mb-16">
          <div class="flex items-center gap-12">
            <span class="text-3xl">${Icons.edificio()}</span>
            <div>
              <div class="text-white font-900 text-lg">Patrimonio y Ganadería</div>
              <div class="text-gray text-2xs">Gestión de censo y lotes de carne</div>
            </div>
          </div>
        </div>

        ${this._kpiGrid(d.kpis.patrimonio, 'var(--c-warning)')}

        <!-- Accesos directos táctiles -->
        <div class="grid grid-cols-3 gap-8 mb-16">
          <a href="#/animales" class="widget-link-btn">${Icons.animales()} Animales</a>
          <a href="#/rebanos" class="widget-link-btn">${Icons.rebanos()} Rebaños</a>
          <a href="#/zonas" class="widget-link-btn">${Icons.zonas()} Zonas</a>
        </div>

        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Lotes de Carne Activos (${d.rebanosCarne.length})
        </div>
        <div class="grid gap-10">
          ${d.rebanosCarne.length > 0
            ? d.rebanosCarne.map(r => `
                <div class="card-registro" onclick="location.hash='/rebano?id=${r.id}'" style="--registro-color: var(--p-gold-dark);">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-8">
                        <span class="text-xl text-gold">${Icons.rebanos()}</span>
                        <h3 class="section-h3 m-0 text-ellipsis">${r.nombre}</h3>
                      </div>
                      <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray font-800 uppercase">
                        <span>Especie: <span class="text-ccc">${r.especie}</span></span>
                        <span>·</span>
                        <span>Ubicación: <span class="text-ccc">${r.zonaActual || 'Sin zona'}</span></span>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-8">
                      <span class="badge badge-sm badge-gold block mb-4 font-950">${(c => c + " " + (c === 1 ? "cabeza" : "cabezas"))(d.animalesCarne.filter(a => a.rebanoId === r.id && (a.estado || "").toLowerCase() === "activo").length)}</span>
                      <span class="text-[0.5rem] text-gray-700 font-900 uppercase">Ver ficha ➔</span>
                    </div>
                  </div>
                </div>`).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-xs uppercase font-900 tracking-widest">${Icons.buscar()} Sin lotes de carne registrados.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  // ========== BLOQUE 3: LOGÍSTICA Y TRANSPORTE, COMERCIALIZACIÓN VENTAS ==========
  _renderComercializacion(content, d) {
    const html = `
      <div class="card-registro" style="--registro-color: var(--c-success);">
        <div class="flex justify-between items-center mb-16">
          <div class="flex items-center gap-12">
            <span class="text-3xl">${Icons.transportistas()}</span>
            <div>
              <div class="text-white font-900 text-lg">Logística y Transporte, Comercialización Ventas</div>
              <div class="text-gray text-2xs">Logística, vehículos, compradores, contratos y ventas</div>
            </div>
          </div>
          <button class="btn btn-create btn-sm" onclick="App._abrirWizardVentaMasiva()">
            ${Icons.agregar()} Registrar Venta
          </button>
        </div>

        ${this._kpiGrid(d.kpis.comercializacion, 'var(--c-success)')}

        <!-- Accesos directos comerciales -->
        <div class="grid grid-cols-3 gap-8 mb-16">
          <a href="#/compradores" class="widget-link-btn">${Icons.compradores()} Compradores</a>
          <a href="#/transportistas" class="widget-link-btn">${Icons.transportistas()} Logística</a>
          <a href="#/comercializacion" class="widget-link-btn">${Icons.comercial()} Comercial</a>
        </div>

        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Historial de Facturas/Matadero
        </div>
        <div class="grid gap-10">
          ${d.ventasCarne.length > 0
            ? d.ventasCarne.slice(0, 15).map(v => `
                <div class="card-registro" onclick="App._abrirDetalleVentaCarne(${v.id})" style="--registro-color: var(--c-success);">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-8">
                        <span class="text-xl text-green">${Icons.documento()}</span>
                        <h3 class="section-h3 m-0 text-ellipsis">${v.numero_albaran || 'ALBARÁN'} · ${v.razonSocial || 'MATADERO'}</h3>
                      </div>
                      <div class="flex wrap gap-4 mt-4 text-[0.65rem] text-gray font-800 uppercase">
                        <span>${Icons.calendar()} ${this._fmtFecha(v.fechaSacrificio)}</span>
                        <span>·</span>
                        <span>Rend: <span class="text-green font-900">${v.rendimientoCanal || 0}%</span> · Clasif: <span class="text-gold font-900">${v.clasificacionCanal || 'N/D'}</span></span>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-8">
                      <span class="badge badge-sm text-green font-black text-lg badge-green-outline block">${Math.round(v.importe_total || v.valor_neto || 0).toLocaleString()} €</span>
                    </div>
                  </div>
                </div>`).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-xs uppercase font-900 tracking-widest">${Icons.buscar()} Sin albaranes de matadero registrados.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  // ========== BLOQUE 4: REGISTROS, LEGISLACIÓN Y CUMPLIMIENTO SANITARIO ==========
  _renderLegislacion(content, d) {
    // Alertas de supresión
    let supresionesHtml = '';
    if (d.tratamientosSupresion.length > 0) {
      supresionesHtml = `
        <div class="supresion-alerta-box">
          <strong class="flex items-center gap-6">${Icons.alerta()} ALERTA: SUPRESIÓN DE CARNE ACTIVA:</strong>
          <ul class="mt-4 pl-20 m-0">
            ${d.tratamientosSupresion.map(s => `
              <li>Rebaño: <strong class="text-white">${s.rebanoId}</strong> (Medicamento: <strong class="text-white">${s.medicamento}</strong>) — Restan <strong class="text-white">${s.diasRestantes} ${s.diasRestantes === 1 ? 'día' : 'días'}</strong> (Finaliza: ${s.fechaFin})</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    const html = `
      ${supresionesHtml}
      <div class="card-registro" style="--registro-color: var(--c-purple);">
        <div class="flex justify-between items-center mb-16">
          <div class="flex items-center gap-12">
            <span class="text-3xl">${Icons.documento()}</span>
            <div>
              <div class="text-white font-900 text-lg">Registros Legislación, Cumplimiento Sanitario</div>
              <div class="text-gray text-2xs">Cuaderno sanitario, supresión y documentos obligatorios (DIMOE)</div>
            </div>
          </div>
          <div class="flex gap-4">
            <button class="btn btn-secondary btn-sm btn--purple" onclick="CarneView._abrirAsistenteTratamientoCarne()">
              ${Icons.agregar()} Registrar Tratamiento
            </button>
          </div>
        </div>

        ${this._kpiGrid(d.kpis.legislacion, 'var(--c-purple)')}

        <!-- Accesos directos de legislación -->
        <div class="grid grid-cols-2 gap-8 mb-16">
          <a href="#/documentos" class="widget-link-btn">${Icons.documento()} Documentación Oficial</a>
          <a href="#/cuaderno" class="widget-link-btn">${Icons.cuaderno()} Cuaderno de Explotación</a>
        </div>

        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Historial Sanitario Cárnico (${d.sanitariosCarne.length})
        </div>
        <div class="grid gap-10">
          ${d.sanitariosCarne.length > 0
            ? d.sanitariosCarne.slice(0, 15).map(s => {
                const enSup = d.tratamientosSupresion.some(ts => ts.id === s.id);
                return `
                  <div class="card-registro" style="--registro-color: ${enSup ? 'var(--c-danger)' : 'var(--c-purple)'};">
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-8">
                          <span>
                      </div>
                  </div>
                `;
              }).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-xs uppercase font-900 tracking-widest">${Icons.buscar()} Sin tratamientos sanitarios registrados.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  async _abrirOpcionesRegistro(id) {
    try {
      const evento = await window.db.get('registro_eventos', id);
      if (!evento) return;

      const [rebanos, finca] = await Promise.all([
        window.db.getAll('rebanos'),
        Fincas.getActive()
      ]);
      const zonas = finca?.zonas || [];

      const overlay = document.createElement("div");
      overlay.className = "wizard-full-screen";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
      overlay.innerHTML = `
          <div class="card-registro p-25" style="max-width:420px;  overflow-y:auto; max-height:90vh;; --registro-color: var(--c-gray);">
              <h3 class="mt-0 text-gold">Editar Registro Cárnico</h3>
              <p class="text-xs text-gray mb-15">ID Interno: ${evento.id}</p>

              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                  <label class="wizard-label">Peso (${evento.unidad})</label>
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

              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                  <label class="wizard-label">Zona</label>
                  <select id="edit-reg-zona" class="wizard-input wizard-select">
                    <option value="">Sin zona</option>
                    ${zonas.map(z => `<option value="${z.nombre}" ${evento.snap_zona === z.nombre ? 'selected' : ''}>${z.nombre}</option>`).join('')}
                    </select>
                </div>
              </div>

              <div class="flex gap-10 mt-20">
                  <button class="wizard-btn-action wizard-btn-primary flex-2" id="btn-save-reg">${Icons.guardar()} Guardar</button>
                  <button class="wizard-btn-action wizard-btn-danger flex-1" id="btn-del-reg">${Icons.eliminar()} Borrar</button>
                </div>
                <button class="wizard-btn-action wizard-btn-secondary mt-10 w-full" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
            </div>
          </div>`;
      document.body.appendChild(overlay);

      overlay.querySelector('#btn-save-reg').onclick = async () => {
        const val = parseFloat(overlay.querySelector('#edit-reg-valor').value);
        const fecha = overlay.querySelector('#edit-reg-fecha').value;
        const ident = overlay.querySelector('#edit-reg-ident').value.trim();
        const zona = overlay.querySelector('#edit-reg-zona').value;

        if (isNaN(val) || val <= 0) return App.toastError("Valor inválido");

        evento.valor_neto = val;
        evento.fecha = fecha;
        evento.snap_identificacion = ident;
        evento.snap_zona = zona;
        evento.actualizadoEn = new Date().toISOString();

        await window.db.put('registro_eventos', evento);
        App.toast("Registro de pesaje actualizado");
        overlay.remove();
        CarneView.render();
      };

      overlay.querySelector('#btn-del-reg').onclick = async () => {
        if (!await Confirm.confirm("Eliminar Pesaje", "¿Eliminar este pesaje de forma permanente?", true)) return;
        await window.db.delete('registro_eventos', id);
        App.toast("Registro de pesaje eliminado");
        overlay.remove();
        CarneView.render();
      };
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _abrirAsistenteTratamientoCarne() {
    const d = this._cachedData;
    if (!d || d.rebanosCarne.length === 0) {
      App.toastError("No hay rebaños de carne en esta finca para tratar.");
      return;
    }

    if (d.rebanosCarne.length === 1) {
      await window.WizardTratamiento.registrar(d.rebanosCarne[0].id);
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "wizard-full-screen";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.innerHTML = `
      <div class="card-registro p-25" style="max-width:380px; ; --registro-color: var(--c-gray);">
        <h3 class="mt-0 text-white font-900 flex items-center gap-8">${Icons.sanidad()} Aplicar Tratamiento Cárnico</h3>
        <label class="wizard-label mb-10">Selecciona el rebaño de carne a tratar:</label>
        <select id="w-treat-reb" class="wizard-input wizard-select mb-15">
          ${d.rebanosCarne.map(r => `<option value="${r.id}">${r.nombre} (${r.especie})</option>`).join('')}
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
      setTimeout(() => CarneView.render(), 1000);
    };
  }
};

window.CarneView = CarneView;