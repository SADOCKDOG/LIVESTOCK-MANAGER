/**
 * Livestock Manager - GanaderiaView v2.0.0
 * Consola Unificada de Ganadería (GeGan) con barra multipestaña horizontal scrollable
 * Integra: Animales, Rebaños, Sanidad/Veterinaria, Control Lácteo, Control Cárnico y Consola Híbrida
 */
const GanaderiaView = {
  _activeSubModule: 'animales', // 'animales', 'rebanos', 'sanidad', 'carne', 'leche', 'hibrido'
  _cache: null,

  async render() {
    const main = document.getElementById('app-content');
    const fincaId = await Fincas.getActiveId();
    if (!fincaId) {
      main.innerHTML = `
        <div class="p-20 text-center animate-fade-in">
          <p class="text-gray uppercase font-900 tracking-wider">No hay ninguna finca seleccionada.</p>
        </div>`;
      return;
    }

    // Mapeo de colores y metadatos por sub-módulo para sincronizar el header
    const moduloMeta = {
      animales: { color: 'var(--c-orange)', icon: Icons.animales(), title: 'Censo de Animales', desc: 'Control de crotales, altas, bajas e inventario' },
      rebanos: { color: 'var(--c-info)', icon: Icons.rebanos(), title: 'Lotes y Rebaños', desc: 'Agrupamiento de ganado y asignación de lotes' },
      sanidad: { color: 'var(--c-purple)', icon: Icons.sanidad(), title: 'Sanidad & Tratamientos', desc: 'Libro de tratamientos, vacunas y periodos de supresión' },
      carne: { color: 'var(--c-danger)', icon: Icons.carne(), title: 'Control Cárnico', desc: 'Pesajes, ganancia media diaria y rendimiento canal' },
      leche: { color: 'var(--c-info)', icon: Icons.leche(), title: 'Control Lácteo', desc: 'Ordeños diarios, calidades y entregas a compradores' },
      hibrido: { color: 'var(--c-success)', icon: Icons.rotacion(), title: 'Consola Híbrida', desc: 'Sistemas de doble aptitud y rotación de pastizales' }
    };

    const currentMeta = moduloMeta[this._activeSubModule] || moduloMeta.animales;

    // Sincronizar color de cabecera con el sub-módulo activo
    if (window.App && App.updateHeaderColor) {
      App.updateHeaderColor(this._activeSubModule === 'animales' ? 'animales' : (this._activeSubModule === 'rebanos' ? 'rebanos' : this._activeSubModule));
    }

    main.innerHTML = `
      <!-- Cabecera Maestra de Ganadería Consolidada -->
      <div class="flex items-center gap-12 mb-14 px-4 animate-fade-in">
        <span class="text-2xl" style="color:${currentMeta.color}; display:inline-flex; align-items:center;">${currentMeta.icon}</span>
        <div>
          <h1 class="text-white font-900 text-lg uppercase tracking-wider" style="margin:0; line-height:1.2;">
            <span style="color:${currentMeta.color}; margin-right:4px;">|</span> ${currentMeta.title}
          </h1>
          <div class="text-gray" style="font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
            ${currentMeta.desc}
          </div>
        </div>
      </div>

      <!-- Barra de Navegación Multipestaña Horizontal Ganadería (Scrollable) Premium con Indicadores Animados -->
      <div class="pestanas-premium-wrapper mb-14" style="--mode-color: ${currentMeta.color};">
        <div class="pestana-indicador-flecha pestana-flecha-izq" style="opacity: 0; pointer-events: none;" onclick="this.parentElement.querySelector('.pestanas-premium-container').scrollBy({ left: -100, behavior: 'smooth' })">
          ${Icons.atras()}
        </div>
        <div class="pestanas-premium-container" onscroll="App.evaluarScrollPestanas(this)">
          <div class="pestanas-premium-switch" role="tablist" aria-label="Secciones de Ganadería">
            <button class="pestanas-premium-btn ${this._activeSubModule === 'animales' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'animales'}" style="--mode-color:var(--c-orange);" onclick="GanaderiaView._cambiarSubModulo('animales')">${Icons.animales()} ANIMALES</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'rebanos' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'rebanos'}" style="--mode-color:var(--c-info);" onclick="GanaderiaView._cambiarSubModulo('rebanos')">${Icons.rebanos()} REBAÑOS</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'sanidad' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'sanidad'}" style="--mode-color:var(--c-purple);" onclick="GanaderiaView._cambiarSubModulo('sanidad')">${Icons.sanidad()} SANIDAD</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'carne' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'carne'}" style="--mode-color:var(--c-danger);" onclick="GanaderiaView._cambiarSubModulo('carne')">${Icons.carne()} CARNE</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'leche' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'leche'}" style="--mode-color:var(--c-info);" onclick="GanaderiaView._cambiarSubModulo('leche')">${Icons.leche()} LECHE</button>
            <button class="pestanas-premium-btn ${this._activeSubModule === 'hibrido' ? 'active' : ''}" role="tab" aria-selected="${this._activeSubModule === 'hibrido'}" style="--mode-color:var(--c-success);" onclick="GanaderiaView._cambiarSubModulo('hibrido')">${Icons.rotacion()} HÍBRIDO</button>
          </div>
        </div>
        <div class="pestana-indicador-flecha pestana-flecha-der" style="opacity: 0; pointer-events: none;" onclick="this.parentElement.querySelector('.pestanas-premium-container').scrollBy({ left: 100, behavior: 'smooth' })">
          ${Icons.siguiente()}
        </div>
      </div>
      
      <!-- Contenedor Dinámico para la pestaña activa -->
      <div id="ganaderia-tab-content" class="animate-fade-in"></div>`;

    // Delegación dinámica de renderizado
    switch (this._activeSubModule) {
      case 'animales':
        if (window.AnimalesView) await AnimalesView.render();
        break;
      case 'rebanos':
        if (window.RebanosView) await RebanosView.render();
        break;
      case 'sanidad':
        if (window.SanidadView) await SanidadView.render(document.getElementById('ganaderia-tab-content'));
        break;
      case 'carne':
        if (window.CarneView) await CarneView.render();
        break;
      case 'leche':
        if (window.LecheView) await LecheView.render();
        break;
      case 'hibrido':
        if (window.HibridoView) await HibridoView.render();
        break;
    }

    // Inicializar scroll dinámico para la barra de pestañas
    const containerPestanas = document.querySelector('.pestanas-premium-container');
    if (containerPestanas && window.App?.inicializarScrollPestanas) {
      window.App.inicializarScrollPestanas(containerPestanas);
    }
  },

  _cambiarSubModulo(subModulo) {
    this._activeSubModule = subModulo;
    this.render();
  },

};

window.GanaderiaView = GanaderiaView;
