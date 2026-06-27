/**
 * CompradoresView - Livestock Manager Premium v4.0
 * Vista de compradores: lista, ficha detalle, formulario de alta/edición.
 */

const CompradoresView = {
    _currentTab: 'todos',
    _cachedData: null,

    async render() {
        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-16">
            <div class="flex gap-6 flex-wrap mb-10">
              ${['todos','cárnico','láctico','híbrido'].map(t => `
                <button class="filter-pill filter-pill-gold font-800 uppercase ${this._currentTab === t ? 'active' : ''}" data-tab="${t}"
                  onclick="CompradoresView._cambiarFiltro('${t}')"
                  style="letter-spacing:0.3px;">
                  ${t === 'todos' ? `${Icons.documento()} Todos` : t === 'cárnico' ? `${Icons.carne()} Cárnico` : t === 'láctico' ? `${Icons.leche()} Láctico` : `${Icons.rotacion()} Híbrido`}
                </button>
              `).join('')}
            </div>
            <div class="flex gap-8 flex-wrap">
              <input type="search" id="search-compradores" placeholder="🔍 Buscar por nombre, NIF o ciudad..."
                oninput="CompradoresView._filtrar(this.value)"
                class="search-input">
              <button class="btn btn-create btn-sm" onclick="CompradoresView.renderFormulario()">${Icons.agregar()} Nuevo</button>
            </div>
          </div>
          <div id="compr-lista"><div class="loader">Cargando compradores...</div></div>
          <button class="fab-btn" onclick="CompradoresView.renderFormulario()" aria-label="Nuevo Comprador">${Icons.agregar()}</button>`;

        await this._cargarDatos();
    },

    async _cargarDatos() {
        const compradores = await Compradores.list();
        const fincaId = await Fincas.getActiveId();
        const [ventasCarne, ventasLeche] = await Promise.all([
            window.db.getAllFromIndex('comercializacion_carne', 'fincaId', fincaId).catch(() => []),
            window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []),
        ]);
        const ingresoTotal = ventasCarne.reduce((s, v) => s + (v.precio_total || 0), 0) +
            ventasLeche.reduce((s, v) => s + (v.importe_total || (v.cantidad || 0) * (v.precioBase || 0)), 0);
        const tipos = { cárnico: 0, láctico: 0, híbrido: 0 };
        compradores.forEach(c => { if (tipos[c.tipo_comprador] !== undefined) tipos[c.tipo_comprador]++; });
        this._cachedData = compradores;
        this._renderLista(compradores);
    },

    _cambiarFiltro(tab) {
        this._currentTab = tab;
        document.querySelectorAll('button[data-tab]').forEach(b => {
            if (b.dataset.tab === tab) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        const busqueda = document.getElementById('search-compradores')?.value || '';
        this._aplicarFiltros(busqueda);
    },

    _filtrar(texto) {
        this._aplicarFiltros(texto);
    },

    _aplicarFiltros(busqueda) {
        if (!this._cachedData) return;
        let filtrados = this._cachedData;
        if (this._currentTab !== 'todos') {
            filtrados = filtrados.filter(c => c.tipo_comprador === this._currentTab);
        }
        if (busqueda) {
            const q = busqueda.toLowerCase();
            filtrados = filtrados.filter(c =>
                (c.nombre || '').toLowerCase().includes(q) ||
                (c.nif_cif || '').toLowerCase().includes(q) ||
                (c.ciudad || '').toLowerCase().includes(q)
            );
        }
        this._renderLista(filtrados);
    },

    _renderLista(lista) {
        const contenedor = document.getElementById('compr-lista');
        if (!contenedor) return;

        let headerHtml = '';
        if (this._currentTab === 'cárnico') {
            headerHtml = `<div class="comprador-mode-header comprador-mode-header--carne">${Icons.carne()} Mostrando Mataderos y Tratantes Cárnicos</div>`;
        } else if (this._currentTab === 'láctico') {
            headerHtml = `<div class="comprador-mode-header comprador-mode-header--leche">${Icons.leche()} Mostrando Industrias Lácteas y Queserías</div>`;
        } else if (this._currentTab === 'híbrido') {
            headerHtml = `<div class="comprador-mode-header comprador-mode-header--hibrido">${Icons.rotacion()} Mostrando Operadores Híbridos (Carne y Leche)</div>`;
        }

        if (lista.length === 0) {
            contenedor.innerHTML = headerHtml + `
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.edificio()}</div>
                <p class="empty-state-text">${this._cachedData?.length === 0 ? 'Aún no hay compradores registrados.' : 'No hay compradores con ese filtro.'}</p>
                <button class="btn btn-create btn-sm" onclick="CompradoresView.renderFormulario()">${Icons.agregar()} Registrar primer comprador</button>
              </div>`;
            return;
        }

        contenedor.innerHTML = headerHtml + `<div class="grid gap-10">${lista.map(c => `
          <div class="card card-list-item" onclick="CompradoresView.renderDetalle(${c.id})"
            style="border-left:4px solid ${this._colorTipo(c.tipo_comprador)};">
            <div class="flex justify-between items-start">
              <div class="flex-1 min-w-0">
                <div class="text-white font-800 text-md">${c.nombre}</div>
                <div class="text-gray mt-4 text-75">
                  ${c.nif_cif ? '🔑 '+c.nif_cif : ''}${c.ciudad ? ' · 📍 '+c.ciudad : ''}
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-8">
                <span class="badge-tipo" style="background:${this._colorTipo(c.tipo_comprador, true)}; color:${this._colorTipo(c.tipo_comprador)}; border:1px solid ${this._colorTipo(c.tipo_comprador, false, true)};">
                  ${c.tipo_comprador || 'híbrido'}
                </span>
                ${c.activo === false ? '<span class="text-red text-60 d-block mt-4">INACTIVO</span>' : ''}
              </div>
            </div>
          </div>
        `).join('')}</div>`;
    },

    _colorTipo(tipo, bg = false, border = false) {
        const colores = {
            'cárnico': { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
            'láctico': { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
            'híbrido': { text: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' }
        };
        const c = colores[tipo] || colores['híbrido'];
        if (bg) return c.bg;
        if (border) return c.border;
        return c.text;
    },

    // ============================================
    // DETALLE COMPRADOR
    // ============================================

    async renderDetalle(id) {
        const comprador = await Compradores.get(id);
        if (!comprador) return App.toastError('Comprador no encontrado');

        const [ventasCarne, entregasLeche, contratos, resumen] = await Promise.all([
            Compradores.getVentasCarne(id),
            Compradores.getEntregasLeche(id),
            Contratos.list(id),
            Compradores.getResumen(id)
        ]);

        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-12">
            <a href="#/compradores" class="link-back">← Volver a compradores</a>
          </div>

          <!-- Cabecera -->
          <div class="card p-20" style="border-top:4px solid ${this._colorTipo(comprador.tipo_comprador)};">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-white mt-0 mb-4" style="font-size:1.3rem; border:none; padding:0;">${comprador.nombre}</h2>
                <div class="flex gap-8 flex-wrap mb-8">
                  <span class="badge-tipo" style="padding:3px 12px; background:${this._colorTipo(comprador.tipo_comprador, true)}; color:${this._colorTipo(comprador.tipo_comprador)}; border:1px solid ${this._colorTipo(comprador.tipo_comprador, false, true)};">
                    ${comprador.tipo_comprador || 'híbrido'}
                  </span>
                  ${comprador.activo === false ? '<span class="text-red font-800 text-xs">INACTIVO</span>' : '<span class="text-green font-800 text-xs">ACTIVO</span>'}
                </div>
              </div>
              <div class="flex gap-6">
                <button onclick="CompradoresView._eliminar(${id})" class="btn btn-danger btn-sm">${Icons.eliminar()} Eliminar</button>
                <button onclick="CompradoresView.renderFormulario(${id})" class="btn btn-edit btn-sm">${Icons.editar()} Editar</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-6 mt-12 text-sm text-aaa">
              ${comprador.nif_cif ? '<div>🔑 <strong>NIF:</strong> '+comprador.nif_cif+'</div>' : ''}
              ${comprador.telefono ? '<div>📞 <strong>Tel:</strong> '+comprador.telefono+'</div>' : ''}
              ${comprador.email ? '<div>📧 <strong>Email:</strong> '+comprador.email+'</div>' : ''}
              ${comprador.ciudad ? '<div>📍 <strong>Ciudad:</strong> '+comprador.ciudad+(comprador.provincia ? ' ('+comprador.provincia+')' : '')+'</div>' : ''}
              ${comprador.condiciones_pago ? '<div class="col-span-2">💳 <strong>Condiciones pago:</strong> '+comprador.condiciones_pago+'</div>' : ''}
            </div>
          </div>

          <!-- KPIS -->
          <div class="grid grid-cols-3 gap-8 mb-14">
            <div class="card p-12 text-center mb-0">
              <div class="kpi-label">Ventas Carne</div>
              <div class="kpi-value text-red">${resumen.total_ventas_carne}</div>
              <div class="kpi-sub">${resumen.peso_canal_total.toLocaleString()} kg</div>
            </div>
            <div class="card p-12 text-center mb-0">
              <div class="kpi-label">Entregas Leche</div>
              <div class="kpi-value text-amber">${resumen.total_entregas_leche}</div>
              <div class="kpi-sub">${resumen.litros_totales.toLocaleString()} L</div>
            </div>
            <div class="card p-12 text-center mb-0">
              <div class="kpi-label">Contratos</div>
              <div class="kpi-value text-violet">${contratos.length}</div>
              <div class="kpi-sub">${resumen.contratos_activos} activos</div>
            </div>
          </div>

          <!-- Contratos activos -->
          <div class="card p-16">
            <h3 class="section-h3 flex justify-between items-center">
              <span>${Icons.contratos()} Contratos</span>
              <button onclick="CompradoresView._nuevoContrato(${id})" class="btn btn-create btn-sm" style="font-size:0.65rem; padding:4px 8px;">${Icons.agregar()} Añadir</button>
            </h3>
            ${contratos.length === 0 ? '<div class="empty-state mt-0 mb-0"><p class="empty-state-text">Sin contratos registrados.</p></div>' :
              contratos.map(c => `
                <div class="info-box-sm mb-6" onclick="CompradoresView._verContrato(${c.id})" style="cursor:pointer; border-left:3px solid ${c.activo ? '#10b981' : '#555'};">
                  <div class="flex justify-between">
                    <span class="text-white font-bold text-85">${c.numero_contrato}</span>
                    <span class="text-xs" style="padding:2px 8px; border-radius:6px; background:${c.activo ? 'rgba(16,185,129,0.15)' : 'rgba(85,85,85,0.15)'}; color:${c.activo ? '#10b981' : '#888'};">${c.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <div class="text-gray text-xs mt-4">
                    ${c.tipo || 'carne'} · ${c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '?'} ${c.fecha_fin ? '→ '+new Date(c.fecha_fin).toLocaleDateString() : ''}
                    ${c.precios?.length ? ' · '+c.precios.length+' precio(s)' : ''}
                  </div>
                </div>
              `).join('')}
          </div>

          <!-- Historial de Ventas Carne -->
          <div class="card p-16">
            <h3 class="section-h3">${Icons.carne()} Historial de Ventas (Carne)</h3>
            ${ventasCarne.length === 0 ? '<div class="empty-state mt-0 mb-0"><p class="empty-state-text">Sin ventas registradas.</p></div>' :
              ventasCarne.slice(0, 30).map(v => `
                <div class="history-row">
                  <div>
                    <div class="history-title">${Icons.calendar()} ${v.fechaSacrificio ? new Date(v.fechaSacrificio).toLocaleDateString() : '-'}</div>
                    <div class="history-sub">${v.pesoCanal || 0} kg · Rend: ${v.rendimientoCanal || 0}%</div>
                  </div>
                  <div class="text-right">
                    <div class="history-amount text-red">${(v.precio_total || (v.pesoCanal || 0) * 5.5).toFixed(0)} €</div>
                    <div class="kpi-sub">${v.clasificacion?.seurop || 'S/C'}</div>
                  </div>
                </div>
              `).join('')}
            ${ventasCarne.length > 30 ? `<div class="history-more">Mostrando 30 de ${ventasCarne.length} registros</div>` : ''}
          </div>

          <!-- Historial de Leche -->
          <div class="card p-16">
            <h3 class="section-h3">${Icons.leche()} Historial de Entregas (Leche)</h3>
            ${entregasLeche.length === 0 ? '<div class="empty-state mt-0 mb-0"><p class="empty-state-text">Sin entregas registradas.</p></div>' :
              entregasLeche.slice(0, 20).map(e => `
                <div class="history-row">
                  <div>
                    <div class="history-title">${Icons.calendar()} ${e.fechaRecogida ? new Date(e.fechaRecogida).toLocaleDateString() : '-'}</div>
                    <div class="history-sub">${e.matriculaCisterna || 'S/N'}</div>
                  </div>
                  <div class="text-right">
                    <div class="history-amount text-amber">${(e.cantidad || 0).toLocaleString()} L</div>
                    <div class="kpi-sub">${e.precio_final_unitario ? (e.precio_final_unitario).toFixed(3)+' €/L' : ''}</div>
                  </div>
                </div>
              `).join('')}
            ${entregasLeche.length > 20 ? `<div class="history-more">Mostrando 20 de ${entregasLeche.length} registros</div>` : ''}
          </div>

          ${comprador.notas ? `
          <div class="card p-16">
            <h3 class="section-h3">${Icons.documento()} Notas</h3>
            <p class="text-sm text-aaa m-0">${comprador.notas}</p>
          </div>` : ''}
        `;
    },

    // ============================================
    // FORMULARIO COMPRADOR
    // ============================================

    async renderFormulario(id) {
        const esEdicion = !!id;
        const c = esEdicion ? await Compradores.get(id) : {
            nombre: '', nif_cif: '', direccion: '', codigo_postal: '', ciudad: '', provincia: '',
            telefono: '', email: '', tipo_comprador: 'híbrido', tipo_operador: 'operador_comercial',
            rega: '', comunidad_autonoma: '', condiciones_pago: '', notas: '', activo: true
        };

        const main = document.getElementById("app-content");
        main.innerHTML = `
          <div class="mb-12">
            <a href="${esEdicion ? '#/comprador?id='+id : '#/compradores'}" class="link-back">← Volver</a>
          </div>
          <div class="card p-20 border-top-3px border-top-3px-gold">
            <h2 class="text-amber mt-0 mb-16 text-lg">${esEdicion ? `${Icons.editar()} Editar Comprador` : `${Icons.agregar()} Nuevo Comprador`}</h2>

            <label class="form-label">NOMBRE / RAZÓN SOCIAL *</label>
            <input type="text" id="c-nombre" value="${c.nombre}" class="premium-input mb-12" placeholder="Ej: Ganaderías del Sur S.L.">

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div>
                <label class="form-label">NIF / CIF *</label>
                <input type="text" id="c-nif" value="${c.nif_cif}" class="premium-input" placeholder="B12345678">
              </div>
              <div>
                <label class="form-label">TIPO COMPRADOR *</label>
                <select id="c-tipo" class="premium-input">
                  <option value="cárnico" ${c.tipo_comprador === 'cárnico' ? 'selected' : ''}>🥩 Cárnico</option>
                  <option value="láctico" ${c.tipo_comprador === 'láctico' ? 'selected' : ''}>🥛 Láctico</option>
                  <option value="híbrido" ${c.tipo_comprador === 'híbrido' || !c.tipo_comprador ? 'selected' : ''}>🔄 Híbrido</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-10 mb-12">
              <div>
                <label class="form-label">TIPO OPERADOR SIGGAN</label>
                <select id="c-tipo-operador" class="premium-input">
                  <option value="matadero" ${c.tipo_operador === 'matadero' ? 'selected' : ''}>Matadero</option>
                  <option value="industria_lactea" ${c.tipo_operador === 'industria_lactea' ? 'selected' : ''}>Industria láctea</option>
                  <option value="operador_comercial" ${!c.tipo_operador || c.tipo_operador === 'operador_comercial' ? 'selected' : ''}>Operador comercial</option>
                  <option value="tratante" ${c.tipo_operador === 'tratante' ? 'selected' : ''}>Tratante</option>
                </select>
              </div>
              <div>
                <label class="form-label">REGA DESTINO</label>
                <input type="text" id="c-rega" value="${c.rega || ''}" class="premium-input" placeholder="ES041230000123">
              </div>
              <div>
                <label class="form-label">CCAA</label>
                <select id="c-ccaa" class="premium-input">
                  <option value="">—</option>
                  <option value="andalucia" ${c.comunidad_autonoma === 'andalucia' ? 'selected' : ''}>Andalucía</option>
                  <option value="extremadura" ${c.comunidad_autonoma === 'extremadura' ? 'selected' : ''}>Extremadura</option>
                </select>
              </div>
            </div>

            <label class="form-label">DIRECCIÓN</label>
            <input type="text" id="c-dir" value="${c.direccion}" class="premium-input mb-12" placeholder="Calle, número...">

            <div class="grid grid-cols-3 gap-10 mb-12">
              <div>
                <label class="form-label">CÓDIGO POSTAL</label>
                <input type="text" id="c-cp" value="${c.codigo_postal}" class="premium-input">
              </div>
              <div>
                <label class="form-label">CIUDAD</label>
                <input type="text" id="c-ciudad" value="${c.ciudad}" class="premium-input">
              </div>
              <div>
                <label class="form-label">PROVINCIA</label>
                <input type="text" id="c-prov" value="${c.provincia}" class="premium-input">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div>
                <label class="form-label">TELÉFONO</label>
                <input type="tel" id="c-tel" value="${c.telefono}" class="premium-input">
              </div>
              <div>
                <label class="form-label">EMAIL</label>
                <input type="email" id="c-email" value="${c.email}" class="premium-input">
              </div>
            </div>

            <label class="form-label">CONDICIONES DE PAGO</label>
            <input type="text" id="c-pago" value="${c.condiciones_pago}" class="premium-input mb-12" placeholder="Ej: 30 días fecha factura">

            <label class="form-label">NOTAS</label>
            <textarea id="c-notas" class="premium-input mb-12 min-h-60">${c.notas}</textarea>

            <label class="wizard-checkbox-container mb-16">
              <input type="checkbox" id="c-activo" ${c.activo !== false ? 'checked' : ''}>
              <span>Comprador activo</span>
            </label>

            <div class="flex justify-between items-center mt-20">
              ${esEdicion ? `<button onclick="CompradoresView._eliminar(${id})" class="btn btn-danger">${Icons.eliminar()} Eliminar</button>` : '<div></div>'}
              <div class="flex gap-10">
                <button onclick="location.hash='${esEdicion ? '#/comprador?id='+id : '#/compradores'}'" class="btn btn-secondary">${Icons.cerrar()} Cancelar</button>
                <button onclick="CompradoresView._guardar(${id || ''})" class="btn btn-success">${Icons.guardar()} Guardar</button>
              </div>
            </div>
          </div>
        `;
    },

    async _guardar(id) {
        try {
            const data = {
                id: id || undefined,
                nombre: document.getElementById('c-nombre').value.trim(),
                nif_cif: document.getElementById('c-nif').value.trim(),
                tipo_comprador: document.getElementById('c-tipo').value,
                tipo_operador: document.getElementById('c-tipo-operador').value,
                rega: document.getElementById('c-rega').value.trim(),
                comunidad_autonoma: document.getElementById('c-ccaa').value,
                direccion: document.getElementById('c-dir').value.trim(),
                codigo_postal: document.getElementById('c-cp').value.trim(),
                ciudad: document.getElementById('c-ciudad').value.trim(),
                provincia: document.getElementById('c-prov').value.trim(),
                telefono: document.getElementById('c-tel').value.trim(),
                email: document.getElementById('c-email').value.trim(),
                condiciones_pago: document.getElementById('c-pago').value.trim(),
                notas: document.getElementById('c-notas').value.trim(),
                activo: document.getElementById('c-activo').checked
            };

            if (!data.nombre) return App.toastError('El nombre es obligatorio');
            if (!data.nif_cif) return App.toastError('El NIF/CIF es obligatorio');

            const nuevoId = await Compradores.save(data);
            App.toast(id ? 'Comprador actualizado ✔' : 'Comprador creado ✔');

            // Si venimos del wizard de venta, volver
            if (window._volverAWizardVenta) {
              window._volverAWizardVenta = false;
              // Quitar overlay oculto del wizard y recargar la ruta comercializacion
              // para que se cree el wizard fresco con el nuevo comprador disponible
              const wizardOverlay = document.getElementById('wizard-venta-masiva');
              if (wizardOverlay) wizardOverlay.remove();
              location.hash = '#/comercializacion';
              return;
            }

            location.hash = '#/comprador?id=' + nuevoId;
        } catch (e) {
            App.toastError(e.message);
        }
    },

    async _eliminar(id) {
        if (!await Confirm.confirm("Eliminar Comprador", "¿Eliminar este comprador permanentemente?", true)) return;
        try {
            await Compradores.delete(id);
            App.toast('Comprador eliminado');
            location.hash = '#/compradores';
        } catch (e) {
            App.toastError(e.message);
        }
    },

    _nuevoContrato(compradorId) {
        location.hash = '#/contrato?compradorId=' + compradorId;
    },

    _verContrato(id) {
        location.hash = '#/contrato?id=' + id;
    }
};

window.CompradoresView = CompradoresView;
