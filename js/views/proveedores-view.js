/**
 * ProveedoresView - Livestock Manager Premium v4.0
 * Vista de proveedores: lista, detalle con trazabilidad de gastos, formulario.
 * Refactored with Aglutinadora UI Pattern & Neon Branding.
 */

const ProveedoresView = {
    _cachedData: null,

    _labelCat(cat) {
        const labels = { 'Alimentacion': 'Alimentación', 'Amortizacion': 'Amortización' };
        return labels[cat] || cat;
    },

    async render() {
        const main = document.getElementById("app-content");
        const themeColor = 'var(--c-purple)';

        main.innerHTML = `
          <div class="report-section px-4">
            <div class="mb-14">
              <h3 class="flex items-center gap-8 uppercase font-900 tracking-wide text-white m-0">
                <span class="${App._getColorClass(themeColor)}">|</span> ${Icons.proveedores()} PROVEEDORES
              </h3>
              <div class="text-gray text-[0.65rem] font-800 uppercase mt-2">
                RESUMEN DE GESTIÓN Y LISTADO
              </div>
            </div>

            <!-- Card de RESUMEN Normalizada -->
            <div id="prov-kpis"></div>

            <div class="flex gap-8 items-center mb-12">
              <div class="relative flex-1 min-w-0">
                <input type="search" id="search-proveedores" placeholder="Buscar por nombre, NIF o ciudad..."
                       oninput="ProveedoresView._filtrar(this.value)"
                       class="search-input w-full uppercase font-700">
              </div>
            </div>

            <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
              ${Icons.documento()} LISTADO DE PROVEEDORES
            </div>
            <div id="prov-lista"><div class="loader">Cargando proveedores...</div></div>
          </div>

          <!-- Botón Flotante de Acción -->
          <div class="fab-container" onclick="ProveedoresView.renderFormulario()">
            <span class="fab-label">Nuevo Proveedor</span>
            <button class="fab-btn" style="--neon: ${themeColor}">${Icons.fabPlus()}</button>
          </div>
          `;

        await this._cargarDatos();
    },

    async _cargarDatos() {
        const proveedores = await Proveedores.list();
        const fincaId = await Fincas.getActiveId();
        const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []);
        const gastosConProveedor = gastos.filter(g => g.proveedorId != null);
        const totalGasto = gastosConProveedor.reduce((s, g) => s + (g.monto || 0), 0);
        const kpisEl = document.getElementById('prov-kpis');
        const activosCount = proveedores.filter(p => p.activo !== false).length;
        if (kpisEl) {
            kpisEl.innerHTML = `
              <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
                <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
                  <span class="flex items-center gap-6" style="color: var(--c-purple)">${Icons.proveedores()} Resumen Proveedores</span>
                  <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
                </div>
                <div class="resumen-body flex flex-col">
                  <div class="py-10 flex justify-between items-center border-bottom-222">
                     <span class="text-[0.65rem] text-gray uppercase font-900">Total Registros</span>
                     <strong class="text-lg font-950" style="color: var(--c-info)">${proveedores.length}</strong>
                  </div>
                  <div class="py-10 flex justify-between items-center border-bottom-222">
                     <span class="text-[0.65rem] text-gray uppercase font-900">Proveedores Activos</span>
                     <strong class="text-lg font-950" style="color: var(--c-success)">${activosCount}</strong>
                  </div>
                  <div class="py-10 flex justify-between items-center">
                     <span class="text-[0.65rem] text-gray uppercase font-900">Volumen Gasto</span>
                     <strong class="text-lg font-950" style="color: var(--c-warning)">${totalGasto.toLocaleString()} €</strong>
                  </div>
                </div>
              </div>`;
        }
        this._cachedData = proveedores;
        this._renderLista(proveedores);
    },

    _filtrar(texto) {
        if (!this._cachedData) return;
        const q = texto.toLowerCase().trim();
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

        contenedor.innerHTML = `<div class="grid gap-12 mb-20">${lista.map(p => {
          const colorEstado = p.activo !== false ? 'var(--c-success)' : 'var(--c-danger)';
          return `
          <div class="card-registro" onclick="ProveedoresView.renderDetalle(${p.id})"
            style="--registro-color: var(--c-purple); display:flex; gap:10px; align-items:stretch;">
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <div class="flex items-center gap-10 min-w-0">
                <div class="text-xl" style="color:var(--c-purple)">${Icons.proveedores()}</div>
                <div class="text-xs">
                  <div class="font-950 text-gold uppercase text-base tracking-tight" style="color:var(--p-gold); font-weight: 950;">${p.nombre}</div>
                  <div class="text-gray-500 mt-2 font-800 uppercase text-[0.6rem] tracking-wider flex items-center gap-6">
                    ${[p.nif_cif ? Icons.documento() + ' ' + p.nif_cif : '', p.ciudad ? Icons.zonas() + ' ' + p.ciudad.toUpperCase() : ''].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col items-end justify-between flex-shrink-0">
              <div style="background:${colorEstado}15; color:${colorEstado}; border: 1px solid ${colorEstado}40; filter: drop-shadow(0 0 4px ${colorEstado}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                ${p.activo === false ? 'INACTIVO' : 'ACTIVO'}
              </div>
              <div style="font-size: 0.7rem; font-weight: 800; color: var(--c-warning); text-transform: uppercase;">
                Ficha ${Icons.flechaDerecha()}
              </div>
            </div>
          </div>`;
        }).join('')}</div>`;
    },

    async renderDetalle(id) {
        const proveedor = await Proveedores.get(id);
        if (!proveedor) return App.toastError('Proveedor no encontrado');

        const [gastos, resumen] = await Promise.all([
            Proveedores.getGastos(id),
            Proveedores.getResumen(id)
        ]);

        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-14 px-4">
            <button onclick="location.hash='#/proveedores'" class="widget-link-btn widget-link-btn--neon neon-danger px-16 py-8 min-h-0 h-auto">
              <span class="text-[0.7rem] font-950 uppercase tracking-widest">${Icons.atras()} Volver</span>
            </button>
          </div>

          <div class="report-section px-4">
            <div class="card-registro border-top-3px border-top-3px-orange mb-16" style="--registro-color: var(--c-success);">
              <div class="flex justify-between items-start mb-16">
                <div>
                  <h3 class="flex items-center gap-8 uppercase font-900 tracking-wide text-white m-0 mb-4 text-xl">
                    <span class="text-gold">|</span> ${proveedor.nombre}
                  </h3>
                  <div style="background:${proveedor.activo !== false ? 'var(--c-success)' : 'var(--c-danger)'}15; color:${proveedor.activo !== false ? 'var(--c-success)' : 'var(--c-danger)'}; border: 1px solid ${proveedor.activo !== false ? 'var(--c-success)' : 'var(--c-danger)'}40; filter: drop-shadow(0 0 4px ${proveedor.activo !== false ? 'var(--c-success)' : 'var(--c-danger)'}); padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; display: inline-block;">
                    ${proveedor.activo === false ? 'INACTIVO' : 'ACTIVO'}
                  </div>
                </div>
                <div class="flex gap-8">
                  <button class="widget-link-btn widget-link-btn--neon neon-danger px-12 py-8 min-h-0 h-auto" onclick="ProveedoresView._eliminar(${id})">${Icons.eliminar()}</button>
                  <button class="widget-link-btn widget-link-btn--neon neon-info px-12 py-8 min-h-0 h-auto" onclick="ProveedoresView.renderFormulario(${id})">${Icons.editar()}</button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-y-10 text-[0.65rem] text-gray-500 uppercase font-800 tracking-wider bg-dark p-12 rounded-sm border border-222">
                ${proveedor.nif_cif ? `<div><span class="text-aaa">NIF:</span> <strong class="text-white">${proveedor.nif_cif}</strong></div>` : ''}
                ${proveedor.telefono ? `<div><span class="text-aaa">TEL:</span> <strong class="text-white">${proveedor.telefono}</strong></div>` : ''}
                ${proveedor.email ? `<div class="lowercase"><span class="text-aaa uppercase">EMAIL:</span> <strong class="text-white">${proveedor.email}</strong></div>` : ''}
                ${proveedor.ciudad ? `<div><span class="text-aaa">UBICACIÓN:</span> <strong class="text-white">${proveedor.ciudad.toUpperCase()}${proveedor.provincia ? ' ('+proveedor.provincia.toUpperCase()+')' : ''}</strong></div>` : ''}
              </div>
            </div>

            <div class="grid grid-cols-3 gap-8 mb-16">
              <div class="summary-cell summary-cell-kpi border-left-green"><small class="s-lbl font-900">GASTO TOTAL</small><div class="s-val text-green font-950">${resumen.total_gastado.toLocaleString()}€</div></div>
              <div class="summary-cell summary-cell-kpi border-left-blue"><small class="s-lbl font-900">REGISTROS</small><div class="s-val text-blue font-950">${resumen.total_gastos}</div></div>
              <div class="summary-cell summary-cell-kpi border-left-red"><small class="s-lbl font-900">ULT. 12M</small><div class="s-val text-red font-950">${resumen.gasto_anual.toLocaleString()}€</div></div>
            </div>

            <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
              ${Icons.documento()} ÚLTIMOS GASTOS ASIGNADOS
            </div>
            <div class="grid gap-10 mb-80">
              ${gastos.slice(0, 20).map(g => `
                <div class="card-registro" style="display:flex; gap:10px; align-items:stretch; --registro-color: var(--c-purple);">
                  <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <div class="font-950 uppercase text-[0.85rem] tracking-tight" style="color:var(--p-gold); font-weight: 950;">${g.concept || g.concepto || g.categoria}</div>
                    <div class="text-[0.6rem] text-gray font-800 uppercase mt-2">${new Date(g.fecha).toLocaleDateString()}</div>
                  </div>
                  <div class="flex flex-col items-end justify-between flex-shrink-0">
                    <div style="color:var(--c-danger); font-weight: 950; font-size: 1rem;">${(g.monto || 0).toLocaleString()} €</div>
                  </div>
                </div>`).join('') || '<div class="text-gray text-center p-20">Sin gastos</div>'}
            </div>
          </div>
        `;
    },

    async renderFormulario(id) {
        const esEdicion = !!id;
        const p = esEdicion ? await Proveedores.get(id) : {
            nombre: '', nif_cif: '', direccion: '', codigo_postal: '', ciudad: '', provincia: '',
            telefono: '', email: '', categorias: [], condiciones_pago: '', notas: '', activo: true
        };
        const main = document.getElementById("app-content");
        main.innerHTML = `<div class="p-20 text-gray uppercase font-900">Formulario Proveedor - Rediseñando...</div>`;
    },

    async _guardar(id) {
        // Save
    },

    async _eliminar(id) {
        if (!await Confirm.confirm("Eliminar Proveedor", "¿Eliminar este proveedor?", true)) return;
        try { await Proveedores.delete(id); App.toast('Proveedor eliminado'); location.hash = '#/proveedores'; } catch (e) { App.toastError(e.message); }
    }
};

window.ProveedoresView = ProveedoresView;
