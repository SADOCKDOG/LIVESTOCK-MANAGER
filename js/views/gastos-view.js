/**
 * Livestock Manager - GastosView v2.0.0
 * Vista de Gastos con tabs por Categoría Contable.
 * Sigue el mismo patrón que ProduccionView: tabs, KPIs, botón registrar, listado.
 * Copia espejo de js/views/gastos-view.js
 */

const GastosView = {
  _currentTab: 'todos',
  _cachedData: null,

  // Definición de categorías contables con iconos SVG y colores
  _CATEGORIAS: [
    { key: 'todos',        icon: Icons.documento(), label: 'Todos',          color: 'var(--c-purple)', colorDark: '#6d28d9' },
    { key: 'Alimentacion', icon: Icons.paquete(),   label: 'Alimentación',   color: 'var(--c-warning)', colorDark: 'var(--c-warning)' },
    { key: 'Sanidad',      icon: Icons.sanidad(),   label: 'Sanidad',        color: 'var(--c-danger)', colorDark: '#b91c1c' },
    { key: 'Fitosanitarios', icon: Icons.sanidad(), label: 'Fitosanitarios', color: 'var(--c-success)', colorDark: '#047857' },
    { key: 'Electricidad', icon: Icons.info(),      label: 'Electricidad',   color: 'var(--c-info)', colorDark: '#1d4ed8' },
    { key: 'Personal',     icon: Icons.compradores(), label: 'Personal',      color: 'var(--c-orange)', colorDark: '#c2410c' },
    { key: 'Amortizacion', icon: Icons.transportistas(), label: 'Amortización', color: 'var(--c-purple)', colorDark: '#7e22ce' },
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
      const color = pct > 70 ? 'var(--c-danger)' : pct > 40 ? 'var(--c-warning)' : 'var(--c-success)';
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
      <!-- Aglutinadora Gastos -->
      <div class="card-registro" style="--registro-color: var(--c-danger); padding: 15px;">
        <div class="flex justify-between items-start mb-10">
          <div>
            <h2 class="flex items-center gap-8 uppercase font-900 tracking-tighter m-0" style="color: var(--c-danger)">
              ${Icons.dinero()} GESTIÓN DE GASTOS
            </h2>
            <div class="text-gray text-[0.65rem] font-800 uppercase mt-2">
              BALANCE GLOBAL Y EVOLUCIÓN
            </div>
          </div>
          <button class="resumen-toggle btn-glass-neon" onclick="App.toggleResumen(this)" style="--neon: var(--c-danger)">
            ${Icons.flechaAbajo()}
          </button>
        </div>

        <!-- Card de RESUMEN: Evolución Mensual -->
        <div class="card card-total-3d card-resumen mb-14" style="background:rgba(255,68,68,0.03);">
          <div class="flex justify-between items-center mb-12 px-4">
            <span class="text-[0.65rem] text-gray font-bold uppercase">Evolución (6 meses)</span>
            <span class="text-[0.65rem] text-white font-900">${totalGeneral.toLocaleString()} € TOTAL</span>
          </div>
          <div class="flex gap-6">${mesesHtml}</div>
        </div>

        <!-- Card de RESUMEN: Balance por Categoría -->
        <div class="card card-total-3d card-resumen mb-20">
          <div class="flex flex-col gap-6">
            ${this._CATEGORIAS.filter(c => c.key !== 'todos').map(c => {
              const catGasto = kpis[c.key]?.total || 0;
              return `
                <div class="flex justify-between items-center px-4">
                  <span class="text-gray text-[0.7rem] font-800 uppercase flex items-center gap-4">${c.icon} ${c.label}</span>
                  <span class="text-white font-900" style="color:${c.color};">${catGasto.toLocaleString()} €</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Filtros / Tabs -->
        <div class="flex gap-8 mb-20 overflow-x-auto pb-4 no-scrollbar">
          ${this._CATEGORIAS.map(c => `
            <button class="badge badge-sm uppercase font-900 ${this._currentTab === c.key ? 'active' : ''}"
                    onclick="GastosView._cambiarTab('${c.key}')"
                    style="border-left: 2px solid ${c.color} !important;">
              ${c.label}
            </button>
          `).join('')}
        </div>

        <div id="gasto-content"><div class="loader">Cargando gastos...</div></div>
      </div>`;

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

    // Recent gastos section
    const recientes = data.records.slice(0, 5);
    let recientesHtml = '';
    if (recientes.length === 0) {
      recientesHtml = `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin gastos recientes</span></div>`;
    } else {
      recientesHtml = `
        <div class="mb-14">
          <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
            <span style="color: var(--c-success); font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> GASTOS RECIENTES
          </div>
          <div class="grid gap-6">${recientes.map(g => {
            const color = this._getCategoryColor(g.categoria || '');
            return `
            <div class="card-registro" onclick="ProduccionView._abrirOpcionesGasto(${g.id})"
                 style="--registro-color: ${color};">
              <div class="flex flex-col gap-10">
                <div class="flex justify-between items-start">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-6">
                      <span class="text-xl" style="color:${color}">${Icons.paquete()}</span>
                      <div class="font-950 text-white uppercase text-base tracking-tight" style="color:var(--p-gold) !important;">${g.concepto || g.categoria || 'Gasto'}</div>
                    </div>
                    <div class="flex flex-wrap gap-x-6 gap-y-1 text-[0.6rem] text-gray-500 font-800 uppercase mt-2">
                      ${g.fecha ? `<span class="flex items-center gap-4">${Icons.calendar()} ${new Date(g.fecha).toLocaleDateString()}</span>` : ''}
                      ${g.snap_zona ? `<span class="flex items-center gap-4">${Icons.zonas()} ${g.snap_zona}</span>` : ''}
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-3">
                    <div class="font-950" style="font-size:1.1rem; color:${color};">${g.monto.toLocaleString()} €</div>
                  </div>
                </div>
                <div class="text-right">
                  <span style="display: inline-block; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--c-warning); color: var(--c-warning); background: rgba(255, 215, 0, 0.1); padding: 2px 6px; border-radius: 4px;">Ficha -></span>
                </div>
              </div>
            </div>`;
          }).join('')}</div>
        </div>
      `;
    }

    this._renderSeccion(content, {
      icon: catInfo.icon,
      title: `Gastos — ${catInfo.label}`,
      subtitle: data.count > 0 ? `${data.count} ${data.count === 1 ? "registro" : "registros"} · ${this._fmt(data.total)} € total` : 'Sin registros en esta categoría',
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
        title: (g.concepto || g.categoria || 'Gasto'),
        date: g.fecha ? new Date(g.fecha).toLocaleDateString() : '-',
        zone: g.snap_zona || '',
        categoria: g.categoria || '',
        value: GastosView._fmt(g.monto || 0) + ' €',
        onclick: "ProduccionView._abrirOpcionesGasto(" + g.id + ")"
      })),
      emptyMsg: `Sin gastos de ${catInfo.label.toLowerCase()}. Usa "Registrar Gasto" para añadir.`,
      recientesHtml: recientesHtml
    });
  },

  _renderSeccion(content, opts) {
    const { icon, title, subtitle, color, colorDark, kpis, registrarLabel, listName, records, emptyMsg, registrarHandler, recientesHtml } = opts;

    const recordsHtml = records.length > 0
      ? records.map(r => `
        <div class="card-registro" onclick="${r.onclick || ''}"
             style="--registro-color: ${color};">
          <div class="flex flex-col gap-10">
            <div class="flex justify-between items-center w-full">
              <div class="flex items-center gap-10 min-w-0">
                <span class="text-xl" style="color:${color}">${Icons.documento()}</span>
                <div class="text-xs">
                  <div class="font-950 text-white uppercase text-base tracking-tight" style="color:var(--p-gold) !important;">${r.title}</div>
                  <div class="text-gray-500 mt-2 font-800 uppercase text-[0.65rem] tracking-wider flex items-center gap-6">
                    ${Icons.calendar()} ${r.date} ${r.zone ? ' · ' + r.zone : ''} ${r.categoria ? ' · ' + r.categoria : ''}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-950" style="font-size:1.1rem; color:${color};">${r.value}</div>
              </div>
            </div>
            <div class="text-right">
              <span style="display: inline-block; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--c-warning); color: var(--c-warning); background: rgba(255, 215, 0, 0.1); padding: 2px 6px; border-radius: 4px;">Ficha -></span>
            </div>
          </div>
        </div>`).join('')
      : `<div class="p-14 text-center bg-dark rounded-sm border border-222"><span class="text-555 text-xs uppercase font-900 tracking-widest">${Icons.buscar()} ${emptyMsg}</span></div>`;

    content.innerHTML = `
        <div class="inf-section-title mb-12 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.75rem]">
          ${icon} ${listName}
        </div>
        ${recordsHtml}
      <!-- Botón Flotante de Acción -->
      <div class="fab-container" onclick="${registrarHandler}">
        <span class="fab-label">Nuevo ${registrarLabel}</span>
        <button class="fab-btn" style="--neon: var(--c-danger)">${Icons.fabPlus()}</button>
      </div>`;
  },

  _getCategoryColor(cat) {
    const catMap = {
      'Alimentacion': 'var(--c-warning)',
      'Sanidad': 'var(--c-danger)',
      'Fitosanitarios': 'var(--c-success)',
      'Electricidad': 'var(--c-info)',
      'Personal': 'var(--c-orange)',
      'Amortizacion': 'var(--c-purple)'
    };
    return catMap[cat] || 'var(--c-purple)';
  },

  _fmt(n) {
    return (n != null && !isNaN(n)) ? Number(n).toLocaleString() : '0';
  }
};

window.GastosView = GastosView;