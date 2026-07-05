/**
 * Livestock Manager - ZonasView v1.0.0
 * Vista de Zonas/Parcelas extraída de App.js para modularización.
 * Copia espejo de js/views/zonas-view.js
 */

const ZonasView = {
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

    // Pre-calcular totales para el resumen
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
      <div class="card-registro" style="--registro-color: ${themeColor}; padding: 15px;">
        <div class="flex justify-between items-start mb-10">
          <div>
            <h2 class="flex items-center gap-8 uppercase font-900 tracking-tighter m-0" style="color: ${themeColor}">
              ${Icons.zonas()} ZONAS Y PARCELAS
            </h2>
            <div class="text-gray text-[0.65rem] font-800 uppercase mt-2">
              ${zonasConIndice.length} REGISTROS · GESTIÓN DE AFORO Y CARGA
            </div>
          </div>
          <button class="resumen-toggle" onclick="App.toggleResumen(this)">
            ${Icons.chevronAbajo()}
          </button>
        </div>

        <!-- Card de RESUMEN: Ocupación Global -->
        <div class="card card-total-3d card-resumen mb-20">
          <div class="resumen-body flex flex-col gap-6">
            <div class="flex justify-between items-center px-4 py-8 border-bottom-222">
               <span class="text-gray text-[0.7rem] font-800 uppercase">OCUPACIÓN GLOBAL</span>
               <strong class="text-xl font-950" style="color: ${colorGlobal}">${totalOcupacion} / ${totalAforo} (${pctGlobal}%)</strong>
            </div>
            <div class="px-4 pb-12">
              <div class="progress-track progress-track--lg" style="height: 6px;">
                <div style="width:${Math.min(pctGlobal, 100)}%;height:100%;background:${colorGlobal};border-radius:5px;box-shadow:0 0 12px ${colorGlobal}44;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="inf-section-title mb-12 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.75rem]">
          ${Icons.documento()} LISTADO DE ZONAS
        </div>

        <div class="grid gap-15">`;

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
        <div class="card-registro" onclick="location.hash='/zona?index=${item.realIndex}'" style="--registro-color: ${colorCenso};">
          <div class="flex flex-col gap-10">
            <div class="flex justify-between items-center w-full">
              <div class="flex items-center gap-10 min-w-0">
                <div class="text-xl" style="color:${colorCenso}">${Icons.zonas()}</div>
                <div class="text-xs">
                  <div class="font-bold uppercase text-base tracking-tight" style="color:var(--p-gold);">${z.nombre}</div>
                  <div class="text-gray mt-2 font-700 uppercase">${z.usoPrincipal || 'Pastos'} · ${superficie ? Number(superficie).toLocaleString('es-ES') + ' ha' : 'S/S'}</div>
                </div>
              </div>
              <div class="text-right">
                <span class="badge badge-sm uppercase font-900" style="color:${colorCenso}; border:1px solid ${colorCenso}40; background:${colorCenso}15; font-size:0.55rem;">${estadoTexto}</span>
              </div>
            </div>

            <div class="p-8 rounded bg-black border border-222">
              <div class="flex justify-between font-900 text-[0.6rem] mb-4 uppercase">
                <span class="text-gray">CARGA: ${ugmTotal.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} UGM</span>
                <span style="color:${colorCenso}">${censoTotal} / ${aforo} (${pct}%)</span>
              </div>
              <div class="progress-track" style="height: 4px;">
                <div style="width:${Math.min(pct, 100)}%; height:100%; background:${colorCenso}; border-radius:4px; box-shadow:0 0 8px ${colorCenso}44;"></div>
              </div>
            </div>

            <div class="flex justify-between items-end w-full">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-x-12 gap-y-3 text-[0.6rem] text-aaa font-800 uppercase">
                  ${z.codigo_pac ? `<div class="flex items-center gap-4">${Icons.documento()} PAC: ${z.codigo_pac}</div>` : ''}
                  <div class="flex items-center gap-4">${Icons.grafico()} ${cargaGanadera} UGM/ha</div>
                </div>
              </div>
              <div class="text-right">
                <span style="font-size: 0.7rem; font-weight: 700; color: var(--c-warning); white-space: nowrap;">Ficha -></span>
              </div>
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
    const index = params.get("index");
    const finca = await Fincas.getActive();
    const zona = finca.zonas[parseInt(index)];
    if (!zona || zona.anulada) {
      App.toastError("Zona no disponible");
      location.hash = "#/zonas";
      return;
    }
    
    // Calcular UGM
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
      <div class="mb-20"><a href="#/zonas" class="link-back">← Volver</a><h2 class="mt-10">${Icons.zonas()} Detalle Zona</h2></div>
      <div class="card-registro border-top-3px border-top-3px-orange" style="--registro-color: var(--c-success);">
        <div class="flex flex-col gap-15">
          <div><label class="form-label">Nombre</label>
          <input type="text" id="z-edit-nombre" value="${zona.nombre}" class="premium-input"></div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label">Aforo Máximo</label>
            <input type="number" id="z-edit-aforo" value="${zona.aforoMax || ""}" class="premium-input"></div>
            <div><label class="form-label">Superficie (ha)</label>
            <input type="number" id="z-edit-superficie" value="${zona.superficieGrafica || ""}" step="0.01" class="premium-input"></div>
          </div>
          <div><label class="form-label">Código PAC (Parcela Agraria)</label>
          <input type="text" id="z-edit-pac" value="${zona.codigo_pac || ""}" placeholder="Ej: ES01A123456789" class="premium-input"></div>
          <div><label class="form-label">Distancia a Fuente de Agua (m)</label>
          <input type="number" id="z-edit-agua" value="${zona.distancia_agua_m || ""}" placeholder="Metros" class="premium-input"></div>
          <div class="text-gray text-xs mt-8">
            <strong>${Icons.grafico()} Métricas SIGGAN (solo lectura):</strong><br/>
            UGM Total: <strong>${ugmTotal.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong> · Carga: <strong>${cargaGanadera} UGM/ha</strong>
          </div>
          <div><label class="form-label">Localización</label>
          <textarea id="z-edit-localizacion" class="premium-input min-h-60 resize-none">${zona.localizacion || ""}</textarea></div>
        </div>
        <div class="flex justify-between items-center mt-20">
          <button class="btn btn-danger" onclick="ZonasView._eliminarZona(${index})">${Icons.eliminar()} Eliminar</button>
          <div class="flex gap-10">
            <button class="btn btn-secondary" onclick="location.hash='/zonas'">${Icons.cerrar()} Cancelar</button>
            <button class="btn btn-success" onclick="ZonasView._guardarZona(${index})">${Icons.guardar()} Guardar</button>
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
      zona.distancia_agua_m = parseInt(document.getElementById("z-edit-agua").value) || 0;
      zona.localizacion = document.getElementById("z-edit-localizacion").value.trim();
      if (!zona.nombre) return App.toastError("Nombre requerido");
      await Fincas.save(finca);
      App.toast("Zona actualizada");
      location.hash = "#/zonas";
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _crearZona() {
    const wizardSteps = [
      {
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">NOMBRE DE LA ZONA / PARCELA</label>
              <input type="text" id="w-zona-nombre" value="${data.nombre}" placeholder="Ej: Parcela Norte..." class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">AFORO MÁXIMO (Animales)</label>
              <input type="number" id="w-zona-aforo" value="${data.aforoMax}" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">SUPERFICIE (ha)</label>
              <input type="number" id="w-zona-superficie" value="${data.superficie}" step="0.01" placeholder="Ej: 42.5" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">USO PRINCIPAL (Opcional)</label>
              <input type="text" id="w-zona-uso" value="${data.usoPrincipal}" placeholder="Ej: Engorde, Pasto libre..." class="wizard-input">
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.nombre = document.getElementById('w-zona-nombre')?.value.trim() || data.nombre;
          data.aforoMax = parseInt(document.getElementById('w-zona-aforo')?.value) || 50;
          data.superficie = parseFloat(document.getElementById('w-zona-superficie')?.value) || 0;
          data.usoPrincipal = document.getElementById('w-zona-uso')?.value.trim() || data.usoPrincipal;
        },
        validate: async (data) => {
          if (!data.nombre) {
            App.toastError("El nombre de la zona es obligatorio");
            return false;
          }
          return true;
        }
      },
      {
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">CÓDIGO PAC (Parcela Agraria SIGGAN)</label>
              <input type="text" id="w-zona-pac" value="${data.codigo_pac}" placeholder="Ej: ES01A123456789" class="wizard-input">
              <small class="text-gray">Requisito para subvenciones CCAA</small>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">DISTANCIA A FUENTE DE AGUA (m)</label>
              <input type="number" id="w-zona-agua" value="${data.distancia_agua_m}" placeholder="Metros a abrevadero o agua" class="wizard-input">
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.codigo_pac = document.getElementById('w-zona-pac')?.value.trim() || data.codigo_pac;
          data.distancia_agua_m = parseInt(document.getElementById('w-zona-agua')?.value) || 0;
        },
        validate: async (data) => true
      }
    ];

    window.WizardManager.create({
      id: 'wizard-nueva-zona',
      title: 'NUEVA ZONA',
      initialData: { nombre: "", aforoMax: 50, superficie: 0, usoPrincipal: "", codigo_pac: "", distancia_agua_m: 0 },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          const finca = await Fincas.getActive();
          if (!finca.zonas) finca.zonas = [];
          finca.zonas.push({
            nombre: finalData.nombre,
            aforoMax: finalData.aforoMax,
            superficieGrafica: finalData.superficie,
            usoPrincipal: finalData.usoPrincipal,
            codigo_pac: finalData.codigo_pac,
            distancia_agua_m: finalData.distancia_agua_m,
            creadoEn: Date.now(),
          });
          await Fincas.save(finca);
          App.toast("Zona creada");
          App.route();
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  },

  async _eliminarZona(index) {
    const motivo = await Confirm.prompt("Motivo de anulación", "Introduce el motivo (obligatorio):", "rectificacion_zonas");
    if (!motivo) {
      App.toastError("Debes indicar un motivo de anulación.");
      return;
    }
    if (!await Confirm.confirm("Anular Zona", "¿Anular zona? Se conservará histórico para auditoría.", true)) return;
    try {
      const finca = await Fincas.getActive();
      const zona = finca?.zonas?.[index];
      if (!zona) {
        App.toastError("Zona no encontrada.");
        return;
      }
      zona.anulada = true;
      zona.anuladaEn = new Date().toISOString();
      zona.anuladoMotivo = motivo.trim();
      zona.actualizadoEn = new Date().toISOString();
      await Fincas.save(finca);
      await window.db.add("registro_eventos", {
        fincaId: finca.id || await Fincas.getActiveId().catch(() => null),
        tipo: "auditoria",
        tipo_entidad: "zona",
        entidad_id: index,
        fecha: new Date().toISOString().split("T")[0],
        motivo_tarea: "anulacion_zona",
        descripcion: `Anulación de zona ${zona.nombre || "#" + index}`,
        observaciones: motivo.trim(),
        creadoEn: new Date().toISOString(),
      }).catch(() => {});
      App.toast("Zona anulada");
      location.hash = "#/zonas";
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.ZonasView = ZonasView;




