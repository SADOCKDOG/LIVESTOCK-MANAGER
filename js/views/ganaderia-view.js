/**
 * Livestock Manager - GanaderiaView v1.0.0
 * Bloque consolidado de Ganadería con modo independiente (carne/leche/híbrido).
 */
const GanaderiaView = {
  _activeMode: 'carne',
  _cache: null,

  async render() {
    const main = document.getElementById('app-content');
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
      <div class="mb-14 mt-4 card p-10 border-222" style="background: linear-gradient(145deg, #111 0%, #0a0a0a 100%);">
        <div class="text-xs uppercase font-extrabold tracking-wider mb-6 pt-2 text-center" style="letter-spacing: 1.5px; color: #facc15; text-shadow: 0 0 12px #facc1580; border-top: 2px solid #facc15;">⚡ ACCESO A OTROS MÓDULOS</div>
        <div class="grid grid-cols-3 gap-10">
          <a href="#/animales" class="widget-link-btn" style="background: #000000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px; gap: 6px; border-left: 3px solid #ef4444; border-right: 3px solid #ef4444; border-radius: 8px; color: #ffffff; box-shadow: 0 0 20px #ef4444B0, inset 0 0 12px #ef444440; transform: scale(1); transition: transform 0.2s ease, box-shadow 0.2s ease;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
            ${Icons.animales()}
            <span style="font-size: 0.85rem; font-weight: 600;">Animales</span>
          </a>
          <a href="#/rebanos" class="widget-link-btn" style="background: #000000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px; gap: 6px; border-left: 3px solid #3b82f6; border-right: 3px solid #3b82f6; border-radius: 8px; color: #ffffff; box-shadow: 0 0 20px #3b82f6B0, inset 0 0 12px #3b82f640; transform: scale(1); transition: transform 0.2s ease, box-shadow 0.2s ease;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
            ${Icons.rebanos()}
            <span style="font-size: 0.85rem; font-weight: 600;">Rebaños</span>
          </a>
          <a href="#/zonas" class="widget-link-btn" style="background: #000000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px; gap: 6px; border-left: 3px solid #10b981; border-right: 3px solid #10b981; border-radius: 8px; color: #ffffff; box-shadow: 0 0 20px #10b981B0, inset 0 0 12px #10b98140; transform: scale(1); transition: transform 0.2s ease, box-shadow 0.2s ease;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
            ${Icons.zonas()}
            <span style="font-size: 0.85rem; font-weight: 600;">Zonas</span>
          </a>
        </div>
      </div>

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

};

window.GanaderiaView = GanaderiaView;
