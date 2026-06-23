/**
 * Livestock Manager - Application Controller v4.0.0
 * UI validada v3.3.9 + flujo Industrial Animals v4.0.0 integrado correctamente
 * Fix: rebanoId preservado en _guardarAnimalDetalle (bug invisible en lista)
 */

const App = {
  _animalGuardado: false,
  _pesadaBatch: null,
  routes: {
    "/": "renderDashboard",
    "/ganaderia": "renderGanaderia",
    "/rebanos": "renderRebanos",
    "/rebano": "renderDetalleRebano",
    "/carne": "renderCarne",
    "/hibrido": "renderHibrido",
    "/zonas": "renderZonas",
    "/zona": "renderDetalleZona",
    "/animales": "renderAnimales",
    "/animal": "renderDetalleAnimal",
    "/leche": "renderLeche",
    "/explotacion": "renderExplotacion",
    "/gastos": "renderGastos",
    "/comercializacion": "renderComercializacion",
    "/albaran-leche": "renderDetalleLeche",
    "/venta-carne": "renderDetalleVentaCarne",
    "/gasto": "renderDetalleGasto",
    "/informes": "renderInformes",
    "/ajustes": "renderAjustes",
    "/compradores": "renderCompradores",
    "/comprador": "renderComprador",
    "/proveedores": "renderProveedores",
    "/proveedor": "renderProveedor",
    "/contrato": "renderContrato",
    "/transportistas": "renderTransportistas",
    "/trazabilidad": "renderTrazabilidad",
    "/cuaderno": "renderCuadernoDigital",
    "/documentos": "renderDocumentos",
    "/manuales": "renderManuales",
  },

  async init() {
    try {
      console.log("App Livestock: Iniciando v4.0.0...");
      this._injectGlobalStyles();
      window.addEventListener("hashchange", () => App.route());
      await window.dbPromise;

      // Inicializar servicios del sistema
      if (window.CacheService) window.CacheService.init();

      // Escuchar eventos para refresco automático del dashboard
      if (window.EventBus) {
        const eventosRefresh = [
          'tratamiento:added', 'tratamiento:deleted',
          'animal:created', 'animal:updated', 'animal:deleted',
          'venta:created', 'venta:deleted',
          'gasto:created',
          'leche:entrega',
          'pesaje:registrado',
          'reproduccion:evento',
          'comprador:created', 'comprador:deleted',
          'proveedor:created',
          'contrato:created',
          'dashboard:refresh',
        ];
        eventosRefresh.forEach(event => {
          window.EventBus.on(event, () => {
            // Si el wizard de pesajes está activo, no refrescar para evitar condiciones de carrera
            if (window._pesajesWizardActivo && event === 'pesaje:registrado') return;
            const hash = window.location.hash.slice(1) || '/';
            if (hash === '/' || hash === '') {
              App.renderDashboard();
            } else if (hash.startsWith('/ganaderia')) {
              App.renderGanaderia();
            } else if (hash.startsWith('/carne')) {
              App.renderCarne();
            } else if (hash.startsWith('/hibrido')) {
              App.renderHibrido();
            } else if (hash.startsWith('/leche')) {
              App.renderLeche();
            } else if (hash.startsWith('/gastos')) {
              App.renderGastos();
            } else if (hash.startsWith('/animales')) {
              App.renderAnimales();
            }
          });
        });
      }

      const fincas = await Fincas.list();
      if (fincas.length === 0 || !(await Fincas.getActiveId())) {
        await AsistenteConfiguracion.mostrarAsistente();
        return;
      }

      await App.updateHeader();
      App._setupHeaderBackButton();
      App._setupHardwareBackButton();
      await App._ejecutarMigracionesFondo();
      App._initScrollShadows();
      await App.route();
    } catch (error) {
      console.error(error);
      document.getElementById(
        "app-content"
      ).innerHTML = `<div class="card error-card"><h2>Error</h2><p>${error.message}</p></div>`;
    }
  },

  _injectGlobalStyles() {
    const pStyles = document.createElement("style");
    pStyles.id = "app-production-styles";
    pStyles.textContent = "#produccion-content .report-section{max-width:100%;overflow:hidden;}";
    document.head.appendChild(pStyles);
  },

  /** Inicializa sombras de scroll automáticas en contenedores .scroll-shadow-container */
  _initScrollShadows() {
    if (typeof window.enableScrollShadows !== 'function') return;
    const initEl = (el) => {
      if (el.hasAttribute('data-ss-init')) return;
      window.enableScrollShadows(el);
      el.setAttribute('data-ss-init', '');
    };
    // Inicializar los existentes
    document.querySelectorAll('.scroll-shadow-container').forEach(initEl);
    // Observar nuevos elementos que se añadan al DOM dinámicamente
    const obs = new MutationObserver(() => {
      document.querySelectorAll('.scroll-shadow-container:not([data-ss-init])').forEach(initEl);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  async updateHeader() {
    const finca = await Fincas.getActive();
    const headerEl = document.getElementById("nombre-finca-header");
    if (headerEl && finca) {
      headerEl.innerHTML = finca.nombre;
      headerEl.onclick = () => (location.hash = "/ajustes");
      headerEl.style.cursor = "pointer";
    }
  },

  /**
   * Header contextual: título de vista + botón de volver según la ruta actual.
   */
  _headerTitles: {
    '/': '',
    '/ganaderia': 'Ganadería',
    '/rebanos': 'Rebaños',
    '/rebano': 'Ficha Rebaño',
    '/carne': 'Gestión Carne',
    '/hibrido': 'Consola Híbrida',
    '/explotacion': 'ExPro',
    '/zonas': 'Zonas',
    '/zona': 'Ficha Zona',
    '/animales': 'Animales',
    '/animal': 'Ficha Animal',
    '/leche': 'Control Lechero',
    '/gastos': 'Gastos',
    '/comercializacion': 'Comercialización',
    '/albaran-leche': 'Albarán Lácteo',
    '/gasto': 'Detalle Gasto',
    '/informes': 'Informes',
    '/ajustes': 'Ajustes',
    '/compradores': 'Compradores',
    '/comprador': 'Ficha Comprador',
    '/proveedores': 'Proveedores',
    '/proveedor': 'Ficha Proveedor',
    '/contrato': 'Contrato',
    '/transportistas': 'Transportistas',
    '/trazabilidad': 'Trazabilidad 360°',
    '/cuaderno': 'Cuaderno Digital',
    '/documentos': 'Documentos Legales',
    '/manuales': 'Manuales',
  },

  /** Rutas que muestran botón de volver (detalles, fichas) */
  _routesConVolver: new Set([
    '/rebano', '/zona', '/animal', '/animales',
    '/albaran-leche', '/gasto', '/comprador',
    '/proveedor', '/contrato', '/trazabilidad',
  ]),

  _setupHeaderBackButton() {
    const backBtn = document.getElementById('header-back-btn');
    if (!backBtn || backBtn._wired) return;
    backBtn._wired = true;
    backBtn.addEventListener('click', () => {
      // Si hay historial de navegación en la app, volver; si no, ir al dashboard
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#/';
      }
    });
  },

  /**
   * Maneja el botón de retroceso hardware de Android (Capacitor).
   * - Si hay un wizard/overlay abierto → lo cierra.
   * - Si es una ficha/detalle → navega atrás (history.back).
   * - Si es el Dashboard principal → pregunta si desea salir.
   * - Cualquier otra ruta → vuelve al Dashboard.
   */
  _setupHardwareBackButton() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
    const AppPlugin = window.Capacitor.Plugins?.App;
    if (!AppPlugin) return;

    AppPlugin.addListener('backButton', () => {
      // 1. Cerrar wizard/overlay si hay alguno abierto
      const wizard = document.querySelector('.wizard-full-screen');
      if (wizard) { wizard.remove(); return; }

      // 2. Obtener ruta actual del hash
      const hash = window.location.hash.slice(1) || '/';

      // 3. Si es el Dashboard principal → preguntar si desea salir
      if (hash === '/') {
        const doExit = () => { if (AppPlugin.exitApp) AppPlugin.exitApp(); };
        const Dialog = window.Capacitor.Plugins?.Dialog;
        if (Dialog?.confirm) {
          Dialog.confirm({ title: 'Salir', message: '¿Deseas salir de la aplicación?' })
            .then(r => { if (r.value) doExit(); });
        } else {
          if (confirm('¿Deseas salir de la aplicación?')) doExit();
        }
        return;
      }

      // 4. Cualquier otra ruta → retroceder en el historial
      //    Si no hay historial, volver al Dashboard
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#/';
      }
    });
  },

  _updateHeaderContext(path) {
    const title = this._headerTitles[path] ?? '';
    const titleEl = document.getElementById('header-view-title');
    const backBtn = document.getElementById('header-back-btn');
    if (titleEl) titleEl.textContent = title;
    if (backBtn) {
      if (this._routesConVolver.has(path)) {
        backBtn.classList.add('visible');
      } else {
        backBtn.classList.remove('visible');
      }
    }
  },

  /**
   * Abre/cierra el bottom sheet "Más" de navegación
   */
  _toggleMenuNavegacion() {
    const sheet = document.getElementById("nav-more-sheet");
    if (!sheet) return;
    sheet.classList.toggle("open");
  },

  async _onCompradorChangeWizard(selectEl) {
    const val = parseInt(selectEl.value);
    if (!val) {
      const infoEl = document.getElementById('w-v-comprador-info');
      if (infoEl) infoEl.style.display = 'none';
      return;
    }
    try {
      const c = await Compradores.get(val);
      if (!c) return;
      const infoEl = document.getElementById('w-v-comprador-info');
      if (infoEl) infoEl.style.display = 'block';
      const nombreEl = document.getElementById('w-v-comprador-nombre');
      if (nombreEl) nombreEl.innerHTML = '<strong>' + c.nombre + '</strong>';
      const nifEl = document.getElementById('w-v-comprador-nif');
      if (nifEl) nifEl.textContent = 'NIF: ' + (c.nif_cif || '');
      const nifInput = document.getElementById('w-v-nif');
      if (nifInput) nifInput.value = c.nif_cif || '';
      const rsInput = document.getElementById('w-v-rs');
      if (rsInput) rsInput.value = c.nombre || '';
      const contrato = await Contratos.getActivo(val, 'carne');
      const contratoEl = document.getElementById('w-v-comprador-contrato');
      const ivaInput = document.getElementById('w-v-iva');
      const retInput = document.getElementById('w-v-ret');
      if (contrato) {
        if (contratoEl) contratoEl.textContent = '📄 Contrato: ' + contrato.numero_contrato + ' (IVA: ' + contrato.iva_pct + '%, Ret.: ' + contrato.retencion_pct + '%)';
        if (ivaInput) ivaInput.value = contrato.iva_pct;
        if (retInput) retInput.value = contrato.retencion_pct;
      } else {
        if (contratoEl) contratoEl.textContent = '⚠️ Sin contrato activo';
      }
    } catch(e) {
      console.warn(e);
    }
  },

  async _abrirAltaCompradorRapida() {
    if (!window.CompradoresView || typeof CompradoresView.renderFormulario !== 'function') {
      App.toastError('Módulo de compradores no disponible');
      return;
    }
    // Ocultar overlay del wizard para que se vea el formulario de comprador
    const overlay = document.getElementById('wizard-venta-masiva');
    if (overlay) {
      overlay.style.display = 'none';
    }
    window._volverAWizardVenta = true;
    await CompradoresView.renderFormulario();
  },

  async _onTransportistaChangeWizard(selectEl) {
    const val = parseInt(selectEl.value);
    if (!val) {
      const infoEl = document.getElementById('w-v-transportista-info');
      if (infoEl) infoEl.style.display = 'none';
      return;
    }
    try {
      const t = await Transportistas.get(val);
      if (!t) return;
      App._showTransportistaInfo({ transportistaId: val, nombreTransportista: t.nombre, nifTransportista: t.nif_cif, matriculaTransportista: t.matricula });
    } catch(e) {
      console.warn(e);
    }
  },

  _showTransportistaInfo(data) {
    const infoEl = document.getElementById('w-v-transportista-info');
    if (!infoEl) return;
    if (!data.transportistaId) {
      infoEl.style.display = 'none';
      return;
    }
    infoEl.style.display = 'block';
    const nombreEl = document.getElementById('w-v-transportista-nombre');
    if (nombreEl) nombreEl.innerHTML = '<strong>' + (data.nombreTransportista || '') + '</strong>';
    const nifEl = document.getElementById('w-v-transportista-nif');
    if (nifEl) nifEl.textContent = 'NIF: ' + (data.nifTransportista || '');
    const matEl = document.getElementById('w-v-transportista-matricula');
    if (matEl) matEl.textContent = '🚚 ' + (data.matriculaTransportista || '');
  },

  async updateNavigationMenu() {
    try {
      const fincaId = await Fincas.getActiveId();
      if (!fincaId) return;

      const rebanos = await window.db.getAllFromIndex('rebanos', 'fincaId', fincaId).catch(() => []);

      let tieneCarne = false;
      let tieneLeche = false;
      let tieneHibrido = false;

      rebanos.forEach(r => {
        const tipo = (r.tipo || '').toLowerCase();
        if (tipo.includes('carne') || tipo.includes('cárn')) tieneCarne = true;
        else if (tipo.includes('leche') || tipo.includes('láct')) tieneLeche = true;
        else if (tipo.includes('mixt') || tipo.includes('híbr') || tipo.includes('doble')) tieneHibrido = true;
      });

      let modo = 'carne'; // Default
      if (tieneHibrido || (tieneCarne && tieneLeche)) {
        modo = 'hibrido';
      } else if (tieneLeche) {
        modo = 'leche';
      } else if (tieneCarne) {
        modo = 'carne';
      }

      // Limpiar Barra Inferior: Ocultar Animales y Rebaños para simplificar la interfaz a 3 botones principales
      const navAnimales = document.getElementById('nav-animales');
      if (navAnimales) navAnimales.style.display = 'none';
      const navRebanos = document.getElementById('nav-rebanos');
      if (navRebanos) navRebanos.style.display = 'none';

      const navProduccion = document.getElementById('nav-produccion');
      if (navProduccion) {
        const labelEl = navProduccion.querySelector('.label');
        const svgEl = navProduccion.querySelector('svg');
        if (labelEl) labelEl.textContent = 'Ganadería';
        navProduccion.setAttribute('href', '#/ganaderia');
        if (svgEl) {
          svgEl.innerHTML = `
            <path d="M4 20h16"></path>
            <path d="M6 20V8l6-4 6 4v12"></path>
            <path d="M9 12h6"></path>
          `;
        }
      }

      // Visibilidad en el Bottom Sheet (#nav-more-sheet)
      const sheetItems = document.querySelectorAll('#nav-more-sheet .more-sheet-item');
      sheetItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === '#/leche') {
          // Ocultar si ya está como botón principal o si es solo carne o si es hibrido (ya que leche está dentro de hibrido)
          if (modo === 'leche' || modo === 'carne' || modo === 'hibrido') {
            item.style.display = 'none';
          } else {
            item.style.display = 'flex';
          }
        } else if (href === '#/zonas' || href === '#/comercializacion' || href === '#/gastos' || href === '#/cuaderno' || href === '#/documentos') {
          // Ocultar duplicados que ahora están encapsulados dentro de los bloques de los módulos
          item.style.display = 'none';
        }
      });
    } catch (e) {
      console.warn('[Navigation] Error en updateNavigationMenu:', e);
    }
  },

  _navigateBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '#/';
    }
  },

  async route() {
    const hash = window.location.hash.slice(1) || "/";
    const [path, query] = hash.split("?");
    const params = new URLSearchParams(query);

    await this.updateNavigationMenu();

    document.querySelectorAll(".nav-item").forEach((el) => {
      const href = el.getAttribute("href");
      if (!href) return;
      el.classList.toggle(
        "active",
        href.startsWith(`#${path}`)
      );
    });

    // Cerrar menú "Más" al navegar
    const sheet = document.getElementById("nav-more-sheet");
    if (sheet) sheet.classList.remove("open");

    // Actualizar header contextual (título de vista + botón volver)
    this._updateHeaderContext(path);

    // Si venimos de crear un comprador rápido para el wizard de venta, volver al wizard
    if (window._volverAWizardVenta && path === '/comprador' && params?.get?.('id')) {
      window._volverAWizardVenta = false;
      App.toast('Comprador creado. Ahora selecciónalo en el wizard.');
      window.location.hash = '#/animales';
      setTimeout(() => App._abrirWizardVentaMasiva(), 300);
      return;
    }

    const main = document.getElementById("app-content");
    const fincaId = await Fincas.getActiveId();
    if (!fincaId && path !== "/ajustes")
      return await AsistenteConfiguracion.mostrarAsistente();

    main.innerHTML = '<div class="loader">Cargando...</div>';
    try {
      const methodName = App.routes[path];
      if (methodName && typeof App[methodName] === "function") {
        await App[methodName](params);
        // Animación de entrada entre rutas
        main.classList.add('route-enter');
        main.addEventListener('animationend', () => main.classList.remove('route-enter'), { once: true });
      } else {
        main.innerHTML = "<h2>404</h2><p>Página no encontrada.</p>";
        main.classList.add('route-enter');
        main.addEventListener('animationend', () => main.classList.remove('route-enter'), { once: true });
      }
    } catch (error) {
      console.error(error);
      main.innerHTML = `<div class="card error-card"><h2>Error</h2><p>${error.message}</p></div>`;
      main.classList.add('route-enter');
      main.addEventListener('animationend', () => main.classList.remove('route-enter'), { once: true });
    }
  },

  toast(msg, duracionMs) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), duracionMs || 3000);
  },

  toastError(msg) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const t = document.createElement("div");
    t.className = "toast error";
    t.textContent = `❌ ${msg}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 5000);
  },

  // ==========================================
  // WIZARDS COMERCIALES MASIVOS
  // ==========================================
  async _abrirWizardVentaMasiva() {
    if (window.VentaMasivaWizard) {
      await window.VentaMasivaWizard.open();
    } else {
      this.toastError("Error: VentaMasivaWizard no disponible");
    }
  },

  async imprimirAlbaran(albaran, tipo) {
    const overlay = document.createElement("div");
    overlay.id = "albaran-preview-overlay";
    overlay.style =
      "position:fixed; top:0; left:0; right:0; bottom:0; background:white; z-index:5000; display:flex; flex-direction:column; padding:0; overflow:hidden;";

    const contentId = `albaran-print-${Date.now()}`;
    overlay.innerHTML = `
            <div style="flex:1; width:100%; overflow-y:auto; margin: 0; background:white; color:black; padding:30px; border-radius:0; font-family:serif; box-sizing:border-box;" id="${contentId}">
                <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:10px;">
                    <img src="icons/Logo aplicación.png" style="height:50px; filter:grayscale(1);">
                    <div style="text-align:right;">
                        <h1 style="margin:0; font-size:1.5rem;">ALBARÁN DE EXPEDICIÓN</h1>
                        <p class="m-0">Nº: ${albaran.cabecera.numero_albaran
      }</p>
                        <p class="m-0">Fecha: ${albaran.cabecera.fecha_emision
      }</p>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px; margin-top:30px;">
                    <div>
                        <h4 style="border-bottom:1px solid #ddd;">VENDEDOR (REGA)</h4>
                        <p><strong>${albaran.cabecera.vendedor.nombre
      }</strong><br>REGA: ${albaran.cabecera.vendedor.rega
      }<br>${albaran.cabecera.vendedor.direccion}</p>
                    </div>
                    <div>
                        <h4 style="border-bottom:1px solid #ddd;">COMPRADOR</h4>
                        <p><strong>${albaran.cabecera.comprador.nombre
      }</strong><br>NIF: ${albaran.cabecera.comprador.nif
      }<br>${albaran.cabecera.comprador.direccion}</p>
                    </div>
                </div>
                <div style="margin-top:40px;">
                    <h3 style="background:#eee; padding:5px; font-size: 1rem;">DETALLES DE TRAZABILIDAD (${albaran.trazabilidad.tipo
      })</h3>
                    <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size: 0.9rem;">
                        ${tipo === "carne"
        ? `
                            <tr><td class="td-lbl">Documento ICA</td><td class="td-val">${albaran.trazabilidad.codigo_ica}</td></tr>
                            <tr><td class="td-lbl">Guía Sanitaria</td><td class="td-val">${albaran.trazabilidad.numero_guia}</td></tr>
                            <tr><td class="td-lbl">Establecimiento Destino</td><td class="td-val">${albaran.trazabilidad.matadero}</td></tr>
                            <tr><td class="td-lbl">Nº Albarán</td><td class="td-val">${albaran.trazabilidad.numero_albaran || 'N/A'}</td></tr>
                            <tr><td class="td-lbl">DIMOE</td><td class="td-val">${albaran.trazabilidad.dimoe || 'N/A'}</td></tr>
                            <tr style="background:#f9f9f9;"><td colspan="2" class="td-lbl">🚛 TRANSPORTE</td></tr>
                            <tr><td class="td-lbl">Transportista</td><td class="td-val">${albaran.trazabilidad.transportista?.nombre || 'N/D'}</td></tr>
                            <tr><td class="td-lbl">NIF Transportista</td><td class="td-val">${albaran.trazabilidad.transportista?.nif || 'N/D'}</td></tr>
                            <tr><td class="td-lbl">Matrícula</td><td class="td-val">${albaran.trazabilidad.transportista?.matricula || 'N/D'}</td></tr>
                        `
        : `
                            <tr><td class="td-lbl">Matrícula Cisterna</td><td class="td-val">${albaran.trazabilidad.matricula}</td></tr>
                            <tr><td class="td-lbl">Muestra Letra Q</td><td class="td-val">${albaran.trazabilidad.muestra_letra_q}</td></tr>
                            <tr><td class="td-lbl">Temp. Carga</td><td class="td-val">${albaran.trazabilidad.temp_carga} ºC</td></tr>
                        `
      }
                    </table>
                </div>
                <div style="margin-top:40px; text-align:center; font-size:0.8rem; border-top:1px solid #eee; padding-top:20px;">
                    <p>Documento generado electrónicamente por Livestock Manager Premium v3.3.9</p>
                </div>
            </div>
            <div style="text-align:center; padding:20px; display:flex; gap:10px; justify-content:center; background:#eee; border-top:1px solid #ddd; flex-shrink:0;">
                <button class="btn btn-primary" id="btn-descargar-pdf" style="width:auto; padding:0 30px;">📄 DESCARGAR PDF</button>
                <button class="btn btn-secondary" onclick="document.getElementById('albaran-preview-overlay').remove()" style="width:auto; padding:0 30px;">CERRAR</button>
            </div>
        `;
    document.body.appendChild(overlay);

    overlay.querySelector("#btn-descargar-pdf").onclick = async () => {
      let loader;
      try {
        loader = document.createElement('div');
        loader.id = 'pdf-loader-overlay';
        loader.style.cssText = `
          position:fixed; top:0; left:0; right:0; bottom:0; z-index:100000;
          background:rgba(0,0,0,0.85); display:flex; flex-direction:column;
          align-items:center; justify-content:center; color:#fff; font-family:sans-serif;
        `;
        loader.innerHTML = `
          <div style="width:280px; text-align:center;">
            <div style="font-size:3rem; margin-bottom:20px; animation: bounce 2s infinite;">📄</div>
            <div style="font-weight:800; font-size:1.1rem; margin-bottom:8px;">Generando PDF</div>
            <div style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">Albarán ${albaran.cabecera.numero_albaran}</div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; position:relative;">
              <div id="pdf-progress-bar" style="position:absolute; left:0; top:0; height:100%; width:10%; background:#c9851f; transition:width 0.4s ease; border-radius:10px;"></div>
            </div>
            <div id="pdf-progress-text" style="font-size:0.7rem; color:#888; margin-top:8px; font-weight:700;">PROCESANDO...</div>
          </div>
          <style> @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-20px);} 60% {transform: translateY(-10px);} } </style>
        `;
        document.body.appendChild(loader);

        const updateProgress = (pct, text) => {
          const bar = loader.querySelector('#pdf-progress-bar');
          const txt = loader.querySelector('#pdf-progress-text');
          if (bar) bar.style.width = pct + '%';
          if (txt) txt.textContent = text.toUpperCase();
        };

        updateProgress(30, 'Preparando documento...');
        const sourceEl = overlay.querySelector(`#${contentId}`);
        const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `position:absolute; left:0; top:${currentScroll}px; width:800px; z-index:9990; background:#fff; color:#000; padding:30px;`;
        tempContainer.innerHTML = sourceEl.innerHTML;
        document.body.appendChild(tempContainer);

        const opt = {
          margin: [12, 10, 12, 10],
          filename: `albaran_${albaran.cabecera.numero_albaran}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            width: 800,
            scrollX: 0,
            scrollY: currentScroll,
            height: tempContainer.scrollHeight,
            windowHeight: tempContainer.scrollHeight
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        updateProgress(70, 'Generando archivo...');
        await html2pdf().set(opt).from(tempContainer).save();

        document.body.removeChild(tempContainer);
        updateProgress(100, '¡Listo!');
        await new Promise(r => setTimeout(r, 500));
        loader.remove();
      } catch (e) {
        console.error('[App PDF] Error:', e);
        if (loader) loader.remove();
      }
    };
  },

  async imprimirFactura(albaran, liquidacion, numeroFactura) {
    const finca = await Fincas.getActive().catch(() => null);
    const contentHtml = window.PdfService
      ? window.PdfService.generarFactura({
          albaran,
          liquidacion,
          numeroFactura,
          finca
        })
      : '<p>Error: PdfService no disponible</p>';

    window.PdfService?.mostrarPDF({
      title: 'FACTURA',
      filename: `factura_${numeroFactura || albaran.cabecera.numero_albaran}.pdf`,
      contentHtml
    });
  },

  async _abrirWizardAlbaranLeche() {
    if (window.AlbaranLecheWizard) { return window.AlbaranLecheWizard.open(); }
    App.toastError("Error: AlbaranLecheWizard no disponible");
  },
  async _abrirFormularioGasto(options = {}) {
    if (window.GastoWizard) { return window.GastoWizard.open(options); }
    App.toastError("Error: GastoWizard no disponible");
  },
  async _abrirAsistenteProduccion(tipo, options = {}) {
    if (window.ProduccionUI && typeof ProduccionUI.iniciarAsistente === 'function') {
      await ProduccionUI.iniciarAsistente(tipo, options);
    } else {
      this.toastError("Error: Módulo de producción no disponible");
    }
  },

  // ==========================================
  // HISTORIAL REPRODUCTIVO Y REFERENCIA
  // ==========================================
  async _cargarHistorialReproduccion(animalId) {
    const container = document.getElementById('tabla-reproduccion');
    if (!container) return;
    try {
      const eventos = window.Reproduccion
        ? await Reproduccion.listEventos(Number(animalId))
        : await window.db.getAll('reproduccion_eventos').then(r => r.filter(e => Number(e.animalId) === Number(animalId))).catch(() => []);
      if (!eventos || eventos.length === 0) {
        container.innerHTML = '<em class="text-333">Sin eventos reproductivos</em>';
        return;
      }
      container.innerHTML = eventos.slice(0, 10).map(e =>
        `<div class="flex justify-between text-xs" style="padding:3px 0; border-bottom:1px solid #1a1a1a;">
          <span class="text-gold">${e.fecha || '—'}</span>
          <span class="text-ccc">${e.tipo_evento || e.tipo || 'Evento'}</span>
          <span class="text-gray-500">${e.resultado || e.notas || ''}</span>
        </div>`
      ).join('');
    } catch (e) {
      console.warn('[App] Error cargando historial reproductivo:', e);
      container.innerHTML = '<em class="text-red">Error al cargar historial</em>';
    }
  },

  async _cargarReferenciaRebano(rebanoId, excludeAnimalId) {
    const container = document.getElementById('tabla-referencia');
    if (!container) return;
    try {
      const animales = await window.db.getAll('animales').catch(() => []);
      const companeros = animales.filter(a =>
        Number(a.rebanoId) === Number(rebanoId) &&
        Number(a.id) !== Number(excludeAnimalId) &&
        (a.estado === 'activo' || a.estado === 'Activo')
      ).slice(0, 8);
      if (companeros.length === 0) {
        container.innerHTML = '<em class="text-333">Sin compañeros de rebaño</em>';
        return;
      }
      container.innerHTML = companeros.map(a =>
        `<div class="flex justify-between text-xs" style="padding:2px 0;">
          <span class="text-ccc">${a.numero_identificacion || '#'.concat(a.id)}</span>
          <span class="text-gray-500">${a.especie || ''} · ${a.peso_actual || '—'} kg</span>
        </div>`
      ).join('');
    } catch (e) {
      console.warn('[App] Error cargando referencia rebaño:', e);
      container.innerHTML = '<em class="text-red">Error al cargar compañeros</em>';
    }
  },

  async _leerChipNFC(rfidId, crotalId) {
    // Nota técnica: Los crotales electrónicos ganaderos españoles usan RFID LF a 134.2 kHz
    // (ISO 11784/11785), incompatible con NFC de smartphone (13.56 MHz, ISO 14443/15693).
    // Este método intenta leer tags NFC estándar por si el usuario tiene tags complementarios,
    // pero NO puede leer los transpondedores electrónicos de los crotales oficiales.
    try {
      // 1️⃣ Intentar Web NFC API (NDEFReader) — solo tags NFC 13.56 MHz
      if ('NDEFReader' in window && window.isSecureContext) {
        try {
          const reader = new NDEFReader();
          await reader.scan();
          App.toast('Acerca un tag NFC al dispositivo...');

          const timeout = setTimeout(() => {
            reader.abort?.();
            App.toast(
              'Tiempo agotado. Recuerda: los crotales ganaderos NO usan NFC (13.56 MHz) ' +
              'sino RFID LF (134.2 kHz). Usa un lector Bluetooth externo.',
              5000
            );
          }, 20000);

          return new Promise((resolve) => {
            reader.addEventListener('reading', (event) => {
              clearTimeout(timeout);
              let nfcData = '';
              try {
                for (const record of event.message.records) {
                  const decoder = new TextDecoder(record.encoding || 'utf-8');
                  nfcData += decoder.decode(record.data) || '';
                }
              } catch (_) {
                // Si falla la decodificación, usar el primer byte como hex
                const arr = new Uint8Array(event.message.records[0]?.data);
                nfcData = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
              }

              if (nfcData) {
                const rfidEl = document.getElementById(rfidId);
                const crotalEl = document.getElementById(crotalId);
                if (rfidEl) rfidEl.value = nfcData.trim();
                // Si el dato parece un código ISO 11784/11785 (numérico), formatearlo
                if (crotalEl && !crotalEl.value) {
                  crotalEl.value = nfcData.trim();
                  if (window.AnimalesView?._validarCrotalUI) {
                    window.AnimalesView._validarCrotalUI(crotalEl);
                  }
                }
                App.toast(`Tag NFC leído: ${nfcData}`, 4000);
              }
              reader.abort?.();
              resolve();
            });
          });
        } catch (webNfcErr) {
          console.warn('[NFC] Web NFC falló:', webNfcErr);
        }
      }

      // 2️⃣ Mensaje informativo si no hay Web NFC o falló
      if (!('NDEFReader' in window)) {
        App.toast(
          '⚠️ NFC en móvil NO lee crotales LF (134.2 kHz). ' +
          'Usa el botón 📷 SCAN para leer el código visual con la cámara. ' +
          'Para lectura electrónica, conecta un lector RFID Bluetooth externo (Allflex, Datamars).',
          6000
        );
      }
    } catch (err) {
      console.warn('[NFC] Error general:', err);
      App.toastError('Error al leer NFC: ' + (err.message || err));
    }
  },

  async _escanearCrotal(inputId) {
    const isCapacitor = window.Capacitor?.isNativePlatform?.() || window.hasOwnProperty('Capacitor');
    const BarcodeScanner = window.Capacitor?.Plugins?.BarcodeScanner;

    // 1️⃣ Intentar con Capacitor nativo (Android)
    if (BarcodeScanner && isCapacitor) {
      try {
        console.log('[SCAN] Intentando escáner nativo Capacitor...');
        const perm = await BarcodeScanner.checkPermission({ force: true });
        console.log('[SCAN] Permiso:', JSON.stringify(perm));
        if (!perm.granted) {
          App.toastError(perm.denied
            ? 'Permiso denegado permanentemente. Actívalo en Ajustes > Apps > Permisos.'
            : 'Permiso de cámara no concedido');
          return;
        }

        // Ocultar la UI del WebView para que la cámara del scanner nativo sea visible por detrás
        const mainApp = document.getElementById('app-content');
        const headerApp = document.querySelector('header');
        if (mainApp) mainApp.style.visibility = 'hidden';
        if (headerApp) headerApp.style.visibility = 'hidden';
        document.body.classList.add('scanner-active');

        await BarcodeScanner.prepare();
        await BarcodeScanner.hideBackground();

        // Crear botón de cancelar flotante en el body
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'scanner-cancel-btn';
        cancelBtn.textContent = '✕ Cancelar Escaneo';
        cancelBtn.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:99999; background:#ef4444; color:#fff; border:none; padding:15px 30px; border-radius:30px; font-weight:bold; font-size:1.1rem; box-shadow: 0 15px 30px rgba(0,0,0,0.6);';

        const cleanupScanner = async () => {
          document.body.classList.remove('scanner-active');
          if (mainApp) mainApp.style.visibility = 'visible';
          if (headerApp) headerApp.style.visibility = 'visible';
          const btn = document.getElementById('scanner-cancel-btn');
          if (btn) btn.remove();
          try { await BarcodeScanner.showBackground(); } catch (_) {}
        };

        cancelBtn.onclick = async () => {
          console.log('[SCAN] Cancelando escaneo nativo...');
          await BarcodeScanner.stopScan();
          await cleanupScanner();
          App.toast('Escaneo cancelado');
        };
        document.body.appendChild(cancelBtn);

        App.toast('Enfoca el código de barras del crotal...', 4000);
        const result = await BarcodeScanner.startScan();

        await cleanupScanner();

        if (result.hasContent && result.content) {
          return this._procesarCrotalEscaneado(inputId, result.content.trim());
        }
        return;
      } catch (err) {
        document.body.classList.remove('scanner-active');
        const mainApp = document.getElementById('app-content');
        const headerApp = document.querySelector('header');
        if (mainApp) mainApp.style.visibility = 'visible';
        if (headerApp) headerApp.style.visibility = 'visible';
        const btn = document.getElementById('scanner-cancel-btn');
        if (btn) btn.remove();

        try { await BarcodeScanner.showBackground(); } catch (_) {}
        console.error('[SCAN] Error nativo:', err);
        App.toast('Escáner nativo falló, usando cámara web...', 2000);
        // Wait for background to be restored before trying web scanner
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // 2️⃣ Fallback Web con html5-qrcode
    if (typeof Html5Qrcode === 'undefined') {
      App.toastError('Librería de escaneo no disponible. Introduce el crotal manualmente.');
      return;
    }

    // Crear overlay con cámara en vivo
    const overlay = document.createElement('div');
    overlay.id = 'scanner-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#000;display:flex;flex-direction:column;';
    overlay.innerHTML = `
      <div id="scanner-container" style="flex:1;width:100%;overflow:hidden;"></div>
      <div style="padding:14px;text-align:center;background:#1a1a1a;">
        <div class="text-white text-sm mb-8">🔍 Enfoca el código de barras o QR del crotal</div>
        <button class="btn btn-primary btn-sm" onclick="App._cancelarScanWeb()" style="background:#ef4444;">✕ Cancelar</button>
      </div>`;
    document.body.appendChild(overlay);
    window._scanOverlay = overlay;

    // Wait for DOM to be ready
    await new Promise(r => setTimeout(r, 500));

    const container = document.getElementById('scanner-container');
    const html5QrCode = new Html5Qrcode('scanner-container');
    window._html5QrCode = html5QrCode;

    try {
      console.log('[SCAN] Iniciando cámara web...');

      // For Capacitor WebView, request camera directly with getUserMedia
      if (isCapacitor && navigator.mediaDevices?.getUserMedia) {
        try {
          console.log('[SCAN] Solicitando acceso a cámara...');
          // Use ideal instead of exact to avoid strict constraint failures
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          console.log('[SCAN] Cámara obtenida correctamente');

          // Create video element and attach stream directly
          const video = document.createElement('video');
          video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
          video.setAttribute('playsinline', 'true');
          video.setAttribute('autoplay', 'true');
          video.muted = true;
          video.srcObject = stream;
          container.innerHTML = '';
          container.appendChild(video);

          await video.play();
          console.log('[SCAN] Video reproduciéndose');

          // Use html5-qrcode scanFile with the video element
          await html5QrCode.scanFile(video, true);
          
          // Set up continuous scanning using the stream
          const scanInterval = setInterval(async () => {
            try {
              const decodedText = await html5QrCode.scanFile(video, true);
              if (decodedText) {
                clearInterval(scanInterval);
                stream.getTracks().forEach(track => track.stop());
                this._cancelarScanWeb();
                this._procesarCrotalEscaneado(inputId, decodedText.trim());
              }
            } catch (e) {
              // No barcode detected yet, continue scanning
            }
          }, 200);

          // Store interval for cleanup
          window._scanInterval = scanInterval;
          console.log('[SCAN] Escáner iniciado correctamente');
        } catch (permErr) {
          console.error('[SCAN] Error accediendo a cámara:', permErr);
          App.toastError('No se pudo acceder a la cámara. Introduce el crotal manualmente.');
          this._cancelarScanWeb();
        }
      } else {
        // Non-Capacitor: use default html5-qrcode behavior
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 }, formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.DATA_MATRIX, Html5QrcodeSupportedFormats.ITF, Html5QrcodeSupportedFormats.AZTEC] },
          (decodedText) => {
            this._cancelarScanWeb();
            this._procesarCrotalEscaneado(inputId, decodedText.trim());
          },
          () => {}
        );
        console.log('[SCAN] Cámara iniciada correctamente');
      }
    } catch (err) {
      console.error('[SCAN] Error html5-qrcode:', err);
      App.toastError('No se pudo iniciar la cámara. Introduce el crotal manualmente.');
      this._cancelarScanWeb();
    }
  },

  /** Procesa el código escaneado y lo asigna al input */
  _procesarCrotalEscaneado(inputId, codigo) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value = codigo.toUpperCase();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.AnimalesView?._validarCrotalUI) {
      window.AnimalesView._validarCrotalUI(input);
    }
    App.toast(`✅ Crotal leído: ${codigo.toUpperCase()}`, 4000);
  },

  /** Cancela el escaneo web y libera recursos */
  _cancelarScanWeb() {
    if (window._scanInterval) {
      clearInterval(window._scanInterval);
      window._scanInterval = null;
    }
    if (window._html5QrCode) {
      try { window._html5QrCode.stop(); } catch (_) {}
      window._html5QrCode = null;
    }
    const ov = document.getElementById('scanner-overlay');
    if (ov) ov.remove();
  },
  async _abrirWizardReproduccion(animalId) {
    if (!window.Reproduccion) { this.toastError('Módulo de reproducción no disponible'); return; }
    try {
      const animal = await window.db.get('animales', Number(animalId)).catch(() => null);
      if (!animal) { this.toastError('Animal no encontrado'); return; }

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      overlay.innerHTML = `
        <div class="card" style="max-width:450px;width:100%;border-top:4px solid #a78bfa;padding:24px;">
          <div class="flex justify-between items-center mb-14">
            <div class="font-900 text-white text-lg">🧬 Gestión Reproductiva</div>
            <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer;">✕</button>
          </div>
          <div class="mb-12 text-ccc text-sm">Animal: <strong class="text-white">${animal.numero_identificacion || '#'.concat(animal.id)}</strong></div>
          <div class="wizard-input-group">
            <label class="wizard-label">TIPO DE EVENTO</label>
            <select id="wiz-repro-tipo" class="wizard-input wizard-select">
              <option value="Celo">Celo</option>
              <option value="Inseminación Artificial" selected>Inseminación Artificial</option>
              <option value="Monta Natural">Monta Natural</option>
              <option value="Diagnóstico Gestación">Diagnóstico Gestación</option>
              <option value="Parto">Parto</option>
              <option value="Aborto">Aborto</option>
              <option value="Destete">Destete</option>
              <option value="Secado">Secado</option>
            </select>
          </div>
          <div class="wizard-input-group">
            <label class="wizard-label">FECHA</label>
            <input type="date" id="wiz-repro-fecha" class="wizard-input" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="wizard-input-group">
            <label class="wizard-label">RESULTADO / NOTAS</label>
            <input type="text" id="wiz-repro-notas" class="wizard-input" placeholder="Ej: Positivo, Negativo, Crias: 2, ...">
          </div>
          <div class="mt-14 flex gap-10">
            <button class="btn btn-primary flex-1" onclick="App._guardarEventoReproduccion('${animalId}')">✔ Guardar</button>
            <button class="btn btn-secondary" onclick="this.closest('[style]').remove()">Cancelar</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    } catch (e) {
      console.error('[App] Error abriendo wizard reproducción:', e);
      this.toastError('Error al abrir wizard');
    }
  },

  async _guardarEventoReproduccion(animalId) {
    const overlay = document.querySelector('[style*="z-index:9999"]');
    const tipo = document.getElementById('wiz-repro-tipo')?.value;
    const fecha = document.getElementById('wiz-repro-fecha')?.value;
    const notas = document.getElementById('wiz-repro-notas')?.value?.trim() || '';
    if (!tipo || !fecha) { this.toastError('Completa todos los campos'); return; }
    try {
      const fincaId = await Fincas.getActiveId();
      await Reproduccion.saveEvento({
        animalId: Number(animalId),
        tipo_evento: tipo,
        fecha,
        notas,
        resultado: notas,
        fincaId
      });
      if (overlay) overlay.remove();
      this.toast('Evento reproductivo guardado ✔');
      // Recargar historial
      this._cargarHistorialReproduccion(animalId);
    } catch (e) {
      console.error('[App] Error guardando evento:', e);
      this.toastError('Error al guardar: ' + e.message);
    }
  },

  // ==========================================
  // DETALLES INDIVIDUALES
  // ==========================================
  _abrirDetalleVentaCarne(id) {
    location.hash = `/venta-carne?id=${id}`;
  },

  async renderDetalleVentaCarne(params) {
    const id = params.get("id");
    if (!id) return;
    try {
      const v = await window.db.get("comercializacion_carne", parseInt(id));
      if (!v) throw new Error("Registro de venta no encontrado");

      const animal = await window.db.get("animales", v.animalId);

      document.getElementById("app-content").innerHTML = `
        <div class="mb-20">
          <a href="#/comercializacion?tab=carne" class="text-gold no-underline">← Volver</a>
          <h2 class="text-white mt-10">🥩 Detalle de Venta</h2>
        </div>

        <div class="card mb-20" style="border-top: 5px solid #ef4444;">
          <div class="flex justify-between items-center border-bottom-222 pb-10 mb-15">
            <div>
              <div class="text-gray text-tiny uppercase font-bold">Albarán Nº</div>
              <div class="text-white font-black text-lg">${v.numero_albaran || 'S/N'}</div>
            </div>
            <div class="text-right">
              <div class="text-gray text-tiny uppercase font-bold">Fecha</div>
              <div class="text-white font-bold">${new Date(v.fechaSacrificio).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-15 mb-20">
            <div class="bg-dark p-10 rounded">
              <small class="text-gray uppercase font-bold text-tiny">Animal</small>
              <div class="text-gold font-black">${animal?.numero_identificacion || 'Desconocido'}</div>
              <div class="text-gray text-xs">${v.snap_especie || ''} - ${v.snap_tipo || ''}</div>
            </div>
            <div class="bg-dark p-10 rounded text-right">
              <small class="text-gray uppercase font-bold text-tiny">Rendimiento</small>
              <div class="text-green font-black text-lg">${v.rendimientoCanal || 0}%</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-15 mb-20">
            <div>
              <label class="text-gray text-tiny uppercase font-bold">Peso Vivo</label>
              <div class="text-white font-bold">${v.pesoVivo || 0} kg</div>
            </div>
            <div class="text-right">
              <label class="text-gray text-tiny uppercase font-bold">Peso Canal</label>
              <div class="text-white font-black text-lg">${v.pesoCanal || 0} kg</div>
            </div>
          </div>

          <div class="border-top-222 pt-15 mt-15">
            <div class="text-gray text-tiny uppercase font-bold mb-4">Comprador / Destino</div>
            <div class="text-white font-bold">${v.razonSocial || 'N/D'}</div>
            <div class="text-gray text-xs">NIF: ${v.nifComprador || 'N/D'}</div>
            <div class="text-gray text-xs mt-4">📍 ${v.codigoMatadero || ''}</div>
          </div>

          <div class="flex gap-10 mt-30">
            <button class="btn btn-primary flex-1" onclick="App._reimprimirAlbaranCarne(${v.id})" style="background:#ef4444; border:none;">
              📄 REIMPRIMIR ALBARÁN
            </button>
            <button class="btn btn-secondary" onclick="App._eliminarVentaCarneDetalle(${v.id})" style="background:#450a0a; color:white; border:none; padding: 0 15px;">
              🗑️
            </button>
          </div>
        </div>

        <div class="card bg-darker" style="border-left: 3px solid #333;">
          <h4 class="text-gray text-xs uppercase font-bold mb-8">Información de Trazabilidad</h4>
          <div class="grid grid-cols-2 gap-8 text-xs text-aaa">
            <div>Guía Sanitaria:</div><div class="text-white text-right">${v.numero_Guia_Sanitaria || '-'}</div>
            <div>Documento ICA:</div><div class="text-white text-right">${v.codigoDocumento_ICA || '-'}</div>
            <div>Transportista:</div><div class="text-white text-right">${v.nombreTransportista || '-'}</div>
            <div>Matrícula:</div><div class="text-white text-right">${v.matriculaTransportista || '-'}</div>
          </div>
        </div>
      `;
    } catch (e) {
      this.toastError(e.message);
      location.hash = "/comercializacion?tab=carne";
    }
  },

  async _reimprimirAlbaranCarne(id) {
    try {
      const v = await window.db.get("comercializacion_carne", id);
      const est = await window.Trazabilidad.generarEstructuraAlbaran(window.db, v, "carne");
      await this.imprimirAlbaran(est, "carne");
    } catch (e) {
      this.toastError("Error al generar albarán: " + e.message);
    }
  },

  async _eliminarVentaCarneDetalle(id) {
    if (!confirm("¿Eliminar este registro de venta? El animal volverá a estar ACTIVO en el censo.")) return;
    try {
      const v = await window.db.get("comercializacion_carne", id);
      if (v.animalId) {
        const a = await window.db.get("animales", v.animalId);
        if (a) {
          a.estado = "activo";
          await Animales.save(a);
        }
      }
      await window.db.delete("comercializacion_carne", id);
      this.toast("Registro de venta eliminado correctamente");
      location.hash = "/comercializacion?tab=carne";
    } catch (e) {
      this.toastError(e.message);
    }
  },

  async renderDetalleLeche(params) {
    const id = params.get("id");
    const e = await window.db.get("comercializacion_leche", parseInt(id));
    document.getElementById("app-content").innerHTML = `
            <div class="mb-20"><a href="#/comercializacion?tab=leche" class="text-gold" class="no-underline">← Volver</a><h2>🥛 Analítica de Tanque</h2></div>
            <div class="card" style="border-top: 5px solid #fbbf24;">
                <div class="grid grid-cols-2 gap-12">
                    <div><label>Volumen (L)</label><input type="number" id="le-cant" value="${e.cantidad
      }" class="premium-input"></div>
                    <div><label>Precio (€/L)</label><input type="number" id="le-pb" value="${e.precioBase
      }" class="premium-input"></div>
                </div>
                <div class="grid grid-cols-2 gap-12 mt-20">
                    <div><label>Materia Grasa (%)</label><input type="number" id="le-grasa" value="${e.laboratorio?.grasa || 0
      }" step="0.01" class="premium-input"></div>
                    <div><label>Proteína (%)</label><input type="number" id="le-prot" value="${e.laboratorio?.proteina || 0
      }" step="0.01" class="premium-input"></div>
                </div>
                <div class="grid grid-cols-2 gap-12 mt-12">
                    <div><label>Somáticas (cel/mL)</label><input type="number" id="le-som" value="${e.laboratorio?.somaticas || 0
      }" class="premium-input"></div>
                    <div><label>Gérmenes (UFC/mL)</label><input type="number" id="le-ger" value="${e.laboratorio?.germenes || 0
      }" class="premium-input"></div>
                </div>
                <div style="margin-top:20px;"><label>Control de Antibióticos</label><select id="le-ant" class="premium-input"><option value="false" ${!e.antibioticos ? "selected" : ""
      }>NEGATIVO (Apto)</option><option value="true" ${e.antibioticos ? "selected" : ""
      }>POSITIVO (Alerta Crítica)</option></select></div>
                <button class="btn btn-primary" onclick="App._guardarEdicionLeche(${id})" style="margin-top:25px; background:#fbbf24; color:#000;">ACTUALIZAR RESULTADOS</button>
            </div>`;
  },

  async _guardarEdicionLeche(id) {
    try {
      const e = await window.db.get("comercializacion_leche", id);
      e.cantidad = parseFloat(document.getElementById("le-cant").value);
      e.precioBase = parseFloat(document.getElementById("le-pb").value);
      e.laboratorio = {
        grasa: parseFloat(document.getElementById("le-grasa").value),
        proteina: parseFloat(document.getElementById("le-prot").value),
        somaticas: parseInt(document.getElementById("le-som").value),
        germenes: parseInt(document.getElementById("le-ger").value),
        antibioticos: document.getElementById("le-ant").value === "true",
      };
      e.antibioticos = e.laboratorio.antibioticos;
      e.estadoAnalitica = e.antibioticos ? "Alerta Crítica" : "Validado";
      await window.db.put("comercializacion_leche", e);
      this.toast("Registro lácteo actualizado.");
      location.hash = "#/comercializacion?tab=leche";
    } catch (e) {
      this.toastError(e.message);
    }
  },

  async renderDetalleGasto(params) {
    const id = params.get("id");
    const g = await window.db.get("gastos_ganaderia", parseInt(id));
    document.getElementById("app-content").innerHTML = `
            <div class="mb-20"><a href="#/comercializacion?tab=gastos" class="text-gold" class="no-underline">← Volver</a><h2>💸 Ficha de Gasto</h2></div>
            <div class="card" style="border-top: 4px solid #3b82f6;">
                <label>Concepto</label><input type="text" id="ge-con" value="${g.concepto}" class="premium-input" style="margin-bottom:10px;">
                <label>Monto (€)</label><input type="number" id="ge-mon" value="${g.monto}" class="premium-input">
                <div class="flex gap-10" style="margin-top:25px;">
                    <button class="btn btn-primary" onclick="App._guardarEdicionGasto(${id})" style="flex:2; background:#3b82f6;">💾 GUARDAR</button>
                    <button class="btn btn-secondary flex-1" onclick="App._eliminarGasto(${id})" style="background:#450a0a; color:white;">🗑️ BORRAR</button>
                </div>
            </div>`;
  },

  async _guardarEdicionGasto(id) {
    const g = await window.db.get("gastos_ganaderia", id);
    g.concepto = document.getElementById("ge-con").value;
    g.monto = parseFloat(document.getElementById("ge-mon").value);
    await window.db.put("gastos_ganaderia", g);
    this.toast("Gasto actualizado.");
    location.hash = "#/comercializacion?tab=gastos";
  },

  async _eliminarVentaCarne(id) {
    if (
      !confirm("¿Eliminar registro de venta? El animal volverá a estar ACTIVO.")
    )
      return;
    try {
      const v = await window.db.get("comercializacion_carne", id);
      const a = await window.db.get("animales", v.animalId);
      if (a) {
        a.estado = "activo";
        await Animales.save(a);
      }
      await window.db.delete("comercializacion_carne", id);
      this.toast("Venta eliminada.");
      if (window.ComercializacionView) window.ComercializacionView.render(new Map([["tab", "carne"]]));
    } catch (e) {
      this.toastError(e.message);
    }
  },

  async _eliminarGasto(id) {
    if (!confirm("¿Eliminar este registro de gasto?")) return;
    try {
      await Gastos.delete(id);
      this.toast("Gasto eliminado.");
      location.hash = "#/comercializacion?tab=gastos";
    } catch (e) {
      this.toastError(e.message);
    }
  },

  // [Eliminado] renderDocumentosLegales + renderCuadernoDigital — secciones obsoletas

  // ==========================================
  // VISTAS PRINCIPALES (delegadas a views/)
  // ==========================================

  async renderDashboard() {
    if (window.DashboardView) { await DashboardView.render(); }
  },

  async renderGanaderia() {
    if (window.GanaderiaView) { await GanaderiaView.render(); }
  },

  async renderRebanos() {
    if (window.RebanosView) { await RebanosView.render(); }
  },

  async renderDetalleRebano(params) {
    if (window.RebanosView) { await RebanosView.renderDetalle(params); }
  },

  async renderCarne() {
    if (window.CarneView) { await CarneView.render(); }
  },

  async renderHibrido() {
    if (window.HibridoView) { await HibridoView.render(); }
  },

  async renderZonas() {
    if (window.ZonasView) { await ZonasView.render(); }
  },

  async renderDetalleZona(params) {
    if (window.ZonasView) { await ZonasView.renderDetalle(params); }
  },

  async renderAnimales() {
    if (window.AnimalesView) { await AnimalesView.render(); }
  },

  async renderDetalleAnimal(params) {
    if (window.AnimalesView) { await AnimalesView.renderDetalle(params); }
  },

  async renderLeche() {
    if (window.LecheView) { await LecheView.render(); }
  },

  async renderExplotacion() {
    if (window.ExplotacionView) { await ExplotacionView.render(); }
  },

  async renderGastos() {
    if (window.GastosView) { await GastosView.render(); }
  },

  async renderComercializacion(params) {
    if (window.ComercializacionView) { await ComercializacionView.render(params); }
  },

  async renderTrazabilidad(params) {
    if (window.TrazabilidadView) {
      const id = params?.get ? params.get('id') : null;
      if (id) await TrazabilidadView.render(parseInt(id));
    }
  },

  async renderCuadernoDigital() {
    if (window.CuadernoDigitalView) {
      await CuadernoDigitalView.render();
    } else {
      document.getElementById("app-content").innerHTML = '<div class="loader">Error: CuadernoDigitalView no disponible</div>';
    }
  },

  async renderDocumentos() {
    if (window.DocumentosView) {
      await DocumentosView.render();
    } else {
      document.getElementById("app-content").innerHTML = '<div class="loader">Cargando módulo de documentos...</div>';
    }
  },

  async renderManuales() {
    if (window.ManualesView) {
      await ManualesView.render();
    } else {
      document.getElementById("app-content").innerHTML = '<div class="loader">Cargando manuales...</div>';
    }
  },

  // ==========================================
  //  // 9. INFORMES PREMIUM (v4.1.0)
  // ==========================================
  async renderInformes() {
    try {
      await InformesView.render();
    } catch (e) {
      console.error("[App] Error delegando a InformesView:", e);
      App.toastError("Error al cargar informes");
    }
  },

  // [Eliminado] _renderizarGraficosInformes — los gráficos los gestiona InformesView

  async exportToPDF() {
    this.toast("Generando PDF...");
    const element = document.getElementById("app-content");
    const opt = {
      margin: 0.5,
      filename: `informe_premium_v3.3.9.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: "#000000" },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ['css', 'legacy'] },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => this.toast("Reporte descargado."));
  },

  // ==========================================
  // COMPRADORES (delegado)
  // ==========================================
  async renderCompradores() {
    if (window.CompradoresView && typeof CompradoresView.render === 'function') {
      await CompradoresView.render();
    } else {
      document.getElementById("app-content").innerHTML = '<div class="loader">Cargando módulo de compradores...</div>';
    }
  },

  async renderComprador(params) {
    const id = params?.get ? params.get('id') : null;
    if (id) {
      if (window.CompradoresView && typeof CompradoresView.renderDetalle === 'function') {
        await CompradoresView.renderDetalle(parseInt(id));
      }
    } else if (window.CompradoresView && typeof CompradoresView.renderFormulario === 'function') {
      await CompradoresView.renderFormulario();
    }
  },

  async renderProveedores() {
    if (window.ProveedoresView && typeof ProveedoresView.render === 'function') {
      await ProveedoresView.render();
    } else {
      document.getElementById("app-content").innerHTML = '<div class="loader">Cargando módulo de proveedores...</div>';
    }
  },

  async renderProveedor(params) {
    const id = params?.get ? params.get('id') : null;
    if (id) {
      if (window.ProveedoresView && typeof ProveedoresView.renderDetalle === 'function') {
        await ProveedoresView.renderDetalle(parseInt(id));
      }
    } else if (window.ProveedoresView && typeof ProveedoresView.renderFormulario === 'function') {
      await ProveedoresView.renderFormulario();
    }
  },

  async renderContrato(params) {
    if (window.ContratosView && typeof ContratosView.renderFormulario === 'function') {
      await ContratosView.renderFormulario(params);
    }
  },

  async renderTransportistas() {
    if (window.TransportistasView && typeof TransportistasView.render === 'function') {
      await TransportistasView.render();
    } else {
      document.getElementById("app-content").innerHTML = '<div class="loader">Cargando módulo de transportistas...</div>';
    }
  },

  // ==========================================
  // 9. AJUSTES
  // ==========================================
  async renderAjustes() {
    if (window.AjustesView) {
      await AjustesView.render();
    } else {
      document.getElementById("app-content").innerHTML = '<div class="loader">Error: Vista Ajustes no disponible</div>';
    }
  },

  async _cambiarFincaActiva(id) {
    await Fincas.setActiveId(id);
    this.toast("Finca activa cambiada");
    this.renderAjustes();
  },

  async exportBackup() {
    try {
      App.toast("Generando copia de seguridad...");
      const stores = [
        "fincas",
        "rebanos",
        "animales",
        "produccion_carne",
        "produccion_leche",
        "ventas_ganado",
        "sanitarios_ganado",
        "gastos_ganaderia",
        "config_especies",
        "config_tipos_produccion",
        "comercializacion_carne",
        "comercializacion_leche",
        "registro_eventos",
        "reproduccion_eventos",
        "compradores",
        "proveedores",
        "contratos_compra",
        "transportistas",
        "documentos_legales",
        "meta",
      ];
      const backupData = {};
      let totalRegistros = 0;
      for (let store of stores) {
        if (window.db.objectStoreNames.contains(store)) {
          backupData[store] = await window.db.getAll(store);
          totalRegistros += backupData[store].length;
        }
      }
      backupData._meta = {
        version: "4.5.0",
        db_version: 9,
        exportadoEn: new Date().toISOString(),
        totalRegistros,
      };
      const dataStr = JSON.stringify(backupData, null, 2);

      // 1️⃣ Capacitor Filesystem + Share (Android nativo)
      try {
        const cap = window.Capacitor;
        const fsPlugin = cap?.Plugins?.Filesystem;
        const sharePlugin = cap?.Plugins?.Share;
        if (fsPlugin && sharePlugin) {
          const fileName = `backup_livestock_${new Date().toISOString().split("T")[0]}.json`;

          // Guardamos en CACHE para asegurar que el sistema de Android pueda compartirlo fácilmente
          const result = await fsPlugin.writeFile({
            path: fileName,
            data: dataStr,
            directory: "CACHE",
            encoding: "utf8",
          });

          await sharePlugin.share({
            title: "Backup Livestock Manager",
            text: `Copia de seguridad v4.5.0 — ${totalRegistros} registros`,
            url: result.uri,
            files: [result.uri],
            dialogTitle: "Compartir copia de seguridad con…",
          });

          App.toast(`Backup compartido ✅ (${totalRegistros} registros)`);
          return;
        }
      } catch (capErr) {
        console.warn("[Backup] Capacitor falló:", capErr?.message || capErr);
      }

      // 2️⃣ Fallback: descarga directa (navegador Web)
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `livestock_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      App.toast(`Backup descargado ✅ (${totalRegistros} registros)`);
    } catch (error) {
      App.toastError("Error al exportar: " + error.message);
    }
  },

  async importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    App.toast(`Restaurando backup: ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await window.Trazabilidad.importarBackupData(
          window.db,
          e.target.result
        );
        App.toast(`Backup restaurado ✅ (${res.fincas.length} finca${res.fincas.length > 1 ? 's' : ''})`);
        if (res.multiplesFincas)
          alert("Base de datos restaurada. Detectadas múltiples fincas.");
        else await window.Fincas.setActiveId(res.fincas[0].id);
        window.location.reload();
      } catch (error) {
        App.toastError(error.message);
      }
    };
    reader.readAsText(file);
  },

  async _registrarTratamiento(rebanoId) {
    if (window.WizardTratamiento) {
      await window.WizardTratamiento.registrar(rebanoId);
    }
  },

  async _abrirSelectorAnimales(rebanoId) {
    if (window.WizardTraslado) {
      await window.WizardTraslado.abrirSelectorAnimales(rebanoId);
    }
  },

  async _showFincaForm() {
    if (window.WizardFinca) {
      window.WizardFinca.showForm();
    }
  },
  async _editarFincaActiva() {
    if (window.WizardFinca) { return window.WizardFinca.editar(); }
    const finca = await Fincas.getActive();
    if (!finca) return;
    App.toastError("Error: WizardFinca no disponible");
  },

  alternarSeleccionTodoElLote(masterCheckbox) {
    const checkboxes = document.querySelectorAll('input[name="animal-select"]');
    checkboxes.forEach((cb) => {
      if (!cb.disabled) cb.checked = masterCheckbox.checked;
    });
  },

  async _ejecutarMigracionesFondo() {
    try {
      await Pesajes.ejecutarMigracion();

      // v7: Migración de registros lácteos — añadir defaults a campos nuevos
      try {
        const registros = await window.db.getAll('comercializacion_leche');
        let migrados = 0;
        for (const r of registros) {
          let cambio = false;

          // Asegurar sub-objeto laboratorio
          if (!r.laboratorio) { r.laboratorio = {}; cambio = true; }

          // extracto_seco calculado
          if (r.laboratorio.grasa != null && r.laboratorio.proteina != null && r.laboratorio.extracto_seco == null) {
            r.laboratorio.extracto_seco = parseFloat((r.laboratorio.grasa + r.laboratorio.proteina).toFixed(2));
            cambio = true;
          }

          // fecha_analisis default
          if (!r.laboratorio.fecha_analisis) {
            r.laboratorio.fecha_analisis = r.fechaRecogida || '';
            cambio = true;
          }

          // importe_total calculado retroactivamente
          if (r.importe_total == null && r.cantidad && r.precioBase) {
            r.importe_total = parseFloat((r.cantidad * r.precioBase).toFixed(2));
            cambio = true;
          }

          // Cadena de frío — inferir de temperatura existente
          if (r.cadena_frio_cumplida == null) {
            r.cadena_frio_cumplida = (r.temperatura || 99) <= 4;
            cambio = true;
          }

          // Defaults seguros para nuevos campos
          if (r.comunidad_autonoma == null) { r.comunidad_autonoma = null; cambio = true; }
          if (!r.contrato_numero) { r.contrato_numero = ''; cambio = true; }
          if (!r.numero_infolac) { r.numero_infolac = ''; cambio = true; }
          if (!r.adsg_codigo) { r.adsg_codigo = ''; cambio = true; }
          if (!r.rega_origen) { r.rega_origen = ''; cambio = true; }
          if (r.precio_final_unitario == null && r.precioBase) {
            r.precio_final_unitario = r.precioBase;
            cambio = true;
          }
          if (r.primas_penalizaciones == null) { r.primas_penalizaciones = 0; cambio = true; }
          if (r.coste_alimentacion_periodo == null) { r.coste_alimentacion_periodo = 0; cambio = true; }
          if (r.mofa == null) { r.mofa = 0; cambio = true; }

          if (cambio) {
            await window.db.put('comercializacion_leche', r);
            migrados++;
          }
        }
        if (migrados > 0) console.log(`[Migración] ${migrados} registros lácteos migrados a v7`);
      } catch (e) {
        console.warn("[Migración leche] Error:", e);
      }

      // Migración de fincas — nuevos campos
      try {
        const fincas = await Fincas.list();
        let migrFincas = 0;
        for (const f of fincas) {
          let cambio = false;
          if (!f.comunidad_autonoma) { f.comunidad_autonoma = null; cambio = true; }
          if (!f.tipo_explotacion) { f.tipo_explotacion = 'mixto'; cambio = true; }
          if (!f.sistema_explotacion) { f.sistema_explotacion = 'extensivo'; cambio = true; }
          if (!f.adsg_codigo) { f.adsg_codigo = ''; cambio = true; }
          if (!f.adsg_veterinario) { f.adsg_veterinario = ''; cambio = true; }
          if (!f.adsg_vet_colegiado) { f.adsg_vet_colegiado = ''; cambio = true; }
          if (!f.adsg_vet_nif) { f.adsg_vet_nif = ''; cambio = true; }
          if (!f.contrato_lacteo_numero) { f.contrato_lacteo_numero = ''; cambio = true; }
          if (!f.contrato_lacteo_fecha_fin) { f.contrato_lacteo_fecha_fin = ''; cambio = true; }
          if (!f.contrato_lacteo_comprador) { f.contrato_lacteo_comprador = ''; cambio = true; }
          if (cambio) { await Fincas.save(f); migrFincas++; }
        }
        if (migrFincas > 0) console.log(`[Migración] ${migrFincas} fincas migradas a v7`);
      } catch (e) {
        console.warn("[Migración fincas] Error:", e);
      }
    } catch (e) {
      console.error("[App] Error en migraciones de fondo:", e);
    }
  },

  async _abrirWizardPedidoCrotales() {
    if (window.WizardCrotales) {
      await window.WizardCrotales.abrirPedido();
    }
  },

  async _abrirWizardGuiaMovimiento() {
    if (window.WizardGuiaMovimiento) {
      await window.WizardGuiaMovimiento.abrir();
    }
  },

  async _abrirWizardCenso() {
    if (window.WizardCenso) {
      await window.WizardCenso.abrir();
    }
  },

  async _generarPDFPedidoCrotales(finca, data) {
    if (window.WizardCrotales) {
      await window.WizardCrotales.generarPDF(finca, data);
    }
  },

  _fallbackPDF(element, filename) {
    if (window.WizardCrotales) {
      window.WizardCrotales._fallbackPDF(element, filename);
    }
  },
  _mostrarAyudaMedicamentos() {
    if (window.Ayuda) { window.Ayuda.mostrarMedicamentos(); }
  },

  _mostrarAyudaCrotales() {
    if (window.Ayuda) { window.Ayuda.mostrarCrotales(); }
  },

  _mostrarGuiaNormativas() {
    if (window.Ayuda) { window.Ayuda.mostrarGuiaNormativas(); }
  }

};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.App = App;
    App.init();
  });
} else {
  window.App = App;
  App.init();
}
