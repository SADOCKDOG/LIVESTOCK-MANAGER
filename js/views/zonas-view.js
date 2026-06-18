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
    const zonas = finca.zonas || [];
    let html = `
      <div class="text-center mb-25">
        <button class="btn btn-primary btn-sm" onclick="ZonasView._crearZona()">➕ Nueva Zona</button>
      </div>`;
    if (zonas.length === 0)
      html += `<div class="empty-state"><div class="empty-state-icon">🗺️</div><p class="empty-state-text">Sin zonas definidas.</p></div>`;
    else {
      html += `<div class="grid gap-15">`;
      for (let [index, z] of zonas.entries()) {
        let censoTotal = 0;
        const rebsEnZona = rebanos.filter((r) => r.zonaActual === z.nombre);

        let rebanosHtml = "";
        for (let r of rebsEnZona) {
          const ans = await Animales.list(r.id);
          const n = ans.length;
          censoTotal += n;

          let colorEspecie = "#3b82f6";
          if (r.especie.toLowerCase().includes("oveja"))
            colorEspecie = "#10b981";
          if (r.especie.toLowerCase().includes("cerdo"))
            colorEspecie = "#ec4899";
          if (r.especie.toLowerCase().includes("cabra"))
            colorEspecie = "#f59e0b";

          rebanosHtml += `
            <div class="flex justify-between items-center mt-8" style="background:rgba(0,0,0,0.3); border-left:3px solid ${colorEspecie}; padding:8px 12px; border-radius:8px;">
              <div>
                <div style="font-size:0.85rem; font-weight:700; color:${colorEspecie};">${r.nombre}</div>
                <div class="text-gray text-2xs" style="text-transform:uppercase;">${r.tipo}</div>
              </div>
              <div class="text-white font-800" style="font-size:0.9rem;">${n} <small class="text-555" style="font-size:0.6rem;">ANM</small></div>
            </div>`;
        }

        const aforo = z.aforoMax || 50;
        const pct = Math.round((censoTotal / aforo) * 100);
        const colorCenso = pct > 100 ? "#ef4444" : pct > 85 ? "#f59e0b" : "#10b981";

        html += `
          <div class="card card-left-amber" onclick="location.hash='/zona?index=${index}'" style="cursor:pointer; padding-bottom:15px;">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="mb-4">${z.nombre}</h3>
                <p class="m-0 text-gray text-sm" style="font-style:italic;">${z.usoPrincipal || "Sin uso definido"}</p>
              </div>
              <span class="text-555 text-xs">Ficha ➔</span>
            </div>
            <div class="mt-14 p-10 rounded" style="background:#000; border:1px solid #222;">
              <div class="flex justify-between font-800 text-75" style="margin-bottom:6px;">
                <span class="text-gray">OCUPACIÓN TOTAL</span>
                <span style="color:${colorCenso};">${censoTotal} / ${aforo} (${pct}%)</span>
              </div>
              <div class="rounded-sm" style="width:100%; height:6px; background:#222; overflow:hidden;">
                <div style="width:${Math.min(pct, 100)}%; height:100%; background:${colorCenso}; box-shadow:0 0 10px ${colorCenso}44;"></div>
              </div>
            </div>
            <div class="mt-14">
              <div class="text-444" style="font-size:0.65rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Rebaños en Parcela</div>
              ${rebanosHtml || '<p class="text-555 text-center text-75" style="margin:10px 0;">Parcela vacía</p>'}
            </div>
          </div>`;
      }
      html += `</div>`;
    }
    main.innerHTML = html;
  },

  async renderDetalle(params) {
    const index = params.get("index");
    const finca = await Fincas.getActive();
    const zona = finca.zonas[parseInt(index)];
    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/zonas" class="link-back">← Volver</a><h2 class="mt-10">📍 Detalle Zona</h2></div>
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
          <div><label class="form-label">Localización</label>
          <textarea id="z-edit-localizacion" class="premium-input" style="min-height:60px; resize:none;">${zona.localizacion || ""}</textarea></div>
        </div>
        <div class="flex gap-10 mt-20">
          <button class="btn btn-primary" onclick="ZonasView._guardarZona(${index})" style="flex:2;">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="ZonasView._eliminarZona(${index})" style="flex:1; background:#450a0a; color:white; border:none;">🗑️ Borrar</button>
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
          <div style="margin-top:10px;">
            <div class="wizard-input-group">
              <label class="wizard-label">NOMBRE DE LA ZONA / PARCELA</label>
              <input type="text" id="w-zona-nombre" value="${data.nombre}" placeholder="Ej: Parcela Norte..." class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">AFORO MÁXIMO (Animales)</label>
              <input type="number" id="w-zona-aforo" value="${data.aforoMax}" class="wizard-input">
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
          data.usoPrincipal = document.getElementById('w-zona-uso')?.value.trim() || data.usoPrincipal;
        },
        validate: async (data) => {
          if (!data.nombre) {
            App.toastError("El nombre de la zona es obligatorio");
            return false;
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-nueva-zona',
      title: 'NUEVA ZONA',
      initialData: { nombre: "", aforoMax: 50, usoPrincipal: "" },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          const finca = await Fincas.getActive();
          if (!finca.zonas) finca.zonas = [];
          finca.zonas.push({
            nombre: finalData.nombre,
            aforoMax: finalData.aforoMax,
            usoPrincipal: finalData.usoPrincipal,
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
    if (!confirm("¿Borrar zona?")) return;
    try {
      const finca = await Fincas.getActive();
      finca.zonas.splice(index, 1);
      await Fincas.save(finca);
      App.toast("Eliminada");
      location.hash = "#/zonas";
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.ZonasView = ZonasView;
