/**
 * Livestock Manager - RebanosView v1.0.0
 * Vista de Rebaños extraída de App.js para modularización.
 * Copia espejo de js/views/rebanos-view.js
 */

const RebanosView = {
  async render() {
    const main = document.getElementById("app-content");
    const rebanos = await Rebanos.list();
    let html = `
      <div class="text-center mb-25">
        <div class="text-555 font-800 mb-12 text-xs uppercase tracking-wider">Gestión de rebaños</div>
        <button class="btn btn-primary btn-sm" onclick="RebanosView._crearRebano()">➕ Nuevo Rebaño</button>
      </div>`;
    if (rebanos.length === 0)
      html += `<div class="empty-state"><div class="empty-state-icon">🐑</div><p class="empty-state-text">No hay rebaños registrados.</p></div>`;
    else {
      html += `<div class="grid gap-15">`;
      for (let r of rebanos) {
        const n = (await Animales.list(r.id)).length;
        html += `
          <div class="card card-left-amber" onclick="location.hash='/rebano?id=${r.id}'" style="cursor:pointer; padding:15px;">
            <div class="flex justify-between"><h3>${r.nombre}</h3><span class="text-555 text-sm">Ficha ➔</span></div>
            <p class="text-ccc text-85" style="margin:5px 0;">${r.especie} - ${r.tipo} | 📍 ${r.zonaActual || "S/N"}</p>
            <div class="text-amber font-bold">${n} animales</div>
          </div>`;
      }
      html += `</div>`;
    }
    main.innerHTML = html;
  },

  async renderDetalle(params) {
    const id = params.get("id");
    const rebano = await Rebanos.get(id);
    const animales = await Animales.list(id);
    const finca = await Fincas.getActive();
    const zonas = finca ? finca.zonas || [] : [];
    const especies = await window.db.getAll("config_especies");
    const tipos = await window.db.getAll("config_tipos_produccion");

    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#/rebanos" class="link-back">← Volver</a><h2 class="mt-10">🏘️ Ficha Rebaño</h2></div>
      <div class="card border-top-3px border-top-3px-gold mb-25">
        <div class="flex flex-col gap-15">
          <div><label class="form-label">Nombre del Rebaño</label>
          <input type="text" id="r-edit-nombre" value="${rebano.nombre}" class="premium-input"></div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label">Especie</label>
            <select id="r-edit-especie" class="premium-input">
              ${especies.map((e) => `<option value="${e.nombre}" ${rebano.especie === e.nombre ? "selected" : ""}>${e.nombre}</option>`).join("")}
            </select></div>
            <div><label class="form-label">Tipo</label>
            <select id="r-edit-tipo" class="premium-input">
              ${tipos.map((t) => `<option value="${t.nombre}" ${rebano.tipo === t.nombre ? "selected" : ""}>${t.nombre}</option>`).join("")}
            </select></div>
          </div>
          <div><label class="form-label">Ubicación Actual (Zona)</label>
          <select id="r-edit-zona" class="premium-input border-gold">
            <option value="">Sin asignar</option>
            ${zonas.map((z) => `<option value="${z.nombre}" ${rebano.zonaActual === z.nombre ? "selected" : ""}>${z.nombre}</option>`).join("")}
          </select></div>
        </div>
        <div class="flex gap-10 mt-20">
          <button class="btn btn-primary" onclick="RebanosView._guardarRebano(${id})" style="flex:2;">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="RebanosView._eliminarRebano(${id})" style="flex:1; background:#450a0a; color:white; border:none;">🗑️ Borrar</button>
        </div>
      </div>
      <div class="card mb-20 border-top-3px border-top-3px-green" style="background:rgba(16,185,129,0.05);">
        <div class="flex justify-between items-center"><h3 class="m-0 text-green">💉 Sanidad</h3><button class="btn btn-primary" onclick="App._registrarTratamiento(${id})" style="padding:5px 12px; font-size:0.8rem; background:#10b981;">➕ Añadir</button></div>
        <div id="lista-sanitarios-rebano"></div>
      </div>
      <div class="flex justify-between items-center mb-15"><h3 class="m-0">Animales (${animales.length})</h3><button class="btn btn-primary" onclick="App._abrirSelectorAnimales(${id})" style="padding:8px 15px;">🔃 Mover</button></div>
      <div class="grid gap-10">
        ${animales.map((a) => `<div class="card card-item" style="border-left-color:#b45309;" onclick="location.hash='/animal?id=${a.id}'">
          <span>🐄 <strong>${a.numero_identificacion}</strong> - ${a.raza}</span><span class="text-amber text-sm">Ver ➔</span>
        </div>`).join("")}
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
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💉</div><p class="empty-state-text">Sin tratamientos registrados</p></div>';
        return;
      }
      let html = '';
      filtrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      filtrados.forEach(t => {
        html += `<div class="info-box-sm border-left-green mt-8">
          <div class="flex justify-between"><span class="text-white font-bold">${t.medicamento}</span><span class="text-gray text-xs">${new Date(t.fecha).toLocaleDateString()}</span></div>
          <div class="text-gray text-xs mt-4">Retiro carne: ${t.tiempo_espera_carne_dias || '?'}d ${t.prohibidoLeche ? '| 🚫 Leche' : ''}</div>
        </div>`;
      });
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<p class="text-red text-sm">Error cargando historial</p>';
    }
  },
  async _guardarRebano(id) {
    try {
      const r = await Rebanos.get(id);
      r.nombre = document.getElementById("r-edit-nombre").value.trim();
      r.especie = document.getElementById("r-edit-especie").value;
      r.tipo = document.getElementById("r-edit-tipo").value;
      r.zonaActual = document.getElementById("r-edit-zona").value;
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
    const finca = await Fincas.getActive();
    const zonas = finca ? finca.zonas || [] : [];

    if (especies.length === 0 || tipos.length === 0) {
      App.toastError("Configura Especies/Tipos en Ajustes");
      return;
    }

    const wizardSteps = [
      {
        content: (data) => `
          <div style="margin-top:10px;">
            <div class="wizard-input-group">
              <label class="wizard-label">NOMBRE DEL REBAÑO</label>
              <input type="text" id="w-reb-nombre" value="${data.nombre}" placeholder="Ej: Lote Engorde A..." class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ESPECIE</label>
              <select id="w-reb-especie" class="wizard-input wizard-select">
                ${especies.map((e) => `<option value="${e.nombre}" ${data.especie === e.nombre ? "selected" : ""}>${e.nombre}</option>`).join("")}
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
          <div style="margin-top:10px;">
            <div class="wizard-input-group">
              <label class="wizard-label">TIPO DE PRODUCCIÓN</label>
              <select id="w-reb-tipo" class="wizard-input wizard-select">
                ${tipos.map((t) => `<option value="${t.nombre}" ${data.tipo === t.nombre ? "selected" : ""}>${t.nombre}</option>`).join("")}
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ZONA / PARCELA INICIAL</label>
              <select id="w-reb-zona" class="wizard-input wizard-select" style="border-color: #d97706;">
                <option value="">Sin asignar (Finca General)</option>
                ${zonas.map((z) => `<option value="${z.nombre}" ${data.zonaActual === z.nombre ? "selected" : ""}>${z.nombre}</option>`).join("")}
              </select>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.tipo = document.getElementById('w-reb-tipo')?.value || data.tipo;
          data.zonaActual = document.getElementById('w-reb-zona')?.value || data.zonaActual;
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
        zonaActual: ""
      },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          await Rebanos.save({
            nombre: finalData.nombre,
            especie: finalData.especie,
            tipo: finalData.tipo,
            zonaActual: finalData.zonaActual,
            capacidad_total: 0,
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
    if (ans.length > 0)
      return App.toastError("No se puede eliminar un rebaño con animales.");
    if (!confirm("¿Eliminar este rebaño?")) return;
    try {
      await Rebanos.delete(id);
      App.toast("Eliminado");
      location.hash = "#/rebanos";
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.RebanosView = RebanosView;
