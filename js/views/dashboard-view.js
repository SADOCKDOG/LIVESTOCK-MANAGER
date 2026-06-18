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
    // Skeleton loading inmediato
    main.innerHTML = this._buildSkeleton();

    const finca = await CacheService.getOrFetch('finca_active', () => Fincas.getActive(), 30000);
    const rebanos = await CacheService.getOrFetch('rebanos_all', () => Rebanos.list(), 10000);
    const animales = await CacheService.getOrFetch('animales_all', () => Animales.list(), 10000);
    const rent = await CacheService.getOrFetch('analitica_' + finca.id, () => Analitica.obtenerRentabilidadFinca(finca.id), 60000);

    // Alertas desde el servicio centralizado
    const alertas = window.AlertasService ? await window.AlertasService.getAll() : { sanitarias: [], trazabilidad: [], administrativas: [], calendario: null };
    const alertasSanitarias = alertas.sanitarias || [];
    const alertasTrazabilidad = alertas.trazabilidad || [];
    const alertasAdministrativas = alertas.administrativas || [];
    const alertaEpoca = alertas.calendario || { titulo: '📅 Calendario', sugerencias: [] };

    const kpisDiarios = await this._calcularKPIsDiarios(finca, rebanos, animales);

    main.innerHTML = this._buildHTML(finca, rebanos, animales, rent, alertasSanitarias, alertasTrazabilidad, alertasAdministrativas, alertaEpoca, kpisDiarios);

    // Suscripción en vivo a cambios de alertas
    this._suscribirAlertasVivo();
  },

  _buildSkeleton() {
    return `
      <div style="padding:10px 0;">
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

  _buildHTML(finca, rebanos, animales, rent, alertasSanitarias, alertasTrazabilidad, alertasAdministrativas, alertaEpoca, kpisDiarios) {
    return `
      <!-- Resumen -->
      <div class="card card-accent mt-10">
        <h3 class="text-center text-white text-2xl mb-20">Resumen Ganadero</h3>
        <div class="summary-table-grid">
          <div class="summary-cell c-bo"><div class="s-lbl">ZONAS</div><div class="s-val">${(finca.zonas || []).length}</div></div>
          <div class="summary-cell c-1a"><div class="s-lbl">REBAÑOS</div><div class="s-val">${rebanos.length}</div></div>
          <div class="summary-cell c-bo"><div class="s-lbl">ANIMALES</div><div class="s-val">${animales.length}</div></div>
        </div>
      </div>

      ${this._renderKPIsDiariosCard(kpisDiarios)}
      <div id="dash-alertas-container">
        ${this._renderAlertasSanitarias(alertasSanitarias)}
        ${this._renderAlertasTrazabilidad(alertasTrazabilidad)}
        ${this._renderAlertasAdministrativas(alertasAdministrativas)}
      </div>

      <!-- Calendario Preventivo -->
      <div class="card card-accent card-accent-blue p-20" style="background:rgba(59,130,246,0.05);">
        <h3 class="mt-0 text-blue flex items-center gap-8"><span>📅</span> Calendario Preventivo</h3>
        <div class="mt-10">
          <div class="text-white font-bold text-lg mb-8">${alertaEpoca.titulo}</div>
          <ul class="text-85 text-gray m-0 leading-normal" style="padding-left:20px;">
            ${alertaEpoca.sugerencias.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Balance Económico -->
      <div class="card card-accent card-accent-green p-20">
        <h3 class="mt-0 text-green">Balance Económico Est.</h3>
        <div class="flex justify-between items-center">
          <div>
            <div class="text-xs text-999">Beneficio Neto</div>
            <div style="font-size:1.8rem; font-weight:bold; color:${rent.balance >= 0 ? '#10b981' : '#ef4444'};">
              ${rent.balance.toLocaleString('es-ES')} €
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray">Ingresos: ${rent.ingresos.toLocaleString()}€</div>
            <div class="text-xs text-gray">Gastos: ${rent.gastos.toLocaleString()}€</div>
          </div>
        </div>
      </div>

      ${this._renderIndicadoresLacteos(finca)}
    `;
  },

  _renderAlertasSanitarias(alertas) {
    if (!alertas.length) return '';
    return `
      <div class="card card-accent card-accent-red p-20" style="background:rgba(239,68,68,0.05);">
        <h3 class="mt-0 text-red flex items-center gap-8">
          <span>⚠️</span> Alertas Sanitarias <span class="badge rounded-xl text-white text-2xs" style="background:#ef4444; padding:2px 10px;">${alertas.length}</span>
        </h3>
        <div class="flex flex-column gap-10 mt-15">
          ${alertas.slice(0, 3).map(a => `
            <div class="info-box" style="border-left:3px solid ${a.urgencia === 'rojo' ? '#ef4444' : '#f59e0b'};">
              <div class="flex justify-between items-start">
                <div>
                  <div class="text-white font-bold text-base">${a.medicamento}</div>
                  <div class="text-gray text-xs mt-4">📦 ${a.rebanoNombre || 'Rebaño desconocido'}</div>
                </div>
                <div class="text-right">
                  <div class="text-red font-black text-lg">${a.diasRestantes}d</div>
                  <div class="text-gray-500 text-xs uppercase">Supresión</div>
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
      <div class="card card-accent p-20" style="background:rgba(249,115,22,0.05); border-top-color:#f97316;">
        <h3 class="mt-0 flex items-center gap-8 text-orange">
          <span>⚠️</span> Alertas Trazabilidad (SIA) <span class="badge rounded-xl text-white text-2xs" style="background:#f97316; padding:2px 10px;">${alertas.length}</span>
        </h3>
        <div class="flex flex-column gap-10 mt-15">
          ${alertas.slice(0, 3).map(a => `
            <div class="info-box" style="border-left:3px solid ${a.urgencia === 'rojo' ? '#ef4444' : '#f59e0b'};">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-white font-bold text-base">${a.crotal}</div>
                  <div class="text-gray text-xs mt-4">${a.mensaje}</div>
                </div>
                <div class="text-xl">${a.urgencia === 'rojo' ? '🚨' : '⏳'}</div>
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
      <div class="card card-accent card-accent-purple p-20" style="background:rgba(139,92,246,0.05);">
        <h3 class="mt-0 text-purple flex items-center gap-8">
          <span>📋</span> Gestión / PAC <span class="badge rounded-xl text-white text-2xs" style="background:#8b5cf6; padding:2px 10px;">${alertas.length}</span>
        </h3>
        <div class="flex flex-column gap-10 mt-15">
          ${alertas.slice(0, 4).map(a => {
            const icono = a.seccion === 'contrato_lacteo' ? '📄' : a.seccion === 'infolac' ? '📊' : a.seccion === 'pac' ? '🌾' : a.seccion === 'adsg' ? '🛡️' : '📌';
            return `
            <div class="info-box" style="border-left:3px solid ${a.urgencia === 'rojo' ? '#ef4444' : a.urgencia === 'amarillo' ? '#f59e0b' : '#22c55e'};">
              <div class="flex justify-between items-start">
                <div>
                  <div class="text-white font-bold text-base">${icono} ${a.mensaje}</div>
                  ${a.accion ? `<div class="text-violet text-xs mt-4">💡 ${a.accion}</div>` : ''}
                </div>
                ${a.diasRestantes != null ? `<div class="text-right">
                  <div class="text-red font-black text-lg">${a.diasRestantes}d</div>
                  <div class="text-gray-500 text-xs uppercase">Restantes</div>
                </div>` : `<div class="text-xl">${a.urgencia === 'rojo' ? '🚨' : '⏳'}</div>`}
              </div>
            </div>`;
          }).join('')}
          ${alertas.length > 4 ? `<div class="text-center text-gray text-xs mt-5">+${alertas.length - 4} alertas más</div>` : ''}
        </div>
      </div>`;
  },

  /**
   * Indicadores Lácteos — MOFA mensual, precio medio, extracto seco medio
   */
  async _renderIndicadoresLacteos(finca) {
    try {
      const fincaId = finca.id;
      if (!fincaId) return '';
      const entregas = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []);
      if (!entregas.length) return '';

      // Últimos 12 meses
      const ahora = new Date();
      const doceMeses = new Date(ahora);
      doceMeses.setMonth(doceMeses.getMonth() - 12);
      const recientes = entregas.filter(e => new Date(e.fechaRecogida) >= doceMeses);

      if (!recientes.length) return '';

      const numEntregas = recientes.length;
      const litrosTotal = recientes.reduce((s, e) => s + (e.cantidad || 0), 0);
      const precioFinalMedio = numEntregas > 0 ? recientes.reduce((s, e) => s + (e.precio_final_unitario || e.precioBase || 0), 0) / numEntregas : 0;
      const importeTotal = recientes.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
      const mofaTotal = recientes.reduce((s, e) => s + (e.mofa || 0), 0);
      const mofaRatio = importeTotal > 0 ? (mofaTotal / importeTotal) * 100 : 0;

      const conLab = recientes.filter(e => e.laboratorio?.grasa != null);
      const esTotal = conLab.reduce((s, e) => {
        const es = e.laboratorio.extracto_seco || (e.laboratorio.grasa || 0) + (e.laboratorio.proteina || 0);
        return s + es;
      }, 0);
      const esMedia = conLab.length > 0 ? esTotal / conLab.length : 0;

      return `
        <div class="card card-accent card-accent-amber p-20" style="background:rgba(245,158,11,0.05);">
          <h3 class="mt-0 flex items-center gap-8 text-yellow">
            <span>🥛</span> Indicadores Lácteos <span class="text-xs text-gray font-normal">(últimos 12 meses)</span>
          </h3>
          <div class="grid grid-cols-3 gap-10 mt-15">
            <div class="info-box border-left-amber">
              <div class="kpi-label">MOFA Mensual</div>
              <div class="text-2xl font-black" style="color:${mofaRatio >= 20 ? '#10b981' : '#f59e0b'};">${Math.round(mofaTotal / Math.max(1, Math.round((ahora - doceMeses) / 2629800000))).toLocaleString()} €
              </div>
              <div class="kpi-sub">${mofaRatio.toFixed(1)}% sobre ingresos</div>
            </div>
            <div class="info-box border-left-blue">
              <div class="kpi-label">Precio Medio</div>
              <div class="text-white font-black text-2xl">
                ${precioFinalMedio.toFixed(3)} €/L
              </div>
              <div class="kpi-sub">${(litrosTotal / Math.max(1, numEntregas)).toFixed(0)} L/entrega</div>
            </div>
            <div class="info-box border-left-purple">
              <div class="kpi-label">Extracto Seco Medio</div>
              <div class="text-white font-black text-2xl">
                ${esMedia.toFixed(2)}%
              </div>
              <div class="kpi-sub">${conLab.length} analíticas · ${litrosTotal.toLocaleString()} L total</div>
            </div>
          </div>
          <div class="text-center mt-12">
            <a href="#/leche" class="text-gold no-underline text-sm font-bold">
              Ver Control Lechero Detallado →
            </a>
          </div>
        </div>`;
    } catch (e) {
      console.warn('[Dashboard] Error cargando indicadores lácteos:', e);
      return '';
    }
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
        <div class="card card-accent card-accent-purple p-20" style="background:rgba(168,85,247,0.05);">
          <h3 class="mt-0 flex items-center gap-8 text-violet">
            <span>📊</span> KPIs Diarios
          </h3>
          <div class="empty-state" style="padding:15px;">
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
      <div class="card card-accent card-accent-purple p-20" style="background:rgba(168,85,247,0.05);">
        <h3 class="mt-0 flex items-center gap-8 text-violet">
          <span>📊</span> KPIs Diarios <span class="text-xs text-gray font-normal">(últimos 7-30 días)</span>
        </h3>
        <div class="grid grid-cols-3 gap-10 mt-15">

          <div class="info-box" style="border-left:3px solid ${kpiColor};">
            <div class="kpi-label">🐑 Litros/Oveja/Día</div>
            <div class="text-2xl font-black" style="color:${kpiColor};">
              ${litrosPorOveja != null ? litrosPorOveja.toFixed(2) : '—'}
            </div>
            <div class="kpi-sub">
              ${totalHembras} ♀ activas · ${litros7d.toFixed(0)} L/7d
              ${litrosPorOveja != null && litrosPorOveja < 1.0 ? '<span class="text-amber"> · bajo</span>' : ''}
              ${litrosPorOveja != null && litrosPorOveja >= 1.5 ? '<span class="text-green"> · óptimo ✓</span>' : ''}
            </div>
          </div>

          <div class="info-box" style="border-left:3px solid ${piensoColor};">
            <div class="kpi-label">🌾 Eficiencia Pienso</div>
            <div class="text-2xl font-black" style="color:${piensoColor};">
              ${eficienciaPienso != null ? eficienciaPienso.toLocaleString() + ' g/L' : '—'}
            </div>
            <div class="kpi-sub">
              ${eficienciaPienso != null ? (eficienciaPienso <= 600 ? 'Excelente ✓' : eficienciaPienso <= 900 ? 'Revisar ⚠️' : 'Alto 🔴') : 'Sin datos de alimentación'}
            </div>
          </div>

          <div class="info-box" style="border-left:3px solid ${bajasColor};">
            <div class="kpi-label">💊 % Bajas/Mamitis</div>
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
