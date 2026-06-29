/**
 * Livestock Manager - DashboardView v1.0.0
 * Vista principal del Dashboard extraída de App.js para modularización.
 * Utiliza EventBus, CacheService y AlertasService.
 */

const DashboardView = {
  /**
   * Renderizar el dashboard completo
   */
  async render() {
    const main = document.getElementById('app-content');
    main.innerHTML = this._buildSkeleton();

    const finca = await CacheService.getOrFetch('finca_active', () => Fincas.getActive(), 30000);
    const rebanos = await CacheService.getOrFetch('rebanos_all', () => Rebanos.list(), 10000);
    const animales = await CacheService.getOrFetch('animales_all', () => Animales.list(), 10000);
    const rent = await CacheService.getOrFetch('analitica_' + finca.id, () => Analitica.obtenerRentabilidadFinca(finca.id), 60000);
    const censo = await Analitica.obtenerCensoRebanos(finca.id).catch(() => []);

    const alertas = window.AlertasService ? await window.AlertasService.getAll() : { sanitarias: [], trazabilidad: [], administrativas: [], calendario: null };
    const alertasSanitarias = alertas.sanitarias || [];
    const alertasTrazabilidad = alertas.trazabilidad || [];
    const alertasAdministrativas = alertas.administrativas || [];
    const alertaEpoca = alertas.calendario || { titulo: 'Calendario Preventivo', sugerencias: [] };

    const kpisDiarios = await this._calcularKPIsDiarios(finca, rebanos, animales);
    const indicadoresLeche = await this._calcularIndicadoresLacteos(finca);

    main.innerHTML = await this._buildHTML(finca, rebanos, animales, rent, censo, alertasSanitarias, alertasTrazabilidad, alertasAdministrativas, alertaEpoca, kpisDiarios, indicadoresLeche);

    this._suscribirAlertasVivo();
  },

  _buildSkeleton() {
    return `
      <div class="py-10">
        <div class="skeleton-card mb-25">
          <div class="skeleton-title" style="width:50%; margin:0 auto 20px;"></div>
          <div class="grid grid-cols-3 gap-12">
            <div class="skeleton" style="height:60px;"></div>
            <div class="skeleton" style="height:60px;"></div>
            <div class="skeleton" style="height:60px;"></div>
          </div>
        </div>
        <div class="skeleton-card mb-20">
          <div class="skeleton-title" style="width:40%; margin-bottom:15px;"></div>
          <div class="grid grid-cols-3 gap-8">
            <div class="skeleton rounded-sm" style="height:52px;"></div>
            <div class="skeleton rounded-sm" style="height:52px;"></div>
            <div class="skeleton rounded-sm" style="height:52px;"></div>
          </div>
        </div>
        <div class="skeleton-card mb-20">
          <div class="skeleton-title" style="width:35%; margin-bottom:12px;"></div>
          <div class="skeleton-line w-full mb-10"></div>
          <div class="skeleton-line" style="width:90%; margin-bottom:10px;"></div>
          <div class="skeleton-line" style="width:75%;"></div>
        </div>
        <div class="skeleton-card mb-25">
          <div class="skeleton-title" style="width:45%; margin-bottom:12px;"></div>
          <div class="skeleton-line w-full mb-8"></div>
          <div class="skeleton-line" style="width:80%; margin-bottom:8px;"></div>
          <div class="skeleton-line" style="width:60%;"></div>
        </div>
        <div class="skeleton-card">
          <div class="skeleton-title" style="width:35%; margin-bottom:15px;"></div>
          <div class="flex justify-between">
            <div class="flex-1">
              <div class="skeleton-line" style="width:60%; margin-bottom:8px;"></div>
              <div class="skeleton rounded-sm" style="height:32px; width:55%;"></div>
            </div>
            <div class="flex-1 text-right">
              <div class="skeleton-line" style="width:50%; margin-bottom:8px; margin-left:auto;"></div>
              <div class="skeleton-line" style="width:40%; margin-left:auto;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _suscribirAlertasVivo() {
    if (this._unsuscribeAlertas) this._unsuscribeAlertas();
    if (!window.EventBus) return;
    this._unsuscribeAlertas = window.EventBus.on('alertas:updated', (alertas) => {
      const c = document.getElementById('dash-alertas-container');
      if (!c) return;
      c.innerHTML = ''
        + (alertas?.sanitarias?.length ? this._renderAlertasSanitarias(alertas.sanitarias) : '')
        + (alertas?.trazabilidad?.length ? this._renderAlertasTrazabilidad(alertas.trazabilidad) : '')
        + (alertas?.administrativas?.length ? this._renderAlertasAdministrativas(alertas.administrativas) : '');
    });
  },

  async _buildHTML(finca, rebanos, animales, rent, censo, alertasSanitarias, alertasTrazabilidad, alertasAdministrativas, alertaEpoca, kpisDiarios, indicadoresLeche) {
    const activos = animales.filter(a => a.estado === 'activo').length;
    const balanceTotal = rent?.balance || 0;
    const pctRent = rent?.ingresos > 0 ? ((balanceTotal / rent.ingresos) * 100).toFixed(1) : '0.0';
    const totalCenso = censo.reduce((s, r) => s + r.total, 0);
    const totalActivos = censo.reduce((s, r) => s + r.activos, 0);
    const totalVendidos = censo.reduce((s, r) => s + r.vendidos, 0);

    const modoAuto = (() => {
      let tieneCarne = false, tieneLeche = false, tieneHibrido = false;
      rebanos.forEach(r => {
        const tipo = (r.tipo || '').toLowerCase();
        if (tipo.includes('carne') || tipo.includes('cárn')) tieneCarne = true;
        else if (tipo.includes('leche') || tipo.includes('láct')) tieneLeche = true;
        else if (tipo.includes('mixt') || tipo.includes('híbr') || tipo.includes('doble')) tieneHibrido = true;
      });
      if (tieneHibrido || (tieneCarne && tieneLeche)) return 'hibrido';
      if (tieneLeche) return 'leche';
      return 'carne';
    })();
    const modoColor = modoAuto === 'carne' ? '#ef4444' : modoAuto === 'leche' ? '#3b82f6' : '#10b981';
    const modoLabel = modoAuto === 'hibrido' ? 'Híbrido' : modoAuto === 'leche' ? 'Leche' : 'Carne';
    const modoIcon = modoAuto === 'hibrido' ? Icons.rotacion() : modoAuto === 'leche' ? Icons.leche() : Icons.carne();

    return `
      <!-- Resumen General -->
      <div class="card p-12 mb-14 border-222 card-total-3d" style="border-top:5px solid var(--p-gold); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6">${Icons.finca()} ${finca.nombre || 'RESUMEN GANADERO'}</div>
        <div class="grid grid-cols-3 gap-6">
          <div class="bg-black rounded-lg p-8 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider flex items-center gap-3 justify-center mb-4">${Icons.zonas()} ZONAS</div>
            <div class="text-xl font-black text-gold">${(finca.zonas || []).length}</div>
          </div>
          <div class="bg-black rounded-lg p-8 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider flex items-center gap-3 justify-center mb-4">${Icons.rebanos()} REBAÑOS</div>
            <div class="text-xl font-black text-gold">${rebanos.length}</div>
          </div>
          <div class="bg-black rounded-lg p-8 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider flex items-center gap-3 justify-center mb-4">${Icons.animales()} CENSO</div>
            <div class="text-xl font-black text-gold">${totalCenso || animales.length}</div>
          </div>
          <div class="bg-black rounded-lg p-8 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider flex items-center gap-3 justify-center mb-4">${Icons.check()} ACTIVOS</div>
            <div class="text-xl font-black text-green">${totalActivos || activos}</div>
          </div>
          <div class="bg-black rounded-lg p-8 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider flex items-center gap-3 justify-center mb-4">${Icons.paquete()} VENDIDOS</div>
            <div class="text-xl font-black text-red">${totalVendidos}</div>
          </div>
          <div class="bg-black rounded-lg p-8 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider flex items-center gap-3 justify-center mb-4">${Icons.grafico()} RENTAB.</div>
            <div class="text-xl font-black ${parseFloat(pctRent) > 0 ? 'text-green' : 'text-red'}">${pctRent}%</div>
          </div>
        </div>
      </div>

      ${this._renderKPIsDiariosCard(kpisDiarios)}

      <!-- Alertas -->
      <div id="dash-alertas-container">
        ${this._renderAlertasSanitarias(alertasSanitarias)}
        ${this._renderAlertasTrazabilidad(alertasTrazabilidad)}
        ${this._renderAlertasAdministrativas(alertasAdministrativas)}
      </div>

      <!-- Balance Económico -->
      <div class="card p-12 mb-14 border-222 card-total-3d" style="border-top:5px solid var(--c-success); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6">${Icons.dinero()} BALANCE ECONÓMICO</div>
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div class="bg-black rounded-lg p-10 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider mb-4">INGRESOS</div>
            <div class="text-xl font-black text-amber">${(rent?.ingresos || 0).toLocaleString()}€</div>
          </div>
          <div class="bg-black rounded-lg p-10 text-center border border-222">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider mb-4">GASTOS</div>
            <div class="text-xl font-black text-red">${(rent?.gastos || 0).toLocaleString()}€</div>
          </div>
        </div>
        <div class="flex justify-between items-center p-10 bg-black rounded-lg border border-222">
          <div>
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider">Beneficio Neto</div>
            <div class="text-lg font-black ${balanceTotal >= 0 ? 'text-green' : 'text-red'}">${balanceTotal.toLocaleString()} €</div>
          </div>
          <div class="text-right">
            <div class="text-[0.55rem] text-gray uppercase font-800 tracking-wider">Rentabilidad</div>
            <div class="text-lg font-black ${parseFloat(pctRent) > 0 ? 'text-green' : 'text-red'}">${pctRent}%</div>
          </div>
        </div>
        <div class="text-center mt-8">
          <a href="#/informes" class="text-green no-underline text-xs font-900 uppercase tracking-wider">Ver Informes Detallados ${Icons.siguiente()}</a>
        </div>
      </div>

      ${this._renderIndicadoresLacteos(indicadoresLeche)}

      <!-- Calendario Preventivo -->
      <div class="card p-12 mb-14 border-222 card-total-3d" style="border-top:5px solid var(--c-info); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6">${Icons.calendar()} ${(alertaEpoca.titulo || 'Calendario Preventivo').replace(/^[^\w\s]+\s*/u, '')}</div>
        ${alertaEpoca.sugerencias?.length > 0 ? `
        <ul class="text-xs text-gray m-0 leading-relaxed mt-6 pl-16">
          ${alertaEpoca.sugerencias.map(s => `<li class="mb-3">${s}</li>`).join('')}
        </ul>` : '<div class="text-xs text-gray mt-6">Sin sugerencias para esta temporada.</div>'}
        <div class="text-center mt-8">
          <a href="#/informes?tab=alertas" class="text-blue no-underline text-xs font-900 uppercase tracking-wider">Ver Alertas Completas ${Icons.siguiente()}</a>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="card p-12 mb-14 border-222 card-total-3d" style="border-top:5px solid var(--p-gold); width:100%;">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center gap-6">${Icons.rayo()} ACCESOS RÁPIDOS</div>
        <div class="grid grid-cols-2 gap-8">
          <a href="#/animales" class="widget-link-btn widget-link-btn--neon neon-danger">
            ${Icons.animales()}
            <span class="widget-link-label">Animales</span>
          </a>
          <a href="#/rebanos" class="widget-link-btn widget-link-btn--neon neon-info">
            ${Icons.rebanos()}
            <span class="widget-link-label">Rebaños</span>
          </a>
          <a href="#/${modoAuto}" class="widget-link-btn widget-link-btn--neon" style="--neon-color:${modoColor};--neon-glow:${modoColor}B0;--neon-inner:${modoColor}40;">
            ${modoIcon}
            <span class="widget-link-label">${modoLabel}</span>
          </a>
          <a href="#/informes" class="widget-link-btn widget-link-btn--neon neon-success">
            ${Icons.tendencia()}
            <span class="widget-link-label">Informes</span>
          </a>
        </div>
      </div>
    `;
  },

  _renderAlertasSanitarias(alertas) {
    if (!alertas.length) return '';
    return `
      <div class="card card-accent card-accent-red p-20 card-tint-red">
        <h3 class="mt-0 text-red flex items-center gap-8">
          ${Icons.alerta()} Alertas Sanitarias <span class="badge rounded-xl badge-solid-danger">${alertas.length}</span>
        </h3>
        <div class="flex flex-column gap-10 mt-15">
          ${alertas.slice(0, 3).map(a => `
            <div class="info-box border-left-${a.urgencia === 'rojo' ? 'red' : 'amber'}">
              <div class="flex justify-between items-start">
                <div>
                  <div class="text-white font-bold text-base uppercase">${a.medicamento}</div>
                  <div class="text-gray text-[0.6rem] mt-4 uppercase font-800 tracking-wider">${Icons.paquete()} ${a.rebanoNombre || 'Lote desconocido'}</div>
                </div>
                <div class="text-right">
                  <div class="text-red font-950 text-xl">${a.diasRestantes}D</div>
                  <div class="text-gray-500 text-[0.55rem] uppercase font-900 tracking-widest">Supresión</div>
                </div>
              </div>
            </div>
          `).join('')}
          ${alertas.length > 3 ? `<div class="text-center text-gray text-xs mt-5">+${alertas.length - 3} alertas más activas</div>` : ''}
        </div>
      </div>`;
  },

  _renderAlertasTrazabilidad(alertas) {
    if (!alertas.length) return '';
    return `
      <div class="card card-accent card-accent-orange p-20 card-tint-orange">
        <h3 class="mt-0 flex items-center gap-8 text-orange">
          ${Icons.alerta()} Alertas Trazabilidad (SIA) <span class="badge rounded-xl badge-solid-orange">${alertas.length}</span>
        </h3>
        <div class="flex flex-column gap-10 mt-15">
          ${alertas.slice(0, 3).map(a => `
            <div class="info-box border-left-${a.urgencia === 'rojo' ? 'red' : 'amber'}">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-white font-950 text-base uppercase tracking-tight">${a.crotal}</div>
                  <div class="text-gray text-[0.6rem] mt-4 uppercase font-800 tracking-wider">${a.mensaje}</div>
                </div>
                <div class="text-xl" style="color:${a.urgencia === 'rojo' ? '#ef4444' : '#f59e0b'}">${a.urgencia === 'rojo' ? Icons.alerta() : Icons.calendar()}</div>
              </div>
            </div>
          `).join('')}
          ${alertas.length > 3 ? `<div class="text-center text-gray text-xs mt-5">+${alertas.length - 3} alertas más</div>` : ''}
        </div>
      </div>`;
  },

  _renderAlertasAdministrativas(alertas) {
    if (!alertas.length) return '';
    return `
      <div class="card card-accent card-accent-purple p-20 card-tint-violet">
        <h3 class="mt-0 text-purple flex items-center gap-8">
          ${Icons.documento()} Gestión / PAC <span class="badge rounded-xl badge-solid-purple">${alertas.length}</span>
        </h3>
        <div class="flex flex-column gap-10 mt-15">
          ${alertas.slice(0, 4).map(a => {
            let iconoSVG = Icons.info();
            if (a.seccion === 'contrato_lacteo') iconoSVG = Icons.contratos();
            else if (a.seccion === 'infolac') iconoSVG = Icons.grafico();
            else if (a.seccion === 'pac') iconoSVG = Icons.pac();
            else if (a.seccion === 'adsg') iconoSVG = Icons.veterinario();

            return `
            <div class="info-box border-left-${a.urgencia === 'rojo' ? 'red' : a.urgencia === 'amarillo' ? 'amber' : 'green'}">
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-8">
                  <span class="text-purple">${iconoSVG}</span>
                  <div>
                    <div class="text-white font-bold text-base uppercase">${a.mensaje}</div>
                    ${a.accion ? `<div class="text-violet text-[0.65rem] mt-4 uppercase font-800 tracking-wider flex items-center gap-4">${Icons.info()} ${a.accion}</div>` : ''}
                  </div>
                </div>
                ${a.diasRestantes != null ? `<div class="text-right">
                  <div class="text-red font-950 text-xl">${a.diasRestantes}D</div>
                  <div class="text-gray-500 text-[0.55rem] uppercase font-900 tracking-widest">Restantes</div>
                </div>` : `<div class="text-xl" style="color:${a.urgencia === 'rojo' ? '#ef4444' : '#f59e0b'}">${a.urgencia === 'rojo' ? Icons.alerta() : Icons.calendar()}</div>`}
              </div>
            </div>`;
          }).join('')}
          ${alertas.length > 4 ? `<div class="text-center text-gray text-xs mt-5">+${alertas.length - 4} alertas más</div>` : ''}
        </div>
      </div>`;
  },

  /**
   * Calcula indicadores lácteos (separado del render para evitar [object Promise])
   */
  async _calcularIndicadoresLacteos(finca) {
    try {
      const fincaId = finca?.id;
      if (!fincaId) return null;
      const entregas = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []);
      if (!entregas.length) return null;
      const ahora = new Date();
      const doceMeses = new Date(ahora);
      doceMeses.setMonth(doceMeses.getMonth() - 12);
      const recientes = entregas.filter(e => new Date(e.fechaRecogida) >= doceMeses);
      if (!recientes.length) return null;
      const numEntregas = recientes.length;
      const litrosTotal = recientes.reduce((s, e) => s + (e.cantidad || 0), 0);
      const precioFinalMedio = numEntregas > 0 ? recientes.reduce((s, e) => s + (e.precio_final_unitario || e.precioBase || 0), 0) / numEntregas : 0;
      const importeTotal = recientes.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
      const mofaTotal = recientes.reduce((s, e) => s + (e.mofa || 0), 0);
      const mofaRatio = importeTotal > 0 ? (mofaTotal / importeTotal) * 100 : 0;
      const conLab = recientes.filter(e => e.laboratorio?.grasa != null);
      const esTotal = conLab.reduce((s, e) => s + (e.laboratorio.extracto_seco || (e.laboratorio.grasa || 0) + (e.laboratorio.proteina || 0)), 0);
      const esMedia = conLab.length > 0 ? esTotal / conLab.length : 0;
      return { numEntregas, litrosTotal, precioFinalMedio, importeTotal, mofaTotal, mofaRatio, conLab, esMedia, meses: Math.max(1, Math.round((ahora - doceMeses) / 2629800000)) };
    } catch (e) { console.warn('[Dashboard] Error indicadores lácteos:', e); return null; }
  },

  /**
   * Renderiza indicadores lácteos desde datos pre-calculados
   */
  _renderIndicadoresLacteos(indicadores) {
    if (!indicadores) return '';
    const { numEntregas, litrosTotal, precioFinalMedio, mofaTotal, mofaRatio, conLab, esMedia, meses } = indicadores;
    return `
      <div class="card card-accent card-accent-amber p-20 card-tint-amber">
        <h3 class="mt-0 flex items-center gap-8 text-yellow">
          ${Icons.leche()} Indicadores Lácteos <span class="text-xs text-gray font-normal">(últimos 12 meses)</span>
        </h3>
        <div class="hscroll-cards">
          <div class="info-box border-left-amber kpi-card-fixed min-w-0">
            <div class="kpi-label">MOFA Mensual</div>
            <div class="text-xl sm:text-2xl font-black ${mofaRatio >= 20 ? 'text-green' : 'text-amber'} truncate" title="${Math.round(mofaTotal / meses).toLocaleString()} €">${Math.round(mofaTotal / meses).toLocaleString()} €</div>
            <div class="kpi-sub">${mofaRatio.toFixed(1)}% ingresos</div>
          </div>
          <div class="info-box border-left-blue kpi-card-fixed min-w-0">
            <div class="kpi-label">Precio Medio</div>
            <div class="text-white font-black text-xl sm:text-2xl truncate" title="${precioFinalMedio.toFixed(3)} €/L">${precioFinalMedio.toFixed(3)} €/L</div>
            <div class="kpi-sub">${(litrosTotal / Math.max(1, numEntregas)).toFixed(0)} L/entrega</div>
          </div>
          <div class="info-box border-left-purple kpi-card-fixed min-w-0">
            <div class="kpi-label">Extracto Seco</div>
            <div class="text-white font-black text-xl sm:text-2xl truncate" title="${esMedia.toFixed(2)}%">${esMedia.toFixed(2)}%</div>
            <div class="kpi-sub">${conLab.length} analíticas · ${litrosTotal.toLocaleString()} L</div>
          </div>
        </div>
        <div class="text-center mt-12">
          <a href="#/leche" class="text-gold no-underline text-sm font-bold">Ver Control Lechero Detallado →</a>
        </div>
      </div>`;
  },

  /**
   * Calcula los KPIs diarios de producción:
   * 1. Media litros/oveja/día
   * 2. Eficiencia del pienso (g/L)
   * 3. % bajas y mamitis
   */
  async _calcularKPIsDiarios(finca, rebanos, animales) {
    const vacio = { litrosPorOveja: null, eficienciaPienso: null, pctBajas: null };
    try {
      const fincaId = finca.id;
      if (!fincaId) return vacio;

      // ── Hembras activas en especies lecheras ──
      const hembras = animales.filter(a =>
        a.estado === 'activo' &&
        a.sexo === 'H' &&
        ['Vacas', 'Ovejas', 'Cabras'].includes(a.especie)
      );
      const totalHembras = hembras.length;
      if (!totalHembras) return vacio;

      // ── Leche últimos 7 días (tanque) ──
      const entregas = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []);
      const hoy = new Date();
      const hace7d = new Date(hoy); hace7d.setDate(hace7d.getDate() - 7);
      const hace30d = new Date(hoy); hace30d.setDate(hace30d.getDate() - 30);

      const ult7d = entregas.filter(e => new Date(e.fechaRecogida) >= hace7d);
      const ult30d = entregas.filter(e => new Date(e.fechaRecogida) >= hace30d);

      const litros7d = ult7d.reduce((s, e) => s + (e.cantidad || 0), 0);
      const litros30d = ult30d.reduce((s, e) => s + (e.cantidad || 0), 0);

      // 1. Media litros/oveja/día
      const mediaDiaria = litros7d > 0
        ? (litros7d / 7 / totalHembras)
        : null;

      // 2. Eficiencia del pienso (g de pienso / L de leche)
      // Asumimos precio medio pienso ~0,30 €/kg
      const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []);
      const gastos30d = gastos.filter(g =>
        g.categoria === 'Alimentacion' && new Date(g.fecha) >= hace30d
      );
      const costeAlim30d = gastos30d.reduce((s, g) => s + (g.monto || 0), 0);
      const PRECIO_PIENSO_REF = 0.30; // €/kg estimado
      const kgPienso = costeAlim30d > 0 ? costeAlim30d / PRECIO_PIENSO_REF : 0;
      const eficiencia = litros30d > 0 && kgPienso > 0
        ? Math.round((kgPienso * 1000) / litros30d) // gramos por litro
        : null;

      // 3. % bajas y mamitis
      const sanitarios = await window.db.getAllFromIndex('sanitarios_ganado', 'rebanoId', 0).catch(() => []);
      // sanidad no tiene índice por finca, así que obtenemos por rebaño
      const rebanosFinca = rebanos.filter(r => r.fincaId === fincaId || !r.fincaId);
      let tratamientosMamitis = 0;
      for (const r of rebanosFinca) {
        try {
          const regs = await window.db.getAllFromIndex('sanitarios_ganado', 'rebanoId', r.id).catch(() => []);
          tratamientosMamitis += regs.filter(s =>
            new Date(s.fecha) >= hace30d &&
            (s.enfermedad || '').toLowerCase().includes('mamitis')
          ).length;
        } catch (_) {}
      }
      const pctBajas = tratamientosMamitis > 0
        ? ((tratamientosMamitis / totalHembras) * 100).toFixed(1)
        : null;

      return { litrosPorOveja: mediaDiaria, eficienciaPienso: eficiencia, pctBajas, totalHembras, litros7d, tratamientosMamitis };
    } catch (e) {
      console.warn('[Dashboard] Error calculando KPIs diarios:', e);
      return vacio;
    }
  },

  _renderKPIsDiariosCard(kpis) {
    if (!kpis || (!kpis.litrosPorOveja && !kpis.eficienciaPienso && !kpis.pctBajas)) {
      return `
        <div class="card card-accent card-accent-purple p-20 card-tint-violet">
          <h3 class="mt-0 flex items-center gap-8 text-violet">
            ${Icons.grafico()} KPIs Diarios
          </h3>
          <div class="empty-state p-15">
            <p class="empty-state-text">No hay suficientes datos para calcular KPIs diarios.</p>
            <p class="text-xs text-gray">Registra entregas de leche y animales para ver métricas.</p>
          </div>
        </div>`;
    }

    const { litrosPorOveja, eficienciaPienso, pctBajas, totalHembras, litros7d, tratamientosMamitis } = kpis;

    const kpiColor = litrosPorOveja != null
      ? (litrosPorOveja >= 1.0 ? '#10b981' : litrosPorOveja >= 0.5 ? '#f59e0b' : '#ef4444')
      : '#888';

    const piensoColor = eficienciaPienso != null
      ? (eficienciaPienso <= 600 ? '#10b981' : eficienciaPienso <= 900 ? '#f59e0b' : '#ef4444')
      : '#888';

    const bajasColor = pctBajas != null
      ? (pctBajas <= 3 ? '#10b981' : pctBajas <= 8 ? '#f59e0b' : '#ef4444')
      : '#888';

    return `
      <div class="card card-accent card-accent-purple p-20 card-tint-violet">
        <h3 class="mt-0 flex items-center gap-8 text-violet">
          ${Icons.grafico()} KPIs Diarios <span class="text-xs text-gray font-normal">(últimos 7-30 días)</span>
        </h3>
        <div class="hscroll-cards">

          <div class="info-box kpi-card-fixed" style="border-left:3px solid ${kpiColor};">
            <div class="kpi-label flex items-center gap-4">${Icons.leche()} L/Oveja/Día</div>
            <div class="text-2xl font-black" style="color:${kpiColor};">
              ${litrosPorOveja != null ? litrosPorOveja.toFixed(2) : '—'}
            </div>
            <div class="kpi-sub uppercase font-800 text-[0.55rem] tracking-tighter">
              ${totalHembras} ♀ · <span class="text-white">${litros7d.toFixed(0)} L/7d</span>
              ${litrosPorOveja != null && litrosPorOveja < 1.0 ? '<span class="text-amber"> · BAJO</span>' : ''}
              ${litrosPorOveja != null && litrosPorOveja >= 1.5 ? `<span class="text-green flex items-center gap-4"> · ÓPTIMO ${Icons.check()}</span>` : ''}
            </div>
          </div>

          <div class="info-box kpi-card-fixed" style="border-left:3px solid ${piensoColor};">
            <div class="kpi-label flex items-center gap-4">${Icons.pac()} Ef. Pienso</div>
            <div class="text-2xl font-black" style="color:${piensoColor};">
              ${eficienciaPienso != null ? eficienciaPienso.toLocaleString() : '—'}
            </div>
            <div class="kpi-sub uppercase font-800 text-[0.55rem] tracking-tighter">
              ${eficienciaPienso != null ? 'g/L · ' + (eficienciaPienso <= 600 ? `<span class="text-green">EXCELENTE ${Icons.check()}</span>` : 'Revisar') : 'Sin datos pienso'}
            </div>
          </div>

          <div class="info-box kpi-card-fixed" style="border-left:3px solid ${bajasColor};">
            <div class="kpi-label flex items-center gap-4">${Icons.sanidad()} % Bajas</div>
            <div class="text-2xl font-black" style="color:${bajasColor};">
              ${pctBajas != null ? pctBajas + '%' : '—'}
            </div>
            <div class="kpi-sub">
              ${tratamientosMamitis > 0 ? tratamientosMamitis + ' trat. últimos 30d' : 'Sin registros sanitarios'}
              ${pctBajas != null && pctBajas > 5 ? '<span class="text-red"> · alerta sanitaria</span>' : ''}
            </div>
          </div>

        </div>
      </div>`;
  }
};

window.DashboardView = DashboardView;
