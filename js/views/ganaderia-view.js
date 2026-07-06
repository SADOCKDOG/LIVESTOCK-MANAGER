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
    const meta = window.ModoContextoHelper ? ModoContextoHelper.getModeMeta(this._activeMode) : { icon: Icons.carne(), label: 'Cárnico', color: 'var(--c-danger)' };

    // Sincronizar color de cabecera con el modo activo
    if (window.App && App.updateHeaderColor) App.updateHeaderColor(this._activeMode);

    main.innerHTML = `
      <div class="mb-14">
        <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
          <span style="color: var(--c-success); font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> MÓDULOS
        </div>
        <div class="grid grid-cols-3 gap-10">
          <a href="#/animales" class="widget-link-btn widget-link-btn--neon neon-orange">
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

      <div class="mb-14">
        <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
          <span style="color: ${meta.color}; font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> EXPLOTACIÓN
        </div>
        <div class="ganaderia-mode-switch" style="max-width: 100%;">
          <button class="ganaderia-mode-btn ${this._activeMode === 'carne' ? 'active' : ''}" style="--mode-color:var(--c-danger); color: var(--mode-color);" onclick="GanaderiaView._changeMode('carne')">${Icons.carne()} Cárnico</button>
          <button class="ganaderia-mode-btn ${this._activeMode === 'leche' ? 'active' : ''}" style="--mode-color:var(--c-info); color: var(--mode-color);" onclick="GanaderiaView._changeMode('leche')">${Icons.leche()} Lácteo</button>
          <button class="ganaderia-mode-btn ${this._activeMode === 'hibrido' ? 'active' : ''}" style="--mode-color:var(--c-success); color: var(--mode-color);" onclick="GanaderiaView._changeMode('hibrido')">${Icons.rotacion()} Híbrido</button>
        </div>
      </div>

      <div class="card-registro mb-14 border-bottom-222 pb-10" style="--registro-color: ${meta.color};">
        <div class="text-xs text-grey font-black uppercase tracking-wider mb-6 flex items-center gap-6">
          ${meta.icon} BALANCE DE RENDIMIENTO GANADERO (${meta.label})
        </div>
        <div class="flex flex-col">
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.rebanos()} Lotes / Rebaños</span>
            <strong class="text-xl font-950" style="color: ${meta.color};">${rebanosModo.length} ${rebanosModo.length === 1 ? "lote" : "lotes"}</strong>
          </div>
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.animales()} Animales Activos</span>
            <strong class="text-xl font-950 text-green">${animalesActivos.length} ${animalesActivos.length === 1 ? "cabeza" : "cabezas"}</strong>
          </div>
          <div class="py-8 flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.zonas()} Zonas / Parcelas</span>
            <strong class="text-xl font-950 text-blue">${zonas.length} ${zonas.length === 1 ? "parcela" : "parcelas"}</strong>
          </div>
        </div>
      </div>



      <div class="card-registro p-14 mb-14 border-222" style="--registro-color: ${meta.color};">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Rebaños del modo ${meta.label}
        </div>
        <div class="grid gap-8">
          ${rebanosModo.length > 0
    ? rebanosModo.slice(0, 8).map(r => App._cardRegistro({
        title: r.nombre || 'Rebaño',
        subtitle: `Tipo: ${r.tipo || 'N/D'}`,
        footerRight: `<span style="display: inline-block; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--c-warning); color: var(--c-warning); background: rgba(255, 215, 0, 0.1); padding: 2px 6px; border-radius: 4px;">Ficha -></span>`,
        color: meta.color,
        href: `#/rebano?id=${r.id}`
    })).join('')
    : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin rebaños para este modo</span></div>`
  }
        </div>
      </div>

      <div class="card-registro p-14 border-222" style="--registro-color: ${meta.color};">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Censo reciente (${animalesModo.length} total · ${especies.size} ${especies.size === 1 ? "especie" : "especies"})
        </div>
        ${animalesModo.length > 0 ? `
        <div class="flex flex-wrap gap-4 mb-12">
          ${[...especies].map(esp => {
            const count = animalesModo.filter(a => (a.especie || '').toLowerCase() === esp).length;
            const activos = animalesModo.filter(a => (a.especie || '').toLowerCase() === esp && (a.estado || 'activo') === 'activo').length;
            return `<span class="badge badge-sm uppercase" style="background:${meta.color}15; color:${meta.color};">${esp.toUpperCase()}: ${count} (${activos} act.)</span>`;
          }).join('')}
        </div>
        <div class="grid gap-6">
          ${animalesModo.slice(0, 10).map(a => {
              const reb = rebanos.find(r => r.id === a.rebanoId);
              const props = App._getAnimalCardProps(a, reb);
              return App._cardRegistro(props);
            }).join('')}
        </div>` 
        : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin animales para este modo</span></div>`}
      </div>

      <!-- Botón Flotante de Acción con viñeta -->
      <div class="fab-container" onclick="App._abrirAsistenteProduccion(null, { origen_modulo: 'ganaderia', modo_explotacion: this._activeMode })">
        <span class="fab-label">Nuevo Registro</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
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

