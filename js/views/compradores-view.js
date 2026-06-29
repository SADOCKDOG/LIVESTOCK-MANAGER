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
          <div class="card p-12 mb-16 border-222 card-dark-gradient pb-16">
            <div class="comer-mode-switch mb-8" style="display: flex; gap: 8px;">
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
            <div class="text-[0.55rem] text-gray-600 uppercase font-800 tracking-wider text-center leading-tight">Gestión de compradores por tipo de explotación y contratos comerciales</div>
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
              <div class="card p-12 mb-16 border-222 card-dark-gradient pb-16">
                <div class="text-center mb-8">
                  <div class="section-header-neon" style="--neon-color: ${meta.color}; max-width: 520px; margin: 0 auto;">COMPRADORES</div>
                  <div class="comer-mode-switch">
                    <button class="comer-mode-btn ${this._currentTab === 'todos' ? 'active' : ''}" style="--mode-color:var(--p-gold);" data-tab="todos" onclick="CompradoresView._cambiarFiltro('todos')">${Icons.documento()} TODOS</button>
                    <button class="comer-mode-btn ${this._currentTab === 'cárnico' ? 'active' : ''}" style="--mode-color:#ef4444;" data-tab="cárnico" onclick="CompradoresView._cambiarFiltro('cárnico')">${Icons.carne()} CARNE</button>
                    <button class="comer-mode-btn ${this._currentTab === 'láctico' ? 'active' : ''}" style="--mode-color:#3b82f6;" data-tab="láctico" onclick="CompradoresView._cambiarFiltro('láctico')">${Icons.leche()} LECHE</button>
                    <button class="comer-mode-btn ${this._currentTab === 'híbrido' ? 'active' : ''}" style="--mode-color:#10b981;" data-tab="híbrido" onclick="CompradoresView._cambiarFiltro('híbrido')">${Icons.rotacion()} HÍBRIDO</button>
                  </div>
                </div>
                <div class="text-[0.55rem] text-gray-600 uppercase font-800 tracking-wider text-center leading-tight">Filtrar compradores por tipo de producción cárnica, láctea o híbrida</div>
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
                  class="search-input flex-1 uppercase font-700" value="${this._searchQuery}">
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
                    <span class="widget-link-label">Nuevo Contrato</span>
                  </button>
                </div>
              </div>

              <div class="flex gap-8 mb-14">
                <input type="search" id="search-contratos" placeholder="Buscar por Nº Contrato o condiciones..."
                  oninput="CompradoresView._filtrarContratos(this.value)"
                  class="search-input flex-1 uppercase font-700" value="${this._searchQuery}">
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

        contenedor.innerHTML = headerHtml + `<div class="grid gap-12">${lista.map(c => {
          const color = this._colorTipo(c.tipo_comprador);
          const cContratos = contratosPorComprador[c.id] || [];

          return `
          <div class="card card-animal no-underline" onclick="CompradoresView.renderDetalle(${c.id})"
            style="border-left:4px solid ${color}; padding:14px; margin:0; margin-bottom:8px; cursor:pointer; background:rgba(0,0,0,0.2);">
            <div class="flex flex-col gap-10">
              <div class="flex justify-between items-start w-full">
                <div class="flex items-center gap-10 min-w-0">
                  <div class="text-xl" style="color:${color}">${Icons.compradores()}</div>
                  <div class="text-xs">
                    <div class="font-950 text-white uppercase text-base tracking-tight" style="color:${color} !important;">${c.nombre}</div>
                    <div class="text-gray-500 mt-2 font-800 uppercase text-[0.65rem] tracking-wider flex items-center gap-6">
                      ${c.nif_cif ? Icons.documento() + ' ' + c.nif_cif : ''}${c.ciudad ? ' · ' + Icons.zonas() + ' ' + c.ciudad.toUpperCase() : ''}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="badge badge-sm font-900 uppercase" style="background:${color}20; color:${color}; border:1px solid ${color}40;">
                    ${c.tipo_comprador || 'híbrido'}
                  </span>
                  ${c.activo === false ? '<div class="text-red text-[0.55rem] font-950 mt-4 uppercase tracking-widest">INACTIVO</div>' : ''}
                </div>
              </div>
              
              <!-- Contratos asociados al comprador -->
              <div class="mt-6 text-[0.62rem] text-aaa font-800 uppercase tracking-tighter style-border-top" style="border-top:1px solid #222; padding-top:10px;">
                <span class="text-gray-600 font-900 mr-6">CONTRATOS VINCULADOS:</span>
                ${cContratos.length === 0 ? '<span class="text-gray-700 italic">SIN CONTRATOS ASIGNADOS</span>' :
                  cContratos.map(ct => `
                    <span class="badge" style="margin-left:4px; font-size:0.6rem; background:${ct.activo ? '#10b98120' : '#222'}; color:${ct.activo ? '#10b981' : '#555'}; border:1px solid ${ct.activo ? '#10b98140' : '#333'}; padding:2px 8px; border-radius:30px; font-weight:900;">
                      ${ct.numero_contrato}
                    </span>
                  `).join('')
                }
              </div>

              <div class="text-right w-full mt-4">
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

        contenedor.innerHTML = `<div class="grid gap-12">${lista.map(ct => {
          const comp = compradorMap[ct.compradorId];
          const color = ct.tipo === 'leche' ? '#3b82f6' : (ct.tipo === 'carne' ? '#ef4444' : '#10b981');
          
          return `
          <div class="card bg-black-opacity-50" style="border-left:4px solid ${color}; padding:16px; margin-bottom:10px; border-radius:12px;">
            <div class="flex justify-between items-start w-full">
              <div>
                <div class="font-950 text-[0.65rem] tracking-widest uppercase mb-4" style="color:${color}; display:flex; align-items:center; gap:8px;">
                  ${ct.tipo === 'leche' ? Icons.leche() : Icons.carne()}
                  CONTRATO ${ct.tipo.toUpperCase()}
                  <span class="badge" style="background:${ct.activo ? '#10b98120' : '#222'}; color:${ct.activo ? '#10b981' : '#555'}; border:1px solid ${ct.activo ? '#10b98140' : '#333'}; font-size:0.55rem; padding:2px 8px; border-radius:30px; font-weight:950; text-transform:uppercase; letter-spacing:0.5px;">
                    ${ct.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                <div class="font-black text-white text-lg mt-2 uppercase tracking-tight">${ct.numero_contrato}</div>
              </div>
              <div class="text-right text-[0.6rem] text-gray-500 font-800 uppercase tracking-widest">
                Vigencia: <span class="text-ccc">${ct.fecha_inicio ? new Date(ct.fecha_inicio).toLocaleDateString() : '?'}</span>
                ${ct.fecha_fin ? '<br>AL <span class="text-ccc">' + new Date(ct.fecha_fin).toLocaleDateString() + '</span>' : '<br><span class="text-aaa">(INDEFINIDO)</span>'}
              </div>
            </div>
            
            <div class="mt-12 text-xs text-ccc bg-black p-10 rounded-sm border border-222">
              <div class="uppercase font-800 text-[0.65rem] text-gray-500 mb-4 tracking-wider">COMPRADOR ASIGNADO:</div>
              <div class="flex items-center gap-6">
                ${comp ? `
                  <a href="#/comprador?id=${comp.id}" class="text-gold font-950 uppercase hover-underline text-sm flex items-center gap-4">${Icons.compradores()} ${comp.nombre}</a>
                ` : `
                  <span class="text-red font-950 uppercase text-xs flex items-center gap-4">${Icons.alerta()} NO ASIGNADO / HUÉRFANO</span>
                `}
              </div>
              ${ct.condiciones ? `<div class="mt-8 italic text-aaa border-top-222 pt-8 uppercase text-[0.6rem] leading-relaxed">Condiciones: ${ct.condiciones}</div>` : ''}
              ${ct.precios && ct.precios.length > 0 ? `
                <div class="mt-10 flex flex-wrap gap-4 border-top-222 pt-10">
                  ${ct.precios.map(pr => `
                    <span style="background:#111; border:1px solid #333; padding:4px 10px; border-radius:30px; font-size:0.6rem; font-weight:900; color:#aaa; text-transform:uppercase;">
                      ${pr.producto}: <strong class="text-white ml-2">${pr.precio_unitario.toFixed(3)} €/${pr.unidad.toUpperCase()}</strong>
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <div class="mt-16 flex gap-8">
              <button class="widget-link-btn widget-link-btn--neon neon-info flex-1 px-12 py-8 min-h-0 h-auto" onclick="CompradoresView._verContrato(${ct.id})">
                ${Icons.editar()} <span class="widget-link-label text-[0.65rem]">EDITAR</span>
              </button>
              ${comp ? `<button class="widget-link-btn widget-link-btn--neon neon-warning flex-1 px-12 py-8 min-h-0 h-auto" onclick="location.hash='#/comprador?id=${comp.id}'">
                ${Icons.compradores()} <span class="widget-link-label text-[0.65rem]">FICHA CLIENTE</span>
              </button>` : ''}
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
        const colorComp = this._colorTipo(comprador.tipo_comprador);

        main.innerHTML = `
          <div class="mb-14">
            <button onclick="location.hash='#/compradores'" class="widget-link-btn widget-link-btn--neon neon-danger px-16 py-8 min-h-0 h-auto">
              <span class="text-[0.7rem] font-950 uppercase tracking-widest">${Icons.atras()} Volver</span>
            </button>
          </div>

          <!-- Cabecera -->
          <div class="card p-20 border-top-3px bg-black" style="border-top-color:${colorComp};">
            <div class="flex justify-between items-start mb-16">
              <div>
                <h2 class="text-white mt-0 mb-4 text-2xl font-black uppercase tracking-tight" style="color:${colorComp} !important;">${comprador.nombre}</h2>
                <div class="flex gap-8 flex-wrap">
                  <span class="badge badge-sm font-950 uppercase" style="background:${colorComp}20; color:${colorComp}; border:1px solid ${colorComp}40;">
                    ${comprador.tipo_comprador || 'híbrido'}
                  </span>
                  ${comprador.activo === false ? '<span class="badge badge-sm font-950 uppercase bg-red-900 border-red-500 text-white">INACTIVO</span>' : '<span class="badge badge-sm font-950 uppercase bg-green-900 border-green-500 text-white">ACTIVO</span>'}
                </div>
              </div>
              <div class="flex gap-8">
                <button class="widget-link-btn widget-link-btn--neon neon-danger px-12 py-8 min-h-0 h-auto" onclick="CompradoresView._eliminar(${id})">
                  ${Icons.eliminar()}
                </button>
                <button class="widget-link-btn widget-link-btn--neon neon-info px-12 py-8 min-h-0 h-auto" onclick="CompradoresView.renderFormulario(${id})">
                  ${Icons.editar()}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-15 text-xs text-gray-500 uppercase font-800 tracking-wider bg-dark p-14 rounded-sm border border-222">
              ${comprador.nif_cif ? `<div class="flex items-center gap-6">${Icons.documento()} <span class="text-aaa">NIF:</span> <strong class="text-white">${comprador.nif_cif}</strong></div>` : ''}
              ${comprador.telefono ? `<div class="flex items-center gap-6">${Icons.info()} <span class="text-aaa">TEL:</span> <strong class="text-white">${comprador.telefono}</strong></div>` : ''}
              ${comprador.email ? `<div class="flex items-center gap-6 lowercase">${Icons.enlace()} <span class="text-aaa uppercase">EMAIL:</span> <strong class="text-white">${comprador.email}</strong></div>` : ''}
              ${comprador.ciudad ? `<div class="flex items-center gap-6">${Icons.zonas()} <span class="text-aaa">UBICACIÓN:</span> <strong class="text-white">${comprador.ciudad.toUpperCase()}${comprador.provincia ? ' ('+comprador.provincia.toUpperCase()+')' : ''}</strong></div>` : ''}
              ${comprador.condiciones_pago ? `<div class="col-span-full flex items-center gap-6 mt-4 border-top-222 pt-8">${Icons.dinero()} <span class="text-aaa">PAGO:</span> <strong class="text-white">${comprador.condiciones_pago.toUpperCase()}</strong></div>` : ''}
              ${comprador.rega ? `<div class="col-span-full flex items-center gap-6 text-gold font-900">${Icons.informeRega()} <span class="text-aaa">REGA DESTINO:</span> ${comprador.rega}</div>` : ''}
            </div>
          </div>

          <!-- KPIS -->
          <div class="grid grid-cols-3 gap-8 mb-16">
            <div class="summary-cell summary-cell-kpi border-left-red">
              <small class="s-lbl uppercase font-900">CARNE</small>
              <div class="s-val inf-val-lg text-red font-950">${resumen.total_ventas_carne}</div>
              <small class="text-gray-600 text-[0.5rem] font-800 block mt-2">${resumen.peso_canal_total.toLocaleString()} KG</small>
            </div>
            <div class="summary-cell summary-cell-kpi border-left-amber">
              <small class="s-lbl uppercase font-900">LECHE</small>
              <div class="s-val inf-val-lg text-amber font-950">${resumen.total_entregas_leche}</div>
              <small class="text-gray-600 text-[0.5rem] font-800 block mt-2">${resumen.litros_totales.toLocaleString()} L</small>
            </div>
            <div class="summary-cell summary-cell-kpi border-left-purple">
              <small class="s-lbl uppercase font-900">CONTRATOS</small>
              <div class="s-val inf-val-lg text-purple font-950">${contratos.length}</div>
              <small class="text-gray-600 text-[0.5rem] font-800 block mt-2">${resumen.contratos_activos} ACTIVOS</small>
            </div>
          </div>

          <!-- Contratos activos -->
          <div class="card p-16 mb-16 border-222 bg-black">
            <div class="text-xs text-gray-500 uppercase font-950 tracking-widest border-bottom-222 pb-8 mb-16 flex items-center gap-8">
                ${Icons.contratos()} CONTRATOS VIGENTES
            </div>
            <div class="grid grid-cols-1 gap-10 max-w-240 mx-auto mb-20">
              <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="CompradoresView._nuevoContrato(${id})">
                ${Icons.agregar()}
                <span class="widget-link-label">NUEVO CONTRATO</span>
              </button>
            </div>
            <div class="grid gap-8">
            ${contratos.length === 0 ? '<div class="empty-state border-none mt-0 mb-0"><p class="empty-state-text uppercase font-900 text-xs">Sin contratos registrados.</p></div>' :
              contratos.map(c => `
                <div class="info-box-sm mb-4 bg-dark border border-222" onclick="CompradoresView._verContrato(${c.id})" style="cursor:pointer; border-left:4px solid ${c.activo ? '#10b981' : '#444'};">
                  <div class="flex justify-between items-center">
                    <span class="text-white font-950 text-md uppercase tracking-tight">${c.numero_contrato}</span>
                    <span class="badge" style="font-size:0.55rem; background:${c.activo ? '#10b98120' : '#222'}; color:${c.activo ? '#10b981' : '#666'}; border:1px solid ${c.activo ? '#10b98140' : '#333'}; border-radius:30px; padding:2px 8px; font-weight:950; text-transform:uppercase;">${c.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                  </div>
                  <div class="text-aaa font-800 text-[0.62rem] uppercase mt-4 tracking-wide flex flex-wrap gap-x-10 gap-y-2">
                    <span class="flex items-center gap-4 text-blue">${c.tipo === 'leche' ? Icons.leche() : Icons.carne()} ${c.tipo}</span>
                    <span class="flex items-center gap-4">${Icons.calendar()} ${c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : '?'} ${c.fecha_fin ? '→ '+new Date(c.fecha_fin).toLocaleDateString() : ''}</span>
                    ${c.precios?.length ? `<span class="flex items-center gap-4 text-gold">${Icons.dinero()} ${c.precios.length} PRECIOS</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Historial de Ventas Carne -->
          <div class="card p-16 mb-16 border-222 bg-black">
            <div class="text-xs text-gray-500 uppercase font-950 tracking-widest border-bottom-222 pb-8 mb-12 flex items-center gap-8">
                ${Icons.carne()} HISTORIAL CARNE
            </div>
            ${ventasCarne.length === 0 ? '<div class="empty-state border-none mt-0 mb-0"><p class="empty-state-text uppercase font-900 text-xs">Sin ventas registradas.</p></div>' :
              ventasCarne.slice(0, 30).map(v => `
                <div class="history-row border-bottom-222 py-12">
                  <div>
                    <div class="text-gold font-950 uppercase text-[0.7rem] flex items-center gap-6">${Icons.calendar()} ${v.fechaSacrificio ? new Date(v.fechaSacrificio).toLocaleDateString() : '-'}</div>
                    <div class="text-aaa font-800 text-[0.62rem] uppercase mt-2 tracking-wide">${v.pesoCanal || 0} KG CANAL · REND: <strong class="text-white">${v.rendimientoCanal || 0}%</strong></div>
                  </div>
                  <div class="text-right">
                    <div class="text-red font-950 text-md">${(v.precio_total || (v.pesoCanal || 0) * 5.5).toLocaleString()} €</div>
                    <div class="badge badge-sm mt-2 uppercase font-950 text-[0.55rem] border-red-900 bg-red-900-opacity-20">${v.clasificacion?.seurop || 'S/C'}</div>
                  </div>
                </div>
              `).join('')}
            ${ventasCarne.length > 30 ? `<div class="text-center text-gray-700 font-900 text-[0.55rem] uppercase tracking-widest mt-15">Mostrando 30 de ${ventasCarne.length} registros</div>` : ''}
          </div>

          <!-- Historial de Leche -->
          <div class="card p-16 mb-20 border-222 bg-black">
            <div class="text-xs text-gray-500 uppercase font-950 tracking-widest border-bottom-222 pb-8 mb-12 flex items-center gap-8">
                ${Icons.leche()} HISTORIAL LECHE
            </div>
            ${entregasLeche.length === 0 ? '<div class="empty-state border-none mt-0 mb-0"><p class="empty-state-text uppercase font-900 text-xs">Sin entregas registradas.</p></div>' :
              entregasLeche.slice(0, 20).map(e => `
                <div class="history-row border-bottom-222 py-12">
                  <div>
                    <div class="text-gold font-950 uppercase text-[0.7rem] flex items-center gap-6">${Icons.calendar()} ${e.fechaRecogida ? new Date(e.fechaRecogida).toLocaleDateString() : '-'}</div>
                    <div class="text-aaa font-800 text-[0.62rem] uppercase mt-2 tracking-wide">${Icons.transportistas()} CISTERNA: <strong class="text-white">${e.matriculaCisterna || 'S/N'}</strong></div>
                  </div>
                  <div class="text-right">
                    <div class="text-amber font-950 text-md">${(e.cantidad || 0).toLocaleString()} L</div>
                    ${e.precio_final_unitario ? `<div class="text-gray-600 uppercase font-900 text-[0.55rem] tracking-widest mt-2">${(e.precio_final_unitario).toFixed(3)} €/L</div>` : ''}
                  </div>
                </div>
              `).join('')}
            ${entregasLeche.length > 20 ? `<div class="text-center text-gray-700 font-900 text-[0.55rem] uppercase tracking-widest mt-15">Mostrando 20 de ${entregasLeche.length} registros</div>` : ''}
          </div>

          ${comprador.notas ? `
          <div class="card card-accent card-accent-gold p-16 mb-40">
            <div class="text-gold font-950 text-[0.65rem] uppercase tracking-widest mb-10">${Icons.documento()} OBSERVACIONES</div>
            <p class="text-aaa text-xs uppercase font-700 leading-relaxed m-0">${comprador.notas}</p>
          </div>` : '<div class="pb-40"></div>'}
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
          <div class="mb-14">
            <button onclick="location.hash='${esEdicion ? '#/comprador?id='+id : '#/compradores'}'" class="widget-link-btn widget-link-btn--neon neon-danger px-16 py-8 min-h-0 h-auto">
              <span class="text-[0.7rem] font-950 uppercase tracking-widest">${Icons.atras()} Cancelar</span>
            </button>
          </div>
          <div class="card card-accent card-accent-amber p-20 bg-black">
            <div class="section-header-theme mb-20" style="--theme-color: #d97706">${esEdicion ? Icons.editar() : Icons.agregar()} ${esEdicion ? 'EDITAR COMPRADOR' : 'NUEVO COMPRADOR'}</div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label uppercase font-900">Nombre / Razón Social *</label>
                <input type="text" id="c-nombre" value="${c.nombre}" class="wizard-input uppercase font-900" placeholder="EJ: GANADERÍAS DEL SUR S.L.">
            </div>

            <div class="grid grid-cols-2 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">NIF / CIF *</label>
                <input type="text" id="c-nif" value="${c.nif_cif}" class="wizard-input uppercase font-800" placeholder="B12345678">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">Tipo Comprador *</label>
                <select id="c-tipo" class="wizard-input wizard-select font-900 uppercase">
                  <option value="cárnico" ${c.tipo_comprador === 'cárnico' ? 'selected' : ''}>CÁRNICO</option>
                  <option value="láctico" ${c.tipo_comprador === 'láctico' ? 'selected' : ''}>LÁCTICO</option>
                  <option value="híbrido" ${c.tipo_comprador === 'híbrido' || !c.tipo_comprador ? 'selected' : ''}>HÍBRIDO / MIXTO</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">Operador SIGGAN</label>
                <select id="c-tipo-operador" class="wizard-input wizard-select font-800 uppercase">
                  <option value="matadero" ${c.tipo_operador === 'matadero' ? 'selected' : ''}>MATADERO</option>
                  <option value="industria_lactea" ${c.tipo_operador === 'industria_lactea' ? 'selected' : ''}>INDUSTRIA LÁCTEA</option>
                  <option value="operador_comercial" ${!c.tipo_operador || c.tipo_operador === 'operador_comercial' ? 'selected' : ''}>OPERADOR COMERCIAL</option>
                  <option value="tratante" ${c.tipo_operador === 'tratante' ? 'selected' : ''}>TRATANTE</option>
                </select>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">REGA Destino</label>
                <input type="text" id="c-rega" value="${c.rega || ''}" class="wizard-input uppercase font-800 input-rega-std" placeholder="ES000000000000" maxlength="14">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">CCAA</label>
                <select id="c-ccaa" class="wizard-input wizard-select font-800 uppercase">
                  <option value="">— SIN DEFINIR —</option>
                  <option value="andalucia" ${c.comunidad_autonoma === 'andalucia' ? 'selected' : ''}>ANDALUCÍA</option>
                  <option value="extremadura" ${c.comunidad_autonoma === 'extremadura' ? 'selected' : ''}>EXTREMADURA</option>
                </select>
              </div>
            </div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label uppercase font-900">Dirección Postal</label>
                <input type="text" id="c-dir" value="${c.direccion}" class="wizard-input uppercase font-800">
            </div>

            <div class="grid grid-cols-3 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">C.P.</label>
                <input type="text" id="c-cp" value="${c.codigo_postal}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">Ciudad</label>
                <input type="text" id="c-ciudad" value="${c.ciudad}" class="wizard-input uppercase font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">Provincia</label>
                <input type="text" id="c-prov" value="${c.provincia}" class="wizard-input uppercase font-800">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-12 mb-15">
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">Teléfono</label>
                <input type="tel" id="c-tel" value="${c.telefono}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label uppercase font-900">Email</label>
                <input type="email" id="c-email" value="${c.email}" class="wizard-input font-800 lowercase">
              </div>
            </div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label uppercase font-900">Condiciones de Pago</label>
                <input type="text" id="c-pago" value="${c.condiciones_pago}" class="wizard-input uppercase font-800" placeholder="EJ: TRANSFERENCIA 30 DÍAS">
            </div>

            <div class="wizard-input-group mb-15">
                <label class="wizard-label uppercase font-900">Notas / Observaciones</label>
                <textarea id="c-notas" class="wizard-input uppercase font-700" style="min-height:80px; resize:none;">${c.notas}</textarea>
            </div>

            <label class="flex items-center gap-10 text-xs text-white cursor-pointer bg-black border border-222 p-12 rounded-sm mb-25">
              <input type="checkbox" id="c-activo" ${c.activo !== false ? 'checked' : ''} style="accent-color:#d97706;">
              <span class="uppercase font-950 tracking-widest text-[0.65rem]">Comprador activo en el sistema</span>
            </label>

            <div class="grid grid-cols-2 gap-10 mt-20">
                <button onclick="CompradoresView._guardar(${id || ''})" class="widget-link-btn widget-link-btn--neon neon-success">
                  ${Icons.guardar()} <span class="widget-link-label">GUARDAR</span>
                </button>
                <button onclick="location.hash='${esEdicion ? '#/comprador?id='+id : '#/compradores'}'" class="widget-link-btn widget-link-btn--neon neon-danger">
                  ${Icons.cerrar()} <span class="widget-link-label">CANCELAR</span>
                </button>
            </div>
            ${esEdicion ? `<div class="mt-15 text-center"><button onclick="CompradoresView._eliminar(${id})" class="text-red font-900 text-[0.6rem] uppercase tracking-widest p-10 opacity-60 hover:opacity-100 transition-all">${Icons.eliminar()} Eliminar definitivamente</button></div>` : ''}
          </div>
          <div class="pb-40"></div>
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
