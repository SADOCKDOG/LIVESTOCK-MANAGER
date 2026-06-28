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
    const config = await this._loadConfig();
    const lastBackup = localStorage.getItem('last_backup_date');
    const catalogoTiposREGA = window.ComunidadesService?.getTiposExplotacionREGA ? window.ComunidadesService.getTiposExplotacionREGA().slice(0, 5) : [];
    const catalogoEspeciesREGA = window.ComunidadesService?.getEspeciesAutorizables ? window.ComunidadesService.getEspeciesAutorizables() : [];

    main.innerHTML = `
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
          <button class="widget-link-btn widget-link-btn--neon neon-warning" onclick="App._showFincaForm()">
            ${Icons.agregar()}
            <span class="widget-link-label">Nueva Finca</span>
          </button>
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
      </div>

      <!-- ===================== PAQUETE LÁCTEO ===================== -->
      <div class="card card-accent card-accent-amber mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.leche()} Paquete Lácteo</h3>
        <p class="text-gray mt-5 text-sm">Gestión de contratos obligatorios (RD 752/2016) y declaraciones mensuales INFOLAC.</p>
        ${activeFinca ? `
        <div class="info-box mt-15">
          <div class="grid grid-cols-2 gap-8 text-85">
            <div><span class="text-gray">Nº Contrato:</span> <strong class="text-white">${activeFinca.contrato_lacteo_numero || '—'}</strong></div>
            <div><span class="text-gray">Vencimiento:</span> <strong class="${activeFinca.contrato_lacteo_fecha_fin && new Date(activeFinca.contrato_lacteo_fecha_fin) < new Date() ? 'text-red' : 'text-white'}">${activeFinca.contrato_lacteo_fecha_fin || '—'}${activeFinca.contrato_lacteo_fecha_fin && new Date(activeFinca.contrato_lacteo_fecha_fin) < new Date() ? ' ⚠️ Vencido' : ''}</strong></div>
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
        <div class="info-box mt-15">
          <div class="grid grid-cols-2 gap-8 text-85">
            <div><span class="text-gray">ADSG:</span> <strong class="text-white">${activeFinca.adsg_nombre || '—'}</strong></div>
            <div><span class="text-gray">Código:</span> <strong class="text-white">${activeFinca.adsg_codigo || '—'}</strong></div>
            <div><span class="text-gray">Veterinario:</span> <strong class="text-white">${activeFinca.adsg_veterinario || '—'}</strong></div>
            <div><span class="text-gray">Colegiado:</span> <strong class="text-white">${activeFinca.adsg_vet_colegiado || '—'}</strong></div>
            <div><span class="text-gray">Teléfono:</span> <strong class="text-white">${activeFinca.adsg_vet_telefono || '—'}</strong></div>
            <div><span class="text-gray">Vencimiento:</span> <strong class="${activeFinca.adsg_fecha_vencimiento ? 'text-amber' : 'text-gray'}">${activeFinca.adsg_fecha_vencimiento || '—'}${activeFinca.adsg_fecha_vencimiento ? AjustesView._diasRestantes(activeFinca.adsg_fecha_vencimiento) : ''}</strong></div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-10 max-w-220 mx-auto mt-20">
          <button class="widget-link-btn widget-link-btn--neon neon-info" onclick="App._editarFincaActiva()">
            ${Icons.editar()}
            <span class="widget-link-label">Editar ADSG</span>
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
        </div>
      </div>

      <!-- ===================== INFORMACIÓN DEL SISTEMA ===================== -->
      <div class="card card-accent card-accent-gold mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.info()} Información del Sistema</h3>
        <p class="text-gray mt-5 text-sm">Estado técnico de la base de datos local y versión actual de la aplicación.</p>
        <div class="info-box mt-15">
          <div class="grid grid-cols-2 gap-8 text-85">
            <div><span class="text-gray">Versión:</span> <strong class="text-white">v4.8.5</strong></div>
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
        <p class="text-gray mt-5 text-sm">Consulta de catálogos normativos oficiales para configuración de explotación.</p>
        <div class="info-box mt-15">
          <div class="text-xs text-gray uppercase font-800 mb-6">Tipos Explotación:</div>
          <div class="text-white text-xs leading-relaxed">${catalogoTiposREGA.join(' · ')}</div>
          <div class="text-xs text-gray uppercase font-800 mt-12 mb-6">Especies Autorizables:</div>
          <div class="text-white text-xs leading-relaxed">${catalogoEspeciesREGA.join(' · ')}</div>
        </div>
      </div>

      <!-- ===================== HISTORIAL TRÁMITES ===================== -->
      <div class="card card-accent card-accent-gold mb-25 p-20">
        <h3 class="flex items-center gap-10 mt-0 text-white font-900 uppercase text-lg">${Icons.documento()} Historial de Documentos</h3>
        <p class="text-gray mt-5 text-sm">Últimos eventos de tramitación oficial registrados en la base de datos.</p>
        <div class="mt-15">
          ${tramitesFinca.slice(-5).reverse().map(d => `
            <div class="p-10 border border-222 bg-black rounded-sm mb-8">
              <div class="text-white text-xs font-900 uppercase">${d.tipo || 'documento'} · ${d.numero || 'S/N'}</div>
              <div class="text-aaa text-[0.62rem] mt-4 uppercase font-800">${d.fecha_emision || d.created_at || ''}</div>
              ${d.estado_tramite ? `<div class="text-green text-[0.6rem] mt-6 font-900 uppercase">ESTADO: ${d.estado_tramite}</div>` : ''}
            </div>
          `).join('') || '<div class="text-gray text-center p-10 uppercase font-800 text-xs">Sin trámites recientes</div>'}
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
          © 2026 Livestock Manager Premium · v4.8.5<br>
          Todos los derechos reservados.
        </div>
      </div>`;
  },

  // ===================== HELPER: CONFIG =====================

  async _loadConfig() {
    const defaults = { objGmd: 0.8, objLitros: 25, objFert: 85, objOcup: 85, objRent: 20, objBajas: 5, autoBackup: false, temaOscuro: true, formatoFecha: 'es-ES', moneda: '€', especies: [], alertSanidad: true, alertTrazabilidad: true, alertPAC: true, alertADSG: true, alertINCOLAC: true, alertContratos: false };
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
    App.toast(checked ? '🌙 Modo oscuro' : '☀️ Modo claro');
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
    App.toast('🗑️ Especie eliminada');
    App.renderAjustes();
  },

  async _limpiarCache() {
    if (!await Confirm.confirm("Limpiar Caché", "¿Limpiar caché local? Se recargarán los datos desde la base de datos.", true)) return;
    if (window.CacheService) CacheService.clearAll();
    localStorage.removeItem('seed_data_completed');
    App.toast('🗑️ Caché limpiada');
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
    App.toast('🏠 Finca activa cambiada');
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
                <input type="text" id="edit-rega" value="${finca.codigo_REGA || finca.rega || ''}" class="wizard-input" placeholder="ES-...">
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
      const csv = window.ExportService.generarCSV_Movimientos(eventosMes, animales, finca);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ym = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      a.href = url;
      a.download = `cierre_siggan_${ym}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      App.toast(`📦 Cierre mensual exportado (${eventosMes.length} eventos)`);
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
        <button onclick="this.closest('.wizard-full-screen').remove()" class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem;">${Icons.cerrar()} Cerrar</button>
      </div>
      <iframe src="manual/index.html" class="manual-iframe"></iframe>`;
    document.body.appendChild(overlay);
  }
};

window.AjustesView = AjustesView;
