/**
 * Livestock Manager - AjustesView v1.2.0
 * Vista de Ajustes/Configuración extraída de App.js para modularización.
 * Copia espejo de js/views/ajustes-view.js
 */

const AjustesView = {
  async render() {
    const main = document.getElementById("app-content");
    const fincas = await Fincas.list();
    const activeId = await Fincas.getActiveId();
    const activeFinca = activeId ? await Fincas.get(activeId) : null;
    const animales = activeId ? await Animales.list().catch(() => []) : [];
    const rebanos = activeId ? await Rebanos.list().catch(() => []) : [];
    const eventos = activeId ? await window.db.getAllFromIndex('registro_eventos', 'fincaId', activeId).catch(() => []) : [];
    const docsLegales = await window.db.getAll('documentos_legales').catch(() => []);
    const tramitesFinca = activeId ? docsLegales.filter(d => Number(d.fincaId) === Number(activeId)) : [];
    let adsgs = activeId ? await window.ADSGs.list() : [];
    if (activeId && activeFinca && activeFinca.adsg_nombre && adsgs.length === 0) {
      try {
        await window.ADSGs.save({
          nombre: activeFinca.adsg_nombre,
          codigo: activeFinca.adsg_codigo || '',
          veterinario: activeFinca.adsg_veterinario || '',
          colegiado: activeFinca.adsg_vet_colegiado || '',
          telefono: activeFinca.adsg_vet_telefono || '',
          vet_nif: activeFinca.adsg_vet_nif || ''
        });
        adsgs = await window.ADSGs.list();
      } catch (e) {
        console.error("Error al registrar ADSG inicial:", e);
      }
    }
    const costesRef = activeId ? await window.db.getAllFromIndex('config_costes_referencia', 'fincaId', Number(activeId)) : [];
    const config = await this._loadConfig();
    const lastBackup = localStorage.getItem('last_backup_date');
    const catalogoTiposREGA = window.ComunidadesService?.getTiposExplotacionREGA ? window.ComunidadesService.getTiposExplotacionREGA() : [];
    const catalogoEspeciesREGA = window.ComunidadesService?.getEspeciesAutorizables ? window.ComunidadesService.getEspeciesAutorizables() : [];
    const catalogoTiposResumen = catalogoTiposREGA.slice(0, 5);
    const catalogoTiposResto = catalogoTiposREGA.slice(5);

    var isFree = window.PremiumManager && window.PremiumManager.isFree();

    main.innerHTML = `
      ${isFree ? `
      <div class="card mb-25 p-20" style="background:linear-gradient(145deg,#0f0f1a 0%,#1a1a2e 50%,#0d0d1a 100%);border:1px solid rgba(217,119,6,0.3);border-radius:16px;overflow:hidden;position:relative;">
        <div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(217,119,6,0.12) 0%,transparent 70%);border-radius:50%;pointer-events:none;"></div>
        <div style="position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;background:radial-gradient(circle,rgba(217,119,6,0.08) 0%,transparent 70%);border-radius:50%;pointer-events:none;"></div>
        <div class="flex items-center gap-15">
          <div style="flex-shrink:0;width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#d97706,#b45309);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(217,119,6,0.3);">
            ${Icons.premium()}
          </div>
          <div class="flex-1">
            <div class="text-white font-900 text-base uppercase tracking-wider" style="letter-spacing:0.5px;">Livestock Manager</div>
            <div class="flex items-center gap-6 mt-4">
              <span style="display:inline-block;padding:2px 10px;border-radius:20px;background:rgba(217,119,6,0.15);color:#d97706;font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">Free</span>
              <span class="text-gray text-xs">Versi&oacute;n gratuita</span>
            </div>
          </div>
        </div>
        <div class="mt-18 p-16" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.05);">
          <p class="text-gray text-sm mt-0 mb-12" style="line-height:1.6;">
            Est&aacute;s usando la <strong class="text-white">versi&oacute;n gratuita</strong> con datos de demostraci&oacute;n.
            Actualiza a Premium para acceder a todas las funciones profesionales.
          </p>
          <div class="grid grid-cols-2 gap-8 text-xs mb-14">
            <div class="flex items-center gap-8 text-gray"><span style="color:#22c55e;font-weight:bold;">&#10003;</span> Datos demo precargados</div>
            <div class="flex items-center gap-8 text-gray"><span style="color:#22c55e;font-weight:bold;">&#10003;</span> Crear registros propios</div>
            <div class="flex items-center gap-8 text-gray"><span style="color:#ef4444;font-weight:bold;">&#10007;</span> Exportar / Importar</div>
            <div class="flex items-center gap-8 text-gray"><span style="color:#ef4444;font-weight:bold;">&#10007;</span> M&uacute;ltiples fincas</div>
            <div class="flex items-center gap-8 text-gray"><span style="color:#ef4444;font-weight:bold;">&#10007;</span> Editar registros demo</div>
            <div class="flex items-center gap-8 text-gray"><span style="color:#ef4444;font-weight:bold;">&#10007;</span> L&iacute;mite 15 animales / 30 gastos</div>
          </div>
          <button class="btn w-full" style="background:linear-gradient(135deg,#d97706,#b45309);border:none;padding:14px 32px;font-weight:900;font-size:0.85rem;border-radius:12px;color:#fff;cursor:pointer;text-transform:uppercase;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(217,119,6,0.25);" onclick="window.PurchaseManager && window.PurchaseManager.purchase()">
            ${Icons.estrella()} Actualizar a Premium
          </button>
          <div class="text-center mt-10"><a href="#" onclick="window.PurchaseManager && window.PurchaseManager.restorePurchases();return false;" style="color:rgba(217,119,6,0.7);font-size:0.65rem;text-decoration:none;">Restaurar compras</a></div>
        </div>
      </div>
      ` : ''}

      <!-- ===================== GESTOR DE FINCA ===================== -->
      ${activeFinca ? `
      <div class="card card-accent card-accent-green mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.finca()} Gestor de Finca Activa</h3>
        <p class="text-gray mt-5 text-sm">Información técnica y administrativa de la explotación ganadera seleccionada.</p>
        <div class="info-box mt-15">
          <div class="grid grid-cols-2 gap-8 text-85">
            <div><span class="text-gray">Finca:</span> <strong class="text-white">${activeFinca.nombre}</strong></div>
            <div><span class="text-gray">REGA:</span> <strong class="text-white">${activeFinca.codigo_REGA || activeFinca.rega || "N/D"}</strong></div>
            <div><span class="text-gray">CCAA:</span> <strong class="text-white">${activeFinca.comunidad_autonoma === 'andalucia' ? 'Andalucía' : activeFinca.comunidad_autonoma === 'extremadura' ? 'Extremadura' : 'No configurada'}</strong></div>
            <div><span class="text-gray">Tipo:</span> <strong class="text-white">${activeFinca.tipo_explotacion || '—'}</strong></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-10 mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="AjustesView._editarFincaPrincipal()">
            ${Icons.editar()}
            <span class="widget-link-label">Editar Datos</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-success" onclick="AjustesView._gestionarZonas()">
            ${Icons.zonas()}
            <span class="widget-link-label">Gestionar Zonas</span>
          </button>
        </div>
      </div>
      ` : ''}

      <!-- ===================== MIS FINCAS ===================== -->
      <div class="card card-accent card-accent-amber mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.finca()} Mis Fincas</h3>
        <p class="text-gray mt-5 text-sm">Gestiona tus explotaciones ganaderas y cambia la finca activa del sistema.</p>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-15 mb-20">
          ${isFree ? `
          <div class="info-box" style="background:#1a1a2e;border:1px solid #d97706;">
            <p class="text-center text-gray text-sm my-10">${Icons.alerta()} La creación de múltiples fincas está disponible en Premium.</p>
          </div>
          ` : `
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="App._showFincaForm()">
            ${Icons.agregar()}
            <span class="widget-link-label">Nueva Finca</span>
          </button>
          `}
        </div>
        <div class="grid gap-10">${fincas.map((f) => {
          const anims = animales.filter(a => a.rebanoId && rebanos.some(r => r.id === a.rebanoId && r.fincaId === f.id));
          return `<div class="flex justify-between items-center rounded-sm bg-black border border-222 p-12">
          <div>
            <div class="font-bold text-white uppercase text-sm">${f.nombre}</div>
            <div class="text-gray text-xs mt-4">REGA: ${f.codigo_REGA || f.rega || "N/D"} · ${anims.length} ANIMALES</div>
          </div>
          <div>${f.id !== activeId ? `<button onclick="AjustesView._cambiarFincaActiva(${f.id})" class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem;">Activar</button>` : `<span class="badge badge-gold text-xs uppercase font-900">Activa</span>`}</div>
        </div>`;
        }).join("")}</div>
      </div>

      <!-- ===================== COPIA DE SEGURIDAD ===================== -->
      <div class="card card-accent card-accent-blue mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.guardar()} Copias de Seguridad</h3>
        <p class="text-gray mt-5 text-sm">Exporta o importa todos los datos de la aplicación en formato JSON para seguridad.</p>
        ${isFree ? `
        <div class="info-box mt-15" style="background:#1a1a2e;border:1px solid #d97706;">
          <p class="text-center text-gray text-sm my-10">${Icons.alerta()} Las copias de seguridad están disponibles en la versión Premium.</p>
        </div>
        ` : `
        <div class="grid grid-cols-2 gap-10 mt-15 mb-15">
          <button class="widget-link-btn widget-link-btn--neon neon-success" onclick="App.exportBackup()">
            ${Icons.exportar()}
            <span class="widget-link-label">Exportar</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="document.getElementById('import-backup-file').click()">
            ${Icons.importar()}
            <span class="widget-link-label">Importar</span>
          </button>
        </div>
        <input type="file" id="import-backup-file" class="d-none" onchange="App.importBackup(event)">
        <label class="flex items-center gap-8 mt-10 text-xs text-gray cursor-pointer" onclick="const c=document.getElementById('auto-backup'); if(c){c.checked=!c.checked;AjustesView._toggleAutoBackup(c.checked)}">
          <input type="checkbox" id="auto-backup" ${config.autoBackup ? 'checked' : ''} style="accent-color:#3b82f6;"> Backup automático al salir
        </label>
        `}
      </div>

      <!-- ===================== PAQUETE LÁCTEO ===================== -->
      <div class="card card-accent card-accent-amber mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.leche()} Paquete Lácteo</h3>
        <p class="text-gray mt-5 text-sm">Gestión de contratos obligatorios (RD 752/2016) y declaraciones mensuales INFOLAC.</p>
        ${activeFinca ? `
        <div class="info-box mt-15">
          <div class="grid grid-cols-2 gap-8 text-85">
            <div><span class="text-gray">Nº Contrato:</span> <strong class="text-white">${activeFinca.contrato_lacteo_numero || '—'}</strong></div>
            <div><span class="text-gray">Vencimiento:</span> <strong class="${activeFinca.contrato_lacteo_fecha_fin && new Date(activeFinca.contrato_lacteo_fecha_fin) < new Date() ? 'text-red' : 'text-white'}">${activeFinca.contrato_lacteo_fecha_fin || '—'}${activeFinca.contrato_lacteo_fecha_fin && new Date(activeFinca.contrato_lacteo_fecha_fin) < new Date() ? ' ' + Icons.alerta() + ' Vencido' : ''}</strong></div>
            <div><span class="text-gray">Comprador:</span> <strong class="text-white">${activeFinca.contrato_lacteo_comprador || '—'}</strong></div>
            <div><span class="text-gray">INFOLAC:</span> <strong class="text-white">${activeFinca.numero_infolac || '—'}</strong></div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="App._editarFincaActiva()">
            ${Icons.editar()}
            <span class="widget-link-label">Editar Contrato</span>
          </button>
        </div>` : '<p class="text-center text-555 p-20 uppercase font-800 text-xs">Activa una finca para ver datos</p>'}
      </div>

      <!-- ===================== ADSG ===================== -->
      <div class="card card-accent card-accent-blue mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.sanidad()} Sanidad Ganadera (ADSG)</h3>
        <p class="text-gray mt-5 text-sm">Agrupación de Defensa Sanitaria Ganadera y datos del veterinario de explotación.</p>
        ${activeFinca ? `
        <div class="grid gap-10 mt-15">
          ${adsgs.map(a => `
            <div class="flex justify-between items-center rounded-sm bg-black border border-222 p-12">
              <div>
                <div class="font-bold text-white uppercase text-sm">${a.nombre}</div>
                <div class="text-gray-500 text-[0.65rem] mt-4 uppercase font-800 tracking-wider">CÓDIGO: <strong class="text-white">${a.codigo || '—'}</strong> · VET: <strong class="text-white">${a.veterinario || '—'}</strong></div>
              </div>
              <div class="flex gap-6">
                <button class="btn btn-secondary btn-sm" onclick="AjustesView._editarADSG(${a.id})">${Icons.editar()}</button>
                <button class="btn btn-danger btn-sm" onclick="AjustesView._eliminarADSG(${a.id})">${Icons.eliminar()}</button>
              </div>
            </div>
          `).join('')}
          ${adsgs.length === 0 ? '<p class="text-center text-555 p-10 uppercase font-800 text-xs">No hay ADSGs registradas</p>' : ''}
        </div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="AjustesView._nuevoADSG()">
            ${Icons.agregar()}
            <span class="widget-link-label">Nuevo ADSG</span>
          </button>
        </div>` : '<p class="text-center text-555 p-20 uppercase font-800 text-xs">Activa una finca para ver datos</p>'}
      </div>

      <!-- ===================== COSTES DE REFERENCIA ===================== -->
      <div class="card card-accent card-accent-gold mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.dinero()} Costes de Referencia</h3>
        <p class="text-gray mt-5 text-sm">Define el coste de alimentación estimado medio por especie para el análisis de rentabilidad.</p>
        ${activeFinca ? `
        <div class="grid gap-10 mt-15">
          ${costesRef.map(c => `
            <div class="flex justify-between items-center rounded-sm bg-black border border-222 p-12">
              <div>
                <div class="font-bold text-white uppercase text-sm">${c.especie}</div>
                <div class="text-gold font-950 text-md mt-4">${c.coste_diario_estimado.toFixed(2)} € <small class="text-gray-500 font-700">/ ANIMAL / DÍA</small></div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="AjustesView._eliminarCosteRef(${c.id})">${Icons.eliminar()}</button>
            </div>
          `).join('')}
          ${costesRef.length === 0 ? '<p class="text-center text-555 p-10 uppercase font-800 text-xs">No hay costes de referencia definidos</p>' : ''}
        </div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="AjustesView._agregarCosteReferencia()">
            ${Icons.agregar()}
            <span class="widget-link-label">Nuevo Coste Ref.</span>
          </button>
        </div>` : '<p class="text-center text-555 p-20 uppercase font-800 text-xs">Activa una finca para ver datos</p>'}
      </div>

      <!-- ===================== CONFIGURACIÓN AUTONÓMICA ===================== -->
      <div class="card card-accent card-accent-purple mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.globo()} Normativa Autonómica</h3>
        <p class="text-gray mt-5 text-sm">Configuración de la plataforma de movimiento (SIGGAN/BADIGEX) y umbrales PAC.</p>
        ${activeFinca ? (() => {
          const ccaa = activeFinca.comunidad_autonoma;
          const plataforma = ccaa && window.ComunidadesService ? window.ComunidadesService.getPlataformaMovimiento(ccaa) : null;
          const umbral = ccaa && window.ComunidadesService ? window.ComunidadesService.getUmbralPAC(ccaa) : null;
          const dist = ccaa && window.ComunidadesService ? window.ComunidadesService.getDistanciaMinimaREGA(ccaa) : null;
          return `
          <div class="info-box mt-15">
            <div class="font-bold text-white mb-10 text-center uppercase border-bottom-222 pb-8">${ccaa === 'andalucia' ? 'Andalucía' : ccaa === 'extremadura' ? 'Extremadura' : 'No configurada'}</div>
            ${ccaa ? `
            <div class="grid grid-cols-2 gap-8 text-85">
              <div><span class="text-gray">Sistema:</span> <strong class="text-white">${plataforma || '—'}</strong></div>
              <div><span class="text-gray">Mín. REGA:</span> <strong class="text-white">${dist || '—'} m</strong></div>
              <div><span class="text-gray">Umbral PAC:</span> <strong class="text-white">${umbral || '—'} UGM/año</strong></div>
              <div><span class="text-gray">Sistema Explot.:</span> <strong class="text-white">${activeFinca.sistema_explotacion || '—'}</strong></div>
            </div>
            <div class="grid grid-cols-2 gap-10 mt-20">
              <button class="widget-link-btn widget-link-btn--neon neon-accent" onclick="App._editarFincaActiva()">
                ${Icons.editar()}
                <span class="widget-link-label">Editar CCAA</span>
              </button>
              <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="App._mostrarGuiaNormativas()">
                ${Icons.libro()}
                <span class="widget-link-label">Ver Guía</span>
              </button>
            </div>` : '<p class="text-center text-555 p-10 uppercase font-800 text-xs">Configura la CCAA en la finca</p>'}
          </div>`; })() : '<p class="text-center text-555 p-20 uppercase font-800 text-xs">Activa una finca para ver datos</p>'}
      </div>

      <!-- ===================== OBJETIVOS DE EXPLOTACIÓN ===================== -->
      <div class="card card-accent card-accent-green mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.objetivo()} Objetivos de Explotación</h3>
        <p class="text-gray mt-5 text-sm">Define las metas productivas para el Panel de Eficiencia Técnica (semáforos de estado).</p>
        <div class="grid grid-cols-2 gap-10 mt-15">
          <div class="wizard-input-group"><label class="wizard-label">GMD Objetivo (kg/día)</label><input type="number" id="obj-gmd" value="${config.objGmd || 0.8}" step="0.1" class="wizard-input" onchange="AjustesView._guardarObjetivo('objGmd', this.value)"></div>
          <div class="wizard-input-group"><label class="wizard-label">Litros/Hembra/Día</label><input type="number" id="obj-litros" value="${config.objLitros || 25}" step="1" class="wizard-input" onchange="AjustesView._guardarObjetivo('objLitros', this.value)"></div>
          <div class="wizard-input-group"><label class="wizard-label">Fertilidad (%)</label><input type="number" id="obj-fert" value="${config.objFert || 85}" step="1" class="wizard-input" onchange="AjustesView._guardarObjetivo('objFert', this.value)"></div>
          <div class="wizard-input-group"><label class="wizard-label">Ocupación (%)</label><input type="number" id="obj-ocup" value="${config.objOcup || 85}" step="1" class="wizard-input" onchange="AjustesView._guardarObjetivo('objOcup', this.value)"></div>
          <div class="wizard-input-group"><label class="wizard-label">Rentabilidad (%)</label><input type="number" id="obj-rent" value="${config.objRent || 20}" step="1" class="wizard-input" onchange="AjustesView._guardarObjetivo('objRent', this.value)"></div>
          <div class="wizard-input-group"><label class="wizard-label">Bajas Máximo (%)</label><input type="number" id="obj-bajas" value="${config.objBajas || 5}" step="1" class="wizard-input" onchange="AjustesView._guardarObjetivo('objBajas', this.value)"></div>
        </div>
      </div>

      <!-- ===================== ESPECIES Y RAZAS ===================== -->
      <div class="card card-accent card-accent-amber mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.reproduccion()} Especies y Razas</h3>
        <p class="text-gray mt-5 text-sm">Gestiona las especies activas y sus parámetros de referencia en la explotación.</p>
        <div id="especies-container" class="mt-15">${this._renderEspecies(config)}</div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="AjustesView._agregarEspecie()">
            ${Icons.agregar()}
            <span class="widget-link-label">Añadir Especie</span>
          </button>
        </div>
      </div>

      <!-- ===================== GESTIÓN DE ALERTAS ===================== -->
      <div class="card card-accent card-accent-red mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.campana()} Gestión de Alertas</h3>
        <p class="text-gray mt-5 text-sm">Configura qué tipos de notificación quieres recibir en el Dashboard principal.</p>
        <div class="grid gap-10 mt-15">
          ${[
            { id: 'alertSanidad', label: 'Alertas Sanitarias (supresión)', def: true },
            { id: 'alertTrazabilidad', label: 'Alertas Trazabilidad (SIA)', def: true },
            { id: 'alertPAC', label: 'Alertas PAC (declaraciones)', def: true },
            { id: 'alertADSG', label: 'Alertas ADSG (vacunación)', def: true },
            { id: 'alertINCOLAC', label: 'Alertas INFOLAC (mensual)', def: true },
            { id: 'alertContratos', label: 'Alertas Contratos (vencim.)', def: false },
          ].map(a => `
            <label class="flex items-center gap-10 text-sm text-white cursor-pointer bg-black border border-222 p-10 rounded-sm">
              <input type="checkbox" ${config[a.id] !== false ? 'checked' : ''} style="accent-color:#ef4444;" onchange="AjustesView._toggleAlerta('${a.id}', this.checked)"> ${a.label}
            </label>`).join('')}
        </div>
      </div>

      <!-- ===================== PREFERENCIAS ===================== -->
      <div class="card card-accent card-accent-purple mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.ajustes()} Preferencias de Aplicación</h3>
        <p class="text-gray mt-5 text-sm">Configuración del comportamiento general y visual de la aplicación móvil.</p>
        <div class="grid gap-12 mt-15">
          <label class="flex items-center gap-10 text-sm text-white cursor-pointer bg-black border border-222 p-12 rounded-sm">
            <input type="checkbox" ${config.temaOscuro !== false ? 'checked' : ''} style="accent-color:#8b5cf6;" onchange="AjustesView._toggleTema(this.checked)"> MODO OSCURO (OLED)
          </label>
          <label class="flex items-center gap-10 text-sm text-white cursor-pointer bg-black border border-222 p-12 rounded-sm">
            <input type="checkbox" ${config.mostrarContextos !== false ? 'checked' : ''} style="accent-color:#8b5cf6;" onchange="AjustesView._toggleContextos(this.checked)"> MOSTRAR DESCRIPCIONES DE CONTEXTO
          </label>
          <div class="flex flex-col gap-4">
            <label class="text-xs text-gray uppercase font-800 ml-4">Retroiluminación y Haz de Luz</label>
            <label class="flex items-center gap-10 text-sm text-white cursor-pointer bg-black border border-222 p-12 rounded-sm">
              <input type="checkbox" ${config.glowMarco !== false ? 'checked' : ''} style="accent-color:#8b5cf6;" onchange="AjustesView._toggleGlowMarco(this.checked)"> MARCO PRINCIPAL DE PANTALLA
            </label>
            <label class="flex items-center gap-10 text-sm text-white cursor-pointer bg-black border border-222 p-12 rounded-sm">
              <input type="checkbox" ${config.glowBotones !== false ? 'checked' : ''} style="accent-color:#8b5cf6;" onchange="AjustesView._toggleGlowBotones(this.checked)"> BOTONES DE LA APLICACIÓN
            </label>
          </div>
          <div class="flex flex-col gap-4">
            <label class="text-xs text-gray uppercase font-800 ml-4">Formato Fecha</label>
            <select class="wizard-input" onchange="AjustesView._guardarPreferencia('formatoFecha', this.value)">
              <option value="es-ES" ${config.formatoFecha !== 'en-US' ? 'selected' : ''}>DD/MM/AAAA (España)</option>
              <option value="en-US" ${config.formatoFecha === 'en-US' ? 'selected' : ''}>MM/DD/AAAA (EE.UU.)</option>
            </select>
          </div>
          <div class="flex flex-col gap-4">
            <label class="text-xs text-gray uppercase font-800 ml-4">Moneda Principal</label>
            <select class="wizard-input" onchange="AjustesView._guardarPreferencia('moneda', this.value)">
              <option value="€" ${config.moneda !== '$' ? 'selected' : ''}>Euro (€)</option>
              <option value="$" ${config.moneda === '$' ? 'selected' : ''}>Dólar ($)</option>
            </select>
          </div>
          <div class="flex flex-col gap-4">
            <label class="text-xs text-gray uppercase font-800 ml-4">Color de Acento</label>
            <div class="flex gap-6">
              ${[
                { id: 'gold',   label: 'Oro',   color: '#fbbf24' },
                { id: 'blue',   label: 'Azul',  color: '#3b82f6' },
                { id: 'green',  label: 'Verde', color: '#10b981' },
                { id: 'purple', label: 'Violeta', color: '#8b5cf6' },
                { id: 'red',    label: 'Rojo',  color: '#ef4444' },
              ].map(t => `
                <button class="theme-dot ${config.colorTema === t.id ? 'active' : ''}" 
                  style="background:${t.color}; width:36px; height:36px; border-radius:50%; border:3px solid ${config.colorTema === t.id ? t.color : 'transparent'}; cursor:pointer; transition:all 0.2s;"
                  onclick="AjustesView._cambiarColor('${t.id}')" title="${t.label}"></button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== INFORMACIÓN DEL SISTEMA ===================== -->
      <div class="card card-accent card-accent-gold mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.info()} Información del Sistema</h3>
        <p class="text-gray mt-5 text-sm">Estado técnico de la base de datos local y versión actual de la aplicación.</p>
        <div class="info-box mt-15">
          <div class="grid grid-cols-2 gap-8 text-85">
            <div><span class="text-gray">Versión:</span> <strong class="text-white">v4.8.8</strong></div>
            <div><span class="text-gray">Base Datos:</span> <strong class="text-white">IDB v10</strong></div>
            <div><span class="text-gray">Fincas:</span> <strong class="text-white">${fincas.length}</strong></div>
            <div><span class="text-gray">Animales:</span> <strong class="text-white">${animales.length}</strong></div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-danger" onclick="AjustesView._limpiarCache()">
            ${Icons.eliminar()}
            <span class="widget-link-label">Limpiar Caché</span>
          </button>
        </div>
      </div>

      <!-- ===================== GESTIÓN DE TRAZABILIDAD ===================== -->
      <div class="card card-accent card-accent-green mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.trazabilidad()} Trazabilidad</h3>
        <p class="text-gray mt-5 text-sm">Solicitud oficial de remesas de crotales y normativa de identificación.</p>
        <div class="grid grid-cols-2 gap-10 mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-success" onclick="App._abrirWizardPedidoCrotales()">
            ${Icons.documento()}
            <span class="widget-link-label">Pedido Crotales</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="App._mostrarAyudaCrotales()">
            ${Icons.libro()}
            <span class="widget-link-label">Normativa</span>
          </button>
        </div>
      </div>

      <!-- ===================== TRÁMITES SIGGAN ===================== -->
      <div class="card card-accent card-accent-purple mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.edificio()} Trámites Oficiales</h3>
        <p class="text-gray mt-5 text-sm">Generación de documentación oficial para plataformas autonómicas (SIGGAN/SIA).</p>
        <div class="grid grid-cols-3 gap-8 mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-accent" onclick="App._abrirWizardGuiaMovimiento()">
            ${Icons.rotacion()}
            <span class="widget-link-label">Guía Mov.</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="App._abrirWizardCenso()">
            ${Icons.documento()}
            <span class="widget-link-label">Declaración</span>
          </button>
          <button class="widget-link-btn widget-link-btn--neon neon-success" onclick="AjustesView._exportarCierreMensual()">
            ${Icons.exportar()}
            <span class="widget-link-label">Cierre SIGGAN</span>
          </button>
        </div>
      </div>

      <!-- ===================== CATÁLOGOS REGA ===================== -->
      <div class="card card-accent card-accent-blue mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.libroVentas()} Catálogos REGA</h3>
        <p class="text-gray mt-5 text-sm">Catálogos normativos oficiales con detalle completo y acceso a contenido.</p>
        <div class="info-box mt-15">
          <div class="text-xs text-gray uppercase font-800 mb-6 flex items-center gap-4">${Icons.documento()} Tipos Explotación (${catalogoTiposREGA.length})</div>
          <div class="flex flex-wrap gap-2">
            ${catalogoTiposResumen.map(t => `<span class="text-[0.6rem] text-white font-700 uppercase bg-black px-6 py-2 rounded-sm border border-222">${t}</span>`).join('')}
            ${catalogoTiposResto.length > 0 ? `<span class="text-[0.6rem] uppercase font-900 px-6 py-2 rounded-sm" style="cursor:pointer;color:var(--c-info);border:1px solid var(--c-info);" onclick="AjustesView._verCatalogoCompleto('tipos')">+${catalogoTiposResto.length} más</span>` : ''}
          </div>
          <div class="text-xs text-gray uppercase font-800 mt-12 mb-6 flex items-center gap-4">${Icons.animales()} Especies Autorizables (${catalogoEspeciesREGA.length})</div>
          <div class="flex flex-wrap gap-2">
            ${catalogoEspeciesREGA.map(e => `<span class="text-[0.6rem] text-white font-700 uppercase bg-black px-6 py-2 rounded-sm border border-222">${e}</span>`).join('')}
          </div>
          <div class="mt-14">
            <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="AjustesView._verCatalogoCompleto('tipos')" style="width:100%;">
              ${Icons.documento()}
              <span class="widget-link-label">Ver Catálogo Completo</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ===================== HISTORIAL TRÁMITES ===================== -->
      <div class="card card-accent card-accent-gold mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.documento()} Historial de Documentos</h3>
        <p class="text-gray mt-5 text-sm">Últimos eventos de tramitación oficial registrados en la base de datos.</p>
        <div class="mt-15">
          ${tramitesFinca.length > 0 ? `
          <div class="grid gap-6">
            ${tramitesFinca.slice(-5).reverse().map(d => `
              <div class="flex items-center gap-6 p-10 bg-dark rounded-lg border border-222">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background:${d.estado_tramite === 'presentado' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'};">
                  ${Icons.documento()}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-white text-xs font-900 uppercase overflow-hidden text-ellipsis" style="white-space:nowrap;">${d.tipo || 'Documento'} · ${d.numero || 'S/N'}</div>
                  <div class="text-aaa text-[0.55rem] mt-2 uppercase font-800">${d.fecha_emision || d.created_at || ''}</div>
                </div>
                ${d.estado_tramite ? `<span class="badge badge-sm uppercase font-900 flex-shrink-0" style="background:${d.estado_tramite === 'presentado' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}; color:${d.estado_tramite === 'presentado' ? 'var(--c-success)' : 'var(--c-warning)'};">${d.estado_tramite}</span>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="mt-14">
            <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="location.hash='#/documentos'" style="width:100%;">
              ${Icons.documento()}
              <span class="widget-link-label">Ver Todos los Documentos</span>
            </button>
          </div>` 
          : '<div class="text-gray text-center p-10 uppercase font-800 text-xs">Sin trámites recientes</div>'}
        </div>
      </div>

      <!-- ===================== GUÍA FARMACOLÓGICA ===================== -->
      <div class="card card-accent card-accent-red mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.sanidad()} Guía Farmacológica</h3>
        <p class="text-gray mt-5 text-sm">Tiempos de retiro en carne y supresión en leche para medicamentos veterinarios.</p>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-danger" onclick="App._mostrarAyudaMedicamentos()">
            ${Icons.sanidad()}
            <span class="widget-link-label">Ver Tiempos</span>
          </button>
        </div>
      </div>

      <!-- ===================== MANUAL DE USUARIO ===================== -->
      <div class="card card-accent card-accent-gold mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.libro()} Ayuda y Soporte</h3>
        <p class="text-gray mt-5 text-sm">Acceso al manual de usuario integral y documentación de la plataforma.</p>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="AjustesView._abrirManual()">
            ${Icons.libro()}
            <span class="widget-link-label">Abrir Manual</span>
          </button>
        </div>
      </div>

      <!-- ===================== FOOTER ===================== -->
      <div class="text-center p-40 about-card">
        <img src="icons/Logo aplicación.png" alt="Livestock Manager Premium" class="about-logo">
        <div class="text-gold font-800 text-sm uppercase tracking-widest mt-10">Desarrollado por</div>
        <div class="text-white font-900 text-2xl uppercase mt-4">David Asuar Arteaga</div>
        <p class="text-aaa about-desc uppercase font-700 text-xs mt-15 leading-relaxed">Plataforma profesional de gestión ganadera inteligente y trazabilidad industrial integrada.</p>
        <div class="mt-20"><a href="mailto:soporte.sdogfarm@gmail.com" class="text-gold font-900 no-underline text-md uppercase">📩 soporte.sdogfarm@gmail.com</a></div>
        <div class="mt-12"><a href="https://github.com/SADOCKDOG/LIVESTOCK-MANAGER" target="_blank" rel="noopener noreferrer" class="text-gold font-900 no-underline text-md uppercase inline-flex items-center gap-6">🐙 GitHub</a></div>
        <div class="mt-40 text-[0.65rem] text-444 uppercase font-900 tracking-widest about-footer">
          © 2026 Livestock Manager Premium · v4.8.8<br>
          Todos los derechos reservados.
        </div>
      </div>`;
  },

  // ===================== HELPER: CONFIG =====================

  async _verCatalogoCompleto(tipo) {
    const items = tipo === 'tipos'
      ? (window.ComunidadesService?.getTiposExplotacionREGA?.() || [])
      : (window.ComunidadesService?.getEspeciesAutorizables?.() || []);
    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.zIndex = '7000';
    overlay.innerHTML = `
      <div class="wizard-header-fixed text-center">
        <button onclick="this.closest('.wizard-full-screen').remove()" class="btn-pesaje-close">${Icons.cerrar()}</button>
        <h2 class="pesaje-titulo-h2">${tipo === 'tipos' ? Icons.documento() : Icons.animales()} CATÁLOGO ${tipo === 'tipos' ? 'TIPOS EXPLOTACIÓN' : 'ESPECIES'}</h2>
      </div>
      <div class="wizard-content-scrollable">
        <div class="card p-16 border-222">
          <div class="flex flex-wrap gap-3">
            ${items.map(i => `<span class="text-xs text-white font-700 uppercase bg-dark px-10 py-4 rounded-sm border border-222">${i}</span>`).join('')}
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  },

  async _loadConfig() {
    const defaults = { objGmd: 0.8, objLitros: 25, objFert: 85, objOcup: 85, objRent: 20, objBajas: 5, autoBackup: false, temaOscuro: true, mostrarContextos: false, glowMarco: true, glowBotones: true, colorTema: 'gold', formatoFecha: 'es-ES', moneda: '€', especies: [], alertSanidad: true, alertTrazabilidad: true, alertPAC: true, alertADSG: true, alertINCOLAC: true, alertContratos: false };
    try {
      const stored = await window.db.get('meta', 'appConfig');
      return stored?.value ? { ...defaults, ...stored.value } : defaults;
    } catch (e) { return defaults; }
  },

  async _saveConfig(updates) {
    try {
      const current = await this._loadConfig();
      const merged = { ...current, ...updates };
      await window.db.put('meta', { key: 'appConfig', value: merged, actualizadoEn: new Date().toISOString() });
    } catch (e) { console.warn('[Ajustes] Error guardando config:', e); }
  },

  async _guardarObjetivo(key, val) {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    await this._saveConfig({ [key]: num });
    App.toast(`🎯 Objetivo actualizado: ${num}`);
  },

  async _toggleAlerta(id, checked) {
    await this._saveConfig({ [id]: checked });
    App.toast(checked ? '🔔 Alerta activada' : '🔕 Alerta desactivada');
  },

  async _toggleAutoBackup(checked) {
    await this._saveConfig({ autoBackup: checked });
    App.toast(checked ? '💾 Backup automático activado' : '💾 Backup automático desactivado');
  },

  async _toggleTema(checked) {
    await this._saveConfig({ temaOscuro: checked });
    document.documentElement.style.colorScheme = checked ? 'dark' : 'light';
    App.toast(checked ? 'Modo oscuro' : 'Modo claro');
  },

  async _toggleGlowMarco(checked) {
    await this._saveConfig({ glowMarco: checked });
    document.body.classList.toggle('glow-marco-off', !checked);
    App.toast(checked ? 'Marco principal iluminado' : 'Marco principal sin iluminación');
  },

  async _toggleGlowBotones(checked) {
    await this._saveConfig({ glowBotones: checked });
    document.body.classList.toggle('glow-botones-off', !checked);
    App.toast(checked ? 'Retroiluminación de botones activada' : 'Retroiluminación de botones desactivada');
  },

  async _toggleContextos(checked) {
    await this._saveConfig({ mostrarContextos: checked });
    document.body.classList.toggle('hide-context', !checked);
    const cards = document.querySelectorAll('.card-dark-gradient, .card-total-3d');
    cards.forEach(c => c.classList.toggle('compact', !checked));
    App.toast(checked ? 'Descripciones de contexto visibles' : 'Descripciones de contexto ocultas');
  },

  async _cambiarColor(tema) {
    await this._saveConfig({ colorTema: tema });
    document.body.setAttribute('data-tema', tema);
    // Actualizar dots visualmente
    document.querySelectorAll('.theme-dot').forEach(d => {
      const isActive = d.getAttribute('onclick')?.includes(`'${tema}'`);
      d.style.borderColor = isActive ? d.style.background : 'transparent';
    });
    App.toast(`🎨 Tema ${tema} aplicado`);
  },

  async _guardarPreferencia(key, val) {
    await this._saveConfig({ [key]: val });
    App.toast('✅ Preferencia guardada');
  },

  _renderEspecies(config) {
    const especies = config.especies || [];
    if (!especies.length) return '<div class="text-gray text-sm">Sin especies configuradas. Añade tu primera especie.</div>';
    return especies.map((e, i) => `
      <div class="flex items-center gap-6 mb-4 checkbox-row">
        <span class="text-white font-bold text-sm flex-1">${e.nombre}</span>
        <span class="text-gray text-xs">${e.consumoAgua || '—'} L/día</span>
        <span class="text-gray text-xs">Precio: ${e.precioRef || '—'}€</span>
        <button class="btn btn-danger btn-sm text-xs" style="padding:4px 8px;" onclick="AjustesView._eliminarEspecie(${i})">${Icons.eliminar()}</button>
      </div>`).join('');
  },

  async _agregarEspecie() {
    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div class="card p-25 max-w-340 border-top-5-amber">
        <h3 class="mt-0 text-gold flex items-center gap-8">${Icons.reproduccion()} Nueva Especie</h3>
        <div class="wizard-input-group"><label class="wizard-label">Nombre</label><input type="text" id="esp-nombre" placeholder="Vacas, Ovejas, Cabras..." class="wizard-input"></div>
        <div class="grid grid-cols-2 gap-10">
          <div class="wizard-input-group"><label class="wizard-label">Consumo Agua (L/día)</label><input type="number" id="esp-agua" value="10" class="wizard-input"></div>
          <div class="wizard-input-group"><label class="wizard-label">Precio Ref. (€)</label><input type="number" id="esp-precio" value="0.00" step="0.01" class="wizard-input"></div>
        </div>
        <div class="flex justify-end gap-10 mt-20">
          <button class="btn btn-secondary" onclick="this.closest('.wizard-full-screen').remove()">${Icons.cerrar()} Cancelar</button>
          <button class="btn btn-success" id="btn-esp-guardar">${Icons.guardar()} Guardar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#btn-esp-guardar').onclick = async () => {
      const nombre = document.getElementById('esp-nombre').value.trim();
      if (!nombre) { App.toastError('Nombre obligatorio'); return; }
      const config = await this._loadConfig();
      const especies = config.especies || [];
      especies.push({ nombre, consumoAgua: parseInt(document.getElementById('esp-agua').value) || 10, precioRef: parseFloat(document.getElementById('esp-precio').value) || 0 });
      await this._saveConfig({ especies });
      overlay.remove();
      App.toast('✅ Especie añadida');
      App.renderAjustes();
    };
  },

  async _eliminarEspecie(idx) {
    const config = await this._loadConfig();
    const especies = config.especies || [];
    if (idx >= 0 && idx < especies.length) especies.splice(idx, 1);
    await this._saveConfig({ especies });
    App.toast('Especie eliminada');
    App.renderAjustes();
  },

  async _limpiarCache() {
    if (!await Confirm.confirm("Limpiar Caché", "¿Limpiar caché local? Se recargarán los datos desde la base de datos.", true)) return;
    if (window.CacheService) CacheService.clearAll();
    localStorage.removeItem('seed_data_completed');
    App.toast('Caché limpiada');
  },

  _diasRestantes(fechaStr) {
    if (!fechaStr) return '';
    const diff = Math.ceil((new Date(fechaStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return ' <span class="text-red">(Vencido)</span>';
    if (diff <= 30) return ` <span class="text-amber">(${diff} días)</span>`;
    return '';
  },

  async _cambiarFincaActiva(id) {
    await Fincas.setActiveId(id);
    App.toast('Finca activa cambiada');
    App.renderAjustes();
  },

  async _editarFincaPrincipal() {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError('No hay finca activa'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'wizard-overlay';
    overlay.innerHTML = `
      <div class="wizard-card modal-scroll">
        <div class="wizard-header">
          <h2 class="flex items-center gap-8">${Icons.editar()} Editar Datos de Finca</h2>
          <button onclick="this.closest('.wizard-overlay').remove()" class="btn btn-secondary" style="padding:8px 16px;">${Icons.cerrar()} Cerrar</button>
        </div>
        <div class="wizard-body p-20">
          <div class="grid gap-12">
            <div>
              <label class="text-xs text-gold font-bold">NOMBRE DE FINCA *</label>
              <input type="text" id="edit-nombre" value="${finca.nombre || ''}" class="wizard-input">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div>
                <label class="text-xs text-gold font-bold">CÓDIGO REGA *</label>
                <input type="text" id="edit-rega" value="${finca.codigo_REGA || finca.rega || ''}" class="wizard-input input-rega-std" placeholder="ES210050001234" maxlength="14">
              </div>
              <div>
                <label class="text-xs text-gold font-bold">COMUNIDAD AUTÓNOMA</label>
                <select id="edit-ccaa" class="wizard-input">
                  <option value="">— Seleccionar —</option>
                  <option value="andalucia" ${finca.comunidad_autonoma === 'andalucia' ? 'selected' : ''}>Andalucía</option>
                  <option value="extremadura" ${finca.comunidad_autonoma === 'extremadura' ? 'selected' : ''}>Extremadura</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-xs text-gold font-bold">TIPO DE EXPLOTACIÓN</label>
              <input type="text" id="edit-tipo" value="${finca.tipo_explotacion || ''}" class="wizard-input" placeholder="Ej: Bovino Lechero">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div>
                <label class="text-xs text-gold font-bold">SUPERFICIE TOTAL (ha)</label>
                <input type="number" id="edit-superficie" value="${finca.superficie || ''}" class="wizard-input" step="0.1">
              </div>
              <div>
                <label class="text-xs text-gold font-bold">LATITUD / LONGITUD</label>
                <input type="text" id="edit-coordenadas" value="${finca.coordenadas || ''}" class="wizard-input" placeholder="0,0">
              </div>
            </div>
            <div>
              <label class="text-xs text-gold font-bold">NÚMERO DE ANIMALES TOTALES</label>
              <input type="number" id="edit-total-animales" value="${finca.total_animales || ''}" class="wizard-input">
            </div>
            <div>
              <label class="text-xs text-gold font-bold">TELÉFONO VETERINARIO ADSG</label>
              <input type="tel" id="edit-vet-tel" value="${finca.adsg_vet_telefono || ''}" class="wizard-input" placeholder="600123123">
            </div>
            <div class="flex gap-10 mt-15">
              <button class="btn btn-success flex-1" onclick="AjustesView._guardarFincaPrincipal()">${Icons.guardar()} Guardar</button>
              <button class="btn btn-secondary flex-1" onclick="this.closest('.wizard-overlay').remove()">${Icons.cerrar()} Cancelar</button>
            </div>
          </div>
        </div>
      </div>`;
    overlay.style.cssText = 'position:fixed; inset:0; z-index:6000; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; padding:20px;';
    document.body.appendChild(overlay);
  },

  async _guardarFincaPrincipal() {
    const fincaId = await Fincas.getActiveId();
    const finca = await Fincas.get(fincaId);
    
    finca.nombre = document.getElementById('edit-nombre').value || finca.nombre;
    finca.codigo_REGA = document.getElementById('edit-rega').value || finca.codigo_REGA;
    finca.rega = document.getElementById('edit-rega').value || finca.rega;
    finca.comunidad_autonoma = document.getElementById('edit-ccaa').value || finca.comunidad_autonoma;
    finca.tipo_explotacion = document.getElementById('edit-tipo').value || finca.tipo_explotacion;
    finca.superficie = parseFloat(document.getElementById('edit-superficie').value) || finca.superficie;
    finca.coordenadas = document.getElementById('edit-coordenadas').value || finca.coordenadas;
    finca.total_animales = parseInt(document.getElementById('edit-total-animales').value) || finca.total_animales;
    finca.adsg_vet_telefono = document.getElementById('edit-vet-tel').value || finca.adsg_vet_telefono;
    finca.actualizadoEn = new Date().toISOString();

    try {
      await Fincas.save(finca);
      document.querySelector('.wizard-overlay').remove();
      App.toast('✅ Datos de finca guardados');
      App.renderAjustes();
    } catch (e) {
      App.toastError('Error al guardar: ' + e.message);
    }
  },

  async _gestionarZonas() {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError('No hay finca activa'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'wizard-overlay';
    const zonas = finca.zonas || [];
    
    let zonasHtml = '';
    if (zonas.length === 0) {
      zonasHtml = '<p class="text-gray text-center p-20">Sin zonas definidas</p>';
    } else {
      zonasHtml = `<div class="grid gap-10">
        ${zonas.map((z, idx) => `
          <div class="flex justify-between items-center rounded-sm border-left-dark-gold bg-222 p-12">
            <div>
              <div class="font-bold text-white">${z.nombre}</div>
              <div class="text-gray text-2xs">Superficie: ${z.superficie || 0} ha · Aforo: ${z.aforoMax || z.aforo_maximo || 50}</div>
              ${z.tipo_explotacion_rega ? `<div class="text-gold text-2xs">REGA: ${z.tipo_explotacion_rega}</div>` : ''}
              ${z.carga_ganadera ? `<div class="text-amber text-2xs">Carga: ${z.carga_ganadera} UGM/ha</div>` : ''}
            </div>
            <div class="flex gap-6">
              <button class="btn btn-secondary" style="padding:6px 10px; font-size:0.7rem;" onclick="AjustesView._editarZona(${idx})">${Icons.editar()}</button>
              <button class="btn btn-danger" style="padding:6px 10px; font-size:0.7rem;" onclick="AjustesView._eliminarZona(${idx})">${Icons.eliminar()}</button>
            </div>
          </div>
        `).join('')}
      </div>`;
    }

    overlay.innerHTML = `
      <div class="wizard-card modal-scroll">
        <div class="wizard-header">
          <h2 class="flex items-center gap-8">${Icons.zonas()} Gestionar Zonas</h2>
          <button onclick="this.closest('.wizard-overlay').remove()" class="btn btn-secondary" style="padding:8px 16px;">${Icons.cerrar()} Cerrar</button>
        </div>
        <div class="wizard-body p-20">
          ${zonasHtml}
          <button class="btn btn-create btn-full mt-15" onclick="AjustesView._crearNuevaZona()">${Icons.agregar()} Nueva Zona</button>
        </div>
      </div>`;
    overlay.style.cssText = 'position:fixed; inset:0; z-index:6000; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; padding:20px;';
    document.body.appendChild(overlay);
  },

  async _crearNuevaZona() {
    const finca = await Fincas.getActive();
    if (!finca) return;
    
    const zonas = finca.zonas || [];
    const nombreZona = await Confirm.prompt('Nueva Zona', 'Nombre de la nueva zona:', '', 'Ej: Parcela Norte...');
    if (!nombreZona) return;

    zonas.push({
      nombre: nombreZona,
      superficie: 0,
      aforoMax: 50,
      aforo_maximo: 50,
      tipo_explotacion_rega: 'Producción y reproducción',
      carga_ganadera: 0,
      codigo_pac: '',
      distancia_agua_m: 0
    });

    finca.zonas = zonas;
    finca.actualizadoEn = new Date().toISOString();
    try {
      await window.db.put('fincas', finca);
      App.toast('✅ Zona creada');
      AjustesView._gestionarZonas();
    } catch (e) {
      App.toastError('Error: ' + e.message);
    }
  },

  async _editarZona(idx) {
    const finca = await Fincas.getActive();
    if (!finca || !finca.zonas || !finca.zonas[idx]) return;
    
    const z = finca.zonas[idx];
    const overlay = document.createElement('div');
    overlay.className = 'wizard-overlay';
    overlay.innerHTML = `
      <div class="wizard-card modal-scroll">
        <div class="wizard-header">
          <h2 class="flex items-center gap-8">${Icons.editar()} Editar Zona: ${z.nombre}</h2>
          <button onclick="this.closest('.wizard-overlay').remove()" class="btn btn-secondary" style="padding:8px 16px;">${Icons.cerrar()} Cerrar</button>
        </div>
        <div class="wizard-body p-20">
          <div class="grid gap-12">
            <div>
              <label class="text-xs text-gold font-bold">NOMBRE</label>
              <input type="text" id="edit-zona-nombre" value="${z.nombre}" class="wizard-input">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div>
                <label class="text-xs text-gold font-bold">SUPERFICIE (ha)</label>
                <input type="number" id="edit-zona-sup" value="${z.superficie || 0}" class="wizard-input" step="0.1">
              </div>
              <div>
                <label class="text-xs text-gold font-bold">AFORO MÁXIMO</label>
                <input type="number" id="edit-zona-aforo" value="${z.aforoMax || z.aforo_maximo || 50}" class="wizard-input">
              </div>
            </div>
            <div>
              <label class="text-xs text-gold font-bold">TIPO EXPLOTACIÓN REGA</label>
              <select id="edit-zona-rega" class="wizard-input">
                <option value="Producción y reproducción" ${z.tipo_explotacion_rega === 'Producción y reproducción' ? 'selected' : ''}>Producción y reproducción</option>
                <option value="Reproducción para abasto" ${z.tipo_explotacion_rega === 'Reproducción para abasto' ? 'selected' : ''}>Reproducción para abasto</option>
                <option value="Cebo o engorde (Cebadero)" ${z.tipo_explotacion_rega === 'Cebo o engorde (Cebadero)' ? 'selected' : ''}>Cebo o engorde (Cebadero)</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div>
                <label class="text-xs text-gold font-bold">CÓDIGO PAC</label>
                <input type="text" id="edit-zona-pac" value="${z.codigo_pac || ''}" class="wizard-input" placeholder="ES...">
              </div>
              <div>
                <label class="text-xs text-gold font-bold">DISTANCIA AGUA (m)</label>
                <input type="number" id="edit-zona-dist" value="${z.distancia_agua_m || 0}" class="wizard-input">
              </div>
            </div>
            <div class="flex gap-10 mt-15">
              <button class="btn btn-success flex-1" onclick="AjustesView._guardarZona(${idx})">${Icons.guardar()} Guardar</button>
              <button class="btn btn-secondary flex-1" onclick="this.closest('.wizard-overlay').remove()">${Icons.cerrar()} Cancelar</button>
            </div>
          </div>
        </div>
      </div>`;
    overlay.style.cssText = 'position:fixed; inset:0; z-index:6000; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; padding:20px;';
    document.body.appendChild(overlay);
  },

  async _guardarZona(idx) {
    const finca = await Fincas.getActive();
    if (!finca || !finca.zonas || !finca.zonas[idx]) return;
    
    finca.zonas[idx].nombre = document.getElementById('edit-zona-nombre').value;
    finca.zonas[idx].superficie = parseFloat(document.getElementById('edit-zona-sup').value) || 0;
    finca.zonas[idx].aforoMax = parseInt(document.getElementById('edit-zona-aforo').value) || 50;
    finca.zonas[idx].aforo_maximo = finca.zonas[idx].aforoMax;
    finca.zonas[idx].tipo_explotacion_rega = document.getElementById('edit-zona-rega').value;
    finca.zonas[idx].codigo_pac = document.getElementById('edit-zona-pac').value;
    finca.zonas[idx].distancia_agua_m = parseInt(document.getElementById('edit-zona-dist').value) || 0;
    finca.actualizadoEn = new Date().toISOString();

    try {
      await window.db.put('fincas', finca);
      document.querySelector('.wizard-overlay').remove();
      App.toast('✅ Zona guardada');
      AjustesView._gestionarZonas();
    } catch (e) {
      App.toastError('Error: ' + e.message);
    }
  },

  async _eliminarZona(idx) {
    if (!await Confirm.confirm("Eliminar Zona", "¿Eliminar esta zona? Los rebaños que la usan perderán la referencia.", true)) return;
    
    const finca = await Fincas.getActive();
    if (!finca || !finca.zonas) return;
    
    finca.zonas.splice(idx, 1);
    finca.actualizadoEn = new Date().toISOString();

    try {
      await window.db.put('fincas', finca);
      App.toast('🗑️ Zona eliminada');
      AjustesView._gestionarZonas();
    } catch (e) {
      App.toastError('Error: ' + e.message);
    }
  },

  async _exportarCierreMensual() {
    try {
      const fincaId = await Fincas.getActiveId();
      const finca = await Fincas.get(fincaId);
      if (!fincaId || !finca) {
        App.toastError('No hay finca activa para cierre mensual');
        return;
      }
      if (!window.ExportService?.generarCSV_Movimientos) {
        App.toastError('ExportService no disponible');
        return;
      }
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      const animales = await window.Animales.list().catch(() => []);
      const eventos = await window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId).catch(() => []);
      const eventosMes = eventos.filter(e => {
        if (!e.fecha) return false;
        const f = new Date(e.fecha);
        return f >= inicioMes && f <= finMes;
      });

      if (eventosMes.length === 0) {
        App.toastError('No hay eventos registrados en este mes para exportar');
        return;
      }

      const csv = window.ExportService.generarCSV_Movimientos(eventosMes, animales, finca);
      const ym = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      const filename = `cierre_siggan_${ym}.csv`;

      await window.ExportService.descargar(csv, filename, 'text/csv;charset=utf-8');

      App.toast(`Cierre mensual exportado (${eventosMes.length} eventos)`);
    } catch (e) {
      App.toastError('No se pudo exportar cierre mensual: ' + e.message);
    }
  },

  _abrirManual() {
    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7000; background:#fff; display:flex; flex-direction:column;';
    overlay.innerHTML = `
      <div class="manual-header">
        <strong style="color:#e0a83a;" class="inline-flex items-center gap-6">${Icons.libro()} Manual de Usuario</strong>
        <button onclick="this.closest('.wizard-full-screen').remove()" class="btn btn-secondary" style="padding:6px 12px; font-size:0.7rem;">${Icons.cerrar()} Cerrar</button>
      </div>
      <iframe src="manual/index.html" class="manual-iframe"></iframe>`;
    document.body.appendChild(overlay);
  },

  async _nuevoADSG() {
    const fincaId = await Fincas.getActiveId();
    const html = `
      <div class="card p-25 max-w-400 border-top-5-blue">
        <h3 class="mt-0 text-white font-900 uppercase">${Icons.sanidad()} NUEVA ADSG</h3>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">NOMBRE AGRUPACIÓN *</label>
          <input type="text" id="adsg-nombre" placeholder="EJ: ADSG SIERRA NORTE" class="wizard-input uppercase font-800">
        </div>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">CÓDIGO OFICIAL *</label>
          <input type="text" id="adsg-codigo" placeholder="EJ: ADSG-123" class="wizard-input uppercase font-800">
        </div>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">VETERINARIO RESPONSABLE</label>
          <input type="text" id="adsg-vet" placeholder="NOMBRE COMPLETO" class="wizard-input uppercase font-800">
        </div>
        <div class="grid grid-cols-2 gap-10 mb-12">
          <div class="wizard-input-group">
            <label class="wizard-label">Nº COLEGIADO</label>
            <input type="text" id="adsg-col" placeholder="0000" class="wizard-input font-800">
          </div>
          <div class="wizard-input-group">
            <label class="wizard-label">NIF VET.</label>
            <input type="text" id="adsg-vet-nif" placeholder="NIF" class="wizard-input font-800">
          </div>
        </div>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">TELÉFONO DE CONTACTO</label>
          <input type="tel" id="adsg-tel" placeholder="600000000" class="wizard-input font-800">
        </div>
        <div class="flex gap-10 mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-success flex-1" id="btn-save-adsg">${Icons.guardar()} <span class="widget-link-label">GUARDAR</span></button>
          <button class="widget-link-btn widget-link-btn--neon neon-danger flex-1" onclick="this.closest('.wizard-full-screen').remove()">${Icons.cerrar()} <span class="widget-link-label">CANCELAR</span></button>
        </div>
      </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7000; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center;';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-save-adsg').onclick = async () => {
      const nombre = document.getElementById('adsg-nombre').value.trim();
      const codigo = document.getElementById('adsg-codigo').value.trim();
      const veterinario = document.getElementById('adsg-vet').value.trim();
      const colegiado = document.getElementById('adsg-col').value.trim();
      const telefono = document.getElementById('adsg-tel').value.trim();
      const vet_nif = document.getElementById('adsg-vet-nif').value.trim();

      if (!nombre || !codigo) return App.toastError("Nombre y Código son obligatorios");

      try {
        await window.ADSGs.save({ nombre, codigo, veterinario, colegiado, telefono, vet_nif });
        overlay.remove();
        App.toast("✅ ADSG Guardada");
        AjustesView.render();
      } catch (e) { App.toastError(e.message); }
    };
  },

  async _editarADSG(id) {
    const adsg = await window.ADSGs.get(id);
    if (!adsg) return;

    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7000; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center;';
    overlay.innerHTML = `
      <div class="card p-25 max-w-400 border-top-5-blue">
        <h3 class="mt-0 text-white font-900 uppercase">${Icons.editar()} EDITAR ADSG</h3>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">NOMBRE AGRUPACIÓN *</label>
          <input type="text" id="adsg-nombre" value="${adsg.nombre}" class="wizard-input uppercase font-800">
        </div>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">CÓDIGO OFICIAL *</label>
          <input type="text" id="adsg-codigo" value="${adsg.codigo}" class="wizard-input uppercase font-800">
        </div>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">VETERINARIO RESPONSABLE</label>
          <input type="text" id="adsg-vet" value="${adsg.veterinario || ''}" class="wizard-input uppercase font-800">
        </div>
        <div class="grid grid-cols-2 gap-10 mb-12">
          <div class="wizard-input-group">
            <label class="wizard-label">Nº COLEGIADO</label>
            <input type="text" id="adsg-col" value="${adsg.colegiado || ''}" class="wizard-input font-800">
          </div>
          <div class="wizard-input-group">
            <label class="wizard-label">NIF VET.</label>
            <input type="text" id="adsg-vet-nif" value="${adsg.vet_nif || ''}" class="wizard-input font-800">
          </div>
        </div>
        <div class="wizard-input-group mb-12">
          <label class="wizard-label">TELÉFONO DE CONTACTO</label>
          <input type="tel" id="adsg-tel" value="${adsg.telefono || ''}" class="wizard-input font-800">
        </div>
        <div class="flex gap-10 mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-success flex-1" id="btn-update-adsg">${Icons.guardar()} <span class="widget-link-label">GUARDAR</span></button>
          <button class="widget-link-btn widget-link-btn--neon neon-danger flex-1" onclick="this.closest('.wizard-full-screen').remove()">${Icons.cerrar()} <span class="widget-link-label">CANCELAR</span></button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-update-adsg').onclick = async () => {
      adsg.nombre = document.getElementById('adsg-nombre').value.trim();
      adsg.codigo = document.getElementById('adsg-codigo').value.trim();
      adsg.veterinario = document.getElementById('adsg-vet').value.trim();
      adsg.colegiado = document.getElementById('adsg-col').value.trim();
      adsg.telefono = document.getElementById('adsg-tel').value.trim();
      adsg.vet_nif = document.getElementById('adsg-vet-nif').value.trim();

      try {
        await window.ADSGs.save(adsg);
        overlay.remove();
        App.toast("✅ ADSG Actualizada");
        AjustesView.render();
      } catch (e) { App.toastError(e.message); }
    };
  },

  async _eliminarADSG(id) {
    if (!await Confirm.confirm("Eliminar ADSG", "¿Deseas eliminar esta agrupación?")) return;
    await window.ADSGs.remove(id);
    App.toast("🗑️ ADSG Eliminada");
    AjustesView.render();
  },

  async _agregarCosteReferencia() {
    const fincaId = await Fincas.getActiveId();
    const especies = await window.db.getAll("config_especies");

    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7000; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center;';
    overlay.innerHTML = `
      <div class="card p-25 max-w-340 border-top-5-amber">
        <h3 class="mt-0 text-gold font-900 uppercase">${Icons.dinero()} NUEVO COSTE REF.</h3>
        <div class="wizard-input-group mb-15">
          <label class="wizard-label">ESPECIE</label>
          <select id="cref-especie" class="wizard-input font-800 uppercase">
            ${especies.map(e => `<option value="${e.nombre}">${e.nombre.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div class="wizard-input-group mb-15">
          <label class="wizard-label">COSTE ESTIMADO (€/ANIMAL/DÍA)</label>
          <input type="number" id="cref-valor" value="0.50" step="0.01" class="wizard-input font-950 text-xl text-amber">
        </div>
        <div class="flex gap-10 mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-success flex-1" id="btn-save-cref">${Icons.guardar()} <span class="widget-link-label">GUARDAR</span></button>
          <button class="widget-link-btn widget-link-btn--neon neon-danger flex-1" onclick="this.closest('.wizard-full-screen').remove()">${Icons.cerrar()} <span class="widget-link-label">CANCELAR</span></button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-save-cref').onclick = async () => {
      const especie = document.getElementById('cref-especie').value;
      const valor = parseFloat(document.getElementById('cref-valor').value) || 0;
      if (valor <= 0) return App.toastError("El valor debe ser mayor a 0");

      try {
        await window.db.add('config_costes_referencia', {
          fincaId: Number(fincaId),
          especie,
          coste_diario_estimado: valor,
          actualizadoEn: new Date().toISOString()
        });
        overlay.remove();
        App.toast("✅ Coste de referencia guardado");
        AjustesView.render();
      } catch (e) { App.toastError(e.message); }
    };
  },

  async _eliminarCosteRef(id) {
    if (!await Confirm.confirm("Eliminar Coste Ref.", "¿Eliminar este parámetro de coste?")) return;
    await window.db.delete('config_costes_referencia', id);
    App.toast("🗑️ Parámetro eliminado");
    AjustesView.render();
  }
};

window.AjustesView = AjustesView;
