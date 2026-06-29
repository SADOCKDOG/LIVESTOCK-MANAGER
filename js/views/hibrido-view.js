/**
 * Livestock Manager - HibridoView v2.0.0
 * Vista de Consola Híbrida/Mixta con las 4 pestañas modulares de gestión unificada
 */

const HibridoView = {
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
    const main = document.getElementById('app-content');
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

    main.innerHTML = `
      <div class="mb-14">
        <div class="scroll-shadow-container" style="margin:0 -12px 10px -12px; padding:0 12px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; white-space:nowrap;">
          <div class="hibrido-tabs">
            <button class="hibrido-tab active" data-tab="patrimonio" onclick="HibridoView._cambiarTab('patrimonio')">${Icons.edificio()} Patrimonio y Ganadería</button>
            <button class="hibrido-tab" data-tab="comercializacion" onclick="HibridoView._cambiarTab('comercializacion')">${Icons.transportistas()} Logística y Transporte, Comercialización Ventas</button>
            <button class="hibrido-tab" data-tab="legislacion" onclick="HibridoView._cambiarTab('legislacion')">${Icons.documento()} Registros Legislación, Cumplimiento Sanitario</button>
          </div>
        </div>
      </div>
      <div id="hibrido-content"><div class="loader">Cargando consola híbrida...</div></div>`;

    this._cachedData = {
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
      kpis: {
        patrimonio: [
          { label: 'Censo Mixto', value: animalesFinca.length + ' cabezas' },
          { label: 'Lotes/Rebaños', value: rebanos.length },
          { label: 'Finca Activa', value: finca?.nombre || 'Mixta' }
        ],
        explotacion: [
          { label: 'Margen Global', value: Math.round(mofaConsolidado).toLocaleString() + ' €', color: mofaConsolidado >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Coste Piensos', value: totalGastosAlim.toLocaleString() + ' €', color: '#ef4444' },
          { label: 'Ratio MOFA', value: ratioMofaConsolidado.toFixed(1) + '%' }
        ],
        comercializacion: [
          { label: 'Ingresos Totales', value: totalIngresosConsolidados.toLocaleString() + ' €', color: '#10b981' },
          { label: 'Ventas Leche', value: `${pctLeche.toFixed(0)}%` },
          { label: 'Ventas Carne', value: `${pctCarne.toFixed(0)}%` }
        ],
        legislacion: [
          { label: 'Supresiones Carne', value: supresionesCarne.length, color: supresionesCarne.length > 0 ? '#ef4444' : '#10b981' },
          { label: 'Supresiones Leche', value: supresionesLeche.length, color: supresionesLeche.length > 0 ? '#3b82f6' : '#10b981' }
        ]
      }
    };

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
      <div class="card report-section p-16 border-top-3px border-top-3px-orange">
        <div class="flex items-center gap-12 mb-16">
          <span class="text-3xl">${Icons.edificio()}</span>
          <div>
            <div class="text-white font-900 text-lg">Patrimonio y Censo Consolidado</div>
            <div class="text-gray text-xs">Organización ganadera de doble aptitud</div>
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
          ${Icons.documento()} Rebaños Mixtos Activos (${d.rebanos.length})
        </div>
        <div class="grid gap-10">
          ${d.rebanos.map(r => `
            <div class="card card-animal" onclick="location.hash='/rebano?id=${r.id}'" style="border-left:4px solid var(--c-success);">
              <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-6">
                    <span class="text-xl" style="color:var(--c-success);">${Icons.rebanos()}</span>
                    <h3 class="section-h3 m-0 text-ellipsis">${r.nombre}</h3>
                  </div>
                  <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
                    <span>Aptitud: ${r.tipo} · Especie: ${r.especie}</span>
                  </div>
                </div>
                <div class="text-right flex-shrink-0 ml-8">
                  <span class="badge badge-sm font-black block mb-4" style="background:rgba(16,185,129,0.15); color:var(--c-success); border:1px solid rgba(16,185,129,0.3);">${r.cantidad_animales || 0} cabezas</span>
                </div>
              </div>
            </div>`).join('')}
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
      <div class="card report-section p-16 border-top-3px border-top-3px-green">
        <div class="flex items-center gap-12 mb-16">
          <span class="text-3xl">${Icons.transportistas()}</span>
          <div>
            <div class="text-white font-900 text-lg">Logística y Transporte, Comercialización Ventas</div>
            <div class="text-gray text-xs">Logística, transporte, compradores, contratos y ventas consolidado</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-10 max-w-320 mx-auto mb-16">
          <button class="widget-link-btn widget-link-btn--neon neon-danger" onclick="App._abrirWizardVentaMasiva()">
            ${Icons.carne()}
            <span class="widget-link-label">VENTA CARNE</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="App._abrirWizardAlbaranLeche()">
            ${Icons.leche()}
            <span class="widget-link-label">ALBARÁN LECHE</span>
          </button>
        </div>

        ${this._kpiGrid(d.kpis.comercializacion, '#10b981')}

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
            const color = l.tipo === 'carne' ? '#ef4444' : '#3b82f6';
            return `
              <div class="card card-animal" onclick="${l.onclick}" style="border-left:4px solid ${color};">
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
                    <span class="badge badge-sm text-green font-bold text-lg" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); display:block;">${Math.round(l.valor).toLocaleString()} €</span>
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
              <li><span class="sup-badge sup-badge-carne">CARNE</span> Rebaño <strong class="text-white">${s.rebanoId}</strong> — Restan <strong class="text-white">${s.diasRestantes}d</strong> para matadero.</li>
            `).join('')}
            ${d.supresionesLeche.map(s => `
              <li><span class="sup-badge sup-badge-leche">LECHE</span> Rebaño <strong class="text-white">${s.rebanoId}</strong> — Restan <strong class="text-white">${s.diasRestantes}d</strong> para ordeño.</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    const html = `
      ${alertasHtml}
      <div class="card report-section p-16" style="border-top:3px solid #8b5cf6;">
        <div class="flex items-center gap-12 mb-16">
          <span class="text-3xl">${Icons.documento()}</span>
          <div>
            <div class="text-white font-900 text-lg">Registros Legislación, Cumplimiento Sanitario</div>
            <div class="text-gray text-xs">Cuaderno de explotación consolidado, Letra Q y supresiones</div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mb-16">
          <button class="widget-link-btn widget-link-btn--neon neon-accent" onclick="HibridoView._abrirAsistenteTratamientoMix()">
            ${Icons.sanidad()}
            <span class="widget-link-label">REGISTRAR TRATAMIENTO</span>
          </button>
        </div>

        ${this._kpiGrid(d.kpis.legislacion, '#8b5cf6')}

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
                const color = (enSupC || enSupL) ? '#ef4444' : '#8b5cf6';
                return `
                  <div class="card card-animal" style="border-left:4px solid ${color};">
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-6">
                          <span class="text-xl">${Icons.sanidad()}</span>
                          <h3 class="section-h3 m-0 text-ellipsis">${s.medicamento || s.tipo_tratamiento}</h3>
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
                        ${!enSupC && !enSupL ? `<span class="badge badge-sm block" style="background:rgba(139,92,246,0.15); color:#8b5cf6; border:1px solid #8b5cf640;">LIBRE</span>` : ''}
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
            <div class="card p-25 border-top-mode--hibrido" style="max-width:420px;">
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
                    <button class="wizard-btn-action wizard-btn-mode--hibrido flex-2" id="btn-save-reg">${Icons.guardar()} Guardar</button>
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
          HibridoView.render();
        };

        overlay.querySelector('#btn-del-reg').onclick = async () => {
          if (!await Confirm.confirm("Eliminar Control", "¿Eliminar este control de forma permanente?", true)) return;
          await window.db.delete('registro_eventos', id);
          App.toast("Registro lácteo eliminado");
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
      <div class="card p-25 border-top-mode--hibrido" style="max-width:380px;">
        <h3 class="mt-0 text-white font-900 flex items-center gap-8">${Icons.sanidad()} Aplicar Tratamiento Veterinario</h3>
        <label class="wizard-label mb-10">Selecciona el rebaño a tratar:</label>
        <select id="w-treat-reb" class="wizard-input wizard-select mb-15">
          ${d.rebanos.map(r => `<option value="${r.id}">${r.nombre} (${r.tipo} · ${r.especie})</option>`).join('')}
        </select>
        <div class="flex gap-10">
          <button class="wizard-btn-action wizard-btn-mode--hibrido flex-1" id="btn-treat-next">Proceder ${Icons.siguiente()}</button>
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
