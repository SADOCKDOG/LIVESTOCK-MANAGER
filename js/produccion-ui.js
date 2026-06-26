/**
 * Livestock Manager - Módulo de UI para Producción
 * Contiene el Asistente de Registro Maestro para unificar la entrada de datos.
 */

const ProduccionUI = {
  /**
   * Inicia el Asistente de Registro Maestro.
   * @param {string} [operacionPreseleccionada] - Si se proporciona ('carne'|'leche'|'venta_masiva'|'gasto'),
   *   salta la selección de tipo y abre directamente el flujo correspondiente.
   */
  iniciarAsistente(operacionPreseleccionada, options = {}) {
    window.__registroContext = {
      ...(window.__registroContext || {}),
      origen_modulo: options.origen_modulo || null,
      modo_explotacion: options.modo_explotacion || null
    };
    // Atajos directos: estos tipos abren su propio formulario/wizard dedicado
    if (operacionPreseleccionada === 'venta_masiva') {
      if (window.App) window.App._abrirWizardVentaMasiva();
      return;
    }
    if (operacionPreseleccionada === 'gasto') {
      if (window.App) window.App._abrirFormularioGasto({
        origenModulo: options.origen_modulo || 'general',
        modoExplotacion: options.modo_explotacion || null
      });
      return;
    }

    const wizardSteps = [
      // Paso 1: Seleccionar Área
      {
        content: (data) => `
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-top:5px;">
            <button class="wizard-btn-action" style="padding: 15px 10px; flex-direction:column; border: 3px solid transparent; text-align:center;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'carne'; this.style.borderColor = '#fbbf24';">
              <span style="font-size: 2rem; margin-bottom: 8px;">⚖️</span>
              <span style="font-size: 0.85rem; line-height: 1.2;">Producción<br>Cárnica (kg)</span>
            </button>
            <button class="wizard-btn-action" style="padding: 15px 10px; flex-direction:column; border: 3px solid transparent; text-align:center;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'leche'; this.style.borderColor = '#fbbf24';">
              <span style="font-size: 2rem; margin-bottom: 8px;">🥛</span>
              <span style="font-size: 0.85rem; line-height: 1.2;">Producción<br>Láctea (L)</span>
            </button>
            <button class="wizard-btn-action wizard-btn-danger" style="padding: 15px 10px; flex-direction:column; border: 3px solid transparent; text-align:center;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'venta_masiva'; this.style.borderColor = '#fbbf24';">
              <span style="font-size: 2rem; margin-bottom: 8px;">🚚</span>
              <span style="font-size: 0.85rem; line-height: 1.2;">Venta Masiva<br>Matadero</span>
            </button>
            <button class="wizard-btn-action" style="padding: 15px 10px; flex-direction:column; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: 3px solid transparent; text-align:center;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'gasto'; this.style.borderColor = '#fbbf24';">
              <span style="font-size: 2rem; margin-bottom: 8px;">🧾</span>
              <span style="font-size: 0.85rem; line-height: 1.2;">Gasto<br>Analítico</span>
            </button>
          </div>
        `,
        onChange: async (data) => {
          const selected = document.querySelector('.wizard-btn-action[data-selected]');
          if (selected) data.operacion = selected.dataset.selected;
        },
        validate: async (data) => {
          if (!data.operacion) {
            App.toastError("Debes seleccionar una opción");
            return false;
          }
          // Si es un flujo que no necesita selección de animal, saltamos a su módulo específico y matamos este wizard
          if (data.operacion === 'venta_masiva') {
            App._abrirWizardVentaMasiva();
            document.getElementById('wizard-produccion-maestro').remove();
            return false;
          }
          if (data.operacion === 'gasto') {
            App._abrirFormularioGasto({
              origenModulo: options.origen_modulo || 'general',
              modoExplotacion: options.modo_explotacion || null
            });
            document.getElementById('wizard-produccion-maestro').remove();
            return false;
          }
          return true; // Continúa al Paso 2 para flujos de Producción (Carne/Leche)
        },
      },
      // Paso 2: Seleccionar Modalidad (Individual / Lote / Tanque)
      {
        content: (data) => `<div id="opciones-modalidad" style="display:flex; flex-direction:column; gap:20px; margin-top:15px; text-align:center;"></div>`,
        onRender: (data, stepEl) => {
          const container = stepEl.querySelector('#opciones-modalidad');
          let html = '';
          if (data.operacion === 'carne') {
            html += `
                <button class="wizard-btn-action" style="padding: 20px; border: 3px solid transparent;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'individual'; this.style.borderColor = '#fbbf24';">
                  <span style="font-size: 1.8rem; margin-right: 15px;">👤</span>
                  <span style="font-size: 0.95rem;">Pesada Individual (Animal)</span>
                </button>
                <button class="wizard-btn-action" style="padding: 20px; border: 3px solid transparent;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'lote'; this.style.borderColor = '#fbbf24';">
                  <span style="font-size: 1.8rem; margin-right: 15px;">🐄</span>
                  <span style="font-size: 0.95rem;">Pesaje por Lote (Rebaño)</span>
                </button>
             `;
          } else if (data.operacion === 'leche') {
            html += `
                <button class="wizard-btn-action" style="padding: 15px; border: 3px solid transparent;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'individual'; this.style.borderColor = '#fbbf24';">
                  <span style="font-size: 1.5rem; margin-right: 12px;">👤</span>
                  <span style="font-size: 0.9rem;">Control Lechero Individual</span>
                </button>
                <button class="wizard-btn-action" style="padding: 15px; border: 3px solid transparent;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'lote'; this.style.borderColor = '#fbbf24';">
                  <span style="font-size: 1.5rem; margin-right: 12px;">🐄</span>
                  <span style="font-size: 0.9rem;">Control Lechero de Lote</span>
                </button>
                <button class="wizard-btn-action" style="padding: 15px; border: 3px solid transparent;" onclick="this.parentElement.querySelectorAll('button').forEach(b => { delete b.dataset.selected; b.style.borderColor = 'transparent'; }); this.dataset.selected = 'tanque'; this.style.borderColor = '#fbbf24';">
                  <span style="font-size: 1.5rem; margin-right: 12px;">🚛</span>
                  <span style="font-size: 0.9rem;">Expedición de Tanque</span>
                </button>
             `;
          }
          container.innerHTML = html;
        },
        onChange: async (data) => {
          const selected = document.querySelector('#opciones-modalidad .wizard-btn-action[data-selected]');
          if (selected) data.tipo_objetivo = selected.dataset.selected;
        },
        validate: async (data) => {
          if (!data.tipo_objetivo) {
            App.toastError("Debes seleccionar una modalidad");
            return false;
          }
          if (data.tipo_objetivo === 'tanque') {
            window.PesajesUI.abrirWizard({ modo: 'leche_tanque' });
            document.getElementById('wizard-produccion-maestro').remove();
            return false;
          }
          return true;
        }
      },
      // Paso 3: Buscar y Seleccionar Entidad (Buscador Integrado)
      {
        content: (data) => `
          <div style="display:flex; flex-direction:column; height: 100%; gap: 15px; margin-top:10px;">
              <input type="text" id="search-entity" placeholder="🔍 Buscar por nombre, raza o crotal..." class="wizard-input">
              <div id="entity-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px; min-height: 40vh; padding-right: 5px;">
                  <div class="text-gray text-center p-20">Cargando registros...</div>
              </div>
          </div>
        `,
        onRender: async (data, stepEl) => {
          const searchInput = stepEl.querySelector('#search-entity');
          const listEl = stepEl.querySelector('#entity-list');

          let items = [];
          if (data.tipo_objetivo === 'individual') {
            const animales = await window.Animales.list();
            if (data.operacion === 'leche') {
              items = animales.filter(a => (a.sexo === 'H' || (a.sexo || '').toUpperCase().startsWith('H')) && ['Vacas', 'Ovejas', 'Cabras'].includes(a.especie));
            } else {
              items = animales;
            }
          } else if (data.tipo_objetivo === 'lote') {
            const rebanos = await window.Rebanos.list();
            if (data.operacion === 'leche') {
              items = rebanos.filter(r => ['Vacas', 'Ovejas', 'Cabras'].includes(r.especie));
            } else {
              items = rebanos;
            }
          }

          const renderList = (filterText = '') => {
            const text = filterText.toLowerCase();
            const filtered = items.filter(i => {
              const searchStr = data.tipo_objetivo === 'individual' ? `${i.numero_identificacion} ${i.raza}` : `${i.nombre} ${i.especie} ${i.zonaActual}`;
              return searchStr.toLowerCase().includes(text);
            });

            if (filtered.length === 0) {
              listEl.innerHTML = `<div class="text-gray text-center p-20">No se encontraron resultados</div>`;
              return;
            }

            listEl.innerHTML = filtered.map(i => {
              const id = i.id;
              const title = data.tipo_objetivo === 'individual' ? i.numero_identificacion : i.nombre;
              const subtitle = data.tipo_objetivo === 'individual' ? `${i.especie} - ${i.raza}` : `${i.especie} - ${i.tipo}`;
              const selectedStyle = data.selectedEntityId === id ? 'border-color: #fbbf24;' : 'border-color: #27272a;';
              const checkStyle = data.selectedEntityId === id ? 'border-color: #fbbf24; background: #d97706; color: white;' : 'border-color: #555; background: transparent; color: transparent;';

              return `
                      <div class="entity-item card" data-id="${id}" style="padding:15px; border: 2px solid; ${selectedStyle} cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition: all 0.2s;">
                          <div>
                              <div style="font-weight:900; font-size:1.1rem;" class="text-white">${title}</div>
                              <div class="text-gray" style="font-size:0.8rem; margin-top: 4px;">${subtitle}</div>
                          </div>
                          <div class="entity-check" style="width:26px; height:26px; border-radius:50%; border:2px solid; ${checkStyle} display:flex; align-items:center; justify-content:center; font-weight:bold;">
                              ${data.selectedEntityId === id ? '✓' : ''}
                          </div>
                      </div>
                  `;
            }).join('');

            listEl.querySelectorAll('.entity-item').forEach(el => {
              el.onclick = () => {
                data.selectedEntityId = parseInt(el.dataset.id);
                renderList(searchInput.value);
              };
            });
          };

          searchInput.oninput = (e) => renderList(e.target.value);
          renderList();
        },
        onChange: async (data) => { },
        validate: async (data) => {
          if (!data.selectedEntityId) {
            App.toastError("Debes seleccionar un registro de la lista");
            return false;
          }
          return true;
        }
      }
    ];

    // Si hay operación preseleccionada, saltamos el paso de selección de tipo
    const stepsToUse = operacionPreseleccionada
      ? wizardSteps.slice(1)
      : wizardSteps;
    const initialData = operacionPreseleccionada
      ? { selectedEntityId: null, operacion: operacionPreseleccionada }
      : { selectedEntityId: null };

    window.WizardManager.create({
      id: 'wizard-produccion-maestro',
      title: 'Asistente de Registro',
      steps: stepsToUse,
      initialData: initialData,
      onComplete: async (data) => {
        // Genera la cadena de configuración para el Motor de Pesajes (ej: "carne_ind" o "leche_lote")
        const modo = data.operacion + '_' + (data.tipo_objetivo === 'individual' ? 'ind' : 'lote');

        const config = { modo: modo };
        if (data.tipo_objetivo === 'individual') config.animalId = data.selectedEntityId;
        if (data.tipo_objetivo === 'lote') config.rebanoId = data.selectedEntityId;

        // Transición perfecta: Cierra este Wizard y abre el de Pesajes rellenado y listo
        window.PesajesUI.abrirWizard(config);
      },
    });
  },
};

window.ProduccionUI = ProduccionUI;