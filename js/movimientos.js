/**
 * Movimientos de Ganado — Livestock Manager Premium
 * Submódulo de movimientos OFICIALES inter-explotación (guía de origen y
 * sanidad pecuaria), independiente del traslado interno entre rebaños/zonas.
 *
 * Cada movimiento representa una entrada o salida de animales hacia/desde otra
 * explotación, con su guía, REGA origen/destino, transportista, fechas y
 * certificación de desinsectación, conforme a SIGGAN (Junta de Andalucía) y
 * BADIGEX (Extremadura).
 */

const Movimientos = {
  /**
   * Listar movimientos, opcionalmente filtrados por finca o tipo.
   * @param {Object} filtros - { fincaId, tipo }
   */
  async list(filtros = {}) {
    return await ErrorHandler.tryAsync(async () => {
      let movs = await window.db.getAll('movimientos_ganado').catch(() => []);
      if (filtros.fincaId != null) {
        movs = movs.filter(m => Number(m.fincaId) === Number(filtros.fincaId));
      }
      if (filtros.tipo) {
        movs = movs.filter(m => m.tipo === filtros.tipo);
      }
      return movs.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    }, { entity: 'Movimientos', action: 'list' });
  },

  async get(id) {
    return await window.db.get('movimientos_ganado', Number(id));
  },

  /**
   * Guarda un movimiento oficial. Valida REGA origen/destino y desinsectación
   * según la comunidad autónoma de la finca activa.
   * @param {Object} data
   */
  async save(data) {
    return await ErrorHandler.tryAsync(async () => {
      const esEdicion = data.id !== undefined && data.id !== null && data.id !== '';
      const CS = window.ComunidadesService;

      const tipo = data.tipo === 'entrada' ? 'entrada' : 'salida';
      const ccaa = data.comunidad_autonoma || null;

      const regaOrigen = CS ? CS.normalizarREGA(data.rega_origen || '') : (data.rega_origen || '').toUpperCase();
      const regaDestino = CS ? CS.normalizarREGA(data.rega_destino || '') : (data.rega_destino || '').toUpperCase();

      // Validación de formato REGA (cuando se informa)
      if (CS) {
        if (regaOrigen) {
          const r = CS.validarFormatoREGA(regaOrigen, null);
          if (!r.valido) throw new Error('REGA origen: ' + r.mensaje);
        }
        if (regaDestino) {
          const r = CS.validarFormatoREGA(regaDestino, null);
          if (!r.valido) throw new Error('REGA destino: ' + r.mensaje);
        }
      }

      // Requisito de desinsectación según comunidad
      const conf = CS && ccaa ? CS.getConfiguracionCCAA(ccaa) : null;
      if (conf && conf.requiere_desinsectacion_movimiento && !data.desinsectacion_certificada) {
        throw new Error('Esta comunidad exige certificar la desinsectación previa al movimiento.');
      }

      const animalIds = Array.isArray(data.animalId)
        ? data.animalId.map(Number).filter(n => !Number.isNaN(n))
        : (data.animalId != null ? [Number(data.animalId)] : []);

      const movData = {
        fincaId: data.fincaId != null ? Number(data.fincaId) : null,
        tipo,                                   // entrada | salida
        numero_guia: (data.numero_guia || '').toString().trim().toUpperCase(),
        rega_origen: regaOrigen,
        rega_destino: regaDestino,
        explotacion_contraparte: (data.explotacion_contraparte || '').trim(),
        motivo: data.motivo || '',
        especie: data.especie || '',
        num_animales: Number(data.num_animales) || animalIds.length || 0,
        animalId: animalIds,
        crotales: Array.isArray(data.crotales) ? data.crotales : [],
        transportistaId: data.transportistaId != null ? Number(data.transportistaId) : null,
        transportista_nombre: (data.transportista_nombre || '').trim(),
        matricula: (data.matricula || '').trim().toUpperCase(),
        fecha: data.fecha || new Date().toISOString().split('T')[0],
        desinsectacion_certificada: !!data.desinsectacion_certificada,
        comunidad_autonoma: ccaa || '',
        plataforma: conf ? conf.sistema_movimiento : (data.plataforma || ''),
        notas: (data.notas || '').trim(),
        actualizadoEn: new Date().toISOString(),
      };

      let movId;
      if (esEdicion) {
        movData.id = Number(data.id);
        const previo = await this.get(movData.id);
        movData.creadoEn = previo?.creadoEn || new Date().toISOString();
        await window.db.put('movimientos_ganado', movData);
        movId = movData.id;
      } else {
        movData.creadoEn = new Date().toISOString();
        movId = await window.db.add('movimientos_ganado', movData);
        movData.id = movId;
      }

      // Registrar evento en la trazabilidad/cuaderno para cada animal afectado
      await this._registrarEventos(movData);

      if (window.EventBus) {
        window.EventBus.emit('movimiento:saved', { movimiento: movData });
      }
      return movId;
    }, { entity: 'Movimientos', action: 'save' });
  },

  async delete(id) {
    return await ErrorHandler.tryAsync(async () => {
      await window.db.delete('movimientos_ganado', Number(id));
      if (window.EventBus) window.EventBus.emit('movimiento:deleted', { id: Number(id) });
    }, { entity: 'Movimientos', action: 'delete', id });
  },

  /** Movimientos en los que participa un animal concreto */
  async getByAnimal(animalId) {
    const movs = await window.db.getAll('movimientos_ganado').catch(() => []);
    const numId = Number(animalId);
    return movs
      .filter(m => Array.isArray(m.animalId) && m.animalId.map(Number).includes(numId))
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  },

  /**
   * Registra un evento en `registro_eventos` por cada animal del movimiento,
   * para que aparezca en el cuaderno digital y la trazabilidad 360º.
   */
  async _registrarEventos(movData) {
    if (!window.db.objectStoreNames || !movData.animalId || movData.animalId.length === 0) return;
    const motivo = movData.tipo === 'entrada' ? 'entrada' : 'salida';
    for (const animId of movData.animalId) {
      try {
        await window.db.add('registro_eventos', {
          fincaId: movData.fincaId,
          entidad_id: animId,
          tipo_entidad: 'animal',
          tipo: 'movimiento',
          motivo_tarea: motivo,
          fecha: movData.fecha,
          descripcion: `Movimiento ${motivo} · Guía ${movData.numero_guia || 's/n'} · ${movData.tipo === 'entrada' ? 'desde ' + (movData.rega_origen || '—') : 'hacia ' + (movData.rega_destino || '—')}`,
          notas: movData.notas || '',
          creadoEn: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[Movimientos] No se pudo registrar evento del animal', animId, e?.message);
      }
    }
  },
};

window.Movimientos = Movimientos;
