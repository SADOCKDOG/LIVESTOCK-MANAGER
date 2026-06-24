/**
 * Livestock Manager - AnimalesView v1.0.0
 * Vista de Animales extraída de App.js para modularización.
 * Copia espejo de js/views/animales-view.js
 */

const AnimalesView = {
  _filtroActivo: { especie: '', sexo: '', estado: '' },

  async render() {
    const main = document.getElementById("app-content");
    const animales = await Animales.list();
    const rebanos = await Rebanos.list();
    if (rebanos.length === 0)
      return (main.innerHTML = `<div class="card empty-state"><p class="empty-state-text">Crea un rebaño primero.</p></div>`);

    const rebanoMap = {};
    rebanos.forEach(r => { rebanoMap[r.id] = r; });

    const activos = animales.filter(a => a.estado === 'activo').length;
    const especies = [...new Set(animales.map(a => a.especie).filter(Boolean))];

    let html = `
      <div class="mb-16">
        <div class="flex justify-between items-center">
          <div class="flex gap-8">
            <button class="btn btn-primary btn-sm btn-create" onclick="location.hash='/animal'">➕ Nuevo</button>
          </div>
          ${animales.length > 0 ? `<span class="text-xs text-gray">${activos}/${animales.length} activos</span>` : ''}
        </div>
      </div>`;

    if (animales.length === 0) {
      html += `<div class="empty-state">
        <div class="empty-state-icon">🐄</div>
        <p class="empty-state-text">Aún no hay animales registrados.</p>
        <button class="btn btn-primary btn-sm mt-12" onclick="location.hash='/animal'">➕ Registrar primer animal</button>
      </div>`;
      main.innerHTML = html;
      return;
    }

    // Barra de resumen
    html += `
      <div class="flex flex-wrap gap-4 mb-10">
        ${especies.map(esp => `<span class="badge badge-sm badge-gold">${esp}: ${animales.filter(a => a.especie === esp).length}</span>`).join('')}
        <span class="badge badge-sm badge-green">✅ ${activos} activos</span>
        <span class="badge badge-sm badge-red">📦 ${animales.filter(a => a.estado === 'vendido').length} vendidos</span>
      </div>`;

    // Búsqueda + selector de especie compacto
    html += `
      <div class="sticky-top" style="padding-bottom:10px;">
        <div class="flex gap-8 items-center">
          <input type="search" id="search-animales" placeholder="🔍 Buscar por crotal, raza o rebaño..."
                 oninput="AnimalesView._filtrar(this.value)"
                 class="search-input" style="flex:1;min-width:0;">
          <select id="animales-filtro-especie" class="form-select-gold"
                  onchange="AnimalesView._setFiltro('especie', this.value)"
                  style="width:130px;min-width:120px;">
            <option value="" ${this._filtroActivo.especie === '' ? 'selected' : ''}>Todas</option>
            <option value="Vacas" ${this._filtroActivo.especie === 'Vacas' ? 'selected' : ''}>Vacas</option>
            <option value="Ovejas" ${this._filtroActivo.especie === 'Ovejas' ? 'selected' : ''}>Ovejas</option>
            <option value="Cabras" ${this._filtroActivo.especie === 'Cabras' ? 'selected' : ''}>Cabras</option>
            <option value="Cerdos" ${this._filtroActivo.especie === 'Cerdos' ? 'selected' : ''}>Cerdos</option>
          </select>
        </div>
      </div>
      <div id="animales-lista" class="grid gap-12">`;

    const filtrados = this._aplicarFiltros(animales, rebanoMap);
    filtrados.forEach(a => html += this._renderCard(a, rebanoMap[a.rebanoId]));
    html += `</div>
      <!-- Botón Flotante de Acción para móviles -->
      <button class="fab-btn" onclick="location.hash='/animal'" title="Nuevo Animal">➕</button>
      <div id="animales-empty-search" class="empty-state-search" style="display:none;">
        <div class="text-2xl mb-8">🔍</div>
        <p class="text-gray-500">No se encontraron animales con ese criterio.</p>
      </div>`;

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
    const iconoEspecie = a.especie === 'Vacas' ? '🐄' : a.especie === 'Ovejas' ? '🐑' : a.especie === 'Cabras' ? '🐐' : '🐾';
    const iconoSexo = a.sexo === 'H' ? '♀' : a.sexo === 'M' ? '♂' : '⚤';
    const colorEstado = a.estado === 'activo' ? '#10b981' : a.estado === 'vendido' ? '#f59e0b' : a.estado === 'baja' ? '#ef4444' : '#888';
    return `
      <div class="card card-animal" onclick="location.hash='/animal?id=${a.id}'" style="border-left:4px solid ${colorEstado};">
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-6">
              <span class="text-xl">${iconoEspecie}</span>
              <h3 class="section-h3 m-0 text-ellipsis">${a.numero_identificacion}</h3>
            </div>
            <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray">
              <span>${iconoSexo} ${a.sexo === 'H' ? 'Hembra' : a.sexo === 'M' ? 'Macho' : 'Castrado'}</span>
              <span>·</span>
              <span>🧬 ${a.raza || 'Sin raza'}</span>
              <span>·</span>
              <span>📦 ${r ? r.nombre : 'S/R'}</span>
              ${edad !== null ? `<span>·</span><span>🎂 ${edad} años</span>` : ''}
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="badge badge-sm" style="background:${colorEstado}20;color:${colorEstado};border:1px solid ${colorEstado}40;display:block;margin-bottom:4px;">${(a.estado || 'activo').toUpperCase()}</span>
            <span class="text-xs text-777">Ficha ➔</span>
          </div>
        </div>
        ${a.categoria ? `<div class="mt-4 text-xs text-gray">📋 ${a.categoria}</div>` : ''}
      </div>`;
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
        <div class="wizard-header-fixed flex justify-between items-center">
          <h1 class="wizard-header-title">FICHA ANIMAL</h1>
          <div class="flex gap-8">
            <button onclick="App._leerChipNFC('a-rfid', 'a-crotal')" class="wizard-btn-action wizard-btn-nfc">
              🛜 NFC
            </button>
            <button onclick="App._escanearCrotal('a-crotal')" class="wizard-btn-action wizard-btn-primary wizard-btn-scan">
              📷 SCAN
            </button>
          </div>
        </div>
        <div class="wizard-content-scrollable">
          <div class="text-center mb-8">
            <label class="wizard-crotal-label">Nº CROTAL</label>
            <input type="text" id="a-crotal"
                   value="${a.numero_identificacion}"
                   placeholder="Ej: ES123456789012 (2 letras + 12 dígitos)" maxlength="14"
                   oninput="AnimalesView._validarCrotalUI(this)"
                   class="wizard-crotal-input">
            <div class="text-777 text-tiny mt-4" style="line-height:1.3; padding:0 8px;">
              Formato REGA: ES + 12 dígitos<br>
              <span class="text-gold" id="crotal-length-counter">0/14</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-12 mb-12">
            <div>
              <label class="form-label">ESPECIE</label>
              <select id="a-especie" class="form-input form-input-lg" onchange="AnimalesView._onEspecieChange(this)">
                ${especies.map((e) => `<option value="${e.nombre}" ${a.especie === e.nombre ? "selected" : ""}>${e.nombre}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="form-label">SEXO</label>
              <select id="a-sexo" class="form-input form-input-lg">
                <option value="H" ${a.sexo === "H" ? "selected" : ""}>Hembra (H)</option>
                <option value="M" ${a.sexo === "M" ? "selected" : ""}>Macho (M)</option>
                <option value="C" ${a.sexo === "C" ? "selected" : ""}>Castrado (C)</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-12 mb-12">
            <div>
              <label class="form-label">RAZA</label>
              <input type="text" id="a-raza" value="${a.raza || ""}" class="form-input form-input-lg">
            </div>
            <div>
              <label class="form-label">REBAÑO</label>
              <select id="a-rebano" class="form-select-gold">
                <option value="">Sin asignar</option>
                ${rebanos.map((r) => `<option value="${r.id}" ${a.rebanoId == r.id ? "selected" : ""}>${r.nombre}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-12 mb-12">
            <div>
              <label class="form-label">NACIMIENTO</label>
              <input type="date" id="a-fecha" value="${a.fecha_nacimiento || ""}" class="form-input form-input-lg">
            </div>
            <div>
              <label class="form-label">TIPO ALTA</label>
              <select id="a-tipoalta" class="form-input form-input-lg" onchange="AnimalesView._onTipoAltaChange(this)">
                ${tiposAlta.map((t) => `<option value="${t.value}" ${a.tipoAlta === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="mb-12">
            <label class="form-label">CATEGORÍA (libro de registro)</label>
            <select id="a-categoria" class="form-input form-input-lg">
              <option value="">— Sin clasificar —</option>
              ${categoriasAnimal.map((c) => `<option value="${c}" ${a.categoria === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-12 mb-12">
            <div>
              <label class="form-label">CHIP (RFID/NFC)</label>
              <input type="text" id="a-rfid" value="${a.rfid_codigo || ""}" placeholder="Opcional..." class="form-input form-input-lg">
            </div>
            <div>
              <label class="form-label">FECHA IDENTIFICACIÓN</label>
              <input type="date" id="a-fecha-ident" value="${a.fecha_identificacion || ""}" class="form-input form-input-lg">
            </div>
          </div>
          <div class="mb-12">
            <label class="form-label">TIPO IDENTIFICACIÓN</label>
            <select id="a-tipo-ident" class="form-input form-input-lg">
              <option value="Completa (EID + Visual)" ${a.tipo_identificacion === "Completa (EID + Visual)" ? "selected" : ""}>Completa (EID + Visual)</option>
              <option value="Matadero (Visual REGA)" ${a.tipo_identificacion === "Matadero (Visual REGA)" ? "selected" : ""}>Matadero (Visual REGA)</option>
            </select>
          </div>
          <div class="mb-12">
            <label class="wizard-checkbox-container" style="margin-top:5px;">
              <input type="checkbox" id="a-notificado" ${a.notificado_rega ? 'checked' : ''}>
              <span>Alta comunicada oficialmente a PIGGAN/SIA</span>
            </label>
          </div>

          <!-- LIBRO DE REGISTRO SIGGAN -->
          <div class="badge-crotal" style="margin-bottom:12px;">
            <div class="badge-crotal-header">📒 LIBRO DE REGISTRO (SIGGAN)</div>
            <div class="grid grid-cols-2 gap-12 mb-12" style="margin-top:10px;">
              <div>
                <label class="form-label">PAÍS DE NACIMIENTO</label>
                <select id="a-pais-nac" class="form-input form-input-lg">
                  ${paisesNac.map((p) => `<option value="${p.value}" ${(a.pais_nacimiento || 'ES') === p.value ? "selected" : ""}>${p.label}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="form-label">FECHA ALTA EN EXPLOTACIÓN</label>
                <input type="date" id="a-fecha-alta" value="${a.fecha_alta || ""}" class="form-input form-input-lg">
              </div>
            </div>
            <div id="a-procedencia-section" class="mb-12" style="display:${esCompra ? 'block' : 'none'};">
              <label class="form-label">REGA DE PROCEDENCIA (explotación origen)</label>
              <input type="text" id="a-rega-origen" value="${a.rega_origen || ""}" placeholder="Ej: ES041230000123" class="form-input form-input-lg">
            </div>
            <div class="mb-12">
              <label class="form-label">MADRE (genealogía)</label>
              <select id="a-madre" class="form-select-gold">
                <option value="">Sin asignar</option>
                ${hembras.map((h) => `<option value="${h.id}" ${a.madre_id == h.id ? "selected" : ""}>${h.numero_identificacion || ('#' + h.id)}${h.especie ? ' · ' + h.especie : ''}</option>`).join("")}
              </select>
            </div>
            <div id="a-dib-section" class="mb-12" style="display:${mostrarDIB ? 'block' : 'none'};">
              <label class="form-label">DIB / Nº PASAPORTE (bovino/equino)</label>
              <input type="text" id="a-dib" value="${a.dib || ""}" placeholder="Documento de Identificación Bovina" class="form-input form-input-lg">
            </div>
            <div class="grid grid-cols-2 gap-12">
              <div>
                <label class="form-label">ESTADO</label>
                <select id="a-estado" class="form-input form-input-lg" onchange="AnimalesView._onEstadoChange(this)">
                  <option value="activo" ${(a.estado || 'activo') === 'activo' ? "selected" : ""}>Activo</option>
                  <option value="vendido" ${a.estado === 'vendido' ? "selected" : ""}>Vendido</option>
                  <option value="baja" ${esBaja ? "selected" : ""}>Baja</option>
                </select>
              </div>
              <div id="a-motivo-baja-wrap" style="display:${esBaja ? 'block' : 'none'};">
                <label class="form-label">MOTIVO DE BAJA</label>
                <select id="a-motivo-baja" class="form-input form-input-lg">
                  <option value="">— Selecciona —</option>
                  ${motivosBaja.map((m) => `<option value="${m.value}" ${a.motivo_baja === m.value ? "selected" : ""}>${m.label}</option>`).join("")}
                </select>
                <div id="a-sandach-wrap" style="display:none; margin-top:8px; padding:8px; background:#f0f9ff; border:1px solid #0ea5e9; border-radius:6px; font-size:12px;">
                  <div style="color:#0369a1; font-weight:600; margin-bottom:4px;">ℹ️ CLASIFICACIÓN SANDACH (Reg. UE 1069/2009)</div>
                  <div id="a-sandach-categoria" style="color:#475569; margin-top:4px;"></div>
                </div>
              </div>
            </div>
            <div id="a-fecha-baja-wrap" class="mb-12" style="display:${esSalida ? 'block' : 'none'}; margin-top:12px;">
              <label class="form-label">FECHA DE SALIDA / BAJA</label>
              <input type="date" id="a-fecha-baja" value="${a.fecha_baja || ""}" class="form-input form-input-lg">
            </div>
          </div>

          <textarea id="a-notas" placeholder="NOTAS / OBSERVACIONES..."
                    class="wizard-notas">${a.notas || ""}</textarea>
          ${!esNuevo ? `
            <div class="badge-crotal">
              <div class="badge-crotal-header">COMPAÑEROS DE REBAÑO &mdash; Últ. pesaje</div>
              <div id="tabla-referencia" class="badge-crotal-loading">Cargando...</div>
            </div>
            <div class="badge-crotal" style="margin-top:15px;">
              <div class="badge-crotal-header">HISTORIAL REPRODUCTIVO</div>
              <div id="tabla-reproduccion" class="badge-crotal-loading">Cargando...</div>
            </div>
            <button id="btn-reproduccion" onclick="App._abrirWizardReproduccion('${id}')" class="wizard-btn-action wizard-btn-reproduccion">
              🧬 GESTIÓN REPRODUCTIVA
            </button>` : ""}
        </div>
        <div class="wizard-footer-fixed grid grid-cols-3 gap-8">
          ${!esNuevo ? `<button type="button" onclick="location.hash='/trazabilidad?id=${id}'" class="wizard-btn-action" style="background:linear-gradient(135deg,#0d9488,#0f766e);border:none;color:#fff;font-weight:800;">🔄 Ver 360°</button>` : '<div></div>'}
          <button type="button" onclick="AnimalesView._salirRegistro()" class="wizard-btn-action wizard-btn-secondary">✕ Salir</button>
          <button type="button" id="btn-guardar-main" onclick="AnimalesView._guardarAnimalDetalle('${id || ""}')" class="wizard-btn-action wizard-btn-success">✔ Guardar</button>
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
          const notificacionId = await window.NotificacionesREGA.registrar({
            animal_id: id || 'nuevo',
            finca_id: finca?.id,
            animal_numero: crotal,
            finca_rega: finca?.rega || finca?.codigo_REGA,
            tipo_evento: 'cambio_estado'
          });

          // Simular envío a REGA
          const resultado = await window.NotificacionesREGA.enviarAREGA({
            id: notificacionId,
            animal_numero: crotal,
            finca_rega: finca?.rega,
            tipo_evento: 'cambio_estado'
          });

          if (resultado.exito) {
            App.toast(`✅ ${resultado.mensaje}`);
          } else {
            App.toastError(`⚠️ ${resultado.mensaje}`);
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
      App.toast("Animal guardado correctamente ✔");

      // Gap 11: Si está marcado "Notificado a REGA", registrar notificación
      if (data.notificado_rega && window.NotificacionesREGA) {
        try {
          const finca = await Fincas.getActive().catch(() => null);
          if (finca) {
            const resultado = await NotificacionesREGA.registrar({
              animal_id: nuevoId,
              finca_id: finca.id,
              animal_numero: data.numero_identificacion,
              finca_rega: finca.rega || '',
              tipo_evento: 'alta',
              observaciones: `Alta registrada ${id ? '(actualizada)' : '(nueva)'}`,
            });
            if (resultado.exito) {
              await NotificacionesREGA.enviarAREGA(resultado.numero_seguimiento);
              App.toast(`✅ Notificación REGA registrada: ${resultado.numero_seguimiento}`);
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
      input.style.color = "#fbbf24"; // dorado mientras se escribe
    } else if (pais === 'ES' && !cleanVal.startsWith("ES")) {
      input.style.color = "#ef4444"; // rojo: español debe empezar por ES (SITRAN)
    } else {
      input.style.color = "#10b981"; // verde si está completo y correcto
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

  _salirRegistro() {
    if (!this._animalGuardado && !confirm("¿Cerrar sin guardar datos?")) return;
    location.hash = "#/animales";
  },

  async _eliminarAnimal(id) {
    if (!confirm("¿Borrar animal de la base de datos?")) return;
    try {
      await Animales.delete(id);
      App.toast("Borrado");
      location.hash = "#/animales";
    } catch (e) {
      App.toastError(e.message);
    }
  }
};

window.AnimalesView = AnimalesView;
