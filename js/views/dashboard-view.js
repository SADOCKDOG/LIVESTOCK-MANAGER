/**
 * Livestock Manager - DashboardView v1.0.0
 * Vista principal del Dashboard extraída de App.js para modularización.
 * Utiliza EventBus, CacheService y AlertasService.
 */

const DashboardView = {
  /**
   * Renderizar el dashboard completo
   */
  async render() {
    const main = document.getElementById('app-content');
    main.innerHTML = this._buildSkeleton();

    const finca = await CacheService.getOrFetch('finca_active', () => Fincas.getActive(), 30000);
    const rebanos = await CacheService.getOrFetch('rebanos_all', () => Rebanos.list(), 10000);
    const animales = await CacheService.getOrFetch('animales_all', () => Animales.list(), 10000);
    const rent = await CacheService.getOrFetch('analitica_' + finca.id, () => Analitica.obtenerRentabilidadFinca(finca.id), 60000);
    const censo = await Analitica.obtenerCensoRebanos(finca.id).catch(() => []);

    const alertas = window.AlertasService ? await window.AlertasService.getAll() : { sanitarias: [], trazabilidad: [], administrativas: [], calendario: null };
    const alertasSanitarias = alertas.sanitarias || [];
    const alertasTrazabilidad = alertas.trazabilidad || [];
    const alertasAdministrativas = alertas.administrativas || [];
    const alertaEpoca = alertas.calendario || { titulo: 'Calendario Preventivo', sugerencias: [] };

    const kpisDiarios = await this._calcularKPIsDiarios(finca, rebanos, animales);
    const indicadoresLeche = await this._calcularIndicadoresLacteos(finca);

    main.innerHTML = await this._buildHTML(finca, rebanos, animales, rent, censo, alertasSanitarias, alertasTrazabilidad, alertasAdministrativas, alertaEpoca, kpisDiarios, indicadoresLeche);

    this._suscribirAlertasVivo();
  },

  _buildSkeleton() {
    return `
      <div class="py-10">
        <div class="skeleton-card mb-25">
          <div class="skeleton-title" style="width:50%; margin:0 auto 20px;"></div>
          <div class="grid grid-cols-3 gap-12">
            <div class="skeleton" style="height:60px;"></div>
            <div class="skeleton" style="height:60px;"></div>
            <div class="skeleton" style="height:60px;"></div>
          </div>
        </div>
        <div class="skeleton-card mb-20">
          <div class="skeleton-title" style="width:40%; margin-bottom:15px;"></div>
          <div class="grid grid-cols-3 gap-8">
            <div class="skeleton rounded-sm" style="height:52px;"></div>
            <div class="skeleton rounded-sm" style="height:52px;"></div>
            <div class="skeleton rounded-sm" style="height:52px;"></div>
          </div>
        </div>
        <div class="skeleton-card mb-20">
          <div class="skeleton-title" style="width:35%; margin-bottom:12px;"></div>
          <div class="skeleton-line w-full mb-10"></div>
          <div class="skeleton-line" style="width:90%; margin-bottom:10px;"></div>
          <div class="skeleton-line" style="width:75%;"></div>
        </div>
        <div class="skeleton-card mb-25">
          <div class="skeleton-title" style="width:45%; margin-bottom:12px;"></div>
          <div class="skeleton-line w-full mb-8"></div>
          <div class="skeleton-line" style="width:80%; margin-bottom:8px;"></div>
          <div class="skeleton-line" style="width:60%;"></div>
        </div>
        <div class="skeleton-card">
          <div class="skeleton-title" style="width:35%; margin-bottom:15px;"></div>
          <div class="flex justify-between">
            <div class="flex-1">
              <div class="skeleton-line" style="width:60%; margin-bottom:8px;"></div>
              <div class="skeleton rounded-sm" style="height:32px; width:55%;"></div>
            </div>
            <div class="flex-1 text-right">
              <div class="skeleton-line" style="width:50%; margin-bottom:8px; margin-left:auto;"></div>
              <div class="skeleton-line" style="width:40%; margin-left:auto;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _suscribirAlertasVivo() {
    if (this._unsuscribeAlertas) this._unsuscribeAlertas();
    if (!window.EventBus) return;
    this._unsuscribeAlertas = window.EventBus.on('alertas:updated', (alertas) => {
      const c = document.getElementById('dash-alertas-container');
      if (!c) return;
      c.innerHTML = ''
        + (alertas?.sanitarias?.length ? this._renderAlertasSanitarias(alertas.sanitarias) : '')
        + (alertas?.trazabilidad?.length ? this._renderAlertasTrazabilidad(alertas.trazabilidad) : '')
        + (alertas?.administrativas?.length ? this._renderAlertasAdministrativas(alertas.administrativas) : '');
    });
  },

  async _buildHTML(finca, rebanos, animales, rent, censo, alertasSanitarias, alertasTrazabilidad, alertasAdministrativas, alertaEpoca, kpisDiarios, indicadoresLeche) {
    const activos = animales.filter(a => a.estado === 'activo').length;
    const balanceTotal = rent?.balance || 0;
    const pctRent = rent?.ingresos > 0 ? ((balanceTotal / rent.ingresos) * 100).toFixed(1) : '0.0';
    const totalCenso = censo.reduce((s, r) => s + r.total, 0);
    const totalActivos = censo.reduce((s, r) => s + r.activos, 0);
    const totalVendidos = censo.reduce((s, r) => s + r.vendidos, 0);

    const modoAuto = (() => {
      let tieneCarne = false, tieneLeche = false, tieneHibrido = false;
      rebanos.forEach(r => {
        const tipo = (r.tipo || '').toLowerCase();
        if (tipo.includes('carne') || tipo.includes('cárn')) tieneCarne = true;
        else if (tipo.includes('leche') || tipo.includes('láct')) tieneLeche = true;
        else if (tipo.includes('mixt') || tipo.includes('híbr') || tipo.includes('doble')) tieneHibrido = true;
      });
      if (tieneHibrido || (tieneCarne && tieneLeche)) return 'hibrido';
      if (tieneLeche) return 'leche';
      return 'carne';
    })();
    const modoColor = modoAuto === 'carne' ? 'var(--c-danger)' : modoAuto === 'leche' ? 'var(--c-info)' : 'var(--c-success)';
    const modoLabel = modoAuto === 'hibrido' ? 'Híbrido' : modoAuto === 'leche' ? 'Leche' : 'Carne';
    const modoIcon = modoAuto === 'hibrido' ? Icons.rotacion() : modoAuto === 'leche' ? Icons.leche() : Icons.carne();
    const isFreeDashboard = window.PremiumManager && window.PremiumManager.isFree();

    return `
      ${isFreeDashboard ? `
      <div class="mb-14 p-14" style="background:linear-gradient(135deg,rgba(217,119,6,0.08),rgba(180,83,9,0.04));border:1px solid rgba(217,119,6,0.2);border-radius:14px;display:flex;align-items:center;gap:12px;">
        <div style="flex-shrink:0;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--c-warning),var(--c-warning));display:flex;align-items:center;justify-content:center;">
          ${Icons.premium()}
        </div>
        <div class="flex-1" style="line-height:1.4;">
          <div class="text-white text-xs font-900 uppercase tracking-wider">Versi&oacute;n Gratuita</div>
          <div class="text-gray text-[0.6rem] mt-2">Actualiza a Premium para desbloquear todas las funciones</div>
        </div>
        <button onclick="window.PurchaseManager && window.PurchaseManager.purchase()" style="flex-shrink:0;background:linear-gradient(135deg,var(--c-warning),var(--c-warning));border:none;padding:8px 16px;border-radius:10px;color:#fff;font-size:0.65rem;font-weight:900;text-transform:uppercase;cursor:pointer;">${Icons.estrella()} Premium</button>
      </div>
      ` : ''}
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <!-- Resumen General -->
        <div class="card" style="grid-column: span 12; margin-bottom: 0; padding: 24px; text-align: center;">
          <h3 style="color: var(--text-s); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; font-weight: 900; letter-spacing: 0.1em; border-bottom: none; padding-bottom: 0;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> ${finca.nombre || 'RESUMEN GANADERO'}</h3>
          <div style="font-size: 3.5rem; font-weight: 900; line-height: 1; margin-bottom: 20px; color: var(--header-neon-color, var(--p-gold)); text-shadow: 0 0 15px rgba(255,255,255,0.15);">${totalCenso || animales.length} <span style="font-size: 0.4em; font-weight: 700; color: var(--text-s); text-shadow: none;">cab.</span></div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; border-top: 1px solid #2a2a2a; padding-top: 20px;">
            <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">REBAÑOS</div><div style="font-size: 1.1rem; font-weight: 800; border: 1px solid var(--c-warning); color: var(--c-warning); background: rgba(255, 215, 0, 0.1); padding: 6px 12px; border-radius: 8px; display: inline-block;">${rebanos.length}</div></div>
            <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">ACTIVOS</div><div style="font-size: 1.1rem; font-weight: 800; border: 1px solid var(--c-success); color: var(--c-success); background: rgba(204, 255, 0, 0.1); padding: 6px 12px; border-radius: 8px; display: inline-block;">${totalActivos || activos}</div></div>
            <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">VENDIDOS</div><div style="font-size: 1.1rem; font-weight: 800; border: 1px solid var(--c-danger); color: var(--c-danger); background: rgba(255, 68, 68, 0.1); padding: 6px 12px; border-radius: 8px; display: inline-block;">${totalVendidos}</div></div>
          </div>
        </div>
      </div>

      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <!-- Balance Económico -->
        <div class="card" style="grid-column: span 12; margin-bottom: 0; padding: 24px; text-align: center;">
          <h3 style="color: var(--text-s); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; font-weight: 900; letter-spacing: 0.1em; border-bottom: none; padding-bottom: 0;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> BALANCE ECONÓMICO</h3>
          <div style="font-size: 3.5rem; font-weight: 900; line-height: 1; margin-bottom: 20px;" class="${balanceTotal >= 0 ? 'text-lime' : 'text-red'}">${balanceTotal.toLocaleString()} <span style="font-size: 0.4em; font-weight: 700;" class="text-grey">€</span></div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; border-top: 1px solid #2a2a2a; padding-top: 20px;">
            <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">INGRESOS</div><div style="font-size: 1rem; font-weight: 800; border: 1px solid var(--c-success); color: var(--c-success); background: rgba(204, 255, 0, 0.1); padding: 6px 12px; border-radius: 8px; display: inline-block;">${(rent?.ingresos || 0).toLocaleString()}€</div></div>
            <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">GASTOS</div><div style="font-size: 1rem; font-weight: 800; border: 1px solid var(--c-danger); color: var(--c-danger); background: rgba(255, 68, 68, 0.1); padding: 6px 12px; border-radius: 8px; display: inline-block;">${(rent?.gastos || 0).toLocaleString()}€</div></div>
            <div><div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">RENT.</div><div style="font-size: 1rem; font-weight: 800; border: 1px solid ${parseFloat(pctRent) > 0 ? 'var(--c-success)' : 'var(--c-danger)'}; color: ${parseFloat(pctRent) > 0 ? 'var(--c-success)' : 'var(--c-danger)'}; background: ${parseFloat(pctRent) > 0 ? 'rgba(204, 255, 0, 0.1)' : 'rgba(255, 68, 68, 0.1)'}; padding: 6px 12px; border-radius: 8px; display: inline-block;">${pctRent}%</div></div>
          </div>
        </div>
      </div>

      ${this._renderKPIsDiariosCard(kpisDiarios)}

      <!-- Alertas -->
      <div id="dash-alertas-container">
        ${this._renderAlertasSanitarias(alertasSanitarias)}
        ${this._renderAlertasTrazabilidad(alertasTrazabilidad)}
        ${this._renderAlertasAdministrativas(alertasAdministrativas)}
      </div>

      ${this._renderIndicadoresLacteos(indicadoresLeche)}

      <!-- Calendario Preventivo -->
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <div class="card" style="grid-column: span 12; margin-bottom: 0; padding: 24px; text-align: center;">
          <h3 style="color: var(--text-s); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; font-weight: 900; letter-spacing: 0.1em; border-bottom: none; padding-bottom: 0;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> ${(alertaEpoca.titulo || 'Calendario Preventivo').replace(/^[^\w\s]+\s*/u, '')}</h3>
          ${alertaEpoca.sugerencias?.length > 0 ? `
          <ul class="text-xs text-gray m-0 leading-relaxed pl-16" style="text-align: left; margin-bottom: 20px;">
            ${alertaEpoca.sugerencias.map(s => `<li class="mb-3">${s}</li>`).join('')}
          </ul>` : '<div class="text-grey" style="font-size: 0.8rem; margin-bottom: 20px;">Sin sugerencias para esta temporada.</div>'}
          <div class="text-center" style="border-top: 1px solid #2a2a2a; padding-top: 20px;">
            <a href="#/alertas" class="text-blue no-underline" style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Ver Alertas Completas ${Icons.siguiente()}</a>
          </div>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <div class="card" style="grid-column: span 12; margin-bottom: 0; padding: 24px; text-align: center;">
          <h3 style="color: var(--text-s); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; font-weight: 900; letter-spacing: 0.1em; border-bottom: none; padding-bottom: 0;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> ACCESOS RÁPIDOS</h3>
          <div class="grid grid-cols-12 gap-8">
            <a href="#/animales" class="widget-link-btn widget-link-btn--neon neon-danger" style="height: 60px; grid-column: span 6;">
              ${Icons.animales()}
              <span class="widget-link-label">Animales</span>
            </a>
            <a href="#/rebanos" class="widget-link-btn widget-link-btn--neon neon-info" style="height: 60px; grid-column: span 6;">
              ${Icons.rebanos()}
              <span class="widget-link-label">Rebaños</span>
            </a>
            <a href="#/${modoAuto}" class="widget-link-btn widget-link-btn--neon" style="--neon-color:${modoColor};--neon-glow:${modoColor}B0;--neon-inner:${modoColor}40; height: 60px; grid-column: span 6;">
              ${modoIcon}
              <span class="widget-link-label">${modoLabel}</span>
            </a>
            <a href="#/informes" class="widget-link-btn widget-link-btn--neon neon-success" style="height: 60px; grid-column: span 6;">
              ${Icons.tendencia()}
              <span class="widget-link-label">Informes</span>
            </a>
          </div>
        </div>
      </div>

      <div class="fab-container" onclick="App._abrirSubmenuRegistros({ origen_modulo: 'dashboard' })">
        <span class="fab-label">Nueva Actividad</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>
    `;
  },

  _renderAlertasSanitarias(alertas) {
    if (!alertas.length) return '';
    return `
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <div class="card-registro" style="--registro-color: var(--c-danger); grid-column: span 12; margin-bottom: 0; padding: 20px; text-align: center; border-top: none !important; background: rgba(255,255,255,0.02);">
          <h3 style="color: var(--c-danger); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 700; letter-spacing: 0.1em;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> ALERTAS SANITARIAS <span class="bg-pill-red text-red" style="font-weight: 800; padding: 2px 6px; border-radius: 6px; margin-left: 8px;">${alertas.length}</span></h3>
          <div style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
            ${alertas.slice(0, 3).map(a => `
              <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 4px solid ${a.urgencia === 'rojo' ? 'var(--c-danger)' : 'var(--c-warning)'};">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <div style="color: #FFF; font-weight: 700; font-size: 0.9rem; text-transform: uppercase;">${a.medicamento}</div>
                    <div style="color: var(--text-s); font-size: 0.65rem; margin-top: 4px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">${Icons.paquete()} ${a.rebanoNombre || 'Lote desconocido'}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--c-danger); font-weight: 900; font-size: 1.1rem;">${a.diasRestantes}D</div>
                    <div style="color: var(--text-s); font-size: 0.55rem; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Supresión</div>
                  </div>
                </div>
              </div>
            `).join('')}
            ${alertas.length > 3 ? `<div style="text-align: center; color: var(--text-s); font-size: 0.7rem; margin-top: 10px;">+${alertas.length - 3} alertas más activas</div>` : ''}
          </div>
        </div>
      </div>`;
  },

  _renderAlertasTrazabilidad(alertas) {
    if (!alertas.length) return '';
    return `
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <div class="card-registro" style="--registro-color: var(--c-warning); grid-column: span 12; margin-bottom: 0; padding: 20px; text-align: center; background: rgba(255,255,255,0.02);">
          <h3 style="color: var(--c-orange); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 700; letter-spacing: 0.1em;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> ALERTAS TRAZABILIDAD <span class="bg-pill-gold text-gold" style="font-weight: 800; padding: 2px 6px; border-radius: 6px; margin-left: 8px;">${alertas.length}</span></h3>
          <div style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
            ${alertas.slice(0, 3).map(a => `
              <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 4px solid ${a.urgencia === 'rojo' ? 'var(--c-danger)' : 'var(--c-warning)'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="color: #FFF; font-weight: 900; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">${a.crotal}</div>
                    <div style="color: var(--text-s); font-size: 0.65rem; margin-top: 4px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">${a.mensaje}</div>
                  </div>
                  <div style="color: ${a.urgencia === 'rojo' ? 'var(--c-danger)' : 'var(--c-warning)'}; font-size: 1.2rem;">${a.urgencia === 'rojo' ? Icons.alerta() : Icons.calendar()}</div>
                </div>
              </div>
            `).join('')}
            ${alertas.length > 3 ? `<div style="text-align: center; color: var(--text-s); font-size: 0.7rem; margin-top: 10px;">+${alertas.length - 3} alertas más</div>` : ''}
          </div>
        </div>
      </div>`;
  },

  _renderAlertasAdministrativas(alertas) {
    if (!alertas.length) return '';
    return `
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <div class="card-registro" style="--registro-color: var(--c-warning); grid-column: span 12; margin-bottom: 0; padding: 20px; text-align: center; background: rgba(255,255,255,0.02);">
          <h3 style="color: var(--c-purple); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 700; letter-spacing: 0.1em;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> GESTIÓN / PAC <span class="badge rounded-xl badge-solid-purple" style="font-weight: 800; padding: 2px 6px; border-radius: 6px; margin-left: 8px;">${alertas.length}</span></h3>
          <div style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
            ${alertas.slice(0, 4).map(a => {
              let iconoSVG = Icons.info();
              if (a.seccion === 'contrato_lacteo') iconoSVG = Icons.contratos();
              else if (a.seccion === 'infolac') iconoSVG = Icons.grafico();
              else if (a.seccion === 'pac') iconoSVG = Icons.pac();
              else if (a.seccion === 'adsg') iconoSVG = Icons.veterinario();

              const bColor = a.urgencia === 'rojo' ? 'var(--c-danger)' : a.urgencia === 'amarillo' ? 'var(--c-warning)' : 'var(--c-success)';

              return `
              <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 4px solid ${bColor};">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--c-purple);">${iconoSVG}</span>
                    <div>
                      <div style="color: #FFF; font-weight: 700; font-size: 0.85rem; text-transform: uppercase;">${a.mensaje}</div>
                      ${a.accion ? `<div style="color: var(--c-purple); font-size: 0.65rem; margin-top: 4px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; gap: 4px;">${Icons.info()} ${a.accion}</div>` : ''}
                    </div>
                  </div>
                  ${a.diasRestantes != null ? `<div style="text-align: right;">
                    <div style="color: var(--c-danger); font-weight: 900; font-size: 1.1rem;">${a.diasRestantes}D</div>
                    <div style="color: #64748B; font-size: 0.55rem; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Restantes</div>
                  </div>` : `<div style="color:${a.urgencia === 'rojo' ? 'var(--c-danger)' : 'var(--c-warning)'}; font-size: 1.2rem;">${a.urgencia === 'rojo' ? Icons.alerta() : Icons.calendar()}</div>`}
                </div>
              </div>`;
            }).join('')}
            ${alertas.length > 4 ? `<div style="text-align: center; color: var(--text-s); font-size: 0.7rem; margin-top: 10px;">+${alertas.length - 4} alertas más</div>` : ''}
          </div>
        </div>
      </div>`;
  },

  /**
   * Calcula indicadores lácteos (separado del render para evitar [object Promise])
   */
  async _calcularIndicadoresLacteos(finca) {
    try {
      const fincaId = finca?.id;
      if (!fincaId) return null;
      const entregas = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []);
      if (!entregas.length) return null;
      const ahora = new Date();
      const doceMeses = new Date(ahora);
      doceMeses.setMonth(doceMeses.getMonth() - 12);
      const recientes = entregas.filter(e => new Date(e.fechaRecogida) >= doceMeses);
      if (!recientes.length) return null;
      const numEntregas = recientes.length;
      const litrosTotal = recientes.reduce((s, e) => s + (e.cantidad || 0), 0);
      const precioFinalMedio = numEntregas > 0 ? recientes.reduce((s, e) => s + (e.precio_final_unitario || e.precioBase || 0), 0) / numEntregas : 0;
      const importeTotal = recientes.reduce((s, e) => s + (e.importe_total || e.cantidad * e.precioBase || 0), 0);
      const mofaTotal = recientes.reduce((s, e) => s + (e.mofa || 0), 0);
      const mofaRatio = importeTotal > 0 ? (mofaTotal / importeTotal) * 100 : 0;
      const conLab = recientes.filter(e => e.laboratorio?.grasa != null);
      const esTotal = conLab.reduce((s, e) => s + (e.laboratorio.extracto_seco || (e.laboratorio.grasa || 0) + (e.laboratorio.proteina || 0)), 0);
      const esMedia = conLab.length > 0 ? esTotal / conLab.length : 0;
      return { numEntregas, litrosTotal, precioFinalMedio, importeTotal, mofaTotal, mofaRatio, conLab, esMedia, meses: Math.max(1, Math.round((ahora - doceMeses) / 2629800000)) };
    } catch (e) { console.warn('[Dashboard] Error indicadores lácteos:', e); return null; }
  },

  /**
   * Renderiza indicadores lácteos desde datos pre-calculados
   */
  _renderIndicadoresLacteos(indicadores) {
    if (!indicadores) return '';
    const { numEntregas, litrosTotal, precioFinalMedio, mofaTotal, mofaRatio, conLab, esMedia, meses } = indicadores;
    return `
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <div class="card" style="grid-column: span 12; margin-bottom: 0; padding: 24px; text-align: center;">
          <h3 style="color: var(--text-s); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; font-weight: 900; letter-spacing: 0.1em; border-bottom: none; padding-bottom: 0;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> INDICADORES LÁCTEOS <span style="font-size: 0.6rem; color: #64748B; text-transform: none;">(últimos 12 meses)</span></h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; border-top: 1px solid #2a2a2a; padding-top: 20px;">
            <div>
              <div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">MOFA</div>
              <div style="font-weight: 800; border: 1px solid ${mofaRatio >= 20 ? 'var(--c-success)' : 'var(--c-warning)'}; color: ${mofaRatio >= 20 ? 'var(--c-success)' : 'var(--c-warning)'}; background: ${mofaRatio >= 20 ? 'rgba(204, 255, 0, 0.1)' : 'rgba(255, 215, 0, 0.1)'}; padding: 6px 12px; border-radius: 8px; display: inline-block;">${Math.round(mofaTotal / meses).toLocaleString()}€</div>
              <div style="font-size: 0.55rem; color: #64748B; margin-top: 4px;">${mofaRatio.toFixed(1)}%</div>
            </div>
            <div>
              <div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">PRECIO</div>
              <div style="font-weight: 800; border: 1px solid var(--c-info); color: var(--c-info); background: rgba(79, 172, 254, 0.1); padding: 6px 12px; border-radius: 8px; display: inline-block;">${precioFinalMedio.toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
              <div style="font-size: 0.55rem; color: #64748B; margin-top: 4px;">€/L</div>
            </div>
            <div>
              <div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">EXT. SECO</div>
              <div style="font-weight: 800; border: 1px solid var(--c-purple); color: var(--c-purple); background: rgba(192, 132, 252, 0.1); padding: 6px 12px; border-radius: 8px; display: inline-block;">${esMedia.toFixed(2)}%</div>
              <div style="font-size: 0.55rem; color: #64748B; margin-top: 4px;">${conLab.length} anal.</div>
            </div>
          </div>
          <div class="text-center" style="border-top: 1px solid #2a2a2a; padding-top: 20px; margin-top: 20px;">
            <a href="#/leche" class="text-gold no-underline" style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Control Lechero Detallado ${Icons.siguiente()}</a>
          </div>
        </div>
      </div>`;
  },

  /**
   * Calcula los KPIs diarios de producción:
   * 1. Media litros/oveja/día
   * 2. Eficiencia del pienso (g/L)
   * 3. % bajas y mamitis
   */
  async _calcularKPIsDiarios(finca, rebanos, animales) {
    const vacio = { litrosPorOveja: null, eficienciaPienso: null, pctBajas: null };
    try {
      const fincaId = finca.id;
      if (!fincaId) return vacio;

      // ── Hembras activas en especies lecheras ──
      const hembras = animales.filter(a =>
        a.estado === 'activo' &&
        a.sexo === 'H' &&
        ['Vacas', 'Ovejas', 'Cabras'].includes(a.especie)
      );
      const totalHembras = hembras.length;
      if (!totalHembras) return vacio;

      // ── Leche últimos 7 días (tanque) ──
      const entregas = await window.db.getAllFromIndex('comercializacion_leche', 'fincaId', fincaId).catch(() => []);
      const hoy = new Date();
      const hace7d = new Date(hoy); hace7d.setDate(hace7d.getDate() - 7);
      const hace30d = new Date(hoy); hace30d.setDate(hace30d.getDate() - 30);

      const ult7d = entregas.filter(e => new Date(e.fechaRecogida) >= hace7d);
      const ult30d = entregas.filter(e => new Date(e.fechaRecogida) >= hace30d);

      const litros7d = ult7d.reduce((s, e) => s + (e.cantidad || 0), 0);
      const litros30d = ult30d.reduce((s, e) => s + (e.cantidad || 0), 0);

      // 1. Media litros/oveja/día
      const mediaDiaria = litros7d > 0
        ? (litros7d / 7 / totalHembras)
        : null;

      // 2. Eficiencia del pienso (g de pienso / L de leche)
      // Asumimos precio medio pienso ~0,30 €/kg
      const gastos = await window.db.getAllFromIndex('gastos_ganaderia', 'fincaId', fincaId).catch(() => []);
      const gastos30d = gastos.filter(g =>
        g.categoria === 'Alimentacion' && new Date(g.fecha) >= hace30d
      );
      const costeAlim30d = gastos30d.reduce((s, g) => s + (g.monto || 0), 0);
      const PRECIO_PIENSO_REF = 0.30; // €/kg estimado
      const kgPienso = costeAlim30d > 0 ? costeAlim30d / PRECIO_PIENSO_REF : 0;
      const eficiencia = litros30d > 0 && kgPienso > 0
        ? Math.round((kgPienso * 1000) / litros30d) // gramos por litro
        : null;

      // 3. % bajas y mamitis
      const sanitarios = await window.db.getAllFromIndex('sanitarios_ganado', 'rebanoId', 0).catch(() => []);
      // sanidad no tiene índice por finca, así que obtenemos por rebaño
      const rebanosFinca = rebanos.filter(r => r.fincaId === fincaId || !r.fincaId);
      let tratamientosMamitis = 0;
      for (const r of rebanosFinca) {
        try {
          const regs = await window.db.getAllFromIndex('sanitarios_ganado', 'rebanoId', r.id).catch(() => []);
          tratamientosMamitis += regs.filter(s =>
            new Date(s.fecha) >= hace30d &&
            (s.enfermedad || '').toLowerCase().includes('mamitis')
          ).length;
        } catch (_) {}
      }
      const pctBajas = tratamientosMamitis > 0
        ? ((tratamientosMamitis / totalHembras) * 100).toFixed(1)
        : null;

      return { litrosPorOveja: mediaDiaria, eficienciaPienso: eficiencia, pctBajas, totalHembras, litros7d, tratamientosMamitis };
    } catch (e) {
      console.warn('[Dashboard] Error calculando KPIs diarios:', e);
      return vacio;
    }
  },

  _renderKPIsDiariosCard(kpis) {
    if (!kpis || (!kpis.litrosPorOveja && !kpis.eficienciaPienso && !kpis.pctBajas)) {
      return `
        <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
          <div class="card" style="grid-column: span 12; margin-bottom: 0; padding: 20px; text-align: center;">
          <h3 style="color: var(--text-s); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; font-weight: 900; letter-spacing: 0.1em; border-bottom: none; padding-bottom: 0;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> KPIs Diarios</h3>
            <div style="color: var(--text-s); font-size: 0.75rem;">No hay suficientes datos. Registra entregas de leche y animales.</div>
          </div>
        </div>`;
    }

    const { litrosPorOveja, eficienciaPienso, pctBajas, totalHembras, litros7d, tratamientosMamitis } = kpis;

    const kpiColorHex = litrosPorOveja != null ? (litrosPorOveja >= 1.0 ? 'var(--c-success)' : litrosPorOveja >= 0.5 ? 'var(--c-warning)' : 'var(--c-danger)') : 'var(--text-s)';
    const piensoColorHex = eficienciaPienso != null ? (eficienciaPienso <= 600 ? 'var(--c-success)' : eficienciaPienso <= 900 ? 'var(--c-warning)' : 'var(--c-danger)') : 'var(--text-s)';
    const bajasColorHex = pctBajas != null ? (pctBajas <= 3 ? 'var(--c-success)' : pctBajas <= 8 ? 'var(--c-warning)' : 'var(--c-danger)') : 'var(--text-s)';

    return `
      <div class="bento-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; margin-bottom: 24px; animation: fadeInUp 0.4s ease;">
        <div class="card" style="grid-column: span 12; margin-bottom: 0; padding: 24px; text-align: center;">
          <h3 style="color: var(--text-s); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 20px; font-weight: 900; letter-spacing: 0.1em; border-bottom: none; padding-bottom: 0;"><span style="color: var(--header-neon-color, var(--c-success)); margin-right: 4px;">|</span> KPIS DIARIOS <span style="font-size: 0.6rem; color: #64748B; text-transform: none;">(7-30 días)</span></h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; border-top: 1px solid #2a2a2a; padding-top: 20px;">
            <div>
              <div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">L/DÍA</div>
              <div style="font-weight: 800; border: 1px solid ${kpiColorHex}; color: ${kpiColorHex}; background: color-mix(in srgb, ${kpiColorHex} 10%, transparent); padding: 6px 12px; border-radius: 8px; display: inline-block;">${litrosPorOveja != null ? litrosPorOveja.toFixed(2) : '—'}</div>
              <div style="font-size: 0.55rem; color: #64748B; margin-top: 4px;">${totalHembras} ♀</div>
            </div>
              <div>
                <div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">PIENSO (g/L)</div>
                <div style="font-weight: 800; border: 1px solid ${piensoColorHex}; color: ${piensoColorHex}; background: color-mix(in srgb, ${piensoColorHex} 10%, transparent); padding: 6px 12px; border-radius: 8px; display: inline-block;">${eficienciaPienso != null ? eficienciaPienso.toLocaleString() : '—'}</div>
                <div style="font-size: 0.55rem; color: #64748B; margin-top: 4px;">Eficiencia</div>
              </div>
            <div>
              <div class="text-grey" style="font-size: 0.75rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">BAJAS</div>
              <div style="font-weight: 800; border: 1px solid ${bajasColorHex}; color: ${bajasColorHex}; background: color-mix(in srgb, ${bajasColorHex} 10%, transparent); padding: 6px 12px; border-radius: 8px; display: inline-block;">${pctBajas != null ? pctBajas + '%' : '—'}</div>
              <div style="font-size: 0.55rem; color: #64748B; margin-top: 4px;">Mamitis</div>
            </div>
          </div>
        </div>
      </div>`;
  }
};

window.DashboardView = DashboardView;



