/**
 * Livestock Manager - ExplotacionView v1.2.0
 * Vista unificada del Módulo ExPro (Explotación y Producción)
 * Contiene tres modos seleccionables en la parte superior: Carne (Rojo), Leche (Azul), Híbrido (Verde)
 */

const ExplotacionView = {
  _activeMode: null, // 'carne' | 'leche' | 'hibrido'
  _cachedData: null,

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  _fmt(val) {
    if (val == null || isNaN(val)) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 });
  },

  async render() {
    const main = document.getElementById('app-content');
    main.style.maxWidth = '100%';
    main.style.boxSizing = 'border-box';
    main.style.paddingLeft = '12px';
    main.style.paddingRight = '12px';

    this._inyectarEstilos();

    const fincaId = await Fincas.getActiveId();
    const finca = await Fincas.getActive();

    if (!fincaId) {
      main.innerHTML = `<div class="p-20 text-center"><p class="text-gray">No hay ninguna finca seleccionada.</p></div>`;
      return;
    }

    // Cargar datos comunes
    const [rebanos, animales, eventosRaw, todosGastos, entregasLeche, ventasCarne] = await Promise.all([
      window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('animales').catch(() => []),
      window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
      window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => [])
    ]);
    const eventos = (eventosRaw || []).filter(e => !e?.anulado);

    this._activeMode = window.ModoContextoHelper
      ? ModoContextoHelper.getModeForBlock('explotacion', rebanos)
      : (this._activeMode || 'carne');

    const rebanosIds = rebanos.map(r => r.id);
    const rebanosCarne = window.ModoContextoHelper ? ModoContextoHelper.filterRebanosByMode(rebanos, 'carne') : rebanos;
    const rebanosLeche = window.ModoContextoHelper ? ModoContextoHelper.filterRebanosByMode(rebanos, 'leche') : rebanos;
    const rebanosHibrido = window.ModoContextoHelper ? ModoContextoHelper.filterRebanosByMode(rebanos, 'hibrido') : rebanos;
    const rebCarneIds = new Set(rebanosCarne.map(r => r.id));
    const rebLecheIds = new Set(rebanosLeche.map(r => r.id));
    const rebHibridoIds = new Set(rebanosHibrido.map(r => r.id));
    const animalesFinca = animales.filter(a => rebanosIds.includes(a.rebanoId));
    const siloEventos = eventos.filter(e => e.tipo_entidad === 'silo_pienso');

    // Gastos por categoría operativa
    const gastosAlim = todosGastos.filter(g => 
      (g.categoria || '').toLowerCase() === 'alimentacion' || 
      (g.categoria || '').toLowerCase() === 'alimentación' ||
      (g.concepto || '').toLowerCase().includes('pienso') ||
      (g.concepto || '').toLowerCase().includes('forraje') ||
      (g.concepto || '').toLowerCase().includes('pasto')
    );
    const gastosEnergia = todosGastos.filter(g => (g.categoria || '').toLowerCase() === 'electricidad');
    const gastosFito = todosGastos.filter(g => (g.categoria || '').toLowerCase() === 'fitosanitarios');
    const totalGastosAlim = gastosAlim.reduce((s, g) => s + (g.monto || 0), 0);
    const totalGastosEnergia = gastosEnergia.reduce((s, g) => s + (g.monto || 0), 0);
    const totalGastosFito = gastosFito.reduce((s, g) => s + (g.monto || 0), 0);

    // Datos de Carne
    const pesajes = eventos.filter(e => {
      if (!(e.unidad === 'kg' && (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano'))) return false;
      const rebanoOk = rebCarneIds.has(e.rebanoId);
      const snap = (e.snap_tipo || '').toLowerCase();
      const snapOk = snap.includes('carne') || snap.includes('cárn') || snap.includes('mixt') || snap.includes('híbr') || snap.includes('doble');
      return rebanoOk || snapOk;
    });
    pesajes.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    // GMD cálculo
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
    gmdList.sort((a, b) => b.gmd - a.gmd);

    // Datos de Leche
    const ordeños = eventos.filter(e => {
      if (!((e.unidad === 'L' || e.unidad === 'Litros') && (e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero'))) return false;
      const rebanoOk = rebLecheIds.has(e.rebanoId);
      const snap = (e.snap_tipo || '').toLowerCase();
      const snapOk = snap.includes('leche') || snap.includes('láct') || snap.includes('mixt') || snap.includes('híbr') || snap.includes('doble');
      return rebanoOk || snapOk;
    });
    ordeños.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    const totalLitros = ordeños.reduce((sum, o) => sum + (o.valor_neto || 0), 0);
    const conLab = entregasLeche.filter(e => e.laboratorio?.grasa != null);
    const esTotal = conLab.reduce((s, e) => s + (e.laboratorio.extracto_seco || (e.laboratorio.grasa || 0) + (e.laboratorio.proteina || 0)), 0);
    const esMedia = conLab.length > 0 ? esTotal / conLab.length : 0;

    // MOFA Lácteo
    const totalIngresosLeche = entregasLeche.reduce((s, e) => s + (e.importe_total || (e.cantidad || 0) * (e.precioBase || 0)), 0);
    const mofaLeche = totalIngresosLeche - totalGastosAlim;

    // Híbrido consolidado
    const proConsolidada = eventos.filter(e => 
      (e.unidad === 'kg' || e.unidad === 'L' || e.unidad === 'Litros') &&
      (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano') &&
      (rebHibridoIds.has(e.rebanoId) || !e.rebanoId)
    );
    proConsolidada.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    const totalVentasCarne = ventasCarne.reduce((s, v) => s + (v.importe_total || v.valor_neto || 0), 0);
    const mofaHibrido = (totalVentasCarne + totalIngresosLeche) - totalGastosAlim;
    const ratioMofaHibrido = (totalVentasCarne + totalIngresosLeche) > 0 ? (mofaHibrido / (totalVentasCarne + totalIngresosLeche)) * 100 : 0;

    // Cachear datos
    this._cachedData = {
      fincaId,
      finca,
      rebanos,
      rebCarneIds,
      rebLecheIds,
      rebHibridoIds,
      animalesFinca,
      todosGastos,
      siloEventos,
      gastosAlim,
      gastosEnergia,
      gastosFito,
      totalGastosAlim,
      totalGastosEnergia,
      totalGastosFito,
      pesajes,
      gmdList,
      gmdMedio,
      ordeños,
      totalLitros,
      entregasLeche,
      extractoSecoMedio: esMedia,
      mofaLeche,
      mofaHibrido,
      ratioMofaHibrido,
      proConsolidada
    };

    // Renderizar cabecera con TRES BOTONES ARRIBA
    main.innerHTML = `
      <!-- Selector de Modo ExPro Superior -->
      <div class="mb-14 text-center">
        <div style="display: inline-flex; background: #18181b; padding: 4px; border-radius: 24px; border: 1px solid #27272a; width: 100%; max-width: 480px; box-sizing: border-box;">
          <button class="expro-mode-btn ${this._activeMode === 'carne' ? 'active' : ''}" style="--mode-color:#ef4444;" onclick="ExplotacionView._cambiarModo('carne')">🥩 Carne</button>
          <button class="expro-mode-btn ${this._activeMode === 'leche' ? 'active' : ''}" style="--mode-color:#3b82f6;" onclick="ExplotacionView._cambiarModo('leche')">🥛 Leche</button>
          <button class="expro-mode-btn ${this._activeMode === 'hibrido' ? 'active' : ''}" style="--mode-color:#10b981;" onclick="ExplotacionView._cambiarModo('hibrido')">🔄 Híbrido</button>
        </div>
      </div>
      <div id="expro-mode-content"></div>
    `;

    const modeContent = document.getElementById('expro-mode-content');
    if (this._activeMode === 'leche') {
      this._renderLeche(modeContent);
    } else if (this._activeMode === 'hibrido') {
      this._renderHibrido(modeContent);
    } else {
      this._renderCarne(modeContent);
    }

    if (window.enableScrollShadows) {
      document.querySelectorAll('.scroll-shadow-container').forEach(el => window.enableScrollShadows(el));
    }
  },

  _cambiarModo(modo) {
    this._activeMode = modo;
    if (window.ModoContextoHelper) ModoContextoHelper.setModeForBlock('explotacion', modo);
    this.render();
  },

  _inyectarEstilos() {
    if (document.getElementById('explotacion-styles')) return;
    const style = document.createElement('style');
    style.id = 'explotacion-styles';
    style.textContent = `
      .explotacion-kpis { display: grid; grid-template-cols: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
      .explotacion-kpi-card {
        background: #1e1e1e; border: 1px solid #2e2e2e; border-radius: 12px; padding: 12px 8px; text-align: center;
        border-top: 3px solid var(--theme-color);
      }
      .explotacion-kpi-value { font-size: 1.1rem; font-weight: 800; color: #fff; margin-top: 4px; }
      .explotacion-kpi-label { font-size: 0.65rem; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
      
      .premium-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      .premium-table th { background: #18181b; color: #a1a1aa; font-weight: 700; padding: 10px 8px; font-size: 0.68rem; text-transform: uppercase; border-bottom: 2px solid #27272a; }
      .premium-table td { padding: 10px 8px; font-size: 0.72rem; color: #e4e4e7; border-bottom: 1px solid #27272a; }
      .premium-table tr:hover { background: rgba(255,255,255,0.02); }

      .expro-mode-btn {
        flex: 1; padding: 9px 16px; border: none; border-radius: 20px;
        background: transparent; color: #888; font-size: 0.8rem; font-weight: 800;
        cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px;
      }
      .expro-mode-btn.active {
        background: var(--mode-color); color: #fff; box-shadow: 0 0 12px var(--mode-color);
      }
      .expro-mode-btn:active { transform: scale(0.95); }
    `;
    document.head.appendChild(style);
  },

  // ==========================================
  //  LAYOUT: CARNE
  // ==========================================
  _renderCarne(container) {
    const d = this._cachedData;
    const themeColor = '#ef4444'; // Rojo

    let html = `
      <div style="--theme-color: ${themeColor}">
        <!-- KPIs -->
        <div class="explotacion-kpis">
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">Pesajes Totales</div>
            <div class="explotacion-kpi-value">${d.pesajes.length}</div>
          </div>
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">GMD Medio</div>
            <div class="explotacion-kpi-value">${d.gmdMedio.toFixed(2)} kg/d</div>
          </div>
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">Coste Ración</div>
            <div class="explotacion-kpi-value" style="color:${themeColor}">${d.totalGastosAlim.toLocaleString()} €</div>
          </div>
        </div>

        <div class="text-center mb-12">
          <div class="grid grid-cols-2 gap-10">
            <button class="btn btn-create btn-sm" style="background:${themeColor}; border-color:${themeColor};" onclick="App._abrirAsistenteProduccion('carne', { origen_modulo: 'explotacion', modo_explotacion: 'carne' })">
              ➕ Registrar Peso (kg)
            </button>
            <button class="btn btn-secondary btn-sm" style="background:#8b5cf6; border-color:#8b5cf6;" onclick="ExplotacionView._abrirAsistenteSanitario('carne')">
              💉 Registrar Tratamiento
            </button>
          </div>
        </div>

        <!-- Líderes GMD -->
        <div class="mb-14 p-12 rounded bg-dark border border-222" style="border-top: 3px solid #fbbf24;">
          <div class="text-xs text-amber font-black uppercase mb-6">🏆 LÍDERES DE GANANCIA DE PESO (GMD)</div>
          <div class="grid gap-6">
            ${d.gmdList.slice(0, 4).map(g => `
              <div class="flex justify-between items-center text-xs text-white">
                <span class="text-ccc">🐄 ${g.crotal} (${g.rebano})</span>
                <strong class="text-green">+${g.gmd.toFixed(3)} kg/día</strong>
              </div>`).join('') || '<div class="text-xs text-555">Sin datos evaluados de GMD. Registra al menos dos pesajes para el mismo animal.</div>'}
          </div>
        </div>

        <!-- Historial Pesajes -->
        <div class="card p-16 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222" style="margin-bottom:6px; padding-bottom:5px;">
            📋 Últimos pesajes registrados
          </div>
          <div class="grid gap-8" style="max-height:350px; overflow-y:auto;">
            ${d.pesajes.length > 0
              ? d.pesajes.slice(0, 15).map(e => `
                  <div class="card card-animal" onclick="ExplotacionView._abrirOpcionesRegistro(${e.id}, 'carne')" style="border-left:4px solid ${e.tipo_entidad === 'animal' ? '#ef4444' : '#f59e0b'}; padding:10px; margin:0;">
                    <div class="flex justify-between items-center">
                      <div class="text-xs">
                        <div class="font-bold text-white">${e.snap_identificacion || 'Animal/Lote'}</div>
                        <div class="text-gray mt-2">📅 ${this._fmtFecha(e.fecha)}</div>
                      </div>
                      <span class="badge badge-sm font-bold text-red" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">${e.valor_neto} kg</span>
                    </div>
                  </div>`).join('')
              : `<div class="p-14 text-center bg-darker rounded"><span class="text-555 text-xs">📭 Sin pesajes registrados.</span></div>`
            }
          </div>
        </div>

        <!-- Almacén y Silos -->
        ${this._renderSilosHtml(d.fincaId, d.siloEventos, 'carne')}
        ${this._renderCostesCumplimientoHtml('carne')}
        ${this._renderPipelineComercialHtml('carne')}
      </div>
    `;

    container.innerHTML = html;
  },

  // ==========================================
  //  LAYOUT: LECHE
  // ==========================================
  _renderLeche(container) {
    const d = this._cachedData;
    const themeColor = '#3b82f6'; // Azul

    let html = `
      <div style="--theme-color: ${themeColor}">
        <!-- KPIs -->
        <div class="explotacion-kpis">
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">Total Litros</div>
            <div class="explotacion-kpi-value">${this._fmt(d.totalLitros)} L</div>
          </div>
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">Ext. Seco Medio</div>
            <div class="explotacion-kpi-value">${d.extractoSecoMedio > 0 ? d.extractoSecoMedio.toFixed(2) + '%' : 'N/D'}</div>
          </div>
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">MOFA Aliment.</div>
            <div class="explotacion-kpi-value" style="color:${d.mofaLeche >= 0 ? '#10b981' : '#ef4444'}">${Math.round(d.mofaLeche).toLocaleString()} €</div>
          </div>
        </div>

        <div class="text-center mb-12">
          <div class="grid grid-cols-2 gap-10">
            <button class="btn btn-create btn-sm" style="background:${themeColor}; border-color:${themeColor};" onclick="App._abrirAsistenteProduccion('leche', { origen_modulo: 'explotacion', modo_explotacion: 'leche' })">
              ➕ Registrar Control Diario (L)
            </button>
            <button class="btn btn-secondary btn-sm" style="background:#8b5cf6; border-color:#8b5cf6;" onclick="ExplotacionView._abrirAsistenteSanitario('leche')">
              💉 Registrar Tratamiento
            </button>
          </div>
        </div>

        <!-- Calidad e Higiene de Tanque (Analíticas) -->
        <div class="card p-14 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222" style="margin-bottom:8px; padding-bottom:5px;">
            🔬 Calidad de Tanque (Últimas Analíticas de Laboratorio)
          </div>
          
          <div class="scroll-shadow-container" style="overflow-x:auto;">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Litros</th>
                  <th>Grasa %</th>
                  <th>Prot. %</th>
                  <th>C.Somát.</th>
                  <th>Bacterias</th>
                  <th>Inhib.</th>
                  <th>Calidad</th>
                </tr>
              </thead>
              <tbody>
                ${d.entregasLeche.length > 0
                  ? d.entregasLeche.slice(0, 6).map(e => {
                      const lab = e.laboratorio || {};
                      const semaforo = window.CalidadLecheHelper ? window.CalidadLecheHelper.semaforoCalidad(e) : { color: '#888', label: '' };
                      
                      return `
                        <tr>
                          <td>📅 ${this._fmtFecha(e.fechaRecogida || e.fecha)}</td>
                          <td><strong>${(e.cantidad || 0).toLocaleString()} L</strong></td>
                          <td>${lab.grasa != null ? lab.grasa.toFixed(2) + '%' : '—'}</td>
                          <td>${lab.proteina != null ? lab.proteina.toFixed(2) + '%' : '—'}</td>
                          <td style="color:${(lab.somaticas || 0) > 400000 ? '#ef4444' : '#10b981'}">${lab.somaticas ? (lab.somaticas / 1000).toFixed(0) + 'k' : '—'}</td>
                          <td style="color:${(lab.germenes || 0) > 1500000 ? '#ef4444' : '#10b981'}">${lab.germenes ? (lab.germenes / 1000).toFixed(0) + 'k' : '—'}</td>
                          <td style="color:${e.certificadoInhibidores === false || e.antibioticos ? '#ef4444' : '#10b981'}">${e.certificadoInhibidores ? 'OK' : (e.certificadoInhibidores === false ? 'ALERT' : 'PEND')}</td>
                          <td>
                            <span class="badge" style="background:${semaforo.color}15; color:${semaforo.color}; border:1px solid ${semaforo.color}30; font-size:0.58rem; padding:2px 6px;">
                              ${semaforo.label}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')
                  : `<tr><td colspan="8" class="text-center text-555 p-10">No hay analíticas registradas. Registra una entrega a cisterna.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Controles Ordeño Recientes -->
        <div class="card p-14 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222" style="margin-bottom:6px; padding-bottom:5px;">
            📋 Ordeños y Controles Diarios Recientes
          </div>
          <div class="grid gap-8" style="max-height:220px; overflow-y:auto;">
            ${d.ordeños.length > 0
              ? d.ordeños.slice(0, 10).map(o => `
                  <div class="card card-animal" onclick="ExplotacionView._abrirOpcionesRegistro(${o.id}, 'leche')" style="border-left:4px solid ${o.tipo_entidad === 'animal' ? '#3b82f6' : '#8b5cf6'}; padding:10px; margin:0;">
                    <div class="flex justify-between items-center">
                      <div class="text-xs">
                        <div class="font-bold text-white">${o.snap_identificacion || 'Control Lote/Animal'}</div>
                        <div class="text-gray mt-2">📅 ${this._fmtFecha(o.fecha)}</div>
                      </div>
                      <span class="badge badge-sm font-bold text-blue" style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3);">${o.valor_neto} L</span>
                    </div>
                  </div>`).join('')
              : `<div class="p-14 text-center bg-darker rounded"><span class="text-555 text-xs">📭 Sin registros de ordeño recientes.</span></div>`
            }
          </div>
        </div>

        <!-- Almacén y Silos -->
        ${this._renderSilosHtml(d.fincaId, d.siloEventos, 'leche')}
        ${this._renderCostesCumplimientoHtml('leche')}
        ${this._renderPipelineComercialHtml('leche')}
      </div>
    `;

    container.innerHTML = html;
  },

  // ==========================================
  //  LAYOUT: HÍBRIDO (Consolidado - Verde)
  // ==========================================
  _renderHibrido(container) {
    const d = this._cachedData;
    const themeColor = '#10b981'; // Verde

    let html = `
      <div style="--theme-color: ${themeColor}">
        <!-- KPIs Consolidados -->
        <div class="explotacion-kpis">
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">Margen Global</div>
            <div class="explotacion-kpi-value" style="color:${d.mofaHibrido >= 0 ? '#10b981' : '#ef4444'}">${Math.round(d.mofaHibrido).toLocaleString()} €</div>
          </div>
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">Ratio MOFA</div>
            <div class="explotacion-kpi-value">${d.ratioMofaHibrido.toFixed(1)}%</div>
          </div>
          <div class="explotacion-kpi-card">
            <div class="explotacion-kpi-label">Coste Aliment.</div>
            <div class="explotacion-kpi-value" style="color:#ef4444">${d.totalGastosAlim.toLocaleString()} €</div>
          </div>
        </div>

        <div class="flex gap-10 mb-14">
          <button class="btn btn-create btn-sm flex-1" style="background:#ef4444; border-color:#ef4444;" onclick="App._abrirAsistenteProduccion('carne', { origen_modulo: 'explotacion', modo_explotacion: 'hibrido' })">
            ➕ Registrar Peso (kg)
          </button>
          <button class="btn btn-secondary btn-sm flex-1" style="background:#3b82f6; border-color:#3b82f6;" onclick="App._abrirAsistenteProduccion('leche', { origen_modulo: 'explotacion', modo_explotacion: 'hibrido' })">
            ➕ Registrar Ordeño (L)
          </button>
        </div>
        <div class="text-center mb-14">
          <button class="btn btn-secondary btn-sm" style="background:#8b5cf6; border-color:#8b5cf6;" onclick="ExplotacionView._abrirAsistenteSanitario('hibrido')">
            💉 Registrar Tratamiento (Mixto)
          </button>
        </div>

        <!-- True Hub: Highlight Carne & Leche Side-by-Side -->
        <div class="grid grid-cols-2 gap-10 mb-14">
          <div class="p-10 rounded bg-dark border border-222" style="border-top:3px solid #ef4444;">
            <div class="text-xs font-bold text-red uppercase mb-6">🥩 Carne: Líderes GMD</div>
            <div class="grid gap-4 text-xs" style="font-size:0.68rem;">
              ${d.gmdList.slice(0, 3).map(g => `
                <div class="flex justify-between">
                  <span class="text-ccc">${g.crotal}</span>
                  <strong class="text-green">+${g.gmd.toFixed(2)}</strong>
                </div>`).join('') || '<div class="text-555">Sin datos.</div>'}
            </div>
          </div>

          <div class="p-10 rounded bg-dark border border-222" style="border-top:3px solid #3b82f6;">
            <div class="text-xs font-bold text-blue uppercase mb-6">🔬 Leche: Última analítica</div>
            <div class="grid gap-4 text-xs" style="font-size:0.68rem;">
              ${d.entregasLeche.length > 0
                ? (() => {
                    const e = d.entregasLeche[0];
                    const lab = e.laboratorio || {};
                    const semaforo = window.CalidadLecheHelper ? window.CalidadLecheHelper.semaforoCalidad(e) : { color: '#888', label: '' };
                    return `
                      <div class="flex justify-between">
                        <span>Litros:</span>
                        <strong>${(e.cantidad || 0).toLocaleString()} L</strong>
                      </div>
                      <div class="flex justify-between">
                        <span>Grasa/Prot:</span>
                        <strong>${lab.grasa || '—'}/${lab.proteina || '—'}%</strong>
                      </div>
                      <div class="flex justify-between">
                        <span>Calidad:</span>
                        <strong style="color:${semaforo.color}">${semaforo.label.split(',')[0]}</strong>
                      </div>
                    `;
                  })()
                : '<div class="text-555">Sin analíticas.</div>'
              }
            </div>
          </div>
        </div>

        <!-- Historial Consolidado -->
        <div class="card p-14 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222" style="margin-bottom:6px; padding-bottom:5px;">
            📋 Historial Consolidado Reciente
          </div>
          <div class="grid gap-8" style="max-height:220px; overflow-y:auto;">
            ${d.proConsolidada.length > 0
              ? d.proConsolidada.slice(0, 12).map(e => {
                  const esPeso = e.unidad === 'kg';
                  const color = esPeso ? '#ef4444' : '#3b82f6';
                  return `
                    <div class="card card-animal" onclick="ExplotacionView._abrirOpcionesRegistro(${e.id}, '${esPeso ? 'carne' : 'leche'}')" style="border-left:4px solid ${color}; padding:10px; margin:0;">
                      <div class="flex justify-between items-center">
                        <div class="text-xs">
                          <div class="font-bold text-white">${e.snap_identificacion || 'Registro Mixto'}</div>
                          <div class="text-gray mt-2">📅 ${this._fmtFecha(e.fecha)}</div>
                        </div>
                        <span class="badge badge-sm font-bold" style="background:${color}10; color:${color}; border:1px solid ${color}30;">${e.valor_neto} ${e.unidad}</span>
                      </div>
                    </div>`;
                }).join('')
              : `<div class="p-14 text-center bg-darker rounded"><span class="text-555 text-xs">📭 Sin registros de producción.</span></div>`
            }
          </div>
        </div>

        <!-- Almacén y Silos -->
        ${this._renderSilosHtml(d.fincaId, d.siloEventos, 'hibrido')}
        ${this._renderCostesCumplimientoHtml('hibrido')}
        ${this._renderPipelineComercialHtml('hibrido')}
      </div>
    `;

    container.innerHTML = html;
  },

  // ==========================================
  //  MÉTODO COMÚN: STOCK DE SILOS
  // ==========================================
  _renderSilosHtml(fincaId, siloEventos, modo) {
    let silos = [];
    let borderStyleColor = '#ef4444'; // Rojo por defecto

    if (modo === 'leche') {
      silos = [
        { id: 1, nombre: 'Silo A: Pienso Concentrado Ordeño', capacidad: 10000, inicial: 6000 },
        { id: 2, nombre: 'Silo B: Mezcla Unifeed Lactancia', capacidad: 5000, inicial: 3000 }
      ];
      borderStyleColor = '#3b82f6';
    } else if (modo === 'hibrido') {
      silos = [
        { id: 1, nombre: 'Silo A: Concentrado Terneros', capacidad: 10000, inicial: 6000 },
        { id: 2, nombre: 'Silo B: Mezcla Forrajera', capacidad: 5000, inicial: 3000 },
        { id: 3, nombre: 'Silo C: Concentrado Ordeño', capacidad: 10000, inicial: 5000 },
        { id: 4, nombre: 'Silo D: Unifeed Lactancia', capacidad: 6000, inicial: 3000 }
      ];
      borderStyleColor = '#10b981';
    } else {
      // carne
      silos = [
        { id: 1, nombre: 'Silo A: Concentrado Terneros', capacidad: 10000, inicial: 6000 },
        { id: 2, nombre: 'Silo B: Mezcla Forrajera', capacidad: 5000, inicial: 3000 }
      ];
      borderStyleColor = '#ef4444';
    }

    let html = `
      <div class="mt-16 p-12 rounded bg-darker border border-222" style="border-top: 3px solid ${borderStyleColor};">
        <div class="flex justify-between items-center mb-10">
          <div class="text-xs text-white font-black uppercase">📦 ALMACÉN Y STOCK DE SILOS</div>
          <button class="btn btn-secondary btn-xs" style="font-size:0.68rem; padding:3px 6px; background:${borderStyleColor}; border:none; margin:0; line-height:1;" onclick="ExplotacionView._abrirAsistenteSilo('${modo}')">
            ➕ Carga/Consumo
          </button>
        </div>
        <div class="grid gap-10">
    `;

    silos.forEach(s => {
      const cargas = siloEventos.filter(e => e.entidad_id === s.id && e.rol_contable === 'COMPRA').reduce((sum, e) => sum + (e.valor_neto || 0), 0);
      const consumos = siloEventos.filter(e => e.entidad_id === s.id && e.rol_contable === 'CONSUMO').reduce((sum, e) => sum + (e.valor_neto || 0), 0);
      const actual = Math.max(0, s.inicial + cargas - consumos);
      const pct = Math.min(100, Math.round((actual / s.capacidad) * 100));
      let colorBar = borderStyleColor;
      if (pct < 20) colorBar = '#ef4444'; // Rojo crítico
      else if (pct < 50) colorBar = '#f59e0b'; // Naranja/Aviso

      html += `
        <div style="font-size:0.75rem;">
          <div class="flex justify-between font-bold mb-4">
            <span class="text-ccc">🌾 ${s.nombre}</span>
            <span class="text-white">${actual.toLocaleString()} / ${s.capacidad.toLocaleString()} kg (${pct}%)</span>
          </div>
          <div style="background:#111; border-radius:4px; height:8px; width:100%; overflow:hidden;">
            <div style="background:${colorBar}; width:${pct}%; height:100%; transition: width 0.3s;"></div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
    return html;
  },

  _renderCostesCumplimientoHtml(modo) {
    const d = this._cachedData || {};
    const color = modo === 'leche' ? '#3b82f6' : (modo === 'hibrido' ? '#10b981' : '#ef4444');
    const fitoPendientes = (d.gastosFito || []).filter(g => g.control_normativo?.aptoComercializacion === false).length;
    const fitoConControl = (d.gastosFito || []).filter(g => g.control_normativo?.registroProducto && g.control_normativo?.dosisAplicada).length;

    return `
      <div class="mt-16 p-12 rounded bg-darker border border-222" style="border-top: 3px solid ${color};">
        <div class="flex justify-between items-center mb-10">
          <div class="text-xs text-white font-black uppercase">💸 COSTES + CUMPLIMIENTO NORMATIVO</div>
        </div>
        <div class="grid grid-cols-3 gap-10 mb-10">
          <div class="card p-10 text-center" style="border:1px solid #27272a;">
            <div class="text-xs text-888">Alimentación</div>
            <div class="font-900 text-white">${(d.totalGastosAlim || 0).toLocaleString()} €</div>
          </div>
          <div class="card p-10 text-center" style="border:1px solid #27272a;">
            <div class="text-xs text-888">Energía</div>
            <div class="font-900 text-white">${(d.totalGastosEnergia || 0).toLocaleString()} €</div>
          </div>
          <div class="card p-10 text-center" style="border:1px solid #27272a;">
            <div class="text-xs text-888">Fitosanitarios</div>
            <div class="font-900 text-white">${(d.totalGastosFito || 0).toLocaleString()} €</div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-10">
          <button class="btn btn-secondary btn-sm" style="background:#d97706; border-color:#d97706;" onclick="ExplotacionView._abrirWizardGastoModo('Alimentacion', '${modo}')">➕ Gasto Alimentación</button>
          <button class="btn btn-secondary btn-sm" style="background:#3b82f6; border-color:#3b82f6;" onclick="ExplotacionView._abrirWizardGastoModo('Electricidad', '${modo}')">➕ Gasto Energía</button>
          <button class="btn btn-secondary btn-sm" style="background:#16a34a; border-color:#16a34a;" onclick="ExplotacionView._abrirWizardGastoModo('Fitosanitarios', '${modo}')">➕ Gasto Fitosanitario</button>
        </div>
        <div class="mt-10 text-xs text-aaa">
          ✅ Registros fitosanitarios con control completo: <strong>${fitoConControl}</strong> · ⚠️ No aptos para comercialización: <strong style="color:${fitoPendientes > 0 ? '#ef4444' : '#10b981'}">${fitoPendientes}</strong>
        </div>
      </div>
    `;
  },

  _renderPipelineComercialHtml(modo) {
    const color = modo === 'leche' ? '#3b82f6' : (modo === 'hibrido' ? '#10b981' : '#ef4444');
    const tab = modo === 'leche' ? 'leche' : 'carne';
    return `
      <div class="mt-16 p-12 rounded bg-darker border border-222" style="border-top: 3px solid ${color};">
        <div class="text-xs text-white font-black uppercase mb-8">🔄 CIERRE OPERATIVO → COMERCIALIZACIÓN/VENTA</div>
        <div class="text-xs text-aaa mb-10">
          Finaliza primero los registros de Explotación (producción, costes y cumplimiento). Después continúa el flujo comercial.
        </div>
        <div class="grid grid-cols-2 gap-10">
          <button class="widget-link-btn" onclick="ExplotacionView._irAComercializacionDesdeExplotacion('${modo}')">🚚 Ir a Comercialización (${modo === 'leche' ? 'Leche' : 'Carne'})</button>
          <a href="#/informes" class="widget-link-btn">📊 Ver informes de control</a>
        </div>
      </div>
    `;
  },

  async _abrirWizardGastoModo(categoria, modo) {
    if (window.App && typeof App._abrirFormularioGasto === 'function') {
      await App._abrirFormularioGasto({
        categoria,
        origenModulo: 'explotacion',
        modoExplotacion: modo
      });
      return;
    }
    App.toastError("No se pudo abrir el wizard de gasto");
  },

  async _abrirAsistenteSanitario(modo) {
    const d = this._cachedData;
    const rebanosBase = d?.rebanos || [];
    const rebanos = modo === 'carne'
      ? rebanosBase.filter(r => d.rebCarneIds?.has(r.id))
      : (modo === 'leche'
        ? rebanosBase.filter(r => d.rebLecheIds?.has(r.id))
        : rebanosBase.filter(r => d.rebHibridoIds?.has(r.id)));

    if (!window.WizardTratamiento || typeof window.WizardTratamiento.registrar !== 'function') {
      App.toastError("Wizard de tratamiento no disponible");
      return;
    }
    if (!rebanos || rebanos.length === 0) {
      App.toastError("No hay rebaños disponibles para este modo");
      return;
    }
    if (rebanos.length === 1) {
      await window.WizardTratamiento.registrar(rebanos[0].id, {
        origen_modulo: 'explotacion',
        modo_explotacion: modo,
        returnTo: 'explotacion'
      });
      return;
    }

    const color = modo === 'leche' ? '#3b82f6' : (modo === 'hibrido' ? '#10b981' : '#ef4444');
    const overlay = document.createElement("div");
    overlay.className = "wizard-full-screen";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.innerHTML = `
      <div class="card p-25" style="max-width:380px; border-top:5px solid ${color}; width:100%; margin:16px;">
        <h3 class="mt-0 text-white font-900">💉 Tratamiento ${modo.toUpperCase()}</h3>
        <label class="wizard-label mb-10">Selecciona rebaño para tratamiento:</label>
        <select id="w-expro-trat-reb" class="wizard-input wizard-select mb-15">
          ${rebanos.map(r => `<option value="${r.id}">${r.nombre} (${r.tipo || r.especie || 'N/D'})</option>`).join('')}
        </select>
        <div class="flex gap-10">
          <button class="wizard-btn-action wizard-btn-primary flex-1" id="w-expro-trat-next" style="background:${color}; border-color:${color};">Proceder ➔</button>
          <button class="wizard-btn-action wizard-btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#w-expro-trat-next').onclick = async () => {
      const rebId = parseInt(overlay.querySelector('#w-expro-trat-reb').value, 10);
      overlay.remove();
      await window.WizardTratamiento.registrar(rebId, {
        origen_modulo: 'explotacion',
        modo_explotacion: modo,
        returnTo: 'explotacion'
      });
      setTimeout(() => ExplotacionView.render(), 600);
    };
  },

  _resumenCumplimientoModo(modo) {
    const d = this._cachedData || {};
    const gastosFito = d.gastosFito || [];
    const pendientesNorma = gastosFito.filter(g => {
      const c = g.control_normativo || {};
      return !c.registroProducto || !c.dosisAplicada || c.aptoComercializacion === false;
    });
    const sanitarios = (window.Sanitarios && typeof Sanitarios.list === 'function') ? null : null;
    return {
      pendientesFitosanitarios: pendientesNorma.length,
      totalFitosanitarios: gastosFito.length
    };
  },

  async _irAComercializacionDesdeExplotacion(modo) {
    const resumen = this._resumenCumplimientoModo(modo);
    if (resumen.pendientesFitosanitarios > 0) {
      const ok = await Confirm.confirm("Control Normativo Pendiente", `Hay ${resumen.pendientesFitosanitarios} registro(s) fitosanitario(s) con control normativo pendiente o no aptos para comercialización. ¿Deseas continuar igualmente a Comercialización?`, false);
      if (!ok) return;
    }

    const payload = {
      origen: 'explotacion',
      modo_explotacion: modo,
      fecha: new Date().toISOString(),
      cumplimiento: resumen
    };
    try {
      sessionStorage.setItem('lm.explotacion_pipeline', JSON.stringify(payload));
    } catch (_) {}

    const tab = modo === 'leche' ? 'leche' : 'carne';
    window.location.hash = `#/comercializacion?tab=${tab}`;
  },

  async _abrirAsistenteSilo(modo) {
    const fincaId = this._cachedData.fincaId;
    
    let siloOptionsHtml = '';
    if (modo === 'leche') {
      siloOptionsHtml = `
        <option value="1">Silo A: Pienso Concentrado Ordeño</option>
        <option value="2">Silo B: Mezcla Unifeed Lactancia</option>
      `;
    } else if (modo === 'hibrido') {
      siloOptionsHtml = `
        <option value="1">Silo A: Concentrado Terneros</option>
        <option value="2">Silo B: Mezcla Forrajera</option>
        <option value="3">Silo C: Concentrado Ordeño</option>
        <option value="4">Silo D: Unifeed Lactancia</option>
      `;
    } else {
      siloOptionsHtml = `
        <option value="1">Silo A: Concentrado Terneros</option>
        <option value="2">Silo B: Mezcla Forrajera</option>
      `;
    }

    const themeColor = modo === 'leche' ? '#3b82f6' : (modo === 'hibrido' ? '#10b981' : '#ef4444');

    const overlay = document.createElement("div");
    overlay.className = "wizard-full-screen";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.style.zIndex = "7000";
    overlay.innerHTML = `
      <div class="card p-25" style="max-width:380px; border-top:5px solid ${themeColor}; width:100%; margin:16px;">
        <h3 class="mt-0 text-white font-900">📦 Registro de Silo</h3>
        
        <div class="wizard-input-group">
          <label class="wizard-label">Seleccionar Silo</label>
          <select id="ws-silo-id" class="wizard-input wizard-select">
            ${siloOptionsHtml}
          </select>
        </div>

        <div class="wizard-input-group">
          <label class="wizard-label">Tipo de Movimiento</label>
          <select id="ws-mov" class="wizard-input wizard-select">
            <option value="COMPRA">Carga / Abastecimiento (Suma)</option>
            <option value="CONSUMO">Consumo / Reparto (Resta)</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-10">
          <div class="wizard-input-group">
            <label class="wizard-label">Cantidad (kg)</label>
            <input type="number" id="ws-qty" value="1000" min="1" class="wizard-input">
          </div>
          <div class="wizard-input-group">
            <label class="wizard-label">Fecha</label>
            <input type="date" id="ws-date" class="wizard-input">
          </div>
        </div>

        <div class="flex gap-10 mt-20">
          <button class="wizard-btn-action wizard-btn-primary flex-1" id="ws-btn-save" style="background:${themeColor}; border-color:${themeColor};">Registrar ➔</button>
          <button class="wizard-btn-action wizard-btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#ws-date').value = new Date().toISOString().split('T')[0];

    overlay.querySelector('#ws-btn-save').onclick = async () => {
      const siloId = parseInt(overlay.querySelector('#ws-silo-id').value);
      const rol = overlay.querySelector('#ws-mov').value;
      const qty = parseFloat(overlay.querySelector('#ws-qty').value);
      const fecha = overlay.querySelector('#ws-date').value;
      const siloName = overlay.querySelector('#ws-silo-id').options[overlay.querySelector('#ws-silo-id').selectedIndex].text;

      if (isNaN(qty) || qty <= 0) {
        App.toastError("Cantidad inválida");
        return;
      }

      const evento = {
        fincaId,
        fecha,
        entidad_id: siloId,
        tipo_entidad: 'silo_pienso',
        snap_identificacion: siloName,
        valor_neto: qty,
        motivo_tarea: rol === 'COMPRA' ? 'carga_pienso' : 'consumo_pienso',
        unidad: 'kg',
        rol_contable: rol,
        creadoEn: new Date().toISOString()
      };

      await window.db.add('registro_eventos', evento);
      App.toast("Movimiento de almacén registrado");
      overlay.remove();
      
      await ExplotacionView.render();
    };
  },

  // ==========================================
  //  MÉTODO COMÚN: EDITAR / BORRAR REGISTROS FÍSICOS
  // ==========================================
  async _abrirOpcionesRegistro(id, tipo) {
    try {
      const evento = await window.db.get('registro_eventos', id);
      if (!evento) return;

      const themeColor = tipo === 'leche' ? '#3b82f6' : '#ef4444';
      const labelValor = tipo === 'leche' ? 'Litros (L)' : 'Valor (kg)';

      const overlay = document.createElement("div");
      overlay.className = "wizard-full-screen";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
      overlay.innerHTML = `
          <div class="card p-25" style="max-width:420px; border-top:5px solid ${themeColor}; margin:16px; width:100%;">
              <h3 class="mt-0 text-white font-900">Rectificar / Anular Registro Físico</h3>
              <p class="text-xs text-gray mb-15">ID Interno: ${evento.id}</p>

              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                    <label class="wizard-label">${labelValor}</label>
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
              <div class="wizard-input-group">
                  <label class="wizard-label">Motivo de rectificación / anulación</label>
                  <textarea id="edit-reg-motivo" class="wizard-input" rows="2" placeholder="Indica motivo legal/auditable..."></textarea>
              </div>

              <div class="flex gap-10 mt-20">
                  <button class="wizard-btn-action wizard-btn-primary flex-1" id="btn-save-reg" style="background:${themeColor}; border-color:${themeColor}; flex:2;">📝 Rectificar</button>
                  <button class="wizard-btn-action wizard-btn-danger flex-1" id="btn-del-reg">🚫 Anular</button>
              </div>
              <button class="wizard-btn-action wizard-btn-secondary mt-10 w-full" onclick="this.closest('.wizard-full-screen').remove()">Cancelar</button>
          </div>`;
      document.body.appendChild(overlay);

      overlay.querySelector('#btn-save-reg').onclick = async () => {
        const val = parseFloat(overlay.querySelector('#edit-reg-valor').value);
        const fecha = overlay.querySelector('#edit-reg-fecha').value;
        const ident = overlay.querySelector('#edit-reg-ident').value.trim();
        const motivoRectificacion = overlay.querySelector('#edit-reg-motivo')?.value.trim();

        if (isNaN(val) || val <= 0) return App.toastError("Valor inválido");
        if (!motivoRectificacion) return App.toastError("El motivo de rectificación es obligatorio");

        const original = { ...evento };

        evento.valor_neto = val;
        evento.fecha = fecha;
        evento.snap_identificacion = ident;
        evento.rectificado = true;
        evento.rectificadoEn = new Date().toISOString();
        evento.rectificadoMotivo = motivoRectificacion;
        evento.rectificacionDe = original.id;
        evento.actualizadoEn = new Date().toISOString();

        await window.db.put('registro_eventos', evento);
        await window.db.add('registro_eventos', {
          fincaId: evento.fincaId,
          entidad_id: evento.entidad_id,
          tipo_entidad: evento.tipo_entidad || 'registro',
          tipo: 'auditoria',
          motivo_tarea: 'rectificacion_registro',
          fecha: new Date().toISOString().split('T')[0],
          observaciones: `Rectificación registro ${original.id}: ${motivoRectificacion}`,
          auditoria: {
            evento_origen_id: original.id,
            antes: original,
            despues: {
              valor_neto: evento.valor_neto,
              fecha: evento.fecha,
              snap_identificacion: evento.snap_identificacion
            },
            motivo: motivoRectificacion
          },
          creadoEn: new Date().toISOString()
        });
        App.toast("Registro actualizado");
        overlay.remove();
        await ExplotacionView.render();
      };

      overlay.querySelector('#btn-del-reg').onclick = async () => {
        const motivoAnulacion = overlay.querySelector('#edit-reg-motivo')?.value.trim();
        if (!motivoAnulacion) return App.toastError("El motivo de anulación es obligatorio");
        if (!await Confirm.confirm("Anular Registro", "¿Anular este registro? Se conservará para auditoría.", true)) return;

        evento.anulado = true;
        evento.anuladoEn = new Date().toISOString();
        evento.anuladoMotivo = motivoAnulacion;
        evento.actualizadoEn = new Date().toISOString();
        await window.db.put('registro_eventos', evento);
        await window.db.add('registro_eventos', {
          fincaId: evento.fincaId,
          entidad_id: evento.entidad_id,
          tipo_entidad: evento.tipo_entidad || 'registro',
          tipo: 'auditoria',
          motivo_tarea: 'anulacion_registro',
          fecha: new Date().toISOString().split('T')[0],
          observaciones: `Anulación registro ${evento.id}: ${motivoAnulacion}`,
          auditoria: {
            evento_origen_id: evento.id,
            motivo: motivoAnulacion
          },
          creadoEn: new Date().toISOString()
        });
        App.toast("Registro anulado");
        overlay.remove();
        await ExplotacionView.render();
      };
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.ExplotacionView = ExplotacionView;
