/**
 * Livestock Manager - AnimalesView v1.0.0
 * Vista de Animales extraída de App.js para modularización.
 * Copia espejo de js/views/animales-view.js
 */

const AnimalesView = {
  async render() {
    const main = document.getElementById("app-content");
    const animales = await Animales.list();
    const rebanos = await Rebanos.list();
    if (rebanos.length === 0)
      return (main.innerHTML = `<div class="card empty-state"><p class="empty-state-text">Crea un rebaño primero.</p></div>`);

    const rebanoMap = {};
    rebanos.forEach(r => { rebanoMap[r.id] = r; });

    let html = `
      <div class="mb-16">
        <div class="flex flex-wrap gap-8">
          <button class="btn btn-primary btn-sm" onclick="location.hash='/animal'">➕ Nuevo</button>
        </div>
      </div>`;

    if (animales.length === 0) {
      html += `<div class="empty-state">
        <div class="empty-state-icon">🐄</div>
        <p class="empty-state-text">Aún no hay animales registrados.</p>
        <button class="btn btn-primary btn-sm mt-12" onclick="location.hash='/animal'">➕ Registrar primer animal</button>
      </div>`;
    } else {
      html += `
        <div class="sticky-top" style="padding-bottom:10px;">
          <input type="search" id="search-animales" placeholder="🔍 Buscar por crotal, raza o rebaño..."
                 oninput="AnimalesView._filtrar(this.value)"
                 class="search-input">
        </div>
        <div id="animales-lista" class="grid gap-12">`;

      animales.forEach((a) => {
        const r = rebanoMap[a.rebanoId];
        html += AnimalesView._renderCard(a, r);
      });
      html += `</div>`;

      html += `
        <div id="animales-empty-search" class="empty-state-search" style="display:none;">
          <div class="text-2xl mb-8">🔍</div>
          <p class="text-gray-500">No se encontraron animales con ese criterio.</p>
        </div>`;
    }

    main.innerHTML = html;
    AnimalesView._cache = { animales, rebanoMap };
  },

  _renderCard(a, r) {
    return `
      <div class="card card-animal" onclick="location.hash='/animal?id=${a.id}'">
        <div class="flex justify-between items-center">
          <h3 class="section-h3 m-0">${a.numero_identificacion}</h3>
          <span class="text-sm text-777">Ficha ➔</span>
        </div>
        <p class="text-ccc text-85" style="margin:6px 0 0;">📦 ${r ? r.nombre : "S/R"} · 🧬 ${a.raza || 'Sin raza'}</p>
        <div class="mt-8">
          <span class="badge badge-gold">${(a.estado || 'activo').toUpperCase()}</span>
        </div>
      </div>`;
  },

  _filtrar(texto) {
    texto = texto.trim().toLowerCase();
    const cache = AnimalesView._cache;
    if (!cache) return;
    const contenedor = document.getElementById("animales-lista");
    const emptyMsg = document.getElementById("animales-empty-search");
    if (!contenedor) return;

    if (!texto) {
      contenedor.style.display = 'grid';
      if (emptyMsg) emptyMsg.style.display = 'none';
      contenedor.innerHTML = cache.animales.map(a => {
        const r = cache.rebanoMap[a.rebanoId];
        return AnimalesView._renderCard(a, r);
      }).join('');
      return;
    }

    const filtrados = cache.animales.filter(a => {
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

    const [especies, rebanos] = await Promise.all([
      window.db.getAll("config_especies"),
      Rebanos.list(),
    ]);

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
                   placeholder="Ej: ES1409912345 (14-16 caracteres)" maxlength="16"
                   oninput="AnimalesView._validarCrotalUI(this)"
                   class="wizard-crotal-input">
            <div class="text-777 text-tiny mt-4" style="line-height:1.3; padding:0 8px;">
              Formato REGA: ES + provincia + nº animal (máx. 16)<br>
              <span class="text-gold" id="crotal-length-counter">0/16</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-12 mb-12">
            <div>
              <label class="form-label">ESPECIE</label>
              <select id="a-especie" class="form-input form-input-lg">
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
              <select id="a-tipoalta" class="form-input form-input-lg">
                <option value="Nacimiento" ${a.tipoAlta === "Nacimiento" ? "selected" : ""}>Nacimiento</option>
                <option value="Compra" ${a.tipoAlta === "Compra" ? "selected" : ""}>Compra</option>
              </select>
            </div>
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
        <div class="wizard-footer-fixed grid grid-cols-2 gap-12">
          <button onclick="AnimalesView._salirRegistro()" class="wizard-btn-action wizard-btn-secondary">✖ SALIR</button>
          <button id="btn-guardar-main" onclick="AnimalesView._guardarAnimalDetalle('${id || ""}')" class="wizard-btn-action wizard-btn-success">✔ GUARDAR</button>
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
        fecha_nacimiento: document.getElementById("a-fecha").value,
        notas: document.getElementById("a-notas").value.trim(),
        rfid_codigo: document.getElementById("a-rfid").value.trim(),
        fecha_identificacion: document.getElementById("a-fecha-ident").value,
        tipo_identificacion: document.getElementById("a-tipo-ident").value,
        notificado_rega: document.getElementById("a-notificado").checked,
        estado: existing.estado || "activo",
        actualizadoEn: new Date().toISOString(),
      };

      const nuevoId = await Animales.save(data);
      this._animalGuardado = true;
      App.toast("Animal guardado correctamente ✔");

      location.hash = "#/animales";
    } catch (e) {
      App.toastError(e.message);
    }
  },

  _validarCrotalUI(input) {
    input.value = input.value.toUpperCase();
    const len = input.value.length;
    const counter = document.getElementById('crotal-length-counter');
    if (counter) counter.textContent = len + '/16';

    if (len < 4) {
      input.style.color = "#555";
    } else if (len < 14) {
      input.style.color = "#fbbf24"; // dorado mientras se escribe
    } else if (len > 16) {
      input.style.color = "#ef4444"; // rojo si excede
    } else if (!input.value.startsWith("ES") && /^[A-Z]{2}/.test(input.value)) {
      input.style.color = "#ef4444"; // prefijo extranjero
    } else {
      input.style.color = "#10b981"; // verde si todo OK
    }
  },

  _onTipoAltaChange(selectEl) {
    const section = document.getElementById('a-procedencia-section');
    if (section) {
      section.style.display = selectEl.value === 'Compra' ? 'block' : 'none';
    }
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
