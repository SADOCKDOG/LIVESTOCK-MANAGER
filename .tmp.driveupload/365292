/**
 * Livestock Manager - RebanosView v1.0.0
 * Vista de Rebaños extraída de App.js para modularización.
 * Copia espejo de js/views/rebanos-view.js
 */

const RebanosView = {
  async render() {
    const main = document.getElementById("app-content");
    const rebanos = await Rebanos.list();
    const eventos = await window.db.getAll('registro_eventos').catch(() => []);
    const totalRebanos = rebanos.length;
    const rebanosActivos = rebanos.filter(r => r.estado !== 'inactivo').length;
    let html = `
      <div class="mb-16">
        <div class="flex justify-between items-center">
          <div class="flex gap-8">
            <button class="btn btn-create btn-sm" onclick="RebanosView._crearRebano()">${Icons.agregar()} Nuevo</button>
          </div>
          ${totalRebanos > 0 ? `<span class="text-xs text-gray">${rebanosActivos}/${totalRebanos} activos</span>` : ''}
        </div>
      </div>`;

    if (rebanos.length === 0)
      html += `<div class="empty-state"><div class="empty-state-icon">🐑</div><p class="empty-state-text">No hay rebaños registrados.</p></div>`;
    else {
      // Barra de resumen de Rebaños
      const carneCount = rebanos.filter(r => r.tipo.toLowerCase().includes('carne') || r.tipo.toLowerCase().includes('cárn')).length;
      const lecheCount = rebanos.filter(r => r.tipo.toLowerCase().includes('leche') || r.tipo.toLowerCase().includes('láct')).length;
      const hibridoCount = rebanos.filter(r => r.tipo.toLowerCase().includes('mixt') || r.tipo.toLowerCase().includes('híbr') || r.tipo.toLowerCase().includes('doble')).length;

      html += `
        <div class="flex flex-wrap gap-4 mb-10">
          <span class="badge badge-sm badge-gold flex items-center gap-4">${Icons.carne()} Carne: ${carneCount}</span>
          <span class="badge badge-sm badge-blue flex items-center gap-4">${Icons.leche()} Leche: ${lecheCount}</span>
          <span class="badge badge-sm badge-purple flex items-center gap-4">${Icons.rotacion()} Híbridos: ${hibridoCount}</span>
          <span class="badge badge-sm badge-green flex items-center gap-4">${Icons.check()} ${rebanosActivos} activos</span>
        </div>`;

      html += `<div class="grid gap-15">`;
      for (let r of rebanos) {
        const animales = await Animales.list(r.id);
        const n = animales.length;
        const activos = animales.filter(a => a.estado === 'activo').length;
        const eventosReb = eventos.filter(e => e.entidad_id === r.id || (e.tipo_entidad === 'rebano' && e.snap_identificacion === r.nombre));
        const ultimoEvento = eventosReb.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        const prodLeche = eventosReb.filter(e => e.unidad === 'L').reduce((s, e) => s + (e.valor_neto || 0), 0);
        const iconoEsp = r.especie === 'Vacas' ? '🐄' : r.especie === 'Ovejas' ? '🐑' : r.especie === 'Cabras' ? '🐐' : '🐾';
        const colorEstado = r.estado !== 'inactivo' ? '#10b981' : '#6b7280';

        html += `
          <div class="card card-animal" onclick="location.hash='/rebano?id=${r.id}'" style="border-left:4px solid ${colorEstado};">
            <div class="flex justify-between items-start">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-6">
                  <span class="text-xl">${iconoEsp}</span>
                  <h3 class="section-h3 m-0 text-ellipsis">${r.nombre}</h3>
                </div>
                <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray items-center">
                  <span class="flex items-center gap-4">${Icons.reproduccion()} ${r.especie}</span>
                  <span>·</span>
                  <span class="flex items-center gap-4">🏷️ ${r.tipo}</span>
                  <span>·</span>
                  <span class="flex items-center gap-4">${Icons.zonas()} ${r.zonaActual || "S/N"}</span>
                </div>
                <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray items-center">
                  <span class="flex items-center gap-4">${Icons.animales()} ${n} animales (${activos} activos)</span>
                  ${prodLeche > 0 ? `<span>·</span><span class="flex items-center gap-4">${Icons.leche()} ${prodLeche.toFixed(0)} L</span>` : ''}
                  ${ultimoEvento ? `<span>·</span><span class="flex items-center gap-4">${Icons.calendar()} Últ. Act: ${new Date(ultimoEvento.fecha).toLocaleDateString('es-ES')}</span>` : ''}
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="badge badge-sm" style="background:${colorEstado}20;color:${colorEstado};border:1px solid ${colorEstado}40;display:block;margin-bottom:4px;">${(r.estado || 'activo').toUpperCase()}</span>
                <span class="text-xs text-777">Ficha ➔</span>
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
        <div class="info-box-center border-left-blue"><small class="s-lbl flex items-center gap-4 justify-center">${Icons.carne()} KG</small><div class="inf-val-lg text-blue">${totalKg.toFixed(0)}</div></div>
        <div class="info-box-center border-left-gold"><small class="s-lbl flex items-center gap-4 justify-center">${Icons.leche()} LITROS</small><div class="inf-val-lg text-gold">${totalLeche.toFixed(0)}</div></div>
        <div class="info-box-center border-left-purple"><small class="s-lbl flex items-center gap-4 justify-center">${Icons.registros()} EVENTOS</small><div class="inf-val-lg text-purple">${eventosReb.length}</div></div>
      </div>

      <!-- Categorías -->
      ${Object.keys(porCategoria).length > 0 ? `
      <div class="card mb-20 border-top-3px border-top-3px-purple p-12">
        <div class="inf-section-title mb-6 flex items-center gap-8">${Icons.documento()} Por categoría</div>
        <div class="flex flex-wrap gap-4">${Object.entries(porCategoria).map(([c, n]) => `<span class="badge badge-sm badge-purple">${c}: ${n}</span>`).join('')}</div>
      </div>` : ''}

      <!-- Edición -->
      <div class="card border-top-3px border-top-3px-gold mb-25">
        <div class="inf-card-title flex items-center gap-8">${Icons.editar()} Datos del Rebaño</div>
        <div class="flex flex-col gap-15">
          <div><label class="form-label">Nombre</label>
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
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label">Capacidad Máxima</label>
            <input type="number" id="r-edit-capacidad" value="${rebano.capacidad_total || ''}" class="premium-input"></div>
            <div><label class="form-label">Código de Lote</label>
            <input type="text" id="r-edit-lote" value="${rebano.codigo_lote || ''}" class="premium-input"></div>
          </div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label">Fecha Constitución</label>
            <input type="date" id="r-edit-fecha" value="${rebano.fecha_constitucion || ''}" class="premium-input"></div>
            <div><label class="form-label">Ubicación (Zona)</label>
            <select id="r-edit-zona" class="premium-input border-gold">
              <option value="">Sin asignar</option>
              ${zonas.map((z) => `<option value="${z.nombre}" ${rebano.zonaActual === z.nombre ? "selected" : ""}>${z.nombre}</option>`).join("")}
            </select></div>
          </div>
          <div><label class="form-label">TIPO DE EXPLOTACIÓN REGA (RD 787/2023)</label>
          <select id="r-edit-tipo-explotacion-rega" class="premium-input border-green">
            <option value="">— Seleccionar —</option>
            ${tiposExplotacionREGA.map((t) => `<option value="${t}" ${rebano.tipo_explotacion_rega === t ? "selected" : ""}>${t}</option>`).join("")}
          </select></div>
          <div><label class="form-label">Notas / Observaciones</label>
          <textarea id="r-edit-notas" class="premium-input" style="height:80px; resize:none;">${rebano.notas || ''}</textarea></div>
        </div>
        <div class="flex gap-10 mt-20">
          <button class="btn btn-secondary btn-danger flex-1" onclick="RebanosView._eliminarRebano(${id})">${Icons.eliminar()} Eliminar</button>
          <button class="btn btn-primary btn-success flex-2" onclick="RebanosView._guardarRebano(${id})">${Icons.guardar()} Guardar</button>
        </div>
      </div>
      
      <!-- Sanidad -->
      <div class="card mb-20 border-top-3px border-top-3px-green card-tint-green">
        <div class="flex justify-between items-center">
          <div class="inf-card-title m-0 flex items-center gap-8">${Icons.sanidad()} Sanidad</div>
          <button class="btn btn-primary btn-add" onclick="App._registrarTratamiento(${id})" style="padding:5px 12px; font-size:0.8rem;">${Icons.agregar()} Añadir</button>
        </div>
        <div id="lista-sanitarios-rebano" class="mt-10"></div>
      </div>

      <!-- Animales -->
      <div class="flex justify-between items-center mb-15">
        <h3 class="m-0 flex items-center gap-8">${Icons.animales()} Animales (${animales.length})</h3>
        <button class="btn btn-primary btn-edit" onclick="App._abrirSelectorAnimales(${id})" style="padding:8px 15px;">${Icons.rotacion()} Mover</button>
      </div>
      <div class="grid gap-10">
        ${animales.map((a) => {
          const icono = a.especie === 'Vacas' ? '🐄' : a.especie === 'Ovejas' ? '🐑' : a.especie === 'Cabras' ? '🐐' : '🐾';
          const colorEst = a.estado === 'activo' ? '#10b981' : a.estado === 'vendido' ? '#f59e0b' : '#ef4444';
          return `<div class="card card-item" style="border-left:4px solid ${colorEst};" onclick="location.hash='/animal?id=${a.id}'">
            <div class="flex justify-between items-center">
              <div><span>${icono} <strong>${a.numero_identificacion}</strong> · ${a.raza || 'S/R'}</span></div>
              <div class="flex items-center gap-8">
                <span class="text-xs text-gray">${a.sexo === 'H' ? '♀' : '♂'} ${a.categoria || ''}</span>
                <span class="text-amber text-sm">Ver ➔</span>
              </div>
            </div>
          </div>`;
        }).join("")}
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
          <div class="mt-10">
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
          <div class="mt-10">
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
      },
      {
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">TIPO DE EXPLOTACIÓN REGA (RD 787/2023)</label>
              <select id="w-reb-tipo-explotacion" class="wizard-input wizard-select" style="border-color: #10b981;">
                <option value="">— Seleccionar —</option>
                ${tiposExplotacionREGA.map((t) => `<option value="${t}" ${data.tipo_explotacion_rega === t ? "selected" : ""}>${t}</option>`).join("")}
              </select>
              <small class="text-gray">Requisito normativo SIGGAN/BADIGEX</small>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.tipo_explotacion_rega = document.getElementById('w-reb-tipo-explotacion')?.value || data.tipo_explotacion_rega;
        }
      },
      {
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">CAPACIDAD / AFORO MÁXIMO</label>
              <input type="number" id="w-reb-capacidad" value="${data.capacidad_total || ''}" placeholder="Ej: 100 (opcional)" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CÓDIGO DE LOTE / TRAZABILIDAD</label>
              <input type="text" id="w-reb-lote" value="${data.codigo_lote || ''}" placeholder="Ej: LOTE-2026-A (opcional)" class="wizard-input">
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
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA DE CONSTITUCIÓN</label>
              <input type="date" id="w-reb-fecha" value="${data.fecha_constitucion}" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">NOTAS / OBSERVACIONES</label>
              <textarea id="w-reb-notas" placeholder="Ración, ADSG, detalles..." class="wizard-input" style="height:80px; resize:none;">${data.notas || ''}</textarea>
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
