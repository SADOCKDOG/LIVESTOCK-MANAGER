/**
 * Livestock Manager - ExplotacionView v1.2.0
 * Vista unificada del Módulo ExPro (Explotación y Producción)
 * Contiene tres modos seleccionables en la parte superior: Carne (Rojo), Leche (Azul), Híbrido (Verde)
 */

const ExplotacionView = {
  _activeMode: 'leche', // default
  _activeSubModule: 'explotacion', // default
  _cachedData: null,

  _cambiarSubModulo(subModulo) {
    this._activeSubModule = subModulo;
    this.render();
  },

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

    const savedMode = window.ModoContextoHelper
      ? ModoContextoHelper.getModeForBlock('explotacion', rebanos)
      : 'leche';

    this._activeMode = this._activeMode || savedMode;

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

    // Sincronizar color de cabecera con el modo activo
    if (window.App && App.updateHeaderColor) App.updateHeaderColor(this._activeMode);

    // Conmutador superior de Sub-módulos (Explotación, Gastos, Almacén)
    main.innerHTML = `
      <div class="card p-14 mb-14 border-222">
        <div class="text-center mb-10">
          <div class="section-header-neon" style="--neon-color: #10b981; max-width: 480px; margin: 0 auto;">${Icons.finca()} EXPLOTACIÓN ${Icons.paquete()}</div>
          <div class="comer-mode-switch" style="display: flex; gap: 8px;">
            <button class="comer-mode-btn ${this._activeSubModule === 'explotacion' ? 'active' : ''}" 
              style="--mode-color:#10b981; flex: 1; padding: 10px;" 
              onclick="ExplotacionView._cambiarSubModulo('explotacion')">
              ${Icons.finca()} Explotación
            </button>
            <button class="comer-mode-btn ${this._activeSubModule === 'gastos' ? 'active' : ''}" 
              style="--mode-color:#ef4444; flex: 1; padding: 10px;" 
              onclick="ExplotacionView._cambiarSubModulo('gastos')">
              ${Icons.dinero()} Gastos
            </button>
            <button class="comer-mode-btn ${this._activeSubModule === 'almacen' ? 'active' : ''}" 
              style="--mode-color:#3b82f6; flex: 1; padding: 10px;" 
              onclick="ExplotacionView._cambiarSubModulo('almacen')">
              ${Icons.paquete()} Almacén
            </button>
          </div>
        </div>
        <div class="pt-8 border-top-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider flex items-center gap-4">${Icons.finca()} Contexto: Submódulos</div>
          <div class="text-xs text-aaa mt-4 leading-relaxed">KPIs de producción, costes operativos y gestión de stock de silos y almacén.</div>
        </div>
      </div>
      
      <div id="explotacion-submodule-content"></div>
    `;

    const subContainer = document.getElementById('explotacion-submodule-content');

    if (this._activeSubModule === 'explotacion') {
      const _headerColor = this._activeMode === 'leche' ? '#3b82f6' : (this._activeMode === 'hibrido' ? '#10b981' : '#ef4444');
      subContainer.innerHTML = `
        <!-- Selector de Modo ExPro Superior -->
        <div class="card p-14 mb-14 border-222" style="border-top:3px solid ${_headerColor};">
          <div class="text-center mb-10">
            <div class="section-header-neon" style="--neon-color: ${_headerColor}; max-width: 480px; margin: 0 auto;">EXPLOTACIÓN</div>
            <div class="expro-mode-switch">
              <button class="expro-mode-btn ${this._activeMode === 'carne' ? 'active' : ''}" style="--mode-color:#ef4444;" onclick="ExplotacionView._cambiarModo('carne')">${Icons.carne()} Carne</button>
              <button class="expro-mode-btn ${this._activeMode === 'leche' ? 'active' : ''}" style="--mode-color:#3b82f6;" onclick="ExplotacionView._cambiarModo('leche')">${Icons.leche()} Leche</button>
              <button class="expro-mode-btn ${this._activeMode === 'hibrido' ? 'active' : ''}" style="--mode-color:#10b981;" onclick="ExplotacionView._cambiarModo('hibrido')">${Icons.rotacion()} Híbrido</button>
            </div>
          </div>
          <div class="pt-8 border-top-222">
            <div class="text-xs text-gray uppercase font-extrabold tracking-wider flex items-center gap-4">${_headerColor === '#ef4444' ? Icons.carne() : _headerColor === '#3b82f6' ? Icons.leche() : Icons.rotacion()} Contexto: ${_headerColor === '#ef4444' ? 'Cárnico' : _headerColor === '#3b82f6' ? 'Lácteo' : 'Híbrido'}</div>
            <div class="text-xs text-aaa mt-4 leading-relaxed">Panel de control por modo con KPIS, registros de producción, acciones rápidas y acceso a comercialización.</div>
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
    } else if (this._activeSubModule === 'gastos') {
      this._renderGastosView();
    } else if (this._activeSubModule === 'almacen') {
      this._renderAlmacenView();
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

  // ==========================================
  //  LAYOUT: CARNE
  // ==========================================
  _renderCarne(container) {
    const d = this._cachedData;
    const themeColor = '#ef4444'; // Rojo

    let html = `
      <div style="--theme-color: ${themeColor}; --neon-glow: ${themeColor}B0; --neon-inner: ${themeColor}40">
        <!-- KPI Unificado de Rendimiento y Eficiencia -->
        <div class="card p-16 mb-16 border-222 card-total-3d" style="border-top: 5px solid #ef4444; width:100%;">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-10 flex items-center gap-6">
            ${Icons.tendencia()} RENDIMIENTO Y EFICIENCIA DE CARNE
          </div>
          <div class="flex flex-col">
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.balanza()} GMD Media</span>
              <strong class="text-xl font-950 text-green">+${d.gmdMedio.toFixed(2)} kg/d</strong>
            </div>
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.gastos()} Alimentación</span>
              <strong class="text-xl font-950 text-red">${d.totalGastosAlim.toLocaleString()} €</strong>
            </div>
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.paquete()} Pesajes</span>
              <strong class="text-xl font-950 text-amber">${d.pesajes.length}</strong>
            </div>
            <div class="py-12 flex justify-between items-center">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.animales()} Censo Activo</span>
              <strong class="text-xl font-950 text-blue">${d.animalesFinca.length}</strong>
            </div>
          </div>
        </div>

        <!-- PANEL DE ACCIONES -->
        <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24">
          <div class="section-header-theme">ACCIONES DE REGISTRO</div>
          <div class="grid grid-cols-2 gap-10">
            <button class="widget-link-btn widget-link-btn--neon neon-theme" onclick="App._abrirAsistenteProduccion('carne', { origen_modulo: 'explotacion', modo_explotacion: 'carne' })">
              ${Icons.agregar()}
              <span class="widget-link-label">Peso (kg)</span>
            </button>
            <button class="widget-link-btn widget-link-btn--neon neon-accent" onclick="ExplotacionView._abrirAsistenteSanitario('carne')">
              ${Icons.sanidad()}
              <span class="widget-link-label">Tratamiento</span>
            </button>
          </div>
          <div class="text-center mt-8"><span class="text-xs text-gray uppercase font-extrabold tracking-wider leading-relaxed">Registro de pesajes y tratamientos sanitarios para producción cárnica</span></div>
        </div>

        <!-- Líderes GMD -->
        <div class="mb-14 p-12 rounded bg-dark border border-222 border-top-3px border-top-3px-amber">
          <div class="text-xs text-amber font-black uppercase mb-6 flex items-center gap-6">${Icons.tendencia()} LÍDERES DE GANANCIA DE PESO (GMD)</div>
          <div class="grid gap-6">
            ${d.gmdList.slice(0, 4).map(g => `
              <div class="flex justify-between items-center text-xs text-white">
                <span class="text-ccc">🐄 ${g.crotal} (${g.rebano})</span>
                <strong class="text-green">+${g.gmd.toFixed(3)} kg/día</strong>
              </div>`).join('') || '<div class="text-xs text-555">Sin datos evaluados de GMD. Registra al menos dos pesajes para el mismo animal.</div>'}
          </div>
          <div class="text-center mt-8"><span class="text-xs text-gray uppercase font-extrabold tracking-wider leading-relaxed">Registro mixto de pesajes, ordeños y tratamientos para explotación híbrida</span></div>
        </div>

        <!-- Historial Consolidado -->
        <div class="card p-16 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
            ${Icons.documento()} Últimos pesajes registrados
          </div>
          <div class="grid gap-8 mh-350">
            ${d.pesajes.length > 0
              ? d.pesajes.slice(0, 15).map(e => `
                  <div class="card card-animal" onclick="ExplotacionView._abrirOpcionesRegistro(${e.id}, 'carne')" style="border-left:4px solid ${e.tipo_entidad === 'animal' ? '#ef4444' : '#f59e0b'}; padding:10px; margin:0;">
                    <div class="flex justify-between items-center">
                      <div class="text-xs">
                        <div class="font-bold text-white uppercase">${e.snap_identificacion || 'Animal/Lote'}</div>
                        <div class="text-gray mt-4 flex items-center gap-4 font-700">${Icons.calendar()} ${this._fmtFecha(e.fecha)}</div>
                      </div>
                      <span class="badge badge-sm font-bold text-red badge-red-outline">${e.valor_neto} kg</span>
                    </div>
                  </div>`).join('')
              : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin pesajes registrados</span></div>`
            }
          </div>
        </div>

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
      <div style="--theme-color: ${themeColor}; --neon-glow: ${themeColor}B0; --neon-inner: ${themeColor}40">
        <!-- KPI Unificado de Rendimiento y Eficiencia -->
        <div class="card p-16 mb-16 border-222 card-total-3d" style="border-top: 5px solid #3b82f6; width:100%;">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-10 flex items-center gap-6">
            ${Icons.leche()} RENDIMIENTO Y EFICIENCIA DE LECHE
          </div>
          <div class="flex flex-col">
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.dinero()} Margen (MOFA)</span>
              <strong class="text-xl font-950" style="color:${d.mofaLeche >= 0 ? 'var(--c-success)' : 'var(--c-danger)'}">${Math.round(d.mofaLeche).toLocaleString()} €</strong>
            </div>
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.leche()} Total Leche</span>
              <strong class="text-xl font-950 text-blue">${this._fmt(d.totalLitros)} L</strong>
            </div>
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.grafico()} Extracto Seco</span>
              <strong class="text-xl font-950 text-gold">${d.extractoSecoMedio > 0 ? d.extractoSecoMedio.toFixed(2) + '%' : 'N/D'}</strong>
            </div>
            <div class="py-12 flex justify-between items-center">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.gastos()} Costes Alim.</span>
              <strong class="text-xl font-950 text-red">${d.totalGastosAlim.toLocaleString()} €</strong>
            </div>
          </div>
        </div>

        <!-- PANEL DE ACCIONES -->
        <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24">
          <div class="section-header-theme">ACCIONES DE REGISTRO</div>
          <div class="grid grid-cols-2 gap-10">
            <button class="widget-link-btn widget-link-btn--neon neon-theme" onclick="App._abrirAsistenteProduccion('leche', { origen_modulo: 'explotacion', modo_explotacion: 'leche' })">
              ${Icons.agregar()}
              <span class="widget-link-label">Control (L)</span>
            </button>
            <button class="widget-link-btn widget-link-btn--neon neon-accent" onclick="ExplotacionView._abrirAsistenteSanitario('leche')">
              ${Icons.sanidad()}
              <span class="widget-link-label">Tratamiento</span>
            </button>
          </div>
          <div class="text-center mt-8"><span class="text-xs text-gray uppercase font-extrabold tracking-wider leading-relaxed">Registro de controles lecheros y tratamientos sanitarios para producción láctea</span></div>
        </div>

        <!-- Calidad e Higiene de Tanque (Analíticas) -->
        <div class="card p-14 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-8 pb-5">
            ${Icons.grafico()} Calidad de Tanque (Últimas Analíticas de Laboratorio)
          </div>
          
          <div class="scroll-shadow-container overflow-x-auto">
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
                          <td><span class="flex items-center gap-4">${Icons.calendar()} ${this._fmtFecha(e.fechaRecogida || e.fecha)}</span></td>
                          <td><strong>${(e.cantidad || 0).toLocaleString()} L</strong></td>
                          <td>${lab.grasa != null ? lab.grasa.toFixed(2) + '%' : '—'}</td>
                          <td>${lab.proteina != null ? lab.proteina.toFixed(2) + '%' : '—'}</td>
                          <td class="${(lab.somaticas || 0) > 400000 ? 'text-red' : 'text-green'}">${lab.somaticas ? (lab.somaticas / 1000).toFixed(0) + 'k' : '—'}</td>
                          <td class="${(lab.germenes || 0) > 1500000 ? 'text-red' : 'text-green'}">${lab.germenes ? (lab.germenes / 1000).toFixed(0) + 'k' : '—'}</td>
                          <td class="${e.certificadoInhibidores === false || e.antibioticos ? 'text-red' : 'text-green'}">${e.certificadoInhibidores ? 'OK' : (e.certificadoInhibidores === false ? 'ALERT' : 'PEND')}</td>
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
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
            ${Icons.documento()} Ordeños y Controles Diarios Recientes
          </div>
          <div class="grid gap-8 mh-220">
            ${d.ordeños.length > 0
              ? d.ordeños.slice(0, 10).map(o => `
                  <div class="card card-animal" onclick="ExplotacionView._abrirOpcionesRegistro(${o.id}, 'leche')" style="border-left:4px solid ${o.tipo_entidad === 'animal' ? '#3b82f6' : '#8b5cf6'}; padding:10px; margin:0;">
                    <div class="flex justify-between items-center">
                      <div class="text-xs">
                        <div class="font-bold text-white uppercase">${o.snap_identificacion || 'Control Lote/Animal'}</div>
                        <div class="text-gray mt-4 flex items-center gap-4 font-700">${Icons.calendar()} ${this._fmtFecha(o.fecha)}</div>
                      </div>
                      <span class="badge badge-sm font-bold text-blue badge-blue-outline">${o.valor_neto} L</span>
                    </div>
                  </div>`).join('')
              : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin registros de ordeño</span></div>`
            }
          </div>
        </div>

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
      <div style="--theme-color: ${themeColor}; --neon-glow: ${themeColor}B0; --neon-inner: ${themeColor}40">
        <!-- KPI Unificado de Rendimiento y Eficiencia -->
        <div class="card p-16 mb-16 border-222 card-total-3d" style="border-top: 5px solid #10b981; width:100%;">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-10 flex items-center gap-6">
            ${Icons.rotacion()} RENDIMIENTO Y EFICIENCIA HÍBRIDA
          </div>
          <div class="flex flex-col">
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.dinero()} Margen (MOFA)</span>
              <strong class="text-xl font-950" style="color:${d.mofaHibrido >= 0 ? 'var(--c-success)' : 'var(--c-danger)'}">${Math.round(d.mofaHibrido).toLocaleString()} €</strong>
            </div>
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.grafico()} Eficiencia</span>
              <strong class="text-xl font-950 text-green">${d.ratioMofaHibrido.toFixed(1)}%</strong>
            </div>
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.gastos()} Costes Alim.</span>
              <strong class="text-xl font-950 text-red">${d.totalGastosAlim.toLocaleString()} €</strong>
            </div>
            <div class="py-12 flex justify-between items-center">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.paquete()} L / Pesajes</span>
              <strong class="text-xl font-950 text-blue">${this._fmt(d.totalLitros)} L / ${d.pesajes.length}</strong>
            </div>
          </div>
        </div>

        <!-- PANEL DE ACCIONES -->
        <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24">
          <div class="section-header-theme">ACCIONES DE REGISTRO</div>
          <div class="grid grid-cols-3 gap-10">
            <button class="widget-link-btn widget-link-btn--neon neon-danger" onclick="App._abrirAsistenteProduccion('carne', { origen_modulo: 'explotacion', modo_explotacion: 'hibrido' })">
              ${Icons.agregar()}
              <span class="widget-link-label">Peso (kg)</span>
            </button>
            <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="App._abrirAsistenteProduccion('leche', { origen_modulo: 'explotacion', modo_explotacion: 'hibrido' })">
              ${Icons.agregar()}
              <span class="widget-link-label">Ordeño (L)</span>
            </button>
            <button class="widget-link-btn widget-link-btn--neon neon-accent" onclick="ExplotacionView._abrirAsistenteSanitario('hibrido')">
              ${Icons.sanidad()}
              <span class="widget-link-label">Tratamiento</span>
            </button>
          </div>
        </div>

        <!-- True Hub: Highlight Carne & Leche Side-by-Side -->
        <div class="grid grid-cols-2 gap-10 mb-14">
          <div class="p-10 rounded bg-dark border border-222 border-top-3px border-top-3px-red">
            <div class="text-xs font-bold text-red uppercase mb-6 flex items-center gap-6">${Icons.carne()} Carne: Líderes GMD</div>
            <div class="grid gap-4 text-xs">
              ${d.gmdList.slice(0, 3).map(g => `
                <div class="flex justify-between">
                  <span class="text-ccc">${g.crotal}</span>
                  <strong class="text-green">+${g.gmd.toFixed(2)}</strong>
                </div>`).join('') || '<div class="text-555">Sin datos.</div>'}
            </div>
          </div>

          <div class="p-10 rounded bg-dark border border-222 border-top-3px border-top-3px-blue">
            <div class="text-xs font-bold text-blue uppercase mb-6 flex items-center gap-6">${Icons.grafico()} Leche: Última analítica</div>
            <div class="grid gap-4 text-xs">
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
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
            ${Icons.documento()} Historial Consolidado Reciente
          </div>
          <div class="grid gap-8 mh-220">
            ${d.proConsolidada.length > 0
              ? d.proConsolidada.slice(0, 12).map(e => {
                  const esPeso = e.unidad === 'kg';
                  const color = esPeso ? '#ef4444' : '#3b82f6';
                  return `
                    <div class="card card-animal" onclick="ExplotacionView._abrirOpcionesRegistro(${e.id}, '${esPeso ? 'carne' : 'leche'}')" style="border-left:4px solid ${color}; padding:10px; margin:0;">
                      <div class="flex justify-between items-center">
                      <div class="text-xs">
                        <div class="font-bold text-white uppercase">${e.snap_identificacion || 'Registro Mixto'}</div>
                        <div class="text-gray mt-4 flex items-center gap-4 font-700">${Icons.calendar()} ${this._fmtFecha(e.fecha)}</div>
                      </div>
                        <span class="badge badge-sm font-bold" style="background:${color}10; color:${color}; border:1px solid ${color}30;">${e.valor_neto} ${e.unidad}</span>
                      </div>
                    </div>`;
                }).join('')
              : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin registros de producción</span></div>`
            }
          </div>
        </div>

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
      <div class="card p-16 mb-16 border-222 card-total-3d" style="border-top: 5px solid ${borderStyleColor}; background: rgba(255, 255, 255, 0.02);">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-10 flex items-center gap-6">
          ${Icons.paquete()} BALANCE DE STOCK Y LLENADO DE SILOS
        </div>
        <div class="flex flex-col">
    `;

    silos.forEach((s, index) => {
      const cargas = siloEventos.filter(e => e.entidad_id === s.id && e.rol_contable === 'COMPRA').reduce((sum, e) => sum + (e.valor_neto || 0), 0);
      const consumos = siloEventos.filter(e => e.entidad_id === s.id && e.rol_contable === 'CONSUMO').reduce((sum, e) => sum + (e.valor_neto || 0), 0);
      const actual = Math.max(0, s.inicial + cargas - consumos);
      const pct = Math.min(100, Math.round((actual / s.capacidad) * 100));
      let colorBar = borderStyleColor;
      if (pct < 20) colorBar = '#ef4444'; // Rojo crítico
      else if (pct < 50) colorBar = '#f59e0b'; // Naranja/Aviso

      html += `
        <div class="py-12 ${index < silos.length - 1 ? 'border-bottom-222' : ''} flex flex-col gap-6">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900">${s.nombre}</span>
            <strong class="text-xl font-950" style="color:${colorBar};">${actual.toLocaleString()} kg</strong>
          </div>
          <div class="flex justify-between items-center text-[0.68rem] text-aaa">
            <span>Capacidad: ${s.capacidad.toLocaleString()} kg</span>
            <span style="color:${colorBar}; font-weight:800;">${pct}% lleno</span>
          </div>
          <div class="silo-bar mt-2" style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background:${colorBar}; width:${pct}%; height:100%; transition: width 0.3s; border-radius: 3px;"></div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        <div class="mt-20 py-24 flex flex-col items-center gap-15 border-top-222">
          <div class="section-header-neon" style="--neon-color: ${borderStyleColor}; width: 100%; padding:0; margin-bottom: 5px; letter-spacing: 2px;">ALMACÉN</div>
          <button class="widget-link-btn widget-link-btn--neon" style="--neon-color: ${borderStyleColor}; --neon-glow: ${borderStyleColor}B0; --neon-inner: ${borderStyleColor}40; width: 100%; max-width: 220px; padding: 18px 15px;" onclick="ExplotacionView._abrirAsistenteSilo('${modo}')">
            ${Icons.agregar()} <span class="widget-link-label uppercase font-950 text-base tracking-widest">CARGA / CONSUMO</span>
          </button>
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
        <div class="flex justify-between items-center mb-12">
          <div class="text-[0.65rem] text-white font-black uppercase flex items-center gap-6 tracking-widest">${Icons.dinero()} COSTES + CUMPLIMIENTO NORMATIVO</div>
        </div>
        <div class="grid grid-cols-3 gap-10 mb-20">
          <div class="card p-10 text-center border-272 bg-black">
            <div class="text-[0.6rem] text-888 uppercase font-800 mb-4">Alimentación</div>
            <div class="font-950 text-white text-sm">${(d.totalGastosAlim || 0).toLocaleString()} €</div>
          </div>
          <div class="card p-10 text-center border-272 bg-black">
            <div class="text-[0.6rem] text-888 uppercase font-800 mb-4">Energía</div>
            <div class="font-950 text-white text-sm">${(d.totalGastosEnergia || 0).toLocaleString()} €</div>
          </div>
          <div class="card p-10 text-center border-272 bg-black">
            <div class="text-[0.6rem] text-888 uppercase font-800 mb-4">Fitosanitarios</div>
            <div class="font-950 text-white text-sm">${(d.totalGastosFito || 0).toLocaleString()} €</div>
          </div>
        </div>

        <div class="py-32 border-y border-222 mb-32 bg-black-opacity-50 flex flex-col items-center">
            <div class="section-header-neon mb-20" style="--neon-color: ${color}; padding:0; letter-spacing: 3px;">GASTOS</div>
            <div class="grid grid-cols-3 gap-12 px-6 w-full">
              <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="ExplotacionView._abrirWizardGastoModo('Alimentacion', '${modo}')" style="padding: 16px 5px; min-height: 85px;">
                ${Icons.agregar()}
                <span class="widget-link-label text-[0.65rem] font-950">ALIMENTACIÓN</span>
              </button>
              <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="ExplotacionView._abrirWizardGastoModo('Electricidad', '${modo}')" style="padding: 16px 5px; min-height: 85px;">
                ${Icons.agregar()}
                <span class="widget-link-label text-[0.65rem] font-950">ENERGÍA</span>
              </button>
              <button class="widget-link-btn widget-link-btn--neon neon-success" onclick="ExplotacionView._abrirWizardGastoModo('Fitosanitarios', '${modo}')" style="padding: 16px 5px; min-height: 85px;">
                ${Icons.agregar()}
                <span class="widget-link-label text-[0.65rem] font-950">FITOSANITARIO</span>
              </button>
            </div>
        </div>

        <div class="mt-15 text-[0.65rem] text-aaa uppercase font-900 text-center leading-relaxed px-20 opacity-80">
          CONTROL COMPLETO: <strong class="text-white">${fitoConControl}</strong><br>
          NO APTOS COMERCIALIZACIÓN: <strong style="color:${fitoPendientes > 0 ? '#ef4444' : '#10b981'}">${fitoPendientes}</strong>
        </div>
      </div>
    `;
  },

  _renderPipelineComercialHtml(modo) {
    const color = modo === 'leche' ? '#3b82f6' : (modo === 'hibrido' ? '#10b981' : '#ef4444');
    const tab = modo === 'leche' ? 'leche' : 'carne';
    const labelBoton = modo === 'hibrido'
      ? 'Ir a Comercialización Leche, carne e híbrido'
      : `Ir a Comercialización (${modo === 'leche' ? 'Leche' : 'Carne'})`;

    return `
      <div class="mt-16 p-12 rounded bg-darker border border-222" style="border-top: 3px solid ${color};">
        <div class="text-xs text-white font-black uppercase mb-8 flex items-center gap-6">${Icons.rotacion()} CIERRE OPERATIVO → COMERCIALIZACIÓN/VENTA</div>
        <div class="text-xs text-aaa mb-10">
          Finaliza primero los registros de Explotación (producción, costes y cumplimiento). Después continúa el flujo comercial.
        </div>
        <div class="grid grid-cols-2 gap-10">
          <button class="widget-link-btn" onclick="ExplotacionView._irAComercializacionDesdeExplotacion('${modo}')">${Icons.transportistas()} ${labelBoton}</button>
          <a href="#/informes" class="widget-link-btn">${Icons.grafico()} Ver informes de control</a>
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
        <h3 class="mt-0 text-white font-900 flex items-center gap-8">${Icons.sanidad()} Tratamiento ${modo.toUpperCase()}</h3>
        <label class="wizard-label mb-10">Selecciona rebaño para tratamiento:</label>
        <select id="w-expro-trat-reb" class="wizard-input wizard-select mb-15">
          ${rebanos.map(r => `<option value="${r.id}">${r.nombre} (${r.tipo || r.especie || 'N/D'})</option>`).join('')}
        </select>
        <div class="flex gap-10">
          <button class="wizard-btn-action wizard-btn-primary flex-1" id="w-expro-trat-next" style="background:${color}; border-color:${color};">Proceder ${Icons.siguiente()}</button>
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

    const tab = (modo === 'leche' || modo === 'hibrido') ? 'leche' : 'carne';
    window.location.hash = `#/comercializacion?tab=${tab}`;
  },

  async _abrirAsistenteSilo(modo) {
    const fincaId = this._cachedData.fincaId;
    
    const silos = modo === 'leche'
      ? [{ v: '1', l: 'Silo A: Pienso Concentrado Ordeño' }, { v: '2', l: 'Silo B: Mezcla Unifeed Lactancia' }]
      : modo === 'hibrido'
        ? [{ v: '1', l: 'Silo A: Concentrado Terneros' }, { v: '2', l: 'Silo B: Mezcla Forrajera' }, { v: '3', l: 'Silo C: Concentrado Ordeño' }, { v: '4', l: 'Silo D: Unifeed Lactancia' }]
        : [{ v: '1', l: 'Silo A: Concentrado Terneros' }, { v: '2', l: 'Silo B: Mezcla Forrajera' }];

    const modeClass = 'silo-card--' + modo;

    const overlay = document.createElement("div");
    overlay.className = "wizard-full-screen";
    overlay.style.zIndex = "7000";
    overlay.innerHTML = `
      <div class="card p-25 silo-card ${modeClass}">
        <h3 class="mt-0 text-white font-900 flex items-center gap-8">${Icons.paquete()} Registro de Silo</h3>
        
        <div class="wizard-input-group">
          <label class="wizard-label">Seleccionar Silo</label>
          <select id="ws-silo-id" class="wizard-input wizard-select">
            ${silos.map(s => `<option value="${s.v}">${s.l}</option>`).join('')}
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
          <button class="wizard-btn-action wizard-btn-primary flex-1" id="ws-btn-save">Registrar ${Icons.siguiente()}</button>
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
                  <button class="wizard-btn-action wizard-btn-primary flex-1" id="btn-save-reg" style="background:${themeColor}; border-color:${themeColor}; flex:2;">${Icons.editar()} Rectificar</button>
                  <button class="wizard-btn-action wizard-btn-danger flex-1" id="btn-del-reg">${Icons.eliminar()} Anular</button>
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
  },

  _renderGastosView() {
    const d = this._cachedData;
    const container = document.getElementById('explotacion-submodule-content');
    if (!container) return;

    const fitoPendientes = (d.gastosFito || []).filter(g => g.control_normativo?.aptoComercializacion === false).length;
    const fitoConControl = (d.gastosFito || []).filter(g => g.control_normativo?.registroProducto && g.control_normativo?.dosisAplicada).length;

    // Ordenar los gastos por fecha descendente
    const listaGastos = (d.todosGastos || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = `
      <div style="--theme-color: #ef4444; --neon-glow: #ef4444B0; --neon-inner: #ef444440">
        <!-- KPIs GASTOS -->
        <div class="card p-16 mb-16 border-222 card-total-3d" style="border-top: 5px solid #ef4444; width:100%;">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-10 flex items-center gap-6">
            ${Icons.dinero()} BALANCE DE COSTES
          </div>
          <div class="flex flex-col">
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.paquete()} Alimentación</span>
              <strong class="text-xl font-950" style="color:var(--c-warning);">${(d.totalGastosAlim || 0).toLocaleString()} €</strong>
            </div>
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.rayo()} Energía</span>
              <strong class="text-xl font-950" style="color:var(--c-info);">${(d.totalGastosEnergia || 0).toLocaleString()} €</strong>
            </div>
            <div class="py-12 flex justify-between items-center">
              <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.sanidad()} Fitosanitarios</span>
              <strong class="text-xl font-950" style="color:var(--c-success);">${(d.totalGastosFito || 0).toLocaleString()} €</strong>
            </div>
          </div>
        </div>

        <!-- ACCIONES RÁPIDAS DE GASTOS -->
        <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24">
          <div class="section-header-theme" style="--theme-color: #ef4444">${Icons.dinero()} GESTIÓN DE COSTOS</div>
          <div class="flex justify-center mt-10">
            <button class="widget-link-btn widget-link-btn--neon neon-theme" style="width: 100%; max-width: 260px; padding: 18px 15px;" onclick="App._abrirFormularioGasto({ origenModulo: 'explotacion' })">
              ${Icons.agregar()} <span class="widget-link-label uppercase font-950 text-base tracking-widest">REGISTRAR GASTO</span>
            </button>
          </div>
          <div class="text-center mt-8"><span class="text-xs text-gray uppercase font-extrabold tracking-wider leading-relaxed">Registro de gastos por categoría: alimentación, energía, fitosanitarios y otros</span></div>
        </div>

        <!-- CONTROL NORMATIVO FITOSANITARIOS -->
        <div class="card p-12 mb-16 border-222" style="border-left:4px solid #10b981;">
          <div class="text-xs text-white font-black uppercase flex items-center gap-6 mb-8">${Icons.sanidad()} CUMPLIMIENTO REGISTRO FITOSANITARIO</div>
          <div class="text-[0.65rem] text-aaa uppercase font-900 leading-relaxed">
            Aplicaciones con control completo: <strong class="text-white">${fitoConControl}</strong><br>
            Lotes no aptos para comercialización por periodo de supresión: 
            <strong style="color:${fitoPendientes > 0 ? '#ef4444' : '#10b981'}">${fitoPendientes}</strong>
          </div>
        </div>

        <!-- LISTADO / HISTORIAL DE GASTOS -->
        <div class="card p-16 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-5">
            ${Icons.documento()} Historial de gastos registrados
          </div>
          <div class="grid gap-8 mh-350" style="overflow-y:auto; max-height:400px;">
            ${listaGastos.length > 0
              ? listaGastos.map(g => {
                  const catColor = g.categoria === 'Alimentacion' ? '#f59e0b' : (g.categoria === 'Electricidad' ? '#3b82f6' : '#10b981');
                  return `
                    <div class="card card-animal" style="border-left:4px solid ${catColor}; padding:12px; margin:0;">
                      <div class="flex justify-between items-center">
                        <div class="text-xs">
                          <div class="font-bold text-white uppercase">${g.concepto || 'Gasto Ganadero'}</div>
                          <div class="text-gray-500 mt-4 flex items-center gap-4 font-700">
                            ${Icons.calendar()} ${this._fmtFecha(g.fecha)} · ${g.categoria ? g.categoria.toUpperCase() : 'VARIOS'}
                          </div>
                        </div>
                        <div class="flex items-center gap-10">
                          <span class="badge badge-sm font-bold" style="background:${catColor}10; color:${catColor}; border:1px solid ${catColor}30;">${(g.monto || 0).toLocaleString()} €</span>
                          <button class="btn btn-danger btn-sm" style="padding:4px 8px;" onclick="ExplotacionView._eliminarGasto(${g.id})">${Icons.eliminar()}</button>
                        </div>
                      </div>
                    </div>`;
                }).join('')
              : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin gastos registrados</span></div>`
            }
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  },

  _renderAlmacenView() {
    const d = this._cachedData;
    const container = document.getElementById('explotacion-submodule-content');
    if (!container) return;

    // Historial de movimientos de almacén / silos ordenado por fecha desc
    const movimientosAlmacen = (d.siloEventos || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = `
      <div style="--theme-color: #3b82f6; --neon-glow: #3b82f6B0; --neon-inner: #3b82f640">
        <!-- Niveles de llenado de silos -->
        ${this._renderSilosHtml(d.fincaId, d.siloEventos, this._activeMode)}

        <!-- REGISTRO DE MOVIMIENTO DE ALMACÉN -->
        <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24">
          <div class="section-header-theme" style="--theme-color: #3b82f6">${Icons.paquete()} GESTIÓN DE STOCK</div>
          <div class="flex justify-center mt-10">
            <button class="widget-link-btn widget-link-btn--neon neon-info" style="width: 100%; max-width: 260px; padding: 18px 15px;" onclick="ExplotacionView._abrirAsistenteSilo('${this._activeMode}')">
              ${Icons.agregar()} <span class="widget-link-label uppercase font-950 text-base tracking-widest">CARGA / CONSUMO</span>
            </button>
          </div>
          <div class="text-center mt-8"><span class="text-xs text-gray uppercase font-extrabold tracking-wider leading-relaxed">Registro de cargas y consumos de silo para control de inventario de pienso</span></div>
        </div>

        <!-- HISTORIAL DE MOVIMIENTOS -->
        <div class="card p-16 mb-16 border-222">
          <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-5">
            ${Icons.documento()} Historial de movimientos de silo
          </div>
          <div class="grid gap-8 mh-350" style="overflow-y:auto; max-height:400px;">
            ${movimientosAlmacen.length > 0
              ? movimientosAlmacen.map(ev => {
                  const esCompra = ev.rol_contable === 'COMPRA';
                  const badgeColor = esCompra ? '#10b981' : '#ef4444';
                  const labelMov = esCompra ? 'CARGA' : 'CONSUMO';
                  return `
                    <div class="card card-animal" style="border-left:4px solid ${badgeColor}; padding:12px; margin:0;">
                      <div class="flex justify-between items-center">
                        <div class="text-xs">
                          <div class="font-bold text-white uppercase">${ev.snap_identificacion || 'Silo'}</div>
                          <div class="text-gray-500 mt-4 flex items-center gap-4 font-700">
                            ${Icons.calendar()} ${this._fmtFecha(ev.fecha)} · <span style="color:${badgeColor}; font-weight:800;">${labelMov}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-10">
                          <span class="badge badge-sm font-bold" style="background:${badgeColor}10; color:${badgeColor}; border:1px solid ${badgeColor}30;">
                            ${esCompra ? '+' : '-'}${ev.valor_neto.toLocaleString()} kg
                          </span>
                          <button class="btn btn-danger btn-sm" style="padding:4px 8px;" onclick="ExplotacionView._eliminarMovimientoAlmacen(${ev.id})">${Icons.eliminar()}</button>
                        </div>
                      </div>
                    </div>`;
                }).join('')
              : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin movimientos registrados</span></div>`
            }
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  },

  async _eliminarGasto(id) {
    if (!await Confirm.confirm("Eliminar Gasto", "¿Deseas eliminar este registro de gasto definitivamente?", true)) return;
    try {
      await window.db.delete('gastos_ganaderia', Number(id));
      App.toast("🗑️ Gasto eliminado");
      this.render();
    } catch (e) { App.toastError("Error al eliminar gasto: " + e.message); }
  },

  async _eliminarMovimientoAlmacen(id) {
    if (!await Confirm.confirm("Eliminar Movimiento", "¿Deseas eliminar este movimiento de silo definitivamente?", true)) return;
    try {
      await window.db.delete('registro_eventos', Number(id));
      App.toast("🗑️ Movimiento de almacén eliminado");
      this.render();
    } catch (e) { App.toastError("Error al eliminar movimiento: " + e.message); }
  }
};

window.ExplotacionView = ExplotacionView;


