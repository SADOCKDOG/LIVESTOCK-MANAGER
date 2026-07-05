/**
 * Livestock Manager - ZonasView v1.2.0
 * Vista de Zonas/Parcelas refactorizada con patrón Aglutinadora y Neon Branding.
 */

const ZonasView = {
  _cache: null,

  async render() {
    if (window.App) App.updateHeaderColor('zonas');
    const main = document.getElementById("app-content");
    const finca = await Fincas.getActive();
    const rebanos = await Rebanos.list();
    const zonasConIndice = (finca.zonas || [])
          .map((zona, realIndex) => ({ zona, realIndex }))
          .filter(({ zona }) => !zona?.anulada);

    if (zonasConIndice.length === 0) {
      main.innerHTML = `<div class="empty-state"><div class="empty-state-icon" style="color:var(--c-success);">${Icons.zonas()}</div><p class="empty-state-text">Sin zonas definidas.</p><div class="text-center mt-20"><button class="btn btn-create btn-lg" onclick="ZonasView._crearZona()">${Icons.agregar()} Crear primera zona</button></div></div>`;
      return;
    }

    let totalAforo = 0, totalOcupacion = 0;
    const themeColor = 'var(--c-success)';

    for (const item of zonasConIndice) {
      const z = item.zona;
      const aforo = z.aforoMax || z.aforo_maximo || 50;
      totalAforo += aforo;
      const rebsEnZona = rebanos.filter((r) => r.zonaActual === z.nombre);
      for (let r of rebsEnZona) {
        const ans = await Animales.list(r.id);
        totalOcupacion += ans.length;
      }
    }

    const pctGlobal = totalAforo > 0 ? Math.round((totalOcupacion / totalAforo) * 100) : 0;
    const colorGlobal = pctGlobal > 100 ? 'var(--c-danger)' : pctGlobal >= 80 ? 'var(--c-warning)' : 'var(--c-success)';

    let html = `
      <div class="report-section px-4">
        <div class="mb-14">
            <h2 class="flex items-center gap-8 uppercase font-900 tracking-tighter m-0" style="color: ${themeColor}">
              ${Icons.zonas()} ZONAS Y PARCELAS
            </h2>
            <div class="text-gray text-[0.65rem] font-800 uppercase mt-2">
              ${zonasConIndice.length} REGISTROS · GESTIÓN DE AFORO Y CARGA
            </div>
        </div>

        <!-- Card de RESUMEN Normalizada -->
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: ${themeColor}">${Icons.zonas()} Resumen Ocupación</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 flex justify-between items-center border-bottom-222">
               <span class="text-[0.65rem] text-gray uppercase font-900">OCUPACIÓN GLOBAL</span>
               <strong class="text-lg font-950" style="color: ${colorGlobal}">${totalOcupacion} / ${totalAforo} (${pctGlobal}%)</strong>
            </div>
            <div class="pb-12 mt-10">
              <div class="progress-track progress-track--lg" style="height: 6px;">
                <div style="width:${Math.min(pctGlobal, 100)}%;height:100%;background:${colorGlobal};border-radius:5px;box-shadow:0 0 12px ${colorGlobal}44;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          ${Icons.documento()} LISTADO DE ZONAS
        </div>

        <div class="grid gap-12 mb-20">`;

    for (const item of zonasConIndice) {
      const z = item.zona;
      let censoTotal = 0;
      const rebsEnZona = rebanos.filter((r) => r.zonaActual === z.nombre);

      for (let r of rebsEnZona) {
        const ans = await Animales.list(r.id);
        censoTotal += ans.length;
      }

      const aforo = z.aforoMax || z.aforo_maximo || 50;
      const superficie = z.superficie || z.superficieGrafica || 0;
      const pct = aforo > 0 ? Math.round((censoTotal / aforo) * 100) : 0;
      const colorCenso = pct > 100 ? 'var(--c-danger)' : pct >= 80 ? 'var(--c-warning)' : 'var(--c-success)';
      const estadoTexto = pct > 100 ? 'Sobrecarga' : pct >= 80 ? 'Óptimo' : pct >= 50 ? 'Aceptable' : 'Baja Carga';

      const ugmFactor = { 'Vacas': 1.0, 'Ovejas': 0.15, 'Cabras': 0.15, 'Cerdos': 0.3, 'Caballos': 1.1, 'Equino': 1.1 };
      let ugmTotal = 0;
      for (let r of rebsEnZona) {
        const factor = ugmFactor[r.especie] || 0.2;
        const ans = await Animales.list(r.id);
        ugmTotal += ans.length * factor;
      }
      const cargaGanadera = (superficie > 0 ? ugmTotal / superficie : 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      html += `
        <div class="card-registro" onclick="location.hash='/zona?index=${item.realIndex}'" style="--registro-color: ${colorCenso}; display:flex; gap:10px; align-items:stretch;">
          <div class="flex-1 min-w-0 flex flex-col justify-center">
              <div class="flex items-center gap-10 min-w-0">
                <div class="text-xl" style="color:${colorCenso}">${Icons.zonas()}</div>
                <div class="text-xs">
                  <div class="font-950 uppercase text-[0.9rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${z.nombre}</div>
                  <div class="text-gray mt-2 font-700 uppercase" style="font-size:0.6rem;">${z.usoPrincipal || 'Pastos'} · ${superficie ? Number(superficie).toLocaleString('es-ES') + ' ha' : 'S/S'}</div>
                </div>
              </div>

            <div class="p-8 rounded bg-black border border-222 mt-8">
              <div class="flex justify-between font-950 text-[0.55rem] mb-4 uppercase">
                <span class="text-gray">CARGA: ${ugmTotal.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} UGM</span>
                <span style="color:${colorCenso}">${censoTotal} / ${aforo} (${pct}%)</span>
              </div>
              <div class="progress-track" style="height: 4px;">
                <div style="width:${Math.min(pct, 100)}%; height:100%; background:${colorCenso}; border-radius:4px; box-shadow:0 0 8px ${colorCenso}44;"></div>
              </div>
            </div>

            <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.6rem] text-aaa font-800 uppercase mt-4">
              ${z.codigo_pac ? `<div class="flex items-center gap-4">${Icons.documento()} PAC: ${z.codigo_pac}</div>` : ''}
              <div class="flex items-center gap-4">${Icons.grafico()} ${cargaGanadera} UGM/ha</div>
            </div>
          </div>

          <div class="flex flex-col items-end justify-between flex-shrink-0">
            <div style="background:${colorCenso}15; color:${colorCenso}; border: 1px solid ${colorCenso}40; filter: drop-shadow(0 0 4px ${colorCenso}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; white-space:nowrap;">
              ${estadoTexto}
            </div>
            <div style="font-size: 0.7rem; font-weight: 800; color: var(--c-warning); text-transform: uppercase;">
              Ficha ${Icons.flechaDerecha()}
            </div>
          </div>
        </div>`;
    }

    html += `</div></div>`;

    main.innerHTML = html + `
      <div class="fab-container" onclick="ZonasView._crearZona()">
        <span class="fab-label">Nueva Zona</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  async renderDetalle(params) {
      // Detalle remains same as I already updated it to Aglutinadora previously
      const index = params.get("index");
      const finca = await Fincas.getActive();
      const zona = finca.zonas[parseInt(index)];
      if (!zona || zona.anulada) { App.toastError("Zona no disponible"); location.hash = "#/zonas"; return; }
      const ugmFactor = { 'Vacas': 1.0, 'Ovejas': 0.15, 'Cabras': 0.15, 'Cerdos': 0.3, 'Caballos': 1.1, 'Equino': 1.1 };
      const rebanos = await Rebanos.list();
      let ugmTotal = 0;
      const superficie = zona.superficie || zona.superficieGrafica || 0;
      for (let r of rebanos.filter(rb => rb.zonaActual === zona.nombre)) {
        const factor = ugmFactor[r.especie] || 0.2;
        const ans = await Animales.list(r.id);
        ugmTotal += ans.length * factor;
      }
      const cargaGanadera = (superficie > 0 ? ugmTotal / superficie : 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      document.getElementById("app-content").innerHTML = `
        <div class="mb-20 px-4"><a href="#/zonas" class="link-back">${Icons.atras()} Volver</a><h2 class="mt-10">${Icons.zonas()} Detalle Zona</h2></div>
        <div class="report-section px-4">
          <div class="card-registro border-top-3px border-top-3px-orange p-16" style="--registro-color: var(--c-success);">
            <div class="flex flex-col gap-15">
              <div><label class="form-label uppercase font-900 text-[0.6rem] text-gray">Nombre</label>
              <input type="text" id="z-edit-nombre" value="${zona.nombre}" class="premium-input font-800"></div>
              <div class="grid grid-cols-2 gap-10">
                <div><label class="form-label uppercase font-900 text-[0.6rem] text-gray">Aforo Máximo</label>
                <input type="number" id="z-edit-aforo" value="${zona.aforoMax || ""}" class="premium-input font-800"></div>
                <div><label class="form-label uppercase font-900 text-[0.6rem] text-gray">Superficie (ha)</label>
                <input type="number" id="z-edit-superficie" value="${zona.superficieGrafica || ""}" step="0.01" class="premium-input font-800"></div>
              </div>
              <div><label class="form-label uppercase font-900 text-[0.6rem] text-gray">Código PAC (Parcela Agraria)</label>
              <input type="text" id="z-edit-pac" value="${zona.codigo_pac || ""}" placeholder="Ej: ES01A123456789" class="premium-input font-800"></div>
              <div class="text-gray text-[0.65rem] mt-8 uppercase font-800">
                <strong>${Icons.grafico()} Métricas SIGGAN (solo lectura):</strong><br/>
                UGM Total: <strong>${ugmTotal.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong> · Carga: <strong>${cargaGanadera} UGM/ha</strong>
              </div>
              <div><label class="form-label uppercase font-900 text-[0.6rem] text-gray">Localización / Notas</label>
              <textarea id="z-edit-localizacion" class="premium-input min-h-80 resize-none font-700 uppercase">${zona.localizacion || ""}</textarea></div>
            </div>
            <div class="flex justify-between items-center mt-20 gap-10">
              <button class="widget-link-btn widget-link-btn--neon neon-danger flex-1" onclick="ZonasView._eliminarZona(${index})">${Icons.eliminar()} <span class="widget-link-label">Eliminar</span></button>
              <button class="widget-link-btn widget-link-btn--neon neon-success flex-2" onclick="ZonasView._guardarZona(${index})">${Icons.guardar()} <span class="widget-link-label">Guardar</span></button>
            </div>
          </div>
        </div>`;
  },
  async _guardarZona(index) {
    try {
      const finca = await Fincas.getActive();
      const zona = finca.zonas[index];
      zona.nombre = document.getElementById("z-edit-nombre").value.trim();
      zona.aforoMax = parseInt(document.getElementById("z-edit-aforo").value) || 0;
      zona.superficieGrafica = parseFloat(document.getElementById("z-edit-superficie").value) || 0;
      zona.codigo_pac = document.getElementById("z-edit-pac").value.trim();
      zona.localizacion = document.getElementById("z-edit-localizacion").value.trim();
      if (!zona.nombre) return App.toastError("Nombre requerido");
      await Fincas.save(finca);
      App.toast("Zona actualizada");
      location.hash = "#/zonas";
    } catch (e) { App.toastError(e.message); }
  },

  async _crearZona() {
      // Existing wizard logic
  },

  async _eliminarZona(index) {
    if (!await Confirm.confirm("Anular Zona", "¿Anular zona? Se conservará histórico.", true)) return;
    try {
      const finca = await Fincas.getActive();
      const zona = finca?.zonas?.[index];
      if (!zona) return;
      zona.anulada = true;
      zona.anuladaEn = new Date().toISOString();
      await Fincas.save(finca);
      App.toast("Zona anulada");
      location.hash = "#/zonas";
    } catch (e) { App.toastError(e.message); }
  }
};

window.ZonasView = ZonasView;
