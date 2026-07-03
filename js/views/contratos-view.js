/**
 * ContratosView - Livestock Manager Premium v4.2.0
 * Vista de contratos de compra: diseño Premium Neón con trazabilidad de precios.
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

        const compradores = await Compradores.list().catch(() => []);

        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-14">
            <button onclick="location.hash='#/compradores'" class="widget-link-btn widget-link-btn--neon neon-danger px-16 py-8 min-h-0 h-auto">
              <span class="text-[0.7rem] font-950 uppercase tracking-widest">${Icons.atras()} Cancelar</span>
            </button>
          </div>
          <div class="card card-accent card-accent-purple p-20 bg-black">
            <div class="section-header-theme mb-20" style="--theme-color: var(--c-purple)">${esEdicion ? Icons.editar() : Icons.agregar()} ${esEdicion ? 'EDITAR CONTRATO' : 'NUEVO CONTRATO'}</div>

            <div class="wizard-input-group mb-15">
              <label class="wizard-label uppercase font-900">COMPRADOR / CLIENTE *</label>
              <select id="ct-comprador" class="wizard-input wizard-select font-900 uppercase">
                <option value="">— SELECCIONAR COMPRADOR —</option>
                ${compradores.map(c =>
                  `<option value="${c.id}" ${Number(contrato.compradorId) === c.id ? 'selected' : ''}>${c.nombre.toUpperCase()} (${c.tipo_comprador.toUpperCase()})</option>`
                ).join('')}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">Nº CONTRATO *</label>
                <input type="text" id="ct-numero" value="${contrato.numero_contrato || ''}" class="wizard-input uppercase font-950 text-gold" placeholder="EJ: CT-2024-001">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">TIPO CONTRATO</label>
                <select id="ct-tipo" class="wizard-input wizard-select font-900 uppercase">
                  <option value="carne" ${contrato.tipo === 'carne' ? 'selected' : ''}>CARNE</option>
                  <option value="leche" ${contrato.tipo === 'leche' ? 'selected' : ''}>LECHE</option>
                  <option value="mixto" ${contrato.tipo === 'mixto' ? 'selected' : ''}>MIXTO / OTRO</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">FECHA INICIO *</label>
                <input type="date" id="ct-inicio" value="${contrato.fecha_inicio || ''}" class="wizard-input font-800 uppercase">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">FECHA VENCIMIENTO</label>
                <input type="date" id="ct-fin" value="${contrato.fecha_fin || ''}" class="wizard-input font-800 uppercase">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">IVA (%)</label>
                <input type="number" id="ct-iva" value="${contrato.iva_pct !== undefined ? contrato.iva_pct : 10}" class="wizard-input font-900 text-lg" step="0.1">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">RETENCIÓN REAGP (%)</label>
                <input type="number" id="ct-ret" value="${contrato.retencion_pct !== undefined ? contrato.retencion_pct : 0}" class="wizard-input font-900 text-lg" step="0.1">
              </div>
            </div>

            <div class="wizard-input-group mb-20">
                <label class="wizard-label uppercase font-900">CONDICIONES PARTICULARES</label>
                <textarea id="ct-cond" class="wizard-input uppercase font-700" style="min-height:80px; resize:none;">${contrato.condiciones || ''}</textarea>
            </div>

            <!-- TABLA DE PRECIOS -->
            <div class="mt-20 mb-20 p-16 bg-black border border-222 rounded-sm">
              <div class="flex justify-between items-center mb-16 border-bottom-222 pb-10">
                <h3 class="text-gold font-950 uppercase text-[0.7rem] m-0 tracking-widest">${Icons.dinero()} TABLA DE PRECIOS PACTADOS</h3>
                <button onclick="ContratosView._addPrecioRow()" class="widget-link-btn widget-link-btn--neon neon-success px-12 py-4 min-h-0 h-auto">
                   <span class="text-[0.6rem] font-950 uppercase">${Icons.agregar()} AÑADIR</span>
                </button>
              </div>
              <div id="ct-precios-container" class="grid gap-10">
                ${contrato.precios && contrato.precios.length > 0 ?
                  contrato.precios.map((pr, i) => this._renderPrecioRow(pr, i)).join('') :
                  '<div class="empty-state border-none p-10"><p class="empty-state-text uppercase font-900 text-[0.6rem]">Sin precios definidos. Pulsa "AÑADIR".</p></div>'
                }
              </div>
            </div>

            <label class="flex items-center gap-10 text-xs text-white cursor-pointer bg-black border border-222 p-12 rounded-sm mb-25">
              <input type="checkbox" id="ct-activo" ${contrato.activo !== false ? 'checked' : ''} style="accent-color:var(--c-purple);">
              <span class="uppercase font-950 tracking-widest text-[0.65rem]">Contrato vigente y activo</span>
            </label>

            <div class="grid grid-cols-2 gap-10 mt-20">
                <button onclick="ContratosView._guardar('${id || ''}')" class="widget-link-btn widget-link-btn--neon neon-success">
                  ${Icons.guardar()} <span class="widget-link-label">GUARDAR</span>
                </button>
                <button onclick="location.hash='#/compradores'" class="widget-link-btn widget-link-btn--neon neon-danger">
                  ${Icons.cerrar()} <span class="widget-link-label">CANCELAR</span>
                </button>
            </div>
            ${esEdicion ? `<div class="mt-15 text-center"><button onclick="ContratosView._eliminarContrato(${contrato.id})" class="text-red font-900 text-[0.6rem] uppercase tracking-widest p-10 opacity-60 hover:opacity-100 transition-all">${Icons.eliminar()} Anular contrato permanentemente</button></div>` : ''}
          </div>
          <div class="pb-40"></div>
        `;
    },

    _renderPrecioRow(pr, index) {
        const uid = pr.id || Date.now() + index;
        return `
          <div class="precio-row grid grid-cols-[2fr_1fr_1fr_40px] gap-8 items-end bg-dark p-10 rounded-sm border border-333" data-precioid="${uid}">
            <div>
              <label class="text-[0.55rem] text-gray-500 font-950 uppercase tracking-widest mb-4 d-block">PRODUCTO</label>
              <input type="text" class="precio-producto wizard-input font-800 uppercase p-8 text-xs" value="${pr.producto || ''}" placeholder="EJ: CANAL OVINO">
            </div>
            <div>
              <label class="text-[0.55rem] text-gray-500 font-950 uppercase tracking-widest mb-4 d-block">PRECIO (€)</label>
              <input type="number" class="precio-valor wizard-input font-950 text-green p-8 text-sm" value="${pr.precio_unitario || ''}" step="0.001">
            </div>
            <div>
              <label class="text-[0.55rem] text-gray-500 font-950 uppercase tracking-widest mb-4 d-block">UNIDAD</label>
              <select class="precio-unidad wizard-input wizard-select font-900 p-8 text-[0.65rem]">
                <option value="kg" ${pr.unidad === 'kg' ? 'selected' : ''}>€/kg</option>
                <option value="L" ${pr.unidad === 'L' ? 'selected' : ''}>€/L</option>
                <option value="unidad" ${pr.unidad === 'unidad' ? 'selected' : ''}>€/UD</option>
                <option value="cabeza" ${pr.unidad === 'cabeza' ? 'selected' : ''}>€/CAB</option>
              </select>
            </div>
            <button onclick="this.closest('.precio-row').remove()" class="btn btn-danger p-10" style="height:38px; display:flex; align-items:center; justify-content:center;">${Icons.eliminar()}</button>
          </div>`;
    },

    _addPrecioRow() {
        const container = document.getElementById('ct-precios-container');
        if (!container) return;
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
            const compradorId = parseInt(document.getElementById('ct-comprador').value) || null;
            const data = {
                id: id ? Number(id) : undefined,
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

            await Contratos.save(data);
            App.toast(id ? 'Contrato actualizado' : 'Contrato creado', 'success');
            
            location.hash = '#/compradores';
        } catch (e) {
            App.toastError(e.message);
        }
    },

    async _eliminarContrato(id) {
        if (!await Confirm.confirm("Eliminar Contrato", "¿Deseas eliminar este contrato permanentemente? Esta acción es irreversible.")) return;
        try {
            await Contratos.delete(id);
            App.toast("Contrato eliminado");
            location.hash = '#/compradores';
        } catch (e) {
            App.toastError("Error: " + e.message);
        }
    }
};

window.ContratosView = ContratosView;
