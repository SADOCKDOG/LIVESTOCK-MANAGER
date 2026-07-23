/**
 * MargenAnimal — Livestock Manager
 * Cálculo de coste (compra + sanidad prorrateada) vs. ingreso (leche
 * estimada + venta) por animal, acumulado histórico. Ver
 * docs/superpowers/specs/2026-07-23-margen-economico-animal-design.md.
 * Módulo de solo cálculo, sin UI propia.
 */
const MargenAnimal = {
  /**
   * Mapa origen_tipo:origen_id -> suma de costeTotal de los eventos de
   * consumo de botiquín vinculados a ese origen (un tratamiento o
   * vacunación puede tener varios eventos, ej. varios tipos de vacuna).
   */
  async _costesPorOrigen(fincaId) {
    const eventos = await window.db.getAllFromIndex('registro_eventos', 'tipo_entidad', 'botiquin').catch(() => []);
    const mapa = new Map();
    for (const e of eventos) {
      if (e.fincaId !== fincaId) continue;
      if (!e.origen_tipo || e.origen_id == null) continue;
      const clave = `${e.origen_tipo}:${e.origen_id}`;
      mapa.set(clave, (mapa.get(clave) || 0) + Number(e.costeTotal || 0));
    }
    return mapa;
  },

  /**
   * Coste total de sanidad (tratamientos + vacunaciones) imputado a un
   * animal, prorrateando los eventos masivos (sin animalId) entre los
   * animales del rebaño en el momento del evento.
   */
  async calcularCosteSanidad(animalId) {
    return await ErrorHandler.tryAsync(async () => {
      const animal = await window.Animales.get(Number(animalId));
      if (!animal || !animal.rebanoId) return 0;

      const rebanoId = animal.rebanoId;
      const costesPorOrigen = await this._costesPorOrigen(animal.fincaId ?? (await window.db.get('rebanos', rebanoId))?.fincaId);
      const animalesDelRebano = await window.Animales.list(rebanoId);
      const totalAnimalesRebano = animalesDelRebano.length || 1;

      let coste = 0;

      // Tratamientos
      const tratamientos = await window.Sanitarios.list(rebanoId);
      for (const t of tratamientos) {
        const costeEvento = costesPorOrigen.get(`tratamiento:${t.id}`) || 0;
        if (costeEvento === 0) continue;
        if (t.animalId != null) {
          if (Number(t.animalId) === Number(animalId)) coste += costeEvento;
        } else {
          coste += costeEvento / totalAnimalesRebano;
        }
      }

      // Vacunaciones
      const vacunaciones = await window.Vacunaciones.list({ rebanoId });
      for (const v of vacunaciones) {
        const costeEvento = costesPorOrigen.get(`vacunacion:${v.id}`) || 0;
        if (costeEvento === 0) continue;
        const animalesVacunados = Array.isArray(v.animales_vacunados) ? v.animales_vacunados : [];
        const esIndividual = animalesVacunados.some((av) => av.animalId != null);
        if (esIndividual) {
          const estaEsteAnimal = animalesVacunados.some((av) => Number(av.animalId) === Number(animalId));
          if (estaEsteAnimal) {
            // Coste repartido entre los animales individuales de esta vacunación
            coste += costeEvento / animalesVacunados.length;
          }
        } else {
          // Modo categoría/agregado: prorratea entre todo el rebaño
          coste += costeEvento / totalAnimalesRebano;
        }
      }

      return Number(coste.toFixed(2));
    }, { entity: 'MargenAnimal', action: 'calcularCosteSanidad', animalId });
  },
};

window.MargenAnimal = MargenAnimal;
