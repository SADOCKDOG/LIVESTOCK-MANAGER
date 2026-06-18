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
    const formulario = document.createElement("div");
    formulario.className = "formulario-finca-contenedor";
    formulario.innerHTML = `
            <div class="formulario-finca-modal">
                <div class="formulario-finca-cabecera">
                    <h2>Crear Nueva Finca</h2>
                    <button class="formulario-finca-cerrar" type="button">✕</button>
                </div>

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

                    <div class="formulario-finca-grupo">
                        <label for="regaFinca">Código REGA (Opcional)</label>
                        <input type="text" id="regaFinca" name="rega" placeholder="Ej: ES-XX-XXXXXX-XXX" maxlength="25" />
                    </div>

                    <div class="formulario-finca-grupo">
                        <label for="ceaFinca">Código CEA (Opcional)</label>
                        <input type="text" id="ceaFinca" name="cea" placeholder="Ej: XX-XXXXX-XX" maxlength="20" />
                    </div>

                    <!-- Botones -->
                    <div class="formulario-finca-botones">
                        <button type="submit" class="btn-primario">
                            Crear Finca
                        </button>
                        <button type="button" class="btn-secundario formulario-finca-cancelar">
                            Cancelar
                        </button>
                    </div>

                    <div class="formulario-finca-mensaje-exito" style="display: none;"></div>
                    <div class="formulario-finca-mensaje-error" style="display: none;"></div>
                </form>
            </div>
        `;

    // Asignar estilos inline si no están en CSS
    this._aplicarEstilos(formulario);

    // Asignar event listeners
    const formElement = formulario.querySelector("#formFinca");
    const btnCerrar = formulario.querySelector(".formulario-finca-cerrar");
    const btnCancelar = formulario.querySelector(".formulario-finca-cancelar");

    formElement.addEventListener("submit", (e) => {
      e.preventDefault();
      this._manejarEnvio(formElement, onSubmit, formulario);
    });

    btnCerrar.addEventListener("click", () => {
      onCancel();
      formulario.remove();
    });

    btnCancelar.addEventListener("click", () => {
      onCancel();
      formulario.remove();
    });

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
      const fincaData = {
        nombre: datos.get("nombre").trim(),
        propietario: datos.get("propietario").trim(),
        direccion: datos.get("direccion").trim(),
        telefonoContacto: datos.get("telefonoContacto").trim(),
        nif_cif: datos.get("nif_cif") ? datos.get("nif_cif").trim() : "",
        email: datos.get("email") ? datos.get("email").trim() : "",
        adsg_nombre: datos.get("adsg_nombre") ? datos.get("adsg_nombre").trim() : "",
        rega: datos.get("rega") ? datos.get("rega").trim().toUpperCase() : "",
        cea: datos.get("cea") ? datos.get("cea").trim().toUpperCase() : "",
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

    return errores;
  },

  /**
   * Aplicar estilos CSS al formulario
   */
  _aplicarEstilos(contenedor) {
    // Estilos movidos a styles.css (v5.0) — ya no se inyectan desde JS
    if (document.getElementById("formulario-finca-styles")) return;
    const marker = document.createElement("meta");
    marker.id = "formulario-finca-styles";
    marker.setAttribute("data-loaded", "css-v5");
    document.head.appendChild(marker);
  },
};

window.FormularioFinca = FormularioFinca;
