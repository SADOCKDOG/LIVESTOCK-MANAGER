/**
 * Livestock Manager - LecheView v3.0.0
 * Vista del Módulo de Leche con las 4 pestañas modulares de gestión unificada
 */

const LecheView = {
  _currentTab: 'patrimonio',
  _cachedData: null,

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  async render() {
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

    main.innerHTML = `
      <div class="mb-14">
        <div class="scroll-shadow-container scroll-tabs-row mb-10">
          <div class="leche-tabs">
            <button class="leche-tab active" data-tab="patrimonio" onclick="LecheView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio y Ganadería</button>
            <button class="leche-tab" data-tab="comercializacion" onclick="LecheView._cambiarTab('comercializacion')">${Icons.transportistas()} Logística y Transporte, Comercialización Ventas</button>
            <button class="leche-tab" data-tab="legislacion" onclick="LecheView._cambiarTab('legislacion')">${Icons.documento()} Registros Legislación, Cumplimiento Sanitario</button>
          </div>
        </div>
      </div>
      <div id="leche-content"><div class="loader">Cargando datos lácteos...</div></div>`;

    this._cachedData = {
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
          { label: 'Raza Principal', value: animalesLeche.length > 0 ? (animalesLeche[0].raza || 'Assaf') : 'Lacaune' }
        ],
        explotacion: [
          { label: 'Litros Control', value: totalLitrosControles.toLocaleString() + ' L' },
          { label: 'Grasa Media', value: grasaMedia.toFixed(2) + '%' },
          { label: 'Alimentación', value: totalGastosAlim.toLocaleString() + ' €', color: '#ef4444' }
        ],
        comercializacion: [
          { label: 'Litros Entregados', value: litrosTotal.toLocaleString() + ' L', color: '#fbbf24' },
          { label: 'Entregas', value: numEntregas },
          { label: 'Facturación Leche', value: Math.round(importeTotal).toLocaleString() + ' €', color: '#10b981' }
        ],
        legislacion: [
          { label: 'Alertas Lácteas', value: alertas + tratamientosSupresionLeche.length, color: alertas + tratamientosSupresionLeche.length > 0 ? '#ef4444' : '#10b981' },
          { label: 'Tratamientos Act.', value: sanitariosLeche.length }
        ]
      }
    };

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
            <li>Rebaño treated: <strong class="text-white">${s.rebanoId}</strong> (Medicamento: <strong class="text-white">${s.medicamento}</strong>) — Restan <strong class="text-white">${s.diasRestantes} días</strong> de supresión para ordeño (Finaliza: ${s.fechaFin})</li>
          `).join('')}
        </ul>
      </div>
    `;
  },

  // ========== BLOQUE 1: PATRIMONIO Y GANADERIA ==========
  _renderPatrimonio(content, d) {
    const html = `
      <div class="card report-section leche-report-card border-top-3px border-top-3px-orange">
        <div class="leche-report-title">
          <span class="leche-report-icon">${Icons.edificio()}</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">Patrimonio y Ganadería</div>
            <div class="leche-report-title-sub">Gestión de censo y rebaños lácteos</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.patrimonio, '#d97706')}

        <!-- Accesos directos táctiles -->
        <div class="grid grid-cols-3 gap-8 mb-16">
          <a href="#/animales" class="widget-link-btn">${Icons.animales()} Animales</a>
          <a href="#/rebanos" class="widget-link-btn">${Icons.rebanos()} Rebaños</a>
          <a href="#/zonas" class="widget-link-btn">${Icons.zonas()} Zonas</a>
        </div>

        <div class="leche-list-header">
          ${Icons.documento()} Rebaños Lácteos Activos (${d.rebanosLeche.length})
        </div>
        <div class="grid gap-10">
          ${d.rebanosLeche.length > 0
            ? d.rebanosLeche.map(r => `
                <div class="card card-animal border-4-left-gold" onclick="location.hash='/rebano?id=${r.id}'">
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
                      <span class="badge badge-sm badge-gold block mb-4">${r.cantidad_animales || 0} cabezas</span>
                      <span class="text-xs text-777">Ficha ➔</span>
                    </div>
                  </div>
                </div>`).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">📭 Sin lotes registrados.</span></div>`
          }
        </div>
      </div>
    `;
    content.innerHTML = html;
  },



  // ========== BLOQUE 3: LOGÍSTICA Y TRANSPORTE, COMERCIALIZACIÓN VENTAS ==========
  _renderComercializacion(content, d) {
    const html = `
      <div class="card report-section leche-report-card border-top-3px border-top-3px-green">
        <div class="leche-report-title">
          <span class="leche-report-icon">${Icons.transportistas()}</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">Logística y Transporte, Comercialización Ventas</div>
            <div class="leche-report-title-sub">Logística, cisternas, compradores, contratos y ventas</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.comercializacion, '#10b981')}

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
      <div class="card report-section leche-report-card border-top-3px border-top-3px-purple">
        <div class="leche-report-title">
          <span class="leche-report-icon">${Icons.documento()}</span>
          <div class="leche-report-title-text">
            <div class="leche-report-title-main">Registros Legislación, Cumplimiento Sanitario</div>
            <div class="leche-report-title-sub">Cuaderno de explotación, control oficial Letra Q y supresiones</div>
          </div>
        </div>
        ${this._kpiGrid(d.kpis.legislacion, '#8b5cf6')}

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
        <div class="grid gap-10">
          ${d.sanitariosLeche.length > 0
            ? d.sanitariosLeche.slice(0, 15).map(s => {
                const enSup = d.tratamientosSupresionLeche.some(ts => ts.id === s.id);
                return `
                  <div class="card card-animal" style="border-left:4px solid ${enSup ? '#ef4444' : '#8b5cf6'};">
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-6">
                          <span class="text-xl">${Icons.sanidad()}</span>
                          <h3 class="section-h3 m-0 text-ellipsis">${s.medicamento || s.tipo_tratamiento}</h3>
                        </div>
                        <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                          <span>${Icons.calendar()} ${this._fmtFecha(s.fecha)}</span>
                          <span>·</span>
                          <span>Espera Leche: <strong>${s.tiempo_espera_leche_dias || 0} días</strong></span>
                        </div>
                      </div>
                      <div class="text-right flex-shrink-0 ml-8">
                        <span class="badge badge-sm" style="background:${enSup ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)'}; color:${enSup ? '#ef4444' : '#8b5cf6'}; border:1px solid ${enSup ? '#ef4444' : '#8b5cf6'}40;">${enSup ? 'EN SUPRESIÓN' : 'LIBRE'}</span>
                      </div>
                    </div>
                  </div>`;
              }).join('')
            : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">📭 Sin tratamientos sanitarios registrados.</span></div>`
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
      <div class="leche-entrega-card" style="--entrega-border-color:${esAlerta ? '#ef4444' : semaforo.color};" onclick="location.hash='/albaran-leche?id=${e.id}'">
        <div class="leche-entrega-content">
          <div class="leche-entrega-left">
            <div>${Icons.calendar()} ${this._fmtFecha(e.fechaRecogida || e.fecha)} — ${(e.cantidad || 0).toLocaleString()} L</div>
            <div class="text-xs text-gray mt-2">Cisterna: ${e.matriculaCisterna || '—'}</div>
          </div>
          <div class="text-right">
            <span class="badge badge-sm" style="background:${esAlerta ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; color:${esAlerta ? '#ef4444' : '#10b981'};">${e.estadoAnalitica || 'PENDIENTE'}</span>
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
          <div class="card p-25" style="max-width:420px; border-top:5px solid #3b82f6;">
              <h3 class="mt-0 text-gold">Editar Registro Lácteo</h3>
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
        App.toast("Registro lácteo actualizado");
        overlay.remove();
        LecheView.render();
      };

      overlay.querySelector('#btn-del-reg').onclick = async () => {
        if (!await Confirm.confirm("Eliminar Control", "¿Eliminar este control de forma permanente?", true)) return;
        await window.db.delete('registro_eventos', id);
        App.toast("Registro lácteo eliminado");
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
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.innerHTML = `
      <div class="card p-25" style="max-width:380px; border-top:5px solid #fbbf24;">
        <h3 class="mt-0 text-white font-900 flex items-center gap-8">${Icons.sanidad()} Aplicar Tratamiento Lácteo</h3>
        <label class="wizard-label mb-10">Selecciona el rebaño lechero a tratar:</label>
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
