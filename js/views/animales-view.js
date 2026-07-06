/**
 * Livestock Manager - AnimalesView v1.0.0
 * Vista de Animales extraída de App.js para modularización.
 * Copia espejo de js/views/animales-view.js
 */

const AnimalesView = {
  _filtroActivo: { especie: '', sexo: '', estado: '' },

  async render() {
    if (window.App) App.updateHeaderColor('animales');
    const main = document.getElementById("app-content");
    const animales = await Animales.list();
    const rebanos = await Rebanos.list();
    if (rebanos.length === 0)
      return (main.innerHTML = `<div class="card-registro empty-state" style="--registro-color: var(--c-white);"><p class="empty-state-text">Crea un rebaño primero.</p></div>`);

    const rebanoMap = {};
    rebanos.forEach(r => { rebanoMap[r.id] = r; });

    const activos = animales.filter(a => a.estado === 'activo').length;
    const especies = [...new Set(animales.map(a => a.especie).filter(Boolean))];

    let html = '';

    if (animales.length === 0) {
      html += `<div class="card-registro empty-state" style="--registro-color: var(--c-orange);">
        <div class="empty-state-icon" style="color:var(--c-orange);">${Icons.animales()}</div>
        <p class="empty-state-text">Aún no hay animales registrados.</p>
        <div class="text-center mt-20">
            <button class="btn btn-create btn-lg" onclick="location.hash='/animal'">
              ${Icons.agregar()} Registrar primer animal
            </button>
        </div>
      </div>`;
      main.innerHTML = html;
      return;
    }

    const filtrados = this._aplicarFiltros(animales, rebanoMap);
    const vendidos = animales.filter(a => a.estado === 'vendido').length;
    // Card AGLUTINADORA: cabecera + resumen de datos + histórico de fichas
    html += `<div class="mb-10">
      <div class="flex items-center gap-12 mb-12">
        <span class="text-3xl" style="color:var(--c-orange);">${Icons.animales()}</span>
        <div>
          <div class="text-white font-900 text-lg">Censo de Animales</div>
          <div class="text-gray" style="font-size:0.68rem;">${animales.length} ${animales.length === 1 ? 'registro' : 'registros'} · ${activos} activos</div>
        </div>
      </div>
      <!-- Resumen de datos registrados (colapsable) -->
      <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
        <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
          <span class="flex items-center gap-6">${Icons.animales()} Resumen del Censo</span>
          <button class="resumen-toggle" onclick="App.toggleResumen(this)" aria-label="Ocultar resumen">${Icons.chevronAbajo()}</button>
        </div>
        <div class="resumen-body flex flex-col">
          ${especies.map(esp => `
            <div class="py-12 flex justify-between items-center border-bottom-222">
              <span class="text-xs text-gray uppercase font-900">${esp}</span>
              <strong class="text-xl font-950" style="color: var(--c-info);">${animales.filter(a => a.especie === esp).length}</strong>
            </div>`).join('')}
          <div class="py-12 flex justify-between items-center border-bottom-222">
            <span class="text-xs text-gray uppercase font-900">Activos</span>
            <strong class="text-xl font-950" style="color: var(--c-success);">${activos}</strong>
          </div>
          <div class="py-12 flex justify-between items-center">
            <span class="text-xs text-gray uppercase font-900">Vendidos</span>
            <strong class="text-xl font-950" style="color: var(--c-danger);">${vendidos}</strong>
          </div>
        </div>
      </div>
      <!-- Filtro de búsqueda integrado (controla el histórico) -->
      <div class="text-xs text-gray uppercase font-extrabold tracking-wider border-bottom-222 mb-10 pb-5">${Icons.documento()} Lista de Animales</div>
      <div class="flex gap-8 items-center mb-12">
        <div class="relative flex-1 min-w-0">
          <input type="search" id="search-animales" placeholder="Buscar por crotal, raza o rebaño..."
                 oninput="AnimalesView._filtrar(this.value)"
                 class="search-input w-full">
        </div>
        <select id="animales-filtro-especie" class="form-select-gold"
                onchange="AnimalesView._setFiltro('especie', this.value)"
                style="width:120px; min-width:110px; flex-shrink:0;">
          <option value="" ${this._filtroActivo.especie === '' ? 'selected' : ''}>Todas</option>
          <option value="Vacas" ${this._filtroActivo.especie === 'Vacas' ? 'selected' : ''}>Vacas</option>
          <option value="Ovejas" ${this._filtroActivo.especie === 'Ovejas' ? 'selected' : ''}>Ovejas</option>
          <option value="Cabras" ${this._filtroActivo.especie === 'Cabras' ? 'selected' : ''}>Cabras</option>
          <option value="Cerdos" ${this._filtroActivo.especie === 'Cerdos' ? 'selected' : ''}>Cerdos</option>
        </select>
      </div>
      <div id="animales-lista" class="grid gap-12">`;
    filtrados.forEach(a => html += this._renderCard(a, rebanoMap[a.rebanoId]));
    html += `</div></div>
      <!-- Botón Flotante de Acción con viñeta -->
      <div class="fab-container" onclick="location.hash='/animal'">
        <span class="fab-label">Nuevo Animal</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>
      <div class="card-registro mt-10" style="--registro-color: var(--c-white);">
        <div id="animales-empty-search" class="empty-state-search d-none">
          <div class="text-2xl mb-8" style="color:#555;">${Icons.buscar()}</div>
          <p class="text-gray-500 uppercase font-900 text-xs">No se encontraron animales con ese criterio.</p>
        </div>
      </div>
`;

    main.innerHTML = html;
    AnimalesView._cache = { animales, rebanoMap };
  },

  _aplicarFiltros(animales, rebanoMap) {
    let r = animales;
    if (this._filtroActivo.especie) r = r.filter(a => a.especie === this._filtroActivo.especie);
    if (this._filtroActivo.sexo) r = r.filter(a => a.sexo === this._filtroActivo.sexo);
    if (this._filtroActivo.estado) r = r.filter(a => a.estado === this._filtroActivo.estado);
    return r;
  },

  _setFiltro(tipo, valor) {
    this._filtroActivo[tipo] = valor;
    if (tipo === 'especie') {
      const select = document.getElementById('animales-filtro-especie');
      if (select) select.value = valor || '';
    }
    const texto = document.getElementById('search-animales')?.value || '';
    this._filtrar(texto);
  },

  _renderCard(a, r) {
    const edad = a.fecha_nacimiento ? Math.floor((new Date() - new Date(a.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    const iconoSexo = a.sexo === 'H' ? Icons.hembra() : (a.sexo === 'M' ? Icons.macho() : Icons.reproduccion());
    const colorEstado = a.estado === 'activo' ? 'var(--c-success)' : a.estado === 'vendido' ? 'var(--c-warning)' : a.estado === 'baja' ? 'var(--c-danger)' : '#888';
    const colorEspecie = window.ModoContextoHelper ? window.ModoContextoHelper.getEspecieColor(a.especie) : colorEstado;
    
    let colorClass = App._getColorClass(colorEspecie).replace('text-', 'color-');
    if(colorClass === 'color-gray') colorClass = 'color-gray'; // generic

    return App._cardRegistro(App._getAnimalCardProps(a, r));
  },

  _filtrar(texto) {
    texto = texto.trim().toLowerCase();
    const cache = AnimalesView._cache;
    if (!cache) return;
    const contenedor = document.getElementById("animales-lista");
    const emptyMsg = document.getElementById("animales-empty-search");
    if (!contenedor) return;

    let base = this._aplicarFiltros(cache.animales, cache.rebanoMap);

    if (!texto) {
      contenedor.style.display = 'grid';
      if (emptyMsg) emptyMsg.style.display = 'none';
      contenedor.innerHTML = base.map(a => {
        const r = cache.rebanoMap[a.rebanoId];
        return AnimalesView._renderCard(a, r);
      }).join('');
      return;
    }

    const filtrados = base.filter(a => {
      const rebano = cache.rebanoMap[a.rebanoId];
      const nombreReb = rebano ? rebano.nombre.toLowerCase() : '';
      return (a.numero_identificacion || '').toLowerCase().includes(texto) ||
             (a.raza || '').toLowerCase().includes(texto) ||
             nombreReb.includes(texto);
    });

    if (filtrados.length === 0) {
      contenedor.style.display = 'none';
      if (emptyMsg) emptyMsg.style.display = 'block';
    } else {
      contenedor.style.display = 'grid';
      if (emptyMsg) emptyMsg.style.display = 'none';
      contenedor.innerHTML = filtrados.map(a => {
        const r = cache.rebanoMap[a.rebanoId];
        return AnimalesView._renderCard(a, r);
      }).join('');
    }
  },

  async renderDetalle(params) {
    const id = params.get ? params.get("id") : null;
    const esNuevo = !id;
    AnimalesView._animalGuardado = false;

    let a = {
      numero_identificacion: "",
      especie: "Ovejas",
      sexo: "H",
      raza: "",
      rebanoId: null,
      tipoAlta: "Nacimiento",
      fecha_nacimiento: new Date().toISOString().split("T")[0],
      notas: "",
      rfid_codigo: "",
      fecha_identificacion: "",
      tipo_identificacion: "Completa (EID + Visual)"
    };
    if (!esNuevo) a = await Animales.get(id);

    const [especies, rebanos, todosAnimales] = await Promise.all([
      window.db.getAll("config_especies"),
      Rebanos.list(),
      Animales.list().catch(() => []),
    ]);

    const idActual = esNuevo ? null : Number(id);
    const hembras = (todosAnimales || []).filter(
      (x) => x.sexo === "H" && (x.estado || "activo") !== "baja" && x.id !== idActual
    );

    const CS = window.ComunidadesService;
    const paisesNac = CS ? CS.getPaisesNacimiento() : [{ value: 'ES', label: 'España (ES)' }];
    const motivosBaja = CS ? CS.getMotivosBaja() : [];
    const tiposAlta = CS && CS.getTiposAlta ? CS.getTiposAlta() : [{ value: 'Nacimiento', label: 'Nacimiento' }, { value: 'Compra', label: 'Compra' }];
    const categoriasAnimal = CS && CS.getCategoriasAnimal ? CS.getCategoriasAnimal(a.especie) : [];
    const mostrarDIB = CS ? CS.especieRequiereDIB(a.especie) : false;
    const esCompra = a.tipoAlta === "Compra";
    const esBaja = a.estado === "baja" || a.estado === "Baja";
    const esSalida = esBaja || a.estado === "vendido";

    document.getElementById("app-content").innerHTML = `
      <div class="wizard-full-screen">
        <div class="wizard-header-fixed flex justify-between items-center border-top-5-gold">
          <h1 class="wizard-header-title uppercase font-950 tracking-widest text-lg">${Icons.animales()} FICHA ANIMAL</h1>
          <div class="flex gap-10">
            <button onclick="App._leerChipNFC('a-rfid', 'a-crotal')" class="widget-link-btn widget-link-btn--neon neon-accent px-12 py-6 min-h-0 h-auto">
              <span class="text-[0.65rem] font-900 uppercase">NFC</span>
            </button>
            <button onclick="App._escanearCrotal('a-crotal')" class="widget-link-btn widget-link-btn--neon neon-info px-12 py-6 min-h-0 h-auto">
              <span class="text-[0.65rem] font-900 uppercase">SCAN</span>
            </button>
          </div>
        </div>
        <div class="wizard-content-scrollable p-20">
          <div class="text-center mb-16">
            <label class="text-[0.65rem] text-gray uppercase font-900 tracking-widest mb-8 block">Nº CROTAL IDENTIFICACIÓN</label>
            <input type="text" id="a-crotal"
                   value="${a.numero_identificacion}"
                   placeholder="ES000000000000" maxlength="14"
                   oninput="AnimalesView._validarCrotalUI(this)"
                   class="wizard-crotal-input font-950 text-gold text-center tracking-tighter" style="font-size: 2.2rem; border-bottom: 2px solid var(--c-orange) !important;">
            <div class="text-aaa text-[0.6rem] uppercase font-800 mt-6 tracking-wide">
              REQUISITO REGA: ES + 12 DÍGITOS · <span class="text-gold" id="crotal-length-counter">0/14</span>
            </div>
          </div>

          <div class="card-registro card-accent card-accent-amber p-16 mb-20" style="--registro-color: var(--c-amber);">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-orange)">${Icons.info()} DATOS GENERALES</div>
            <div class="grid grid-cols-2 gap-12 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">ESPECIE</label>
                <select id="a-especie" class="wizard-input" onchange="AnimalesView._onEspecieChange(this)">
                  ${especies.map((e) => `<option value="${e.nombre}" ${a.especie === e.nombre ? "selected" : ""}>${e.nombre.toUpperCase()}</option>`).join("")}
                </select>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">SEXO</label>
                <select id="a-sexo" class="wizard-input">
                  <option value="H" ${a.sexo === "H" ? "selected" : ""}>HEMBRA (H)</option>
                  <option value="M" ${a.sexo === "M" ? "selected" : ""}>MACHO (M)</option>
                  <option value="C" ${a.sexo === "C" ? "selected" : ""}>CASTRADO (C)</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-12 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">RAZA</label>
                <input type="text" id="a-raza" value="${a.raza || ""}" class="wizard-input uppercase font-800" placeholder="SIN RAZA">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">REBAÑO / LOTE</label>
                <select id="a-rebano" class="wizard-input font-800">
                  <option value="">SIN ASIGNAR</option>
                  ${rebanos.map((r) => `<option value="${r.id}" ${a.rebanoId == r.id ? "selected" : ""}>${r.nombre.toUpperCase()}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-12">
              <div class="wizard-input-group">
                <label class="wizard-label">NACIMIENTO</label>
                <input type="date" id="a-fecha" value="${a.fecha_nacimiento || ""}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">TIPO DE ALTA</label>
                <select id="a-tipoalta" class="wizard-input font-800" onchange="AnimalesView._onTipoAltaChange(this)">
                  ${tiposAlta.map((t) => `<option value="${t.value}" ${a.tipoAlta === t.value ? "selected" : ""}>${t.label.toUpperCase()}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>

          <div class="card-registro card-accent card-accent-blue p-16 mb-20" style="--registro-color: var(--c-info);">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-info)">${Icons.documento()} IDENTIFICACIÓN TÉCNICA</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">CATEGORÍA (LIBRO DE REGISTRO)</label>
              <select id="a-categoria" class="wizard-input font-800">
                <option value="">— SIN CLASIFICAR —</option>
                ${categoriasAnimal.map((c) => `<option value="${c}" ${a.categoria === c ? "selected" : ""}>${c.toUpperCase()}</option>`).join("")}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-12 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">CHIP (RFID/NFC)</label>
                <input type="text" id="a-rfid" value="${a.rfid_codigo || ""}" placeholder="OPCIONAL" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA IDENTIFICACIÓN</label>
                <input type="date" id="a-fecha-ident" value="${a.fecha_identificacion || ""}" class="wizard-input font-800">
              </div>
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">TIPO DE IDENTIFICACIÓN</label>
              <select id="a-tipo-ident" class="wizard-input font-800">
                <option value="Completa (EID + Visual)" ${a.tipo_identificacion === "Completa (EID + Visual)" ? "selected" : ""}>COMPLETA (EID + VISUAL)</option>
                <option value="Matadero (Visual REGA)" ${a.tipo_identificacion === "Matadero (Visual REGA)" ? "selected" : ""}>MATADERO (VISUAL REGA)</option>
              </select>
            </div>
            <label class="flex items-center gap-10 text-sm text-white cursor-pointer bg-black border border-222 p-12 rounded-sm">
              <input type="checkbox" id="a-notificado" ${a.notificado_rega ? 'checked' : ''} style="accent-color:var(--c-info);">
              <span class="uppercase font-900 text-[0.65rem] tracking-tight">ALTA COMUNICADA OFICIALMENTE A PIGGAN/SIA</span>
            </label>
          </div>

          <!-- LIBRO DE REGISTRO SIGGAN -->
          <div class="card-registro card-accent card-accent-green p-16 mb-20" style="--registro-color: var(--c-success);">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-success)">${Icons.libroVentas()} LIBRO DE REGISTRO (SIGGAN)</div>
            <div class="grid grid-cols-2 gap-12 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">PAÍS DE NACIMIENTO</label>
                <select id="a-pais-nac" class="wizard-input font-800">
                  ${paisesNac.map((p) => `<option value="${p.value}" ${(a.pais_nacimiento || 'ES') === p.value ? "selected" : ""}>${p.label.toUpperCase()}</option>`).join("")}
                </select>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA ALTA EXPLOTACIÓN</label>
                <input type="date" id="a-fecha-alta" value="${a.fecha_alta || ""}" class="wizard-input font-800">
              </div>
            </div>
            <div id="a-procedencia-section" class="wizard-input-group mb-12" style="display:${esCompra ? 'block' : 'none'};">
              <label class="wizard-label">REGA DE PROCEDENCIA (ORIGEN)</label>
              <input type="text" id="a-rega-origen" value="${a.rega_origen || ""}" placeholder="ES041230000123" class="wizard-input font-800 input-rega-std" maxlength="14">
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">MADRE (GENEALOGÍA)</label>
              <select id="a-madre" class="wizard-input font-800">
                <option value="">SIN ASIGNAR</option>
                ${hembras.map((h) => `<option value="${h.id}" ${a.madre_id == h.id ? "selected" : ""}>${(h.numero_identificacion || ('#' + h.id)).toUpperCase()}${h.especie ? ' · ' + h.especie.toUpperCase() : ''}</option>`).join("")}
              </select>
            </div>
            <div id="a-dib-section" class="wizard-input-group mb-12" style="display:${mostrarDIB ? 'block' : 'none'};">
              <label class="wizard-label">DIB / Nº PASAPORTE</label>
              <input type="text" id="a-dib" value="${a.dib || ""}" placeholder="DOC. IDENTIFICACIÓN BOVINA" class="wizard-input font-800">
            </div>
            <div class="grid grid-cols-2 gap-12 items-start">
              <div class="wizard-input-group">
                <label class="wizard-label">ESTADO ACTUAL</label>
                <select id="a-estado" class="wizard-input font-900" onchange="AnimalesView._onEstadoChange(this)">
                  <option value="activo" ${(a.estado || 'activo') === 'activo' ? "selected" : ""}>ACTIVO</option>
                  <option value="vendido" ${a.estado === 'vendido' ? "selected" : ""}>VENDIDO</option>
                  <option value="baja" ${esBaja ? "selected" : ""}>BAJA (MUERTE)</option>
                </select>
              </div>
              <div id="a-motivo-baja-wrap" class="wizard-input-group" style="display:${esBaja ? 'block' : 'none'};">
                <label class="wizard-label">MOTIVO DE BAJA</label>
                <select id="a-motivo-baja" class="wizard-input font-800">
                  <option value="">— SELECCIONA —</option>
                  ${motivosBaja.map((m) => `<option value="${m.value}" ${a.motivo_baja === m.value ? "selected" : ""}>${m.label.toUpperCase()}</option>`).join("")}
                </select>
                <div id="a-sandach-wrap" class="mt-8 p-10 border border-info rounded-sm bg-black d-none">
                  <div class="text-info font-900 text-[0.55rem] mb-2 uppercase tracking-widest">CLASIFICACIÓN SANDACH</div>
                  <div id="a-sandach-categoria" class="text-aaa text-[0.65rem] font-800 uppercase leading-tight"></div>
                </div>
              </div>
            </div>
            <div id="a-fecha-baja-wrap" class="wizard-input-group mt-12" style="display:${esSalida ? 'block' : 'none'};">
              <label class="wizard-label">FECHA DE SALIDA / BAJA</label>
              <input type="date" id="a-fecha-baja" value="${a.fecha_baja || ""}" class="wizard-input font-800">
            </div>
          </div>

          <div class="card-registro card-accent card-accent-gold p-16 mb-20" style="--registro-color: var(--c-gold);">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-orange)">${Icons.documento()} OBSERVACIONES</div>
            <textarea id="a-notas" placeholder="NOTAS ADICIONALES..." class="wizard-input min-h-80 uppercase font-700" style="resize:none; font-size:0.8rem;">${a.notas || ""}</textarea>
          </div>

          ${!esNuevo ? `
            <div class="card-registro card-accent card-accent-amber p-16 mb-20" style="--registro-color: var(--c-amber);">
               <div class="section-header-theme mb-12" style="--theme-color: var(--c-orange)">COMPAÑEROS LOTE</div>
               <div id="tabla-referencia" class="text-aaa text-xs uppercase font-800">Cargando...</div>
            </div>
            <div class="card-registro card-accent card-accent-purple p-16 mb-20" style="--registro-color: var(--c-purple);">
               <div class="section-header-theme mb-12" style="--theme-color: var(--c-purple)">HISTORIAL REPRO</div>
               <div id="tabla-reproduccion" class="text-aaa text-xs uppercase font-800">Cargando...</div>
            </div>
            <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mb-20">
              <button id="btn-reproduccion" onclick="App._abrirWizardReproduccion('${id}')" class="widget-link-btn widget-link-btn--neon neon-accent">
                ${Icons.reproduccion()}
                <span class="widget-link-label">Gestión Repro.</span>
              </button>
            </div>` : ""}
        </div>

        <div class="wizard-footer-fixed grid grid-cols-3 gap-8">
          ${!esNuevo ? `
          <button type="button" onclick="location.hash='/trazabilidad?id=${id}'" class="widget-link-btn widget-link-btn--neon neon-info px-4">
            ${Icons.rotacion()}
            <span class="widget-link-label">360°</span>
          </button>` : '<div></div>'}
          <button type="button" onclick="AnimalesView._salirRegistro()" class="widget-link-btn widget-link-btn--neon neon-danger px-4">
            ${Icons.cerrar()}
            <span class="widget-link-label">SALIR</span>
          </button>
          <button type="button" id="btn-guardar-main" onclick="AnimalesView._guardarAnimalDetalle('${id || ""}')" class="widget-link-btn widget-link-btn--neon neon-success px-4">
            ${Icons.guardar()}
            <span class="widget-link-label">GUARDAR</span>
          </button>
        </div>
      </div>`;

    if (!esNuevo && window.Reproduccion) {
      App._cargarHistorialReproduccion(id);
    }
    if (!esNuevo && a.rebanoId) {
      App._cargarReferenciaRebano(a.rebanoId, id);
    } else if (!esNuevo) {
      const ref = document.getElementById("tabla-referencia");
      if (ref) ref.innerHTML = '<em class="text-333">Sin rebaño asignado</em>';
    }

    // Gap 7: Listener para actualizar categoría SANDACH al cambiar motivo_baja
    const motivoBajaSelect = document.getElementById("a-motivo-baja");
    if (motivoBajaSelect && window.ComunidadesService) {
      const actualizarSANDACH = () => {
        const motivo = motivoBajaSelect.value;
        const sandachWrap = document.getElementById("a-sandach-wrap");
        const sandachCatDiv = document.getElementById("a-sandach-categoria");
        
        if (motivo) {
          const categoria = ComunidadesService.getSANDACHCategoria(motivo);
          const descripcion = ComunidadesService.getSANDACHDescripcion(categoria);
          
          if (categoria) {
            sandachWrap.style.display = 'block';
            sandachCatDiv.innerHTML = `<strong>Categoría ${categoria}:</strong> ${descripcion || 'Subproductos ganaderos'}`;
          } else {
            sandachWrap.style.display = 'none';
          }
        } else {
          sandachWrap.style.display = 'none';
        }
      };
      
      // Ejecutar al cargar
      actualizarSANDACH();
      
      // Listener para cambios futuros
      motivoBajaSelect.addEventListener('change', actualizarSANDACH);
    }

    // Gap 11: Listener para notificado_rega
    const notificadoCheckbox = document.getElementById("a-notificado");
    if (notificadoCheckbox && window.NotificacionesREGA) {
      notificadoCheckbox.addEventListener('change', async (evt) => {
        if (!evt.target.checked) return; // Solo procesar cuando se marca

        // Validar datos mínimos antes de notificar
        const crotal = document.getElementById("a-crotal")?.value?.trim().toUpperCase();
        const finca = await window.Fincas?.getActive().catch(() => null);

        const validacion = window.NotificacionesREGA.validarNotificacionPosible(
          { numero_identificacion: crotal, estado: document.getElementById("a-estado")?.value },
          finca
        );

        if (!validacion.valido) {
          evt.target.checked = false;
          return App.toastError(`Notificación REGA: ${validacion.mensaje}`);
        }

        try {
          const notificacionRes = await window.NotificacionesREGA.registrar({
            animal_id: id || 'nuevo',
            finca_id: finca?.id,
            animal_numero: crotal,
            finca_rega: finca?.rega || finca?.codigo_REGA,
            tipo_evento: 'cambio_estado'
          });

          // Simular envío a REGA usando el ID devuelto en el objeto de respuesta
          const resultado = await window.NotificacionesREGA.enviarAREGA({
            id: notificacionRes.id,
            animal_numero: crotal,
            finca_rega: finca?.rega,
            tipo_evento: 'cambio_estado'
          });

          if (resultado.exito) {
            App.toast(`${resultado.mensaje}`, 'success');
          } else {
            App.toast(`${resultado.mensaje}`, 'warning');
          }
        } catch (err) {
          App.toastError(`Error notificando REGA: ${err.message}`);
          evt.target.checked = false;
        }
      });
    }
  },
  async _guardarAnimalDetalle(id) {
    try {
      const crotal = document
        .getElementById("a-crotal")
        .value.trim()
        .toUpperCase();
      if (!crotal || crotal.length < 4)
        return App.toastError("Crotal inválido (mín. 4 car.)");

      const existing = id ? (await Animales.get(Number(id))) || {} : {};

      const rebanoVal = document.getElementById("a-rebano").value;
      const rebanoIdFinal = rebanoVal ? parseInt(rebanoVal) : existing.rebanoId || null;

      if (rebanoIdFinal && rebanoIdFinal !== existing.rebanoId) {
        const rebanoObj = await Rebanos.get(rebanoIdFinal);
        if (rebanoObj && rebanoObj.zonaActual) {
          try {
            await window.Trazabilidad.validarAforoZona(window.db, rebanoObj.zonaActual, 1);
          } catch (err) {
            return App.toastError(err.message);
          }
        }
      }

      const data = {
        ...existing,
        id: id ? Number(id) : undefined,
        numero_identificacion: crotal,
        especie: document.getElementById("a-especie").value,
        sexo: document.getElementById("a-sexo").value,
        raza: document.getElementById("a-raza").value.trim(),
        rebanoId: rebanoIdFinal,
        tipoAlta: document.getElementById("a-tipoalta").value,
        categoria: document.getElementById("a-categoria")?.value || "",
        fecha_nacimiento: document.getElementById("a-fecha").value,
        notas: document.getElementById("a-notas").value.trim(),
        rfid_codigo: document.getElementById("a-rfid").value.trim(),
        fecha_identificacion: document.getElementById("a-fecha-ident").value,
        tipo_identificacion: document.getElementById("a-tipo-ident").value,
        notificado_rega: document.getElementById("a-notificado").checked,
        // Libro de registro SIGGAN
        pais_nacimiento: document.getElementById("a-pais-nac")?.value || "ES",
        madre_id: document.getElementById("a-madre")?.value ? Number(document.getElementById("a-madre").value) : null,
        fecha_alta: document.getElementById("a-fecha-alta")?.value || "",
        rega_origen: (document.getElementById("a-rega-origen")?.value || "").trim().toUpperCase(),
        dib: (document.getElementById("a-dib")?.value || "").trim().toUpperCase(),
        estado: document.getElementById("a-estado")?.value || existing.estado || "activo",
        motivo_baja: document.getElementById("a-motivo-baja")?.value || "",
        fecha_baja: document.getElementById("a-fecha-baja")?.value || "",
        actualizadoEn: new Date().toISOString(),
      };

      // Validación SIGGAN: REGA de procedencia (si se indica)
      if (data.tipoAlta === "Compra" && data.rega_origen && window.ComunidadesService) {
        const finca = await Fincas.getActive().catch(() => null);
        const ccaa = finca ? finca.comunidad_autonoma : null;
        const res = window.ComunidadesService.validarFormatoREGA(data.rega_origen, ccaa);
        if (!res.valido) return App.toastError("REGA de procedencia: " + res.mensaje);
      }
      // Coherencia de baja
      if (data.estado === "baja" && !data.motivo_baja) {
        return App.toastError("Indica el motivo de baja para el libro de registro.");
      }
      if (data.estado === "activo") {
        data.motivo_baja = "";
        data.fecha_baja = "";
      } else if (data.estado === "vendido") {
        // La venta es una salida: conserva la fecha de salida pero no usa motivo de baja.
        data.motivo_baja = "";
      }

      const nuevoId = await Animales.save(data);
      this._animalGuardado = true;
      App.toast("Animal guardado correctamente");

      // Gap 11: Si está marcado "Notificado a REGA", registrar notificación
      if (data.notificado_rega && window.NotificacionesREGA) {
        try {
          const finca = await Fincas.getActive().catch(() => null);
          if (finca) {
            const resNotif = await NotificacionesREGA.registrar({
              animal_id: nuevoId,
              finca_id: finca.id,
              animal_numero: data.numero_identificacion,
              finca_rega: finca.rega || finca.codigo_REGA || '',
              tipo_evento: 'alta',
              observaciones: `Alta registrada ${id ? '(actualizada)' : '(nueva)'}`,
            });
            if (resNotif.exito) {
              await NotificacionesREGA.enviarAREGA({
                id: resNotif.id,
                animal_numero: data.numero_identificacion,
                finca_rega: finca.rega || finca.codigo_REGA,
                tipo_evento: 'alta'
              });
              App.toast(`Notificación REGA registrada: ${resNotif.numero_seguimiento}`, 'success');
            }
          }
        } catch (err) {
          console.warn('Error registrando notificación REGA:', err);
        }
      }

      location.hash = "#/animales";
    } catch (e) {
      App.toastError(e.message);
      const msgLower = (e.message || "").toLowerCase();
      if (msgLower.includes("crotal") || msgLower.includes("identificaci") || msgLower.includes("caravana")) {
        const crotalInput = document.getElementById("a-crotal");
        if (crotalInput) {
          crotalInput.focus();
          if (typeof crotalInput.select === "function") crotalInput.select();
        }
      }
    }
  },

  _validarCrotalUI(input) {
    // 1. Convertir a mayúsculas y limpiar caracteres no permitidos
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 2. Restringir formato: primeras 2 posiciones letras, del resto números
    let cleanVal = '';
    for (let i = 0; i < val.length; i++) {
      const char = val[i];
      if (i < 2) {
        if (/[A-Z]/.test(char)) cleanVal += char;
      } else {
        if (/[0-9]/.test(char)) cleanVal += char;
      }
    }
    input.value = cleanVal;

    const len = cleanVal.length;
    const counter = document.getElementById('crotal-length-counter');
    if (counter) counter.textContent = len + '/14';

    // Para animales de origen extranjero (compra intracomunitaria) el identificador
    // no empieza por "ES"; solo se marca en rojo cuando se espera un crotal español.
    const paisSel = document.getElementById('a-pais-nac');
    const pais = paisSel ? paisSel.value : 'ES';

    if (len < 4) {
      input.style.color = "#888";
    } else if (len < 14) {
      input.style.color = "var(--c-warning)"; // dorado mientras se escribe
    } else if (pais === 'ES' && !cleanVal.startsWith("ES")) {
      input.style.color = "var(--c-danger)"; // rojo: español debe empezar por ES (SITRAN)
    } else {
      input.style.color = "var(--c-success)"; // verde si está completo y correcto
    }
  },

  _onTipoAltaChange(selectEl) {
    const section = document.getElementById('a-procedencia-section');
    if (section) {
      section.style.display = selectEl.value === 'Compra' ? 'block' : 'none';
    }
  },

  _onEspecieChange(selectEl) {
    const CS = window.ComunidadesService;
    const section = document.getElementById('a-dib-section');
    if (section) {
      const requiere = CS ? CS.especieRequiereDIB(selectEl.value) : false;
      section.style.display = requiere ? 'block' : 'none';
    }
    // Refrescar el catálogo de categorías según la nueva especie
    const catSel = document.getElementById('a-categoria');
    if (catSel && CS && CS.getCategoriasAnimal) {
      const prev = catSel.value;
      const cats = CS.getCategoriasAnimal(selectEl.value);
      catSel.innerHTML = '<option value="">— Sin clasificar —</option>' +
        cats.map((c) => `<option value="${c}" ${prev === c ? 'selected' : ''}>${c}</option>`).join('');
    }
  },

  _onEstadoChange(selectEl) {
    const esBaja = selectEl.value === 'baja';
    const esSalida = esBaja || selectEl.value === 'vendido';
    const motivo = document.getElementById('a-motivo-baja-wrap');
    const fecha = document.getElementById('a-fecha-baja-wrap');
    // El motivo de baja solo aplica a bajas (muerte/sacrificio...); la venta no lo usa.
    if (motivo) motivo.style.display = esBaja ? 'block' : 'none';
    // La fecha se captura tanto en venta (fecha de salida) como en baja, para el libro de registro.
    if (fecha) fecha.style.display = esSalida ? 'block' : 'none';
  },

  async _salirRegistro() {
    if (!this._animalGuardado && !await Confirm.confirm("Salir sin guardar", "¿Cerrar sin guardar datos?", false)) return;
    location.hash = "#/animales";
  },

  async _eliminarAnimal(id) {
    const motivo = await Confirm.prompt("Motivo de anulación", "Introduce el motivo (obligatorio):", "rectificacion_censo");
    if (!motivo) {
      App.toastError("Debes indicar un motivo de anulación.");
      return;
    }
    if (!await Confirm.confirm("Anular Animal", "¿Anular ficha del animal? Se conservará histórico para auditoría.", true)) return;
    try {
      await Animales.delete(id, motivo.trim());
      App.toast("Animal anulado");
      location.hash = "#/animales";
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.AnimalesView = AnimalesView;





