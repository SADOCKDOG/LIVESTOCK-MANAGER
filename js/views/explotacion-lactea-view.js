/**
 * Dashboard de Explotación Láctea
 * Módulo Lácteo Integral (v24)
 */
window.ExplotacionLacteaView = {
  async render(container) {
    const App = window.App;
    const fincaId = await window.Fincas.getActiveId();
    const finca = await window.Fincas.getActive();

    const tanques = window.TanquesLeche ? await window.BalanceLacteo.getTanqueConStock(fincaId) : [];
    const comercializaciones = await window.db.getAll('comercializacion_leche').catch(() => []);
    const entregasFinca = comercializaciones.filter(c => Number(c.fincaId) === Number(fincaId));

    const hoy = new Date().toISOString().split('T')[0];
    const produccionHoy = window.BalanceLacteo ? await window.BalanceLacteo.getProduccionDiaria(fincaId, hoy) : 0;

    const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30);
    const resumen30 = window.BalanceLacteo ? await window.BalanceLacteo.getResumenPeriodo(fincaId, hace30.toISOString(), new Date().toISOString()) : { totalEntradas: 0, totalSalidas: 0 };

    const alertas = window.MotorLacteo ? await window.MotorLacteo.getAllAlertas(fincaId) : [];
    const alertasDanger = alertas.filter(a => a.nivel === 'DANGER');
    const alertasWarning = alertas.filter(a => a.nivel === 'WARNING');

    let ultimaAnalitica = null;
    if (entregasFinca.length > 0) {
      const conAnalitica = entregasFinca.filter(e => e.laboratorio && (e.laboratorio.grasa || e.laboratorio.germenes));
      if (conAnalitica.length > 0) {
        conAnalitica.sort((a, b) => new Date(b.fechaRecogida) - new Date(a.fechaRecogida));
        ultimaAnalitica = conAnalitica[0];
      }
    }

    const ingresos30 = entregasFinca
      .filter(e => { const f = new Date(e.fechaRecogida); return f >= hace30; })
      .reduce((s, e) => s + (e.importe_total || 0), 0);

    const gastosAlim30 = await (async () => {
      try {
        const gastos = await window.db.getAll('gastos_ganaderia').catch(() => []);
        return gastos
          .filter(g => Number(g.fincaId) === Number(fincaId) && g.categoria === 'Alimentacion' && new Date(g.fecha) >= hace30)
          .reduce((s, g) => s + (g.importe || 0), 0);
      } catch (e) { return 0; }
    })();

    const mofa30 = ingresos30 - gastosAlim30;

    let html = `
    <div class="p-16">
      <div class="flex items-center justify-between mb-16">
        <h2 class="text-lg font-900 uppercase tracking-tight" style="color:var(--c-info);">Explotación Láctea</h2>
        <div class="flex gap-8">
          <button onclick="window.OrdeñoWizard.open()" class="text-xs px-12 py-6 font-900 uppercase" style="background:var(--c-info); color:#000; border:none; border-radius:6px;">+ Ordeño</button>
          <button onclick="window.TanqueWizard.open()" class="btn-secondary text-xs px-12 py-6 font-900 uppercase">+ Tanque</button>
        </div>
      </div>`;

    if (alertasDanger.length > 0) {
      html += `
      <div class="card p-12 mb-12" style="border-left:3px solid var(--c-danger);">
        <div class="text-[0.6rem] font-900 text-red uppercase mb-6">Alertas Críticas</div>
        ${alertasDanger.map(a => `<div class="text-[0.65rem] font-800 text-white mb-4">⚠ ${a.mensaje}</div>`).join('')}
      </div>`;
    }

    html += `<div class="grid grid-cols-1 gap-12 mb-16">`;

    for (const t of tanques) {
      const pct = t.porcentaje_llenado || 0;
      const tempColor = t.temperatura_actual != null ? (t.temperatura_actual <= 4 ? 'var(--c-success)' : (t.temperatura_actual <= 6 ? 'var(--c-warning)' : 'var(--c-danger)')) : 'var(--c-info)';
      html += `
      <div class="card p-14" style="border-left:3px solid var(--c-info);">
        <div class="flex items-center justify-between mb-8">
          <div class="text-sm font-900 uppercase">${t.nombre}</div>
          <div class="text-[0.6rem] font-800" style="color:var(--c-info);">Letra Q: ${t.codigo_letra_q}</div>
        </div>
        <div class="mb-8">
          <div class="flex justify-between text-[0.6rem] font-800 mb-4">
            <span>${t.stock_actual.toLocaleString('es-ES')}L / ${t.capacidad_litros.toLocaleString('es-ES')}L</span>
            <span style="color:${pct > 90 ? 'var(--c-danger)' : 'var(--c-success)'};">${pct}%</span>
          </div>
          <div style="background:var(--c-222); border-radius:4px; height:12px; overflow:hidden;">
            <div style="width:${Math.min(pct, 100)}%; height:100%; background:${pct > 90 ? 'var(--c-danger)' : 'var(--c-info)'}; transition:width 0.3s;"></div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-8 text-center">
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Temp</div>
            <div class="text-xs font-900" style="color:${tempColor};">${t.temperatura_actual != null ? t.temperatura_actual + '°C' : '—'}</div>
          </div>
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Últ. Limpieza</div>
            <div class="text-[0.6rem] font-800">${t.ultima_limpieza || '—'}</div>
          </div>
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Próx. Limpieza</div>
            <div class="text-[0.6rem] font-800">${t.proxima_limpieza || '—'}</div>
          </div>
        </div>
        <div class="flex gap-6 mt-8">
          <button onclick="window.TanqueWizard.open(${JSON.stringify(t).replace(/"/g, '&quot;')})" class="text-[0.55rem] font-800 px-8 py-4 rounded-sm" style="background:var(--c-222); color:var(--c-aaa);">Editar</button>
        </div>
      </div>`;
    }

    if (tanques.length === 0) {
      html += `
      <div class="card p-20 text-center">
        <div class="text-aaa text-xs mb-8">No hay tanques registrados</div>
        <button onclick="window.TanqueWizard.open()" class="btn-primary text-xs px-16 py-8 font-900" style="background:var(--c-info);">Registrar primer tanque</button>
      </div>`;
    }

    html += `</div>`;

    html += `
    <div class="grid grid-cols-2 gap-12 mb-16">
      <div class="card p-14" style="border-left:3px solid var(--c-success);">
        <div class="text-[0.55rem] text-aaa uppercase font-800 mb-4">Producción Hoy</div>
        <div class="text-xl font-900 text-green">${produccionHoy.toLocaleString('es-ES')} L</div>
        <div class="text-[0.55rem] text-aaa mt-4">Entradas 30d: ${resumen30.totalEntradas.toLocaleString('es-ES')}L</div>
      </div>
      <div class="card p-14" style="border-left:3px solid var(--c-warning);">
        <div class="text-[0.55rem] text-aaa uppercase font-800 mb-4">MOFA (30 días)</div>
        <div class="text-xl font-900" style="color:${mofa30 >= 0 ? 'var(--c-success)' : 'var(--c-danger)'};">${mofa30.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
        <div class="text-[0.55rem] text-aaa mt-4">Ingresos: ${ingresos30.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
      </div>
    </div>`;

    if (ultimaAnalitica) {
      const lab = ultimaAnalitica.laboratorio;
      const especie = ultimaAnalitica.especie_leche || 'vacuno';
      const umbrales = window.ComunidadesService ? window.ComunidadesService.getUmbralesCalidadEspecie(especie) : null;

      html += `
      <div class="card p-14 mb-16" style="border-left:3px solid var(--c-purple);">
        <div class="text-[0.55rem] text-aaa uppercase font-800 mb-8">Última Analítica — ${ultimaAnalitica.fechaRecogida}</div>
        <div class="grid grid-cols-3 gap-8 text-center">
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Grasa</div>
            <div class="text-sm font-900 ${(lab.grasa || 0) >= (umbrales?.grasa?.min || 0) ? 'text-green' : 'text-red'};">${lab.grasa || '—'}%</div>
          </div>
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Proteína</div>
            <div class="text-sm font-900 ${(lab.proteina || 0) >= (umbrales?.proteina?.min || 0) ? 'text-green' : 'text-red'};">${lab.proteina || '—'}%</div>
          </div>
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">E. Seco</div>
            <div class="text-sm font-900 text-green">${lab.extracto_seco || ((lab.grasa || 0) + (lab.proteina || 0)).toFixed(2)}%</div>
          </div>
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Gérmenes</div>
            <div class="text-sm font-900 ${(lab.germenes || 0) <= (umbrales?.germenes_30C?.max || 1500000) ? 'text-green' : 'text-red'};">${lab.germenes ? (lab.germenes / 1000).toFixed(0) + 'k' : '—'}</div>
          </div>
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Somáticas</div>
            <div class="text-sm font-900">${lab.somaticas ? (lab.somaticas / 1000).toFixed(0) + 'k' : '—'}</div>
          </div>
          <div>
            <div class="text-[0.5rem] text-aaa uppercase">Inhibidores</div>
            <div class="text-sm font-900 ${lab.antibioticos ? 'text-red' : 'text-green'};">${lab.antibioticos ? '✗' : '✓'}</div>
          </div>
        </div>
      </div>`;
    }

    if (alertasWarning.length > 0) {
      html += `
      <div class="card p-14" style="border-left:3px solid var(--c-warning);">
        <div class="text-[0.6rem] font-900 uppercase mb-8" style="color:var(--c-warning);">Avisos</div>
        ${alertasWarning.map(a => `<div class="text-[0.65rem] font-800 text-white mb-4">⚠ ${a.mensaje}</div>`).join('')}
      </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
  }
};
