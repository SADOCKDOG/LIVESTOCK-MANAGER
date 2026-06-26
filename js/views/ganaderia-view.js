/**
 * Livestock Manager - GanaderiaView v1.0.0
 * Bloque consolidado de Ganadería con modo independiente (carne/leche/híbrido).
 */
const GanaderiaView = {
  _activeMode: 'carne',
  _cache: null,

  async render() {
    const main = document.getElementById('app-content');
    main.style.maxWidth = '100%';
    main.style.boxSizing = 'border-box';
    main.style.paddingLeft = '12px';
    main.style.paddingRight = '12px';

    this._injectStyles();

    const fincaId = await Fincas.getActiveId();
    if (!fincaId) {
      main.innerHTML = `<div class="p-20 text-center"><p class="text-gray">No hay ninguna finca seleccionada.</p></div>`;
      return;
    }

    const [rebanos, animales, fincaActiva] = await Promise.all([
      window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('animales').catch(() => []),
      Fincas.getActive().catch(() => null)
    ]);
    // Se excluyen las zonas anuladas, igual que en ZonasView.
    const zonas = (fincaActiva?.zonas || []).filter(z => z && !z.anulada);

    this._activeMode = window.ModoContextoHelper
      ? ModoContextoHelper.getModeForBlock('ganaderia', rebanos)
      : 'carne';

    const rebanosModo = window.ModoContextoHelper
      ? ModoContextoHelper.filterRebanosByMode(rebanos, this._activeMode)
      : rebanos;
    const rebanoIds = rebanosModo.map(r => r.id);
    const animalesModo = animales.filter(a => rebanoIds.includes(a.rebanoId));
    const animalesActivos = animalesModo.filter(a => (a.estado || 'activo') === 'activo');
    const especies = new Set(animalesModo.map(a => (a.especie || '').toLowerCase()).filter(Boolean));

    this._cache = { rebanos, animales, zonas, rebanosModo, animalesModo };
    const meta = window.ModoContextoHelper ? ModoContextoHelper.getModeMeta(this._activeMode) : { icon: '🥩', label: 'Cárnico', color: '#ef4444' };

    main.innerHTML = `
      <div class="mb-14 text-center">
        <div class="ganaderia-mode-switch">
          <button class="ganaderia-mode-btn ${this._activeMode === 'carne' ? 'active' : ''}" style="--mode-color:#ef4444;" onclick="GanaderiaView._changeMode('carne')">${Icons.carne()} Cárnico</button>
          <button class="ganaderia-mode-btn ${this._activeMode === 'leche' ? 'active' : ''}" style="--mode-color:#3b82f6;" onclick="GanaderiaView._changeMode('leche')">${Icons.leche()} Lácteo</button>
          <button class="ganaderia-mode-btn ${this._activeMode === 'hibrido' ? 'active' : ''}" style="--mode-color:#10b981;" onclick="GanaderiaView._changeMode('hibrido')">${Icons.rotacion()} Híbrido</button>
        </div>
      </div>

      <div class="card p-14 mb-14 border-222" style="border-top:3px solid ${meta.color};">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider mb-8">Contexto activo de Ganadería</div>
        <div class="text-white font-900">${meta.icon} ${meta.label}</div>
        <div class="text-xs text-aaa mt-4">Vista independiente por modo para patrimonio, censo, lotes y zonas.</div>
      </div>

      <div class="ganaderia-kpis">
        <div class="ganaderia-kpi" style="--kpi-color:${meta.color}">
          <small>Lotes/Rebaños</small>
          <strong>${rebanosModo.length}</strong>
        </div>
        <div class="ganaderia-kpi" style="--kpi-color:${meta.color}">
          <small>Animales Activos</small>
          <strong>${animalesActivos.length}</strong>
        </div>
        <div class="ganaderia-kpi" style="--kpi-color:${meta.color}">
          <small>Zonas</small>
          <strong>${zonas.length}</strong>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-10 mb-14">
        <a href="#/animales" class="widget-link-btn">${Icons.animales()} Animales</a>
        <a href="#/rebanos" class="widget-link-btn">${Icons.rebanos()} Rebaños</a>
        <a href="#/zonas" class="widget-link-btn">${Icons.zonas()} Zonas</a>
      </div>

      <div class="card p-14 mb-14 border-222">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Rebaños del modo ${meta.label}
        </div>
        <div class="grid gap-8">
          ${rebanosModo.length > 0
            ? rebanosModo.slice(0, 8).map(r => `
              <a href="#/rebano?id=${r.id}" class="card card-animal no-underline" style="border-left:4px solid ${meta.color}; padding:10px; margin:0;">
                <div class="flex justify-between items-center">
                  <div class="text-xs">
                    <div class="font-bold text-white">${r.nombre || 'Rebaño'}</div>
                    <div class="text-gray mt-2">Tipo: ${r.tipo || 'N/D'}</div>
                  </div>
                  <span class="badge badge-sm" style="background:${meta.color}15; color:${meta.color}; border:1px solid ${meta.color}35;">ID ${r.id}</span>
                </div>
              </a>
            `).join('')
            : `<div class="p-14 text-center bg-darker rounded"><span class="text-555 text-xs">Sin rebaños para este modo.</span></div>`
          }
        </div>
      </div>

      <div class="card p-14 border-222">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Censo reciente (${especies.size} especie(s))
        </div>
        <div class="grid gap-8">
          ${animalesModo.length > 0
            ? animalesModo.slice(0, 10).map(a => `
              <a href="#/animal?id=${a.id}" class="card card-animal no-underline" style="border-left:4px solid ${meta.color}; padding:10px; margin:0;">
                <div class="flex justify-between items-center">
                  <div class="text-xs">
                    <div class="font-bold text-white">${a.crotal || a.nombre || `Animal #${a.id}`}</div>
                    <div class="text-gray mt-2">${a.especie || 'N/D'} · ${a.raza || 'N/D'}</div>
                  </div>
                  <span class="badge badge-sm" style="background:${meta.color}15; color:${meta.color}; border:1px solid ${meta.color}35;">${a.estado || 'activo'}</span>
                </div>
              </a>
            `).join('')
            : `<div class="p-14 text-center bg-darker rounded"><span class="text-555 text-xs">Sin animales para este modo.</span></div>`
          }
        </div>
      </div>
    `;
  },

  _changeMode(mode) {
    this._activeMode = mode;
    if (window.ModoContextoHelper) ModoContextoHelper.setModeForBlock('ganaderia', mode);
    this.render();
  },

  _injectStyles() {
    if (document.getElementById('ganaderia-view-styles')) return;
    const style = document.createElement('style');
    style.id = 'ganaderia-view-styles';
    style.textContent = `
      .ganaderia-mode-switch {
        display:inline-flex; background:#18181b; padding:4px; border-radius:24px;
        border:1px solid #27272a; width:100%; max-width:520px; box-sizing:border-box;
      }
      .ganaderia-mode-btn {
        flex:1; padding:9px 16px; border:none; border-radius:20px; background:transparent;
        color:#888; font-size:0.8rem; font-weight:800; cursor:pointer; transition:all 0.2s;
        text-transform:uppercase; letter-spacing:0.5px;
      }
      .ganaderia-mode-btn.active {
        background:var(--mode-color); color:#fff; box-shadow:0 0 12px var(--mode-color);
      }
      .ganaderia-kpis {
        display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px;
      }
      .ganaderia-kpi {
        background:#1e1e1e; border:1px solid #2e2e2e; border-radius:12px; text-align:center;
        padding:12px 8px; border-top:3px solid var(--kpi-color);
      }
      .ganaderia-kpi small {
        display:block; font-size:0.65rem; color:#888; text-transform:uppercase;
        letter-spacing:0.3px;
      }
      .ganaderia-kpi strong { font-size:1.1rem; color:#fff; margin-top:4px; display:block; }
      .no-underline { text-decoration:none; }
    `;
    document.head.appendChild(style);
  }
};

window.GanaderiaView = GanaderiaView;
