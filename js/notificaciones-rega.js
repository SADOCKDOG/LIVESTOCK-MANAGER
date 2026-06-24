/**
 * Módulo Notificaciones REGA — Registro de Notificaciones (Gap 11 SIGGAN)
 * Permite marcar animales como notificados a REGA cuando cambian de estado
 * Referencia: Decreto 14/2006 (Andalucía), SIGGAN/BADIGEX, RD 787/2023
 */

window.NotificacionesREGA = (() => {
  'use strict';

  const STORE_NAME = 'notificaciones_rega';

  /**
   * Inicializa la tabla en IndexedDB
   * @param {IDBDatabase} db
   * @param {number} version
   */
  async function initStore(db, version) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      store.createIndex('animal_id', 'animal_id', { unique: false });
      store.createIndex('finca_id', 'finca_id', { unique: false });
      store.createIndex('fecha_notificacion', 'fecha_notificacion', { unique: false });
      console.log(`[NotificacionesREGA] Tabla ${STORE_NAME} creada (v${version})`);
    }
  }

  /**
   * Valida si un animal puede notificarse a REGA
   * Requiere: REGA válido en la finca, animal con DIB/crotal válido
   * @param {Object} animal
   * @param {Object} finca
   * @returns {{valido: boolean, mensaje: string}}
   */
  function validarNotificacionPosible(animal, finca) {
    if (!finca) return { valido: false, mensaje: 'No hay finca activa' };
    if (!finca.rega && !finca.codigo_REGA) {
      return { valido: false, mensaje: 'La finca debe tener un código REGA válido' };
    }
    if (!animal) return { valido: false, mensaje: 'Animal no encontrado' };
    if (!animal.numero_identificacion && !animal.crotal) {
      return { valido: false, mensaje: 'Animal debe tener crotal o DIB/número de identificación' };
    }
    if (animal.estado === 'Baja' && !animal.motivo_baja) {
      return { valido: false, mensaje: 'Si el animal está de baja, requiere motivo de baja' };
    }
    return { valido: true, mensaje: 'Notificación permitida' };
  }

  /**
   * Registra una notificación a REGA para un animal
   * @param {Object} data - {animal_id, finca_id, animal_numero, finca_rega, tipo_evento}
   * @returns {Promise<{exito: boolean, numero_seguimiento: string, mensaje: string}>}
   */
  async function registrar(data) {
    const fincaId = data.finca_id || (await window.Fincas?.getActiveId());
    if (!fincaId) throw new Error('No hay finca activa');

    // Generar número de seguimiento único: YYYYMMDD-{fincaId}-{random}
    const hoy = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const numeroSeguimiento = `${hoy}-${fincaId}-${random}`;

    const notificacionData = {
      animal_id: data.animal_id,
      finca_id: fincaId,
      animal_numero: data.animal_numero, // Crotal/DIB
      finca_rega: data.finca_rega,
      tipo_evento: data.tipo_evento || 'cambio_estado', // alta, baja, cambio_estado, etc.
      estado_notificacion: 'pendiente', // pendiente, enviado, confirmado, error
      fecha_notificacion: new Date().toISOString(),
      numero_seguimiento: numeroSeguimiento,
      observaciones: data.observaciones || ''
    };

    try {
      // Verificar si la tabla existe; si no, usar almacenamiento simple (fallback)
      if (!window.db || !window.db.objectStoreNames) {
        console.warn('[NotificacionesREGA] IndexedDB no disponible, usando localStorage fallback');
        const fallback = JSON.parse(localStorage.getItem('notificaciones_rega_fallback') || '[]');
        fallback.push(notificacionData);
        localStorage.setItem('notificaciones_rega_fallback', JSON.stringify(fallback));
        return {
          exito: true,
          numero_seguimiento: numeroSeguimiento,
          mensaje: `Notificación registrada (fallback): ${numeroSeguimiento}`
        };
      }

      if (!window.db.objectStoreNames.contains(STORE_NAME)) {
        console.warn(`[NotificacionesREGA] Tabla ${STORE_NAME} no existe aún. Usando localStorage.`);
        const fallback = JSON.parse(localStorage.getItem('notificaciones_rega_fallback') || '[]');
        fallback.push(notificacionData);
        localStorage.setItem('notificaciones_rega_fallback', JSON.stringify(fallback));
        return {
          exito: true,
          numero_seguimiento: numeroSeguimiento,
          mensaje: `Notificación registrada (fallback): ${numeroSeguimiento}`
        };
      }

      const tx = window.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const result = await new Promise((resolve, reject) => {
        const req = store.add(notificacionData);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      console.log(`[NotificacionesREGA] Notificación registrada: animal=${data.animal_numero}, número=${numeroSeguimiento}`);
      return {
        exito: true,
        numero_seguimiento: numeroSeguimiento,
        mensaje: `Notificación registrada: ${numeroSeguimiento}`,
        id: result
      };
    } catch (e) {
      console.error('[NotificacionesREGA] Error al registrar:', e.message);
      throw e;
    }
  }

  /**
   * Obtiene historial de notificaciones de un animal
   * @param {number} animal_id
   * @returns {Promise<Array>}
   */
  async function obtenerHistorial(animal_id) {
    try {
      const tx = window.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('animal_id');

      return await new Promise((resolve, reject) => {
        const req = index.getAll(animal_id);
        req.onsuccess = () => {
          const notificaciones = req.result || [];
          // Ordenar por fecha descendente
          notificaciones.sort((a, b) => new Date(b.fecha_notificacion) - new Date(a.fecha_notificacion));
          resolve(notificaciones);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('[NotificacionesREGA] Error obteniendo historial:', e.message);
      return [];
    }
  }

  /**
   * Verifica si un animal ya fue notificado
   * @param {number} animal_id
   * @returns {Promise<boolean>}
   */
  async function yaFueNotificado(animal_id) {
    const historial = await obtenerHistorial(animal_id);
    return historial.length > 0;
  }

  /**
   * Actualiza estado de una notificación
   * @param {number} notificacion_id
   * @param {string} nuevoEstado - pendiente|enviado|confirmado|error
   * @param {string} error - Mensaje de error si aplica
   * @returns {Promise<void>}
   */
  async function actualizarEstado(notificacion_id, nuevoEstado, error = '') {
    try {
      const tx = window.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(notificacion_id);

      getReq.onsuccess = () => {
        const notificacion = getReq.result;
        if (!notificacion) {
          console.error('[NotificacionesREGA] Notificación no encontrada:', notificacion_id);
          return;
        }
        notificacion.estado_notificacion = nuevoEstado;
        if (error) notificacion.error_mensaje = error;
        notificacion.fecha_actualizacion = new Date().toISOString();

        const putReq = store.put(notificacion);
        putReq.onsuccess = () => {
          console.log(`[NotificacionesREGA] Estado actualizado: ${notificacion_id} → ${nuevoEstado}`);
        };
        putReq.onerror = () => {
          console.error('[NotificacionesREGA] Error actualizando notificación:', putReq.error);
        };
      };
      getReq.onerror = () => {
        console.error('[NotificacionesREGA] Error obteniendo notificación:', getReq.error);
      };
    } catch (e) {
      console.error('[NotificacionesREGA] Error actualizando estado:', e.message);
      throw e;
    }
  }

  /**
   * Simula envío de notificación a SIGGAN/BADIGEX (para QA)
   * En prod, esto llamaría a API de REGA
   * @param {Object} notificacion
   * @returns {Promise<{exito: boolean, mensaje: string}>}
   */
  async function enviarAREGA(notificacion) {
    try {
      // En un sistema real, aquí iría la llamada a API de REGA
      // por ahora simulamos con un delay
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`[NotificacionesREGA] SIMULADO: Notificación enviada a REGA:`, {
        animal: notificacion.animal_numero,
        finca: notificacion.finca_rega,
        tipo: notificacion.tipo_evento,
        fecha: notificacion.fecha_notificacion
      });

      // Actualizar estado a "enviado"
      await actualizarEstado(notificacion.id, 'enviado');

      return {
        exito: true,
        mensaje: `Notificación REGA enviada para ${notificacion.animal_numero}`
      };
    } catch (e) {
      console.error('[NotificacionesREGA] Error enviando a REGA:', e.message);
      await actualizarEstado(notificacion.id, 'error', e.message);
      return {
        exito: false,
        mensaje: `Error enviando a REGA: ${e.message}`
      };
    }
  }

  // Inicialización automática
  if (window.db && typeof window.db.transaction === 'function') {
    (async () => {
      try {
        const dbInstance = await new Promise((resolve, reject) => {
          const req = window.dbPromise || indexedDB.open('livestock-manager');
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        if (dbInstance) initStore(dbInstance, dbInstance.version);
      } catch (e) {
        console.warn('[NotificacionesREGA] No se pudo inicializar tabla:', e.message);
      }
    })();
  }

  // API pública
  return Object.freeze({
    initStore,
    validarNotificacionPosible,
    registrar,
    obtenerHistorial,
    yaFueNotificado,
    actualizarEstado,
    enviarAREGA,
    STORE_NAME
  });
})();

console.log('[NotificacionesREGA] Módulo cargado — Notificaciones a REGA activadas (Gap 11 SIGGAN)');
