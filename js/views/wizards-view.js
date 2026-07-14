/**
 * Livestock Manager - WizardsView v1.0.0
 * Panel unificado ("Centro de Asistentes Rápidos") para acceder y lanzar todos los wizards del sistema.
 */

const WizardsView = {
    render() {
        const main = document.getElementById('app-content');
        
        main.innerHTML = `
        <div class="p-16 max-w-[900px] mx-auto animate-fade-in" style="min-height: calc(100vh - 120px);">
            <!-- Encabezado con estilo premium -->
            <div class="mb-20">
                <h1 class="text-xl font-black uppercase tracking-wider mb-2" style="font-family:'Archivo Expanded', sans-serif;">
                    <span style="color:var(--p-cork); margin-right:4px;">|</span> ${Icons.rebanos()} ASISTENTES OPERATIVOS
                </h1>
                <p class="text-xs font-bold uppercase tracking-tight text-gray-400 m-0">Acceso rápido a flujos de trabajo multi-paso guiados</p>
            </div>

            <!-- Categoría 1: Ganadería y Sanidad (Rojo Coral) -->
            <div class="mb-25">
                <h3 class="text-xs font-black uppercase tracking-widest mb-12 flex items-center gap-6" style="color:#E8555F;">
                    <span style="color:#E8555F;">|</span> ${Icons.sanidad()} GANADERÍA Y BIENESTAR ANIMAL
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <!-- Wizard Tratamiento -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #E8555F; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">TRATAMIENTO SANITARIO</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">REGISTRAR MEDICAMENTOS, DOSIS, TIEMPOS DE ESPERA Y SANIDAD.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('tratamiento')" style="min-height:36px; background:#E8555F; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>

                    <!-- Wizard Traslado -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #E8555F; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">TRASLADO DE ANIMALES</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">CAMBIAR ANIMALES DE LOTE, REBAÑO, PARCELA O ZONA DE EXPANSIÓN.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('traslado')" style="min-height:36px; background:#E8555F; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>

                    <!-- Wizard Censo -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #E8555F; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">CENSO ANUAL GANADO</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">DECLARACIÓN OFICIAL DE RECUENTO ANUAL DE CABEZAS DE GANADO.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('censo')" style="min-height:36px; background:#E8555F; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>
                </div>
            </div>

            <!-- Categoría 2: Explotación y Control Normativo (Verde Lima) -->
            <div class="mb-25">
                <h3 class="text-xs font-black uppercase tracking-widest mb-12 flex items-center gap-6" style="color:#C5FA50;">
                    <span style="color:#C5FA50;">|</span> ${Icons.explotacion()} GESTIÓN DE EXPLOTACIÓN (EXPRO)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <!-- Wizard Finca -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #C5FA50; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">ALTA / CONFIG. FINCA</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">REGISTRAR O EDITAR PARÁMETROS GENERALES Y REGA DE TU FINCA.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('finca')" style="min-height:36px; background:#C5FA50; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>

                    <!-- Wizard Pedido de Crotales -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #C5FA50; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">PEDIDO DE CROTALES</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">SOLICITUD DE NUEVAS CARAVANAS E IDENTIFICACIONES HOMOLOGADAS.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('crotales')" style="min-height:36px; background:#C5FA50; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>

                    <!-- Wizard Guía de Movimiento -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #C5FA50; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">GUÍA DE MOVIMIENTO (REGA)</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">GENERAR DOCUMENTO SANITARIO OFICIAL DE TRASLADO ENTRE REGA.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('guia-movimiento')" style="min-height:36px; background:#C5FA50; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>
                </div>
            </div>

            <!-- Categoría 3: Comercialización y Márgenes (Azul Cyan) -->
            <div class="mb-25">
                <h3 class="text-xs font-black uppercase tracking-widest mb-12 flex items-center gap-6" style="color:#4FADF5;">
                    <span style="color:#4FADF5;">|</span> ${Icons.comercial()} COMERCIALIZACIÓN Y FINANZAS (COMER)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <!-- Wizard Albarán Leche -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #4FADF5; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">ALBARÁN DE LECHE</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">REGISTRAR ENTREGAS DE LECHE, ANÁLISIS DE GRASA, PROTEÍNA Y PRECIO.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('leche')" style="min-height:36px; background:#4FADF5; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>

                    <!-- Wizard Imputación Gasto -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #4FADF5; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">REGISTRO DE GASTO</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">COMPRAS, ALIMENTACIÓN, ENERGÍA, PERSONAL O FITOSANITARIOS.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('gasto')" style="min-height:36px; background:#4FADF5; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>

                    <!-- Wizard Venta Masiva -->
                    <div class="card p-12 flex flex-col justify-between" style="background:#141414; border:1px solid #222; border-left:4px solid #4FADF5; min-height:140px;">
                        <div>
                            <div class="font-black text-xs uppercase tracking-wider text-white mb-4">VENTA MASIVA CARNE</div>
                            <p class="text-[0.65rem] text-gray-400 m-0 uppercase tracking-tight leading-normal font-medium">EXPEDICIÓN DE LOTES DE CARNE A MATADERO, FACTURA E IVA.</p>
                        </div>
                        <button class="btn btn-sm w-full mt-10 uppercase font-950 text-[0.65rem]" onclick="WizardsView._lanzar('venta-masiva')" style="min-height:36px; background:#4FADF5; color:#000;">
                            INICIAR FLUJO
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    _lanzar(wizardKey) {
        try {
            switch(wizardKey) {
                case 'tratamiento':
                    if (window.WizardTratamiento) window.WizardTratamiento.abrir();
                    else Toast.show('Wizard Tratamiento no disponible', 'danger');
                    break;
                case 'traslado':
                    if (window.WizardTraslado) window.WizardTraslado.abrir();
                    else Toast.show('Wizard Traslado no disponible', 'danger');
                    break;
                case 'censo':
                    if (window.WizardCenso) window.WizardCenso.abrir();
                    else Toast.show('Wizard Censo no disponible', 'danger');
                    break;
                case 'finca':
                    if (window.WizardFinca) window.WizardFinca.showForm();
                    else Toast.show('Wizard Finca no disponible', 'danger');
                    break;
                case 'crotales':
                    if (window.WizardCrotales) window.WizardCrotales.abrir();
                    else Toast.show('Wizard Crotales no disponible', 'danger');
                    break;
                case 'guia-movimiento':
                    if (window.WizardGuiaMovimiento) window.WizardGuiaMovimiento.abrir();
                    else Toast.show('Wizard Guía de Movimiento no disponible', 'danger');
                    break;
                case 'leche':
                    if (window.AlbaranLecheWizard) window.AlbaranLecheWizard.open();
                    else Toast.show('Wizard de Leche no disponible', 'danger');
                    break;
                case 'gasto':
                    if (window.GastoWizard) window.GastoWizard.open();
                    else Toast.show('Wizard de Gasto no disponible', 'danger');
                    break;
                case 'venta-masiva':
                    if (window.VentaMasivaWizard) window.VentaMasivaWizard.open();
                    else Toast.show('Wizard de Venta Masiva no disponible', 'danger');
                    break;
                default:
                    Toast.show('Asistente desconocido', 'danger');
            }
        } catch (e) {
            console.error('[WizardsView] Error launching wizard:', e);
            Toast.show('Error al lanzar el asistente: ' + e.message, 'danger');
        }
    }
};

window.WizardsView = WizardsView;
