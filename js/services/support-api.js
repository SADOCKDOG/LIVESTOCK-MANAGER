/**
 * support-api.js — cliente del backend de soporte.
 *
 * Unico punto del frontend que habla con el Worker. Guarda la sesion, la
 * renueva revalidando la compra y expone las llamadas de tickets.
 *
 * El usuario nunca ve GitHub: aqui se manejan «incidencias» con su estado en
 * espanol, no issues.
 *
 * Compartido por Android y PWA: no duplicar esta logica en ningun otro sitio.
 */
(function () {
  'use strict';

  // Worker en produccion. window.SUPPORT_API_BASE permite apuntar a otro
  // entorno (pruebas) sin tocar este fichero.
  var BASE = ('SUPPORT_API_BASE' in window ? window.SUPPORT_API_BASE : 'https://livestock-manager-support-api-production.livestock-desktop.workers.dev');

  var CLAVE_SESION = 'livestock_support_session';

  var SupportAPI = {
    _sesion: (function () {
      try {
        return JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
      } catch (e) {
        return null;
      }
    })(),

    /** Hay sesion y no ha caducado. */
    tieneSesion: function () {
      if (!this._sesion || !this._sesion.token) return false;
      return !this._sesion.expira || Date.parse(this._sesion.expira) > Date.now();
    },

    /**
     * La licencia tiene su propia caducidad, distinta de la de la sesion: la
     * sesion dura 24 h y la suscripcion se renueva por su cuenta. Comprobar
     * solo el flag `activa` daba por buena una licencia vencida hace rato, asi
     * que el usuario escribia la incidencia entera y solo fallaba al enviarla.
     */
    licenciaActiva: function () {
      var lic = this._sesion && this._sesion.licencia;
      if (!lic || !lic.activa) return false;
      return !lic.expira || Date.parse(lic.expira) > Date.now();
    },

    _guardarSesion: function (sesion) {
      this._sesion = sesion;
      try {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
      } catch (e) {}
    },

    cerrarSesion: function () {
      this._sesion = null;
      try {
        localStorage.removeItem(CLAVE_SESION);
      } catch (e) {}
    },

    async _peticion(ruta, opciones) {
      opciones = opciones || {};
      var cabeceras = { 'Content-Type': 'application/json' };
      if (this._sesion && this._sesion.token) {
        cabeceras.Authorization = 'Bearer ' + this._sesion.token;
      }

      var respuesta;
      try {
        respuesta = await fetch(BASE + ruta, {
          method: opciones.method || 'GET',
          headers: cabeceras,
          body: opciones.body ? JSON.stringify(opciones.body) : undefined,
        });
      } catch (e) {
        // Sin red: la app es offline-first, pero el soporte no puede serlo.
        throw new Error('Sin conexión. El soporte necesita internet.');
      }

      var datos = null;
      try {
        datos = await respuesta.json();
      } catch (e) {}

      if (respuesta.status === 401) {
        this.cerrarSesion();
        throw new Error('Tu sesión ha caducado. Vuelve a entrar en Soporte.');
      }

      // La licencia ha vencido mientras la sesion seguia viva. La suscripcion
      // puede haberse renovado ya en Google, asi que se revalida el token de
      // compra y se reintenta una sola vez. Sin esto el usuario se quedaba
      // bloqueado hasta que se le ocurriera pulsar «Ya lo tengo» a ciegas.
      var caducada =
        respuesta.status === 403 &&
        datos &&
        (datos.codigo === 'LICENCIA_CADUCADA' || datos.codigo === 'LICENCIA_INACTIVA');

      if (caducada && !opciones._reintento && window.PurchaseManager &&
          window.PurchaseManager.revalidarSoporte) {
        var renovada = await window.PurchaseManager.revalidarSoporte();
        if (renovada) {
          opciones._reintento = true;
          return this._peticion(ruta, opciones);
        }
      }

      if (!respuesta.ok) {
        var error = new Error((datos && datos.error) || 'No se pudo completar la operación');
        error.codigo = datos && datos.codigo;
        throw error;
      }
      return datos;
    },

    /**
     * Valida la compra contra el backend y abre sesion. Se llama al entrar en
     * Soporte y tras comprar la licencia.
     */
    async iniciarSesion(purchaseToken, plataforma, email) {
      var datos = await this._peticion('/auth/verify-purchase', {
        method: 'POST',
        // Esta es la llamada que revalida: no puede reintentarse a si misma.
        _reintento: true,
        body: {
          purchase_token: purchaseToken,
          plataforma: plataforma || 'android',
          email: email || '',
        },
      });
      this._guardarSesion(datos);
      return datos;
    },

    /** Estado de la licencia segun el servidor (no segun el cliente). */
    async estadoLicencia() {
      return this._peticion('/auth/me');
    },

    /**
     * Paso 1: manda el texto libre y recibe el borrador estructurado. Todavia
     * no se ha creado nada; el usuario tiene que revisarlo.
     */
    async pedirBorrador(descripcion, contexto) {
      return this._peticion('/tickets', {
        method: 'POST',
        body: { descripcion: descripcion, contexto: contexto || {} },
      });
    },

    /**
     * Paso 2: el usuario ha revisado (y quiza editado) el borrador. Al
     * confirmar se registra la incidencia.
     */
    async confirmarIncidencia(borrador, contexto) {
      return this._peticion('/tickets/confirm', {
        method: 'POST',
        body: {
          ticket_id: borrador.ticket_id,
          titulo: borrador.titulo,
          descripcion: borrador.descripcion,
          pasos_reproduccion: borrador.pasos_reproduccion,
          contexto: contexto || {},
        },
      });
    },

    async listarIncidencias() {
      var datos = await this._peticion('/tickets');
      return (datos && datos.tickets) || [];
    },

    async detalleIncidencia(ticketId) {
      return this._peticion('/tickets/' + encodeURIComponent(ticketId));
    },

    /** Contexto tecnico que acompana al reporte. */
    contextoActual: function () {
      var cap = window.Capacitor;
      return {
        version_app: (window.APP_INFO && window.APP_INFO.version) || '',
        dispositivo: (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '',
        version_so: navigator.userAgent.slice(0, 120),
        plataforma: cap && cap.isNativePlatform && cap.isNativePlatform() ? 'android' : 'web',
      };
    },
  };

  /** Estados internos -> texto para el usuario. */
  SupportAPI.ESTADOS = {
    enviada: 'Enviada',
    revision: 'En revisión',
    curso: 'En curso',
    resuelta: 'Resuelta',
  };

  SupportAPI.textoEstado = function (estado) {
    return SupportAPI.ESTADOS[estado] || 'Enviada';
  };

  window.SupportAPI = SupportAPI;
})();
