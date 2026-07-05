/**
 * Livestock Manager - GanaderiaView v1.2.0
 * Bloque consolidado de Ganadería con modo independiente (carne/leche/híbrido).
 * Refactored with Aglutinadora UI Pattern & Neon Branding.
 */
const GanaderiaView = {
  _activeMode: 'leche',
  _cache: null,

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  async render() {
    const main = document.getElementById('app-content');
    const fincaId = await Fincas?.getActiveId();
    if (!fincaId) {
      main.innerHTML = `<div class="p-20 text-center"><p class="text-gray">No hay ninguna finca seleccionada.</p></div>`;
      return;
    }

    const [rebanos, animales, fincaActiva, eventosRaw] = await Promise.all([
      window.db?.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db?.getAll('animales').catch(() => []),
      Fincas?.getActive().catch(() => null),
      window.db?.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => [])
    ]);
    const zonas = (fincaActiva?.zonas || []).filter(z => z && !z.anulada);
    const eventos = (eventosRaw || []).filter(e => !e?.anulado);

    const savedMode = window.ModoContextoHelper
      ? ModoContextoHelper.getModeForBlock('ganaderia', rebanos)
      : 'leche';

    this._activeMode = this._activeMode || savedMode;

    const rebanosModo = window.ModoContextoHelper
      ? ModoContextoHelper.filterRebanosByMode(rebanos, this._activeMode)
      : rebanos;
    const rebanoIds = new Set(rebanosModo.map(r => r.id));
    const animalesModo = animales.filter(a => rebanoIds.has(a.rebanoId));
    const animalesActivos = animalesModo.filter(a => (a.estado || 'activo') === 'activo');

    let recientes = [];
    if (this._activeMode === 'carne') {
      recientes = eventos.filter(e => {
        if (!(e.unidad === 'kg' && (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano'))) return false;
        return rebanoIds.has(e.rebanoId) || (e.snap_tipo || '').toLowerCase().match(/carne|cárn|mixt|híbr|doble/);
      });
    } else if (this._activeMode === 'leche') {
      recientes = eventos.filter(e => {
        if (!((e.unidad === 'L' || e.unidad === 'Litros') && (e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero'))) return false;
        return rebanoIds.has(e.rebanoId) || (e.snap_tipo || '').toLowerCase().match(/leche|láct|mixt|híbr|doble/);
      });
    } else {
      recientes = eventos.filter(e => (e.unidad === 'kg' || e.unidad === 'L' || e.unidad === 'Litros') && (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano'));
    }
    recientes.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    recientes = recientes.slice(0, 15);

    this._cache = { rebanos, animales, zonas, rebanosModo, animalesModo };
    const meta = window.ModoContextoHelper ? ModoContextoHelper.getModeMeta(this._activeMode) : { icon: Icons.carne(), label: 'Cárnico', color: 'var(--c-danger)' };

    if (window.App?.updateHeaderColor) App.updateHeaderColor(this._activeMode);

    main.innerHTML = `
      <div class="mb-14 px-4">
        <div class="text-left mb-10 flex items-center" style="font-size: 1rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
          <span style="color: var(--c-success); font-size: 1.2rem; margin-right: 8px; font-weight: 900;">|</span> MÓDULOS DE GESTIÓN
        </div>
        <div class="grid grid-cols-3 gap-10">
          <a href="#/animales" class="widget-link-btn widget-link-btn--neon neon-orange">
            ${Icons.animales()} <span class="widget-link-label">Animales</span>
          </a>
          <a href="#/rebanos" class="widget-link-btn widget-link-btn--neon neon-info">
            ${Icons.rebanos()} <span class="widget-link-label">Rebaños</span>
          </a>
          <a href="#/zonas" class="widget-link-btn widget-link-btn--neon neon-success">
            ${Icons.zonas()} <span class="widget-link-label">Zonas</span>
          </a>
        </div>
      </div>

      <div class="mb-14 px-4">
        <div class="ganaderia-mode-switch" style="max-width: 100%;">
          <button class="ganaderia-mode-btn ${this._activeMode === 'carne' ? 'active' : ''}" style="--mode-color:var(--c-danger);" onclick="GanaderiaView._changeMode('carne')">${Icons.carne()} Carne</button>
          <button class="ganaderia-mode-btn ${this._activeMode === 'leche' ? 'active' : ''}" style="--mode-color:var(--c-info);" onclick="GanaderiaView._changeMode('leche')">${Icons.leche()} Leche</button>
          <button class="ganaderia-mode-btn ${this._activeMode === 'hibrido' ? 'active' : ''}" style="--mode-color:var(--c-success);" onclick="GanaderiaView._changeMode('hibrido')">${Icons.rotacion()} Híbrido</button>
        </div>
      </div>

      <div class="report-section px-4">
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: ${meta.color}">${meta.icon} Balance ${meta.label}</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 flex justify-between items-center border-bottom-222">
              <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.rebanos()} Lotes Activos</span>
              <strong class="text-lg font-950" style="color: #fff;">${rebanosModo.length}</strong>
            </div>
            <div class="py-10 flex justify-between items-center border-bottom-222">
              <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.animales()} Censo Activo</span>
              <strong class="text-lg font-950" style="color: var(--c-success);">${animalesActivos.length}</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">${Icons.zonas()} Ocupación Zonas</span>
              <strong class="text-lg font-950" style="color: var(--c-info);">${zonas.length}</strong>
            </div>
          </div>
        </div>

        ${recientes.length > 0 ? `
        <div class="mb-14">
          <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
            ${Icons.documento()} REGISTROS RECIENTES
          </div>
          <div class="grid gap-10">
            ${recientes.map(e => {
              const itemColor = e.unidad === 'kg' ? 'var(--c-danger)' : (e.unidad?.match(/L|Litros/) ? 'var(--c-info)' : 'var(--c-success)');
              const icon = e.unidad === 'kg' ? Icons.carne() : (e.unidad?.match(/L|Litros/) ? Icons.leche() : Icons.rebanos());
              return `
                <div class="card-registro" onclick="GanaderiaView._abrirOpcionesRegistro(${e.id}, '${e.tipo_entidad}', ${e.entidad_id})"
                     style="--registro-color: ${itemColor}; display:flex; gap:10px; align-items:stretch;">
                  <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <div class="flex items-center gap-10 min-w-0">
                      <span class="text-xl" style="color:${itemColor};">${icon}</span>
                      <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${e.snap_identificacion || 'Registro'}</div>
                    </div>
                    <div class="text-[0.6rem] text-gray font-800 uppercase mt-4">
                      ${Icons.calendar()} <span style="color: var(--p-gold);">${this._fmtFecha(e.fecha)}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end justify-between flex-shrink-0">
                    <div style="background:${itemColor}15; color:${itemColor}; border: 1px solid ${itemColor}40; filter: drop-shadow(0 0 4px ${itemColor}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                      ${e.valor_neto} ${e.unidad || ''}
                    </div>
                    <span style="font-size: 0.7rem; font-weight: 800; color: var(--c-warning); text-transform: uppercase;">Ficha ${Icons.flechaDerecha()}</span>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          ${Icons.rebanos()} LISTADO DE LOTES
        </div>
        <div class="grid gap-10 mb-20">
          ${rebanosModo.slice(0, 10).map(r => `
            <div class="card-registro" onclick="location.hash='/rebano?id=${r.id}'"
                 style="--registro-color: ${meta.color}; display:flex; gap:10px; align-items:stretch;">
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${r.nombre}</div>
                <div class="text-[0.6rem] text-gray font-800 uppercase mt-2">Tipo: ${r.tipo}</div>
              </div>
              <div class="flex flex-col items-end justify-between flex-shrink-0">
                <div style="background:${meta.color}15; color:${meta.color}; border: 1px solid ${meta.color}40; filter: drop-shadow(0 0 4px ${meta.color}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                  ID ${r.id}
                </div>
                <span style="font-size: 0.7rem; font-weight: 800; color: var(--c-warning); text-transform: uppercase;">Ficha ${Icons.flechaDerecha()}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
    `;
  },

  _changeMode(mode) {
    this._activeMode = mode;
    if (window.ModoContextoHelper) ModoContextoHelper.setModeForBlock('ganaderia', mode);
    this.render();
  },

  _abrirOpcionesRegistro(eventId, entidadTipo, entidadId) {
    if (entidadTipo === 'animal' && entidadId) {
        location.hash = `#/animal?id=${entidadId}`;
    } else if (entidadTipo === 'rebano' && entidadId) {
        location.hash = `#/rebano?id=${entidadId}`;
    } else {
        if (window.ExplotacionView && typeof window.ExplotacionView._abrirOpcionesRegistro === 'function') {
            window.ExplotacionView._abrirOpcionesRegistro(eventId, this._activeMode);
        } else {
            App?.toast(`Visualizando registro #${eventId}`);
        }
    }
  },
};

window.GanaderiaView = GanaderiaView;
