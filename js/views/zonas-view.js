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
      let totalAforo = 0, totalOcupacion = 0;
      html += `<div class="grid gap-15">`;
      for (let [index, z] of zonas.entries()) {
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
              <div class="flex justify-between items-center mt-6" style="background:rgba(0,0,0,0.3); border-left:3px solid ${colorEspecie}; padding:6px 10px; border-radius:8px;">
                <div>
                  <div style="font-size:0.8rem; font-weight:700; color:${colorEspecie};">${r.nombre}</div>
                  <div class="text-gray text-2xs">${r.tipo}</div>
                </div>
                <div class="text-white font-800" style="font-size:0.85rem;">${n}</div>
              </div>`;
          }
        }

        const aforo = z.aforoMax || z.aforo_maximo || 50;
        const superficie = z.superficie || z.superficieGrafica || 0;
        totalAforo += aforo;
        totalOcupacion += censoTotal;
        const pct = aforo > 0 ? Math.round((censoTotal / aforo) * 100) : 0;
        const colorCenso = pct > 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
        const estadoTexto = pct > 100 ? '🔴 Sobrecarga' : pct >= 80 ? '🟡 Óptimo' : pct >= 50 ? '🟢 Aceptable' : '⚪ Infrautilizada';

        html += `
          <div class="card" style="border-top:3px solid ${colorCenso}; cursor:pointer; padding:15px;" onclick="location.hash='/zona?index=${index}'">
            <div class="flex justify-between items-start mb-8">
              <div>
                <h3 class="m-0">${z.nombre}</h3>
                <p class="m-0 text-gray text-xs">${z.usoPrincipal || 'Sin uso'}${superficie ? ` · ${superficie} ha` : ''}${especiesEnZona.size ? ` · ${[...especiesEnZona].join(', ')}` : ''}</p>
              </div>
              <div class="text-right"><span class="text-xs font-bold" style="color:${colorCenso}">${estadoTexto}</span><br><span class="text-555 text-xs">Ficha ➔</span></div>
            </div>
            <div class="p-10 rounded" style="background:#000;border:1px solid #222;">
              <div class="flex justify-between font-800 text-xs mb-4">
                <span class="text-gray">OCUPACIÓN</span>
                <span style="color:${colorCenso}">${censoTotal} / ${aforo} (${pct}%)</span>
              </div>
              <div style="width:100%;height:8px;background:#222;border-radius:4px;overflow:hidden;">
                <div style="width:${Math.min(pct, 100)}%;height:100%;background:${colorCenso};border-radius:4px;box-shadow:0 0 8px ${colorCenso}44;transition:width 0.3s;"></div>
              </div>
            </div>
            ${rebanosHtml ? `<div class="mt-8">${rebanosHtml}</div>` : '<div class="text-gray text-xs text-center mt-8">📍 Sin rebaños asignados</div>'}
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
          <div style="width:100%;height:10px;background:#222;border-radius:5px;overflow:hidden;">
            <div style="width:${Math.min(pctGlobal, 100)}%;height:100%;background:${colorGlobal};border-radius:5px;box-shadow:0 0 12px ${colorGlobal}44;"></div>
          </div>
        </div>`;
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
