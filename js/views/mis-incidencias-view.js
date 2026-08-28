/**
 * Livestock Manager - MisIncidenciasView v1.0.0
 *
 * Listado de las incidencias propias con su estado. El usuario nunca ve GitHub:
 * aqui solo hay incidencias con estado en espanol.
 *
 * No exige licencia activa: quien la deja caducar sigue viendo lo que reporto,
 * aunque no pueda abrir nada nuevo.
 */

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
    return `
      <div class="card-registro mb-10" data-ticket="${id}">
        <div class="flex items-center justify-between gap-10"
             style="cursor:pointer"
             onclick="MisIncidenciasView.alternarDetalle('${id}')">
          <div>
            <div class="font-bold">${this._escapar(incidencia.titulo)}</div>
            <div class="text-gray text-sm">${this._fecha(incidencia.created_at)}</div>
          </div>
          <span class="badge ${clase}">${estado}</span>
        </div>
        <div class="mt-10" id="detalle-${id}" hidden></div>
      </div>`;
  },

  /**
   * Abre o cierra el detalle de una incidencia. El backend solo guarda
   * metadatos (la descripcion vive en el issue de GitHub), asi que aqui se
   * muestra lo que hay: identificador, severidad y ultima actualizacion.
   */
  async alternarDetalle(ticketId) {
    const caja = document.getElementById('detalle-' + ticketId);
    if (!caja) return;

    if (!caja.hidden) {
      caja.hidden = true;
      return;
    }

    caja.hidden = false;
    // Solo se pide una vez: los metadatos no cambian mientras la vista vive.
    if (caja.dataset.cargado === '1') return;
    caja.innerHTML = '<p class="text-gray text-sm">Cargando…</p>';

    try {
      const d = await window.SupportAPI.detalleIncidencia(ticketId);
      caja.innerHTML = this._detalle(d);
      caja.dataset.cargado = '1';
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
        <p class="text-gray text-sm mt-10">
          Cuando el equipo responda, el estado cambiará aquí.
        </p>
      </div>`;
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
