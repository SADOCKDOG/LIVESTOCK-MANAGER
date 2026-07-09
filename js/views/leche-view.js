/**
 * Livestock Manager - LecheView v3.0.0
 * Vista del Módulo de Leche con las 4 pestañas modulares de gestión unificada
 */

const LecheView = {
  _currentTab: 'patrimonio',
  _filtroActivo: {
    texto: '',
    tipo: ''
  },
  async render() {
    if (window.App) App.updateHeaderColor('leche');
    const main = document.getElementById("ganaderia-tab-content") || document.getElementById("app-content");
    const fincaId = await Fincas.getActiveId();
    const finca = await Fincas.getActive();

    // Cargar datos
    const [rebanos, animales, entregas, eventos, todosSanitarios, todosGastos] = await Promise.all([
      window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('animales').catch(() => []),
      window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('sanitarios_ganado').catch(() => []),
      window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => [])
    ]);

    entregas.sort((a, b) => new Date(b.fechaRecogida || b.fecha || 0) - new Date(a.fechaRecogida || a.fecha || 0));

    // Filtrar rebanos lecheros
    const rebanosLeche = rebanos.filter(r =>
      r.tipo.toLowerCase().includes('leche') ||
      r.tipo.toLowerCase().includes('láct') ||
      r.tipo.toLowerCase().includes('mixt') ||
      r.tipo.toLowerCase().includes('híbr') ||
      r.tipo.toLowerCase().includes('doble')
    );
    const rebanosLecheIds = rebanosLeche.map(r => r.id);

    // Filtrar animales lecheros
    const animalesLeche = animales.filter(a => rebanosLecheIds.includes(a.rebanoId));

    // Filtrar controles diarios individuales/lote
    const controlesDiarios = eventos.filter(e =>
      (e.unidad === 'L' || e.unidad === 'Litros') &&
      (e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero') &&
      (rebanosLecheIds.includes(e.rebanoId) || e.snap_tipo?.toLowerCase()?.includes('leche') || e.snap_tipo?.toLowerCase()?.includes('láct') || e.snap_tipo?.toLowerCase()?.includes('mixt'))
    );
    controlesDiarios.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    // Filtrar tratamientos de rebaños lecheros
    const sanitariosLeche = todosSanitarios.filter(s => rebanosLecheIds.includes(s.rebanoId));
    sanitariosLeche.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Calcular periodos de supresión de leche activos
    const hoy = new Date();
    const tratamientosSupresionLeche = [];
    sanitariosLeche.forEach(s => {
      const fechaApli = new Date(s.fecha);
      const dLeche = s.tiempo_espera_leche_dias || 0;
      if (dLeche > 0 || s.prohibidoLeche) {
        const fechaFin = new Date(fechaApli.getTime() + (s.prohibidoLeche ? 999 * 24 : dLeche * 24) * 60 * 60 * 1000);
        if (fechaFin > hoy) {
          const diasRestantes = s.prohibidoLeche ? 'INDEFINIDO' : Math.ceil((fechaFin - hoy) / (24 * 60 * 60 * 1000));
          tratamientosSupresionLeche.push({
            ...s,
            diasRestantes,
            fechaFin: s.prohibidoLeche ? 'PROHIBIDO LECHE' : fechaFin.toISOString().split('T')[0]
          });
        }
      }
    });

    // KPIs de entregas
    const litrosTotal = entregas.reduce((s, e) => s + (e.cantidad || 0), 0);
    const numEntregas = entregas.length;
    const mofaTotal = entregas.reduce((s, e) => s + (e.mofa || 0), 0);
    const importeTotal = entregas.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
    const alertas = entregas.filter(e => e.estadoAnalitica === 'Alerta Crítica' || e.antibioticos === true).length;

    // Controles diarios KPIs
    const totalLitrosControles = controlesDiarios.reduce((s, c) => s + (c.valor_neto || 0), 0);
    const numControles = controlesDiarios.length;

    // Analíticas agregadas
    const conLab = entregas.filter(e => e.laboratorio);
    const grasaMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.grasa || 0), 0) / conLab.length : 0;
    const protMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.proteina || 0), 0) / conLab.length : 0;

    // Costes alimentación leche
    const gastosAlim = todosGastos.filter(g =>
      (g.categoria || '').toLowerCase() === 'alimentacion' ||
      (g.categoria || '').toLowerCase() === 'alimentación' ||
      (g.concepto || '').toLowerCase().includes('pienso') ||
      (g.concepto || '').toLowerCase().includes('forraje') ||
      (g.concepto || '').toLowerCase().includes('pasto')
    );
    const totalGastosAlim = gastosAlim.reduce((s, g) => s + (g.monto || 0), 0);

    // Guardar datos brutos para filtrado
    this._cachedDataRaw = {
      fincaId,
      siloEventos: eventos.filter(e => e.tipo_entidad === 'silo_pienso'),
      entregas,
      controlesDiarios,
      finca,
      rebanosLeche,
      animalesLeche,
      tratamientosSupresionLeche,
      sanitariosLeche,
      kpis: {
        patrimonio: [
          { label: 'Censo Leche', value: animalesLeche.length + ' cabezas' },
          { label: 'Lotes Lecheros', value: rebanosLeche.length },
          { label: 'Raza Principal', value: animalesLeche.length > 0 ? (animalesLeche[0].raza || 'N/D') : 'N/D' }
        ],
        explotacion: [
          { label: 'Litros Control', value: totalLitrosControles.toLocaleString() + ' L' },
          { label: 'Grasa Media', value: grasaMedia.toFixed(2) + '%' },
          { label: 'Alimentación', value: totalGastosAlim.toLocaleString() + ' €', color: 'var(--c-danger)' }
        ],
        comercializacion: [
          { label: 'Litros Entregados', value: litrosTotal.toLocaleString() + ' L', color: 'var(--c-warning)' },
          { label: 'Entregas', value: numEntregas },
          { label: 'Facturación Leche', value: Math.round(importeTotal).toLocaleString() + ' €', color: 'var(--c-success)' }
        ],
        legislacion: [
          { label: 'Alertas Lácteas', value: alertas + tratamientosSupresionLeche.length, color: alertas + tratamientosSupresionLeche.length > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
          { label: 'Tratamientos Act.', value: sanitariosLeche.length }
        ]
      },
      litrosTotal,
      numEntregas,
      importeTotal,
      totalLitrosControles,
      numControles,
      grasaMedia,
      protMedia,
      totalGastosAlim
    };

    // Resumen mensual (últimos 6 meses) - basado en fechas de entregas
    const hoyMensual = new Date();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const porMes = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoyMensual.getFullYear(), hoyMensual.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      porMes[key] = { label: meses[d.getMonth()] + ' ' + d.getFullYear(), total: 0 };
    }
    // Contar entregas por mes
    const rawData = this._cachedDataRaw ? this._cachedDataRaw.entregas : [];
    rawData.forEach(e => {
      if (e.fechaRecogida) {
        const fechaStr = e.fechaRecogida;
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
        <div class="leche-bar-wrap">
          <div style="position:absolute;bottom:0;width:100%;height:${pct}%;background:${color};border-radius:6px;opacity:0.8;transition:height 0.3s;"></div>
        </div>
        <div class="text-xs font-bold mt-2" style="color:${color};">${m.total}</div>
      </div>`;
    }).join('');

    // Aplicar filtros iniciales
    const filteredData = this._aplicarFiltrosToData(this._cachedDataRaw);

    main.innerHTML = `

      <!-- Balance Consolidado (Colapsable con App.toggleResumen) -->
      <div class="mb-14">
        <div class="flex items-center gap-12 mb-14">
          <span class="text-2xl" style="color:var(--c-info); display:inline-flex; align-items:center;">${Icons.leche()}</span>
          <div>
            <h1 class="text-white font-900 text-lg uppercase tracking-wider" style="margin:0; line-height:1.2;">
              <span style="color:var(--c-info); margin-right:4px;">|</span> RESUMEN DE LECHE
            </h1>
          </div>
        </div>
        <div id="resumen-leche" class="space-y-6 text-white card p-12" style="background: rgba(255,255,255,0.01);">
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.edificio()} Patrimonio Lechero</span>
            <strong class="text-xl font-950" style="color: var(--c-info);">${filteredData.animalesLeche.length} ${filteredData.animalesLeche.length === 1 ? "cabeza" : "cabezas"}</strong>
          </div>
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.calculo()} Producción Diaria</span>
            <strong class="text-xl font-950 text-green">${filteredData.totalLitrosControles.toLocaleString()} L</strong>
          </div>
          <div class="py-8 flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.dinero()} Facturación Leche</span>
            <strong class="text-xl font-950 text-blue">${filteredData.importeTotal.toLocaleString()} €</strong>
          </div>
        </div>
      </div>

      <!-- Filtro de búsqueda integrado (controla el listado) -->
      <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-5">
        ${Icons.documento()} Historial de Entregas y Controles
      </div>
      <div class="flex gap-8 items-center mb-12">
        <div class="relative flex-1 min-w-0">
          <input type="search" id="search-leche" placeholder="Buscar por matricula, fecha o concepto..."
                 oninput="LecheView._setFiltro('texto', this.value)"
                 class="form-input search-input w-full" style="margin-top:0;">
        </div>
        <select id="leche-filtro-tipo" class="form-select"
                onchange="LecheView._setFiltro('tipo', this.value)"
                style="width:120px; min-width:110px; flex-shrink:0; padding:12px; min-height:44px;">
          <option value="">Todos los tipos</option>
          <option value="entrega" ${this._filtroActivo.tipo === 'entrega' ? 'selected' : ''}>Entregas</option>
          <option value="control" ${this._filtroActivo.tipo === 'control' ? 'selected' : ''}>Controles Diarios</option>
          <option value="tratamiento" ${this._filtroActivo.tipo === 'tratamiento' ? 'selected' : ''}>Tratamientos</option>
          <option value="gasto" ${this._filtroActivo.tipo === 'gasto' ? 'selected' : ''}>Gastos</option>
        </select>
      </div>

      <!-- Tabs -->
      <div class="mb-14">
        <div class="scroll-shadow-container scroll-tabs-row mb-10">
          <div class="leche-tabs">
            <button class="leche-tab ${this._currentTab === 'patrimonio' ? 'active' : ''}" data-tab="patrimonio" onclick="LecheView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio y Ganadería</button>
            <button class="leche-tab ${this._currentTab === 'comercializacion' ? 'active' : ''}" data-tab="comercializacion" onclick="LecheView._cambiarTab('comercializacion')">${Icons.transportistas()} Logística y Transporte, Comercialización Ventas</button>
            <button class="leche-tab ${this._currentTab === 'legislacion' ? 'active' : ''}" data-tab="legislacion" onclick="LecheView._cambiarTab('legislacion')">${Icons.documento()} Registros Legislación, Cumplimiento Sanitario</button>
          </div>
        </div>
      </div>
      <div id="leche-content"><div class="loader">Cargando datos lácteos...</div></div>
      <!-- Botón Flotante de Acción con viñeta -->
      <div class="fab-container" style="--fab-neon-color: var(--c-info);" onclick="App._abrirAsistenteProduccion('leche', { origen_modulo: 'leche' })">
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
        case 'entrega':
          filteredData.entregas = data.entregas.filter(e =>
            (e.matriculaCisterna || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (e.concepto || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (e.estadoAnalitica || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        case 'control':
          filteredData.controlesDiarios = data.controlesDiarios.filter(c =>
            (c.snap_identificacion || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (c.concepto || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          break;
        case 'tratamiento':
          filteredData.sanitariosLeche = data.sanitariosLeche.filter(s =>
            (s.medicamento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase()) ||
            (s.tipo_tratamiento || '').toLowerCase().includes(this._filtroActivo.texto.toLowerCase())
          );
          filteredData.tratamientosSupresionLeche = data.tratamientosSupresionLeche.filter(s =>
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
            filteredData.entregas = data.entregas.filter(e =>
              (e.matriculaCisterna || '').toLowerCase().includes(q) ||
              (e.concepto || '').toLowerCase().includes(q) ||
              (e.estadoAnalitica || '').toLowerCase().includes(q)
            );
            filteredData.controlesDiarios = data.controlesDiarios.filter(c =>
              (c.snap_identificacion || '').toLowerCase().includes(q) ||
              (c.concepto || '').toLowerCase().includes(q)
            );
            filteredData.sanitariosLeche = data.sanitariosLeche.filter(s =>
              (s.medicamento || '').toLowerCase().includes(q) ||
              (s.tipo_tratamiento || '').toLowerCase().includes(q)
            );
            filteredData.tratamientosSupresionLeche = data.tratamientosSupresionLeche.filter(s =>
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
      filteredData.entregas = data.entregas.filter(e =>
        (e.matriculaCisterna || '').toLowerCase().includes(q) ||
        (e.concepto || '').toLowerCase().includes(q) ||
        (e.estadoAnalitica || '').toLowerCase().includes(q)
      );
      filteredData.controlesDiarios = data.controlesDiarios.filter(c =>
        (c.snap_identificacion || '').toLowerCase().includes(q) ||
        (c.concepto || '').toLowerCase().includes(q)
      );
      filteredData.sanitariosLeche = data.sanitariosLeche.filter(s =>
        (s.medicamento || '').toLowerCase().includes(q) ||
        (s.tipo_tratamiento || '').toLowerCase().includes(q)
      );
      filteredData.tratamientosSupresionLeche = data.tratamientosSupresionLeche.filter(s =>
        (s.medicamento || '').toLowerCase().includes(q)
      );
      filteredData.gastosAlim = data.gastosAlim.filter(g =>
        (g.concepto || '').toLowerCase().includes(q)
      );
    }

    // Recalcular KPIs basados en datos filtrados
    const litrosTotal = filteredData.entregas.reduce((s, e) => s + (e.cantidad || 0), 0);
    const numEntregas = filteredData.entregas.length;
    const importeTotal = filteredData.entregas.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
    const alertas = filteredData.entregas.filter(e => e.estadoAnalitica === 'Alerta Crítica' || e.antibioticos === true).length;

    const totalLitrosControles = filteredData.controlesDiarios.reduce((s, c) => s + (c.valor_neto || 0), 0);
    const numControles = filteredData.controlesDiarios.length;

    const conLab = filteredData.entregas.filter(e => e.laboratorio);
    const grasaMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.grasa || 0), 0) / conLab.length : 0;
    const protMedia = conLab.length > 0 ? conLab.reduce((s, e) => s + (e.laboratorio.proteina || 0), 0) / conLab.length : 0;

    return {
      ...filteredData,
      kpis: data.kpis,
      litrosTotal,
      numEntregas,
      importeTotal,
      alertas,
      totalLitrosControles,
      numControles,
      grasaMedia,
      protMedia
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

  _inyectarAlertaSupresion(d) {
    if (d.tratamientosSupresionLeche.length === 0) return '';
    return `
      <div class="leche-alerta-box">
        <strong>${Icons.alerta()} CRÍTICO - SUPRESIÓN DE LECHE EN CURSO (ANTIBIÓTICOS/INHIBIDORES):</strong>
        <ul class="mt-4 pl-20 m-0">
          ${d.tratamientosSupresionLeche.map(s => `
            <li>Rebaño en tratamiento: <strong class="text-white">${s.rebanoId}</strong> (Medicamento: <strong class="text-white">${s.medicamento}</strong>) — ${typeof s.diasRestantes === 'number' ? `Restan <strong class="text-white">${s.diasRestantes} ${s.diasRestantes === 1 ? 'día' : 'días'}</strong> de supresión para ordeño` : '<strong class="text-white">Supresión indefinida</strong>'} (Finaliza: ${s.fechaFin})</li>
          `).join('')}
        </ul>
      </div>
    `;
  },

  // ========== BLOQUE 1: PATRIMONIO Y GANADERIA ==========
  _renderPatrimonio(content, d) {
    const html = `
      <div class="card report-section leche-report-card" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="leche-report-title">
          <span class="leche-report-icon" style="color: var(--c-orange);">${Icons.edificio()}</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main" style="text-transform: uppercase; font-weight: 900;"><span style="color: var(--c-orange);">|</span> PATRIMONIO Y GANADERÍA</div>
            <div class="leche-report-title-sub">Gestión de censo y rebaños lácteos</div>
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
          ${Icons.documento()} Rebaños Lácteos Activos (${d.rebanosLeche.length})
        </div>
        <div class="gap-10">
          ${d.rebanosLeche.length > 0
            ? d.rebanosLeche.map(r => `
                <div class="card-registro" onclick="location.hash='/rebano?id=${r.id}'" style="--registro-color: ${window.ModoContextoHelper.getEspecieColor(r.especie) || '#6B7280'};">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-6">
                        <span class="text-xl">${Icons.rebanos()}</span>
                        <h3 class="section-h3 m-0 text-ellipsis">${r.nombre}</h3>
                      </div>
                      <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                        <span>Especie: ${r.especie}</span>
                        <span>·</span>
                        <span>Ubicación: ${r.zonaActual || 'Sin zona'}</span>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-8">
                      <span class="badge badge-sm badge-gold block mb-4">${(c => c + " " + (c === 1 ? "cabeza" : "cabezas"))(d.animalesLeche.filter(a => a.rebanoId === r.id && (a.estado || "").toLowerCase() === "activo").length)}</span>
                      <span class="text-xs text-777">Ficha ➔</span>
                    </div>
                  </div>
                </div>`).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">${Icons.buscar()} Sin lotes registrados.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  // ========== BLOQUE 3: LOGÍSTICA Y TRANSPORTE, COMERCIALIZACIÓN VENTAS ==========
  _renderComercializacion(content, d) {
    const html = `
      <div class="card" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="leche-report-title">
          <span class="leche-report-icon" style="color: var(--c-success);">${Icons.transportistas()}</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main" style="text-transform: uppercase; font-weight: 900;"><span style="color: var(--c-success);">|</span> LOGÍSTICA Y TRANSPORTE, COMERCIALIZACIÓN VENTAS</div>
            <div class="leche-report-title-sub">Logística, cisternas, compradores, contratos y ventas</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.comercializacion, 'var(--c-success)')}

        <div class="text-center mb-12">
          <button class="btn btn-create btn-sm" onclick="App._abrirWizardAlbaranLeche()">
            ${Icons.agregar()} Nueva Entrega (Cisterna)
          </button>
        </div>

        <!-- Accesos directos comerciales -->
        <div class="grid grid-cols-3 gap-8 mb-16">
          <a href="#/compradores" class="widget-link-btn">${Icons.compradores()} Compradores</a>
          <a href="#/transportistas" class="widget-link-btn">${Icons.transportistas()} Cisternas</a>
          <a href="#/comercializacion" class="widget-link-btn">${Icons.comercial()} Comercial</a>
        </div>

        <div class="leche-list-header">
          ${Icons.documento()} Historial de Entregas a Cisterna
        </div>
        ${d.entregas.length > 0
          ? d.entregas.slice(0, 15).map(e => this._cardEntrega(e)).join('')
          : `<div class="empty-state"><p class="empty-state-text">Sin entregas a cisterna.</p></div>`
        }
      </div>
    `;
    content.innerHTML = html;
  },

  // ========== BLOQUE 4: REGISTROS, LEGISLACIÓN Y CUMPLIMIENTO SANITARIO ==========
  _renderLegislacion(content, d) {
    const html = `
      ${this._inyectarAlertaSupresion(d)}
      <div class="card" style="border: 1px solid #27272a; background: #1E1E1E;">
        <div class="leche-report-title">
          <span class="leche-report-icon" style="color: var(--c-purple);">${Icons.documento()}</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main" style="text-transform: uppercase; font-weight: 900;"><span style="color: var(--c-purple);">|</span> REGISTROS LEGISLACIÓN, CUMPLIMIENTO SANITARIO</div>
            <div class="leche-report-title-sub">Cuaderno de explotación, control oficial Letra Q y supresiones</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.legislacion, 'var(--c-purple)')}

        <div class="text-center mb-12">
          <button class="btn btn-secondary btn-sm btn--purple w-auto inline-flex" onclick="LecheView._abrirAsistenteTratamientoLeche()">
            ${Icons.sanidad()} Registrar Tratamiento
          </button>
        </div>

        <!-- Accesos directos de legislación -->
        <div class="grid grid-cols-2 gap-8 mb-16">
          <a href="#/documentos" class="widget-link-btn">${Icons.documento()} Documentos</a>
          <a href="#/cuaderno" class="widget-link-btn">${Icons.cuaderno()} Cuaderno de Explotación</a>
        </div>

        <div class="leche-list-header">
          ${Icons.documento()} Historial Sanitario Lácteo (${d.sanitariosLeche.length})
        </div>
        <div class="gap-10">
          ${d.sanitariosLeche.length > 0
            ? d.sanitariosLeche.slice(0, 15).map(s => {
                const enSup = d.tratamientosSupresionLeche.some(ts => ts.id === s.id);
                return `
                  <div class="card-registro" style="--registro-color: ${enSup ? 'var(--c-danger)' : 'var(--c-purple)'};">
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-8">
                          <span class="text-xl" style="color:${enSup ? 'var(--c-danger)' : 'var(--c-purple)'}">${Icons.sanidad()}</span>
                          <h3 class="section-h3 m-0 text-ellipsis font-900 uppercase">${s.medicamento || s.tipo_tratamiento || 'Tratamiento'}</h3>
                        </div>
                        <div class="flex flex-wrap gap-4 mt-6 text-[0.65rem] text-gray uppercase font-800 tracking-tight">
                          <span>${Icons.calendar()} ${this._fmtFecha(s.fecha)}</span>
                          <span>·</span>
                          <span>Espera Leche: <strong class="text-white bg-blue-900 px-4 rounded-sm">${s.tiempo_espera_leche_dias || 0} ${(s.tiempo_espera_leche_dias || 0) === 1 ? 'DÍA' : 'DÍAS'}</strong></span>
                        </div>
                      </div>
                      <div class="text-right flex-shrink-0 ml-8">
                        <span class="badge badge-sm font-950 tracking-tighter" style="background:${enSup ? 'rgba(255,68,68,0.2)' : 'rgba(168,85,247,0.15)'}; color:${enSup ? 'var(--c-danger)' : 'var(--c-purple)'}; border:1px solid color-mix(in srgb, ${enSup ? 'var(--c-danger)' : 'var(--c-purple)'} 38%, transparent);">${enSup ? 'EN SUPRESIÓN' : 'LIBRE'}</span>
                      </div>
                    </div>
                  </div>`;
              }).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-xs uppercase font-900 tracking-widest">${Icons.buscar()} Sin tratamientos sanitarios registrados.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },

  _cardEntrega(e) {
    const esAlerta = e.estadoAnalitica === 'Alerta Crítica' || e.antibioticos === true;
    const semaforo = window.CalidadLecheHelper ? window.CalidadLecheHelper.semaforoCalidad(e) : { color: '#888', label: '' };

    return `
      <div class="card-registro" onclick="location.hash='/albaran-leche?id=${e.id}'"
           style="--registro-color: ${esAlerta ? 'var(--c-danger)' : semaforo.color};">
        <div class="leche-entrega-content">
          <div class="leche-entrega-left">
            <div class="text-white font-900 uppercase text-sm flex items-center gap-6">${Icons.calendar()} ${this._fmtFecha(e.fechaRecogida || e.fecha)} — <span class="text-gold" style="font-size:1.1rem;">${(e.cantidad || 0).toLocaleString()}</span> <small class="text-aaa">L</small></div>
            <div class="text-[0.65rem] text-gray uppercase font-800 mt-2 tracking-widest">Cisterna: <span class="text-white">${e.matriculaCisterna || '—'}</span></div>
          </div>
          <div class="text-right">
            <span class="badge badge-sm font-950 tracking-tighter" style="background:${esAlerta ? 'rgba(255,68,68,0.2)' : 'rgba(204,255,0,0.15)'}; color:${esAlerta ? 'var(--c-danger)' : 'var(--c-success)'}; border: 1px solid color-mix(in srgb, ${esAlerta ? 'var(--c-danger)' : 'var(--c-success)'} 25%, transparent);">${e.estadoAnalitica || 'PENDIENTE'}</span>
          </div>
        </div>
      </div>`;
  },

  // ========== EDITAR REGISTROS DE ORDEÑO ==========
  async _abrirOpcionesControl(id) {
    try {
      const evento = await window.db.get('registro_eventos', id);
      if (!evento) return;

      const overlay = document.createElement("div");
      overlay.className = "wizard-full-screen";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
      overlay.innerHTML = `
          <div class="card p-25" style="border: 1px solid var(--c-orange); max-width:420px; ">
              <h3 class="mt-0 uppercase font-900 text-white"><span style="color: var(--c-orange);">|</span> EDITAR REGISTRO LÁCTEO</h3>
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
        LecheView.render();
      };

      overlay.querySelector('#btn-del-reg').onclick = async () => {
        if (!await Confirm.confirm("Eliminar Control", "¿Eliminar este control de forma permanente?", true)) return;
        await window.db.delete('registro_eventos', id);
        App.toast("Registro lácteo eliminado", "success");
        overlay.remove();
        LecheView.render();
      };
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _abrirAsistenteTratamientoLeche() {
    const d = this._cachedData;
    if (!d || d.rebanosLeche.length === 0) {
      App.toastError("No hay rebaños lecheros en esta finca para tratar.");
      return;
    }

    if (d.rebanosLeche.length === 1) {
      await window.WizardTratamiento.registrar(d.rebanosLeche[0].id);
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "wizard-full-screen";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.innerHTML = `
      <div class="card p-25" style="border: 1px solid var(--c-orange); max-width:380px; ">
        <h3 class="mt-0 text-white font-900 uppercase flex items-center gap-8"><span style="color: var(--c-orange);">|</span> APLICAR TRATAMIENTO LÁCTEO</h3>
        <label class="wizard-label mb-10">Selecciona el rebaño lechero a traiter:</label>
        <select id="w-treat-reb" class="wizard-input wizard-select mb-15">
          ${d.rebanosLeche.map(r => `<option value="${r.id}">${r.nombre} (${r.especie})</option>`).join('')}
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
      setTimeout(() => LecheView.render(), 1000);
    };
  },

};

window.LecheView = LecheView;