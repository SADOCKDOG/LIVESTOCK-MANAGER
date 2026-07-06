/**
 * Livestock Manager - RebanosView v1.0.0
 * Vista de Rebaños extraída de App.js para modularización.
 * Copia espejo de js/views/rebanos-view.js
 */

const RebanosView = {
  async render() {
    if (window.App) App.updateHeaderColor('rebanos');
    const main = document.getElementById("app-content");
    const rebanos = await Rebanos.list();
    const eventos = await window.db.getAll('registro_eventos').catch(() => []);
    const totalRebanos = rebanos.length;
    const rebanosActivos = rebanos.filter(r => r.estado !== 'inactivo').length;
    let html = `
      <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24" style="--theme-color: var(--c-info);">
        <div class="section-header-theme">ACCIONES</div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="RebanosView._crearRebano()">
            ${Icons.agregar()}
            <span class="widget-link-label">Nuevo Rebaño</span>
          </button>
        </div>
        <div class="mt-4"><span class="text-xs text-aaa leading-relaxed">${Icons.rebanos()} Creación y gestión de lotes, rebaños y agrupaciones ganaderas</span></div>
      </div>`;

    if (rebanos.length === 0)
      html += `<div class="empty-state"><div class="empty-state-icon" style="color:var(--c-info);">${Icons.rebanos()}</div><p class="empty-state-text">No hay rebaños registrados.</p></div>`;
    else {
      // Barra de resumen de Rebaños
      const carneCount = rebanos.filter(r => (r.tipo || '').toLowerCase().includes('carne') || (r.tipo || '').toLowerCase().includes('cárn')).length;
      const lecheCount = rebanos.filter(r => (r.tipo || '').toLowerCase().includes('leche') || (r.tipo || '').toLowerCase().includes('láct')).length;
      const hibridoCount = rebanos.filter(r => (r.tipo || '').toLowerCase().includes('mixt') || (r.tipo || '').toLowerCase().includes('híbr') || (r.tipo || '').toLowerCase().includes('doble')).length;

      html += `
        <div class="flex flex-wrap gap-4 mb-10">
          <span class="badge badge-sm badge-gold flex items-center gap-4 uppercase">${Icons.carne()} Carne: ${carneCount}</span>
          <span class="badge badge-sm badge-blue flex items-center gap-4 uppercase">${Icons.leche()} Leche: ${lecheCount}</span>
          <span class="badge badge-sm badge-purple flex items-center gap-4 uppercase">${Icons.rotacion()} Híbridos: ${hibridoCount}</span>
          <span class="badge badge-sm badge-green flex items-center gap-4 uppercase">${Icons.check()} ${rebanosActivos} ${rebanosActivos === 1 ? 'activo' : 'activos'}</span>
        </div>`;

      html += `<div class="grid gap-15">`;
      for (let r of rebanos) {
        const animales = await Animales.list(r.id);
        const n = animales.length;
        const activos = animales.filter(a => a.estado === 'activo').length;
        const eventosReb = eventos.filter(e => e.entidad_id === r.id || (e.tipo_entidad === 'rebano' && e.snap_identificacion === r.nombre));
        const ultimoEvento = eventosReb.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        const prodLeche = eventosReb.filter(e => e.unidad === 'L').reduce((s, e) => s + (e.valor_neto || 0), 0);
        const colorEstado = r.estado !== 'inactivo' ? 'var(--c-success)' : '#6b7280';
        const colorEspecie = window.ModoContextoHelper ? window.ModoContextoHelper.getEspecieColor(r.especie) : colorEstado;

        html += `
          <div class="card-registro" onclick="location.hash='/rebano?id=${r.id}'" style="--registro-color: ${colorEspecie};">
            <div class="flex flex-col gap-10">
              <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-10 min-w-0">
                  <div class="text-xl" style="color:${colorEspecie}">${Icons.rebanos()}</div>
                  <div class="text-xs">
                    <div class="font-bold text-white uppercase text-base tracking-tight" style="color:${colorEspecie} !important;">${r.nombre}</div>
                    <div class="text-gray mt-2 font-700 uppercase"><span style="color:${colorEspecie}; opacity:0.9; font-weight:900;">${(r.especie || 'N/D').toUpperCase()}</span> · ${(r.tipo || 'Sin Tipo')}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="badge badge-sm uppercase" style="background:${colorEstado}15; color:${colorEstado}; border:1px solid ${colorEstado}35;">${activos} ${activos === 1 ? 'Activo' : 'Activos'}</span>
                </div>
              </div>

              <div class="flex justify-between items-end w-full">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap gap-x-12 gap-y-3 text-[0.65rem] text-gray font-800 uppercase">
                    <div class="flex items-center gap-4">${Icons.zonas()} ${r.zonaActual || "Finca General"}</div>
                    <div class="flex items-center gap-4">${Icons.animales()} ${n} Total</div>
                    ${prodLeche > 0 ? `<div class="flex items-center gap-4 text-gold">${Icons.leche()} ${Math.round(prodLeche).toLocaleString('es-ES')} L</div>` : ''}
                    ${ultimoEvento ? `<div class="flex items-center gap-4 text-aaa">${Icons.calendar()} ${new Date(ultimoEvento.fecha).toLocaleDateString()}</div>` : ''}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[0.45rem] text-gray-700 font-900 uppercase tracking-widest">VER DETALLE ➔</div>
                </div>
              </div>
            </div>
          </div>`;
      }
      html += `</div>`;
    }
    html += `<!-- Botón Flotante de Acción para móviles -->
      <button class="fab-btn" onclick="RebanosView._crearRebano()" title="Nuevo Rebaño">${Icons.agregar()}</button>`;
    main.innerHTML = html;
  },

  async renderDetalle(params) {
    const id = params.get("id");
    const rebano = await Rebanos.get(id);
    const animales = await Animales.list(id);
    const finca = await Fincas.getActive();
    const zonas = finca ? (finca.zonas || []).filter(z => !z?.anulada) : [];
    const especies = await window.db.getAll("config_especies");
    const tipos = await window.db.getAll("config_tipos_produccion");
    const tiposExplotacionREGA = window.ComunidadesService ? window.ComunidadesService.getTiposExplotacionREGA() : [];
    const eventos = await window.db.getAll('registro_eventos').catch(() => []);
    const eventosReb = eventos.filter(e => e.entidad_id === Number(id) || (e.tipo_entidad === 'rebano' && e.snap_identificacion === rebano.nombre));
    const totalKg = eventosReb.filter(e => e.unidad === 'kg').reduce((s, e) => s + (e.valor_neto || 0), 0);
    const totalLeche = eventosReb.filter(e => e.unidad === 'L').reduce((s, e) => s + (e.valor_neto || 0), 0);
    const activos = animales.filter(a => a.estado === 'activo').length;
    const vendidos = animales.filter(a => a.estado === 'vendido').length;
    const porCategoria = {};
    animales.forEach(a => { const c = a.categoria || 'Sin categoría'; porCategoria[c] = (porCategoria[c] || 0) + 1; });

    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/rebanos" class="link-back">← Volver</a><h2 class="mt-10 flex items-center gap-8">${Icons.rebanos()} ${rebano.nombre}</h2></div>

      <!-- KPIs -->
      <div class="grid grid-cols-3 gap-8 mb-20">
        <div class="info-box-center border-left-amber"><small class="s-lbl">TOTAL</small><div class="inf-val-lg text-amber">${animales.length}</div></div>
        <div class="info-box-center border-left-green"><small class="s-lbl">ACTIVOS</small><div class="inf-val-lg text-green">${activos}</div></div>
        <div class="info-box-center border-left-red"><small class="s-lbl">VENDIDOS</small><div class="inf-val-lg text-red">${vendidos}</div></div>
        <div class="info-box-center border-left-blue"><small class="s-lbl flex items-center gap-4 justify-center">${Icons.carne()} kg</small><div class="inf-val-lg text-blue">${Math.round(totalKg).toLocaleString('es-ES')}</div></div>
        <div class="info-box-center border-left-gold"><small class="s-lbl flex items-center gap-4 justify-center">${Icons.leche()} LITROS</small><div class="inf-val-lg text-gold">${Math.round(totalLeche).toLocaleString('es-ES')}</div></div>
        <div class="info-box-center border-left-purple"><small class="s-lbl flex items-center gap-4 justify-center">${Icons.registros()} EVENTOS</small><div class="inf-val-lg text-purple">${eventosReb.length}</div></div>
      </div>

      <!-- Categorías -->
      ${Object.keys(porCategoria).length > 0 ? `
      <div class="card mb-20 border-top-3px border-top-3px-purple p-12">
        <div class="inf-section-title mb-6 flex items-center gap-8">${Icons.documento()} POR CATEGORÍA</div>
        <div class="flex flex-wrap gap-4">${Object.entries(porCategoria).map(([c, n]) => `<span class="badge badge-sm badge-purple font-900">${c.toUpperCase()}: ${n}</span>`).join('')}</div>
      </div>` : ''}

      <!-- Edición -->
      <div class="card border-top-3px border-top-3px-gold mb-25 p-16">
        <div class="inf-card-title flex items-center gap-8 mb-16">${Icons.editar()} DATOS DEL REBAÑO</div>
        <div class="flex flex-col gap-15">
          <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Nombre</label>
          <input type="text" id="r-edit-nombre" value="${rebano.nombre}" class="premium-input font-800"></div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Especie</label>
            <select id="r-edit-especie" class="premium-input font-800">
              ${especies.map((e) => `<option value="${e.nombre}" ${rebano.especie === e.nombre ? "selected" : ""}>${e.nombre.toUpperCase()}</option>`).join("")}
            </select></div>
            <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Tipo</label>
            <select id="r-edit-tipo" class="premium-input font-800">
              ${tipos.map((t) => `<option value="${t.nombre}" ${rebano.tipo === t.nombre ? "selected" : ""}>${t.nombre.toUpperCase()}</option>`).join("")}
            </select></div>
          </div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Capacidad Máxima</label>
            <input type="number" id="r-edit-capacidad" value="${rebano.capacidad_total || ''}" class="premium-input font-800"></div>
            <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Código de Lote</label>
            <input type="text" id="r-edit-lote" value="${rebano.codigo_lote || ''}" class="premium-input font-800"></div>
          </div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Fecha Constitución</label>
            <input type="date" id="r-edit-fecha" value="${rebano.fecha_constitucion || ''}" class="premium-input font-800"></div>
            <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Ubicación (Zona)</label>
            <select id="r-edit-zona" class="premium-input border-gold font-800">
              <option value="">SIN ASIGNAR</option>
              ${zonas.map((z) => `<option value="${z.nombre}" ${rebano.zonaActual === z.nombre ? "selected" : ""}>${z.nombre.toUpperCase()}</option>`).join("")}
            </select></div>
          </div>
          <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">TIPO DE EXPLOTACIÓN REGA (RD 787/2023)</label>
          <select id="r-edit-tipo-explotacion-rega" class="premium-input border-green font-800">
            <option value="">— SELECCIONAR —</option>
            ${tiposExplotacionREGA.map((t) => `<option value="${t}" ${rebano.tipo_explotacion_rega === t ? "selected" : ""}>${t.toUpperCase()}</option>`).join("")}
          </select></div>
          <div><label class="form-label uppercase font-900 text-[0.65rem] text-gray">Notas / Observaciones</label>
          <textarea id="r-edit-notas" class="premium-input font-700 uppercase" style="height:80px; resize:none;">${rebano.notas || ''}</textarea></div>
        </div>
        <div class="flex gap-10 mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-danger flex-1" onclick="RebanosView._eliminarRebano(${id})">
            ${Icons.eliminar()}
            <span class="widget-link-label">Eliminar</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-success flex-2" onclick="RebanosView._guardarRebano(${id})">
            ${Icons.guardar()}
            <span class="widget-link-label">Guardar Datos</span>
          </button>
        </div>
      </div>
      
      <!-- Sanidad -->
      <div class="card mb-20 border-222 card-dark-gradient p-12 pb-24" style="--theme-color: var(--c-success);">
        <div class="section-header-theme">SANIDAD</div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-12 mb-16">
          <button class="widget-link-btn widget-link-btn--neon neon-success" onclick="App._registrarTratamiento(${id})">
            ${Icons.agregar()}
            <span class="widget-link-label">Añadir Trat.</span>
          </button>
        </div>
        <div id="lista-sanitarios-rebano" class="mt-10"></div>
      </div>

      <!-- Animales -->
      <div class="card p-12 mb-16 border-222 card-dark-gradient pb-24">
        <div class="section-header-theme" style="--theme-color: var(--c-info)">ANIMALES (${animales.length})</div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-12">
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="App._abrirSelectorAnimales(${id})">
            ${Icons.rotacion()}
            <span class="widget-link-label">Mover Lote</span>
          </button>
        </div>
      </div>
      <div class="grid gap-10">
        ${animales.map((a) => {
          const colorEsp = window.ModoContextoHelper ? window.ModoContextoHelper.getEspecieColor(a.especie) : '#888';
          const colorEst = a.estado === 'activo' ? 'var(--c-success)' : a.estado === 'vendido' ? 'var(--c-warning)' : 'var(--c-danger)';
          return `<div class="card card-item" style="border-left:4px solid ${colorEsp}; background: rgba(0,0,0,0.2);" onclick="location.hash='/animal?id=${a.id}'">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-10">
                <span style="color:${colorEsp}">${Icons.animales()}</span>
                <div class="text-xs">
                  <div class="text-white font-900 uppercase" style="color:${colorEsp} !important;">${a.numero_identificacion || a.nombre || '#' + a.id}</div>
                  <div class="text-gray-500 font-800 text-[0.6rem] uppercase mt-2">${a.raza || 'S/R'} · <span style="color:${colorEsp}; opacity:0.7;">${a.categoria || ''}</span></div>
                </div>
              </div>
              <div class="flex items-center gap-8">
                <span class="badge badge-sm uppercase" style="background:${colorEst}15; color:${colorEst}; border:1px solid ${colorEst}35; font-size: 0.55rem;">${a.estado}</span>
                <span class="text-amber text-sm font-900">${Icons.flechaDerecha()}</span>
              </div>
            </div>
          </div>`;
        }).join("") || '<div class="text-gray text-center p-20">Sin animales en este rebaño</div>'}
      </div>`;
    this._cargarHistorialSanitario(id);
  },

  async _cargarHistorialSanitario(rebanoId) {
    const container = document.getElementById("lista-sanitarios-rebano");
    if (!container) return;
    try {
      const tratamientos = await window.db.getAll("sanitarios_ganado") || [];
      const filtrados = tratamientos.filter(t => t.rebanoId == rebanoId);
      if (filtrados.length === 0) {
        container.innerHTML = `<div class="empty-state border border-222"><div class="empty-state-icon" style="color:#555;">${Icons.buscar()}</div><p class="empty-state-text uppercase font-900 text-xs">Sin tratamientos registrados</p></div>`;
        return;
      }
      let html = '';
      filtrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      filtrados.forEach(t => {
        html += `<div class="info-box-sm border-left-green mt-8 bg-black">
          <div class="flex justify-between items-center"><span class="text-white font-black uppercase text-sm">${Icons.sanidad()} ${t.medicamento}</span><span class="text-gray-500 font-900 text-[0.6rem]">${new Date(t.fecha).toLocaleDateString()}</span></div>
          <div class="text-gray text-[0.65rem] mt-6 uppercase font-800 tracking-wider">Retiro carne: <strong class="text-red">${t.tiempo_espera_carne_dias || 0} D</strong> ${t.prohibidoLeche ? ' | <strong class="text-red">PROHIBIDO LECHE</strong>' : ''}</div>
        </div>`;
      });
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<p class="text-red text-sm font-900 uppercase">Error cargando historial</p>';
    }
  },

  async _guardarRebano(id) {
    try {
      const r = await Rebanos.get(id);
      r.nombre = document.getElementById("r-edit-nombre").value.trim();
      r.especie = document.getElementById("r-edit-especie").value;
      r.tipo = document.getElementById("r-edit-tipo").value;
      r.zonaActual = document.getElementById("r-edit-zona").value;
      r.capacidad_total = Number(document.getElementById("r-edit-capacidad").value) || 0;
      r.codigo_lote = document.getElementById("r-edit-lote").value.trim();
      r.fecha_constitucion = document.getElementById("r-edit-fecha").value;
      r.tipo_explotacion_rega = document.getElementById("r-edit-tipo-explotacion-rega").value;
      r.notas = document.getElementById("r-edit-notas").value.trim();
      if (!r.nombre) return App.toastError("Nombre requerido");
      await Rebanos.save(r);
      App.toast("Rebaño actualizado");
      App.renderRebanos();
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _crearRebano() {
    const especies = await window.db.getAll("config_especies");
    const tipos = await window.db.getAll("config_tipos_produccion");
    const tiposExplotacionREGA = window.ComunidadesService ? window.ComunidadesService.getTiposExplotacionREGA() : [];
    const finca = await Fincas.getActive();
    const zonas = finca ? finca.zonas || [] : [];

    if (especies.length === 0 || tipos.length === 0) {
      App.toastError("Configura Especies/Tipos en Ajustes");
      return;
    }

    const wizardSteps = [
      {
        content: (data) => `
          <div class="card card-accent card-accent-amber p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-info)">IDENTIFICACIÓN</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">NOMBRE DEL REBAÑO / LOTE</label>
              <input type="text" id="w-reb-nombre" value="${data.nombre}" placeholder="EJ: LOTE ENGORDE A..." class="wizard-input uppercase font-800">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ESPECIE PRINCIPAL</label>
              <select id="w-reb-especie" class="wizard-input font-800">
                ${especies.map((e) => `<option value="${e.nombre}" ${data.especie === e.nombre ? "selected" : ""}>${e.nombre.toUpperCase()}</option>`).join("")}
              </select>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.nombre = document.getElementById('w-reb-nombre')?.value.trim() || data.nombre;
          data.especie = document.getElementById('w-reb-especie')?.value || data.especie;
        },
        validate: async (data) => {
          if (!data.nombre) {
            App.toastError("El nombre del rebaño es obligatorio");
            return false;
          }
          return true;
        }
      },
      {
        content: (data) => `
          <div class="card card-accent card-accent-green p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-success)">UBICACIÓN Y TIPO</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">TIPO DE PRODUCCIÓN</label>
              <select id="w-reb-tipo" class="wizard-input font-800">
                ${tipos.map((t) => `<option value="${t.nombre}" ${data.tipo === t.nombre ? "selected" : ""}>${t.nombre.toUpperCase()}</option>`).join("")}
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ZONA / PARCELA INICIAL</label>
              <select id="w-reb-zona" class="wizard-input font-800" style="border-color: var(--c-warning);">
                <option value="">SIN ASIGNAR (FINCA GENERAL)</option>
                ${zonas.map((z) => `<option value="${z.nombre}" ${data.zonaActual === z.nombre ? "selected" : ""}>${z.nombre.toUpperCase()}</option>`).join("")}
              </select>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.tipo = document.getElementById('w-reb-tipo')?.value || data.tipo;
          data.zonaActual = document.getElementById('w-reb-zona')?.value || data.zonaActual;
        }
      },
      {
        content: (data) => `
          <div class="card card-accent card-accent-blue p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-info)">REQUISITOS REGA</div>
            <div class="wizard-input-group">
              <label class="wizard-label">TIPO DE EXPLOTACIÓN REGA (RD 787/2023)</label>
              <select id="w-reb-tipo-explotacion" class="wizard-input font-800" style="border-color: var(--c-success);">
                <option value="">— SELECCIONAR —</option>
                ${tiposExplotacionREGA.map((t) => `<option value="${t}" ${data.tipo_explotacion_rega === t ? "selected" : ""}>${t.toUpperCase()}</option>`).join("")}
              </select>
              <small class="text-aaa uppercase font-700 text-[0.55rem] mt-4 block">Dato normativo obligatorio para SIGGAN/BADIGEX</small>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.tipo_explotacion_rega = document.getElementById('w-reb-tipo-explotacion')?.value || data.tipo_explotacion_rega;
        }
      },
      {
        content: (data) => `
          <div class="card card-accent card-accent-gold p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-info)">CAPACIDAD Y TRAZABILIDAD</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">CAPACIDAD / AFORO MÁXIMO</label>
              <input type="number" id="w-reb-capacidad" value="${data.capacidad_total || ''}" placeholder="EJ: 100" class="wizard-input font-800">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CÓDIGO DE LOTE / LOTE IDENT.</label>
              <input type="text" id="w-reb-lote" value="${data.codigo_lote || ''}" placeholder="EJ: LOTE-2026-A" class="wizard-input uppercase font-800">
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.capacidad_total = Number(document.getElementById('w-reb-capacidad')?.value) || 0;
          data.codigo_lote = document.getElementById('w-reb-lote')?.value.trim() || '';
        }
      },
      {
        content: (data) => `
          <div class="card card-accent card-accent-amber p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-info)">FECHA Y NOTAS</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">FECHA DE CONSTITUCIÓN</label>
              <input type="date" id="w-reb-fecha" value="${data.fecha_constitucion}" class="wizard-input font-800">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">OBSERVACIONES</label>
              <textarea id="w-reb-notas" placeholder="DETALLES ADICIONALES..." class="wizard-input font-700 uppercase" style="height:80px; resize:none; font-size:0.8rem;">${data.notas || ''}</textarea>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.fecha_constitucion = document.getElementById('w-reb-fecha')?.value || data.fecha_constitucion;
          data.notas = document.getElementById('w-reb-notas')?.value.trim() || '';
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-nuevo-rebano',
      title: 'NUEVO REBAÑO',
      initialData: {
        nombre: "",
        especie: especies[0].nombre,
        tipo: tipos[0].nombre,
        zonaActual: "",
        tipo_explotacion_rega: "",
        capacidad_total: "",
        codigo_lote: "",
        fecha_constitucion: new Date().toISOString().split("T")[0],
        notas: ""
      },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          await Rebanos.save({
            nombre: finalData.nombre,
            especie: finalData.especie,
            tipo: finalData.tipo,
            zonaActual: finalData.zonaActual,
            tipo_explotacion_rega: finalData.tipo_explotacion_rega,
            capacidad_total: Number(finalData.capacidad_total) || 0,
            codigo_lote: finalData.codigo_lote,
            fecha_constitucion: finalData.fecha_constitucion,
            notas: finalData.notas,
            estado: "activo",
          });
          App.toast("Rebaño creado exitosamente");
          App.route();
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  },

  async _eliminarRebano(id) {
    const ans = await Animales.list(id);
    if (ans.filter(a => (a.estado || 'activo') === 'activo').length > 0)
      return App.toastError("No se puede eliminar un rebaño con animales.");
    if (!await Confirm.confirm("Anular Rebaño", "¿Anular este rebaño? Se conservará histórico de auditoría.", true)) return;
    try {
      await Rebanos.delete(id);
      App.toast("Rebaño anulado");
      location.hash = "#/rebanos";
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.RebanosView = RebanosView;




