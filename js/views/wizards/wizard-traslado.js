/**
 * Wizard Traslado de Animales
 * Extraído de app.js para modularización
 */
window.WizardTraslado = {
  async abrirSelectorAnimales(rebanoId) {
    const allAnimales = await Animales.list();
    const rebano = await Rebanos.get(rebanoId);
    const overlay = document.createElement("div");
    overlay.id = "selector-animales-overlay";
    overlay.style =
      "position:fixed; top:0; left:0; right:0; bottom:0; background:#000; z-index:3000; display:flex; align-items:center; justify-content:center; padding: 0;";
    overlay.innerHTML = `<div class="card w-full p-25 flex flex-col" style="height: 100%; max-width: none; max-height: none; border-radius: 0; border: none; background: #0a0a0a; box-sizing: border-box;">
            <h2 class="m-0">Traslado de Animales</h2><p class="text-sm text-gray">Destino: ${rebano.nombre}</p>
            <div class="flex-1 p-10 rounded-sm bg-card" style="margin:15px 0; overflow-y:auto; border:1px solid #444;">
                ${allAnimales
        .map(
          (a) =>
            `<label class="flex items-center gap-10 p-10" style="border-bottom: 1px solid #333; cursor:pointer;"><input type="checkbox" value="${a.id
            }" ${a.rebanoId == rebanoId ? "checked disabled" : ""
            } class="animal-chk"><span style="${a.rebanoId == rebanoId ? "color:#fbbf24" : ""
            }">${a.numero_identificacion} (${a.raza})</span></label>`
        )
        .join("")}
            </div>
            <div class="flex gap-10 mt-20"><button class="btn btn-primary flex-1" id="btn-move-confirm">Guardar Traslado</button><button class="btn btn-secondary flex-1" onclick="document.getElementById('selector-animales-overlay').remove()">Cancelar</button></div>
        </div>`;
    document.body.appendChild(overlay);
    overlay
      .querySelector("#btn-move-confirm")
      .addEventListener("click", async () => {
        const ids = Array.from(
          overlay.querySelectorAll(".animal-chk:checked:not(:disabled)")
        ).map((c) => parseInt(c.value));
        try {
          await Trazabilidad.validarAforoZona(
            window.db,
            rebano.zonaActual,
            ids.length
          );
          for (let id of ids) {
            const a = await Animales.get(id);
            a.rebanoId = rebanoId;
            await Animales.save(a);
          }
          App.toast("Traslado completado");
          overlay.remove();
          App.renderDetalleRebano(new URLSearchParams(`id=${rebanoId}`));
        } catch (e) {
          alert(e.message);
        }
      });
  }
};
