/**
 * Livestock Manager - GanaderiaView v1.0.0
 * Bloque consolidado de Ganadería con modo independiente (carne/leche/híbrido).
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
    const fincaId = await Fincas.getActiveId();
    if (!fincaId) {
      main.innerHTML = `<div class="p-20 text-center"><p class="text-gray">No hay ninguna finca seleccionada.</p></div>`;
      return;
    }

    const [rebanos, animales, fincaActiva, eventosRaw] = await Promise.all([
      window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []),
      window.db.getAll('animales').catch(() => []),
      Fincas.getActive().catch(() => null),
      window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => [])
    ]);
    // Se excluyen las zonas anuladas, igual que en ZonasView.
    const zonas = (fincaActiva?.zonas || []).filter(z => z && !z.anulada);

    const eventos = (eventosRaw || []).filter(e => !e?.anulado);

    const savedMode = window.ModoContextoHelper
      ? ModoContextoHelper.getModeForBlock('ganaderia', rebanos)
      : 'leche';

    // Si ya tenemos un modo activo (por click manual), lo mantenemos.
    // Si no (primera carga), usamos el guardado/detectado.
    this._activeMode = this._activeMode || savedMode;

    const rebanosModo = window.ModoContextoHelper
      ? ModoConteoHelper.filterRebanosByMode(rebanos, this._activeMode)
      : rebanos;
    const rebanoIds = rebanosModo.map(r => r.id);
    const animalesModo = animales.filter(a => rebanoIds.includes(a.rebanoId));
    const animalesActivos = animalesModo.filter(a => (a.estado || 'activo') === 'activo');
    const especies = new Set(animalesModo.map(a => (a.especie || '').toLowerCase()).filter(Boolean));

    // Prepare mode-specific filtered records for recent activity
    let recientes = [];
    const temaColor = this._activeMode === 'leche' ? 'var(--c-info)' : (this._activeMode === 'hibrido' ? 'var(--c-success)' : 'var(--c-danger)');
    const iconFn = (tipoEntidad, unidad) => {
      if (tipoEntidad === 'animal') {
        return this._activeMode === 'carne' ? Icons.carne() : (this._activeMode === 'leche' ? Icons.leche() : Icons.rotacion());
      }
      // For rebano or silo, we fallback to mode icon
      return this._activeMode === 'carne' ? Icons.carne() : (this._activeMode === 'leche' ? Icons.leche() : Icons.rotacion());
    };
    const colorFn = (tipoEntidad, unidad) => {
      if (tipoEntidad === 'animal') {
        return this._activeMode === 'carne' ? 'var(--c-danger)' : (this._activeMode === 'leche' ? 'var(--c-info)' : 'var(--c-success)');
      }
      return this._activeMode === 'carne' ? 'var(--c-danger)' : (this._activeMode === 'leche' ? 'var(--c-info)' : 'var(--c-success)');
    };

    if (this._activeMode === 'carne') {
      // Pesajes: unidad kg, tipo_entidad animal/rebano, snap_tipo containing carne/cárn/mixt/híbr/doble
      recientes = eventos.filter(e => {
        if (!(e.unidad === 'kg' && (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano'))) return false;
        const rebanoOk = rebanoIds.has(e.rebanoId);
        const snap = (e.snap_tipo || '').toLowerCase();
        const snapOk = snap.includes('carne') || snap.includes('cárn') || snap.includes('mixt') || snap.includes('híbr') || snap.includes('doble');
        return rebanoOk || snapOk;
      }).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)).slice(0, 15);
    } else if (this._activeMode === 'leche') {
      // Ordeños: unidad L, motivo_tarea production_leche or control_lechero
      recientes = eventos.filter(e => {
        if (!((e.unidad === 'L' || e.unidad === 'Litros') && (e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'control_lechero'))) return false;
        const rebanoOk = rebanoIds.has(e.rebanoId);
        const snap = (e.snap_tipo || '').toLowerCase();
        const snapOk = snap.includes('leche') || snap.includes('láct') || snap.includes('mixt') || snap.includes('híbr') || snap.includes('doble');
        return rebanoOk || snapOk;
      }).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)).slice(0, 15);
    } else { // hibrido
      // Consolidado: unidad kg or L, tipo_entidad animal/rebano, and (rebanos hibrido or no rebano)
      const rebHibridoIds = window.ModoContextoHelper ? ModoContextoHelper.filterRebanosByMode(rebanos, 'hibrido').map(r => r.id) : [];
      const rebHibridoSet = new Set(rebHibridoIds);
      recientes = eventos.filter(e => {
        if (!(e.unidad === 'kg' || e.unidad === 'L' || e.unidad === 'Litros') && (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano')) return false;
        const rebanoOk = e.rebanoId ? rebHibridoSet.has(e.rebanoId) : true;
        return rebanoOk;
      }).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)).slice(0, 15);
    }

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

      ${recientes.length > 0 ? `
      <div class="card-registro p-14 mb-14 border-222" style="--registro-color: ${temaColor};">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${this._activeMode === 'carne' ? Icons.carne() : (this._activeMode === 'leche' ? Icons.leche() : Icons.rotacion())} RECENTES REGISTROS (${this._activeMode === 'carne' ? 'Pesajes' : this._activeMode === 'leche' ? 'Ordeños' : 'Consolidado'})
        </div>
        <div class="grid gap-8">
          ${recientes.map(e => {
            const icon = iconFn(e.tipo_entidad, e.unidad);
            const color = colorFn(e.tipo_entidad, e.unidad);
            const valor = e.valor_neto !== null ? Number(e.valor_neto).toLocaleString('es-ES') : '0';
            const unidadTexto = e.unidad === 'kg' ? 'kg' : (e.unidad === 'L' || e.unidad === 'Litros') ? 'L' : '';
            return `
              <div class="card-registro" onclick="GanaderiaView._abrirOpcionesRegistro(${e.id}, '${this._activeMode}')" style="--registro-color: ${color}; display:flex; gap:10px; align-items:stretch;">
                <div class="flex-1 min-w-0 flex flex-col gap-8">
                  <div class="flex items-center gap-10 min-w-0">
                    <span class="text-xl" style="color:${color};">${icon}</span>
                    <div class="font-bold text-white uppercase">${e.snap_identificacion || 'Registro'}</div>
                  </div>
                  <div class="flex flex-wrap gap-x-12 gap-y-3 text-[0.65rem] text-gray font-800 uppercase">
                    <div class="flex items-center gap-4">${Icons.calendar()} ${this._fmtFecha(e.fecha)}</div>
                  </div>
                </div>
                <div class="flex flex-col items-end justify-between flex-shrink-0" style="gap:8px;">
                  <span class="badge badge-sm font-bold text-red badge-red-outline" style="font-size:0.75rem; white-space:nowrap;">${valor} ${unidadTexto}</span>
                  <span style="font-size:0.7rem; font-weight:700; color:var(--c-warning); white-space:nowrap;">Ficha -></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <div class="card-registro p-14 mb-14 border-222" style="--registro-color: ${meta.color};">
        <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-6 pb-5">
          ${Icons.documento()} Rebaños del modo ${meta.label}
        </div>
        <div class="gap-8">
          ${rebanosModo.length > 0
            ? rebanosModo.slice(0, 8).map(r => `
              <a href="#/rebano?id=${r.id}" class="card-registro" style="--registro-color: ${meta.color};">
                <div class="flex justify-between items-center">
                  <div class="text-xs">
                    <div class="registro-titulo">${r.nombre || 'Rebaño'}</div>
                    <div class="registro-sub">Tipo: ${r.tipo || 'N/D'}</div>
                  </div>
                  <span class="badge badge-sm" style="background:${meta.color}15; color:${meta.color}; border:1px solid ${meta.color}35;">ID ${r.id}</span>
                </div>
              </a>
            `).join('')
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
            const sexoIcon = a.sexo === 'H' ? Icons.hembra() : (a.sexo === 'M' ? Icons.macho() : '');
            const edad = (a.fecha_nacimiento || a.fechaNacimiento) ? Math.floor((new Date() - new Date(a.fecha_nacimiento || a.fechaNacimiento)) / (1000 * 60 * 60 * 24 * 365)) : null;
            return `
              <a href="#/animal?id=${a.id}" class="card-registro" style="--registro-color: ${meta.color};">
                <div class="flex justify-between items-start gap-6">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-6">
                      <span class="text-lg font-black text-gold uppercase tracking-tight">${a.numero_identificacion || a.nombre || \`#${a.id}\`}</span>
                      <span class="text-gray-400" style="font-size:0.7rem;">${sexoIcon}</span>
                    </div>
                    <div class="flex flex-wrap gap-x-8 gap-y-1 text-[0.6rem] text-gray font-700 uppercase mt-2 leading-tight">
                      <span>${(a.especie || 'N/D')} · ${(a.raza || 'N/D')}</span>
                      ${edad !== null ? `<span>${edad} ${edad === 1 ? "año" : "años"}</span>` : ''}
                      <span class="flex items-center gap-3">${Icons.rebanos()} ${reb?.nombre || 'Sin Lote'}</span>
                    </div>
                  </div>
                  <span class="badge badge-sm uppercase flex-shrink-0" style="background:${meta.color}15; color:${meta.color}; border:1px solid ${meta.color}35;">${a.estado || 'activo'}</span>
                </div>
              </a>
            `;
          }).join('')}
        </div>`
        : `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin animales para este modo</span></div>`}
      </div>
    `;
  },

  _changeMode(mode) {
    this._activeMode = mode;
    if (window.ModoContextoHelper) ModoContextoHelper.setModeForBlock('ganaderia', mode);
    this.render();
  },

  // Optional: method to open registro options (similar to ExplotacionView)
  _abrirOpcionesRegistro(id, tipo) {
    // Reuse ExplotacionView's method if available, otherwise simple alert
    if (window.ExplotacionView && typeof Window.ExplotacionView._abrirOpcionesRegistro === 'function') {
      window.ExplotacionView._abrirOpcionesRegistro(id, tipo);
    } else {
      alert(`Ver registro ${id} de tipo ${tipo}`);
    }
  },
};

window.GanaderiaView = GanaderiaView;