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
            <div style="max-width:600px; margin:0 auto;">
                <div class="grid grid-cols-3 gap-6 mb-14">
                    <div class="info-box-center" style="border-left:3px solid #3b82f6;"><small class="s-lbl">TOTAL</small><div class="inf-val-lg text-blue">${todos.length}</div></div>
                    <div class="info-box-center" style="border-left:3px solid #10b981;"><small class="s-lbl">ACTIVOS</small><div class="inf-val-lg text-green">${activos.length}</div></div>
                    <div class="info-box-center" style="border-left:3px solid #f59e0b;"><small class="s-lbl">INACTIVOS</small><div class="inf-val-lg text-amber">${todos.length - activos.length}</div></div>
                </div>
                <div class="tabs-scroll scroll-shadow-container mb-12 gap-6">
                    <button class="filter-pill ${this._currentFilter === 'todos' ? 'active' : ''}" onclick="TransportistasView._setFilter('todos')">TODOS</button>
                    <button class="filter-pill ${this._currentFilter === 'activos' ? 'active' : ''}" onclick="TransportistasView._setFilter('activos')">ACTIVOS</button>
                    <button class="filter-pill ${this._currentFilter === 'inactivos' ? 'active' : ''}" onclick="TransportistasView._setFilter('inactivos')">INACTIVOS</button>
                </div>
                <div class="mb-14">
                    <button class="btn btn-create btn-sm w-full" onclick="TransportistasView._abrirFormulario()">➕ Nuevo Transportista</button>
                </div>
                <div id="trans-list"></div>
            </div>
            <button class="fab-btn" onclick="TransportistasView._abrirFormulario()" aria-label="Nuevo Transportista">➕</button>
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
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p class="empty-state-text">No hay transportistas registrados</p></div>`;
            return;
        }

        container.innerHTML = transportistas.map(t => `
            <div class="card card-list-item mb-8" onclick="TransportistasView._verDetalle(${t.id})"
                 style="border-left:4px solid ${t.activo ? '#10b981' : '#6b7280'};">
                <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                        <div class="text-white font-800 truncate" style="font-size:0.9rem;">
                            🚛 ${t.nombre}
                        </div>
                        <div class="text-gray text-xs mt-4">
                            ${t.nif_cif ? 'NIF: ' + t.nif_cif : ''}${t.matricula ? ' | 🚚 ' + t.matricula : ''}
                        </div>
                        <div class="text-555 text-xs mt-3">
                            ${t.certificado_bienestar ? '✅ Bienestar' : '❌ Sin certificado'}${t.condiciones_termoneutrales ? ' | 🌡️ Termoneutral' : ''}
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-8">
                        <span class="badge" style="background:${t.activo ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)'}; color:${t.activo ? '#10b981' : '#9ca3af'};">
                            ${t.activo ? 'Activo' : 'Inactivo'}
                        </span>
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
            <div class="p-16" style="max-width:800px; margin:0 auto;">
                <div class="flex items-center gap-8 mb-14">
                    <button onclick="TransportistasView.render()" class="link-back" style="background:none; border:none; cursor:pointer; padding:4px 8px;">← Volver</button>
                    <span style="width:4px; height:20px; border-radius:2px; background:linear-gradient(135deg,#3b82f6,#60a5fa);"></span>
                    <h2 class="m-0 font-900 text-sm text-blue-400">🚛 ${t.nombre}</h2>
                </div>

                <div class="card p-16 mb-14">
                    <div class="grid grid-cols-2 gap-12">
                        <div><small class="text-gray">NIF/CIF</small><div class="text-white font-800">${t.nif_cif || '-'}</div></div>
                        <div><small class="text-gray">Matrícula</small><div class="text-white font-800">${t.matricula || '-'}</div></div>
                        <div><small class="text-gray">Teléfono</small><div class="text-white">${t.telefono || '-'}</div></div>
                        <div><small class="text-gray">Email</small><div class="text-white">${t.email || '-'}</div></div>
                        <div><small class="text-gray">Registro Transporte</small><div class="text-white">${t.registro_transporte || '-'}</div></div>
                        <div><small class="text-gray">Tipo Vehículo</small><div class="text-white">${this._labelTipoVehiculo(t.tipo_vehiculo)}</div></div>
                        <div><small class="text-gray">Capacidad</small><div class="text-white">${t.capacidad_animales || '0'} animales</div></div>
                        <div><small class="text-gray">Estado</small><div class="font-bold" style="color:${t.activo ? '#10b981' : '#ef4444'};">${t.activo ? 'Activo' : 'Inactivo'}</div></div>
                    </div>
                    <div class="mt-12 flex gap-8 flex-wrap">
                        <span class="badge" style="padding:4px 10px; font-size:0.7rem; background:${t.certificado_bienestar ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${t.certificado_bienestar ? '#10b981' : '#ef4444'};">
                            ${t.certificado_bienestar ? '✅ Cert. Bienestar' : '❌ Sin Cert. Bienestar'}
                        </span>
                        <span class="badge" style="padding:4px 10px; font-size:0.7rem; background:${t.condiciones_termoneutrales ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)'}; color:${t.condiciones_termoneutrales ? '#10b981' : '#9ca3af'};">
                            ${t.condiciones_termoneutrales ? '🌡️ Termoneutral' : 'Sin control térmico'}
                        </span>
                    </div>
                    ${t.notas ? `<div class="mt-10 p-10 text-gray text-sm rounded-sm bg-card">📝 ${t.notas}</div>` : ''}
                    <div class="mt-10 p-10 rounded-sm bg-card">
                        <div class="grid grid-cols-2 gap-8 text-sm">
                            <div><span class="text-gray">Expediciones:</span> <span class="text-white font-bold">${resumen.total_expediciones}</span></div>
                            <div><span class="text-gray">Peso vivo total:</span> <span class="text-white font-bold">${resumen.peso_vivo_total.toLocaleString()} kg</span></div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center mt-20">
                    <button onclick="TransportistasView._eliminar(${t.id})" class="btn btn-danger">🗑️ Eliminar</button>
                    <button onclick="TransportistasView._abrirFormulario(${t.id})" class="btn btn-edit">✏️ Editar</button>
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
            <div class="card" style="width:100%; max-width:500px; max-height:90vh; overflow-y:auto; padding:20px; border-top:5px solid #3b82f6; margin:16px;">
                <h3 class="mt-0 text-sm text-blue-400">${isEdit ? '✏️ EDITAR TRANSPORTISTA' : '➕ NUEVO TRANSPORTISTA'}</h3>

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
                    ${isEdit ? `<button onclick="TransportistasView._eliminar(${t.id}); this.closest('.wizard-full-screen').remove();" class="btn btn-danger">🗑️ Eliminar</button>` : '<div></div>'}
                    <div class="flex gap-10">
                        <button class="btn btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">✕ Cancelar</button>
                        <button class="btn btn-success" id="btn-save-trans">✔ Guardar</button>
                    </div>
                </div>
                <div id="trans-form-error" class="text-red text-xs mt-8" style="display:none;"></div>
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
                App.toast(isEdit ? 'Transportista actualizado ✔' : 'Transportista creado ✔');
                overlay.remove();
                TransportistasView.render();
            } catch (e) {
                errorDiv.textContent = '❌ ' + e.message;
                errorDiv.style.display = 'block';
            }
        };
    },

    async _eliminar(id) {
        if (!await Confirm.confirm("Eliminar Transportista", "¿Eliminar este transportista de forma permanente?", true)) return;
        try {
            await Transportistas.delete(id);
            App.toast('Transportista eliminado ✔');
            this.render();
        } catch (e) {
            App.toastError(e.message);
        }
    }
};

window.TransportistasView = TransportistasView;
