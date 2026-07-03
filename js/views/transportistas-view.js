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
        main.innerHTML = `
            <div class="mb-14">
              <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
                <span style="color: var(--c-info); font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> LOGÍSTICA / TRANSPORTE
              </div>
              <div class="comer-mode-switch">
                 <button class="comer-mode-btn ${this._currentFilter === 'todos' ? 'active' : ''}" style="--mode-color:#aaa; color: var(--mode-color);" data-tab="todos" onclick="TransportistasView._setFilter('todos')">Todos</button>
                 <button class="comer-mode-btn ${this._currentFilter === 'activos' ? 'active' : ''}" style="--mode-color:var(--c-success); color: var(--mode-color);" data-tab="activos" onclick="TransportistasView._setFilter('activos')">Activos</button>
                 <button class="comer-mode-btn ${this._currentFilter === 'inactivos' ? 'active' : ''}" style="--mode-color:var(--c-danger); color: var(--mode-color);" data-tab="inactivos" onclick="TransportistasView._setFilter('inactivos')">Inactivos</button>
              </div>
            </div>

            <div class="max-w-600 mx-auto">
                <div class="card p-12 mb-16 border-222 card-dark-gradient border-top-theme pb-24" style="--theme-color: var(--p-gold);">
                  <div class="section-header-theme">ACCIONES</div>
                  <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto">
                    <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="TransportistasView._abrirFormulario()">
                      ${Icons.agregar()}
                      <span class="widget-link-label">Nuevo Transportista</span>
                    </button>
                  </div>
                  <div class="mt-4"><span class="text-xs text-aaa leading-relaxed">${Icons.transportistas()} Registro y gestión de transportistas, vehículos y flota de transporte</span></div>
                </div>
                <div class="grid grid-cols-3 gap-6 mb-14">
                    <div class="info-box-center border-left-blue"><small class="s-lbl">TOTAL</small><div class="inf-val-lg text-blue">${todos.length}</div></div>
                    <div class="info-box-center border-left-green"><small class="s-lbl">ACTIVOS</small><div class="inf-val-lg text-green">${activos.length}</div></div>
                    <div class="info-box-center border-left-amber"><small class="s-lbl">INACTIVOS</small><div class="inf-val-lg text-amber">${todos.length - activos.length}</div></div>
                </div>
                <div id="trans-list"></div>
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

        container.innerHTML = transportistas.map(t => `
            <div class="card card-animal no-underline mb-8" onclick="TransportistasView._verDetalle(${t.id})"
                 style="border-left:4px solid ${t.activo ? 'var(--c-success)' : '#6b7280'}; padding:14px; margin:0; margin-bottom:10px;">
                <div class="flex flex-col gap-10">
                    <div class="flex justify-between items-center w-full">
                        <div class="flex items-center gap-10 min-w-0">
                            <div class="text-xl" style="color:${t.activo ? 'var(--c-success)' : '#6b7280'}">${Icons.transportistas()}</div>
                            <div class="text-xs">
                                <div class="font-bold text-white uppercase text-base tracking-tight">${t.nombre}</div>
                                <div class="text-gray mt-2 font-700 uppercase">
                                    ${[t.nif_cif ? Icons.documento() + ' ' + t.nif_cif : '', t.matricula ? Icons.transportistas() + ' ' + t.matricula : ''].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="badge badge-sm uppercase" style="background:${t.activo ? 'var(--c-success)15' : '#6b728015'}; color:${t.activo ? 'var(--c-success)' : '#9ca3af'}; border:1px solid ${t.activo ? 'var(--c-success)35' : '#6b728035'};">
                                ${t.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>

                    <div class="flex justify-between items-end w-full">
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-wrap gap-x-12 gap-y-3 text-[0.62rem] text-aaa font-800 uppercase">
                                <div class="flex items-center gap-4">${t.certificado_bienestar ? Icons.check() + ' Bienestar OK' : Icons.alerta() + ' Sin Certificado'}</div>
                                ${t.condiciones_termoneutrales ? `<div class="flex items-center gap-4">${Icons.info()} Termoneutral</div>` : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[0.45rem] text-gray-700 font-900 uppercase tracking-widest">VER FICHA ➔</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
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
                    <h2 class="m-0 font-900 text-sm text-blue-400">${Icons.transportistas()} ${t.nombre}</h2>
                </div>

                <div class="card p-16 mb-14">
                    <div class="flex justify-between items-start mb-16">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-8 mb-4">
                            <span style="width:4px; height:20px; border-radius:2px; background:linear-gradient(135deg,var(--c-info),var(--c-info));"></span>
                            <h2 class="m-0 font-900 text-white uppercase text-xl">${t.nombre}</h2>
                        </div>
                        <div class="flex gap-8 flex-wrap">
                          <span class="badge badge-sm uppercase" style="background:${t.activo ? 'var(--c-success)15' : 'var(--c-danger)15'}; color:${t.activo ? 'var(--c-success)' : 'var(--c-danger)'}; border:1px solid ${t.activo ? 'var(--c-success)35' : 'var(--c-danger)35'};">
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
                        <div><small class="text-gray uppercase font-800 text-[0.65rem]">${Icons.animales()} Capacidad</small><div class="text-white mt-2">${t.capacidad_animales || '0'} animales</div></div>
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
            <div class="card" style="width:100%; max-width:500px; max-height:90vh; overflow-y:auto; padding:20px;  margin:16px;">
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
                </div>
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
                    <div class="wizard-input-group">
                        <label class="wizard-label">TELÉFONO</label>
                        <input type="tel" id="tf-telefono" value="${t?.telefono || ''}" class="wizard-input" placeholder="Teléfono...">
                    </div>
                    <div class="wizard-input-group">
                        <label class="wizard-label">EMAIL</label>
                        <input type="email" id="tf-email" value="${t?.email || ''}" class="wizard-input" placeholder="Email...">
                    </div>
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">DIRECCIÓN</label>
                    <input type="text" id="tf-direccion" value="${t?.direccion || ''}" class="wizard-input" placeholder="Dirección...">
                </div>
                <div class="grid" style="grid-template-columns:2fr 1fr 1fr; gap:12px;">
                    <div class="wizard-input-group">
                        <label class="wizard-label">CIUDAD</label>
                        <input type="text" id="tf-ciudad" value="${t?.ciudad || ''}" class="wizard-input" placeholder="Ciudad...">
                    </div>
                    <div class="wizard-input-group">
                        <label class="wizard-label">C.POSTAL</label>
                        <input type="text" id="tf-cp" value="${t?.codigo_postal || ''}" class="wizard-input" placeholder="CP...">
                    </div>
                    <div class="wizard-input-group">
                        <label class="wizard-label">PROVINCIA</label>
                        <input type="text" id="tf-provincia" value="${t?.provincia || ''}" class="wizard-input" placeholder="Prov...">
                    </div>
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">TIPO VEHÍCULO</label>
                    <select id="tf-tipo-vehiculo" class="wizard-input">
                        <option value="">Seleccionar...</option>
                        <option value="camion" ${t?.tipo_vehiculo === 'camion' ? 'selected' : ''}>Camión</option>
                        <option value="furgoneta" ${t?.tipo_vehiculo === 'furgoneta' ? 'selected' : ''}>Furgoneta</option>
                        <option value="remolque" ${t?.tipo_vehiculo === 'remolque' ? 'selected' : ''}>Remolque</option>
                        <option value="cisterna" ${t?.tipo_vehiculo === 'cisterna' ? 'selected' : ''}>Cisterna</option>
                    </select>
                </div>
                <div class="wizard-input-group">
                    <label class="wizard-label">CAPACIDAD (animales)</label>
                    <input type="number" id="tf-capacidad" value="${t?.capacidad_animales || 0}" class="wizard-input" min="0">
                </div>
                <label class="wizard-checkbox-container mb-6">
                    <input type="checkbox" id="tf-bienestar" ${t?.certificado_bienestar ? 'checked' : ''}>
                    <span>Certificado de bienestar animal en transporte</span>
                </label>
                <label class="wizard-checkbox-container mb-6">
                    <input type="checkbox" id="tf-termoneutral" ${t?.condiciones_termoneutrales ? 'checked' : ''}>
                    <span>Vehículo con condiciones termoneutrales</span>
                </label>
                <label class="wizard-checkbox-container mb-12">
                    <input type="checkbox" id="tf-activo" ${t?.activo !== false ? 'checked' : ''}>
                    <span>Activo</span>
                </label>
                <div class="wizard-input-group">
                    <label class="wizard-label">NOTAS</label>
                    <textarea id="tf-notas" class="wizard-input" style="min-height:50px; resize:none;" placeholder="Observaciones...">${t?.notas || ''}</textarea>
                </div>

                <div class="flex justify-between items-center mt-20">
                    ${isEdit ? `<button onclick="TransportistasView._eliminar(${t.id}); this.closest('.wizard-full-screen').remove();" class="btn btn-danger">${Icons.eliminar()} Eliminar</button>` : '<div></div>'}
                    <div class="flex gap-10">
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




