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
          <div class="card card-accent card-accent-green p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-success)">DATOS DEL MEDICAMENTO</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">SELECCIÓN DE CATÁLOGO</label>
              <select id="w-san-med" class="wizard-input font-800">
                ${optionsHtml}
              </select>
            </div>
            <div class="wizard-input-group mb-12" id="w-san-custom-container" style="display:none;">
              <label class="wizard-label">NOMBRE / PRINCIPIO ACTIVO</label>
              <input type="text" id="w-san-custom" class="wizard-input uppercase font-800" value="${data.medicamento || ''}">
            </div>
            <div class="grid grid-cols-2 gap-12 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">ESPERA CARNE (DÍAS)</label>
                <input type="number" id="w-san-carne" class="wizard-input font-900 text-lg" value="${data.tiempo_espera_carne_dias || 0}">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">ESPERA LECHE (DÍAS)</label>
                <input type="number" id="w-san-leche" class="wizard-input font-900 text-lg" value="${data.tiempo_espera_leche_dias || 0}">
              </div>
            </div>
            <div id="w-san-alerta-leche" class="p-10 bg-red-900 border-red-500 border rounded-sm mb-12 d-none">
                <div class="text-white font-950 text-[0.6rem] uppercase tracking-tighter leading-tight">PROHIBIDO EN LACTACIÓN: NO DESTINAR LECHE A CONSUMO HUMANO</div>
            </div>
            <div class="wizard-input-group mb-16">
              <label class="wizard-label">FECHA APLICACIÓN</label>
              <input type="date" id="w-san-fecha" class="wizard-input font-800" value="${data.fecha}">
            </div>

            <div class="border-top-222 pt-12">
                <button type="button" id="btn-toggle-calc" class="widget-link-btn widget-link-btn--neon neon-info w-full px-12 py-8 min-h-0 h-auto">
                    <span class="text-[0.65rem] font-950 uppercase">Abrir Calculadora de Dosis</span>
                </button>
                <div id="calc-dosis-container" class="mt-15 p-12 bg-black border border-222 rounded-sm d-none">
                    <div class="grid grid-cols-2 gap-10 mb-12">
                        <div class="wizard-input-group">
                            <label class="wizard-label">PESO (KG)</label>
                            <input type="number" id="calc-peso" class="wizard-input font-800" placeholder="50">
                        </div>
                        <div class="wizard-input-group">
                            <label class="wizard-label">DOSIS (MG/KG)</label>
                            <input type="number" id="calc-dosis" class="wizard-input font-800" placeholder="20">
                        </div>
                    </div>
                    <div class="wizard-input-group mb-12">
                        <label class="wizard-label">CONCENTRACIÓN (MG/ML)</label>
                        <input type="number" id="calc-conc" class="wizard-input font-800" placeholder="200">
                    </div>
                    <button type="button" id="btn-calcular" class="widget-link-btn widget-link-btn--neon neon-success w-full px-12 py-8 min-h-0 h-auto">
                        <span class="text-[0.65rem] font-950 uppercase">CALCULAR</span>
                    </button>
                    <div id="calc-resultado" class="mt-10 text-center d-none">
                        <div class="text-aaa uppercase font-900 text-[0.55rem]">VOLUMEN A INYECTAR:</div>
                        <div class="text-green font-950 text-xl"><span id="calc-vol"></span> ML</div>
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
          <div class="card card-accent card-accent-blue p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--c-info)">${Icons.libroVentas()} LIBRO DE TRATAMIENTOS</div>
            <p class="text-aaa uppercase font-900 text-[0.55rem] tracking-widest mb-12 opacity-80 text-center">DATOS EXIGIDOS POR RD 1749/1998 Y SIGGAN</p>

            <div class="wizard-input-group mb-12">
              <label class="wizard-label">MOTIVO / DIAGNÓSTICO</label>
              <select id="w-san-motivo" class="wizard-input font-800">
                ${motivosTrat.map(m => `<option value="${m.value}" ${data.motivo_tratamiento === m.value ? 'selected' : ''}>${m.label.toUpperCase()}</option>`).join('')}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-12 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº ANIMALES</label>
                <input type="number" min="1" id="w-san-num-animales" class="wizard-input font-800" value="${data.num_animales_tratados || 1}">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">VÍA ADMIN.</label>
                <select id="w-san-via" class="wizard-input font-800">
                  ${viasAdmin.map(v => `<option value="${v.value}" ${data.via_administracion === v.value ? 'selected' : ''}>${v.label.toUpperCase()}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-12 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº LOTE MED.</label>
                <input type="text" id="w-san-lote" class="wizard-input uppercase font-800" value="${data.lote_medicamento || ''}" placeholder="L-00A">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CADUCIDAD</label>
                <input type="date" id="w-san-caducidad" class="wizard-input font-800" value="${data.caducidad_medicamento || ''}">
              </div>
            </div>

            <div class="border-top-222 pt-12 mt-4">
              <div class="text-[0.6rem] text-gold font-950 uppercase tracking-widest mb-10 text-center">VETERINARIO PRESCRIPTOR</div>
              <div class="grid grid-cols-2 gap-12 mb-12">
                <div class="wizard-input-group">
                  <label class="wizard-label">NOMBRE</label>
                  <input type="text" id="w-san-vet" class="wizard-input uppercase font-800" value="${data.veterinario_prescriptor || ''}" placeholder="NOMBRE">
                </div>
                <div class="wizard-input-group">
                  <label class="wizard-label">Nº COL.</label>
                  <input type="text" id="w-san-vet-col" class="wizard-input font-800" value="${data.veterinario_colegiado || ''}" placeholder="0000">
                </div>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº RECETA / PRESCRIPCIÓN</label>
                <input type="text" id="w-san-receta" class="wizard-input uppercase font-900" value="${data.numero_receta || ''}" placeholder="Nº OFICIAL">
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
            if (window.ExplotacionView) {
              ExplotacionView.invalidateCache?.();
              await ExplotacionView.render();
            }
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
