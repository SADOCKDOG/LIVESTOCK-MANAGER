/**
 * TransportistasView - Livestock Manager Premium v4.0
 * Vista de gestión de transportistas con listado, detalle y formulario.
 */

const TransportistasView = {
    _currentFilter: 'todos',

    _TIPO_VEHICULO_LABELS: {
        camion: 'Camión ganadero',
        furgoneta: 'Furgoneta',
        remolque: 'Remolque/Bañera',
        cisterna: 'Cisterna lechera'
    },

    _labelTipoVehiculo(valor) {
        return this._TIPO_VEHICULO_LABELS[valor] || valor || '-';
    },

    async render(params) {
        const main = document.getElementById("app-content");
        const todos = await Transportistas.list().catch(() => []);
        const activos = todos.filter(t => t.activo !== false);
        const themeColor = 'var(--c-pink)';
        const capacidadTotal = todos.reduce((acc, t) => acc + (parseInt(t.capacidad_animales) || 0), 0);

        main.innerHTML = `
            <div class="card-registro" style="--registro-color: ${themeColor}; padding: 15px;">
              <div class="flex justify-between items-start mb-10">
                <div>
                    <h3 class="flex items-center gap-8 uppercase font-900 tracking-wide text-white m-0">
                      <span class="${App._getColorClass(themeColor)}">|</span> ${Icons.transportistas()} TRANSPORTISTAS
                    </h3>
                  <div class="text-gray text-[0.65rem] font-800 uppercase mt-2">
                    ${todos.length} REGISTROS · RESUMEN DE FLOTA
                  </div>
                </div>
                <button class="resumen-toggle" onclick="App.toggleResumen(this)">
                  ${Icons.chevronAbajo()}
                </button>
              </div>

              <!-- Card de RESUMEN -->
              <div class="card card-total-3d card-resumen mb-20">
                <div class="resumen-body flex flex-col gap-6">
                  <div class="flex justify-between items-center px-4 py-8 border-bottom-222">
                     <span class="text-gray text-[0.7rem] font-800 uppercase">${Icons.transportistas()} TOTAL</span>
                     <strong class="text-xl font-950" style="color: var(--c-info)">${todos.length}</strong>
                  </div>
                  <div class="flex justify-between items-center px-4 py-8 border-bottom-222">
                     <span class="text-gray text-[0.7rem] font-800 uppercase">${Icons.check()} ACTIVOS</span>
                     <strong class="text-xl font-950" style="color: var(--c-success)">${activos.length}</strong>
                  </div>
                  <div class="flex justify-between items-center px-4 py-8">
                     <span class="text-gray text-[0.7rem] font-800 uppercase">${Icons.animales()} CAPACIDAD FLOTA</span>
                     <strong class="text-xl font-950" style="color: var(--c-warning)">${capacidadTotal} CAB.</strong>
                  </div>
                </div>
              </div>

              <!-- Filtros / Tabs -->
              <div class="flex gap-8 mb-20 overflow-x-auto pb-4 no-scrollbar">
                 <button class="badge badge-sm uppercase font-900 ${this._currentFilter === 'todos' ? 'active' : ''}" onclick="TransportistasView._setFilter('todos')">TODOS</button>
                 <button class="badge badge-sm uppercase font-900 ${this._currentFilter === 'activos' ? 'active' : ''}" onclick="TransportistasView._setFilter('activos')">ACTIVOS</button>
                 <button class="badge badge-sm uppercase font-900 ${this._currentFilter === 'inactivos' ? 'active' : ''}" onclick="TransportistasView._setFilter('inactivos')">INACTIVOS</button>
              </div>

              <div class="inf-section-title mb-12 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.75rem]">
                ${Icons.documento()} LISTADO DE TRANSPORTISTAS
              </div>
              <div id="trans-list"></div>
            </div>

            <!-- Botón Flotante de Acción -->
            <div class="fab-container" onclick="TransportistasView._abrirFormulario()">
                <span class="fab-label">Nuevo Transportista</span>
                <button class="fab-btn" style="--neon: ${themeColor}">${Icons.fabPlus()}</button>
            </div>
        `;
        await this._renderLista();
    },

    _setFilter(filter) {
        this._currentFilter = filter;
        this.render();
    },

    async _renderLista() {
        const container = document.getElementById('trans-list');
        if (!container) return;

        let filtros = {};
        if (this._currentFilter === 'activos') filtros.activo = true;
        else if (this._currentFilter === 'inactivos') filtros.activo = false;

        const transportistas = await Transportistas.list(filtros);

        if (transportistas.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${Icons.transportistas()}</div><p class="empty-state-text">No hay transportistas registrados</p></div>`;
            return;
        }

        container.innerHTML = transportistas.map(t => {
            const color = t.activo ? 'var(--c-success)' : '#6b7280';
            return `
            <div class="card-registro" onclick="TransportistasView._verDetalle(${t.id})"
                 style="display:flex; gap:10px; align-items:stretch; --registro-color: ${color}; cursor:pointer;">
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <div class="flex items-center gap-10 min-w-0">
                        <span class="text-xl" style="color:${color}">${Icons.transportistas()}</span>
                        <div class="font-950 text-gold uppercase text-base tracking-tight">${t.nombre}</div>
                    </div>
                    <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">
                        ${t.nif_cif ? `<span class="flex items-center gap-4">${Icons.documento()} ${t.nif_cif}</span>` : ''}
                        ${t.matricula ? `<span class="flex items-center gap-4">${Icons.transportistas()} ${t.matricula}</span>` : ''}
                    </div>
                </div>
                <div class="flex flex-col items-end justify-between flex-shrink-0">
                    <div style="background:${color}15; color:${color}; border:1px solid ${color}40; filter: drop-shadow(0 0 4px ${color}); padding:2px 8px; border-radius:6px; font-size:0.6rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">
                        ${t.activo ? 'Activo' : 'Inactivo'}
                    </div>
                    <span style="color:var(--c-warning); font-weight:800; font-size:0.7rem; text-transform:uppercase;">Ficha ${Icons.flechaDerecha()}</span>
                </div>
            </div>
        `;}).join('');

        // Render recent transportistas
        this._renderRecientesTransportistas();
    },

    _renderRecientesTransportistas() {
        const container = document.getElementById('trans-recientes');
        if (!container) return;
        // Fetch all transportistas to get recent ones (could be optimized)
        Transportistas.list().then(all => {
            const recientes = all
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .slice(0, 5);
            if (recientes.length === 0) {
                container.innerHTML = `<div class="p-14 text-center bg-darker rounded border border-222"><span class="text-555 text-xs uppercase font-800 tracking-wider">Sin transportistas recientes</span></div>`;
                return;
            }
            container.innerHTML = `<div class="grid gap-6">${recientes.map(t => {
                const color = t.activo ? 'var(--c-success)' : '#6b7280';
                return `
                <div class="card-registro" onclick="TransportistasView._verDetalle(${t.id})"
                     style="display:flex; gap:10px; align-items:stretch; --registro-color: ${color}; cursor:pointer;">
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <div class="flex items-center gap-10 min-w-0">
                            <span class="text-xl" style="color:${color}">${Icons.transportistas()}</span>
                            <div class="font-950 text-gold uppercase text-base tracking-tight">${t.nombre}</div>
                        </div>
                        <div class="flex flex-wrap gap-x-12 gap-y-2 text-[0.62rem] text-gray font-800 uppercase mt-4">
                            ${t.nif_cif ? `<span class="flex items-center gap-4">${Icons.documento()} ${t.nif_cif}</span>` : ''}
                            ${t.matricula ? `<span class="flex items-center gap-4">${Icons.transportistas()} ${t.matricula}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col items-end justify-between flex-shrink-0">
                        <div style="background:${color}15; color:${color}; border:1px solid ${color}40; filter: drop-shadow(0 0 4px ${color}); padding:2px 8px; border-radius:6px; font-size:0.6rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">
                            ${t.activo ? 'Activo' : 'Inactivo'}
                        </div>
                        <span style="color:var(--c-warning); font-weight:800; font-size:0.7rem; text-transform:uppercase;">Ficha ${Icons.flechaDerecha()}</span>
                    </div>
                </div>
                `;
            }).join('')}</div>`;
        }).catch(err => {
            console.error('Error loading recent transportistas:', err);
            container.innerHTML = `<div class="p-14 text-center text-red">Error cargando recientes</div>`;
        });
    },

    async _verDetalle(id) {
        const t = await Transportistas.get(id);
        if (!t) return;

        const resumen = await Transportistas.getResumen(id);
        const main = document.getElementById("app-content");

        main.innerHTML = `
            <div class="p-16 max-w-800 mx-auto">
                <div class="flex items-center gap-8 mb-14">
                    <button onclick="TransportistasView.render()" class="link-back" style="background:none; border:none; cursor:pointer; padding:4px 8px;">← Volver</button>
                    <span style="width:4px; height:20px; border-radius:2px; background:linear-gradient(135deg,var(--c-info),var(--c-info));"></span>
                    <h3 class="flex items-center gap-8 uppercase font-900 tracking-wide text-white m-0 text-sm">
                        <span class="text-blue-400">|</span> ${Icons.transportistas()} ${t.nombre}
                    </h3>
                </div>

                <div class="card p-16 mb-14">
                    <div class="flex justify-between items-start mb-16">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-8 mb-4">
                            <span style="width:4px; height:20px; border-radius:2px; background:linear-gradient(135deg,var(--c-info),var(--c-info));"></span>
                            <h3 class="flex items-center gap-8 uppercase font-900 tracking-wide text-white m-0 text-xl">
                                <span class="text-gold">|</span> ${t.nombre}
                            </h3>
                        </div>
                        <div class="flex gap-8 flex-wrap">
                          <span class="badge badge-sm uppercase" style="background:${t.activo ? 'color-mix(in srgb, var(--c-success) 8%, transparent)' : 'color-mix(in srgb, var(--c-danger) 8%, transparent)'}; color:${t.activo ? 'var(--c-success)' : 'var(--c-danger)'}; border:1px solid ${t.activo ? 'color-mix(in srgb, var(--c-success) 21%, transparent)' : 'color-mix(in srgb, var(--c-danger) 21%, transparent)'};">
                            ${t.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                      <div class="flex gap-10">
                        <button class="widget-link-btn widget-link-btn--neon neon-danger" onclick="TransportistasView._eliminar(${t.id})">
                          ${Icons.eliminar()}
                          <span class="widget-link-label">Eliminar</span>
                        </button>
                        <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="TransportistasView._abrirFormulario(${t.id})">
                          ${Icons.editar()}
                          <span class="widget-link-label">Editar</span>
                        </button>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-12 text-sm text-aaa">
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.documento()} NIF/CIF</small><div class="text-white font-800 mt-2">${t.nif_cif || '-'}</div></div>
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.transportistas()} Matrícula</small><div class="text-white font-800 mt-2">${t.matricula || '-'}</div></div>
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.info()} Teléfono</small><div class="text-white mt-2">${t.telefono || '-'}</div></div>
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.enlace()} Email</small><div class="text-white mt-2">${t.email || '-'}</div></div>
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.documento()} Registro Transporte</small><div class="text-white mt-2">${t.registro_transporte || '-'}</div></div>
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.transportistas()} Tipo Vehículo</small><div class="text-white mt-2">${this._labelTipoVehiculo(t.tipo_vehiculo)}</div></div>
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.animales()} Capacidad</small><div class="text-white mt-2">${t.capacidad_animales || 0} ${Number(t.capacidad_animales) === 1 ? 'animal' : 'animales'}</div></div>
                    </div>
                    <div class="mt-12 flex gap-8 flex-wrap">
                        <span class="badge" style="padding:4px 10px; font-size:0.7rem; background:${t.certificado_bienestar ? 'rgba(204,255,0,0.15)' : 'rgba(255,68,68,0.15)'}; color:${t.certificado_bienestar ? 'var(--c-success)' : 'var(--c-danger)'};">
                            ${t.certificado_bienestar ? 'Cert. Bienestar' : 'Sin Cert. Bienestar'}
                        </span>
                        <span class="badge" style="padding:4px 10px; font-size:0.7rem; background:${t.condiciones_termoneutrales ? 'rgba(204,255,0,0.15)' : 'rgba(107,114,128,0.15)'}; color:${t.condiciones_termoneutrales ? 'var(--c-success)' : '#9ca3af'};">
                            ${t.condiciones_termoneutrales ? 'Termoneutral' : 'Sin control térmico'}
                        </span>
                    </div>
                    ${t.notas ? `<div class="mt-10 p-10 text-gray text-sm rounded-sm bg-card">${t.notas}</div>` : ''}
                    <div class="mt-10 p-10 rounded-sm bg-card">
                        <div class="grid grid-cols-2 gap-8 text-sm">
                            <div><span class="text-gray">Expediciones:</span> <span class="text-white font-bold">${resumen.total_expediciones}</span></div>
                            <div><span class="text-gray">Peso vivo total:</span> <span class="text-white font-bold">${resumen.peso_vivo_total.toLocaleString()} kg</span></div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center mt-20">
                    <button onclick="TransportistasView._eliminar(${t.id})" class="btn btn-danger">${Icons.eliminar()} Eliminar</button>
                    <button onclick="TransportistasView._abrirFormulario(${t.id})" class="btn btn-edit">${Icons.editar()} Editar</button>
                </div>
            </div>
        `;
    },

    async _abrirFormulario(id) {
        const t = id ? await Transportistas.get(id) : null;
        const isEdit = !!t;

        const overlay = document.createElement("div");
        overlay.className = "wizard-full-screen";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.backgroundColor = "rgba(0,0,0,0.85)";
        overlay.style.zIndex = "6000";

        overlay.innerHTML = `
            <div class="card-registro" style="width:100%; max-width:500px; max-height:90vh; overflow-y:auto; padding:20px; margin:16px; --registro-color: var(--c-pink);">
                <h3 class="mt-0 text-sm text-blue-400">${isEdit ? `${Icons.editar()} EDITAR TRANSPORTISTA` : `${Icons.agregar()} NUEVO TRANSPORTISTA`}</h3>

                <div class="wizard-input-group">
                    <label class="wizard-label">NOMBRE / RAZÓN SOCIAL <span class="text-red">*</span></label>
                    <input type="text" id="tf-nombre" value="${t?.nombre || ''}" class="wizard-input" placeholder="Ej: Transportes García S.L.">
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">NIF / CIF <span class="text-red">*</span></label>
                    <input type="text" id="tf-nif" value="${t?.nif_cif || ''}" class="wizard-input" placeholder="Ej: B12345678">
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">MATRÍCULA VEHÍCULO</label>
                    <input type="text" id="tf-matricula" value="${t?.matricula || ''}" class="wizard-input" placeholder="Ej: 1234ABC">
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">REGISTRO DE TRANSPORTE</label>
                    <input type="text" id="tf-registro" value="${t?.registro_transporte || ''}" class="wizard-input" placeholder="Nº registro oficial...">
                </div
                <div class="wizard-input-group">
                    <label class="wizard-label">AUTORIZACIÓN TRANSPORTE GANADO (ATG) <span class="text-red">*</span></label>
                    <input type="text" id="tf-atg" value="${t?.autorizacion_transporte_ganado || ''}" class="wizard-input" placeholder="ATG-...">
                </div>
                <div class="grid grid-cols-2 gap-12">
                    <div class="wizard-input-group">
                        <label class="wizard-label">ÚLTIMA DESINSECTACIÓN</label>
                        <input type="date" id="tf-desinsectacion" value="${t?.desinsectacion_ultima_fecha || ''}" class="wizard-input">
                    </div>
                    <div class="wizard-input-group">
                        <label class="wizard-label">VENCIMIENTO DESINSECTACIÓN</label>
                        <input type="date" id="tf-desinsectacion-venc" value="${t?.desinsectacion_vencimiento || ''}" class="wizard-input">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-12">
                    <div class="wizard-input-group>
                        <label class="wizard-label">TELÉFONO</label>
                        <input type="tel" id="tf-telefono" value="${t?.telefono || ''}" class="wizard-input" placeholder="Teléfono...">
                    </div>
                    <div class="wizard-input-group>
                        <label class="wizard-label">EMAIL</label>
                        <input type="email" id="tf-email" value="${t?.email || ''}" class="wizard-input" placeholder="Email...">
                    </div>
                </div>
                <div class="wizard-input-group>
                    <label class="wizard-label">DIRECCIÓN</label>
                    <input type="text" id="tf-direccion" value="${t?.direccion || ''}" class="wizard-input" placeholder="Dirección...">
                </div>
                <div class="grid" style="grid-template-columns:2fr 1fr 1fr; gap:12px;">
                    <div class="wizard-input-group>
                        <label class="wizard-label">CIUDAD</label>
                        <input type="text" id="tf-ciudad" value="${t?.ciudad || ''}" class="wizard-input" placeholder="Ciudad...">
                    </div>
                    <div class="wizard-input-group>
                        <label class="wizard-label">C.POSTAL</label>
                        <input type="text" id="tf-cp" value="${t?.codigo_postal || ''}" class="wizard-input" placeholder="CP...">
                    </div>
                    <div class="wizard-input-group>
                        <label class="wizard-label">PROVINCIA</label>
                        <input type="text" id="tf-provincia" value="${t?.provincia || ''}" class="wizard-input" placeholder="Prov...">
                    </div>
                </div>
                <div class="wizard-input-group>
                    <label class="wizard-label">TIPO VEHÍCULO</label>
                    <select id="tf-tipo-vehiculo" class="wizard-input">
                        <option value="">Seleccionar...</option>
                        <option value="camion" ${t?.tipo_vehiculo === 'camion' ? 'selected' : ''}>Camión</option>
                        <option value="furgoneta" ${t?.tipo_vehiculo === 'furgoneta' ? 'selected' : ''}>Furgoneta</option>
                        <option value="remolque" ${t?.tipo_vehiculo === 'remolque' ? 'selected' : ''}>Remolque</option>
                        <option value="cisterna" ${t?.tipo_vehiculo === 'cisterna' ? 'selected' : ''}>Cisterna</option>
                    </select>
                </div>
                <div class="wizard-input-group>
                    <label class="wizard-label">CAPACIDAD (animales)</label>
                    <input type="number" id="tf-capacidad" value="${t?.capacidad_animales || 0}" class="wizard-input" min="0">
                </div>
                <label class="wizard-checkbox-container mb-6>
                    <input type="checkbox" id="tf-bienestar" ${t?.certificado_bienestar ? 'checked' : ''}>
                    <span>Certificado de bienestar animal en transporte</span>
                </label>
                <label class="wizard-checkbox-container mb-6>
                    <input type="checkbox" id="tf-termoneutral" ${t?.condiciones_termoneutrales ? 'checked' : ''}>
                    <span>Vehículo con condiciones termoneutrales</span>
                </label>
                <label class="wizard-checkbox-container mb-12>
                    <input type="checkbox" id="tf-activo" ${t?.activo !== false ? 'checked' : ''}>
                    <span>Activo</span>
                </label>
                <div class="wizard-input-group>
                    <label class="wizard-label">NOTAS</label>
                    <textarea id="tf-notas" class="wizard-input" style="min-height:50px; resize:none;" placeholder="Observaciones...">${t?.notas || ''}</textarea>
                </div>

                <div class="flex justify-between items-center mt-20>
                    ${isEdit ? `<button onclick="TransportistasView._eliminar(${t.id}); this.closest('.wizard-full-screen').remove();" class="btn btn-danger">${Icons.eliminar()} Eliminar</button>` : '<div></div>'}
                    <div class="flex gap-10>
                        <button class="btn btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">${Icons.cerrar()} Cancelar</button>
                        <button class="btn btn-success" id="btn-save-trans">${Icons.guardar()} Guardar</button>
                    </div>
                </div>
                <div id="trans-form-error" class="text-red text-xs mt-8 d-none"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#btn-save-trans').onclick = async () => {
            const errorDiv = overlay.querySelector('#trans-form-error');
            errorDiv.style.display = 'none';

            const data = {
                nombre: overlay.querySelector('#tf-nombre').value.trim(),
                nif_cif: overlay.querySelector('#tf-nif').value.trim(),
                matricula: overlay.querySelector('#tf-matricula').value.trim(),
                registro_transporte: overlay.querySelector('#tf-registro').value.trim(),
                autorizacion_transporte_ganado: overlay.querySelector('#tf-atg').value.trim(),
                desinsectacion_ultima_fecha: overlay.querySelector('#tf-desinsectacion').value,
                desinsectacion_vencimiento: overlay.querySelector('#tf-desinsectacion-venc').value,
                telefono: overlay.querySelector('#tf-telefono').value.trim(),
                email: overlay.querySelector('#tf-email').value.trim(),
                direccion: overlay.querySelector('#tf-direccion').value.trim(),
                ciudad: overlay.querySelector('#tf-ciudad').value.trim(),
                codigo_postal: overlay.querySelector('#tf-cp').value.trim(),
                provincia: overlay.querySelector('#tf-provincia').value.trim(),
                tipo_vehiculo: overlay.querySelector('#tf-tipo-vehiculo').value,
                capacidad_animales: parseInt(overlay.querySelector('#tf-capacidad').value) || 0,
                certificado_bienestar: overlay.querySelector('#tf-bienestar').checked,
                condiciones_termoneutrales: overlay.querySelector('#tf-termoneutral').checked,
                activo: overlay.querySelector('#tf-activo').checked,
                notas: overlay.querySelector('#tf-notas').value.trim(),
            };

            if (t) data.id = t.id;

            try {
                await Transportistas.save(data);
                App.toast(isEdit ? 'Transportista actualizado' : 'Transportista creado', 'success');
                overlay.remove();
                TransportistasView.render();
            } catch (e) {
                errorDiv.textContent = '' + e.message;
                errorDiv.style.display = 'block';
            }
        };
    },

    async _eliminar(id) {
        if (!await Confirm.confirm("Eliminar Transportista", "¿Eliminar este transportista de forma permanente?", true)) return;
        try {
            await Transportistas.delete(id);
            App.toast('Transportista eliminado');
            this.render();
        } catch (e) {
            App.toastError(e.message);
        }
    }
};

window.TransportistasView = TransportistasView;
