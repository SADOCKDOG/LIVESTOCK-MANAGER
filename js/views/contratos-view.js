/**
 * ContratosView - Livestock Manager Premium v4.2.0
 * Vista de contratos de compra: diseño Premium Neón con trazabilidad de precios.
 */

const ContratosView = {
  _filtroActivo: {
    texto: '',
    tipo: '' // activo, inactivo, todos
  },
  async render() {
    if (window.App) App.updateHeaderColor('contratos');
    const main = document.getElementById("app-content");

    // Cargar datos
    const contratos = await Contratos.list().catch(() => []);
    const compradores = await Compradores.list().catch(() => []);
    const compradorMap = {};
    compradores.forEach(c => { compradorMap[c.id] = c; });

    // Contadores para el resumen
    const totalContratos = contratos.length;
    const contratosActivos = contratos.filter(c => c.activo !== false).length;
    const contratosInactivos = contratos.filter(c => c.activo === false).length;

    // Guardar datos brutos para filtrado
    this._cachedDataRaw = { contratos, compradores, compradorMap };

    // Aplicar filtros iniciales
    const filteredContratos = this._filtrar(contratos);

    // Resumen mensual (últimos 6 meses) - basado en fecha de inicio
    const hoy = new Date();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const porMes = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      porMes[key] = { label: meses[d.getMonth()] + ' ' + d.getFullYear(), total: 0 };
    }
    // Contar contratos por mes de inicio
    const rawData = this._cachedDataRaw ? this._cachedDataRaw.contratos : [];
    rawData.forEach(c => {
      if (c.fecha_inicio) {
        const key = c.fecha_inicio.substring(0, 7); // YYYY-MM
        if (porMes[key]) porMes[key].total++;
      }
    });
    const mesesHtml = Object.values(porMes).reverse().map(m => {
      const max = Math.max(1, ...Object.values(porMes).map(m => m.total));
      const pct = Math.max(0, Math.min(100, (m.total / max) * 100));
      const color = pct > 70 ? 'var(--c-danger)' : pct > 40 ? 'var(--c-warning)' : 'var(--c-success)';
      return `<div class="flex-1 text-center min-w-0">
        <div class="text-xs text-gray mb-2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.label}</div>
        <div class="contrato-bar-wrap">
          <div style="position:absolute;bottom:0;width:100%;height:${pct}%;background:${color};border-radius:6px;opacity:0.8;transition:height 0.3s;"></div>
        </div>
        <div class="text-xs font-bold mt-2" style="color:${color};">${m.total}</div>
      </div>`;
    }).join('');

    main.innerHTML = `
      <!-- Plantilla estandarizada: Agregado + Filtros + Lista + FAB -->
      <div class="card-registro mb-14 p-12" style="--registro-color: var(--c-purple); background:rgba(255,68,68,0.03);">
        <div class="flex justify-between items-center mb-6">
          <span class="text-xs text-gray font-bold uppercase">EVOLUCIÓN MENSUAL (últimos 6 meses)</span>
          <span class="text-xs text-gray">${totalContratos} total</span>
        </div>
        <div class="flex gap-6">${mesesHtml}</div>
      </div>

      <!-- Balance Consolidado (Colapsable con App.toggleResumen) -->
      <div class="mb-14">
        <div class="text-left mb-10 flex items-center" style="font-size: 1.25rem; font-weight: 900; color: #fff; letter-spacing: 0.5px;">
          <span style="color: var(--c-purple); font-size: 1.4rem; margin-right: 10px; font-weight: 900;">|</span> RESUMEN DE CONTRATOS
        </div>
        <div id="resumen-contratos" class="space-y-6 text-white">
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.contratos()} Total Contratos</span>
            <strong class="text-xl font-950" style="color: var(--c-purple);">${totalContratos} ${totalContratos === 1 ? "contrato" : "contratos"}</strong>
          </div>
          <div class="py-8 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.check()} Contratos Activos</span>
            <strong class="text-xl font-950 text-green">${contratosActivos} ${contratosActivos === 1 ? "contrato" : "contratos"}</strong>
          </div>
          <div class="py-8 flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900 flex items-center gap-4">${Icons.dinero()} Valor Total Contratos</span>
            <strong class="text-xl font-950 text-blue">$${this._calcularValorTotalContratos(contratos).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <!-- Filtro de búsqueda integrado (controla el listado) -->
      <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-5">
        ${Icons.contratos()} Lista de Contratos
      </div>
      <div class="flex gap-8 items-center mb-12">
        <div class="relative flex-1 min-w-0">
          <input type="search" id="search-contratos" placeholder="Buscar por número, comprador o condiciones..."
                 oninput="ContratosView._setFiltro('texto', this.value)"
                 class="search-input w-full">
        </div>
        <select id="contratos-filtro-estado" class="form-select-purple"
                onchange="ContratosView._setFiltro('tipo', this.value)"
                style="width:100px; min-width:90px; flex-shrink:0;">
          <option value="todos" ${this._filtroActivo.tipo === 'todos' ? 'selected' : ''}>Todos</option>
          <option value="activo" ${this._filtroActivo.tipo === 'activo' ? 'selected' : ''}>Activo</option>
          <option value="inactivo" ${this._filtroActivo.tipo === 'inactivo' ? 'selected' : ''}>Inactivo</option>
        </select>
      </div>
      <div id="contratos-content"><div class="loader">Cargando contratos...</div></div>`;

    // Actualizar datos filtrados para el contenido
    this._cachedData = { contratos: filteredContratos, compradores, compradorMap };
    this._renderLista();
  },

  _setFiltro(type, value) {
    this._filtroActivo[type] = value;
    this._aplicarFiltros();
  },

  _aplicarFiltros() {
    if (!this._cachedDataRaw) return;
    const { contratos } = this._cachedDataRaw;
    const filtrados = this._filtrar(contratos);
    this._cachedData = {
      ...this._cachedDataRaw,
      contratos: filtrados
    };
    this._renderLista();
  },

  _filtrar(contratos) {
    if (!contratos) return [];
    let filtrados = contratos;

    // Filtro por tipo (activo/inactivo/todos)
    if (this._filtroActivo.tipo === 'activo') {
      filtrados = filtrados.filter(c => c.activo !== false);
    } else if (this._filtroActivo.tipo === 'inactivo') {
      filtrados = filtrados.filter(c => c.activo === false);
    }
    // Si es 'todos', no aplicar filtro de tipo

    // Filtro por texto de búsqueda
    if (this._filtroActivo.texto.trim()) {
      const q = this._filtroActivo.texto.toLowerCase();
      filtrados = filtrados.filter(c =>
        (c.numero_contrato || '').toLowerCase().includes(q) ||
        (c.contratoId ? (this._cachedDataRaw.compradorMap[c.contratoId]?.nombre || '').toLowerCase().includes(q) : false) ||
        (c.condiciones || '').toLowerCase().includes(q)
      );
    }

    return filtrados;
  },

  _calcularValorTotalContratos(contratos) {
    // Esta es una simplificación - en un caso real, habría que calcular basado en precios y cantidades
    return contratos.reduce((sum, c) => sum + (c.valorTotal || 0), 0);
  },

  async _renderLista() {
    const container = document.getElementById('contratos-content');
    if (!container) return;

    const { contratos, compradorMap } = this._cachedData || { contratos: [], compradorMap: {} };

    if (contratos.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${Icons.contratos()}</div><p class="empty-state-text"> ${this._cachedDataRaw ? this._cachedDataRaw.contratos.length === 0 ? 'No hay contratos registrados.' : 'No hay contratos con ese filtro.' : 'Cargando...'}</p></div>`;
      return;
    }

    container.innerHTML = contratos.map(c => {
      const comprador = compradorMap[c.compradorId];
      const color = c.tipo === 'leche' ? 'var(--c-info)' : (c.tipo === 'carne' ? 'var(--c-danger)' : 'var(--c-success)');

      return `
      <div class="card-registro" onclick="location.hash='#/contrato?id=${c.id}'"
           style="--registro-color: ${color};">
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-6 mb-4">
              <span class="text-lg font-black text-gold uppercase tracking-tight">${c.numero_contrato}</span>
              <span class="text-gray-400" style="font-size:0.7rem;">${c.tipo === 'leche' ? Icons.leche() : Icons.carne()}</span>
            </div>
            <div class="flex flex-wrap gap-x-8 gap-y-1 text-[0.6rem] text-gray font-700 uppercase mt-2 leading-tight">
              <span>${comprador ? `${comprador.nombre} (${comprador.tipo_comprador || '-'})` : 'SIN COMPRADOR'}</span>
              ${c.fecha_inicio ? `<span>${c.fecha_inicio}</span>` : ''}
              ${c.fecha_fin ? `<span>${c.fecha_fin}</span>` : '<span style="color:#6b7280;">(INDEFINIDO)</span>'}
            </div>
          </div>
          <div class="text-right">
            <span style="font-size: 1.1rem; font-weight: 800; border: 1px solid var(--c-${c.activo !== false ? 'success' : 'danger'}); color: var(--c-${c.activo !== false ? 'success' : 'danger'}); background: ${c.activo !== false ? 'rgba(204,255,0,0.1)' : 'rgba(255,68,68,0.1)'}; padding: 6px 12px; border-radius: 8px; display: inline-block;">
              ${c.activo !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        <div class="flex justify-between items-end w-full">
          <div class="flex-1 min-w-0">
            <!-- Espacio para información adicional si es necesario -->
          </div>
          <div class="text-right">
            <span style="display: inline-block; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--c-warning); color: var(--c-warning); background: rgba(255, 215, 0, 0.1); padding: 2px 6px; border-radius: 4px;">Ficha -></span>
          </div>
        </div>
      </div>`;
    }).join('');

    // Botón Flotante de Acción con viñeta (se agrega después de la lista)
    const fabContainer = document.createElement('div');
    fabContainer.className = 'fab-container';
    fabContainer.innerHTML = `
      <span class="fab-label">Nuevo Contrato</span>
      <button class="fab-btn">${Icons.fabPlus()}</button>
    `;
    fabContainer.onclick = () => {
      location.hash = '/contrato';  // Nuevo contrato sin comprador preseleccionado
    };
    container.appendChild(fabContainer);
  },

  // ============================================
  // FORMULARIO DE CONTRATO (nuevo / editar)
  // ============================================

  async renderDetalle(params) {
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
        <button onclick="location.hash='#/contratos'" class="widget-link-btn widget-link-btn--neon neon-danger px-16 py-8 min-h-0 h-auto">
          <span class="text-[0.7rem] font-950 uppercase tracking-widest">${Icons.atras()} Volver a Contratos</span>
        </button>
      </div>
      <div class="card-registro card-accent card-accent-purple p-20 bg-black" style="--registro-color: var(--c-purple);">
        <div class="section-header-theme mb-20" style="--theme-color: var(--c-purple)">${esEdicion ? Icons.editar() : Icons.agregar()} ${esEdicion ? 'EDITAR CONTRATO' : 'NUEVO CONTRATO'}</div>

        <div class="wizard-input-group mb-15">
          <label class="wizard-label uppercase font-900">COMPRADOR / CLIENTE *</label>
          <select id="ct-comprador" class="wizard-input wizard-select font-900 uppercase">
            <option value="">— SELECCIONAR COMPRADOR —</option>
            ${compradores.map(c =>
              `<option value="${c.id}" ${Number(contrato.compradorId) === c.id ? 'selected' : ''}>${c.nombre.toUpperCase()}${c.tipo_comprador ? ' (' + ((c.tipo_comprador === 'láctico' ? 'lácteo' : c.tipo_comprador)).toUpperCase() + ')' : ''}</option>`
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
          <div id="ct-precios-container" class="gap-10">
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
              ${Icons.guardar()} <span class="widget-label">GUARDAR</span>
            </button>
            <button onclick="location.hash='#/contratos'" class="widget-link-btn widget-link-btn--neon neon-danger">
              ${Icons.cerrar()} <span class="widget-label">CANCELAR</span>
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

      location.hash = '#/contratos';
    } catch (e) {
      App.toastError(e.message);
    }
  },

  async _eliminarContrato(id) {
    if (!await Confirm.confirm("Eliminar Contrato", "¿Deseas eliminar este contrato permanentemente? Esta acción es irreversible.")) return;
    try {
      await Contratos.delete(id);
      App.toast("Contrato eliminado");
      location.hash = '#/contratos';
    } catch (e) {
      App.toastError("Error: " + e.message);
    }
  }
};

window.ContratosView = ContratosView;