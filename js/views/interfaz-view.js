/**
 * Livestock Manager - InterfazView v1.0.0
 * Módulo dedicado exclusivamente a la configuración visual y de interfaz.
 */

const InterfazView = {
  async render() {
    if (window.App) App.updateHeaderColor('ajustes');
    const main = document.getElementById("app-content");
    const config = await this._loadConfig();

    main.innerHTML = `
      <div class="p-16">
        <div class="mb-20">
          <a href="#/ajustes" class="link-back">← Volver a Ajustes</a>
          <h2 class="mt-10 flex items-center gap-10 text-white font-900 uppercase">
            ${Icons.ajustes()} Preferencias de Interfaz
          </h2>
          <p class="text-gray text-sm">Personaliza la apariencia y el comportamiento visual de la plataforma.</p>
        </div>

        <!-- SECCIÓN: TEMA Y VISUALIZACIÓN -->
        <div class="card-registro mb-16" style="--registro-color: var(--c-purple);">
          <div class="section-header-theme mb-15">${Icons.foto()} Apariencia Base</div>
          <div class="grid gap-12">
            <label class="wizard-check-label">
              <input type="checkbox" ${config.temaOscuro !== false ? 'checked' : ''} onchange="InterfazView._toggleTema(this.checked)">
              <div class="flex flex-col">
                <span class="font-bold">MODO OSCURO (OLED)</span>
                <span class="text-[0.65rem] text-aaa">Optimizado para pantallas AMOLED y ahorro de batería.</span>
              </div>
            </label>

            <label class="wizard-check-label">
              <input type="checkbox" ${config.mostrarContextos !== false ? 'checked' : ''} onchange="InterfazView._toggleContextos(this.checked)">
               <div class="flex flex-col">
                <span class="font-bold">DESCRIPCIONES DE CONTEXTO</span>
                <span class="text-[0.65rem] text-aaa">Muestra textos de ayuda en las cabeceras de cada sección.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- SECCIÓN: RETROILUMINACIÓN (CORK STYLE) -->
        <div class="card-registro mb-16" style="--registro-color: var(--p-cork);">
          <div class="section-header-theme mb-15">${Icons.ajustes()} Iluminación Neón</div>
          <p class="text-xs text-gray mb-15 uppercase font-800 tracking-wider">Activa o desactiva los efectos de resplandor:</p>
          <div class="grid gap-10">
            <label class="wizard-check-label">
              <input type="checkbox" ${config.glowMarco !== false ? 'checked' : ''} onchange="InterfazView._toggleGlowMarco(this.checked)">
              <span>Marco principal (Bezel)</span>
            </label>
            <label class="wizard-check-label">
              <input type="checkbox" ${config.glowLaterales !== false ? 'checked' : ''} onchange="InterfazView._toggleGlowLaterales(this.checked)">
              <span>Haces de luz laterales</span>
            </label>
            <label class="wizard-check-label">
              <input type="checkbox" ${config.glowBotones !== false ? 'checked' : ''} onchange="InterfazView._toggleGlowBotones(this.checked)">
              <span>Resplandor en botones</span>
            </label>
          </div>

          <div class="mt-20">
            <button class="widget-link-btn widget-link-btn--neon neon-success w-full" onclick="AjustesView._abrirWizardRetroiluminacion()">
              ${Icons.ajustes()} Configuración Avanzada de Luz
            </button>
          </div>
        </div>

        <!-- SECCIÓN: FORMATO Y ACCESIBILIDAD -->
        <div class="card-registro mb-16" style="--registro-color: var(--c-info);">
          <div class="section-header-theme mb-15">${Icons.calendar()} Formatos de Sistema</div>
          <div class="grid grid-cols-1 gap-15">
            <div class="wizard-input-group">
              <label class="wizard-label">FORMATO DE FECHA</label>
              <select class="wizard-input" onchange="InterfazView._guardarPreferencia('formatoFecha', this.value)">
                <option value="es-ES" ${config.formatoFecha !== 'en-US' ? 'selected' : ''}>DD/MM/AAAA (Europa)</option>
                <option value="en-US" ${config.formatoFecha === 'en-US' ? 'selected' : ''}>MM/DD/AAAA (Internacional)</option>
              </select>
            </div>

            <div class="wizard-input-group">
              <label class="wizard-label">MONEDA PRINCIPAL</label>
              <select class="wizard-input" onchange="InterfazView._guardarPreferencia('moneda', this.value)">
                <option value="€" ${config.moneda !== '$' ? 'selected' : ''}>Euro (€)</option>
                <option value="$" ${config.moneda === '$' ? 'selected' : ''}>Dólar ($)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: COLORES DE ACENTO -->
        <div class="card-registro mb-30" style="--registro-color: var(--p-gold);">
          <div class="section-header-theme mb-15">${Icons.foto()} Color de Acento</div>
          <p class="text-xs text-gray mb-15">Cambia el color principal de la marca en toda la aplicación.</p>
          <div class="flex flex-wrap gap-10 justify-center theme-dots-container">
            ${[
              { id: 'gold',   label: 'Oro',   color: '#fbbf24' },
              { id: 'blue',   label: 'Azul',  color: '#3b82f6' },
              { id: 'green',  label: 'Verde', color: '#10b981' },
              { id: 'purple', label: 'Violeta', color: '#8b5cf6' },
              { id: 'red',    label: 'Rojo',  color: '#ef4444' },
            ].map(t => `
              <button class="theme-dot ${config.colorTema === t.id ? 'active' : ''}"
                style="background:${t.color};"
                onclick="InterfazView._cambiarColor('${t.id}')" title="${t.label}">
                ${config.colorTema === t.id ? '✓' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async _loadConfig() {
    return await AjustesView._loadConfig();
  },

  async _saveConfig(updates) {
    await AjustesView._saveConfig(updates);
  },

  async _toggleTema(checked) {
    await AjustesView._toggleTema(checked);
    this.render();
  },

  async _toggleContextos(checked) {
    await AjustesView._toggleContextos(checked);
    this.render();
  },

  async _toggleGlowMarco(checked) {
    await AjustesView._toggleGlowMarco(checked);
    this.render();
  },

  async _toggleGlowLaterales(checked) {
    await AjustesView._toggleGlowLaterales(checked);
    this.render();
  },

  async _toggleGlowBotones(checked) {
    await AjustesView._toggleGlowBotones(checked);
    this.render();
  },

  async _cambiarColor(tema) {
    await AjustesView._cambiarColor(tema);
    this.render();
  },

  async _guardarPreferencia(key, val) {
    await AjustesView._guardarPreferencia(key, val);
  }
};

window.InterfazView = InterfazView;
