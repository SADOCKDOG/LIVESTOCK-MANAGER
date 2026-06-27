/**
 * Wizard Tratamiento Sanitario
 * Extraído de app.js para modularización
 */
window.WizardTratamiento = {
  async registrar(rebanoId, options = {}) {
    if (!window.CatalogoSanitario) {
      App.toastError("Catálogo Sanitario no cargado.");
      return;
    }

    const catalogo = window.CatalogoSanitario.obtenerCatalogo();

    // Catálogos SIGGAN para el libro de tratamientos veterinarios
    const CS = window.ComunidadesService;
    const viasAdmin = CS ? CS.getViasAdministracion() : [];
    const motivosTrat = CS ? CS.getMotivosTratamiento() : [];

    // Veterinario prescriptor por defecto: el de la ADSG de la finca activa
    let vetDefecto = '';
    let vetColegiadoDefecto = '';
    try {
      const finca = window.Fincas ? await window.Fincas.getActive() : null;
      if (finca) {
        vetDefecto = finca.adsg_veterinario || '';
        vetColegiadoDefecto = finca.adsg_vet_colegiado || '';
      }
    } catch (e) { /* sin finca activa */ }

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
              <select id="w-san-med" class="wizard-input wizard-select">
                ${optionsHtml}
              </select>
            </div>
            <div class="wizard-input-group" id="w-san-custom-container" class="d-none">
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
            <div id="w-san-alerta-leche" class="wizard-alert-error d-none">
                ⚠️ <strong>PROHIBIDO EN LACTACIÓN:</strong> Este medicamento no debe usarse en animales cuya leche se destine a consumo humano.
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA APLICACIÓN</label>
              <input type="date" id="w-san-fecha" class="wizard-input" value="${data.fecha}">
            </div>

            <div class="wizard-section-sep">
                <button type="button" id="btn-toggle-calc" class="btn-ghost text-blue font-bold flex items-center gap-5 p-0">
                    <span>🧮</span> Abrir Calculadora de Dosis
                </button>
                <div id="calc-dosis-container" class="rounded-md bg-darker wizard-calc-panel d-none">
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
                    <button type="button" id="btn-calcular" class="wizard-btn-action w-full wizard-calc-btn">Calcular Volumen</button>
                    <div id="calc-resultado" class="wizard-calc-result text-green d-none">
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
      },
      {
        // PASO 2: Libro de Tratamientos Veterinarios (SIGGAN)
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-alert-info">
              📒 <strong>LIBRO DE TRATAMIENTOS VETERINARIOS</strong> · Datos exigidos por el RD 1749/1998 y la tramitación SIGGAN.
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">MOTIVO / DIAGNÓSTICO</label>
              <select id="w-san-motivo" class="wizard-input wizard-select">
                ${motivosTrat.map(m => `<option value="${m.value}" ${data.motivo_tratamiento === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº ANIMALES TRATADOS</label>
                <input type="number" min="1" id="w-san-num-animales" class="wizard-input" value="${data.num_animales_tratados || 1}">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">VÍA DE ADMINISTRACIÓN</label>
                <select id="w-san-via" class="wizard-input wizard-select">
                  ${viasAdmin.map(v => `<option value="${v.value}" ${data.via_administracion === v.value ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº LOTE MEDICAMENTO</label>
                <input type="text" id="w-san-lote" class="wizard-input" value="${data.lote_medicamento || ''}" placeholder="Ej: L-23A45">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CADUCIDAD MEDICAMENTO</label>
                <input type="date" id="w-san-caducidad" class="wizard-input" value="${data.caducidad_medicamento || ''}">
              </div>
            </div>
            <div class="wizard-section-sep-sm">
              <label class="wizard-label text-green mb-8">VETERINARIO PRESCRIPTOR</label>
              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                  <label class="wizard-label">NOMBRE</label>
                  <input type="text" id="w-san-vet" class="wizard-input" value="${data.veterinario_prescriptor || ''}" placeholder="Nombre y apellidos">
                </div>
                <div class="wizard-input-group">
                  <label class="wizard-label">Nº COLEGIADO</label>
                  <input type="text" id="w-san-vet-col" class="wizard-input" value="${data.veterinario_colegiado || ''}" placeholder="Nº colegiado">
                </div>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº RECETA / PRESCRIPCIÓN</label>
                <input type="text" id="w-san-receta" class="wizard-input" value="${data.numero_receta || ''}" placeholder="Nº de receta veterinaria">
              </div>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.motivo_tratamiento = document.getElementById('w-san-motivo')?.value || data.motivo_tratamiento;
          data.num_animales_tratados = parseInt(document.getElementById('w-san-num-animales')?.value, 10) || 1;
          data.via_administracion = document.getElementById('w-san-via')?.value || data.via_administracion;
          data.lote_medicamento = document.getElementById('w-san-lote')?.value.trim() || '';
          data.caducidad_medicamento = document.getElementById('w-san-caducidad')?.value || '';
          data.veterinario_prescriptor = document.getElementById('w-san-vet')?.value.trim() || '';
          data.veterinario_colegiado = document.getElementById('w-san-vet-col')?.value.trim() || '';
          data.numero_receta = document.getElementById('w-san-receta')?.value.trim() || '';
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
        prohibidoLeche: false,
        motivo_tratamiento: 'profilaxis',
        num_animales_tratados: 1,
        via_administracion: 'intramuscular',
        lote_medicamento: '',
        caducidad_medicamento: '',
        veterinario_prescriptor: vetDefecto,
        veterinario_colegiado: vetColegiadoDefecto,
        numero_receta: '',
        origen_modulo: options.origen_modulo || null,
        modo_explotacion: options.modo_explotacion || null
      },
      steps: wizardSteps,
      onComplete: async (finalData) => {
        try {
          await window.Sanitarios.save(finalData);
          App.toast("Tratamiento registrado correctamente.");
          if (options.returnTo === 'explotacion') {
            await ExplotacionView.render();
          } else {
            App.renderDetalleRebano(new URLSearchParams(`id=${rebanoId}`));
          }
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  }
};
