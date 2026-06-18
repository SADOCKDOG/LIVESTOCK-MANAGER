const Animales = {
  async list(rebanoId = null) {
    if (rebanoId) {
      return window.db.getAllFromIndex(
        "animales",
        "rebanoId",
        Number(rebanoId)
      );
    } else {
      // Lista todos los animales de la finca activa buscando por los rebaños
      const rebanos = await Rebanos.list();
      let todosLosAnimales = [];
      for (let r of rebanos) {
        const animales = await window.db.getAllFromIndex(
          "animales",
          "rebanoId",
          r.id
        );
        todosLosAnimales = todosLosAnimales.concat(animales);
      }
      return todosLosAnimales;
    }
  },

  async get(id) {
    return window.db.get("animales", Number(id));
  },

  async save(data) {
    return await ErrorHandler.tryAsync(
      async () => {
        // Validaciones
        const crotal = ErrorHandler.validateCaravana(
          data.numero_identificacion
        );
        // El rebaño ya no es obligatorio según las nuevas reglas

        const esEdicion =
          data.id !== undefined && data.id !== null && data.id !== "";

        // Validación opcional de DIB (único)
        if (data.dib && data.dib.trim()) {
          const dibValue = data.dib.trim().toUpperCase();
          const existenteDib = await window.db.getFromIndex(
            "animales",
            "dib",
            dibValue
          ).catch(() => null);
          if (existenteDib && (!esEdicion || existenteDib.id !== Number(data.id))) {
            throw new Error(
              `Ya existe un animal con el DIB/Nº Pasaporte "${dibValue}"`
            );
          }
        }

        // 1. Control de Duplicados (solo si es nuevo o ha cambiado el crotal)
        if (!esEdicion) {
          const existente = await window.db.getFromIndex(
            "animales",
            "caravana",
            crotal
          );
          if (existente)
            throw new Error(
              `Ya existe un animal registrado con el crotal ${crotal}`
            );
        } else {
          const actual = await this.get(data.id);
          if (actual && actual.numero_identificacion !== crotal) {
            const existente = await window.db.getFromIndex(
              "animales",
              "caravana",
              crotal
            );
            if (existente)
              throw new Error(
                `No se puede cambiar al crotal ${crotal} porque ya está asignado a otro animal`
              );
          }
        }

        const animalData = {
          ...data,
          numero_identificacion: crotal,
          rebanoId: data.rebanoId ? Number(data.rebanoId) : null,
          especie: data.especie || null,
          tipo: data.tipo || "Sin Clasificar",
          estado: data.estado || "activo",
          fecha_nacimiento: data.fecha_nacimiento || null,
          actualizadoEn: new Date().toISOString(),
        };

        const rebanoAnterior = esEdicion ? (await this.get(Number(data.id)))?.rebanoId : null;
        const rebanoNuevo = animalData.rebanoId;

        let animalId;
        if (esEdicion) {
          animalData.id = Number(data.id);
          await window.db.put("animales", animalData);
          animalId = animalData.id;
        } else {
          delete animalData.id;
          animalData.creadoEn = new Date().toISOString();
          animalId = await window.db.add("animales", animalData);
        }
        animalData.id = animalId;

        // 2. Registrar Peso Inicial si se proporciona
        if (data.peso_inicial && Number(data.peso_inicial) > 0) {
          await Pesajes.registrar({
            entidad_id: animalId,
            tipo_entidad: "animal",
            valor_neto: Number(data.peso_inicial),
            fecha:
              animalData.fecha_nacimiento ||
              new Date().toISOString().split("T")[0],
            motivo_tarea: "control",
          });
        }

        // 3. Notificar al sistema via EventBus
        if (window.EventBus) {
          if (esEdicion) {
            window.EventBus.emit('animal:updated', { animal: animalData });
            // Detectar cambio de rebaño (movimiento)
            if (rebanoAnterior !== null && rebanoNuevo !== null && rebanoAnterior !== rebanoNuevo) {
              window.EventBus.emit('animal:moved', {
                animal: animalData,
                rebanoOrigen: rebanoAnterior,
                rebanoDestino: rebanoNuevo,
              });
            }
          } else {
            window.EventBus.emit('animal:created', { animal: animalData });
          }
        }

        return animalId;
      },
      { entity: "Animales", action: "save" }
    );
  },

  async delete(id) {
    return await ErrorHandler.tryAsync(
      async () => {
        const numId = Number(id);
        const animal = await this.get(numId);

        if (!animal) return;

        // 1. Proteger integridad referencial
        const [prodCarne, comCarne, eventos] = await Promise.all([
          window.db.getAllFromIndex("produccion_carne", "animalId", numId),
          window.db.getAllFromIndex(
            "comercializacion_carne",
            "animalId",
            numId
          ),
          window.db.getAllFromIndex("registro_eventos", "entidad_id", numId),
        ]);

        if (prodCarne.length > 0 || eventos.length > 0)
          throw new Error(
            "No se puede eliminar: tiene pesajes o eventos registrados."
          );
        if (comCarne.length > 0)
          throw new Error(
            "No se puede eliminar: ya tiene registros de venta/comercialización."
          );

        // 2. Bloquear si está vendido
        if (animal.estado === "vendido") {
          throw new Error(
            "No se puede eliminar un animal que ya ha sido vendido."
          );
        }

        await window.db.delete("animales", numId);

        // 3. Notificar al sistema via EventBus
        if (window.EventBus) {
          window.EventBus.emit('animal:deleted', { id: numId, crotal: animal.numero_identificacion });
        }
      },
      { entity: "Animales", action: "delete" }
    );
  },
};

window.Animales = Animales;
