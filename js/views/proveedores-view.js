/**
 * ProveedoresView - Livestock Manager Premium v4.0
 * Vista de proveedores: lista, detalle con trazabilidad de gastos, formulario.
 */

const ProveedoresView = {
    _cachedData: null,

    async render() {
        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-16 text-center">
            <div class="section-header-neon" style="--neon-color: #10b981; max-width: 520px; margin: 0 auto;">PROVEEDORES</div>
          </div>

          <div class="mb-16">
            <div id="prov-kpis"></div>
            <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24" style="--theme-color: var(--p-gold);">
              <div class="section-header-theme">ACCIONES</div>
              <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto">
                <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="ProveedoresView.renderFormulario()">
                  ${Icons.agregar()}
                  <span class="widget-link-label">Nuevo Proveedor</span>
                </button>
              </div>
              <div class="text-right mt-4"><span class="text-[0.55rem] text-gray uppercase font-700 tracking-wider leading-normal">Registro y gestión de proveedores de servicios e insumos ganaderos</span></div>
            </div>
            <div class="flex gap-8 mb-14">
              <input type="search" id="search-proveedores" placeholder="Buscar por nombre, NIF o ciudad..."
                oninput="ProveedoresView._filtrar(this.value)"
                class="search-input flex-1">
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
              <div class="grid grid-cols-3 gap-8 mb-16">
                <div class="summary-cell summary-cell-kpi border-left-violet"><small class="s-lbl uppercase font-900">PROVEEDORES</small><div class="s-val inf-val-lg text-purple">${proveedores.length}</div></div>
                <div class="summary-cell summary-cell-kpi border-left-amber"><small class="s-lbl uppercase font-900">GASTO ASIGNADO</small><div class="s-val inf-val-lg text-amber">${totalGasto.toLocaleString()}€</div></div>
                <div class="summary-cell summary-cell-kpi border-left-blue"><small class="s-lbl uppercase font-900">REGISTROS</small><div class="s-val inf-val-lg text-blue">${gastosConProveedor.length}</div></div>
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
              <div class="empty-state border border-222">
                <div class="empty-state-icon" style="color:#555;">${Icons.proveedores()}</div>
                <p class="empty-state-text uppercase font-900 text-xs">${this._cachedData?.length === 0 ? 'Aún no hay proveedores registrados.' : 'No hay proveedores con ese filtro.'}</p>
                <button onclick="ProveedoresView.renderFormulario()"
                  class="widget-link-btn widget-link-btn--neon neon-success px-16 mt-10">
                  ${Icons.agregar()} <span class="widget-link-label">REGISTRAR PRIMERO</span>
                </button>
              </div>`;
            return;
        }

        contenedor.innerHTML = `<div class="grid gap-12">${lista.map(p => `
          <div class="card card-animal no-underline" onclick="ProveedoresView.renderDetalle(${p.id})"
            style="border-left:4px solid #10b981; padding:14px; margin:0; margin-bottom:8px;">
            <div class="flex flex-col gap-10">
              <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-10 min-w-0">
                  <div class="text-xl" style="color:#10b981">${Icons.proveedores()}</div>
                  <div class="text-xs">
                    <div class="font-950 text-white uppercase text-base tracking-tight">${p.nombre}</div>
                    <div class="text-gray-500 mt-2 font-800 uppercase text-[0.65rem] tracking-wider flex items-center gap-6">
                      ${p.nif_cif ? Icons.documento() + ' ' + p.nif_cif : ''}${p.ciudad ? ' · ' + Icons.zonas() + ' ' + p.ciudad.toUpperCase() : ''}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  ${p.activo === false ? '<span class="badge badge-sm font-900 uppercase" style="background:#ef444420; color:#ef4444; border:1px solid #ef444440;">INACTIVO</span>' : '<span class="badge badge-sm font-900 uppercase" style="background:#10b98120; color:#10b981; border:1px solid #10b98140;">ACTIVO</span>'}
                </div>
              </div>

              <div class="flex justify-between items-end w-full mt-10">
                <div class="flex-1 min-w-0">
                  ${Array.isArray(p.categorias) && p.categorias.length > 0 ? `
                  <div class="flex flex-wrap gap-4 text-[0.62rem] text-aaa font-800 uppercase tracking-tighter">
                    ${p.categorias.map(cat => `<span class="flex items-center gap-2 bg-black px-8 py-2 rounded-sm border border-222">${Icons.paquete()} ${cat.toUpperCase()}</span>`).join('')}
                  </div>` : ''}
                </div>
                <div class="text-right">
                  <div class="text-[0.45rem] text-gray-700 font-900 uppercase tracking-widest">VER FICHA ➔</div>
                </div>
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
          <div class="mb-14">
            <button onclick="location.hash='#/proveedores'" class="widget-link-btn widget-link-btn--neon neon-danger px-16 py-8 min-h-0 h-auto">
              <span class="text-[0.7rem] font-950 uppercase tracking-widest">${Icons.atras()} Volver</span>
            </button>
          </div>

          <!-- Cabecera -->
          <div class="card p-20 border-top-3px border-top-3px-green bg-black">
            <div class="flex justify-between items-start mb-16">
              <div>
                <h2 class="text-white mt-0 mb-4 text-2xl font-black uppercase tracking-tight">${proveedor.nombre}</h2>
                <div class="mt-4">
                  ${proveedor.activo === false
                    ? '<span class="badge badge-sm font-950 uppercase" style="background:#ef444420; color:#ef4444; border:1px solid #ef444440;">INACTIVO</span>'
                    : '<span class="badge badge-sm font-950 uppercase" style="background:#10b98120; color:#10b981; border:1px solid #10b98140;">ACTIVO</span>'}
                </div>
              </div>
              <div class="flex gap-8">
                <button class="widget-link-btn widget-link-btn--neon neon-danger px-12 py-8 min-h-0 h-auto" onclick="ProveedoresView._eliminar(${id})">
                  ${Icons.eliminar()}
                </button>
                <button class="widget-link-btn widget-link-btn--neon neon-info px-12 py-8 min-h-0 h-auto" onclick="ProveedoresView.renderFormulario(${id})">
                  ${Icons.editar()}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-15 text-xs text-gray-500 uppercase font-800 tracking-wider bg-dark p-14 rounded-sm border border-222">
              ${proveedor.nif_cif ? `<div class="flex items-center gap-6">${Icons.documento()} <span class="text-aaa">NIF:</span> <strong class="text-white">${proveedor.nif_cif}</strong></div>` : ''}
              ${proveedor.telefono ? `<div class="flex items-center gap-6">${Icons.info()} <span class="text-aaa">TEL:</span> <strong class="text-white">${proveedor.telefono}</strong></div>` : ''}
              ${proveedor.email ? `<div class="flex items-center gap-6 lowercase">${Icons.enlace()} <span class="text-aaa uppercase">EMAIL:</span> <strong class="text-white">${proveedor.email}</strong></div>` : ''}
              ${proveedor.ciudad ? `<div class="flex items-center gap-6">${Icons.zonas()} <span class="text-aaa">UBICACIÓN:</span> <strong class="text-white">${proveedor.ciudad.toUpperCase()}${proveedor.provincia ? ' ('+proveedor.provincia.toUpperCase()+')' : ''}</strong></div>` : ''}
              ${proveedor.condiciones_pago ? `<div class="col-span-full flex items-center gap-6 mt-4 border-top-222 pt-8">${Icons.dinero()} <span class="text-aaa">PAGO:</span> <strong class="text-white">${proveedor.condiciones_pago.toUpperCase()}</strong></div>` : ''}
            </div>
          </div>

          <!-- KPIs -->
          <div class="grid grid-cols-3 gap-8 mb-16">
            <div class="summary-cell summary-cell-kpi border-left-green">
              <small class="s-lbl uppercase font-900">TOTAL GASTADO</small>
              <div class="s-val inf-val-lg text-green font-950">${resumen.total_gastado.toLocaleString()}€</div>
            </div>
            <div class="summary-cell summary-cell-kpi border-left-blue">
              <small class="s-lbl uppercase font-900">REGISTROS</small>
              <div class="s-val inf-val-lg text-blue font-950">${resumen.total_gastos}</div>
              <small class="text-gray-600 text-[0.5rem] font-800 block mt-2">MEDIA: ${resumen.gasto_promedio.toFixed(1)}€</small>
            </div>
            <div class="summary-cell summary-cell-kpi border-left-red">
              <small class="s-lbl uppercase font-900">GASTO ANUAL</small>
              <div class="s-val inf-val-lg text-red font-950">${resumen.gasto_anual.toLocaleString()}€</div>
              <small class="text-gray-600 text-[0.5rem] font-800 block mt-2">ÚLTIMOS 12M</small>
            </div>
          </div>

          <!-- Desglose por categoría -->
          <div class="card p-16 mb-16 border-222 bg-black">
            <div class="text-xs text-gray-500 uppercase font-950 tracking-widest border-bottom-222 pb-8 mb-12 flex items-center gap-8">
                ${Icons.grafico()} GASTOS POR CATEGORÍA
            </div>
            ${Object.keys(resumen.por_categoria).length === 0 ? '<div class="empty-state border-none mt-0 mb-0"><p class="empty-state-text font-800 text-xs">Sin gastos registrados.</p></div>' :
              Object.entries(resumen.por_categoria).map(([cat, info]) => `
                <div class="history-row border-bottom-222 py-10">
                  <div class="flex items-center gap-8">
                    <span class="text-white font-900 uppercase text-xs">${Icons.paquete()} ${cat}</span>
                    <span class="text-gray-600 font-800 text-[0.6rem] uppercase tracking-tighter">(${info.count} REGISTROS)</span>
                  </div>
                  <div class="text-green font-950 text-md">${info.total.toLocaleString()} €</div>
                </div>
              `).join('')}
          </div>

          <!-- Historial de Gastos -->
          <div class="card p-16 mb-20 border-222 bg-black">
            <div class="text-xs text-gray-500 uppercase font-950 tracking-widest border-bottom-222 pb-8 mb-12 flex items-center gap-8">
                ${Icons.dinero()} ÚLTIMOS REGISTROS
            </div>
            ${gastos.length === 0 ? '<div class="empty-state border-none mt-0 mb-0"><p class="empty-state-text font-800 text-xs">Sin gastos registrados.</p></div>' :
              gastos.slice(0, 30).map(g => `
                <div class="history-row border-bottom-222 py-12">
                  <div>
                    <div class="text-gold font-950 uppercase text-[0.7rem] flex items-center gap-6">${Icons.calendar()} ${g.fecha ? new Date(g.fecha).toLocaleDateString() : '-'}</div>
                    <div class="text-aaa font-800 text-[0.62rem] uppercase mt-2 tracking-wide">${g.categoria || 'Otros'}${g.descripcion ? ' · '+g.descripcion : ''}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-red font-950 text-md">${(g.monto || 0).toLocaleString()} €</div>
                    ${g.iva ? `<div class="text-gray-600 uppercase font-900 text-[0.55rem] tracking-widest mt-2">IVA: ${g.iva}%</div>` : ''}
                  </div>
                </div>
              `).join('')}
            ${gastos.length > 30 ? `<div class="text-center text-gray-700 font-900 text-[0.55rem] uppercase tracking-widest mt-15">Mostrando 30 de ${gastos.length} registros</div>` : ''}
          </div>

          ${proveedor.notas ? `
          <div class="card card-accent card-accent-gold p-16 mb-40">
            <div class="text-gold font-950 text-[0.65rem] uppercase tracking-widest mb-10">${Icons.documento()} OBSERVACIONES</div>
            <p class="text-aaa text-xs uppercase font-700 leading-relaxed m-0">${proveedor.notas}</p>
          </div>` : '<div class="pb-40"></div>'}
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
          <div class="mb-14">
            <button onclick="location.hash='${esEdicion ? '#/proveedor?id='+id : '#/proveedores'}'" class="widget-link-btn widget-link-btn--neon neon-danger px-16 py-8 min-h-0 h-auto">
              <span class="text-[0.7rem] font-950 uppercase tracking-widest">${Icons.atras()} Cancelar</span>
            </button>
          </div>
          <div class="card card-accent card-accent-green p-20 bg-black">
            <div class="section-header-theme mb-20" style="--theme-color: #10b981">${esEdicion ? Icons.editar() : Icons.agregar()} ${esEdicion ? 'EDITAR PROVEEDOR' : 'NUEVO PROVEEDOR'}</div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label">NOMBRE / RAZÓN SOCIAL *</label>
                <input type="text" id="p-nombre" value="${p.nombre}" class="wizard-input uppercase font-900" placeholder="EJ: SUMINISTROS AGRÍCOLAS S.L.">
            </div>

            <div class="grid grid-cols-2 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label">NIF / CIF</label>
                <input type="text" id="p-nif" value="${p.nif_cif}" class="wizard-input uppercase font-800" placeholder="B12345678">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">TELÉFONO</label>
                <input type="tel" id="p-tel" value="${p.telefono}" class="wizard-input font-800" placeholder="600000000">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label">TIPO OPERADOR SIGGAN</label>
                <select id="p-tipo-operador" class="wizard-input wizard-select font-800">
                  <option value="proveedor_servicios" ${!p.tipo_operador || p.tipo_operador === 'proveedor_servicios' ? 'selected' : ''}>PROVEEDOR SERVICIOS</option>
                  <option value="piensos" ${p.tipo_operador === 'piensos' ? 'selected' : ''}>PIENSOS</option>
                  <option value="sanitario" ${p.tipo_operador === 'sanitario' ? 'selected' : ''}>SANITARIO</option>
                  <option value="maquinaria" ${p.tipo_operador === 'maquinaria' ? 'selected' : ''}>MAQUINARIA</option>
                </select>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">REGA</label>
                <input type="text" id="p-rega" value="${p.rega || ''}" class="wizard-input uppercase font-800 input-rega-std" placeholder="ES041230000123" maxlength="14">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CCAA</label>
                <select id="p-ccaa" class="wizard-input wizard-select font-800">
                  <option value="">— SIN DEFINIR —</option>
                  <option value="andalucia" ${p.comunidad_autonoma === 'andalucia' ? 'selected' : ''}>ANDALUCÍA</option>
                  <option value="extremadura" ${p.comunidad_autonoma === 'extremadura' ? 'selected' : ''}>EXTREMADURA</option>
                </select>
              </div>
            </div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label">DIRECCIÓN POSTAL</label>
                <input type="text" id="p-dir" value="${p.direccion}" class="wizard-input uppercase font-800">
            </div>

            <div class="grid grid-cols-3 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label">C.P.</label>
                <input type="text" id="p-cp" value="${p.codigo_postal}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CIUDAD</label>
                <input type="text" id="p-ciudad" value="${p.ciudad}" class="wizard-input uppercase font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">PROVINCIA</label>
                <input type="text" id="p-prov" value="${p.provincia}" class="wizard-input uppercase font-800">
              </div>
            </div>

            <div class="mb-20 bg-dark p-14 rounded-sm border border-222">
              <label class="wizard-label text-gold font-950 uppercase tracking-widest mb-10 d-block">${Icons.paquete()} CATEGORÍAS DE SUMINISTRO</label>
              <div class="flex flex-wrap gap-8">
                ${CATEGORIAS_DISPONIBLES.map(cat => {
                   const isChecked = Array.isArray(p.categorias) && p.categorias.includes(cat);
                   return `
                  <label class="category-chip ${isChecked ? 'active' : ''}" style="display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:30px;
                    background:${isChecked ? 'rgba(16,185,129,0.15)' : '#111'};
                    border:1px solid ${isChecked ? '#10b981' : '#333'};
                    cursor:pointer; font-size:0.65rem; font-weight:900; color:${isChecked ? '#10b981' : '#aaa'}; text-transform:uppercase; letter-spacing:0.5px;">
                    <input type="checkbox" value="${cat}" ${isChecked ? 'checked' : ''} class="d-none"
                      onchange="this.parentElement.style.background=this.checked ? 'rgba(16,185,129,0.15)' : '#111';
                               this.parentElement.style.borderColor=this.checked ? '#10b981' : '#333';
                               this.parentElement.style.color=this.checked ? '#10b981' : '#aaa';">
                    ${cat}
                  </label>`;
                }).join('')}
              </div>
            </div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label">EMAIL CONTACTO</label>
                <input type="email" id="p-email" value="${p.email}" class="wizard-input font-800 lowercase">
            </div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label">CONDICIONES DE PAGO</label>
                <input type="text" id="p-pago" value="${p.condiciones_pago}" class="wizard-input uppercase font-800" placeholder="EJ: TRANSFERENCIA 30 DÍAS">
            </div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label">NOTAS / OBSERVACIONES</label>
                <textarea id="p-notas" class="wizard-input uppercase font-700" style="min-height:80px; resize:none;">${p.notas}</textarea>
            </div>

            <label class="flex items-center gap-10 text-xs text-white cursor-pointer bg-black border border-222 p-12 rounded-sm mb-25">
              <input type="checkbox" id="p-activo" ${p.activo !== false ? 'checked' : ''} style="accent-color:#10b981;">
              <span class="uppercase font-950 tracking-widest text-[0.65rem]">Proveedor activo en el sistema</span>
            </label>

            <div class="grid grid-cols-2 gap-10 mt-20">
                <button onclick="ProveedoresView._guardar(${id || ''})" class="widget-link-btn widget-link-btn--neon neon-success">
                  ${Icons.guardar()} <span class="widget-link-label">GUARDAR</span>
                </button>
                <button onclick="location.hash='${esEdicion ? '#/proveedor?id='+id : '#/proveedores'}'" class="widget-link-btn widget-link-btn--neon neon-danger">
                  ${Icons.cerrar()} <span class="widget-link-label">CANCELAR</span>
                </button>
            </div>
            ${esEdicion ? `<div class="mt-15 text-center"><button onclick="ProveedoresView._eliminar(${id})" class="text-red font-900 text-[0.6rem] uppercase tracking-widest p-10 opacity-60 hover:opacity-100 transition-all">${Icons.eliminar()} Eliminar definitivamente</button></div>` : ''}
          </div>
          <div class="pb-40"></div>
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


