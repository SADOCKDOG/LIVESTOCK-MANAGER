/**
 * Wizard Gasto Analítico
 * Extraído de app.js para modularización (Fase 3)
 */
window.GastoWizard = {
  async open(options = {}) {
    const App = window.App;
    if (!App) return console.error("App no disponible");

    const fincaId = await window.Fincas.getActiveId();
    const rebanos = await window.Rebanos.list();
    const finca = await window.Fincas.getActive();
    const zonas = finca.zonas || [];
    const proveedores = window.Proveedores ? await window.Proveedores.list({ activo: true }).catch(() => []) : [];

    const wizardSteps = [
      {
        content: (data) => `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">PROVEEDOR</label>
              <select id="w-g-prov" class="wizard-input wizard-select">
                <option value="">Sin proveedor asignado</option>
                ${(data._proveedores || []).map(p =>
                  `<option value="${p.id}" ${data.proveedorId === p.id ? 'selected' : ''}>${p.nombre}${p.nif_cif ? ' ('+p.nif_cif+')' : ''}</option>`
                ).join('')}
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CONCEPTO / FACTURA</label>
              <input type="text" id="w-g-con" value="${data.concepto}" placeholder="Ej: Pienso Terneros..." class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">MONTO TOTAL (€)</label>
              <input type="number" id="w-g-mon" value="${data.monto}" step="0.01" class="wizard-input" style="border-color: #3b82f6;">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CATEGORÍA CONTABLE</label>
              <select id="w-g-cat" class="wizard-input wizard-select">
                  <option value="Alimentacion" ${data.categoria === 'Alimentacion' ? 'selected' : ''}>🌾 Alimentación</option>
                  <option value="Sanidad" ${data.categoria === 'Sanidad' ? 'selected' : ''}>💉 Sanidad</option>
                  <option value="Fitosanitarios" ${data.categoria === 'Fitosanitarios' ? 'selected' : ''}>🌱 Fitosanitarios</option>
                  <option value="Electricidad" ${data.categoria === 'Electricidad' ? 'selected' : ''}>⚡ Electricidad</option>
                  <option value="Personal" ${data.categoria === 'Personal' ? 'selected' : ''}>👷 Personal</option>
                  <option value="Amortizacion" ${data.categoria === 'Amortizacion' ? 'selected' : ''}>🚜 Amortización</option>
              </select>
            </div>
            <div id="w-g-imputacion-area" style="background: #18181b; padding: 20px; border-radius: 16px; border: 2px solid #27272a;">
                <!-- Dinámico -->
            </div>
            <div id="w-g-cumplimiento-area" style="background: #111827; padding: 14px; border-radius: 12px; border: 1px solid #1f2937; margin-top: 10px; display:none;">
              <div class="wizard-label text-blue mb-8">CONTROL NORMATIVO FITOSANITARIO</div>
              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                  <label class="wizard-label">Registro producto</label>
                  <input type="text" id="w-g-fit-reg" value="${(data.controlNormativo && data.controlNormativo.registroProducto) || ''}" class="wizard-input" placeholder="Nº registro">
                </div>
                <div class="wizard-input-group">
                  <label class="wizard-label">Dosis aplicada</label>
                  <input type="text" id="w-g-fit-dosis" value="${(data.controlNormativo && data.controlNormativo.dosisAplicada) || ''}" class="wizard-input" placeholder="Ej: 1.5 L/ha">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-10">
                <div class="wizard-input-group">
                  <label class="wizard-label">Plazo seguridad (días)</label>
                  <input type="number" min="0" id="w-g-fit-plazo" value="${(data.controlNormativo && Number.isFinite(data.controlNormativo.plazoSeguridadDias)) ? data.controlNormativo.plazoSeguridadDias : 0}" class="wizard-input">
                </div>
                <div class="wizard-input-group">
                  <label class="wizard-label">Apto comercialización</label>
                  <select id="w-g-fit-apto" class="wizard-input wizard-select">
                    <option value="true" ${(data.controlNormativo?.aptoComercializacion !== false) ? 'selected' : ''}>Sí</option>
                    <option value="false" ${(data.controlNormativo?.aptoComercializacion === false) ? 'selected' : ''}>No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        `,
        onRender: (data, stepEl) => {
          const sel = stepEl.querySelector("#w-g-cat");
          const area = stepEl.querySelector("#w-g-imputacion-area");
          const complianceArea = stepEl.querySelector("#w-g-cumplimiento-area");

          const updateArea = () => {
            if (sel.value === "Alimentacion" || sel.value === "Sanidad") {
              if (complianceArea) complianceArea.style.display = 'none';
              area.innerHTML = `
                  <div class="wizard-input-group mb-0">
                    <label class="wizard-label text-gold">OBLIGATORIO: ASOCIAR REBAÑO</label>
                    <select id="w-g-reb" class="wizard-input wizard-select bg-card border-gold">
                      ${rebanos.map((r) => `<option value="${r.id}" ${data.rebanoId == r.id ? 'selected' : ''}>${r.nombre} (${r.especie})</option>`).join("")}
                    </select>
                  </div>`;
            } else if (sel.value === "Fitosanitarios" || sel.value === "Electricidad") {
              if (complianceArea) complianceArea.style.display = sel.value === "Fitosanitarios" ? 'block' : 'none';
              area.innerHTML = `
                  <div class="wizard-input-group mb-0">
                    <label class="wizard-label text-green">OBLIGATORIO: ASOCIAR ZONA</label>
                    <select id="w-g-zon" class="wizard-input wizard-select bg-card border-green">
                      ${zonas.map((z) => `<option value="${z.nombre}" ${data.snap_zona === z.nombre ? 'selected' : ''}>${z.nombre}</option>`).join("")}
                    </select>
                  </div>`;
            } else {
              if (complianceArea) complianceArea.style.display = 'none';
              area.innerHTML = `<p class="text-base text-gray m-0 text-center font-bold">Este gasto se imputará como General de Finca.</p>`;
            }
          };

          sel.addEventListener("change", () => {
            data.rebanoId = null;
            data.snap_zona = null;
            updateArea();
          });
          updateArea();
        },
        onChange: async (data) => {
          data.proveedorId = parseInt(document.getElementById('w-g-prov')?.value) || null;
          data.concepto = document.getElementById('w-g-con')?.value.trim() || data.concepto;
          data.monto = parseFloat(document.getElementById('w-g-mon')?.value) || 0;
          data.categoria = document.getElementById('w-g-cat')?.value || data.categoria;

          if (data.categoria === "Alimentacion" || data.categoria === "Sanidad") {
            data.rebanoId = parseInt(document.getElementById('w-g-reb')?.value) || null;
          } else if (data.categoria === "Fitosanitarios" || data.categoria === "Electricidad") {
            data.snap_zona = document.getElementById('w-g-zon')?.value || null;
          }
          data.controlNormativo = {
            ...(data.controlNormativo || {}),
            registroProducto: document.getElementById('w-g-fit-reg')?.value?.trim() || '',
            dosisAplicada: document.getElementById('w-g-fit-dosis')?.value?.trim() || '',
            plazoSeguridadDias: parseInt(document.getElementById('w-g-fit-plazo')?.value, 10) || 0,
            aptoComercializacion: (document.getElementById('w-g-fit-apto')?.value || 'true') === 'true'
          };
        },
        validate: async (data) => {
          if (!data.concepto) {
            App.toastError("El concepto del gasto es obligatorio");
            return false;
          }
          if (data.monto <= 0) {
            App.toastError("El monto debe ser mayor a 0");
            return false;
          }
          if (data.categoria === "Fitosanitarios") {
            if (!data.controlNormativo?.registroProducto) {
              App.toastError("El registro del producto fitosanitario es obligatorio");
              return false;
            }
            if (!data.controlNormativo?.dosisAplicada) {
              App.toastError("La dosis aplicada del fitosanitario es obligatoria");
              return false;
            }
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-nuevo-gasto',
      title: 'GASTO ANALÍTICO',
      initialData: {
        concepto: "",
        monto: 0,
        categoria: options.categoria || "Alimentacion",
        rebanoId: null,
        snap_zona: null,
        proveedorId: null,
        origenModulo: options.origenModulo || 'general',
        modoExplotacion: options.modoExplotacion || null,
        controlNormativo: options.controlNormativo || {},
        _proveedores: proveedores
      },
      steps: wizardSteps,
      onComplete: async (data) => {
        try {
          const gasto = {
            concepto: data.concepto,
            monto: data.monto,
            categoria: data.categoria,
            fecha: new Date().toISOString().split("T")[0],
            fincaId: fincaId,
            proveedorId: data.proveedorId || null,
            origen_modulo: data.origenModulo || 'general',
            modo_explotacion: data.modoExplotacion || null
          };
          if (data.categoria === "Alimentacion" || data.categoria === "Sanidad") {
            const r = rebanos.find((x) => x.id === data.rebanoId);
            if (r) {
              gasto.rebanoId = r.id;
              gasto.snap_zona = r.zonaActual;
              gasto.snap_especie = r.especie;
              gasto.snap_tipo = r.tipo;
            }
          } else if (data.categoria === "Fitosanitarios" || data.categoria === "Electricidad") {
            gasto.snap_zona = data.snap_zona;
          }
          if (data.categoria === "Fitosanitarios") {
            gasto.control_normativo = {
              registroProducto: data.controlNormativo?.registroProducto || '',
              dosisAplicada: data.controlNormativo?.dosisAplicada || '',
              plazoSeguridadDias: data.controlNormativo?.plazoSeguridadDias || 0,
              aptoComercializacion: data.controlNormativo?.aptoComercializacion !== false,
              verificadoEn: new Date().toISOString()
            };
          }
          await Gastos.save(gasto);
          App.toast("Gasto imputado analíticamente.");
          App.renderGastos();
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  }
};
