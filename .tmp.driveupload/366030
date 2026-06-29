/**
 * Componente Formulario de Finca
 * Formulario simplificado para crear nuevas fincas manualmente
 */

const FormularioFinca = {
  /**
   * Crear y mostrar el formulario
   * @param {Function} onSubmit - Callback al enviar (recibe datos de finca)
   * @param {Function} onCancel - Callback al cancelar
   * @returns {HTMLElement} Elemento del formulario
   */
  crear(onSubmit, onCancel) {
    const CS = window.ComunidadesService;
    const opcionesCCAA = CS ? CS.getOpcionesComunidad() : [];
    const tiposExplotacion = CS ? CS.getTiposExplotacionREGA() : [];
    const clasificacionZootecnica = CS ? CS.getClasificacionZootecnica() : [];
    const especiesAutorizables = CS ? CS.getEspeciesAutorizables() : [];

    const formulario = document.createElement("div");
    formulario.className = "formulario-finca-contenedor";
    formulario.innerHTML = `
            <div class="formulario-finca-modal">
                <div class="formulario-finca-cabecera">
                    <h2>Crear Nueva Finca</h2>
                    <button class="formulario-finca-cerrar" type="button">✕</button>
                </div>

                <div class="formulario-finca-cuerpo">
                    <form class="formulario-finca-formulario" id="formFinca">
                        <!-- Campo: Nombre -->
                        <div class="formulario-finca-grupo">
                            <label for="nombreFinca">
                                <span class="requerido">*</span> Nombre de Finca
                            </label>
                            <input
                                type="text"
                                id="nombreFinca"
                                name="nombre"
                                placeholder="Ej: El Chamorro"
                                maxlength="100"
                                required
                            />
                            <span class="formulario-finca-error" data-campo="nombre"></span>
                        </div>

                        <!-- Campo: Propietario -->
                        <div class="formulario-finca-grupo">
                            <label for="propietarioFinca">
                                <span class="requerido">*</span> Propietario
                            </label>
                            <input
                                type="text"
                                id="propietarioFinca"
                                name="propietario"
                                placeholder="Ej: María García López"
                                maxlength="100"
                                required
                            />
                            <span class="formulario-finca-error" data-campo="propietario"></span>
                        </div>

                        <!-- Campo: Dirección -->
                        <div class="formulario-finca-grupo">
                            <label for="direccionFinca">
                                <span class="requerido">*</span> Dirección
                            </label>
                            <input
                                type="text"
                                id="direccionFinca"
                                name="direccion"
                                placeholder="Ej: Calle Principal 123, Municipio (Provincia)"
                                maxlength="200"
                                required
                            />
                            <span class="formulario-finca-error" data-campo="direccion"></span>
                        </div>

                        <!-- Campo: Teléfono (opcional) -->
                        <div class="formulario-finca-grupo">
                            <label for="telefonoFinca">
                                Teléfono (Opcional)
                            </label>
                            <input
                                type="tel"
                                id="telefonoFinca"
                                name="telefonoContacto"
                                placeholder="Ej: +34 600 123 456"
                                maxlength="20"
                            />
                            <span class="formulario-finca-error" data-campo="telefonoContacto"></span>
                        </div>

                        <!-- NUEVOS CAMPOS: NIF, EMAIL, ADSG -->
                        <div class="formulario-finca-grupo">
                            <label for="nifFinca">NIF / CIF (Opcional)</label>
                            <input type="text" id="nifFinca" name="nif_cif" placeholder="Ej: B12345678" maxlength="20" />
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="emailFinca">Correo Electrónico (Opcional)</label>
                            <input type="email" id="emailFinca" name="email" placeholder="Ej: ganaderia@ejemplo.com" maxlength="100" />
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="adsgFinca">Agrupación ADSG (Opcional)</label>
                            <input type="text" id="adsgFinca" name="adsg_nombre" placeholder="Ej: ADSG Ovino Sierra Norte" maxlength="100" />
                        </div>

                        <!-- BLOQUE SIGGAN / REGA -->
                        <div class="formulario-finca-grupo">
                            <label for="ccaaFinca">Comunidad Autónoma</label>
                            <select id="ccaaFinca" name="comunidad_autonoma">
                                <option value="">— Selecciona —</option>
                                ${opcionesCCAA.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
                            </select>
                            <small class="formulario-finca-ayuda" id="ayudaSiggan"></small>
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="provinciaFinca">Provincia</label>
                            <select id="provinciaFinca" name="provincia">
                                <option value="">— Selecciona comunidad primero —</option>
                            </select>
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="municipioFinca">Municipio</label>
                            <input type="text" id="municipioFinca" name="municipio" placeholder="Ej: Aracena" maxlength="80" />
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="regaFinca"><span class="requerido" id="regaReq" style="display:none;">*</span> Código REGA</label>
                            <input type="text" id="regaFinca" name="rega" placeholder="Ej: ES041230000123" maxlength="25" />
                            <span class="formulario-finca-error" data-campo="rega"></span>
                            <small class="formulario-finca-ayuda">ES + 2 díg. provincia + 3 díg. municipio + 7 díg. secuencial</small>
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="ceaFinca">Código CEA (Opcional)</label>
                            <input type="text" id="ceaFinca" name="cea" placeholder="Ej: XX-XXXXX-XX" maxlength="20" />
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="tipoExpFinca">Tipo de Explotación (REGA)</label>
                            <select id="tipoExpFinca" name="tipo_explotacion">
                                <option value="">— Selecciona —</option>
                                ${tiposExplotacion.map(t => `<option value="${t}">${t}</option>`).join("")}
                            </select>
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="claseZootFinca">Clasificación Zootécnica</label>
                            <select id="claseZootFinca" name="clasificacion_zootecnica">
                                <option value="">— Selecciona —</option>
                                ${clasificacionZootecnica.map(c => `<option value="${c}">${c}</option>`).join("")}
                            </select>
                        </div>

                        <div class="formulario-finca-grupo">
                            <label for="capacidadFinca">Capacidad Máxima (nº cabezas)</label>
                            <input type="number" id="capacidadFinca" name="capacidad_maxima" min="0" step="1" placeholder="Ej: 500" />
                        </div>

                        <div class="formulario-finca-grupo">
                            <label>Especies Autorizadas</label>
                            <div class="formulario-finca-especies" id="especiesAutorizadas">
                                ${especiesAutorizables.map(e => `
                                <label class="formulario-finca-chk">
                                    <input type="checkbox" name="especies_autorizadas" value="${e}"> ${e}
                                </label>`).join("")}
                            </div>
                        </div>

                        <div class="formulario-finca-mensaje-exito" style="display: none;"></div>
                        <div class="formulario-finca-mensaje-error" style="display: none;"></div>
                    </form>
                </div>

                <!-- Botones SIEMPRE visibles abajo (fuera del scroll) -->
                <div class="formulario-finca-botones">
                    <button type="button" class="btn-primario" id="btn-guardar-finca">
                        💾 Crear Finca
                    </button>
                    <button type="button" class="btn-secundario formulario-finca-cancelar">
                        ✕ Cancelar
                    </button>
                </div>
            </div>
        `;

    // Asignar estilos inline si no están en CSS
    this._aplicarEstilos(formulario);

    // Asignar event listeners
    const formElement = formulario.querySelector("#formFinca");
    const btnCerrar = formulario.querySelector(".formulario-finca-cerrar");
    const btnCancelar = formulario.querySelector(".formulario-finca-cancelar");
    const btnGuardar = formulario.querySelector("#btn-guardar-finca");

    // Click en botón guardar → validar y enviar
    btnGuardar.addEventListener("click", () => {
      this._manejarEnvio(formElement, onSubmit, formulario);
    });

    // Enter en campos también envía
    formElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._manejarEnvio(formElement, onSubmit, formulario);
      }
    });

    btnCerrar.addEventListener("click", () => {
      onCancel();
      formulario.remove();
    });

    btnCancelar.addEventListener("click", () => {
      onCancel();
      formulario.remove();
    });

    // Interactividad SIGGAN: CCAA -> provincias + obligatoriedad de REGA
    const selCcaa = formulario.querySelector("#ccaaFinca");
    const selProv = formulario.querySelector("#provinciaFinca");
    const regaReq = formulario.querySelector("#regaReq");
    const ayudaSiggan = formulario.querySelector("#ayudaSiggan");
    if (selCcaa) {
      selCcaa.addEventListener("change", () => {
        const CS = window.ComunidadesService;
        const ccaa = selCcaa.value;
        // Repoblar provincias
        if (selProv) {
          const provincias = CS && ccaa ? CS.getProvincias(ccaa) : [];
          selProv.innerHTML = provincias.length
            ? `<option value="">— Selecciona —</option>` + provincias.map(p => `<option value="${p}">${p}</option>`).join("")
            : `<option value="">— Selecciona comunidad primero —</option>`;
        }
        // REGA obligatorio según comunidad
        const obligatorio = CS && ccaa ? CS.esREGAObligatorio(ccaa) : false;
        if (regaReq) regaReq.style.display = obligatorio ? "inline" : "none";
        if (ayudaSiggan) {
          const conf = CS && ccaa ? CS.getConfiguracionCCAA(ccaa) : null;
          ayudaSiggan.textContent = conf
            ? `Plataforma de tramitación: ${conf.sistema_movimiento}. ${obligatorio ? "REGA obligatorio." : "REGA recomendado."}`
            : "";
        }
      });
    }

    return formulario;
  },

  /**
   * Manejar envío del formulario
   */
  async _manejarEnvio(formElement, onSubmit, contenedor) {
    try {
      // Limpiar errores previos
      formElement
        .querySelectorAll(".formulario-finca-error")
        .forEach((e) => (e.textContent = ""));

      // Obtener datos del formulario
      const datos = new FormData(formElement);
      const especiesAutorizadas = datos.getAll("especies_autorizadas");
      const regaNorm = window.ComunidadesService && datos.get("rega")
        ? window.ComunidadesService.normalizarREGA(datos.get("rega"))
        : (datos.get("rega") ? datos.get("rega").trim().toUpperCase() : "");
      const fincaData = {
        nombre: datos.get("nombre").trim(),
        propietario: datos.get("propietario").trim(),
        direccion: datos.get("direccion").trim(),
        telefonoContacto: datos.get("telefonoContacto").trim(),
        nif_cif: datos.get("nif_cif") ? datos.get("nif_cif").trim() : "",
        email: datos.get("email") ? datos.get("email").trim() : "",
        adsg_nombre: datos.get("adsg_nombre") ? datos.get("adsg_nombre").trim() : "",
        comunidad_autonoma: datos.get("comunidad_autonoma") || "",
        provincia: datos.get("provincia") || "",
        municipio: datos.get("municipio") ? datos.get("municipio").trim() : "",
        rega: regaNorm,
        cea: datos.get("cea") ? datos.get("cea").trim().toUpperCase() : "",
        tipo_explotacion: datos.get("tipo_explotacion") || "",
        clasificacion_zootecnica: datos.get("clasificacion_zootecnica") || "",
        capacidad_maxima: datos.get("capacidad_maxima") ? Number(datos.get("capacidad_maxima")) : null,
        especies_autorizadas: especiesAutorizadas,
        zonas: [],
      };

      // Validar campos
      const errores = this._validarDatos(fincaData);
      if (errores.length > 0) {
        errores.forEach((err) => {
          const elemento = formElement.querySelector(
            `.formulario-finca-error[data-campo="${err.campo}"]`
          );
          if (elemento) elemento.textContent = err.mensaje;
        });
        return;
      }

      // Llamar callback con datos
      await onSubmit(fincaData);

      // Mostrar éxito
      const msgExito = contenedor.querySelector(
        ".formulario-finca-mensaje-exito"
      );
      msgExito.textContent = `✓ Finca "${fincaData.nombre}" creada exitosamente`;
      msgExito.style.display = "block";

      // Remover después de 2 segundos
      setTimeout(() => {
        contenedor.remove();
      }, 2000);
    } catch (error) {
      const msgError = contenedor.querySelector(
        ".formulario-finca-mensaje-error"
      );
      msgError.textContent = `✗ Error: ${error.message}`;
      msgError.style.display = "block";
    }
  },

  /**
   * Validar datos del formulario
   */
  _validarDatos(datos) {
    const errores = [];

    if (!datos.nombre || datos.nombre === "") {
      errores.push({ campo: "nombre", mensaje: "Nombre es requerido" });
    }
    if (datos.nombre && datos.nombre.length > 100) {
      errores.push({
        campo: "nombre",
        mensaje: "No puede exceder 100 caracteres",
      });
    }

    if (!datos.propietario || datos.propietario === "") {
      errores.push({
        campo: "propietario",
        mensaje: "Propietario es requerido",
      });
    }
    if (datos.propietario && datos.propietario.length > 100) {
      errores.push({
        campo: "propietario",
        mensaje: "No puede exceder 100 caracteres",
      });
    }

    if (!datos.direccion || datos.direccion === "") {
      errores.push({ campo: "direccion", mensaje: "Dirección es requerida" });
    }
    if (datos.direccion && datos.direccion.length > 200) {
      errores.push({
        campo: "direccion",
        mensaje: "No puede exceder 200 caracteres",
      });
    }

    if (
      datos.telefonoContacto &&
      !Importador.validarTelefono(datos.telefonoContacto)
    ) {
      errores.push({
        campo: "telefonoContacto",
        mensaje: "Formato de teléfono inválido",
      });
    }

    // Validación SIGGAN del código REGA
    const CS = window.ComunidadesService;
    const ccaa = datos.comunidad_autonoma || null;
    const regaObligatorio = CS && ccaa ? CS.esREGAObligatorio(ccaa) : false;
    if (regaObligatorio && !datos.rega) {
      errores.push({
        campo: "rega",
        mensaje: "El código REGA es obligatorio para esta comunidad (SIGGAN).",
      });
    } else if (datos.rega && CS) {
      const res = CS.validarFormatoREGA(datos.rega, ccaa);
      if (!res.valido) {
        errores.push({ campo: "rega", mensaje: res.mensaje });
      }
    }

    return errores;
  },

  /**
   * Aplicar estilos CSS al formulario
   */
  _aplicarEstilos(contenedor) {
    if (document.getElementById("formulario-finca-styles")) return;
    const estilo = document.createElement("style");
    estilo.id = "formulario-finca-styles";
    estilo.textContent = `
      .formulario-finca-cuerpo { flex: 1; overflow-y: auto; min-height: 0; padding-bottom: 20px; }
      .formulario-finca-botones {
        display: flex; gap: 12px; padding: 16px 16px calc(16px + var(--safe-bottom, 20px));
        border-top: 1px solid #222; flex-shrink: 0; background: #0a0a0a;
        margin: 0 -16px -16px; /* Compensar padding del modal */
      }
      .formulario-finca-botones .btn-primario {
        flex: 1; padding: 16px 14px; border-radius: 14px; font-weight: 700;
        font-size: 16px; cursor: pointer; text-align: center;
        border: none; background: linear-gradient(135deg, #d97706, #b45309);
        color: #fff; box-shadow: 0 4px 14px rgba(217,119,6,0.35);
      }
      .formulario-finca-botones .btn-secundario {
        flex: 1; padding: 16px 14px; border-radius: 14px; font-weight: 700;
        font-size: 16px; cursor: pointer; text-align: center;
        border: 1px solid #444; background: #1a1a1a; color: #eee;
      }
      .formulario-finca-ayuda { display:block; color:#888; font-size:11px; margin-top:4px; }
      .formulario-finca-especies { display:flex; flex-wrap:wrap; gap:8px 14px; margin-top:4px; }
      .formulario-finca-chk { display:flex; align-items:center; gap:6px; font-size:13px; color:#ddd; cursor:pointer; }
      .formulario-finca-chk input { width:auto; }
    `;
    document.head.appendChild(estilo);
  },
};

window.FormularioFinca = FormularioFinca;
