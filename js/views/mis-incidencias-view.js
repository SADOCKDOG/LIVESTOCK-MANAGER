/**
 * Livestock Manager - MisIncidenciasView v1.2.0
 *
 * Listado de las incidencias propias, con su estado y con las respuestas del
 * equipo. El usuario nunca ve GitHub: aqui solo hay incidencias con estado en
 * espanol y mensajes, no issues ni comentarios.
 *
 * No exige licencia activa: quien la deja caducar sigue viendo lo que reporto
 * y lo que le han contestado, aunque no pueda abrir nada nuevo.
 *
 * El estado de «leido» y los textos de estado viven en SupportAPI, no aqui:
 * los comparte con el aviso de arranque.
 */

const MisIncidenciasView = {
  _cargando: false,

  async render() {
    const main = document.getElementById('app-content');

    if (!window.SupportAPI || !window.SupportAPI.tieneSesion()) {
      main.innerHTML = `
        ${this._cabecera()}
        <div class="card p-20 mt-10">
          <p class="text-gray mt-10">Entra en Soporte para ver tus incidencias.</p>
          <fieldset class="erp-action-group erp-action-group--centro mt-20">
            <legend>Soporte</legend>
            <div class="erp-action-group-body">
              <button class="btn btn-primary" onclick="location.hash='#/soporte'">Ir a Soporte</button>
            </div>
          </fieldset>
        </div>`;
      return;
    }

    main.innerHTML = `
      ${this._cabecera()}
      <div class="card p-20 mt-10">
        <div id="incidencias-lista" class="mt-10">
          <p class="text-gray">Cargando…</p>
        </div>
        <fieldset class="erp-action-group erp-action-group--centro mt-20">
          <legend>Acciones</legend>
          <div class="erp-action-group-body">
            <button class="btn btn-primary" onclick="location.hash='#/soporte'">
              Contar una incidencia
            </button>
            <button class="btn btn-secondary" onclick="MisIncidenciasView.recargar()">
              Actualizar
            </button>
          </div>
        </fieldset>
      </div>
      ${this._ayuda()}`;

    await this._cargar();
  },

  /**
   * Volver a Ajustes, que es de donde se llega. Es un destino fijo y no
   * history.back() a proposito: tras confirmar una incidencia se aterriza aqui
   * desde Soporte, y retroceder devolveria al formulario recien enviado.
   */
  _cabecera() {
    return `
      <div class="p-16 mb-20">
        <a href="#/ajustes" class="link-back">← Volver a Ajustes</a>
        <h2 class="mt-10 font-900 uppercase tracking-wider text-white">
          <span style="color: var(--neon);">|</span> MIS INCIDENCIAS
        </h2>
      </div>`;
  },

  /**
   * Que significa cada estado y que se espera del usuario. Va al pie y
   * plegado: estorba a quien ya lo sabe, pero sin ello la primera vez no hay
   * forma de saber si «Enviada» durante dos dias es normal o es un fallo.
   */
  _ayuda() {
    const estados = window.SupportAPI.ESTADOS;
    const expl = window.SupportAPI.EXPLICACION_ESTADOS;
    const filas = Object.keys(estados)
      .map(
        (clave) => `
        <div class="flex gap-10 items-start mb-10">
          <span class="badge ${this._claseEstado(clave)}" style="flex:0 0 auto">${estados[clave]}</span>
          <span class="text-sm text-gray">${expl[clave] || ''}</span>
        </div>`,
      )
      .join('');

    return `
      <details class="card p-20 mt-10">
        <summary class="font-bold" style="cursor:pointer">Cómo funciona el soporte</summary>
        <div class="mt-15">
          ${filas}
          <div class="text-sm text-gray mt-15" style="border-top:1px solid rgba(255,255,255,0.10); padding-top:10px">
            <p class="mb-5">
              · Toca una incidencia para ver los detalles y las respuestas del equipo.
            </p>
            <p class="mb-5">
              · Cuando haya respuesta verás el aviso <b>Respuesta nueva</b> en la fila.
            </p>
            <p class="mb-5">
              · Si te piden más datos, cuéntalos abriendo una incidencia nueva y menciona
              la referencia de esta; así no se pierde el hilo.
            </p>
            <p class="mb-5">
              · Las respuestas llegan a este listado, no por correo. Consulta cada pocos días.
            </p>
            <p>
              · Lo enviado incluye la versión de la app y el modelo del móvil. Nunca se
              envían tus datos de animales ni de la explotación.
            </p>
          </div>
        </div>
      </details>`;
  },

  async recargar() {
    const contenedor = document.getElementById('incidencias-lista');
    if (contenedor) contenedor.innerHTML = '<p class="text-gray">Cargando…</p>';
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
    const nuevas = window.SupportAPI.tieneRespuestaNueva(incidencia);
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
      // se quita el aviso de la fila.
      const respuestas = (d && d.respuestas) || [];
      if (respuestas.length) {
        window.SupportAPI.marcarLeida(ticketId, respuestas[respuestas.length - 1].fecha);
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

    const explicacion = window.SupportAPI.EXPLICACION_ESTADOS[d.estado];

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
        ${explicacion ? `<p class="text-gray text-sm mt-10">${explicacion}</p>` : ''}
        ${this._hilo(d)}
      </div>`;
  },

  /** Respuestas a la incidencia, de la mas antigua a la mas reciente. */
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
        <div class="text-gray text-sm mb-10">Respuestas</div>
        ${respuestas.map((r) => this._mensaje(r)).join('')}
      </div>`;
  },

  _mensaje(r) {
    // El texto llega de GitHub en Markdown. No se interpreta: se escapa y se
    // respetan los saltos de linea. Renderizar Markdown aqui significaria
    // meter HTML de terceros en la pantalla del usuario a cambio de casi nada.
    const texto = this._escapar(r.texto).replace(/\n/g, '<br>');

    // Quien responde se dice siempre. Un primer analisis automatico y la
    // respuesta de una persona no valen lo mismo, y confundirlos deja al
    // usuario esperando a alguien que todavia no ha entrado. Las respuestas
    // anteriores al asistente no traen `autor`: eran todas del equipo.
    const deIA = r.autor === 'ia';
    const quien = deIA ? 'Asistente automático' : 'Equipo';
    const borde = r.cierre
      ? 'var(--color-success, #7cc00b)'
      : deIA
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(255,255,255,0.15)';

    return `
      <div class="mb-10 p-10"
           style="background:rgba(255,255,255,0.04); border-radius:8px;
                  border-left:3px solid ${borde}">
        <div class="text-gray text-sm mb-5">
          ${r.cierre ? 'Cierre · ' : ''}${quien} · ${this._fechaHora(r.fecha)}
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
