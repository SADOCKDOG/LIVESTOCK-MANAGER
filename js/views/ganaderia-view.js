/**
 * Livestock Manager - GanaderiaView v1.0.0
 * Bloque consolidado de Ganadería con modo independiente (carne/leche/híbrido).
 */
const GanaderiaView = {
  _activeMode: 'leche',
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

    const savedMode = window.ModoContextoHelper
      ? ModoContextoHelper.getModeForBlock('ganaderia', rebanos)
      : 'leche';

    // Si ya tenemos un modo activo (por click manual), lo mantenemos.
    // Si no (primera carga), usamos el guardado/detectado.
    this._activeMode = this._activeMode || savedMode;

    const rebanosModo = window.ModoContextoHelper
      ? ModoContextoHelper.filterRebanosByMode(rebanos, this._activeMode)
      : rebanos;
    const rebanoIds = rebanosModo.map(r => r.id);
    const animalesModo = animales.filter(a => rebanoIds.includes(a.rebanoId));
    const animalesActivos = animalesModo.filter(a => (a.estado || 'activo') === 'activo');
    const especies = new Set(animalesModo.map(a => (a.especie || '').toLowerCase()).filter(Boolean));

    this._cache = { rebanos, animales, zonas, rebanosModo, animalesModo };
    const meta = window.ModoContextoHelper ? ModoContextoHelper.getModeMeta(this._activeMode) : { icon: Icons.carne(), label: 'Cárnico', color: '#ef4444' };

    // Sincronizar color de cabecera con el modo activo
    if (window.App && App.updateHeaderColor) App.updateHeaderColor(this._activeMode);

    main.innerHTML = `
      <div class="mb-16 mt-4 card p-12 border-222 card-dark-gradient pb-24">
        <div class="section-header-neon" style="--neon-color: #facc15;">MÓDULOS</div>
        <div class="grid grid-cols-3 gap-10">
          <a href="#/animales" class="widget-link-btn widget-link-btn--neon neon-danger">
            ${Icons.animales()}
            <span class="widget-link-label">Animales</span>
          </a>
          <a href="#/rebanos" class="widget-link-btn widget-link-btn--neon neon-info">
            ${Icons.rebanos()}
            <span class="widget-link-label">Rebaños</span>
          </a>
          <a href="#/zonas" class="widget-link-btn widget-link-btn--neon neon-success">
            ${Icons.zonas()}
            <span class="widget-link-label">Zonas</span>
          </a>
        </div>
      </div>

      <div class="mb-16 text-center">
        <div class="section-header-neon" style="--neon-color: ${meta.color}; max-width: 360px; margin: 0 auto;">EXPLOTACIÓN</div>
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

      <!-- KPIs Ganadería Unificados en Filas -->
      <div class="card p-16 mb-16 border-222" style="border-left: 5px solid ${meta.color};">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-10 flex items-center gap-6">
          ${meta.icon} BALANCE DE RENDIMIENTO GANADERO (${meta.label})
        </div>
        <div class="flex flex-col">
          <div class="py-12 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900">Lotes / Rebaños</span>
            <strong class="text-xl font-950" style="color: ${meta.color};">${rebanosModo.length} lotes</strong>
          </div>
          <div class="py-12 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900">Animales Activos</span>
            <strong class="text-xl font-950 text-green">${animalesActivos.length} cabezas</strong>
          </div>
          <div class="py-12 flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900">Zonas / Parcelas</span>
            <strong class="text-xl font-950 text-blue">${zonas.length} parcelas</strong>
          </div>
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
            : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin rebaños para este modo</span></div>`
          }
        </div>
      </div>

      <div class="card p-14 border-222">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Censo reciente (${especies.size} especie(s))
        </div>
        <div class="grid gap-8">
          ${animalesModo.length > 0
            ? animalesModo.slice(0, 10).map(a => {
                const reb = rebanos.find(r => r.id === a.rebanoId);
                const sexoIcon = a.sexo === 'H' ? '♀' : (a.sexo === 'M' ? '♂' : '');
                const ageText = a.fechaNacimiento ? ` · ${Math.floor((new Date() - new Date(a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 365))} años` : '';
                return `
                  <a href="#/animal?id=${a.id}" class="card card-animal no-underline" style="border-left:4px solid ${meta.color}; padding:14px; margin:0; margin-bottom:8px;">
                    <div class="flex flex-col gap-10">
                      <div class="flex justify-between items-center w-full">
                        <div class="flex items-center gap-10 min-w-0">
                          <div class="text-xl" style="color:${meta.color}">${Icons.animales()}</div>
                          <div class="text-xs">
                            <div class="font-bold text-white uppercase">${a.crotal || a.nombre || `Animal #${a.id}`} <span class="text-gray-400 ml-4">${sexoIcon}</span></div>
                            <div class="text-gray mt-2 font-700 uppercase">${(a.especie || 'N/D')} · ${(a.raza || 'N/D')}${ageText}</div>
                          </div>
                        </div>
                        <div class="text-right">
                          <span class="badge badge-sm uppercase" style="background:${meta.color}15; color:${meta.color}; border:1px solid ${meta.color}35;">${a.estado || 'activo'}</span>
                        </div>
                      </div>

                      <div class="flex justify-between items-end w-full">
                        <div class="text-[0.65rem] text-aaa flex items-center gap-4">
                          ${Icons.rebanos()} ${reb?.nombre || 'Sin Lote'}
                        </div>
                        <div class="text-[0.48rem] text-gray-600 font-900 uppercase">VER ➔</div>
                      </div>
                    </div>
                  </a>
                `;
              }).join('')
            : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin animales para este modo</span></div>`
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
