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

    main.innerHTML = `
      <div class="card card-left-gold mb-25">
        <div class="flex justify-between items-center mb-15"><h3>Mis Fincas</h3><button class="btn btn-primary btn-sm" onclick="App._showFincaForm()">➕ Nueva</button></div>
        <div class="grid gap-10">${fincas.map((f) => `<div class="flex justify-between items-center rounded-sm" style="background:#222; padding:12px; border:1px solid ${f.id === activeId ? "var(--p-cork)" : "#333"};">
          <div><div class="font-bold" style="color:${f.id === activeId ? "var(--p-cork)" : "#fff"};">${f.nombre}</div><div class="text-gray" style="font-size:0.8rem;">REGA: ${f.codigo_REGA || "N/D"}</div></div>
          <div>${f.id !== activeId ? `<button onclick="AjustesView._cambiarFincaActiva(${f.id})" class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;">Activar</button>` : `<button onclick="App._editarFincaActiva()" class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem;">Editar ➔</button>`}</div>
        </div>`).join("")}</div>
      </div>
      <div class="card card-left-blue mb-20"><h3>💾 Copias de Seguridad</h3><div class="flex gap-10"><button class="btn btn-primary flex-1" onclick="App.exportBackup()" style="background:#1e3a8a;">⬇️ Exportar</button><button class="btn btn-secondary flex-1" onclick="document.getElementById('import-backup-file').click()">⬆️ Importar</button></div><input type="file" id="import-backup-file" style="display:none" onchange="App.importBackup(event)"></div>

      <!-- ===================== PAQUETE LÁCTEO ===================== -->
      <div class="card card-left-amber mb-20">
        <h3>🥛 Paquete Lácteo — Contratación</h3>
        <p class="text-gray mt-5 text-85">Gestión de contratos lácteos obligatorios (Real Decreto 752/2016) y declaraciones INFOLAC.</p>
        ${activeFinca ? `
        <div class="info-box mt-10">
          <div class="grid grid-cols-2 gap-6 text-82">
            <div><span class="text-gray">Nº Contrato:</span> <strong class="text-white">${activeFinca.contrato_lacteo_numero || '—'}</strong></div>
            <div><span class="text-gray">Vencimiento:</span> <strong class="text-white">${activeFinca.contrato_lacteo_fecha_fin || '—'}</strong></div>
            <div><span class="text-gray">Comprador:</span> <strong class="text-white">${activeFinca.contrato_lacteo_comprador || '—'}</strong></div>
            <div><span class="text-gray">INFOLAC:</span> <strong class="text-white">${activeFinca.numero_infolac || '—'}</strong></div>
          </div>
        </div>
        <div class="text-gray-500 mt-8 rounded-sm" style="font-size:0.72rem; padding:8px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.15);">
          📌 El contrato lácteo debe tener una duración mínima de 1 año. Las declaraciones INFOLAC son mensuales y obligatorias.
        </div>
        ` : '<p class="text-555">Activa una finca para ver los datos de contratación láctea.</p>'}
        <button class="btn btn-primary btn-full" onclick="App._editarFincaActiva()" style="background:#f59e0b;">✏️ Editar Contrato Lácteo</button>
      </div>

      <!-- ===================== ADSG ===================== -->
      <div class="card card-left-blue mb-20">
        <h3>⚕️ ADSG — Sanidad Ganadera</h3>
        <p class="text-gray mt-5 text-85">Agrupación de Defensa Sanitaria Ganadera. Datos del veterinario de explotación y códigos ADSG.</p>
        ${activeFinca ? `
        <div class="info-box mt-10">
          <div class="grid grid-cols-2 gap-6 text-82">
            <div><span class="text-gray">ADSG:</span> <strong class="text-white">${activeFinca.adsg_nombre || '—'}</strong></div>
            <div><span class="text-gray">Código ADSG:</span> <strong class="text-white">${activeFinca.adsg_codigo || '—'}</strong></div>
            <div><span class="text-gray">Veterinario:</span> <strong class="text-white">${activeFinca.adsg_veterinario || '—'}</strong></div>
            <div><span class="text-gray">Colegiado:</span> <strong class="text-white">${activeFinca.adsg_vet_colegiado || '—'}</strong></div>
            <div><span class="text-gray">Vencimiento ADSG:</span> <strong style="color:${activeFinca.adsg_fecha_vencimiento ? '#f59e0b' : '#888'};">${activeFinca.adsg_fecha_vencimiento || '—'}</strong></div>
          </div>
        </div>
        ` : '<p class="text-555">Activa una finca para gestionar los datos ADSG.</p>'}
        <button class="btn btn-primary btn-full" onclick="App._editarFincaActiva()" style="background:#3b82f6;">✏️ Editar ADSG</button>
      </div>

      <!-- ===================== CONFIGURACIÓN AUTONÓMICA ===================== -->
      <div class="card card-left-purple mb-20">
        <h3>🌍 Configuración Autonómica</h3>
        <p class="text-gray mt-5 text-85">Normativa autonómica activa, plataforma de movimiento y umbrales PAC.</p>
        ${activeFinca ? (() => {
          const ccaa = activeFinca.comunidad_autonoma;
          const plataforma = ccaa && window.ComunidadesService ? window.ComunidadesService.getPlataformaMovimiento(ccaa) : null;
          const umbral = ccaa && window.ComunidadesService ? window.ComunidadesService.getUmbralPAC(ccaa) : null;
          const dist = ccaa && window.ComunidadesService ? window.ComunidadesService.getDistanciaMinimaREGA(ccaa) : null;
          return `
          <div class="info-box mt-10">
            <div class="font-bold text-white mb-8">
              ${ccaa === 'andalucia' ? '🌿 Andalucía' : ccaa === 'extremadura' ? '🌿 Extremadura' : '⚠️ No configurada'}
            </div>
            ${ccaa ? `
            <div class="grid grid-cols-2 gap-6 text-82">
              <div><span class="text-gray">Sistema Mov.:</span> <strong class="text-white">${plataforma || '—'}</strong></div>
              <div><span class="text-gray">Dist. Mín. REGA:</span> <strong class="text-white">${dist || '—'} m</strong></div>
              <div><span class="text-gray">Umbral PAC:</span> <strong class="text-white">${umbral || '—'} cord/oveja/año</strong></div>
              <div><span class="text-gray">Explotación:</span> <strong class="text-white">${activeFinca.tipo_explotacion || '—'} / ${activeFinca.sistema_explotacion || '—'}</strong></div>
            </div>
            <div class="text-gray-500 mt-8 rounded-sm" style="font-size:0.72rem; padding:6px; background:rgba(139,92,246,0.08);">
              📌 ${ccaa === 'andalucia' ? 'Guías sanitarias automáticas (365d). Plataforma PIMA. Subvención ADSG directa.' : 'Guías requieren confirmación. Plataforma Arado/Laboreo. Control ADSG estricto.'}
            </div>` : '<p class="text-555">Configura la comunidad autónoma en la ficha de la finca para ver los detalles normativos.</p>'}
          </div>`; })() : '<p class="text-555">Activa una finca para ver la configuración autonómica.</p>'}
        <button class="btn btn-primary btn-full" onclick="App._editarFincaActiva()" style="background:#8b5cf6;">✏️ Editar Configuración</button>
        <button class="btn btn-secondary bg-card text-purple btn-full-sm" onclick="App._mostrarGuiaNormativas()" style="border:1px solid #8b5cf6;">📖 Ver Comparativa Normativa CCAA</button>
      </div>

      <div class="card card-left-green mb-20">
        <h3>🏷️ Gestión de Trazabilidad</h3>
        <p class="text-gray mt-5 text-85">Genera e imprime solicitudes oficiales de remesas de crotales para tu ADSG o Administración.</p>
        <button class="btn btn-primary btn-full" onclick="App._abrirWizardPedidoCrotales()" style="background:#10b981;">📄 Generar Pedido de Crotales</button>
        <button class="btn btn-secondary bg-card text-green btn-full-sm" onclick="App._mostrarAyudaCrotales()" style="border:1px solid #10b981;">📖 Normativa de Identificación (Crotales)</button>
      </div>

      <div class="card card-left-red mb-20">
        <h3>⚕️ Guía Farmacológica</h3>
        <p class="text-gray mt-5 text-85">Consulta la tabla de tiempos de retiro, supresión y guía matemática de dosificación para evitar residuos.</p>
        <button class="btn btn-primary btn-full" onclick="App._mostrarAyudaMedicamentos()" style="background:#ef4444;">📚 Ver Tiempos de Retiro y Dosis</button>
      </div>

      <div class="card card-left-gold mb-20">
        <h3>📖 Manual de Usuario</h3>
        <p class="text-gray mt-5 text-85">Guía paso a paso del uso de la aplicación, con capturas de cada módulo.</p>
        <button class="btn btn-primary btn-full" onclick="AjustesView._abrirManual()" style="background:#c9851f;">📖 Abrir Manual de Usuario</button>
      </div>

      <div class="text-center p-40" style="background:#050505; border-radius:32px; border:1px solid #111; margin-top:30px;">
        <!-- Logo de la aplicación -->
        <img src="icons/Logo aplicación.png" alt="Livestock Manager Premium" style="max-width:220px; height:auto; margin:0 auto 20px; display:block;">

        <!-- Desarrollador -->
        <div class="text-gold font-800 text-85" style="margin:5px 0;">Desarrollado por</div>
        <div class="text-white font-bold text-xl">David Asuar Arteaga</div>

        <!-- Descripción -->
        <div style="max-width:320px; margin:20px auto; font-size:0.9rem; line-height:1.6;" class="text-777">
          Plataforma profesional de gestión ganadera inteligente y trazabilidad industrial.
        </div>

        <!-- Contacto -->
        <div class="mt-15"><a href="mailto:soporte.sdogfarm@gmail.com" class="text-gold font-bold no-underline text-md">📩 soporte.sdogfarm@gmail.com</a></div>

        <!-- Repositorio GitHub -->
        <div class="mt-12"><a href="https://github.com/SADOCKDOG/LIVESTOCK-MANAGER" target="_blank" rel="noopener noreferrer" class="text-gold font-bold no-underline text-md" style="display:inline-flex; align-items:center; gap:6px;">🐙 github.com/SADOCKDOG/LIVESTOCK-MANAGER</a></div>

        <!-- Licencia y Copyright -->
        <div class="mt-40 text-75 text-444" style="border-top:1px solid #111; padding-top:25px;">
          © 2026 Livestock Manager Premium · v4.4.0<br>
          Todos los derechos reservados.<br>
          Licencia: Uso privado — Prohibida la redistribución sin autorización expresa del desarrollador.
        </div>
      </div>`;
  },
  async _cambiarFincaActiva(id) {
    await Fincas.setActiveId(id);
    App.toast("Finca activa cambiada");
    App.renderAjustes();
  },
  _abrirManual() {
    const overlay = document.createElement('div');
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7000; background:#fff; display:flex; flex-direction:column;';
    overlay.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#1a1a1a; color:#fff;">
        <strong style="color:#e0a83a;">📖 Manual de Usuario</strong>
        <button onclick="this.closest('.wizard-full-screen').remove()" style="background:#c9851f; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-weight:700;">✕ Cerrar</button>
      </div>
      <iframe src="manual/index.html" style="flex:1; width:100%; border:none; background:#fff;"></iframe>`;
    document.body.appendChild(overlay);
  }
};

window.AjustesView = AjustesView;
