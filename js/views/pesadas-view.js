/**
 * Livestock Manager - PesadasView v1.0.0
 * Vista para el control, historial y registro centralizado de pesajes y control lechero.
 */

const PesadasView = {
    _cachedPesajes: [],
    _filtroBusqueda: '',

    async render() {
        const main = document.getElementById('app-content');
        main.innerHTML = `<div class="text-center p-40"><div class="loader">Cargando histórico de pesajes...</div></div>`;

        try {
            await this._cargarPesajes();
            this._renderContenido(main);
        } catch (e) {
            console.error('[PesadasView] Error:', e);
            main.innerHTML = `<div class="card text-center p-40 text-red">Error al cargar la gestión de pesajes: ${e.message}</div>`;
        }
    },

    async _cargarPesajes() {
        const fincaId = await Fincas.getActiveId();
        if (!fincaId) {
            this._cachedPesajes = [];
            return;
        }

        // Obtener todos los eventos de la finca activa
        const todosEventos = await window.db.getAllFromIndex('registro_eventos', 'fincaId', fincaId);
        
        // Filtrar aquellos que son de tipo pesaje (carne o leche)
        this._cachedPesajes = todosEventos.filter(e => 
            (e.tipo_entidad === 'animal' || e.tipo_entidad === 'rebano') &&
            (e.motivo_tarea === 'control' || e.motivo_tarea === 'control_lechero' || e.motivo_tarea === 'produccion_leche' || e.motivo_tarea === 'alta_inicial') &&
            (e.valor_neto > 0)
        ).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        // Obtener nombres de animales para asociar datos
        const animales = await window.db.getAll('animales');
        const animalesMap = {};
        animales.forEach(a => { animalesMap[a.id] = a; });

        // Enriquecer pesajes con datos del animal
        this._cachedPesajes.forEach(p => {
            if (p.tipo_entidad === 'animal' && p.entidad_id) {
                const anim = animalesMap[p.entidad_id];
                if (anim) {
                    p.nombreAnimal = anim.numero_identificacion || `ID: ${p.entidad_id}`;
                    p.categoria = anim.categoria || 'S/C';
                } else {
                    p.nombreAnimal = p.snap_identificacion || `ID: ${p.entidad_id}`;
                    p.categoria = p.snap_tipo || 'S/C';
                }
            } else if (p.tipo_entidad === 'rebano') {
                p.nombreAnimal = `LOTE: ${p.snap_zona || 'S/D'}`;
                p.categoria = 'LOTE';
            }
        });
    },

    _renderContenido(container) {
        const pesajesFiltrados = this._filtroBusqueda 
            ? this._cachedPesajes.filter(p => 
                (p.nombreAnimal || '').toLowerCase().includes(this._filtroBusqueda.toLowerCase()) ||
                (p.snap_zona || '').toLowerCase().includes(this._filtroBusqueda.toLowerCase())
              )
            : this._cachedPesajes;

        // Calcular KPIs rápidos
        const totalPesajes = this._cachedPesajes.length;
        const totalPeso = this._cachedPesajes.reduce((acc, p) => acc + (p.unidad === 'kg' ? p.valor_neto : 0), 0);
        const numCarne = this._cachedPesajes.filter(p => p.unidad === 'kg').length;
        const pesoMedio = numCarne > 0 ? Math.round(totalPeso / numCarne) : 0;

        const totalLeche = this._cachedPesajes.reduce((acc, p) => acc + (p.unidad === 'L' ? p.valor_neto : 0), 0);
        const numLeche = this._cachedPesajes.filter(p => p.unidad === 'L').length;
        const lecheMedia = numLeche > 0 ? (totalLeche / numLeche).toFixed(1) : 0;

        container.innerHTML = `
        <div class="p-16 max-w-[900px] mx-auto animate-fade-in" style="min-height: calc(100vh - 120px);">
            <!-- Encabezado con estilo premium -->
            <div class="mb-20">
                <h1 class="text-xl font-black uppercase tracking-wider mb-2" style="font-family:'Archivo Expanded', sans-serif;">
                    ${Icons.balanza()} HISTORIAL DE PESAJES
                </h1>
                <p class="text-xs font-bold uppercase tracking-tight text-gray-400 m-0">Control de crecimiento cárnico y producción lechera</p>
            </div>

            <!-- Botones de Acción Directa para Iniciar Pesajes (Wizards) -->
            <div class="grid grid-cols-2 gap-10 mb-20">
                <button class="widget-link-btn widget-link-btn--neon neon-success flex items-center justify-center flex-col p-12 text-center" 
                        onclick="PesadasView._iniciarPesaje('carne')" style="min-height:90px; border-radius:12px;">
                    <div class="mb-6" style="transform: scale(1.2);">${Icons.balanza()}</div>
                    <span class="widget-link-label font-950 uppercase text-xs">PESAJE DE CARNE</span>
                    <small class="text-[0.55rem] text-gray-400 mt-2 block">REGISTRAR CRECIMIENTO</small>
                </button>
                <button class="widget-link-btn widget-link-btn--neon neon-warning flex items-center justify-center flex-col p-12 text-center" 
                        onclick="PesadasView._iniciarPesaje('leche')" style="min-height:90px; border-radius:12px;">
                    <div class="mb-6" style="transform: scale(1.2);">${Icons.leche()}</div>
                    <span class="widget-link-label font-950 uppercase text-xs">CONTROL LECHERO</span>
                    <small class="text-[0.55rem] text-gray-400 mt-2 block">REGISTRAR ORDEÑO</small>
                </button>
            </div>

            <!-- KPIs de pesaje -->
            <div class="grid grid-cols-3 gap-10 mb-20">
                <div class="card p-12 text-center" style="background:#111; border:1px solid #222;">
                    <span class="text-gray-500 font-950 uppercase text-[0.6rem] tracking-wider mb-4 d-block">TOTAL PESADAS</span>
                    <span class="text-white font-black text-sm block" style="font-family:'IBM Plex Mono', monospace;">${totalPesajes}</span>
                </div>
                <div class="card p-12 text-center" style="background:#111; border:1px solid #222;">
                    <span class="text-gray-500 font-950 uppercase text-[0.6rem] tracking-wider mb-4 d-block">PESO MEDIO</span>
                    <span class="text-white font-black text-sm block" style="font-family:'IBM Plex Mono', monospace; color:var(--c-success);">${pesoMedio} kg</span>
                </div>
                <div class="card p-12 text-center" style="background:#111; border:1px solid #222;">
                    <span class="text-gray-500 font-950 uppercase text-[0.6rem] tracking-wider mb-4 d-block">CONTROL LECHERO MEDIO</span>
                    <span class="text-white font-black text-sm block" style="font-family:'IBM Plex Mono', monospace; color:var(--p-gold);">${lecheMedia} L</span>
                </div>
            </div>

            <!-- Buscador de Pesajes -->
            <div class="mb-15 relative">
                <input type="text" id="input-search-pesaje" class="wizard-input font-bold uppercase py-12 px-16 pr-40 text-sm" 
                       placeholder="BUSCAR POR CROTAL O ZONA..." value="${this._filtroBusqueda}" 
                       oninput="PesadasView._onSearchChange(this.value)">
                <div style="position:absolute; right:15px; top:50%; transform:translateY(-50%); pointer-events:none; color:var(--p-gold);">
                    ${Icons.buscar()}
                </div>
            </div>

            <!-- Historial de Pesajes -->
            <div class="card p-16" style="background:#141414; border:1px solid #222;">
                <h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-15 flex items-center gap-6">
                    ${Icons.historial()} HISTORIAL DE REGISTROS (${pesajesFiltrados.length})
                </h3>

                ${pesajesFiltrados.length === 0 ? `
                <div class="empty-state py-40 text-center">
                    <div class="empty-state-icon mb-10" style="color:var(--p-gold);">${Icons.balanza()}</div>
                    <p class="empty-state-text text-gray-500 font-bold uppercase text-xs">No hay pesajes que coincidan con la búsqueda.</p>
                </div>
                ` : `
                <div class="flex flex-col gap-10">
                    ${pesajesFiltrados.map(p => this._renderPesajeItem(p)).join('')}
                </div>
                `}
            </div>
        </div>
        `;
    },

    _renderPesajeItem(p) {
        const esLeche = p.unidad === 'L';
        const colorMedida = esLeche ? 'var(--p-gold)' : 'var(--c-success)';
        const iconoMedida = esLeche ? Icons.leche() : Icons.balanza();

        return `
        <div class="flex items-center justify-between p-12 rounded-sm border border-222" style="background:#0C0C0C; border: 1px solid #1c1c1c;">
            <div class="flex items-center gap-10">
                <div class="flex items-center justify-center rounded-sm" style="width:36px; height:36px; background:#181818; color:${colorMedida}; border:1px solid #222;">
                    ${iconoMedida}
                </div>
                <div>
                    <div class="text-xs font-black text-gold uppercase tracking-wider">${p.nombreAnimal}</div>
                    <div class="flex items-center gap-6 text-[0.6rem] font-bold text-gray-500 uppercase tracking-tight mt-2">
                        <span>${p.fecha}</span>
                        <span>•</span>
                        <span>${p.snap_zona || 'GENERAL'}</span>
                        <span>•</span>
                        <span class="text-gray-400 font-900">${(p.motivo_tarea || 'control').replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
            </div>
            
            <div class="text-right" style="font-family:'IBM Plex Mono', monospace;">
                <div class="text-sm font-black" style="color:${colorMedida};">${p.valor_neto} ${p.unidad}</div>
                ${p.peso_bruto && p.tara ? `<div class="text-[0.55rem] text-gray-500 font-bold">B: ${p.peso_bruto} | T: ${p.tara}</div>` : ''}
            </div>
        </div>
        `;
    },

    _onSearchChange(val) {
        this._filtroBusqueda = val;
        // Debounce simple o recarga rápida
        const main = document.getElementById('app-content');
        this._renderContenido(main);
    },

    async _iniciarPesaje(modo) {
        // Consultar animales de la finca para ver si hay alguno disponible
        const animales = await window.db.getAll('animales');
        const activos = animales.filter(a => a.estado === 'activo' || a.estado === 'Activo');

        if (activos.length === 0) {
            Toast.show('No hay animales activos registrados en esta finca para pesar', 'warn');
            return;
        }

        // Si es leche, filtrar hembras de especies productoras
        let opciones = activos;
        if (modo === 'leche') {
            opciones = activos.filter(a => 
                ['h','hembra'].includes((a.sexo||'').toLowerCase()) && 
                ['Vacas','Ovejas','Cabras'].includes(a.especie)
            );
            if (opciones.length === 0) {
                Toast.show('No hay hembras lecheras activas (Vacas, Ovejas, Cabras) en esta finca para control lechero', 'warn');
                return;
            }
        }

        // Abrir wizard de pesajes con el primer animal de muestra
        const animalId = opciones[0].id;
        if (window.PesajesUI) {
            window.PesajesUI.abrirWizard({
                modo: modo === 'leche' ? 'leche_individual' : 'control',
                motivo: 'control',
                animalId: animalId
            });
        } else {
            Toast.show('Error: Interfaz de pesajes no cargada', 'danger');
        }
    }
};

window.PesadasView = PesadasView;
