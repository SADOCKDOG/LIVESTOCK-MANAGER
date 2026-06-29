/**
 * Livestock Manager - GastosView v2.0.0
 * Vista de Gastos con tabs por Categoría Contable.
 * Sigue el mismo patrón que ProduccionView: tabs, KPIs, botón registrar, listado.
 * Copia espejo de js/views/gastos-view.js
 */

const GastosView = {
  _currentTab: 'todos',
  _cachedData: null,

  // Definición de categorías contables con iconos y colores
  _CATEGORIAS: [
    { key: 'todos',        icon: '📋', label: 'Todos',          color: '#8b5cf6', colorDark: '#6d28d9' },
    { key: 'Alimentacion', icon: '🌾', label: 'Alimentación',   color: '#f59e0b', colorDark: '#b45309' },
    { key: 'Sanidad',      icon: '💉', label: 'Sanidad',        color: '#ef4444', colorDark: '#b91c1c' },
    { key: 'Fitosanitarios', icon: '🌱', label: 'Fitosanitarios', color: '#10b981', colorDark: '#047857' },
    { key: 'Electricidad', icon: '⚡', label: 'Electricidad',   color: '#3b82f6', colorDark: '#1d4ed8' },
    { key: 'Personal',     icon: '👷', label: 'Personal',       color: '#f97316', colorDark: '#c2410c' },
    { key: 'Amortizacion', icon: '🚜', label: 'Amortización',   color: '#a855f7', colorDark: '#7e22ce' },
  ],

  async render() {
    const main = document.getElementById('app-content');
    // Cargar datos primero
    const gastosRecords = await Gastos.list(await Fincas.getActiveId());

    // Resumen mensual (últimos 6 meses)
    const hoy = new Date();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const porMes = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      porMes[key] = { label: meses[d.getMonth()] + ' ' + d.getFullYear(), total: 0 };
    }
    gastosRecords.forEach(g => {
      if (!g.fecha) return;
      const key = g.fecha.substring(0, 7);
      if (porMes[key]) porMes[key].total += g.monto || 0;
    });
    const totalGeneral = gastosRecords.reduce((s, g) => s + (g.monto || 0), 0);
    const mesesHtml = Object.values(porMes).reverse().map(m => {
      const pct = Math.min(100, m.total / (Math.max(1, Object.values(porMes).reduce((s,x) => Math.max(s, x.total), 0)) / 100));
      const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#10b981';
      return `<div class="flex-1 text-center min-w-0">
        <div class="text-xs text-gray mb-2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.label}</div>
        <div class="gasto-bar-wrap">
          <div style="position:absolute;bottom:0;width:100%;height:${pct}%;background:${color};border-radius:6px;opacity:0.8;transition:height 0.3s;"></div>
        </div>
        <div class="text-xs font-bold mt-2" style="color:${color};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(m.total/1000).toFixed(1)}k€</div>
      </div>`;
    }).join('');


    // Calcular KPIs por categoría
    const kpis = {};
    this._CATEGORIAS.forEach(c => {
      const filtered = c.key === 'todos' ? gastosRecords : gastosRecords.filter(g => g.categoria === c.key);
      kpis[c.key] = {
        records: filtered.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)),
        total: filtered.reduce((s, g) => s + (g.monto || 0), 0),
        count: filtered.length
      };
    });

    main.innerHTML = `
      <div class="card mb-14 p-12" style="background:rgba(239,68,68,0.03);">
        <div class="flex justify-between items-center mb-6">
          <span class="text-xs text-gray font-bold uppercase">Evolución Mensual (últimos 6 meses)</span>
          <span class="text-xs text-gray">${totalGeneral.toLocaleString()}€ total</span>
        </div>
        <div class="flex gap-6">${mesesHtml}</div>
      </div>
      <div class="mb-14">
        <div class="tabs-scroll gasto-tabs scroll-shadow-container">
          ${this._CATEGORIAS.map(c => `
            <button class="gasto-tab ${this._currentTab === c.key ? 'active' : ''}" data-tab="${c.key}" onclick="GastosView._cambiarTab('${c.key}')" style="border-left: 3px solid ${c.color};">${c.icon} ${c.label}</button>
          `).join('')}
        </div>
      </div>
      <div id="gasto-content"><div class="loader">Cargando gastos...</div></div>`;

    this._cachedData = { gastosRecords, kpis };

    this._renderTabActual();
  },

  _cambiarTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('.gasto-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    this._renderTabActual();
    window.scrollTo(0, 0);
  },

  _renderTabActual() {
    const d = this._cachedData;
    if (!d) return;
    const content = document.getElementById('gasto-content');
    if (!content) return;

    const catInfo = this._CATEGORIAS.find(c => c.key === this._currentTab) || this._CATEGORIAS[0];
    const data = d.kpis[this._currentTab];
    if (!data) { content.innerHTML = '<div class="loader">Sin datos</div>'; return; }

    this._renderSeccion(content, {
      icon: catInfo.icon,
      title: `Gastos — ${catInfo.label}`,
      subtitle: data.count > 0 ? `${data.count} registro(s) · ${this._fmt(data.total)} € total` : 'Sin registros en esta categoría',
      color: catInfo.color,
      colorDark: catInfo.colorDark,
      kpis: [
        { label: 'Total (€)', value: this._fmt(data.total) + ' €' },
        { label: 'Registros', value: data.count }
      ],
      registrarLabel: 'Gasto',
      listName: 'Lista de Gastos',
      registrarHandler: "App._abrirFormularioGasto()",
      records: data.records.slice(0, 50).map(g => ({
        title: '🧾 ' + (g.concepto || g.categoria || 'Gasto'),
        date: g.fecha ? new Date(g.fecha).toLocaleDateString() : '-',
        zone: g.snap_zona || '',
        categoria: g.categoria || '',
        value: (g.monto || 0) + ' €',
        onclick: "ProduccionView._abrirOpcionesGasto(" + g.id + ")"
      })),
      emptyMsg: `Sin gastos de ${catInfo.label.toLowerCase()}. Usa "Registrar Gasto" para añadir.`
    });
  },

  _renderSeccion(content, opts) {
    const { icon, title, subtitle, color, colorDark, kpis, registrarLabel, listName, records, emptyMsg, registrarHandler } = opts;

    const recordsHtml = records.length > 0
      ? records.map(r => `
        <div class="card mb-6" onclick="${r.onclick || ''}"
             style="border-left:4px solid ${color}; padding:12px 14px; cursor:pointer; background:rgba(0,0,0,0.3);">
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <div class="text-white font-800 nowrap" style="font-size:0.88rem; overflow:hidden; text-overflow:ellipsis;">${r.title}</div>
              <div class="text-gray" style="font-size:0.72rem; margin-top:3px;">📅 ${r.date}${r.zone ? ' | 📍 ' + r.zone : ''}${r.categoria ? ' | 🏷️ ' + r.categoria : ''}</div>
            </div>
            <div class="text-right flex-shrink-0 ml-8">
              <div class="font-900" style="font-size:1rem; color:${color};">${r.value}</div>
            </div>
          </div>
        </div>`).join('')
      : `<div class="p-14 text-center bg-dark rounded-sm"><span class="text-555 text-sm">📭 ${emptyMsg}</span></div>`;

    content.innerHTML = `
      <div class="card report-section p-16 mb-14" style="border-top:3px solid ${color};">
        <div class="flex items-center gap-12 mb-12">
          <span class="text-3xl">${icon}</span>
          <div>
            <div class="text-white font-900 text-lg">${title}</div>
            ${subtitle ? `<div class="text-gray" style="font-size:0.68rem;">${subtitle}</div>` : ''}
          </div>
        </div>
        ${kpis ? `<div class="grid grid-cols-2 gap-8 mb-12">
          ${kpis.map(k => `
            <div class="bg-dark" style="padding:10px 8px; border-radius:8px; border-left:3px solid ${color};">
              <small class="text-gray text-tiny" style="text-transform:uppercase; font-weight:700; letter-spacing:0.3px;">${k.label}</small>
              <div class="text-white font-900" style="font-size:1.1rem;">${k.value}</div>
            </div>`).join('')}
        </div>` : ''}
        <div class="text-center mb-12">
          <button class="btn btn-create btn-sm" onclick="${registrarHandler}">
            ${Icons.agregar()} ${registrarLabel}
          </button>
        </div>
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} ${listName}
        </div>
        ${recordsHtml}
      </div>
      <button class="fab-btn" onclick="${registrarHandler}" aria-label="${registrarLabel}">${Icons.agregar()}</button>`;
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.GastosView = GastosView;
