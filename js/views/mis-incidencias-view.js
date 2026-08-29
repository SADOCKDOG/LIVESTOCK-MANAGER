/**
 * Livestock Manager - MisIncidenciasView v1.1.0
 *
 * Listado de las incidencias propias, con su estado y con las respuestas del
 * equipo. El usuario nunca ve GitHub: aqui solo hay incidencias con estado en
 * espanol y mensajes, no issues ni comentarios.
 *
 * No exige licencia activa: quien la deja caducar sigue viendo lo que reporto
 * y lo que le han contestado, aunque no pueda abrir nada nuevo.
 */

/** Ultima respuesta ya vista de cada incidencia, para marcar las nuevas. */
const CLAVE_LEIDAS = 'livestock_incidencias_leidas';

const MisIncidenciasView = {
  _cargando: false,

  async render() {
    const main = document.getElementById('app-content');

    if (!window.SupportAPI || !window.SupportAPI.tieneSesion()) {
      main.innerHTML = `
        <div class="card p-20 mt-10">
          <h2 class="section-title">Mis incidencias</h2>
          <p class="text-gray mt-10">Entra en Soporte para ver tus incidencias.</p>
          <div class="erp-action-group mt-20">
            <button class="btn btn-primary" onclick="location.hash='#/soporte'">Ir a Soporte</button>
          </div>
        </div>`;
      return;
    }

    main.innerHTML = `
      <div class="card p-20 mt-10">
        <h2 class="section-title">Mis incidencias</h2>
        <div id="incidencias-lista" class="mt-20">
          <p class="text-gray">Cargando…</p>
        </div>
        <div class="erp-action-group mt-20">
          <button class="btn btn-primary" onclick="location.hash='#/soporte'">
            Contar una incidencia
          </button>
        </div>
      </div>`;

    await this._cargar();
  },

  async _cargar() {
    if (this._cargando) return;
    this._cargando = true;
    const contenedor = document.getElementById('incidencias-lista');

    try {
      const incidencias = await window.SupportAPI.listarIncidencias();
      if (!contenedor) return;

      if (!incidencias.length) {
        contenedor.innerHTML = `
          <p class="text-gray">
            Todavía no has reportado nada. Cuando lo hagas, aparecerá aquí con su estado.
          </p>`;
        return;
      }

      contenedor.innerHTML = incidencias.map((i) => this._fila(i)).join('');
    } catch (e) {
      if (contenedor) {
        contenedor.innerHTML = `<p class="text-gray">${this._escapar(
          (e && e.message) || 'No se pudieron cargar las incidencias',
        )}</p>`;
      }
    } finally {
      this._cargando = false;
    }
  },

  _fila(incidencia) {
    const estado = window.SupportAPI.textoEstado(incidencia.estado);
    const clase = this._claseEstado(incidencia.estado);
    const id = this._escapar(incidencia.ticket_id);
    const nuevas = this._tieneRespuestaNueva(incidencia);
    const cuantas = incidencia.respuestas || 0;

    // El aviso va en la fila, no dentro del detalle: si hubiera que desplegar
    // para enterarse de que hay respuesta, no serviria de aviso.
    const marca = nuevas
      ? '<span class="badge badge-success">Respuesta nueva</span>'
      : cuantas
        ? `<span class="text-gray text-sm">${cuantas} ${cuantas === 1 ? 'respuesta' : 'respuestas'}</span>`
        : '';

    return `
      <div class="card-registro mb-10" data-ticket="${id}">
        <div class="flex items-center justify-between gap-10"
             style="cursor:pointer"
             onclick="MisIncidenciasView.alternarDetalle('${id}')">
          <div>
            <div class="font-bold">${this._escapar(incidencia.titulo)}</div>
            <div class="text-gray text-sm">${this._fecha(incidencia.created_at)}</div>
          </div>
          <div class="flex items-center gap-10">
            ${marca}
            <span class="badge ${clase}">${estado}</span>
          </div>
        </div>
        <div class="mt-10" id="detalle-${id}" hidden></div>
      </div>`;
  },

  // --- Respuestas leidas ----------------------------------------------------
  //
  // Se guarda en el dispositivo, no en el servidor: es una comodidad visual y
  // no merece ni una llamada mas ni un campo por usuario en KV. El precio es
  // que al cambiar de movil todo vuelve a verse como nuevo, que es el lado
  // seguro del fallo.

  _leidas() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || '{}') || {};
    } catch (e) {
      return {};
    }
  },

  _marcarLeida(ticketId, fechaUltima) {
    if (!fechaUltima) return;
    try {
      const mapa = this._leidas();
      mapa[ticketId] = fechaUltima;
      localStorage.setItem(CLAVE_LEIDAS, JSON.stringify(mapa));
    } catch (e) {}
  },

  _tieneRespuestaNueva(incidencia) {
    if (!incidencia.ultima_respuesta_at) return false;
    const vista = this._leidas()[incidencia.ticket_id];
    if (!vista) return true;
    return Date.parse(incidencia.ultima_respuesta_at) > Date.parse(vista);
  },

  /**
   * Abre o cierra el detalle. Muestra los metadatos y el hilo de respuestas
   * del equipo; la descripcion original no se guarda en el backend, vive en el
   * issue, y el usuario ya sabe lo que escribio.
   *
   * Se pide al servidor cada vez que se abre: antes se cacheaba porque los
   * metadatos no cambiaban, pero ahora puede haber llegado una respuesta y
   * ensenar una copia vieja seria justo el fallo que esta pantalla existe para
   * evitar.
   */
  async alternarDetalle(ticketId) {
    const caja = document.getElementById('detalle-' + ticketId);
    if (!caja) return;

    if (!caja.hidden) {
      caja.hidden = true;
      return;
    }

    caja.hidden = false;
    caja.innerHTML = '<p class="text-gray text-sm">Cargando…</p>';

    try {
      const d = await window.SupportAPI.detalleIncidencia(ticketId);
      caja.innerHTML = this._detalle(d);

      // Abrir el detalle es leerlo: se marca la ultima respuesta como vista y
      // se repinta la lista para que desaparezca el aviso.
      const respuestas = (d && d.respuestas) || [];
      if (respuestas.length) {
        this._marcarLeida(ticketId, respuestas[respuestas.length - 1].fecha);
        const fila = document.querySelector(`[data-ticket="${ticketId}"] .badge-success`);
        if (fila && fila.textContent === 'Respuesta nueva') fila.remove();
      }
    } catch (e) {
      caja.innerHTML = `<p class="text-gray text-sm">${this._escapar(
        (e && e.message) || 'No se pudo cargar la incidencia',
      )}</p>`;
    }
  },

  _detalle(d) {
    if (!d) return '<p class="text-gray text-sm">Sin datos.</p>';
    const filas = [
      ['Referencia', d.ticket_id],
      ['Estado', window.SupportAPI.textoEstado(d.estado)],
      ['Severidad', this._textoSeveridad(d.severidad)],
      ['Reportada', this._fecha(d.created_at)],
      ['Actualizada', this._fecha(d.updated_at)],
    ];
    if (d.cerrada_at) filas.push(['Resuelta', this._fecha(d.cerrada_at)]);

    return `
      <div class="detalle-incidencia"
           style="border-top:1px solid rgba(255,255,255,0.10); padding-top:10px">
        ${filas
          .filter(([, v]) => v)
          .map(
            ([k, v]) => `
          <div class="flex justify-between gap-10 text-sm mb-5">
            <span class="text-gray">${k}</span>
            <span>${this._escapar(v)}</span>
          </div>`,
          )
          .join('')}
        ${this._hilo(d)}
      </div>`;
  },

  /** Respuestas del equipo, de la mas antigua a la mas reciente. */
  _hilo(d) {
    const respuestas = (d && d.respuestas) || [];

    if (!respuestas.length) {
      return `
        <p class="text-gray text-sm mt-10">
          ${
            d.estado === 'resuelta'
              ? 'Esta incidencia se ha dado por resuelta.'
              : 'Cuando el equipo responda, lo verás aquí.'
          }
        </p>`;
    }

    return `
      <div class="mt-15">
        <div class="text-gray text-sm mb-10">Respuestas del equipo</div>
        ${respuestas.map((r) => this._mensaje(r)).join('')}
      </div>`;
  },

  _mensaje(r) {
    // El texto llega de GitHub en Markdown. No se interpreta: se escapa y se
    // respetan los saltos de linea. Renderizar Markdown aqui significaria
    // meter HTML de terceros en la pantalla del usuario a cambio de casi nada.
    const texto = this._escapar(r.texto).replace(/\n/g, '<br>');
    return `
      <div class="mb-10 p-10"
           style="background:rgba(255,255,255,0.04); border-radius:8px;
                  border-left:3px solid ${r.cierre ? 'var(--color-success, #7cc00b)' : 'rgba(255,255,255,0.15)'}">
        <div class="text-gray text-sm mb-5">
          ${r.cierre ? 'Cierre · ' : ''}${this._fechaHora(r.fecha)}
        </div>
        <div class="text-sm">${texto}</div>
      </div>`;
  },

  _fechaHora(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  },

  _textoSeveridad(sev) {
    if (sev === 'alta') return 'Alta';
    if (sev === 'media') return 'Media';
    if (sev === 'baja') return 'Baja';
    return sev || '';
  },

  _claseEstado(estado) {
    if (estado === 'resuelta') return 'badge-success';
    if (estado === 'curso') return 'badge-info';
    if (estado === 'revision') return 'badge-warning';
    return '';
  },

  _fecha(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  },

  _escapar(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};

window.MisIncidenciasView = MisIncidenciasView;
