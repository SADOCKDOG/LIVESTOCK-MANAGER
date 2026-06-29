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
      <div class="card card-left-green mb-25">
        <h3 class="flex items-center gap-8">${Icons.finca()} Gestor de Finca Activa</h3>
        <div class="info-box mt-10">
          <div class="grid grid-cols-2 gap-6 text-82">
            <div><span class="text-gray">Finca:</span> <strong class="text-white">${activeFinca.nombre}</strong></div>
            <div><span class="text-gray">REGA:</span> <strong class="text-white">${activeFinca.codigo_REGA || activeFinca.rega || "N/D"}</strong></div>
            <div><span class="text-gray">CCAA:</span> <strong class="text-white">${activeFinca.comunidad_autonoma === 'andalucia' ? '🌿 Andalucía' : activeFinca.comunidad_autonoma === 'extremadura' ? '🌿 Extremadura' : 'No configurada'}</strong></div>
            <div><span class="text-gray">Tipo:</span> <strong class="text-white">${activeFinca.tipo_explotacion || '—'}</strong></div>
          </div>
        </div>
        <div class="flex gap-10 mt-10">
          <button class="btn btn-edit flex-1" onclick="AjustesView._editarFincaPrincipal()">${Icons.editar()} Editar Datos</button>
          <button class="btn btn-secondary flex-1" onclick="AjustesView._gestionarZonas()">${Icons.zonas()} Zonas</button>
        </div>
      </div>
      ` : ''}

      <!-- ===================== MIS FINCAS ===================== -->
      <div class="card card-left-gold mb-25">
        <div class="flex justify-between items-center mb-15"><h3 class="flex items-center gap-8">${Icons.finca()} Mis Fincas</h3><button class="btn btn-create btn-sm" onclick="App._showFincaForm()">${Icons.agregar()} Nueva</button></div>
        <div class="grid gap-10">${fincas.map((f) => {
          const anims = animales.filter(a => a.rebanoId && rebanos.some(r => r.id === a.rebanoId && r.fincaId === f.id));
          return `<div class="flex justify-between items-center rounded-sm" style="background:#222; padding:12px; border:1px solid ${f.id === activeId ? "var(--p-cork)" : "#333"};">
          <div>
            <div class="font-bold" style="color:${f.id === activeId ? "var(--p-cork)" : "#fff"};">${f.nombre}</div>
            <div class="text-gray" style="font-size:0.75rem;">REGA: ${f.codigo_REGA || f.rega || "N/D"} · 🐑 ${anims.length} animales</div>
          </div>
          <div>${f.id !== activeId ? `<button onclick="AjustesView._cambiarFincaActiva(${f.id})" class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem;">Activar</button>` : `<span class="badge badge-gold text-xs" style="padding:4px 10px;">Activa</span>`}</div>
        </div>`;
        }).join("")}</div>
      </div>

      <!-- ===================== COPIA DE SEGURIDAD ===================== -->
      <div class="card card-left-blue mb-20">
        <h3 class="flex items-center gap-8">${Icons.guardar()} Copias de Seguridad</h3>
        <p class="text-gray mt-5 text-85">Exporta o importa todos los datos de la aplicación en formato JSON.</p>
        ${lastBackup ? `<div class="text-xs text-gray mb-8">📅 Último backup: ${new Date(lastBackup).toLocaleDateString('es-ES')}</div>` : ''}
        <div class="flex gap-10">
          <button class="btn btn-success flex-1" onclick="App.exportBackup()">${Icons.exportar()} Exportar</button>
          <button class="btn btn-secondary flex-1" onclick="document.getElementById('import-backup-file').click()">${Icons.importar()} Importar</button>
        </div>
        <input type="file" id="import-backup-file" style="display:none" onchange="App.importBackup(event)">
        <label class="flex items-center gap-6 mt-10 text-xs text-gray cursor-pointer" onclick="const c=document.getElementById('auto-backup'); if(c){c.checked=!c.checked;AjustesView._toggleAutoBackup(c.checked)}">
          <input type="checkbox" id="auto-backup" ${config.autoBackup ? 'checked' : ''} style="accent-color:#3b82f6;"> Backup automático al salir
        </label>
      </div>

      <!-- ===================== PAQUETE LÁCTEO ===================== -->
      <div class="card card-left-amber mb-20">
        <h3 class="flex items-center gap-8">${Icons.leche()} Paquete Lácteo — Contratación</h3>
        <p class="text-gray mt-5 text-85">Gestión de contratos lácteos obligatorios (RD 752/2016) y declaraciones INFOLAC.</p>
        ${activeFinca ? `
        <div class="info-box mt-10">
          <div class="grid grid-cols-2 gap-6 text-82">
            <div><span class="text-gray">Nº Contrato:</span> <strong class="text-white">${activeFinca.contrato_lacteo_numero || '—'}</strong></div>
            <div><span class="text-gray">Vencimiento:</span> <strong style="color:${activeFinca.contrato_lacteo_fecha_fin && new Date(activeFinca.contrato_lacteo_fecha_fin) < new Date() ? '#ef4444' : '#fff'};">${activeFinca.contrato_lacteo_fecha_fin || '—'}${activeFinca.contrato_lacteo_fecha_fin && new Date(activeFinca.contrato_lacteo_fecha_fin) < new Date() ? ' ⚠️ Vencido' : ''}</strong></div>
            <div><span class="text-gray">Comprador:</span> <strong class="text-white">${activeFinca.contrato_lacteo_comprador || '—'}</strong></div>
            <div><span class="text-gray">INFOLAC:</span> <strong class="text-white">${activeFinca.numero_infolac || '—'}</strong></div>
          </div>
        </div>
        <div class="text-gray-500 mt-8 rounded-sm" style="font-size:0.72rem; padding:8px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.15);">
          📌 El contrato lácteo debe tener una duración mínima de 1 año. Las declaraciones INFOLAC son mensuales y obligatorias.
        </div>` : '<p class="text-555">Activa una finca para ver los datos de contratación láctea.</p>'}
        <button class="btn btn-edit btn-full" onclick="App._editarFincaActiva()">${Icons.editar()} Editar Contrato Lácteo</button>
      </div>

      <!-- ===================== ADSG ===================== -->
      <div class="card card-left-blue mb-20">
        <h3 class="flex items-center gap-8">${Icons.sanidad()} ADSG — Sanidad Ganadera</h3>
        <p class="text-gray mt-5 text-85">Agrupación de Defensa Sanitaria Ganadera. Datos del veterinario de explotación y códigos ADSG.</p>
        ${activeFinca ? `
        <div class="info-box mt-10">
          <div class="grid grid-cols-2 gap-6 text-82">
            <div><span class="text-gray">ADSG:</span> <strong class="text-white">${activeFinca.adsg_nombre || '—'}</strong></div>
            <div><span class="text-gray">Código:</span> <strong class="text-white">${activeFinca.adsg_codigo || '—'}</strong></div>
            <div><span class="text-gray">Veterinario:</span> <strong class="text-white">${activeFinca.adsg_veterinario || '—'}</strong></div>
            <div><span class="text-gray">Colegiado:</span> <strong class="text-white">${activeFinca.adsg_vet_colegiado || '—'}</strong></div>
            <div><span class="text-gray">Teléfono Vet.:</span> <strong class="text-white">${activeFinca.adsg_vet_telefono || '—'}</strong></div>
            <div><span class="text-gray">Vencimiento:</span> <strong style="color:${activeFinca.adsg_fecha_vencimiento ? '#f59e0b' : '#888'};">${activeFinca.adsg_fecha_vencimiento || '—'}${activeFinca.adsg_fecha_vencimiento ? AjustesView._diasRestantes(activeFinca.adsg_fecha_vencimiento) : ''}</strong></div>
          </div>
        </div>` : '<p class="text-555">Activa una finca para gestionar los datos ADSG.</p>'}
        <button class="btn btn-edit btn-full" onclick="App._editarFincaActiva()">${Icons.editar()} Editar ADSG</button>
      </div>

      <!-- ===================== CONFIGURACIÓN AUTONÓMICA ===================== -->
      <div class="card card-left-purple mb-20">
        <h3 class="flex items-center gap-8">${Icons.globo()} Configuración Autonómica</h3>
        <p class="text-gray mt-5 text-85">Normativa autonómica activa, plataforma de movimiento y umbrales PAC.</p>
        ${activeFinca ? (() => {
          const ccaa = activeFinca.comunidad_autonoma;
          const plataforma = ccaa && window.ComunidadesService ? window.ComunidadesService.getPlataformaMovimiento(ccaa) : null;
          const umbral = ccaa && window.ComunidadesService ? window.ComunidadesService.getUmbralPAC(ccaa) : null;
          const dist = ccaa && window.ComunidadesService ? window.ComunidadesService.getDistanciaMinimaREGA(ccaa) : null;
          const plataformaUrl = ccaa === 'andalucia' ? 'https://www.juntadeandalucia.es/agriculturaypesca/siggan' : 'https://www.arado.gobex.es';
          return `
          <div class="info-box mt-10">
            <div class="font-bold text-white mb-8">${ccaa === 'andalucia' ? '🌿 Andalucía' : ccaa === 'extremadura' ? '🌿 Extremadura' : '⚠️ No configurada'}</div>
            ${ccaa ? `
            <div class="grid grid-cols-2 gap-6 text-82">
              <div><span class="text-gray">Sistema Mov.:</span> <strong class="text-white">${plataforma || '—'}</strong></div>
              <div><span class="text-gray">Dist. Mín. REGA:</span> <strong class="text-white">${dist || '—'} m</strong></div>
              <div><span class="text-gray">Umbral PAC:</span> <strong class="text-white">${umbral || '—'} UGM/año</strong></div>
              <div><span class="text-gray">Explotación:</span> <strong class="text-white">${activeFinca.tipo_explotacion || '—'} / ${activeFinca.sistema_explotacion || '—'}</strong></div>
            </div>
            <div class="text-gray-500 mt-8 rounded-sm" style="font-size:0.72rem; padding:6px; background:rgba(139,92,246,0.08);">
              📌 ${ccaa === 'andalucia' ? 'Guías sanitarias automáticas (365d). Plataforma PIMA. Subvención ADSG directa.' : 'Guías requieren confirmación. Plataforma Arado/Laboreo. Control ADSG estricto.'}
            </div>
            <div class="flex gap-6 mt-10">
              <a href="${plataformaUrl}" target="_blank" rel="noopener" class="btn btn-secondary text-xs flex-1 text-center" style="padding:6px;border:1px solid #8b5cf6;">${Icons.enlace()} Ir a ${plataforma || 'Plataforma'}</a>
            </div>` : '<p class="text-555">Configura la comunidad autónoma en la ficha de la finca.</p>'}
          </div>`; })() : '<p class="text-555">Activa una finca para ver la configuración autonómica.</p>'}
        <button class="btn btn-edit btn-full" onclick="App._editarFincaActiva()">${Icons.editar()} Editar Configuración</button>
        <button class="btn btn-secondary btn-full-sm" onclick="App._mostrarGuiaNormativas()">${Icons.libro()} Comparativa Normativa CCAA</button>
      </div>

      <!-- ===================== OBJETIVOS DE EXPLOTACIÓN ===================== -->
      <div class="card card-left-green mb-20">
        <h3 class="flex items-center gap-8">${Icons.objetivo()} Objetivos de Explotación</h3>
        <p class="text-gray mt-5 text-85">Define las metas productivas para el Panel de Eficiencia Técnica (semáforos 🟢🟡🔴).</p>
        <div class="grid grid-cols-2 gap-6 mt-10">
          <div><label class="text-xs text-gray">GMD Objetivo (kg/día)</label><input type="number" id="obj-gmd" value="${config.objGmd || 0.8}" step="0.1" class="premium-input" style="height:36px;" onchange="AjustesView._guardarObjetivo('objGmd', this.value)"></div>
          <div><label class="text-xs text-gray">Litros/Vaca/Día Objetivo</label><input type="number" id="obj-litros" value="${config.objLitros || 25}" step="1" class="premium-input" style="height:36px;" onchange="AjustesView._guardarObjetivo('objLitros', this.value)"></div>
          <div><label class="text-xs text-gray">Fertilidad Objetivo (%)</label><input type="number" id="obj-fert" value="${config.objFert || 85}" step="1" class="premium-input" style="height:36px;" onchange="AjustesView._guardarObjetivo('objFert', this.value)"></div>
          <div><label class="text-xs text-gray">Ocupación Aforo Objetivo (%)</label><input type="number" id="obj-ocup" value="${config.objOcup || 85}" step="1" class="premium-input" style="height:36px;" onchange="AjustesView._guardarObjetivo('objOcup', this.value)"></div>
          <div><label class="text-xs text-gray">Rentabilidad Objetivo (%)</label><input type="number" id="obj-rent" value="${config.objRent || 20}" step="1" class="premium-input" style="height:36px;" onchange="AjustesView._guardarObjetivo('objRent', this.value)"></div>
          <div><label class="text-xs text-gray">% Bajas Máximo</label><input type="number" id="obj-bajas" value="${config.objBajas || 5}" step="1" class="premium-input" style="height:36px;" onchange="AjustesView._guardarObjetivo('objBajas', this.value)"></div>
        </div>
      </div>

      <!-- ===================== ESPECIES Y RAZAS ===================== -->
      <div class="card card-left-amber mb-20">
        <h3 class="flex items-center gap-8">${Icons.reproduccion()} Especies y Razas</h3>
        <p class="text-gray mt-5 text-85">Gestiona las especies activas en tu explotación y sus parámetros de referencia.</p>
        <div id="especies-container" class="mt-10">${this._renderEspecies(config)}</div>
        <button class="btn btn-create btn-full-sm mt-8" onclick="AjustesView._agregarEspecie()">${Icons.agregar()} Añadir Especie</button>
      </div>

      <!-- ===================== GESTIÓN DE ALERTAS ===================== -->
      <div class="card card-left-red mb-20">
        <h3 class="flex items-center gap-8">${Icons.campana()} Gestión de Alertas</h3>
        <p class="text-gray mt-5 text-85">Activa o desactiva los tipos de alerta que quieres recibir en el Dashboard.</p>
        <div class="grid gap-6 mt-10">
          ${[
            { id: 'alertSanidad', label: 'Alertas Sanitarias (supresión venta)', def: true },
            { id: 'alertTrazabilidad', label: 'Alertas de Trazabilidad (SIA)', def: true },
            { id: 'alertPAC', label: 'Alertas PAC (vencimientos, declaraciones)', def: true },
            { id: 'alertADSG', label: 'Alertas ADSG (citas, vacunaciones)', def: true },
            { id: 'alertINCOLAC', label: 'Alertas INFOLAC (declaraciones mensuales)', def: true },
            { id: 'alertContratos', label: 'Alertas de Contratos (vencimientos)', def: false },
          ].map(a => `
            <label class="flex items-center gap-8 text-sm text-gray cursor-pointer" style="padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
              <input type="checkbox" ${config[a.id] !== false ? 'checked' : ''} style="accent-color:#ef4444;" onchange="AjustesView._toggleAlerta('${a.id}', this.checked)"> ${a.label}
            </label>`).join('')}
        </div>
      </div>

      <!-- ===================== PREFERENCIAS ===================== -->
      <div class="card card-left-purple mb-20">
        <h3 class="flex items-center gap-8">${Icons.ajustes()} Preferencias</h3>
        <p class="text-gray mt-5 text-85">Configura el comportamiento general de la aplicación.</p>
        <div class="grid gap-6 mt-10">
          <label class="flex items-center gap-8 text-sm text-gray cursor-pointer" style="padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
            <input type="checkbox" ${config.temaOscuro !== false ? 'checked' : ''} style="accent-color:#8b5cf6;" onchange="AjustesView._toggleTema(this.checked)"> 🌙 Modo Oscuro
          </label>
          <label class="flex items-center gap-8 text-sm text-gray" style="padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
            <span>📅 Formato Fecha:</span>
            <select class="premium-input" style="height:32px;font-size:0.8rem;flex:1;" onchange="AjustesView._guardarPreferencia('formatoFecha', this.value)">
              <option value="es-ES" ${config.formatoFecha !== 'en-US' ? 'selected' : ''}>DD/MM/AAAA (España)</option>
              <option value="en-US" ${config.formatoFecha === 'en-US' ? 'selected' : ''}>MM/DD/AAAA (EE.UU.)</option>
            </select>
          </label>
          <label class="flex items-center gap-8 text-sm text-gray" style="padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
            <span>💰 Moneda:</span>
            <select class="premium-input" style="height:32px;font-size:0.8rem;flex:1;" onchange="AjustesView._guardarPreferencia('moneda', this.value)">
              <option value="€" ${config.moneda !== '$' ? 'selected' : ''}>Euro (€)</option>
              <option value="$" ${config.moneda === '$' ? 'selected' : ''}>Dólar ($)</option>
            </select>
          </label>
        </div>
      </div>

      <!-- ===================== INFORMACIÓN DEL SISTEMA ===================== -->
      <div class="card card-left-gold mb-20">
        <h3 class="flex items-center gap-8">${Icons.info()} Información del Sistema</h3>
        <p class="text-gray mt-5 text-85">Estado de la base de datos local y versión de la aplicación.</p>
        <div class="grid grid-cols-2 gap-6 mt-10" style="font-size:0.8rem;">
          <div><span class="text-gray">Versión App:</span> <strong class="text-white">v4.5.0</strong></div>
          <div><span class="text-gray">Base Datos:</span> <strong class="text-white">IndexedDB v10</strong></div>
          <div><span class="text-gray">Fincas:</span> <strong class="text-white">${fincas.length}</strong></div>
          <div><span class="text-gray">Animales:</span> <strong class="text-white">${animales.length}</strong></div>
          <div><span class="text-gray">Rebaños:</span> <strong class="text-white">${rebanos.length}</strong></div>
          <div><span class="text-gray">Service Worker:</span> <strong class="text-white">${'serviceWorker' in navigator ? '✅ Activo' : '❌ No soportado'}</strong></div>
        </div>
        <button class="btn btn-danger btn-full-sm mt-10" onclick="AjustesView._limpiarCache()">${Icons.eliminar()} Limpiar Caché Local</button>
      </div>

      <!-- ===================== GESTIÓN DE TRAZABILIDAD ===================== -->
      <div class="card card-left-green mb-20">
        <h3 class="flex items-center gap-8">${Icons.trazabilidad()} Gestión de Trazabilidad</h3>
        <p class="text-gray mt-5 text-85">Genera solicitudes oficiales de remesas de crotales para tu ADSG o Administración.</p>
        <button class="btn btn-create btn-full" onclick="App._abrirWizardPedidoCrotales()">${Icons.documento()} Generar Pedido de Crotales</button>
        <button class="btn btn-secondary btn-full-sm" onclick="App._mostrarAyudaCrotales()">${Icons.libro()} Normativa de Identificación</button>
      </div>

      <!-- ===================== TRÁMITES SIGGAN ===================== -->
      <div class="card card-left-purple mb-20">
        <h3 class="flex items-center gap-8">${Icons.edificio()} Trámites SIGGAN</h3>
        <p class="text-gray mt-5 text-85">Genera la guía de movimiento inter-explotación y la declaración censal para su tramitación oficial (SIGGAN / BADIGEX).</p>
        <button class="btn btn-create btn-full" onclick="App._abrirWizardGuiaMovimiento()">${Icons.rotacion()} Guía de Movimiento</button>
        <button class="btn btn-create btn-full-sm mt-10" onclick="App._abrirWizardCenso()">${Icons.documento()} Declaración Censal Anual</button>
        <button class="btn btn-secondary btn-full-sm mt-10" onclick="AjustesView._exportarCierreMensual()">${Icons.paquete()} Cierre mensual + export SIGGAN</button>
      </div>

      <!-- ===================== CATÁLOGOS REGA ===================== -->
      <div class="card card-left-blue mb-20">
        <h3 class="flex items-center gap-8">${Icons.libroVentas()} Catálogos REGA</h3>
        <p class="text-gray mt-5 text-85">Consulta rápida de catálogos normativos expuestos para configuración de explotación y especies.</p>
        <div class="info-box mt-10">
          <div class="text-xs text-gray mb-6">Tipos explotación (top 5):</div>
          <div class="text-white text-xs">${catalogoTiposREGA.length ? catalogoTiposREGA.join(' · ') : 'No disponible'}</div>
          <div class="text-xs text-gray mt-10 mb-6">Especies autorizables:</div>
          <div class="text-white text-xs">${catalogoEspeciesREGA.length ? catalogoEspeciesREGA.join(' · ') : 'No disponible'}</div>
        </div>
      </div>

      <!-- ===================== HISTORIAL TRÁMITES ===================== -->
      <div class="card card-left-gold mb-20">
        <h3 class="flex items-center gap-8">${Icons.documento()} Historial de Trámites</h3>
        <p class="text-gray mt-5 text-85">Últimos documentos y eventos de tramitación oficial vinculados a la finca activa.</p>
        <div class="info-box mt-10 text-xs">
          <div><span class="text-gray">Documentos legales:</span> <strong class="text-white">${tramitesFinca.length}</strong></div>
          <div><span class="text-gray">Eventos de registro:</span> <strong class="text-white">${eventos.length}</strong></div>
        </div>
        <div class="mt-10">
          ${tramitesFinca.slice(-5).reverse().map(d => `
            <div style="padding:8px; border:1px solid #333; border-radius:8px; margin-bottom:6px;">
              <div class="text-white text-xs"><strong>${d.tipo || 'documento'}</strong> · ${d.numero || 'sin número'}</div>
              <div class="text-gray text-2xs">${d.fecha_emision || d.created_at || ''}</div>
              ${(d.estado_tramite || d.numero_registro_oficial || d.acuse_recibo) ? `
              <div class="text-2xs mt-4">
                <span class="text-gray">Estado:</span> <strong class="text-white">${(d.estado_tramite || 'borrador').toUpperCase()}</strong>
                ${d.numero_registro_oficial ? ` · <span class="text-gray">Reg.:</span> <strong class="text-white">${d.numero_registro_oficial}</strong>` : ''}
                ${d.acuse_recibo ? ` · <span class="text-gray">Acuse:</span> <strong class="text-white">${d.acuse_recibo}</strong>` : ''}
              </div>` : ''}
            </div>
          `).join('') || '<div class="text-gray text-xs">Sin trámites registrados.</div>'}
        </div>
      </div>

      <!-- ===================== GUÍA FARMACOLÓGICA ===================== -->
      <div class="card card-left-red mb-20">
        <h3 class="flex items-center gap-8">${Icons.sanidad()} Guía Farmacológica</h3>
        <p class="text-gray mt-5 text-85">Tabla de tiempos de retiro, supresión y dosificación para evitar residuos.</p>
        <button class="btn btn-secondary btn-full" onclick="App._mostrarAyudaMedicamentos()">${Icons.libro()} Ver Tiempos de Retiro y Dosis</button>
      </div>

      <!-- ===================== MANUAL DE USUARIO ===================== -->
      <div class="card card-left-gold mb-20">
        <h3 class="flex items-center gap-8">${Icons.libro()} Manual de Usuario</h3>
        <p class="text-gray mt-5 text-85">Guía paso a paso del uso de la aplicación, con capturas de cada módulo.</p>
        <button class="btn btn-secondary btn-full" onclick="AjustesView._abrirManual()">${Icons.libro()} Abrir Manual</button>
      </div>

      <!-- ===================== FOOTER ===================== -->
      <div class="text-center p-40" style="background:#050505; border-radius:32px; border:1px solid #111; margin-top:30px;">
        <img src="icons/Logo aplicación.png" alt="Livestock Manager Premium" style="max-width:220px; height:auto; margin:0 auto 20px; display:block;">
        <div class="text-gold font-800 text-85">Desarrollado por</div>
        <div class="text-white font-bold text-xl">David Asuar Arteaga</div>
        <div style="max-width:320px; margin:20px auto; font-size:0.9rem; line-height:1.6;" class="text-777">Plataforma profesional de gestión ganadera inteligente y trazabilidad industrial.</div>
        <div class="mt-15"><a href="mailto:soporte.sdogfarm@gmail.com" class="text-gold font-bold no-underline text-md">📩 soporte.sdogfarm@gmail.com</a></div>
        <div class="mt-12"><a href="https://github.com/SADOCKDOG/LIVESTOCK-MANAGER" target="_blank" rel="noopener noreferrer" class="text-gold font-bold no-underline text-md" style="display:inline-flex; align-items:center; gap:6px;">🐙 GitHub</a></div>
        <div class="mt-40 text-75 text-444" style="border-top:1px solid #111; padding-top:25px;">
          © 2026 Livestock Manager Premium · v4.5.0<br>
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
      <div class="flex items-center gap-6 mb-4" style="padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
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
      <div class="card p-25" style="max-width:340px;border-top:5px solid #f59e0b;">
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
      <div class="wizard-card" style="max-height:90vh; overflow-y:auto;">
        <div class="wizard-header">
          <h2 class="flex items-center gap-8">${Icons.editar()} Editar Datos de Finca</h2>
          <button onclick="this.closest('.wizard-overlay').remove()" class="btn btn-secondary" style="padding:8px 16px;">${Icons.cerrar()} Cerrar</button>
        </div>
        <div class="wizard-body" style="padding:20px;">
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
      zonasHtml = '<p class="text-gray" style="text-align:center; padding:20px;">Sin zonas definidas</p>';
    } else {
      zonasHtml = `<div class="grid gap-10">
        ${zonas.map((z, idx) => `
          <div class="flex justify-between items-center rounded-sm" style="background:#222; padding:12px; border-left:3px solid #d97706;">
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
      <div class="wizard-card" style="max-height:90vh; overflow-y:auto;">
        <div class="wizard-header">
          <h2 class="flex items-center gap-8">${Icons.zonas()} Gestionar Zonas</h2>
          <button onclick="this.closest('.wizard-overlay').remove()" class="btn btn-secondary" style="padding:8px 16px;">${Icons.cerrar()} Cerrar</button>
        </div>
        <div class="wizard-body" style="padding:20px;">
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
    const nombreZona = prompt('Nombre de la nueva zona:');
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
      <div class="wizard-card" style="max-height:90vh; overflow-y:auto;">
        <div class="wizard-header">
          <h2 class="flex items-center gap-8">${Icons.editar()} Editar Zona: ${z.nombre}</h2>
          <button onclick="this.closest('.wizard-overlay').remove()" class="btn btn-secondary" style="padding:8px 16px;">${Icons.cerrar()} Cerrar</button>
        </div>
        <div class="wizard-body" style="padding:20px;">
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
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#1a1a1a; color:#fff;">
        <strong style="color:#e0a83a;" class="inline-flex items-center gap-6">${Icons.libro()} Manual de Usuario</strong>
        <button onclick="this.closest('.wizard-full-screen').remove()" class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem;">${Icons.cerrar()} Cerrar</button>
      </div>
      <iframe src="manual/index.html" style="flex:1; width:100%; border:none; background:#fff;"></iframe>`;
    document.body.appendChild(overlay);
  }
};

window.AjustesView = AjustesView;
