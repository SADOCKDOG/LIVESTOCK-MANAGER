/**
 * ContratosView - Livestock Manager Premium v4.0
 * Vista de contratos de compra: detalle con tabla de precios, formulario.
 */

const ContratosView = {

    // ============================================
    // FORMULARIO DE CONTRATO (nuevo / editar)
    // ============================================

    async renderFormulario(params) {
        const id = params?.get ? params.get('id') : null;
        const compradorId = params?.get ? params.get('compradorId') : null;
        const esEdicion = !!id;

        let contrato = esEdicion ? await Contratos.get(id) : {
            compradorId: Number(compradorId) || null,
            numero_contrato: '',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: '',
            tipo: 'carne',
            precios: [],
            iva_pct: 10,
            retencion_pct: 0,
            condiciones: '',
            notas: '',
            activo: true
        };

        let comprador = contrato.compradorId ? await Compradores.get(contrato.compradorId) : null;

        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-12">
            <a href="${comprador ? '#/comprador?id='+contrato.compradorId : '#/compradores'}" class="link-back">← Volver</a>
          </div>
          <div class="card" style="border-top:4px solid #8b5cf6; padding:20px;">
            <h2 class="text-gold m-0 mb-16" style="font-size:1.1rem; border:none; padding:0;">
              ${esEdicion ? `${Icons.editar()} Contrato: ` + contrato.numero_contrato : `${Icons.agregar()} Nuevo Contrato`}
            </h2>

            ${comprador ? `
            <div class="bg-dark rounded-10 mb-16 flex justify-between items-center" style="padding:10px 14px;">
              <span class="text-white font-bold">Comprador: ${comprador.nombre}</span>
              <span class="badge badge-purple">${comprador.tipo_comprador}</span>
            </div>` : `
            <div class="mb-16">
              <label class="form-label">COMPRADOR *</label>
              <select id="ct-comprador" class="premium-input">
                <option value="">Seleccionar comprador...</option>
                ${(await Compradores.list({ activo: true })).map(c =>
                  `<option value="${c.id}" ${Number(contrato.compradorId) === c.id ? 'selected' : ''}>${c.nombre} (${c.tipo_comprador})</option>`
                ).join('')}
              </select>
            </div>`}

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div>
                <label class="form-label">Nº CONTRATO *</label>
                <input type="text" id="ct-numero" value="${contrato.numero_contrato}" class="premium-input" placeholder="CT-2024-001">
              </div>
              <div>
                <label class="form-label">TIPO</label>
                <select id="ct-tipo" class="premium-input">
                  <option value="carne" ${contrato.tipo === 'carne' ? 'selected' : ''}>🥩 Carne</option>
                  <option value="leche" ${contrato.tipo === 'leche' ? 'selected' : ''}>🥛 Leche</option>
                  <option value="mixto" ${contrato.tipo === 'mixto' ? 'selected' : ''}>🔄 Mixto</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div>
                <label class="form-label">FECHA INICIO *</label>
                <input type="date" id="ct-inicio" value="${contrato.fecha_inicio}" class="premium-input">
              </div>
              <div>
                <label class="form-label">FECHA FIN (opcional)</label>
                <input type="date" id="ct-fin" value="${contrato.fecha_fin || ''}" class="premium-input">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div>
                <label class="form-label">IVA (%)</label>
                <input type="number" id="ct-iva" value="${contrato.iva_pct}" class="premium-input" step="0.1">
              </div>
              <div>
                <label class="form-label">RETENCIÓN REAGP (%)</label>
                <input type="number" id="ct-ret" value="${contrato.retencion_pct}" class="premium-input" step="0.1">
              </div>
            </div>

            <label class="form-label">CONDICIONES</label>
            <textarea id="ct-cond" class="premium-input mb-12" style="min-height:60px; resize:none;">${contrato.condiciones}</textarea>

            <!-- TABLA DE PRECIOS -->
            <div class="mt-16 mb-12">
              <div class="flex justify-between items-center mb-8">
                <h3 class="text-gold m-0 text-85">${Icons.dinero()} Tabla de Precios</h3>
                <button onclick="ContratosView._addPrecioRow()" class="btn btn-create btn-sm" style="font-size:0.65rem; padding:4px 8px;">${Icons.agregar()} Añadir precio</button>
              </div>
              <div id="ct-precios-container">
                ${contrato.precios && contrato.precios.length > 0 ?
                  contrato.precios.map((pr, i) => this._renderPrecioRow(pr, i)).join('') :
                  '<div class="empty-state"><p class="empty-state-text">Aún no hay precios definidos. Añade el primer precio.</p></div>'
                }
              </div>
            </div>

            <label class="wizard-checkbox-container mb-16">
              <input type="checkbox" id="ct-activo" ${contrato.activo !== false ? 'checked' : ''}>
              <span>Contrato activo</span>
            </label>

            <div class="flex justify-between items-center mt-20">
              ${esEdicion ? `<button onclick="App.toastError('Para eliminar el contrato, desactívelo.')" class="btn btn-danger" style="opacity: 0.5;">${Icons.eliminar()} Eliminar</button>` : '<div></div>'}
              <div class="flex gap-10">
                <button onclick="location.hash='${comprador ? '#/comprador?id='+contrato.compradorId : '#/compradores'}'" class="btn btn-secondary">${Icons.cerrar()} Cancelar</button>
                <button onclick="ContratosView._guardar('${id || ''}')" class="btn btn-success">${Icons.guardar()} Guardar</button>
              </div>
            </div>
          </div>
        `;
    },

    _renderPrecioRow(pr, index) {
        const uid = pr.id || Date.now() + index;
        return `
          <div class="precio-row" data-precioid="${uid}" style="display:grid; grid-template-columns:2fr 1fr 1fr 0.5fr; gap:6px; margin-bottom:6px; align-items:end;">
            <div>
              <label class="kpi-label">Producto</label>
              <input type="text" class="precio-producto premium-input text-75 p-8" value="${pr.producto || ''}" placeholder="Ej: Canal ovino">
            </div>
            <div>
              <label class="kpi-label">Precio</label>
              <input type="number" class="precio-valor premium-input text-75 p-8" value="${pr.precio_unitario || ''}" step="0.001">
            </div>
            <div>
              <label class="kpi-label">Unidad</label>
              <select class="precio-unidad premium-input text-75 p-8">
                <option value="kg" ${pr.unidad === 'kg' ? 'selected' : ''}>€/kg</option>
                <option value="L" ${pr.unidad === 'L' ? 'selected' : ''}>€/L</option>
                <option value="unidad" ${pr.unidad === 'unidad' ? 'selected' : ''}>€/ud</option>
                <option value="cabeza" ${pr.unidad === 'cabeza' ? 'selected' : ''}>€/cab</option>
              </select>
            </div>
            <div>
              <label class="kpi-label">&nbsp;</label>
              <button onclick="this.closest('.precio-row').remove()" class="btn btn-danger" style="display:block; width:100%; padding:8px; border-radius:8px; font-size:0.7rem; font-weight:800;">${Icons.cerrar()}</button>
            </div>
          </div>`;
    },

    _addPrecioRow() {
        const container = document.getElementById('ct-precios-container');
        if (!container) return;
        // Quitar mensaje vacío si existe
        const emptyMsg = container.querySelector('.empty-state');
        if (emptyMsg) emptyMsg.remove();
        container.insertAdjacentHTML('beforeend', this._renderPrecioRow({ producto: '', precio_unitario: '', unidad: 'kg' }, Date.now()));
    },

    _getPrecios() {
        const rows = document.querySelectorAll('.precio-row');
        return Array.from(rows).map(row => ({
            id: parseInt(row.dataset.precioid) || Date.now(),
            producto: row.querySelector('.precio-producto')?.value || '',
            precio_unitario: parseFloat(row.querySelector('.precio-valor')?.value) || 0,
            unidad: row.querySelector('.precio-unidad')?.value || 'kg'
        })).filter(p => p.producto && p.precio_unitario > 0);
    },

    async _guardar(id) {
        try {
            const compradorId = id ? null : (
                parseInt(document.getElementById('ct-comprador')?.value) ||
                parseInt(document.querySelector('[data-compradorid]')?.dataset.compradorid)
            );
            const data = {
                id: id || undefined,
                compradorId: compradorId,
                numero_contrato: document.getElementById('ct-numero').value.trim(),
                tipo: document.getElementById('ct-tipo').value,
                fecha_inicio: document.getElementById('ct-inicio').value,
                fecha_fin: document.getElementById('ct-fin').value || null,
                iva_pct: parseFloat(document.getElementById('ct-iva').value) || 0,
                retencion_pct: parseFloat(document.getElementById('ct-ret').value) || 0,
                condiciones: document.getElementById('ct-cond').value.trim(),
                precios: this._getPrecios(),
                activo: document.getElementById('ct-activo').checked
            };

            if (!data.numero_contrato) return App.toastError('El número de contrato es obligatorio');
            if (!data.compradorId) return App.toastError('Selecciona un comprador');

            const nuevoId = await Contratos.save(data);
            App.toast(id ? 'Contrato actualizado ✔' : 'Contrato creado ✔');
            location.hash = '#/comprador?id=' + data.compradorId;
        } catch (e) {
            App.toastError(e.message);
        }
    }
};

window.ContratosView = ContratosView;
