/**
 * ProveedoresView - Livestock Manager Premium v4.0
 * Vista de proveedores: lista, detalle con trazabilidad de gastos, formulario.
 */

const ProveedoresView = {
    _cachedData: null,

    async render() {
        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-16">
            <div id="prov-kpis"></div>
            <div class="flex gap-8">
              <input type="search" id="search-proveedores" placeholder="🔍 Buscar por nombre, NIF o ciudad..."
                oninput="ProveedoresView._filtrar(this.value)"
                class="search-input">
              <button class="btn btn-create btn-sm" onclick="ProveedoresView.renderFormulario()">${Icons.agregar()} Nuevo</button>
            </div>
          </div>
          <div id="prov-lista"><div class="loader">Cargando proveedores...</div></div>
          <button class="fab-btn" onclick="ProveedoresView.renderFormulario()" aria-label="Nuevo Proveedor">${Icons.agregar()}</button>`;

        await this._cargarDatos();
    },

    async _cargarDatos() {
        const proveedores = await Proveedores.list();
        const fincaId = await Fincas.getActiveId();
        const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []);
        const gastosConProveedor = gastos.filter(g => g.proveedorId != null);
        const totalGasto = gastosConProveedor.reduce((s, g) => s + (g.monto || 0), 0);
        const kpisEl = document.getElementById('prov-kpis');
        if (kpisEl) {
            kpisEl.innerHTML = `
              <div class="grid grid-cols-3 gap-6 mb-14">
                <div class="info-box-center" style="border-left:3px solid #8b5cf6;"><small class="s-lbl">PROVEEDORES</small><div class="inf-val-lg text-purple">${proveedores.length}</div></div>
                <div class="info-box-center" style="border-left:3px solid #f59e0b;"><small class="s-lbl">GASTO ASIGNADO</small><div class="inf-val-lg text-amber">${totalGasto.toLocaleString()}€</div></div>
                <div class="info-box-center" style="border-left:3px solid #3b82f6;"><small class="s-lbl">GASTOS</small><div class="inf-val-lg text-blue">${gastosConProveedor.length}</div></div>
              </div>`;
        }
        this._cachedData = proveedores;
        this._renderLista(proveedores);
    },

    _filtrar(texto) {
        if (!this._cachedData) return;
        if (!texto) return this._renderLista(this._cachedData);
        const q = texto.toLowerCase();
        const filtrados = this._cachedData.filter(p =>
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.nif_cif || '').toLowerCase().includes(q) ||
            (p.ciudad || '').toLowerCase().includes(q)
        );
        this._renderLista(filtrados);
    },

    _renderLista(lista) {
        const contenedor = document.getElementById('prov-lista');
        if (!contenedor) return;

        if (lista.length === 0) {
            contenedor.innerHTML = `
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.edificio()}</div>
                <p class="empty-state-text">${this._cachedData?.length === 0 ? 'Aún no hay proveedores registrados.' : 'No hay proveedores con ese filtro.'}</p>
                <button onclick="ProveedoresView.renderFormulario()"
                  class="btn btn-create btn-sm mt-10">${Icons.agregar()} Registrar primer proveedor</button>
              </div>`;
            return;
        }

        contenedor.innerHTML = `<div class="grid gap-10">${lista.map(p => `
          <div class="card card-list-item card-left-green" onclick="ProveedoresView.renderDetalle(${p.id})">
            <div class="flex justify-between items-start">
              <div class="flex-1 min-w-0">
                <div class="text-white font-800 text-base">${p.nombre}</div>
                <div class="text-gray mt-4 text-xs">
                  ${p.nif_cif ? '🔑 '+p.nif_cif : ''}${p.ciudad ? ' · 📍 '+p.ciudad : ''}
                  ${Array.isArray(p.categorias) && p.categorias.length > 0 ? ' · '+p.categorias.join(', ') : ''}
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-8">
                ${p.activo === false ? '<span class="text-red font-800 text-xs">INACTIVO</span>' : ''}
              </div>
            </div>
          </div>
        `).join('')}</div>`;
    },

    // ============================================
    // DETALLE PROVEEDOR
    // ============================================

    async renderDetalle(id) {
        const proveedor = await Proveedores.get(id);
        if (!proveedor) return App.toastError('Proveedor no encontrado');

        const [gastos, resumen] = await Promise.all([
            Proveedores.getGastos(id),
            Proveedores.getResumen(id)
        ]);

        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-12">
            <a href="#/proveedores" class="link-back">← Volver a proveedores</a>
          </div>

          <!-- Cabecera -->
          <div class="card p-20 border-top-3px border-top-3px-green">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-white mt-0 mb-4 text-2xl">${proveedor.nombre}</h2>
                <div class="mb-8">
                  ${proveedor.activo === false ? '<span class="text-red font-800 text-xs">INACTIVO</span>' : '<span class="text-green font-800 text-xs">ACTIVO</span>'}
                </div>
              </div>
              <div class="flex gap-6">
                <button onclick="ProveedoresView._eliminar(${id})" class="btn btn-danger btn-sm">${Icons.eliminar()} Eliminar</button>
                <button onclick="ProveedoresView.renderFormulario(${id})" class="btn btn-edit btn-sm">${Icons.editar()} Editar</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-6 mt-12 text-sm text-aaa">
              ${proveedor.nif_cif ? '<div>🔑 <strong>NIF:</strong> '+proveedor.nif_cif+'</div>' : ''}
              ${proveedor.telefono ? '<div>📞 <strong>Tel:</strong> '+proveedor.telefono+'</div>' : ''}
              ${proveedor.email ? '<div>📧 <strong>Email:</strong> '+proveedor.email+'</div>' : ''}
              ${proveedor.ciudad ? '<div>📍 <strong>Ciudad:</strong> '+proveedor.ciudad+(proveedor.provincia ? ' ('+proveedor.provincia+')' : '')+'</div>' : ''}
              ${proveedor.condiciones_pago ? '<div style="grid-column:span 2;">💳 <strong>Condiciones pago:</strong> '+proveedor.condiciones_pago+'</div>' : ''}
              ${Array.isArray(proveedor.categorias) && proveedor.categorias.length > 0 ? '<div style="grid-column:span 2;">🏷️ <strong>Categorías:</strong> '+proveedor.categorias.join(', ')+'</div>' : ''}
            </div>
          </div>

          <!-- KPIs -->
          <div class="grid grid-cols-3 gap-8 mb-14">
            <div class="card p-12 text-center mb-0">
              <div class="kpi-label">Total Gastado</div>
              <div class="kpi-value text-green" style="font-size:1.2rem;">${resumen.total_gastado.toFixed(2)} €</div>
            </div>
            <div class="card p-12 text-center mb-0">
              <div class="kpi-label">Registros</div>
              <div class="kpi-value text-blue">${resumen.total_gastos}</div>
              <div class="kpi-sub">gasto medio ${resumen.gasto_promedio.toFixed(1)} €</div>
            </div>
            <div class="card p-12 text-center mb-0">
              <div class="kpi-label">Gasto Anual</div>
              <div class="kpi-value text-red" style="font-size:1.2rem;">${resumen.gasto_anual.toFixed(2)} €</div>
              <div class="kpi-sub">últimos 12 meses</div>
            </div>
          </div>

          <!-- Desglose por categoría -->
          <div class="card p-16">
            <h3 class="section-h3">${Icons.grafico()} Gastos por Categoría</h3>
            ${Object.keys(resumen.por_categoria).length === 0 ? '<div class="empty-state mt-0 mb-0"><p class="empty-state-text">Sin gastos registrados.</p></div>' :
              Object.entries(resumen.por_categoria).map(([cat, info]) => `
                <div class="history-row">
                  <div>
                    <span class="history-title">${cat}</span>
                    <span class="history-sub ml-8">(${info.count} registro${info.count !== 1 ? 's' : ''})</span>
                  </div>
                  <div class="history-amount text-green">${info.total.toFixed(2)} €</div>
                </div>
              `).join('')}
          </div>

          <!-- Historial de Gastos -->
          <div class="card p-16">
            <h3 class="section-h3">${Icons.dinero()} Historial de Gastos</h3>
            ${gastos.length === 0 ? '<div class="empty-state mt-0 mb-0"><p class="empty-state-text">Sin gastos registrados.</p></div>' :
              gastos.slice(0, 30).map(g => `
                <div class="history-row">
                  <div>
                    <div class="history-title">${Icons.calendar()} ${g.fecha ? new Date(g.fecha).toLocaleDateString() : '-'}</div>
                    <div class="history-sub">${g.categoria || 'Otros'}${g.descripcion ? ' · '+g.descripcion : ''}</div>
                  </div>
                  <div class="text-right">
                    <div class="history-amount text-red">${(g.monto || 0).toFixed(2)} €</div>
                    ${g.iva ? '<div class="kpi-sub">IVA: '+g.iva+'%</div>' : ''}
                  </div>
                </div>
              `).join('')}
            ${gastos.length > 30 ? `<div class="history-more">Mostrando 30 de ${gastos.length} registros</div>` : ''}
          </div>

          ${proveedor.notas ? `
          <div class="card p-16">
            <h3 class="section-h3">${Icons.documento()} Notas</h3>
            <p class="text-sm text-aaa m-0">${proveedor.notas}</p>
          </div>` : ''}
        `;
    },

    // ============================================
    // FORMULARIO PROVEEDOR
    // ============================================

    async renderFormulario(id) {
        const esEdicion = !!id;
        const p = esEdicion ? await Proveedores.get(id) : {
            nombre: '', nif_cif: '', direccion: '', codigo_postal: '', ciudad: '', provincia: '',
            telefono: '', email: '', categorias: [], condiciones_pago: '', notas: '', activo: true
        };

        const CATEGORIAS_DISPONIBLES = [
            'Alimentacion', 'Sanidad', 'Fitosanitarios', 'Electricidad', 'Personal', 'Amortizacion'
        ];

        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-12">
            <a href="${esEdicion ? '#/proveedor?id='+id : '#/proveedores'}" class="link-back">← Volver</a>
          </div>
          <div class="card p-20 border-top-3px border-top-3px-green">
            <h2 class="text-green mt-0 mb-16 text-md" style="border:none; padding:0;">${esEdicion ? `${Icons.editar()} Editar Proveedor` : `${Icons.agregar()} Nuevo Proveedor`}</h2>

            <label class="form-label">NOMBRE / RAZÓN SOCIAL *</label>
            <input type="text" id="p-nombre" value="${p.nombre}" class="premium-input mb-12" placeholder="Ej: Suministros Agrícolas S.L.">

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div>
                <label class="form-label">NIF / CIF</label>
                <input type="text" id="p-nif" value="${p.nif_cif}" class="premium-input" placeholder="B12345678">
              </div>
              <div>
                <label class="form-label">TELÉFONO</label>
                <input type="tel" id="p-tel" value="${p.telefono}" class="premium-input">
              </div>
            </div>

            <div class="grid grid-cols-3 gap-10 mb-12">
              <div>
                <label class="form-label">TIPO OPERADOR SIGGAN</label>
                <select id="p-tipo-operador" class="premium-input">
                  <option value="proveedor_servicios" ${!p.tipo_operador || p.tipo_operador === 'proveedor_servicios' ? 'selected' : ''}>Proveedor servicios</option>
                  <option value="piensos" ${p.tipo_operador === 'piensos' ? 'selected' : ''}>Piensos</option>
                  <option value="sanitario" ${p.tipo_operador === 'sanitario' ? 'selected' : ''}>Sanitario</option>
                  <option value="maquinaria" ${p.tipo_operador === 'maquinaria' ? 'selected' : ''}>Maquinaria</option>
                </select>
              </div>
              <div>
                <label class="form-label">REGA</label>
                <input type="text" id="p-rega" value="${p.rega || ''}" class="premium-input" placeholder="ES041230000123">
              </div>
              <div>
                <label class="form-label">CCAA</label>
                <select id="p-ccaa" class="premium-input">
                  <option value="">—</option>
                  <option value="andalucia" ${p.comunidad_autonoma === 'andalucia' ? 'selected' : ''}>Andalucía</option>
                  <option value="extremadura" ${p.comunidad_autonoma === 'extremadura' ? 'selected' : ''}>Extremadura</option>
                </select>
              </div>
            </div>

            <label class="form-label">DIRECCIÓN</label>
            <input type="text" id="p-dir" value="${p.direccion}" class="premium-input mb-12">

            <div class="grid grid-cols-3 gap-10 mb-12">
              <div>
                <label class="form-label">CÓDIGO POSTAL</label>
                <input type="text" id="p-cp" value="${p.codigo_postal}" class="premium-input">
              </div>
              <div>
                <label class="form-label">CIUDAD</label>
                <input type="text" id="p-ciudad" value="${p.ciudad}" class="premium-input">
              </div>
              <div>
                <label class="form-label">PROVINCIA</label>
                <input type="text" id="p-prov" value="${p.provincia}" class="premium-input">
              </div>
            </div>

            <div class="mb-12">
              <label class="form-label">CATEGORÍAS</label>
              <div class="flex flex-wrap gap-6">
                ${CATEGORIAS_DISPONIBLES.map(cat => `
                  <label class="text-ccc" style="display:flex; align-items:center; gap:4px; padding:5px 12px; border-radius:10px;
                    background:${(Array.isArray(p.categorias) && p.categorias.includes(cat)) ? 'rgba(5,150,105,0.15)' : '#1a1a1a'};
                    border:1px solid ${(Array.isArray(p.categorias) && p.categorias.includes(cat)) ? 'rgba(5,150,105,0.3)' : '#333'};
                    cursor:pointer; font-size:0.7rem; font-weight:600;">
                    <input type="checkbox" value="${cat}" ${(Array.isArray(p.categorias) && p.categorias.includes(cat)) ? 'checked' : ''}
                      style="accent-color:#059669;"
                      onchange="this.parentElement.style.background=this.checked ? 'rgba(5,150,105,0.15)' : '#1a1a1a';
                               this.parentElement.style.borderColor=this.checked ? 'rgba(5,150,105,0.3)' : '#333';">
                    ${cat}
                  </label>
                `).join('')}
              </div>
            </div>

            <label class="form-label">EMAIL</label>
            <input type="email" id="p-email" value="${p.email}" class="premium-input mb-12">

            <label class="form-label">CONDICIONES DE PAGO</label>
            <input type="text" id="p-pago" value="${p.condiciones_pago}" class="premium-input mb-12">

            <label class="form-label">NOTAS</label>
            <textarea id="p-notas" class="premium-input mb-12" style="min-height:60px; resize:none;">${p.notas}</textarea>

            <label class="wizard-checkbox-container mb-16">
              <input type="checkbox" id="p-activo" ${p.activo !== false ? 'checked' : ''}>
              <span>Proveedor activo</span>
            </label>

            <div class="flex justify-between items-center mt-20">
              ${esEdicion ? `<button onclick="ProveedoresView._eliminar(${id})" class="btn btn-danger">${Icons.eliminar()} Eliminar</button>` : '<div></div>'}
              <div class="flex gap-10">
                <button onclick="location.hash='${esEdicion ? '#/proveedor?id='+id : '#/proveedores'}'" class="btn btn-secondary">${Icons.cerrar()} Cancelar</button>
                <button onclick="ProveedoresView._guardar(${id || ''})" class="btn btn-success">${Icons.guardar()} Guardar</button>
              </div>
            </div>
          </div>
        `;
    },

    async _guardar(id) {
        try {
            const categorias = [...document.querySelectorAll('#app-content input[type=checkbox][value]')]
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            const data = {
                id: id || undefined,
                nombre: document.getElementById('p-nombre').value.trim(),
                nif_cif: document.getElementById('p-nif').value.trim(),
                tipo_operador: document.getElementById('p-tipo-operador').value,
                rega: document.getElementById('p-rega').value.trim(),
                comunidad_autonoma: document.getElementById('p-ccaa').value,
                direccion: document.getElementById('p-dir').value.trim(),
                codigo_postal: document.getElementById('p-cp').value.trim(),
                ciudad: document.getElementById('p-ciudad').value.trim(),
                provincia: document.getElementById('p-prov').value.trim(),
                telefono: document.getElementById('p-tel').value.trim(),
                email: document.getElementById('p-email').value.trim(),
                categorias: categorias,
                condiciones_pago: document.getElementById('p-pago').value.trim(),
                notas: document.getElementById('p-notas').value.trim(),
                activo: document.getElementById('p-activo').checked
            };

            if (!data.nombre) return App.toastError('El nombre es obligatorio');

            const nuevoId = await Proveedores.save(data);
            App.toast(id ? 'Proveedor actualizado ✔' : 'Proveedor creado ✔');
            location.hash = '#/proveedor?id=' + nuevoId;
        } catch (e) {
            App.toastError(e.message);
        }
    },

    async _eliminar(id) {
        if (!await Confirm.confirm("Eliminar Proveedor", "¿Eliminar este proveedor permanentemente?", true)) return;
        try {
            await Proveedores.delete(id);
            App.toast('Proveedor eliminado');
            location.hash = '#/proveedores';
        } catch (e) {
            App.toastError(e.message);
        }
    }
};

window.ProveedoresView = ProveedoresView;
