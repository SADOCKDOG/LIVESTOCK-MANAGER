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
        // Datos operativos de entrega (vínculo INFOLAC). La facturación/liquidación
        // vive en ComercializacionView; LecheView es control técnico-biológico.
        comercializacion: [
          { label: 'Litros Entregados', value: litrosTotal.toLocaleString() + ' L', color: 'var(--c-warning)' },
          { label: 'Entregas', value: numEntregas },
          { label: 'MOFA (Neto)', value: Math.round(mofaTotal).toLocaleString() + ' €', color: 'var(--c-info)' }
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

    const promedioCabeza = filteredData.animalesLeche.length > 0 
      ? (filteredData.totalLitrosControles / filteredData.animalesLeche.length).toFixed(1) 
      : '0.0';

    main.innerHTML = `
      <!-- Balance Técnico de Control Lechero Biológico -->
      <div class="mb-14">
        <div class="flex items-center gap-12 mb-14 px-4 animate-fade-in">
          <span class="text-2xl" style="color:var(--c-info); display:inline-flex; align-items:center;">${Icons.leche()}</span>
          <div>
            <h1 class="text-white font-900 text-lg uppercase tracking-wider" style="margin:0; line-height:1.2;">
              <span style="color:var(--c-info); margin-right:4px;">|</span> CONTROL LECHERO
            </h1>
            <div class="text-gray" style="font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
              Rendimiento técnico-biológico de ordeño de animales
            </div>
          </div>
        </div>

        <div class="card p-12 mb-14" style="background: rgba(255,255,255,0.01); border: 1px solid #27272a;">
          <div class="grid grid-cols-3 gap-8 text-center">
            <div class="leche-kpi-item" style="--kpi-color:var(--c-orange); --kpi-value-color:#fff">
              <small class="leche-kpi-label">Censo Ordeño</small>
              <div class="leche-kpi-value" style="font-size: 1.1rem; font-weight: 950;">${filteredData.animalesLeche.length} cab.</div>
            </div>
            <div class="leche-kpi-item" style="--kpi-color:var(--c-info); --kpi-value-color:#fff">
              <small class="leche-kpi-label">Litros Control</small>
              <div class="leche-kpi-value" style="font-size: 1.1rem; font-weight: 950; color: var(--c-success);">${filteredData.totalLitrosControles.toLocaleString()} L</div>
            </div>
            <div class="leche-kpi-item" style="--kpi-color:var(--c-purple); --kpi-value-color:#fff">
              <small class="leche-kpi-label">Media Diaria</small>
              <div class="leche-kpi-value" style="font-size: 1.1rem; font-weight: 950; color: var(--p-gold);">${promedioCabeza} L/cab</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Buscador rápido para los controles diarios de ordeño -->
      <div class="flex gap-8 items-center mb-12 px-4">
        <div class="relative flex-1 min-w-0">
          <input type="search" id="search-leche" placeholder="Buscar control por crotal o fecha..."
                 oninput="LecheView._setFiltro('texto', this.value)"
                 value="${this._filtroActivo.texto || ''}"
                 class="form-input search-input w-full" style="margin-top:0;">
        </div>
      </div>

      <div class="grid gap-14">
        <!-- SECCIÓN 1: Rebaños Lácteos Activos -->
        <div class="card p-14 border-222" style="background: rgba(255,255,255,0.01);">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-6 flex justify-between items-center">
            <span>${Icons.rebanos()} Rebaños Lácteos Activos (${filteredData.rebanosLeche.length})</span>
          </div>
          <div class="grid gap-10">
            ${filteredData.rebanosLeche.length > 0
              ? filteredData.rebanosLeche.map(r => `
                  <div class="card-registro" onclick="location.hash='/rebano?id=${r.id}'" style="--registro-color: ${window.ModoContextoHelper?.getEspecieColor(r.especie) || '#6B7280'};">
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
                        <span class="badge badge-sm badge-gold block mb-4">${filteredData.animalesLeche.filter(a => a.rebanoId === r.id && (a.estado || "").toLowerCase() === "activo").length} cabezas</span>
                        <span class="text-xs text-777">Ficha ➔</span>
                      </div>
                    </div>
                  </div>`).join('')
              : `<div class="p-14 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-sm">${Icons.buscar()} Sin lotes registrados.</span></div>`
            }
          </div>
        </div>

        <!-- SECCIÓN 2: Histórico de Controles Diarios de Ordeño -->
        <div class="card p-14 border-222" style="background: rgba(255,255,255,0.01);">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-6">
            <span>${Icons.documento()} Histórico de Controles Diarios de Ordeño (${filteredData.controlesDiarios.length})</span>
          </div>
          <div class="grid gap-10">
            ${filteredData.controlesDiarios.length > 0
              ? filteredData.controlesDiarios.slice(0, 30).map(c => `
                  <div class="card-registro" onclick="LecheView._abrirOpcionesControl(${c.id})" style="--registro-color: var(--c-info);">
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-6">
                          <span class="text-xl text-blue">${Icons.leche()}</span>
                          <h3 class="section-h3 m-0 text-ellipsis">${c.snap_identificacion || 'Control Lote'}</h3>
                        </div>
                        <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                          <span>Fecha: ${this._fmtFecha(c.fecha)}</span>
                          <span>·</span>
                          <span>${c.concepto || 'Control Lechero'}</span>
                        </div>
                      </div>
                      <div class="text-right flex-shrink-0 ml-8">
                        <span class="badge badge-sm uppercase" style="background: rgba(59,130,246,0.15); color: var(--c-info); border: 1px solid rgba(59,130,246,0.25); font-weight:900;">${c.valor_neto} L</span>
                        <span class="text-xs text-777 block mt-4">Editar ➔</span>
                      </div>
                    </div>
                  </div>`).join('')
              : `<div class="p-14 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-sm">${Icons.buscar()} Sin controles diarios registrados.</span></div>`
            }
          </div>
        </div>
      </div>

      <!-- FAB Rediseñado de Registro de Ordeño Diario -->
      <div class="fab-container" style="--fab-neon-color: var(--c-info);" onclick="App._abrirAsistenteProduccion('leche', { origen_modulo: 'leche' })">
        <span class="fab-label">Registrar Ordeño</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;

    // Actualizar datos filtrados para el contenido
    this._cachedData = filteredData;
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
              <button class="wizard-btn-action wizard-btn-secondary mt-10 w-full" onclick="LecheView._cerrarOverlayRegistro(this)">Cancelar</button>
          </div>`;
      document.body.appendChild(overlay);

      LecheView._registroGuardado = false;
      App.setExitGuard(() => LecheView._confirmSalirOverlayRegistro());

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
        LecheView._registroGuardado = true;
        App.clearExitGuard();
        App.toast("Registro lácteo actualizado", "success");
        overlay.remove();
        LecheView.render();
      };

      overlay.querySelector('#btn-del-reg').onclick = async () => {
        if (!await Confirm.confirm("Eliminar Control", "¿Eliminar este control de forma permanente?", true)) return;
        await window.db.delete('registro_eventos', id);
        LecheView._registroGuardado = true;
        App.clearExitGuard();
        App.toast("Registro lácteo eliminado", "success");
        overlay.remove();
        LecheView.render();
      };
    } catch (e) {
      App.toastError(e.message);
    }
  },

  /** Guarda de salida compartida con el botón físico Android (ver App.setExitGuard). */
  async _confirmSalirOverlayRegistro() {
    if (this._registroGuardado) return true;
    return await Confirm.confirm("Salir sin guardar", "¿Cerrar sin guardar datos?", false);
  },

  async _cerrarOverlayRegistro(btn) {
    if (!(await this._confirmSalirOverlayRegistro())) return;
    App.clearExitGuard();
    const overlay = btn.closest('.wizard-full-screen');
    if (overlay) overlay.remove();
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

  _fmtFecha(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  _setFiltro(type, value) {
    this._filtroActivo[type] = value;
    this._aplicarFiltros();
  },

  _aplicarFiltros() {
    if (!this._cachedDataRaw) return;
    const filteredData = this._aplicarFiltrosToData(this._cachedDataRaw);
    this._cachedData = filteredData;
    this.render();
    
    // Mantener el foco en el input tras renderizar
    setTimeout(() => {
      const inp = document.getElementById('search-leche');
      if (inp) {
        inp.focus();
        // Mover el cursor al final del texto para una escritura fluida
        const val = inp.value;
        inp.value = '';
        inp.value = val;
      }
    }, 20);
  },

  _aplicarFiltrosToData(data) {
    let filteredData = { ...data };
    const q = (this._filtroActivo.texto || '').trim().toLowerCase();

    if (q) {
      filteredData.rebanosLeche = data.rebanosLeche.filter(r =>
        (r.nombre || '').toLowerCase().includes(q) ||
        (r.especie || '').toLowerCase().includes(q)
      );

      filteredData.controlesDiarios = data.controlesDiarios.filter(c =>
        (c.snap_identificacion || '').toLowerCase().includes(q) ||
        (c.fecha || '').toLowerCase().includes(q) ||
        (c.concepto || '').toLowerCase().includes(q)
      );
    }

    const totalLitrosControles = filteredData.controlesDiarios.reduce((s, c) => s + (c.valor_neto || 0), 0);
    return {
      ...filteredData,
      totalLitrosControles
    };
  }
};

window.LecheView = LecheView;