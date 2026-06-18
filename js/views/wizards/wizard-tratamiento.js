/**
 * Wizard Tratamiento Sanitario
 * Extraído de app.js para modularización
 */
window.WizardTratamiento = {
  async registrar(rebanoId) {
    if (!window.CatalogoSanitario) {
      App.toastError("Catálogo Sanitario no cargado.");
      return;
    }

    const catalogo = window.CatalogoSanitario.obtenerCatalogo();

    // Agrupar catálogo por categoría para el select
    const categorias = [...new Set(catalogo.map(m => m.categoria))];
    let optionsHtml = '<option value="">-- Seleccionar del Catálogo --</option>';
    categorias.forEach(cat => {
      optionsHtml += `<optgroup label="${cat}">`;
      catalogo.filter(m => m.categoria === cat).forEach(m => {
        optionsHtml += `<option value="${m.id}">${m.principioActivo} (${m.indicacion})</option>`;
      });
      optionsHtml += `</optgroup>`;
    });
    optionsHtml += '<option value="otro">Otro (Ingreso manual)</option>';

    const wizardSteps = [
      {
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">MEDICAMENTO</label>
              <select id="w-san-med" class="wizard-input wizard-select" style="border-color: #10b981;">
                ${optionsHtml}
              </select>
            </div>
            <div class="wizard-input-group" id="w-san-custom-container" style="display:none;">
              <label class="wizard-label">NOMBRE MEDICAMENTO / PRINCIPIO ACTIVO</label>
              <input type="text" id="w-san-custom" class="wizard-input" value="${data.medicamento || ''}">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">ESPERA CARNE (DÍAS)</label>
                <input type="number" id="w-san-carne" class="wizard-input" value="${data.tiempo_espera_carne_dias || 0}">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">ESPERA LECHE (DÍAS)</label>
                <input type="number" id="w-san-leche" class="wizard-input" value="${data.tiempo_espera_leche_dias || 0}">
              </div>
            </div>
            <div id="w-san-alerta-leche" style="display:none; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 10px; margin-bottom: 15px; border-radius: 4px; font-size: 0.8rem; color: #fca5a5;">
                ⚠️ <strong>PROHIBIDO EN LACTACIÓN:</strong> Este medicamento no debe usarse en animales cuya leche se destine a consumo humano.
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA APLICACIÓN</label>
              <input type="date" id="w-san-fecha" class="wizard-input" value="${data.fecha}">
            </div>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
                <button type="button" id="btn-toggle-calc" class="text-blue font-bold flex items-center gap-5 p-0" style="background:transparent; border:none; cursor:pointer;">
                    <span>🧮</span> Abrir Calculadora de Dosis
                </button>
                <div id="calc-dosis-container" class="rounded-md bg-darker" style="display:none; margin-top:15px; padding:15px; border:1px solid #27272a;">
                    <div class="grid grid-cols-2 gap-10">
                        <div class="wizard-input-group">
                            <label class="wizard-label">PESO ANIMAL (KG)</label>
                            <input type="number" id="calc-peso" class="wizard-input" placeholder="Ej: 50">
                        </div>
                        <div class="wizard-input-group">
                            <label class="wizard-label">DOSIS (MG/KG)</label>
                            <input type="number" id="calc-dosis" class="wizard-input" placeholder="Ej: 20">
                        </div>
                    </div>
                    <div class="wizard-input-group">
                        <label class="wizard-label">CONCENTRACIÓN FRASCO (MG/ML)</label>
                        <input type="number" id="calc-conc" class="wizard-input" placeholder="Ej: 200">
                    </div>
                    <button type="button" id="btn-calcular" class="wizard-btn-action w-full" style="background:#27272a; padding:10px; margin-top:5px;">Calcular Volumen</button>
                    <div id="calc-resultado" style="margin-top:15px; text-align:center; font-size:1.2rem; font-weight:bold; display:none;" class="text-green">
                        Inyectar: <span id="calc-vol"></span> ml
                    </div>
                </div>
            </div>
          </div>
        `,
        onRender: (data, stepEl) => {
          const selectMed = stepEl.querySelector('#w-san-med');
          const customContainer = stepEl.querySelector('#w-san-custom-container');
          const inputCarne = stepEl.querySelector('#w-san-carne');
          const inputLeche = stepEl.querySelector('#w-san-leche');
          const alertaLeche = stepEl.querySelector('#w-san-alerta-leche');

          selectMed.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'otro') {
              customContainer.style.display = 'block';
              inputCarne.value = 0;
              inputLeche.value = 0;
              alertaLeche.style.display = 'none';
              data.tipo_tratamiento = 'Otro';
            } else if (val) {
              customContainer.style.display = 'none';
              const med = window.CatalogoSanitario.obtenerMedicamento(val);
              if (med) {
                inputCarne.value = med.retiroCarneDias;
                inputLeche.value = med.retiroLecheDias || 0;
                alertaLeche.style.display = med.prohibidoLeche ? 'block' : 'none';
                if (med.prohibidoLeche) inputLeche.value = 999;
                data.medicamento = med.principioActivo;
                data.tipo_tratamiento = med.categoria;
                data.prohibidoLeche = med.prohibidoLeche;
              }
            } else {
              customContainer.style.display = 'none';
              inputCarne.value = 0;
              inputLeche.value = 0;
              alertaLeche.style.display = 'none';
            }
          });

          const btnToggle = stepEl.querySelector('#btn-toggle-calc');
          const calcContainer = stepEl.querySelector('#calc-dosis-container');
          const btnCalcular = stepEl.querySelector('#btn-calcular');

          btnToggle.addEventListener('click', () => {
            calcContainer.style.display = calcContainer.style.display === 'none' ? 'block' : 'none';
          });

          btnCalcular.addEventListener('click', () => {
            const p = stepEl.querySelector('#calc-peso').value;
            const d = stepEl.querySelector('#calc-dosis').value;
            const c = stepEl.querySelector('#calc-conc').value;
            try {
              const vol = window.CatalogoSanitario.calcularDosisVolumen(p, d, c);
              stepEl.querySelector('#calc-vol').textContent = vol;
              stepEl.querySelector('#calc-resultado').style.display = 'block';
            } catch (err) {
              App.toastError(err.message);
            }
          });
        },
        onChange: async (data) => {
          const selectVal = document.getElementById('w-san-med')?.value;
          if (selectVal === 'otro') {
            data.medicamento = document.getElementById('w-san-custom')?.value.trim();
            data.tipo_tratamiento = 'Otro';
          }
          data.tiempo_espera_carne_dias = parseInt(document.getElementById('w-san-carne')?.value) || 0;
          data.tiempo_espera_leche_dias = parseInt(document.getElementById('w-san-leche')?.value) || 0;
          data.fecha = document.getElementById('w-san-fecha')?.value || data.fecha;
        },
        validate: async (data) => {
          if (!data.medicamento) {
            App.toastError("Debes especificar el medicamento.");
            return false;
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-registro-sanitario',
      title: 'TRATAMIENTO SANITARIO',
      initialData: {
        rebanoId: rebanoId,
        medicamento: "",
        tipo_tratamiento: "Otro",
        fecha: new Date().toISOString().split("T")[0],
        tiempo_espera_carne_dias: 0,
        tiempo_espera_leche_dias: 0,
        prohibidoLeche: false
      },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          await window.Sanitarios.save(finalData);
          App.toast("Tratamiento registrado correctamente.");
          App.renderDetalleRebano(new URLSearchParams(`id=${rebanoId}`));
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  }
};
