/**
 * Livestock Manager - BotiquinView v1.0.0
 * Inventario de medicamentos/vacunas de la finca (gap "Ingreso Almacén" de
 * docs/AUDITAR/AUDITORIA-BASEDEDATOS-LEGACY.md). Es gestión interna de stock,
 * no un dato exigido por SIGGAN/BADIGEX — no sustituye ni condiciona el
 * cumplimiento SIGGAN, complementa el libro de tratamientos/vacunaciones ya
 * existente (js/sanitarios.js, js/vacunaciones.js).
 */
const BotiquinView = {
  _cache: [],

  async render() {
    if (window.App) App.updateHeaderColor('botiquin');
    const main = document.getElementById("app-content");
    const finca = await Fincas.getActive();
    if (!finca) {
      main.innerHTML = `<div class="empty-state"><p class="empty-state-text">Selecciona una finca activa primero.</p></div>`;
      return;
    }

    const todos = await window.db.getAllFromIndex('config_botiquin', 'fincaId', finca.id).catch(() => []);
    this._cache = todos.filter(p => !p.anulado).sort((a, b) => a.nombre.localeCompare(b.nombre));

    let html = '';
    if (this._cache.length === 0) {
      html = `<div class="empty-state"><div class="empty-state-icon">${Icons.sanidad()}</div><p class="empty-state-text">Sin productos registrados en el botiquín.</p><div class="text-center mt-20"><button class="btn btn-create btn-lg" onclick="BotiquinView._crearProducto()">${Icons.agregar()} Registrar primer producto</button></div></div>`;
    } else {
      const moduleColor = (window.getModuleColor && window.getModuleColor('/botiquin')) || 'var(--c-info)';
      const hoy = new Date().toISOString().split('T')[0];
      let fichasHtml = '';
      for (const p of this._cache) {
        const stockBajo = p.cantidadMinima != null && Number(p.cantidadActual) <= Number(p.cantidadMinima);
        const diasCaducidad = p.caducidad ? Math.ceil((new Date(p.caducidad) - new Date(hoy)) / (24 * 3600 * 1000)) : null;
        const caducado = diasCaducidad != null && diasCaducidad < 0;
        const caducidadProxima = diasCaducidad != null && diasCaducidad >= 0 && diasCaducidad <= 30;

        const metadata = [];
        metadata.push(`<span>${Number(p.cantidadActual || 0).toLocaleString()} ${p.unidad || ''}</span>`);
        if (p.lote) metadata.push(`<span>Lote: ${p.lote}</span>`);
        if (p.caducidad) metadata.push(`<span>Caduca: ${p.caducidad}</span>`);
        if (stockBajo) metadata.push(`<span style="color: var(--c-danger);">STOCK BAJO</span>`);
        if (caducado) metadata.push(`<span style="color: var(--c-danger);">CADUCADO</span>`);
        else if (caducidadProxima) metadata.push(`<span style="color: var(--c-warning);">CADUCA EN ${diasCaducidad}D</span>`);

        fichasHtml += App._cardRegistro({
          icon: Icons.sanidad(),
          title: p.nombre,
          subtitle: `<span class="badge badge-sm uppercase">${p.tipo || 'otro'}</span>`,
          metadata: metadata.join(''),
          color: (stockBajo || caducado) ? 'var(--c-danger)' : moduleColor,
          onClick: `location.hash='/botiquin-producto?id=${p.id}'`
        });
      }

      html = `
        <div class="flex items-center gap-12 mb-14">
          <span class="text-2xl" style="color:${moduleColor}; display:inline-flex; align-items:center;">${Icons.sanidad()}</span>
          <div>
            <h1 class="text-white font-900 text-lg uppercase tracking-wider" style="margin:0; line-height:1.2;">
              <span style="color:${moduleColor}; margin-right:4px;">|</span> BOTIQUÍN / ALMACÉN
            </h1>
            <div class="text-gray" style="font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
              ${this._cache.length} ${this._cache.length === 1 ? 'producto' : 'productos'}
            </div>
          </div>
        </div>
        <div class="grid gap-12">${fichasHtml}</div>`;
    }

    main.innerHTML = html + `
      <div class="fab-container" onclick="BotiquinView._crearProducto()">
        <span class="fab-label">Nuevo Producto</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  async renderDetalle(params) {
    const id = Number(params.get("id"));
    const p = await window.db.get('config_botiquin', id);
    if (!p || p.anulado) {
      App.toastError("Producto no disponible");
      location.hash = "#/botiquin";
      return;
    }
    const eventos = await window.db.getAllFromIndex('registro_eventos', 'fincaId', p.fincaId).catch(() => []);
    const movimientos = eventos
      .filter(e => e.tipo_entidad === 'botiquin' && Number(e.entidad_id) === id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    BotiquinView._guardado = false;
    App.setExitGuard(() => BotiquinView._confirmSalirEdicion());

    document.getElementById("app-content").innerHTML = `
      <div class="mb-20"><a href="#" onclick="BotiquinView._salirEdicion(); return false;" class="link-back">← Volver</a><h2 class="mt-10 font-900 uppercase tracking-wider"><span style="color: var(--neon);">|</span> ${Icons.sanidad()} ${p.nombre.toUpperCase()}</h2></div>
      <div class="card-registro" style="--registro-color: var(--c-info);">
        <div class="grid grid-cols-2 gap-10 mb-15">
          <div class="card p-10 text-center" style="background:#111; border:1px solid #222;">
            <span class="text-gray-500 font-950 uppercase text-[0.55rem] tracking-wider mb-2 d-block">STOCK ACTUAL</span>
            <span class="text-white font-black text-sm block">${Number(p.cantidadActual || 0).toLocaleString()} ${p.unidad || ''}</span>
          </div>
          <div class="card p-10 text-center" style="background:#111; border:1px solid #222;">
            <span class="text-gray-500 font-950 uppercase text-[0.55rem] tracking-wider mb-2 d-block">STOCK MÍNIMO</span>
            <span class="text-white font-black text-sm block">${p.cantidadMinima != null ? Number(p.cantidadMinima).toLocaleString() : '—'} ${p.unidad || ''}</span>
          </div>
        </div>

        <div class="flex flex-col gap-15">
          <div><label class="form-label" for="b-edit-nombre">Nombre</label>
          <input type="text" id="b-edit-nombre" value="${p.nombre}" class="premium-input"></div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label" for="b-edit-tipo">Tipo</label>
            <select id="b-edit-tipo" class="premium-input">
              ${['vacuna', 'medicamento', 'desparasitante', 'antibiotico', 'otro'].map(t => `<option value="${t}" ${p.tipo === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
            </select></div>
            <div><label class="form-label" for="b-edit-unidad">Unidad</label>
            <select id="b-edit-unidad" class="premium-input">
              ${['dosis', 'ml', 'comprimidos', 'kg', 'unidades'].map(u => `<option value="${u}" ${p.unidad === u ? 'selected' : ''}>${u}</option>`).join('')}
            </select></div>
          </div>
          <div class="grid grid-cols-2 gap-10">
            <div><label class="form-label" for="b-edit-lote">Lote</label>
            <input type="text" id="b-edit-lote" value="${p.lote || ''}" class="premium-input"></div>
            <div><label class="form-label" for="b-edit-caducidad">Caducidad</label>
            <input type="date" id="b-edit-caducidad" value="${p.caducidad || ''}" class="premium-input"></div>
          </div>
          <div><label class="form-label" for="b-edit-minima">Stock mínimo (alerta)</label>
          <input type="number" id="b-edit-minima" value="${p.cantidadMinima != null ? p.cantidadMinima : ''}" min="0" class="premium-input"></div>
          <div><label class="form-label" for="b-edit-notas">Notas</label>
          <textarea id="b-edit-notas" class="premium-input min-h-60 resize-none">${p.notas || ''}</textarea></div>
        </div>

        <div class="grid grid-cols-2 gap-10 mt-15">
          <button class="btn btn-secondary" onclick="BotiquinView._abrirMovimiento(${id}, 'entrada')">${Icons.agregar()} Entrada de stock</button>
          <button class="btn btn-secondary" onclick="BotiquinView._abrirMovimiento(${id}, 'consumo')">${Icons.balanza()} Registrar consumo</button>
        </div>

        <div class="mt-20">
          <div class="text-[0.65rem] text-gray uppercase font-900 tracking-wide mb-8">Historial de movimientos</div>
          <div class="flex flex-col gap-6" style="max-height: 220px; overflow-y: auto;">
            ${movimientos.length === 0 ? '<div class="text-center py-15 text-gray-500 font-bold uppercase text-[0.6rem]">Sin movimientos registrados</div>' :
              movimientos.map(m => `
                <div class="flex justify-between items-center p-8 rounded-sm border border-222" style="background:#141414;">
                  <div>
                    <span class="text-[0.6rem] font-black text-white uppercase block">${m.motivo_tarea === 'entrada_botiquin' ? 'ENTRADA' : 'CONSUMO'}</span>
                    <span class="text-[0.55rem] font-bold text-gray-500 block mt-2">${m.fecha}</span>
                  </div>
                  <strong class="text-xs font-black" style="color:${m.motivo_tarea === 'entrada_botiquin' ? 'var(--c-success)' : 'var(--c-danger)'};">
                    ${m.motivo_tarea === 'entrada_botiquin' ? '+' : '-'}${m.valor_neto || 0} ${p.unidad || ''}
                  </strong>
                </div>`).join('')}
          </div>
        </div>

        <div class="flex justify-between items-center mt-20">
          <button class="btn btn-danger" onclick="BotiquinView._eliminarProducto(${id})">${Icons.eliminar()} Eliminar</button>
          <div class="flex gap-10">
            <button class="btn btn-secondary" onclick="BotiquinView._salirEdicion()">${Icons.cerrar()} Cancelar</button>
            <button class="btn btn-success" onclick="BotiquinView._guardarProducto(${id})">${Icons.guardar()} Guardar</button>
          </div>
        </div>
      </div>`;
  },

  async _guardarProducto(id) {
    try {
      const p = await window.db.get('config_botiquin', id);
      p.nombre = document.getElementById('b-edit-nombre').value.trim();
      p.tipo = document.getElementById('b-edit-tipo').value;
      p.unidad = document.getElementById('b-edit-unidad').value;
      p.lote = document.getElementById('b-edit-lote').value.trim();
      p.caducidad = document.getElementById('b-edit-caducidad').value || null;
      const minima = parseFloat(document.getElementById('b-edit-minima').value);
      p.cantidadMinima = isNaN(minima) ? null : minima;
      p.notas = document.getElementById('b-edit-notas').value.trim();
      if (!p.nombre) { App.toastError('El nombre es obligatorio.'); return; }
      await window.db.put('config_botiquin', p);
      BotiquinView._guardado = true;
      App.toast("Producto actualizado", "success");
      location.hash = "#/botiquin";
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _confirmSalirEdicion() {
    if (this._guardado) return true;
    return await Confirm.confirm("Salir sin guardar", "¿Cerrar sin guardar datos?", false);
  },

  async _salirEdicion() {
    if (!(await this._confirmSalirEdicion())) return;
    App.clearExitGuard();
    location.hash = "#/botiquin";
  },

  async _crearProducto() {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError("No hay finca activa"); return; }

    const wizardSteps = [
      {
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label" for="w-bot-nombre">NOMBRE DEL PRODUCTO</label>
              <input type="text" id="w-bot-nombre" value="${data.nombre || ''}" class="wizard-input font-800" placeholder="Ej: Ivermectina 1%">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label" for="w-bot-tipo">TIPO</label>
                <select id="w-bot-tipo" class="wizard-input font-800">
                  ${['vacuna', 'medicamento', 'desparasitante', 'antibiotico', 'otro'].map(t => `<option value="${t}" ${data.tipo === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label" for="w-bot-unidad">UNIDAD</label>
                <select id="w-bot-unidad" class="wizard-input font-800">
                  ${['dosis', 'ml', 'comprimidos', 'kg', 'unidades'].map(u => `<option value="${u}" ${data.unidad === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label" for="w-bot-cantidad">STOCK INICIAL</label>
                <input type="number" id="w-bot-cantidad" value="${data.cantidadActual || 0}" min="0" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label" for="w-bot-minima">STOCK MÍNIMO (ALERTA)</label>
                <input type="number" id="w-bot-minima" value="${data.cantidadMinima || ''}" min="0" class="wizard-input font-800" placeholder="Opcional">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label" for="w-bot-lote">LOTE</label>
                <input type="text" id="w-bot-lote" value="${data.lote || ''}" class="wizard-input" placeholder="Opcional">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label" for="w-bot-caducidad">CADUCIDAD</label>
                <input type="date" id="w-bot-caducidad" value="${data.caducidad || ''}" class="wizard-input">
              </div>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.nombre = document.getElementById('w-bot-nombre')?.value.trim() || '';
          data.tipo = document.getElementById('w-bot-tipo')?.value || 'otro';
          data.unidad = document.getElementById('w-bot-unidad')?.value || 'dosis';
          const cant = parseFloat(document.getElementById('w-bot-cantidad')?.value);
          data.cantidadActual = isNaN(cant) ? 0 : cant;
          const minima = parseFloat(document.getElementById('w-bot-minima')?.value);
          data.cantidadMinima = isNaN(minima) ? null : minima;
          data.lote = document.getElementById('w-bot-lote')?.value.trim() || '';
          data.caducidad = document.getElementById('w-bot-caducidad')?.value || null;
        },
        validate: async (data) => {
          if (!data.nombre) { App.toastError('Indica el nombre del producto.'); return false; }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-nuevo-botiquin',
      title: 'NUEVO PRODUCTO',
      initialData: { nombre: '', tipo: 'vacuna', unidad: 'dosis', cantidadActual: 0, cantidadMinima: null, lote: '', caducidad: null },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          await window.db.add('config_botiquin', {
            fincaId: finca.id,
            nombre: finalData.nombre,
            tipo: finalData.tipo,
            unidad: finalData.unidad,
            cantidadActual: finalData.cantidadActual,
            cantidadMinima: finalData.cantidadMinima,
            lote: finalData.lote,
            caducidad: finalData.caducidad,
            notas: '',
            creadoEn: new Date().toISOString(),
          });
          App.toast("Producto registrado", "success");
          App.route();
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  },

  async _abrirMovimiento(id, tipo) {
    const p = await window.db.get('config_botiquin', id);
    if (!p) return;

    const wizardSteps = [
      {
        content: (data) => `
          <div class="mt-10">
            <div class="text-center mb-15">
              <div class="text-xs text-gray uppercase font-800">${tipo === 'entrada' ? 'ENTRADA DE STOCK' : 'CONSUMO'}</div>
              <div class="text-white font-900 uppercase">${p.nombre}</div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label" for="w-mov-cantidad">CANTIDAD (${(p.unidad || '').toUpperCase()})</label>
              <input type="number" id="w-mov-cantidad" value="${data.cantidad || ''}" min="0.01" step="0.01" class="wizard-input font-900 text-lg">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label" for="w-mov-fecha">FECHA</label>
              <input type="date" id="w-mov-fecha" value="${data.fecha}" class="wizard-input font-800">
            </div>
          </div>
        `,
        onChange: async (data) => {
          const c = parseFloat(document.getElementById('w-mov-cantidad')?.value);
          data.cantidad = isNaN(c) ? 0 : c;
          data.fecha = document.getElementById('w-mov-fecha')?.value || data.fecha;
        },
        validate: async (data) => {
          if (!data.cantidad || data.cantidad <= 0) { App.toastError('Indica una cantidad válida.'); return false; }
          if (tipo === 'consumo' && data.cantidad > Number(p.cantidadActual || 0)) {
            App.toastError('No puedes consumir más stock del disponible.');
            return false;
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-movimiento-botiquin',
      title: tipo === 'entrada' ? 'ENTRADA DE STOCK' : 'REGISTRAR CONSUMO',
      initialData: { cantidad: null, fecha: new Date().toISOString().split('T')[0] },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          p.cantidadActual = tipo === 'entrada'
            ? Number(p.cantidadActual || 0) + finalData.cantidad
            : Number(p.cantidadActual || 0) - finalData.cantidad;
          await window.db.put('config_botiquin', p);
          await window.db.add('registro_eventos', {
            fincaId: p.fincaId,
            entidad_id: p.id,
            tipo_entidad: 'botiquin',
            tipo: 'movimiento',
            motivo_tarea: tipo === 'entrada' ? 'entrada_botiquin' : 'consumo_botiquin',
            fecha: finalData.fecha,
            valor_neto: finalData.cantidad,
            unidad: p.unidad,
            descripcion: `${tipo === 'entrada' ? 'Entrada' : 'Consumo'} de ${finalData.cantidad} ${p.unidad} de ${p.nombre}`,
            creadoEn: new Date().toISOString(),
          });
          App.toast(tipo === 'entrada' ? "Entrada registrada" : "Consumo registrado", "success");
          location.hash = `#/botiquin-producto?id=${p.id}`;
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  },

  async _eliminarProducto(id) {
    if (!await Confirm.confirm("Eliminar producto", "¿Eliminar este producto del botiquín? Se conservará el historial de movimientos para auditoría.", true)) return;
    try {
      const p = await window.db.get('config_botiquin', id);
      if (!p) { App.toastError("Producto no encontrado."); return; }
      p.anulado = true;
      p.anuladoEn = new Date().toISOString();
      await window.db.put('config_botiquin', p);
      App.toast("Producto eliminado", "success");
      location.hash = "#/botiquin";
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.BotiquinView = BotiquinView;
