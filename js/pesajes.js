/**
 * LIFESTOCK MANAGER - MOTOR MAESTRO DE PESAJES Y TRAZABILIDAD (v4.0.0)
 * Módulo centralizado para el registro de magnitudes físicas (Carne, Leche, Insumos)
 * con captura de contexto inalterable (Snapshot).
 */

const Pesajes = {
  /**
   * Registra un evento de pesada o producción en el Libro Maestro
   * @param {Object} data Datos del evento (entidad_id, valor_neto, tarea, etc.)
   */
  async registrar(data) {
    return await ErrorHandler.tryAsync(
      async () => {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) throw new Error("No hay una finca activa seleccionada.");

        // 1. Obtener contexto actual para el Snapshot
        let snap_zona = "Finca";
        let snap_tipo = "Sin Clasificar";
        let snap_especie = "General";

        if (data.tipo_entidad === "animal") {
          const animal = await Animales.get(data.entidad_id);
          if (animal) {
            snap_especie = animal.especie || snap_especie;
            if (animal.rebanoId) {
              const rebano = await Rebanos.get(animal.rebanoId);
              if (rebano) {
                snap_zona = rebano.zonaActual || snap_zona;
                snap_tipo = rebano.tipo || snap_tipo;
              }
            }
          }
        } else if (data.tipo_entidad === "rebano") {
          const rebano = await Rebanos.get(data.entidad_id);
          if (rebano) {
            snap_zona = rebano.zonaActual || snap_zona;
            snap_tipo = rebano.tipo || snap_tipo;
            snap_especie = rebano.especie || snap_especie;
          }
        }

        // 2. Preparar el objeto consolidado
        const evento = {
          fincaId: fincaId,
          fecha: data.fecha || new Date().toISOString().split("T")[0],
          // Identidad
          entidad_id: Number(data.entidad_id),
          tipo_entidad: data.tipo_entidad || "animal", // 'animal', 'rebano', 'tanque_leche', 'silo_pienso', 'finca'

          // Snapshot (Inalterable)
          snap_zona: data.snap_zona || snap_zona,
          snap_tipo: data.snap_tipo || snap_tipo,
          snap_especie: data.snap_especie || snap_especie,

          // Magnitudes
          peso_bruto: Number(data.peso_bruto) || 0,
          tara: Number(data.tara) || 0,
          valor_neto: Number(data.valor_neto) || 0,
          valor_canal: Number(data.valor_canal) || 0,
          unidad: data.unidad || "kg",

          // Parámetros de Calidad
          calidad: data.calidad || null,

          // Economía
          precio_unitario: Number(data.precio_unitario) || 0,
          importe_total:
            Number(data.importe_total) ||
            Number(data.valor_neto) * Number(data.precio_unitario || 0),
          rol_contable: data.rol_contable || "INVENTARIO", // 'VENTA', 'COMPRA', 'INVENTARIO', 'CONSUMO'

          // Logística y Doc
          matricula: data.matricula || "",
          documento_ref: data.documento_ref || "",
          motivo_tarea: data.motivo_tarea || "control", // 'expedicion', 'control', 'produccion_leche', 'control_lechero', 'alimentacion'

          creadoEn: new Date().toISOString(),
        };

        // 3. Guardar en el Registro Maestro de Eventos
        const id = await window.db.add("registro_eventos", evento);

        // 4. (Opcional) Guardar también en tablas legadas para compatibilidad con informes antiguos
        if (data.tipo_entidad === "animal" && data.motivo_tarea === "control") {
          await window.db.add("produccion_carne", {
            animalId: Number(data.entidad_id),
            fecha: evento.fecha,
            peso: evento.valor_neto,
            tipo: "Pesaje Maestro",
            creadoEn: evento.creadoEn,
          });
        }

        // 5. Notificar al sistema via EventBus
        if (window.EventBus) {
          window.EventBus.emit('pesaje:registrado', {
            pesaje: { ...evento, id },
            entidadId: Number(data.entidad_id),
            peso: evento.valor_neto
          });
        }

        return id;
      },
      { entity: "Pesajes", action: "registrar" }
    );
  },

  /**
   * Obtiene el histórico de pesajes de una entidad (animal o rebaño)
   */
  async obtenerHistorial(entidad_id, tipo_entidad = "animal") {
    const todos = await window.db.getAllFromIndex(
      "registro_eventos",
      "entidad_id",
      Number(entidad_id)
    );
    return todos
      .filter((e) => e.tipo_entidad === tipo_entidad)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  /**
   * Calcula la Ganancia Media Diaria (GMD) entre dos pesajes
   */
  calcularGMD(actual, anterior) {
    if (!actual || !anterior) return 0;
    const diffPeso = actual.valor_neto - anterior.valor_neto;
    const diffTiempo =
      (new Date(actual.fecha) - new Date(anterior.fecha)) /
      (1000 * 60 * 60 * 24);
    return diffTiempo > 0 ? (diffPeso / diffTiempo).toFixed(3) : 0;
  },

  /**
   * Migra datos de tablas antiguas al nuevo registro_eventos
   */
  async ejecutarMigracion() {
    return await ErrorHandler.tryAsync(
      async () => {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) return;

        console.log("[Pesajes] Iniciando migración de datos...");

        // 1. Migrar Carne
        const carne = await Produccion.listCarne();
        for (const c of carne) {
          const existing = await window.db.getAllFromIndex(
            "registro_eventos",
            "entidad_id",
            Number(c.animalId)
          );
          const match = existing.find(
            (e) =>
              e.fecha === c.fecha &&
              e.valor_neto === c.peso &&
              e.motivo_tarea === "control"
          );

          if (!match) {
            await window.db.add("registro_eventos", {
              fincaId: fincaId,
              fecha: c.fecha,
              entidad_id: Number(c.animalId),
              tipo_entidad: "animal",
              snap_zona: c.snap_zona || "Sin zona",
              snap_tipo: c.snap_tipo || "Sin tipo",
              snap_especie: c.snap_especie || "Sin especie",
              valor_neto: c.peso,
              motivo_tarea: "control",
              creadoEn: c.creadoEn || new Date().toISOString(),
            });
          }
        }

        // 2. Migrar Leche (Cifrada)
        const leche = await Produccion.listLeche(fincaId);
        for (const l of leche) {
          const existing = await window.db.getAllFromIndex(
            "registro_eventos",
            "entidad_id",
            Number(l.vacaId)
          );
          const match = existing.find(
            (e) =>
              e.fecha === l.fecha &&
              e.valor_neto === l.cantidad_litros &&
              e.motivo_tarea === "produccion_leche"
          );

          if (!match) {
            await window.db.add("registro_eventos", {
              fincaId: fincaId,
              fecha: l.fecha,
              entidad_id: Number(l.vacaId),
              tipo_entidad: "animal",
              snap_zona: l.snap_zona || "Sin zona",
              snap_tipo: l.snap_tipo || "Sin tipo",
              snap_especie: l.snap_especie || "Sin especie",
              valor_neto: l.cantidad_litros,
              unidad: "L",
              motivo_tarea: "produccion_leche",
              creadoEn: l.creadoEn || new Date().toISOString(),
            });
          }
        }

        // 3. Migrar Ventas (Cifrada)
        const ventas = await Produccion.listVentas(fincaId);
        for (const v of ventas) {
          if (v.animal_id_list && v.animal_id_list.length > 0) {
            const precioPorAnimal = v.precio_total / v.animal_id_list.length;
            for (const aId of v.animal_id_list) {
              const existing = await window.db.getAllFromIndex(
                "registro_eventos",
                "entidad_id",
                Number(aId)
              );
              const match = existing.find(
                (e) => e.fecha === v.fecha && e.motivo_tarea === "expedicion"
              );

              if (!match) {
                await window.db.add("registro_eventos", {
                  fincaId: fincaId,
                  fecha: v.fecha,
                  entidad_id: Number(aId),
                  tipo_entidad: "animal",
                  importe_total: precioPorAnimal,
                  rol_contable: "VENTA",
                  motivo_tarea: "expedicion",
                  creadoEn: v.creadoEn || new Date().toISOString(),
                });
              }
            }
          }
        }
        console.log("[Pesajes] Migración completada.");
      },
      { entity: "Pesajes", action: "ejecutarMigracion" }
    );
  },
};

window.Pesajes = Pesajes;
