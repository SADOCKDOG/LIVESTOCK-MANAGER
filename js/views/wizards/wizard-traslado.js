/**
 * Wizard Traslado de Animales
 * Extraído de app.js para modularización.
 * Refactorizado para usar el framework WizardManager (multi-paso),
 * unificando la experiencia visual con el resto de asistentes.
 */
window.WizardTraslado = {
  async abrirSelectorAnimales(rebanoId) {
    const App = window.App;
    if (!App) return console.error("App no disponible");

    if (!window.WizardManager) {
      App.toastError("Wizard de traslado no disponible");
      return;
    }

    const allAnimales = await Animales.list();
    const rebano = await Rebanos.get(rebanoId);

    if (!rebano) {
      App.toastError("Rebaño destino no encontrado");
      return;
    }

    const wizardSteps = [
      {
        // PASO 1: Selección de animales a trasladar
        content: (data) => `
          <div class="mt-10">
            <p class="text-sm text-gray m-0 mb-10">Destino: <span class="text-gold font-bold">${data.rebano.nombre}</span></p>
            <div class="wizard-input-group">
              <label class="wizard-label">SELECCIONA LOS ANIMALES A TRASLADAR</label>
              <div id="w-tras-list" class="rounded-sm bg-card" style="max-height: 55vh; overflow-y:auto; border:1px solid #444;">
                ${data.allAnimales.map((a) => {
                  const yaEnRebano = a.rebanoId == data.rebano.id;
                  const checked = yaEnRebano || data.selectedIds.includes(a.id);
                  return `<label class="flex items-center gap-10 p-10" style="border-bottom: 1px solid #333; cursor:pointer;">
                    <input type="checkbox" value="${a.id}" ${checked ? "checked" : ""} ${yaEnRebano ? "disabled" : ""} class="w-tras-chk">
                    <span style="${yaEnRebano ? "color:#fbbf24" : ""}">${a.numero_identificacion} (${a.raza})${yaEnRebano ? " · ya en destino" : ""}</span>
                  </label>`;
                }).join("")}
              </div>
            </div>
          </div>
        `,
        onChange: async (data) => {
          const checks = document.querySelectorAll(".w-tras-chk:checked:not(:disabled)");
          data.selectedIds = Array.from(checks).map((c) => parseInt(c.value, 10));
        },
        validate: async (data) => {
          if (!data.selectedIds || data.selectedIds.length === 0) {
            App.toastError("Selecciona al menos un animal para trasladar");
            return false;
          }
          return true;
        }
      },
      {
        // PASO 2: Confirmación del traslado
        content: (data) => {
          const seleccionados = data.allAnimales.filter((a) => data.selectedIds.includes(a.id));
          return `
            <div class="mt-10">
              <div class="wizard-input-group">
                <label class="wizard-label">RESUMEN DEL TRASLADO</label>
                <div class="bg-card rounded-sm p-10" style="border:1px solid #444;">
                  <p class="m-0 text-sm">Rebaño destino: <span class="text-gold font-bold">${data.rebano.nombre}</span></p>
                  <p class="m-0 text-sm">Zona destino: <span class="font-bold">${data.rebano.zonaActual || "—"}</span></p>
                  <p class="m-0 text-sm">Animales a trasladar: <span class="font-bold">${seleccionados.length}</span></p>
                </div>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">ANIMALES SELECCIONADOS</label>
                <div class="rounded-sm bg-card" style="max-height: 40vh; overflow-y:auto; border:1px solid #444;">
                  ${seleccionados.map((a) =>
                    `<div class="p-10 text-sm" style="border-bottom: 1px solid #333;">${a.numero_identificacion} (${a.raza})</div>`
                  ).join("")}
                </div>
              </div>
            </div>
          `;
        }
      }
    ];

    window.WizardManager.create({
      id: "selector-animales-overlay",
      title: "Traslado de Animales",
      initialData: {
        rebano,
        allAnimales,
        selectedIds: []
      },
      steps: wizardSteps,
      onComplete: async (data) => {
        try {
          await Trazabilidad.validarAforoZona(
            window.db,
            data.rebano.zonaActual,
            data.selectedIds.length
          );
          for (let id of data.selectedIds) {
            const a = await Animales.get(id);
            a.rebanoId = data.rebano.id;
            await Animales.save(a);
          }
          App.toast("Traslado completado");
          App.renderDetalleRebano(new URLSearchParams(`id=${data.rebano.id}`));
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  }
};
