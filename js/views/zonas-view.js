/**
 * Livestock Manager - ZonasView v1.0.0
 * Vista de Zonas/Parcelas extraída de App.js para modularización.
 * Copia espejo de js/views/zonas-view.js
 */

const ZonasView = {
  async render() {
    const main = document.getElementById("app-content");
    const finca = await Fincas.getActive();
    const rebanos = await Rebanos.list();
    const zonasConIndice = (finca.zonas || [])
      .map((zona, realIndex) => ({ zona, realIndex }))
      .filter(({ zona }) => !zona?.anulada);
    let html = `
      <div class="card p-12 mb-16 border-222 card-dark-gradient pb-24">
        <div class="section-header-theme" style="--theme-color: var(--p-gold)">ACCIONES</div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="ZonasView._crearZona()">
            ${Icons.agregar()}
            <span class="widget-link-label">Nueva Zona</span>
          </button>
        </div>
      </div>`;
    if (zonasConIndice.length === 0)
      html += `<div class="empty-state"><div class="empty-state-icon">${Icons.zonas()}</div><p class="empty-state-text">Sin zonas definidas.</p></div>`;
    else {
      let totalAforo = 0, totalOcupacion = 0;
      html += `<div class="grid gap-15">`;
      for (const item of zonasConIndice) {
        const z = item.zona;
        let censoTotal = 0;
        const rebsEnZona = rebanos.filter((r) => r.zonaActual === z.nombre);
        const especiesEnZona = new Set();

        let rebanosHtml = "";
        for (let r of rebsEnZona) {
          const ans = await Animales.list(r.id);
          const n = ans.length;
          censoTotal += n;
          especiesEnZona.add(r.especie);
          if (n > 0) {
            const colorEspecie = r.especie === 'Vacas' ? '#3b82f6' : r.especie === 'Ovejas' ? '#10b981' : r.especie === 'Cabras' ? '#f59e0b' : '#ec4899';
            rebanosHtml += `
              <div class="flex justify-between items-center mt-6" style="background:rgba(255,255,255,0.02); border-left:3px solid ${colorEspecie}; padding:8px 12px; border-radius:8px;">
                <div class="flex items-center gap-8">
                  <div style="color:${colorEspecie}; filter: drop-shadow(0 0 3px ${App._hexToRgba(colorEspecie, 0.25)});">${Icons.rebanos()}</div>
                  <div>
                    <div style="font-size:0.75rem; font-weight:800; color:${colorEspecie}; text-transform:uppercase;">${r.nombre}</div>
                    <div class="text-aaa text-[0.6rem] font-700 uppercase">${r.tipo}</div>
                  </div>
                </div>
                <div class="text-white font-900 text-sm">${n}</div>
              </div>`;
          }
        }

        const aforo = z.aforoMax || z.aforo_maximo || 50;
        const superficie = z.superficie || z.superficieGrafica || 0;
        totalAforo += aforo;
        totalOcupacion += censoTotal;
        const pct = aforo > 0 ? Math.round((censoTotal / aforo) * 100) : 0;
        const colorCenso = pct > 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
        const estadoIcono = pct > 100 ? Icons.statusCritico() : pct >= 80 ? Icons.statusAdvertencia() : pct >= 50 ? Icons.statusOk() : Icons.statusInactivo();
        const estadoLabel = pct > 100 ? 'Sobrecarga' : pct >= 80 ? 'Óptimo' : pct >= 50 ? 'Aceptable' : 'Infrautilizada';

        const ugmFactor = { 'Vacas': 1.0, 'Ovejas': 0.15, 'Cabras': 0.15, 'Cerdos': 0.3, 'Caballos': 1.1, 'Equino': 1.1 };
        let ugmTotal = 0;
        for (let r of rebsEnZona) {
          const factor = ugmFactor[r.especie] || 0.2;
          const ans = await Animales.list(r.id);
          ugmTotal += ans.length * factor;
        }
        const cargaGanadera = superficie > 0 ? (ugmTotal / superficie).toFixed(2) : 0;
        const pacTexto = z.codigo_pac ? `PAC: ${z.codigo_pac}` : 'PAC: pendiente';
        const distAgua = z.distancia_agua_m ? `Agua: ${z.distancia_agua_m}m` : 'Agua: —';

        html += `
          <div class="card no-underline" style="border-top:3px solid ${colorCenso}; cursor:pointer; padding:15px; margin-bottom:12px;" onclick="location.hash='/zona?index=${item.realIndex}'">
            <div class="flex flex-col gap-10">
              <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-10 min-w-0">
                  <div class="text-xl" style="color:${colorCenso}">${Icons.zonas()}</div>
                  <div class="text-xs">
                    <div class="font-bold text-white uppercase text-base tracking-tight">${z.nombre}</div>
                    <div class="text-gray mt-2 font-700 uppercase">${z.usoPrincipal || 'Sin uso Principal'}${superficie ? ` · ${superficie} HA` : ''}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="badge badge-sm uppercase font-800 flex items-center gap-4" style="color:${colorCenso}; border:1px solid ${App._hexToRgba(colorCenso, 0.25)}; background:${App._hexToRgba(colorCenso, 0.08)};">${estadoIcono} ${estadoLabel}</span>
                </div>
              </div>

              <div class="p-10 rounded bg-black border border-222">
                <div class="flex justify-between font-900 text-[0.65rem] mb-4 uppercase">
                  <span class="text-gray">Carga: ${ugmTotal.toFixed(1)} UGM</span>
                  <span style="color:${colorCenso}">${censoTotal} / ${aforo} (${pct}%)</span>
                </div>
                <div class="progress-track">
                  <div style="width:${Math.min(pct, 100)}%; height:100%; background:${colorCenso}; border-radius:4px; box-shadow:0 0 8px ${App._hexToRgba(colorCenso, 0.27)}; transition:width 0.3s;"></div>
                </div>
              </div>

              <div class="flex justify-between items-end w-full">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap gap-x-12 gap-y-3 text-[0.62rem] text-aaa font-800 uppercase">
                    ${z.codigo_pac ? `<div class="flex items-center gap-4">${Icons.documento()} PAC: ${z.codigo_pac}</div>` : ''}
                    <div class="flex items-center gap-4">${Icons.grafico()} ${cargaGanadera} UGM/HA</div>
                    ${especiesEnZona.size ? `<div class="flex items-center gap-4">${Icons.animales()} ${[...especiesEnZona].join(', ')}</div>` : ''}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[0.45rem] text-gray-700 font-900 uppercase tracking-widest flex items-center gap-4">VER ZONA ${Icons.siguiente()}</div>
                </div>
              </div>

              ${rebanosHtml ? `<div class="mt-4 border-top-222 pt-8">${rebanosHtml}</div>` : ''}
            </div>
          </div>`;
      }
      html += `</div>`;
      // Barra resumen global
      const pctGlobal = totalAforo > 0 ? Math.round((totalOcupacion / totalAforo) * 100) : 0;
      const colorGlobal = pctGlobal > 100 ? '#ef4444' : pctGlobal >= 80 ? '#f59e0b' : '#10b981';
      html += `
        <div class="card mt-15" style="background:rgba(16,185,129,0.03);padding:15px;">
          <div class="flex justify-between items-center mb-6">
            <span class="text-xs text-gray font-bold uppercase">OCUPACIÓN GLOBAL</span>
            <span class="font-bold" style="color:${colorGlobal}">${totalOcupacion} / ${totalAforo} (${pctGlobal}%)</span>
          </div>
          <div class="progress-track progress-track--lg">
            <div style="width:${Math.min(pctGlobal, 100)}%;height:100%;background:${colorGlobal};border-radius:5px;box-shadow:0 0 12px ${App._hexToRgba(colorGlobal, 0.27)};"></div>
          </div>
        </div>`;
    }
    main.innerHTML = html + `<button class="fab-btn" onclick="ZonasView._crearZona()" aria-label="Nueva Zona">${Icons.agregar()}</button>`;
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
    const cargaGanadera = superficie > 0 ? (ugmTotal / superficie).toFixed(2) : 0;
    
    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/zonas" class="link-back flex items-center gap-4">${Icons.atras()} Volver</a><h2 class="mt-10">${Icons.zonas()} Detalle Zona</h2></div>
      <div class="card border-top-3px border-top-3px-orange">
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
            UGM Total: <strong>${ugmTotal.toFixed(1)}</strong> · Carga: <strong>${cargaGanadera} UGM/ha</strong>
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
