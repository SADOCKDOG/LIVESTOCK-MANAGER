/**
 * CompradoresView - Livestock Manager Premium v4.2.0
 * Vista modular de compradores y contratos.
 * Ofrece dos gestiones unificadas en la parte superior: Compradores y Contratos, con trazabilidad completa.
 */

const CompradoresView = {
    _activeModule: 'compradores', // 'compradores' o 'contratos'
    _currentTab: 'todos',
    _cachedCompradores: null,
    _cachedContratos: null,
    _searchQuery: '',

    async render() {
        const main = document.getElementById("app-content");
        
        main.innerHTML = `
          <!-- Selector superior de módulos (Gestión de Compradores y Contratos) -->
          <div class="comer-mode-switch mb-16" style="max-width: 420px; margin: 0 auto 20px; display: flex; gap: 8px;">
            <button class="comer-mode-btn ${this._activeModule === 'compradores' ? 'active' : ''}" 
              style="--mode-color:#8b5cf6; flex: 1; padding: 10px;" 
              onclick="CompradoresView._cambiarModulo('compradores')">
              ${Icons.compradores()} Compradores
            </button>
            <button class="comer-mode-btn ${this._activeModule === 'contratos' ? 'active' : ''}" 
              style="--mode-color:#10b981; flex: 1; padding: 10px;" 
              onclick="CompradoresView._cambiarModulo('contratos')">
              ${Icons.contratos()} Contratos
            </button>
          </div>

          <div id="module-container">
            <div class="loader">Cargando módulo...</div>
          </div>
        `;

        await this._cargarDatos();
    },

    async _cargarDatos() {
        try {
            const compradores = await Compradores.list().catch(() => []);
            const contratos = await Contratos.list().catch(() => []);

            this._cachedCompradores = compradores;
            this._cachedContratos = contratos;

            this._renderActiveModule();
        } catch (e) {
            console.error('[CompradoresView] Error:', e);
            document.getElementById("module-container").innerHTML = `<div class="card text-center p-40 text-red">❌ Error al cargar datos: ${e.message}</div>`;
        }
    },

    _cambiarModulo(modulo) {
        this._activeModule = modulo;
        this._searchQuery = '';
        
        // Actualizar estado de los botones superiores
        document.querySelectorAll('.comer-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(modulo.slice(0, -1)));
        });

        this.render();
    },

    _renderActiveModule() {
        const container = document.getElementById("module-container");
        if (!container) return;

        if (this._activeModule === 'compradores') {
            const meta = this._getTabMeta(this._currentTab);
            container.innerHTML = `
              <div class="mb-16 text-center">
                <div class="section-header-neon" style="--neon-color: ${meta.color}; max-width: 520px; margin: 0 auto;">COMPRADORES</div>
                <div class="comer-mode-switch">
                  <button class="comer-mode-btn ${this._currentTab === 'todos' ? 'active' : ''}" style="--mode-color:var(--p-gold);" data-tab="todos" onclick="CompradoresView._cambiarFiltro('todos')">${Icons.documento()} Todos</button>
                  <button class="comer-mode-btn ${this._currentTab === 'cárnico' ? 'active' : ''}" style="--mode-color:#ef4444;" data-tab="cárnico" onclick="CompradoresView._cambiarFiltro('cárnico')">${Icons.carne()} Carne</button>
                  <button class="comer-mode-btn ${this._currentTab === 'láctico' ? 'active' : ''}" style="--mode-color:#3b82f6;" data-tab="láctico" onclick="CompradoresView._cambiarFiltro('láctico')">${Icons.leche()} Leche</button>
                  <button class="comer-mode-btn ${this._currentTab === 'híbrido' ? 'active' : ''}" style="--mode-color:#10b981;" data-tab="híbrido" onclick="CompradoresView._cambiarFiltro('híbrido')">${Icons.rotacion()} Híbrido</button>
                </div>
              </div>

              <div class="card p-12 mb-16 border-222 card-dark-gradient pb-24">
                <div class="section-header-theme" style="--theme-color: var(--p-gold)">ACCIONES</div>
                <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto">
                  <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="CompradoresView.renderFormulario()">
                    ${Icons.agregar()}
                    <span class="widget-link-label">Nuevo Comprador</span>
                  </button>
                </div>
              </div>

              <div class="flex gap-8 mb-14">
                <input type="search" id="search-compradores" placeholder="Buscar por nombre, NIF o ciudad..."
                  oninput="CompradoresView._filtrarCompradores(this.value)"
                  class="search-input flex-1" value="${this._searchQuery}">
              </div>

              <div id="compr-lista"></div>
              <button class="fab-btn" onclick="CompradoresView.renderFormulario()" aria-label="Nuevo Comprador">${Icons.agregar()}</button>
            `;
            this._aplicarFiltrosCompradores();
        } else {
            // Módulo de Contratos
            container.innerHTML = `
              <div class="mb-16 text-center">
                <div class="section-header-neon" style="--neon-color: #10b981; max-width: 520px; margin: 0 auto;">CONTRATOS COMERCIALES</div>
              </div>

              <div class="card p-12 mb-16 border-222 card-dark-gradient pb-24">
                <div class="section-header-theme" style="--theme-color: #10b981">ACCIONES</div>
                <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto">
                  <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="CompradoresView._nuevoContratoLibre()">
                    ${Icons.agregar()}
                    <span class="widget-link-label">Añadir Contrato</span>
                  </button>
                </div>
              </div>

              <div class="flex gap-8 mb-14">
                <input type="search" id="search-contratos" placeholder="Buscar por Nº Contrato o condiciones..."
                  oninput="CompradoresView._filtrarContratos(this.value)"
                  class="search-input flex-1" value="${this._searchQuery}">
              </div>

              <div id="contratos-lista"></div>
              <button class="fab-btn" style="background:#10b981;" onclick="CompradoresView._nuevoContratoLibre()" aria-label="Nuevo Contrato">${Icons.agregar()}</button>
            `;
            this._aplicarFiltrosContratos();
        }
    },

    _getTabMeta(tab) {
        const map = {
            'todos': { color: 'var(--p-gold)', label: 'Todos' },
            'cárnico': { color: '#ef4444', label: 'Cárnico' },
            'láctico': { color: '#3b82f6', label: 'Láctico' },
            'híbrido': { color: '#10b981', label: 'Híbrido' }
        };
        return map[tab] || map.todos;
    },

    _cambiarFiltro(tab) {
        this._currentTab = tab;
        document.querySelectorAll('.comer-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });

        const meta = this._getTabMeta(tab);
        const headerNeon = document.querySelector('.section-header-neon');
        if (headerNeon) headerNeon.style.setProperty('--neon-color', meta.color);

        this._aplicarFiltrosCompradores();
    },

    _filtrarCompradores(value) {
        this._searchQuery = value;
        this._aplicarFiltrosCompradores();
    },

    _aplicarFiltrosCompradores() {
        if (!this._cachedCompradores) return;
        let filtrados = this._cachedCompradores;
        
        if (this._currentTab !== 'todos') {
            filtrados = filtrados.filter(c => c.tipo_comprador === this._currentTab);
        }
        
        if (this._searchQuery) {
            const q = this._searchQuery.toLowerCase();
            filtrados = filtrados.filter(c =>
                (c.nombre || '').toLowerCase().includes(q) ||
                (c.nif_cif || '').toLowerCase().includes(q) ||
                (c.ciudad || '').toLowerCase().includes(q)
            );
        }
        this._renderListaCompradores(filtrados);
    },

    _renderListaCompradores(lista) {
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
                <p class="empty-state-text">${this._cachedCompradores?.length === 0 ? 'Aún no hay compradores registrados.' : 'No hay compradores con ese filtro.'}</p>
                <button class="btn btn-create btn-sm" onclick="CompradoresView.renderFormulario()">${Icons.agregar()} Registrar primer comprador</button>
              </div>`;
            return;
        }

        // Crear mapa de contratos por comprador para renderizar en la lista
        const contratosPorComprador = {};
        (this._cachedContratos || []).forEach(ct => {
            if (!contratosPorComprador[ct.compradorId]) {
                contratosPorComprador[ct.compradorId] = [];
            }
            contratosPorComprador[ct.compradorId].push(ct);
        });

        contenedor.innerHTML = headerHtml + `<div class="grid gap-10">${lista.map(c => {
          const color = this._colorTipo(c.tipo_comprador);
          const cContratos = contratosPorComprador[c.id] || [];

          return `
          <div class="card card-animal no-underline" onclick="CompradoresView.renderDetalle(${c.id})"
            style="border-left:4px solid ${color}; padding:14px; margin:0; margin-bottom:8px; cursor:pointer;">
            <div class="flex flex-col gap-10">
              <div class="flex justify-between items-start w-full">
                <div class="flex items-center gap-10 min-w-0">
                  <div class="text-xl" style="color:${color}">${Icons.compradores()}</div>
                  <div class="text-xs">
                    <div class="font-bold text-white uppercase text-base tracking-tight">${c.nombre}</div>
                    <div class="text-gray mt-2 font-700 uppercase">
                      ${c.nif_cif ? Icons.documento() + ' ' + c.nif_cif : ''}${c.ciudad ? ' · ' + Icons.zonas() + ' ' + c.ciudad : ''}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="badge badge-sm uppercase" style="background:${color}15; color:${color}; border:1px solid ${color}35;">
                    ${c.tipo_comprador || 'híbrido'}
                  </span>
                  ${c.activo === false ? '<div class="text-red text-[0.6rem] font-900 mt-4 uppercase">INACTIVO</div>' : ''}
                </div>
              </div>
              
              <!-- Contratos asociados al comprador (GAP 7: Trazabilidad) -->
              <div class="mt-6 text-xs text-ccc style-border-top" style="border-top:1px solid #333; padding-top:8px; margin-top:4px;">
                <span class="font-800 text-gray">Contratos vinculados:</span>
                ${cContratos.length === 0 ? '<span class="text-gray-500 italic ml-4">Sin contratos asignados</span>' : 
                  cContratos.map(ct => `
                    <span class="badge" style="margin-left:4px; font-size:0.65rem; background:${ct.activo ? '#10b98120' : '#444'}; color:${ct.activo ? '#10b981' : '#888'}; border:1px solid ${ct.activo ? '#10b98140' : '#555'}; padding:1px 6px; border-radius:4px; font-weight:800;">
                      ${ct.numero_contrato} (${ct.activo ? 'Activo' : 'Vencido/Inactivo'})
                    </span>
                  `).join('')
                }
              </div>

              <div class="text-right w-full mt-2">
                <div class="text-[0.45rem] text-gray-700 font-900 uppercase tracking-widest">VER FICHA Y TRÁMITES ➔</div>
              </div>
            </div>
          </div>
        `}).join('')}</div>`;
    },

    _filtrarContratos(value) {
        this._searchQuery = value;
        this._aplicarFiltrosContratos();
    },

    _aplicarFiltrosContratos() {
        if (!this._cachedContratos) return;
        let filtrados = this._cachedContratos;

        if (this._searchQuery) {
            const q = this._searchQuery.toLowerCase();
            filtrados = filtrados.filter(ct =>
                (ct.numero_contrato || '').toLowerCase().includes(q) ||
                (ct.condiciones || '').toLowerCase().includes(q)
            );
        }
        this._renderListaContratos(filtrados);
    },

    _renderListaContratos(lista) {
        const contenedor = document.getElementById('contratos-lista');
        if (!contenedor) return;

        if (lista.length === 0) {
            contenedor.innerHTML = `
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.contratos()}</div>
                <p class="empty-state-text">Aún no hay contratos registrados.</p>
                <button class="btn btn-create btn-sm" style="background:#10b981;" onclick="CompradoresView._nuevoContratoLibre()">${Icons.agregar()} Crear primer contrato</button>
              </div>`;
            return;
        }

        // Crear mapa para resolver el nombre del comprador
        const compradorMap = {};
        (this._cachedCompradores || []).forEach(c => { compradorMap[c.id] = c; });

        contenedor.innerHTML = `<div class="grid gap-10">${lista.map(ct => {
          const comp = compradorMap[ct.compradorId];
          const color = ct.tipo === 'leche' ? '#3b82f6' : (ct.tipo === 'carne' ? '#ef4444' : '#10b981');
          
          return `
          <div class="card" style="border-left:4px solid ${color}; padding:14px; margin-bottom:8px;">
            <div class="flex justify-between items-start w-full">
              <div>
                <div class="font-800 text-xs" style="color:${color}; display:flex; align-items:center; gap:6px;">
                  ${ct.tipo === 'leche' ? Icons.leche() : Icons.carne()}
                  CONTRATO ${ct.tipo.toUpperCase()}
                  <span class="badge" style="background:${ct.activo ? 'rgba(16,185,129,0.15)' : 'rgba(85,85,85,0.15)'}; color:${ct.activo ? '#10b981' : '#888'}; font-size:0.6rem; padding:1px 6px; border-radius:4px; font-weight:900; text-transform:uppercase;">
                    ${ct.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div class="font-950 text-white text-base mt-4">${ct.numero_contrato}</div>
              </div>
              <div class="text-right text-xs text-ccc">
                Vigencia: ${ct.fecha_inicio ? new Date(ct.fecha_inicio).toLocaleDateString() : '?'}
                ${ct.fecha_fin ? ' al ' + new Date(ct.fecha_fin).toLocaleDateString() : ' (Indefinido)'}
              </div>
            </div>
            
            <div class="mt-8 text-xs text-ccc">
              <div>Comprador: 
                ${comp ? `
                  <a href="#/comprador?id=${comp.id}" class="text-gold font-800 hover-underline">${comp.nombre} (${comp.tipo_comprador})</a>
                ` : `
                  <span class="text-red font-800">No asignado / Comprador huérfano</span>
                `}
              </div>
              ${ct.condiciones ? `<div class="mt-4 italic">Condiciones: ${ct.condiciones}</div>` : ''}
              ${ct.precios && ct.precios.length > 0 ? `
                <div class="mt-6 flex flex-wrap gap-4">
                  ${ct.precios.map(pr => `
                    <span style="background:#222; border:1px solid #333; padding:1px 6px; border-radius:4px; font-size:0.65rem;">
                      ${pr.producto}: <strong>${pr.precio_unitario.toFixed(2)} €/${pr.unidad}</strong>
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <div class="mt-12 flex gap-6">
              <button class="btn btn-sm btn-outline text-xs" onclick="CompradoresView._verContrato(${ct.id})">${Icons.editar()} Editar Contrato</button>
              ${comp ? `<button class="btn btn-sm btn-outline text-xs" onclick="location.hash='#/comprador?id=${comp.id}'">${Icons.compradores()} Ficha Comprador</button>` : ''}
            </div>
          </div>
        `}).join('')}</div>`;
    },

    _colorTipo(tipo, bg = false, border = false) {
        const colores = {
            'cárnico': { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
            'láctico': { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
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

    async renderDetail(id) {
      // Método wrapper para mantener compatibilidad con cualquier llamada
      await this.renderDetalle(id);
    },

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
                  <span class="badge-tipo" style="padding:3px 12px; background:${this._colorTipo(comprador.tipo_comprador, true)}; color:${this._colorTipo(comprador.tipo_comprador)}; border:1px solid ${this._colorTipo(comprador.tipo_comprador, false, true)}; font-weight:800;">
                    ${comprador.tipo_comprador || 'híbrido'}
                  </span>
                  ${comprador.activo === false ? '<span class="text-red font-800 text-xs">INACTIVO</span>' : '<span class="text-green font-800 text-xs">ACTIVO</span>'}
                </div>
              </div>
              <div class="flex gap-10">
                <button class="widget-link-btn widget-link-btn--neon neon-danger" onclick="CompradoresView._eliminar(${id})">
                  ${Icons.eliminar()}
                  <span class="widget-link-label">Eliminar</span>
                </button>
                <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="CompradoresView.renderFormulario(${id})">
                  ${Icons.editar()}
                  <span class="widget-link-label">Editar</span>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-6 mt-12 text-sm text-aaa">
              ${comprador.nif_cif ? `<div class="flex items-center gap-4">${Icons.documento()} <strong>NIF:</strong> ${comprador.nif_cif}</div>` : ''}
              ${comprador.telefono ? `<div class="flex items-center gap-4">${Icons.info()} <strong>Tel:</strong> ${comprador.telefono}</div>` : ''}
              ${comprador.email ? `<div class="flex items-center gap-4">${Icons.enlace()} <strong>Email:</strong> ${comprador.email}</div>` : ''}
              ${comprador.ciudad ? `<div class="flex items-center gap-4">${Icons.zonas()} <strong>Ciudad:</strong> ${comprador.ciudad}${comprador.provincia ? ' ('+comprador.provincia+')' : ''}</div>` : ''}
              ${comprador.condiciones_pago ? `<div class="col-span-2 flex items-center gap-4">${Icons.dinero()} <strong>Condiciones pago:</strong> ${comprador.condiciones_pago}</div>` : ''}
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
          <div class="card p-16 mb-14 border-222">
            <div class="section-header-theme mb-12" style="--theme-color: #3b82f6">CONTRATOS</div>
            <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mb-16">
              <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="CompradoresView._nuevoContrato(${id})">
                ${Icons.agregar()}
                <span class="widget-link-label">Añadir Contrato</span>
              </button>
            </div>
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
          <div class="card p-16 mb-14">
            <h3 class="section-h3 flex items-center gap-8">${Icons.carne()} Historial de Ventas (Carne)</h3>
            ${ventasCarne.length === 0 ? '<div class="empty-state mt-0 mb-0"><p class="empty-state-text">Sin ventas registradas.</p></div>' :
              ventasCarne.slice(0, 30).map(v => `
                <div class="history-row">
                  <div>
                    <div class="history-title uppercase font-800">${Icons.calendar()} ${v.fechaSacrificio ? new Date(v.fechaSacrificio).toLocaleDateString() : '-'}</div>
                    <div class="history-sub uppercase font-700 text-75">${v.pesoCanal || 0} kg · REND: ${v.rendimientoCanal || 0}%</div>
                  </div>
                  <div class="text-right">
                    <div class="history-amount text-red">${(v.precio_total || (v.pesoCanal || 0) * 5.5).toFixed(0)} €</div>
                    <div class="kpi-sub uppercase font-700 text-[0.62rem]">${v.clasificacion?.seurop || 'S/C'}</div>
                  </div>
                </div>
              `).join('')}
            ${ventasCarne.length > 30 ? `<div class="history-more text-center uppercase font-800 text-75 mt-10">Mostrando 30 de ${ventasCarne.length} registros</div>` : ''}
          </div>

          <!-- Historial de Leche -->
          <div class="card p-16 mb-14">
            <h3 class="section-h3 flex items-center gap-8">${Icons.leche()} Historial de Entregas (Leche)</h3>
            ${entregasLeche.length === 0 ? '<div class="empty-state mt-0 mb-0"><p class="empty-state-text">Sin entregas registradas.</p></div>' :
              entregasLeche.slice(0, 20).map(e => `
                <div class="history-row">
                  <div>
                    <div class="history-title uppercase font-800">${Icons.calendar()} ${e.fechaRecogida ? new Date(e.fechaRecogida).toLocaleDateString() : '-'}</div>
                    <div class="history-sub uppercase font-700 text-75">${e.matriculaCisterna || 'S/N'}</div>
                  </div>
                  <div class="text-right">
                    <div class="history-amount text-amber">${(e.cantidad || 0).toLocaleString()} L</div>
                    <div class="kpi-sub uppercase font-700 text-[0.62rem]">${e.precio_final_unitario ? (e.precio_final_unitario).toFixed(3)+' €/L' : ''}</div>
                  </div>
                </div>
              `).join('')}
            ${entregasLeche.length > 20 ? `<div class="history-more text-center uppercase font-800 text-75 mt-10">Mostrando 20 de ${entregasLeche.length} registros</div>` : ''}
          </div>

          ${comprador.notas ? `
          <div class="card p-16 mb-14">
            <h3 class="section-h3 flex items-center gap-8">${Icons.documento()} Notas</h3>
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
                notes: '',
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

    _nuevoContratoLibre() {
        location.hash = '#/contrato';
    },

    _verContrato(id) {
        location.hash = '#/contrato?id=' + id;
    }
};

window.CompradoresView = CompradoresView;
