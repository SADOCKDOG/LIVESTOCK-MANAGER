/**
 * Livestock Manager - GanaderiaView v2.0.0
 * Consola Unificada de Ganadería (GeGan) con barra multipestaña horizontal scrollable
 * Integra: Animales, Rebaños, Sanidad/Veterinaria, Control Lácteo, Control Cárnico y Consola Híbrida
 */
const GanaderiaView = {
  _activeSubModule: 'animales', // 'animales', 'rebanos', 'sanidad', 'carne', 'leche', 'hibrido'
  _cache: null,
  _filtroSanidad: '',

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
        await this._renderSanidadView();
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

  _fmtFecha(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    } catch (e) { return '-'; }
  },

  /**
   * Renderizado interactivo premium del sub-módulo de Sanidad/Veterinaria
   */
  async _renderSanidadView() {
    const container = document.getElementById('ganaderia-tab-content');
    if (!container) return;

    // Cargar tratamientos sanitarios
    const tratamientos = await Sanitarios.list().catch(() => []);
    const hoy = new Date();

    // 1. Detectar tratamientos activos en periodo de supresión (leche o carne)
    const supresionesActivas = [];
    tratamientos.forEach(t => {
      const fechaApli = new Date(t.fecha);
      const diasEsperaCarne = parseInt(t.tiempo_espera_carne_dias) || 0;
      const diasEsperaLeche = parseInt(t.tiempo_espera_leche_dias) || 0;

      if (diasEsperaCarne > 0) {
        const fechaFinCarne = new Date(fechaApli.getTime() + (diasEsperaCarne * 24 * 60 * 60 * 1000));
        if (fechaFinCarne > hoy) {
          const diasRestantes = Math.ceil((fechaFinCarne - hoy) / (24 * 60 * 60 * 1000));
          supresionesActivas.push({ ...t, tipoSupresion: 'carne', diasRestantes, fechaFin: fechaFinCarne });
        }
      }
      // La supresión láctea puede ser por días de espera o por prohibición indefinida
      // (medicamentos prohibidos en producción lechera). Contemplar ambos casos.
      if (diasEsperaLeche > 0 || t.prohibidoLeche) {
        const fechaFinLeche = t.prohibidoLeche ? null : new Date(fechaApli.getTime() + (diasEsperaLeche * 24 * 60 * 60 * 1000));
        if (t.prohibidoLeche || fechaFinLeche > hoy) {
          const diasRestantes = t.prohibidoLeche ? 'INDEFINIDO' : Math.ceil((fechaFinLeche - hoy) / (24 * 60 * 60 * 1000));
          supresionesActivas.push({ ...t, tipoSupresion: 'leche', diasRestantes, fechaFin: fechaFinLeche, indefinido: !!t.prohibidoLeche });
        }
      }
    });

    // Filtro por texto
    const filtro = this._filtroSanidad.trim().toLowerCase();
    const tratamientosFiltrados = tratamientos.filter(t => {
      const medicamento = (t.medicamento || '').toLowerCase();
      const tipo = (t.tipo_tratamiento || '').toLowerCase();
      const crotal = (t.snap_identificacion || t.animalId || '').toString().toLowerCase();
      const veterinario = (t.veterinario_prescriptor || '').toLowerCase();
      return medicamento.includes(filtro) || tipo.includes(filtro) || crotal.includes(filtro) || veterinario.includes(filtro);
    });

    // Se genera el HTML del panel de sanidad
    let supresionesHtml = '';
    if (supresionesActivas.length > 0) {
      supresionesHtml = `
        <div class="mb-14 px-4">
          <div class="inf-section-title mb-8 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-danger">
            <span style="color: var(--c-danger); margin-right: 4px;">|</span> ALERTA: PERIODOS DE SUPRESIÓN DE SEGURIDAD (SIGGAN)
          </div>
          <div class="grid gap-10">
            ${supresionesActivas.map(s => {
              const isCarne = s.tipoSupresion === 'carne';
              const textGoldClass = 'style="color: var(--p-gold); font-weight: 950;"';
              return `
                <div class="card p-12 border-222 animate-pulse" style="background: linear-gradient(135deg, rgba(30,10,10,0.8), rgba(15,5,5,0.9)); border-left: 4px solid var(--c-danger); box-shadow: 0 4px 20px rgba(255,68,68,0.15);">
                  <div class="flex justify-between items-start gap-10">
                    <div>
                      <div class="text-[0.62rem] text-gray uppercase font-900 tracking-wider">Tratamiento Veterinario Activo</div>
                      <div class="text-sm font-black text-white uppercase tracking-wide mt-2">${s.medicamento || s.tipo_tratamiento}</div>
                      <div class="text-[0.68rem] text-gray-400 mt-4 flex items-center gap-6 font-bold uppercase">
                        <span>Animal: <strong ${textGoldClass}>${s.snap_identificacion || s.animalId || 'Lote/Rebaño'}</strong></span>
                        <span>·</span>
                        <span>Aplicado: ${this._fmtFecha(s.fecha)}</span>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div class="badge badge-sm uppercase" style="background: rgba(255, 68, 68, 0.15); color: var(--c-danger); font-weight: 900; letter-spacing: 0.5px; border: 1px solid rgba(255, 68, 68, 0.3); box-shadow: 0 0 10px rgba(255, 68, 68, 0.2);">
                        SUPRESIÓN ${isCarne ? 'CARNE' : 'LECHE'}
                      </div>
                      <div class="text-md font-950 text-danger mt-4" style="text-shadow: 0 0 8px rgba(255,68,68,0.5);">${s.indefinido ? 'PROHIBIDO' : `${s.diasRestantes} <span class="text-[0.6rem] text-gray-500 font-bold uppercase">DÍAS REST.</span>`}</div>
                    </div>
                  </div>
                  <div class="text-[0.55rem] text-gray-500 font-extrabold uppercase mt-8 border-top-222 pt-8">
                    ADVERTENCIA: Prohibido el envío al matadero o comercialización de leche de este animal ${s.indefinido ? 'de forma permanente (medicamento prohibido en producción lechera).' : `hasta el vencimiento del periodo de espera (${this._fmtFecha(s.fechaFin)}).`}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Alertas de Supresión Activas -->
      ${supresionesHtml}

      <!-- Panel de Historial de Tratamientos -->
      <div class="px-4">
        <!-- Card de Resumen de Historial -->
        <div class="card p-12 mb-14 border-222 card-total-3d card-resumen" style="background: rgba(255,255,255,0.02);">
          <div class="text-xs text-white font-black uppercase tracking-wider mb-6 flex items-center justify-between gap-6">
            <span class="flex items-center gap-6" style="color: var(--c-purple)">${Icons.sanidad()} BALANCE SANITARIO</span>
            <button class="resumen-toggle" onclick="App.toggleResumen(this)">${Icons.chevronAbajo()}</button>
          </div>
          <div class="resumen-body flex flex-col">
            <div class="py-10 flex justify-between items-center border-bottom-222">
              <span class="text-[0.65rem] text-gray uppercase font-900">Total Tratamientos</span>
              <strong class="text-lg font-950">${tratamientos.length}</strong>
            </div>
            <div class="py-10 flex justify-between items-center">
              <span class="text-[0.65rem] text-gray uppercase font-900">Tratamientos en Supresión</span>
              <strong class="text-lg font-950" style="color:${supresionesActivas.length > 0 ? 'var(--c-danger)' : 'var(--c-success)'};">${supresionesActivas.length}</strong>
            </div>
          </div>
        </div>

        <!-- Filtro integrado del historial -->
        <div class="flex items-center gap-8 mb-14">
          <div class="search-input-wrapper flex-1" style="position: relative;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #555;">${Icons.buscar()}</span>
            <input type="text" id="sanidad-filtro-buscar" value="${this._filtroSanidad}" oninput="GanaderiaView._buscarSanidad(this.value)" placeholder="Buscar medicamento, tipo, crotal o veterinario..." class="w-100" style="padding-left: 36px; background: rgba(255,255,255,0.03); border: 1px solid #27272a; border-radius: 8px; color: white; min-height: 40px; box-sizing: border-box;">
          </div>
        </div>

        <div class="inf-section-title mb-10 flex items-center gap-8 uppercase font-900 tracking-wider text-[0.7rem] text-gray">
          <span style="color: var(--c-purple); margin-right: 4px;">|</span> ${Icons.documento()} HISTORIAL CLÍNICO VETERINARIO
        </div>

        <div class="grid gap-10">
          ${tratamientosFiltrados.length > 0 ? tratamientosFiltrados.slice(0, 30).map(t => {
            const hasSupresion = (parseInt(t.tiempo_espera_carne_dias) || 0) > 0 || (parseInt(t.tiempo_espera_leche_dias) || 0) > 0;
            return App._cardRegistro({
              icon: Icons.sanidad(),
              title: t.medicamento || t.tipo_tratamiento,
              subtitle: `Crotal: <strong style="color: var(--p-gold); font-weight: 950;">${t.snap_identificacion || t.animalId || 'Rebaño'}</strong>`,
              metadata: `<span>${this._fmtFecha(t.fecha)}</span><span>·</span><span>${t.tipo_tratamiento}</span>`,
              badge: hasSupresion ? 'Espera Activa' : 'Sin supresión',
              color: hasSupresion ? 'var(--c-danger)' : 'var(--c-purple)',
              onClick: `GanaderiaView._abrirOpcionesTratamiento(${t.id})`
            });
          }).join('') : `
            <div class="p-20 text-center rounded border border-222" style="background: rgba(255,255,255,0.015);">
              <span class="text-555 text-xs uppercase font-800 tracking-wider">No se encontraron tratamientos</span>
            </div>
          `}
        </div>
      </div>

      <!-- Botón Flotante de Acción para aplicar tratamiento veterinario -->
      <div class="fab-container" style="--fab-neon-color: var(--c-purple);" onclick="window.WizardTratamiento ? window.WizardTratamiento.registrar(null) : App.toastError('Módulo de tratamiento no disponible')">
        <span class="fab-label">Aplicar Tratamiento</span>
        <button class="fab-btn">${Icons.fabPlus()}</button>
      </div>`;
  },

  _buscarSanidad(value) {
    this._filtroSanidad = value;
    // Evitar parpadeos completos del tab; re-renderizamos sólo el contenido de sanidad
    const listado = document.getElementById('ganaderia-tab-content');
    if (listado) {
      this._renderSanidadView();
    }
  },

  async _abrirOpcionesTratamiento(id) {
    if (window.SanitariosView && typeof window.SanitariosView._abrirOpcionesRegistro === 'function') {
      await window.SanitariosView._abrirOpcionesRegistro(id);
    } else {
      App?.toast(`Visualizando tratamiento veterinario #${id}`);
    }
  }
};

window.GanaderiaView = GanaderiaView;
