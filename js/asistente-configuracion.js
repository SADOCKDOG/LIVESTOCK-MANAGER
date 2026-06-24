/**
 * Asistente de Configuración Inicial
 * Permite importar fincas desde backup o crear nuevas manualmente
 */

const AsistenteConfiguracion = {
    /**
     * Mostrar ventana de bienvenida/configuración inicial
     * @returns {Promise<void>}
     */
    async mostrarAsistente() {
        const contenedor = document.createElement('div');
        contenedor.id = 'asistente-configuracion-contenedor';
        contenedor.innerHTML = `
            <div class="asistente-configuracion">
                <div class="asistente-cabecera">
                    <img src="icons/Logo aplicación.png" alt="Livestock Manager" style="height: 50px; margin-bottom: 25px; object-fit: contain;">
                    <h1>Bienvenido</h1>
                    <p>Gestión ganadera profesional v4.5.0 Premium</p>
                    <button class="btn-tour" id="btn-iniciar-tour">
                        💡 Primeros pasos
                    </button>
                </div>

                <div class="asistente-opciones">
                    <!-- Opción 1: Importar desde Backup -->
                    <button class="asistente-opcion" id="btn-importar">
                        <div class="asistente-icono">📥</div>
                        <div class="asistente-info-opcion">
                            <div class="asistente-titulo">Importar Backup</div>
                            <div class="asistente-descripcion">Restaura tu base de datos desde un archivo JSON</div>
                        </div>
                    </button>

                    <!-- Opción 2: Crear Nueva Finca -->
                    <button class="asistente-opcion" id="btn-crear">
                        <div class="asistente-icono">➕</div>
                        <div class="asistente-info-opcion">
                            <div class="asistente-titulo">Nueva Finca</div>
                            <div class="asistente-descripcion">Configura una explotación desde cero</div>
                        </div>
                    </button>

                    <!-- Opción Demo: Cargar explotación de ejemplo -->
                    <button class="asistente-opcion" id="btn-demo">
                        <div class="asistente-icono">🐄</div>
                        <div class="asistente-info-opcion">
                            <div class="asistente-titulo">Cargar Demo CHAMORRO</div>
                            <div class="asistente-descripcion">Explora la app con una explotación de ejemplo con datos en todos los módulos</div>
                        </div>
                    </button>

                    <!-- Opción 3: Ver Fincas Existentes -->
                    <button class="asistente-opcion" id="btn-seleccionar" style="display: none;">
                        <div class="asistente-icono">📋</div>
                        <div class="asistente-info-opcion">
                            <div class="asistente-titulo">Seleccionar Finca</div>
                            <div class="asistente-descripcion">Cambiar a una finca ya registrada</div>
                        </div>
                    </button>
                </div>

                <!-- Sección de Carga de Archivo -->
                <div id="asistente-carga-archivo" class="asistente-seccion" style="display: none;">
                    <div class="asistente-titulo-seccion">Cargar Backup JSON</div>
                    <input 
                        type="file" 
                        id="entrada-archivo" 
                        accept=".json"
                        style="display: none;"
                    />
                    <div class="asistente-carga-zona">
                        <button class="btn-carga" id="btn-seleccionar-archivo">
                            Seleccionar archivo
                        </button>
                        <p id="nombre-archivo-seleccionado" class="asistente-archivo-nombre"></p>
                    </div>
                    <div id="asistente-progreso" class="asistente-progreso" style="display: none;">
                        <div class="asistente-barra-progreso">
                            <div class="asistente-barra-lleno"></div>
                        </div>
                        <p id="texto-progreso">Importando...</p>
                    </div>
                    <div id="asistente-resultado" class="asistente-resultado" style="display: none;"></div>
                    <div class="asistente-botones">
                        <button class="btn btn--inline btn--primary" id="btn-importar-confirmar" disabled>
                            Importar Fincas
                        </button>
                        <button class="btn btn--inline btn--secondary" id="btn-volver-importar">
                            Volver
                        </button>
                    </div>
                </div>

                <!-- Sección de Selección de Fincas Existentes -->
                <div id="asistente-seleccionar-finca" class="asistente-seccion" style="display: none;">
                    <div class="asistente-titulo-seccion">Seleccionar Finca Existente</div>
                    <div id="lista-fincas-existentes" class="asistente-lista-fincas"></div>
                    <div class="asistente-botones">
                        <button class="btn btn--inline btn--secondary" id="btn-volver-seleccionar">
                            Volver
                        </button>
                    </div>
                </div>

                <!-- Mensajes -->
                <div id="asistente-mensaje" class="asistente-mensaje" style="display: none;"></div>
            </div>
        `;

        this._aplicarEstilos(contenedor);
        document.body.appendChild(contenedor);

        // Asignar event listeners
        this._asignarEventos(contenedor);

        // Verificar si hay fincas existentes
        const fincas = await Fincas.list();
        if (fincas.length > 0) {
            document.querySelector('#btn-seleccionar').style.display = 'flex';
        }
    },

    /**
     * Asignar event listeners a botones
     */
    _asignarEventos(contenedor) {
        const btnImportar = contenedor.querySelector('#btn-importar');
        const btnCrear = contenedor.querySelector('#btn-crear');
        const btnSeleccionar = contenedor.querySelector('#btn-seleccionar');
        const btnSeleccionarArchivo = contenedor.querySelector('#btn-seleccionar-archivo');
        const entradaArchivo = contenedor.querySelector('#entrada-archivo');
        const btnImportarConfirmar = contenedor.querySelector('#btn-importar-confirmar');
        const btnVolverImportar = contenedor.querySelector('#btn-volver-importar');
        const btnVolverSeleccionar = contenedor.querySelector('#btn-volver-seleccionar');

        // Botón Iniciar Tour
        const btnTour = contenedor.querySelector('#btn-iniciar-tour');
        if (btnTour) {
            btnTour.addEventListener('click', () => {
                this._mostrarTourInicio(contenedor);
            });
        }

        // Opción: Importar desde Backup
        btnImportar.addEventListener('click', () => {
            contenedor.querySelector('.asistente-opciones').style.display = 'none';
            contenedor.querySelector('#asistente-carga-archivo').style.display = 'block';
        });

        // Opción: Crear Nueva Finca
        btnCrear.addEventListener('click', () => {
            contenedor.remove();
            this._mostrarFormularioCrear();
        });

        // Opción: Cargar Demo CHAMORRO
        const btnDemo = contenedor.querySelector('#btn-demo');
        if (btnDemo) {
            btnDemo.addEventListener('click', async () => {
                if (!await Confirm.confirm("Cargar Demo", 'Se cargará la explotación de ejemplo "DEMO CHAMORRO" con datos en todos los módulos (animales, leche, ventas, gastos, sanidad, informes...).\n\n¿Continuar?', false)) return;

                const opciones = contenedor.querySelector('.asistente-opciones');
                const mensaje = contenedor.querySelector('#asistente-mensaje');
                opciones.style.display = 'none';
                mensaje.style.display = 'block';
                mensaje.innerHTML = '<div class="text-gold" style="text-align:center; padding:30px 10px; font-weight:700;">⏳ Cargando datos de la demo...<br><span class="text-gray" style="font-size:0.8rem; font-weight:400;">Esto puede tardar unos segundos.</span></div>';

                try {
                    if (window.SeedData && typeof window.SeedData.run === 'function') {
                        await window.SeedData.run(true);
                        window.location.reload();
                    } else {
                        throw new Error('Módulo de datos demo no disponible.');
                    }
                } catch (err) {
                    mensaje.innerHTML = '<div style="text-align:center; padding:30px 10px; font-weight:700;" class="text-red">❌ Error cargando la demo:<br><span style="font-size:0.8rem; font-weight:400;">' + (err.message || err) + '</span></div>';
                    opciones.style.display = 'flex';
                }
            });
        }

        // Opción: Seleccionar Finca Existente
        if (btnSeleccionar) {
            btnSeleccionar.addEventListener('click', () => {
                contenedor.querySelector('.asistente-opciones').style.display = 'none';
                contenedor.querySelector('#asistente-seleccionar-finca').style.display = 'block';
                this._cargarFincasExistentes(contenedor);
            });
        }

        // Selector de archivo
        btnSeleccionarArchivo.addEventListener('click', () => {
            entradaArchivo.click();
        });

        entradaArchivo.addEventListener('change', (e) => {
            const archivo = e.target.files[0];
            if (archivo) {
                const nombreElement = contenedor.querySelector('#nombre-archivo-seleccionado');
                nombreElement.textContent = `Archivo: ${archivo.name}`;
                btnImportarConfirmar.disabled = false;
            }
        });

        // Confirmar importación
        btnImportarConfirmar.addEventListener('click', () => {
            const archivo = entradaArchivo.files[0];
            if (archivo) {
                this._procesarImportacion(contenedor, archivo);
            }
        });

        // Botones Volver
        btnVolverImportar.addEventListener('click', () => {
            contenedor.querySelector('.asistente-opciones').style.display = 'flex';
            contenedor.querySelector('#asistente-carga-archivo').style.display = 'none';
            entradaArchivo.value = '';
            btnImportarConfirmar.disabled = true;
        });

        btnVolverSeleccionar.addEventListener('click', () => {
            contenedor.querySelector('.asistente-opciones').style.display = 'flex';
            contenedor.querySelector('#asistente-seleccionar-finca').style.display = 'none';
        });
    },

    /**
     * Procesar importación de archivo backup
     */
    async _procesarImportacion(contenedor, archivo) {
        try {
            const progreso = contenedor.querySelector('#asistente-progreso');
            const textProgreso = contenedor.querySelector('#texto-progreso');
            const btnConfirmar = contenedor.querySelector('#btn-importar-confirmar');

            const deseaSobrescribir = await Confirm.confirm(
                "Restaurar Copia de Seguridad",
                "¿Deseas SOBRESCRIBIR completamente la base de datos con esta copia?\n\n[Aceptar] = Borrar los datos actuales y cargar el backup.\n[Cancelar] = Mezclar los datos del backup con los datos actuales.",
                true,
                "Sobrescribir",
                "Mezclar"
            );

            progreso.style.display = 'block';
            btnConfirmar.disabled = true;
            textProgreso.textContent = 'Restaurando base de datos...';

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const contenido = e.target.result;
                    const res = await window.Trazabilidad.importarBackupData(window.db, contenido, deseaSobrescribir);

                    if (res.multiplesFincas) {
                        textProgreso.textContent = 'Múltiples fincas detectadas. Selecciona la activa.';
                        this._mostrarWizardSeleccionFinca(res.fincas, contenedor);
                    } else {
                        await window.Fincas.setActiveId(res.fincas[0].id);
                        await Confirm.alert("Copia de Seguridad Restaurada", "Base de datos restaurada correctamente. Reiniciando...");
                        window.location.reload();
                    }
                } catch (err) {
                    await Confirm.alert("Error Crítico", "Error crítico en restauración: " + err.message);
                    window.location.reload();
                }
            };
            reader.readAsText(archivo);

        } catch (error) {
            await Confirm.alert("Error de Importación", "Error en Importación: " + error.message);
            window.location.reload();
        }
    },

    /**
     * Wizard para seleccionar finca activa (Rule 4)
     */
    _mostrarWizardSeleccionFinca(fincas, contenedor) {
        const opciones = contenedor.querySelector('.asistente-opciones');
        const cargaArea = contenedor.querySelector('#asistente-carga-archivo');
        const progreso = contenedor.querySelector('#asistente-progreso');

        progreso.style.display = 'none';
        cargaArea.style.display = 'none';
        opciones.style.display = 'flex';
        opciones.innerHTML = `
            <div style="width:100%; text-align:center; padding:10px;">
                <h3 class="text-gold" style="margin-top:0;">Selecciona Finca Activa</h3>
                <p class="text-ccc text-85" style="margin-bottom:15px;">El backup contiene varias fincas. ¿Con cuál deseas empezar?</p>
                <div style="display:grid; gap:10px; max-height:250px; overflow-y:auto; padding:5px;">
                    ${fincas.map(f => `
                        <button class="btn btn-secondary" onclick="window.AsistenteConfiguracion._finalizarConFinca(${f.id})" style="text-align:left; padding:12px; display:flex; flex-direction:column; gap:2px; background:#222; border:1px solid #444; width:100%;">
                            <strong class="text-gold">${f.nombre}</strong>
                            <span class="text-2xs text-gray">Propietario: ${f.propietario}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async _finalizarConFinca(id) {
        await window.Fincas.setActiveId(id);
        await Confirm.alert("Finca Seleccionada", "Finca seleccionada correctamente. Iniciando aplicación.");
        window.location.reload();
    },

    /**
     * Cargar fincas existentes en la lista
     */
    async _cargarFincasExistentes(contenedor) {
        try {
            const fincas = await Fincas.list();
            const listaElement = contenedor.querySelector('#lista-fincas-existentes');

            if (fincas.length === 0) {
                listaElement.innerHTML = '<p style="text-align: center; color: #999;">No hay fincas</p>';
                return;
            }

            listaElement.innerHTML = fincas.map(f => `
                <button class="asistente-finca-item" data-finca-id="${f.id}">
                    <div class="asistente-finca-nombre">${f.nombre}</div>
                    <div class="asistente-finca-propietario">${f.propietario}</div>
                </button>
            `).join('');

            // Asignar listeners a items de finca
            listaElement.querySelectorAll('.asistente-finca-item').forEach(item => {
                item.addEventListener('click', async (e) => {
                    const fincaId = parseInt(item.dataset.fincaId);
                    await Fincas.setActiveId(fincaId);
                    this._cerrarYContinuar(contenedor);
                });
            });

        } catch (error) {
            console.error('Error cargando fincas:', error);
        }
    },

    /**
     * Mostrar formulario para crear nueva finca
     */
    _mostrarFormularioCrear() {
        const contenedor = document.getElementById('asistente-configuracion-contenedor');
        if (contenedor) {
            contenedor.remove();
        }

        const formElement = FormularioFinca.crear(
            async (datos) => {
                try {
                    const fincaId = await Fincas.crearNueva(datos);
                    await Fincas.setActiveId(fincaId);
                    // Continuar
                    this._cerrarYContinuar(null); // el modal ya se cierra auto en FormularioFinca
                } catch (error) {
                    throw error;
                }
            },
            () => {
                // Volver a asistente
                this.mostrarAsistente();
            }
        );
        document.body.appendChild(formElement);
    },

    /**
     * Cerrar asistente y continuar a app
     */
    _cerrarYContinuar(contenedor) {
        if (contenedor) {
            contenedor.remove();
        }
        // Redirigir al inicio y forzar recarga si es necesario o reinicializar
        window.location.hash = '#/';
        if (window.App && typeof window.App.init === 'function') {
            window.App.init();
        } else {
            window.location.reload();
        }
    },

    /**
     * Tour de inicio flotante: guía al usuario en sus primeros pasos
     */
    _mostrarTourInicio(contenedor) {
        const existente = document.getElementById('tour-flotante-overlay');
        if (existente) existente.remove();

        const pasos = [
            {
                icono: '👋',
                titulo: 'Bienvenido a Livestock Manager',
                texto: 'Plataforma profesional de gestión ganadera con trazabilidad industrial, control lechero, comercialización y centro de informes premium.\n\nTodo funciona 100% offline en tu dispositivo.',
                accion: null
            },
            {
                icono: '🐄',
                titulo: 'Explorar la Demo',
                texto: 'Prueba la app sin riesgos cargando la explotación de ejemplo "Ganadería Chamorro". Incluye animales, rebaños, pesajes, ventas, gastos, sanidad e informes completos.',
                accion: { texto: '🚀 Cargar Demo', metodo: 'cargarDemo' }
            },
            {
                icono: '📖',
                titulo: 'Manuales de Usuario',
                texto: 'La app incluye 8 manuales interactivos con capturas paso a paso: General, Ovino de Carne, Ovino de Leche, Producción, Comercialización, Pesadas, Control Lechero y Gastos.',
                accion: { texto: '📚 Abrir Manuales', metodo: 'abrirManuales' }
            },
            {
                icono: '🚀',
                titulo: '¡Manos a la obra!',
                texto: 'Elige cómo empezar:\n\n📥 Importa una copia de seguridad existente.\n➕ Crea una nueva explotación desde cero.\n🐄 Carga la demo para explorar todas las funcionalidades.\n📖 Consulta los manuales cuando necesites ayuda.',
                accion: null
            }
        ];

        let pasoActual = 0;

        const overlay = document.createElement('div');
        overlay.id = 'tour-flotante-overlay';
        overlay.innerHTML = `
            <div class="tour-flotante-backdrop"></div>
            <div class="tour-flotante-card" id="tour-card">
                <button class="tour-btn-cerrar" id="tour-cerrar">✕</button>
                <div class="tour-body" id="tour-body">
                    <div class="tour-icono">${pasos[0].icono}</div>
                    <h3 class="tour-titulo">${pasos[0].titulo}</h3>
                    <p class="tour-texto">${pasos[0].texto.replace(/\n/g, '<br>')}</p>
                    <div class="tour-accion" id="tour-accion"></div>
                </div>
                <div class="tour-footer">
                    <button class="tour-btn tour-btn-prev" id="tour-prev" disabled>← Anterior</button>
                    <div class="tour-dots" id="tour-dots">
                        ${pasos.map((_, i) => `<span class="tour-dot ${i === 0 ? 'activo' : ''}" data-index="${i}"></span>`).join('')}
                    </div>
                    <button class="tour-btn tour-btn-next" id="tour-next">Siguiente →</button>
                    <button class="tour-btn tour-btn-fin" id="tour-fin" style="display:none;">✓ ¡Comenzar!</button>
                </div>
            </div>
        `;

        const renderPaso = (idx) => {
            const paso = pasos[idx];
            const accionDiv = overlay.querySelector('#tour-accion');
            const prevBtn = overlay.querySelector('#tour-prev');
            const nextBtn = overlay.querySelector('#tour-next');
            const finBtn = overlay.querySelector('#tour-fin');
            const dots = overlay.querySelectorAll('.tour-dot');

            overlay.querySelector('#tour-body .tour-icono').textContent = paso.icono;
            overlay.querySelector('#tour-body .tour-titulo').textContent = paso.titulo;
            overlay.querySelector('#tour-body .tour-texto').innerHTML = paso.texto.replace(/\n/g, '<br>');

            accionDiv.innerHTML = '';
            if (paso.accion) {
                const btnAccion = document.createElement('button');
                btnAccion.className = 'tour-btn-accion';
                btnAccion.textContent = paso.accion.texto;
                btnAccion.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._ejecutarAccionTour(paso.accion.metodo, contenedor);
                });
                accionDiv.appendChild(btnAccion);
            }

            prevBtn.disabled = idx === 0;
            prevBtn.style.opacity = idx === 0 ? '0.4' : '1';
            if (idx < pasos.length - 1) {
                nextBtn.style.display = 'inline-block';
                finBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'none';
                finBtn.style.display = 'inline-block';
            }

            dots.forEach((dot, i) => {
                dot.classList.toggle('activo', i === idx);
            });
        };

        overlay.querySelector('#tour-next').addEventListener('click', () => {
            if (pasoActual < pasos.length - 1) {
                pasoActual++;
                renderPaso(pasoActual);
            }
        });
        overlay.querySelector('#tour-prev').addEventListener('click', () => {
            if (pasoActual > 0) {
                pasoActual--;
                renderPaso(pasoActual);
            }
        });
        overlay.querySelector('#tour-fin').addEventListener('click', () => {
            overlay.remove();
        });
        overlay.querySelector('#tour-cerrar').addEventListener('click', () => {
            overlay.remove();
        });
        overlay.querySelector('.tour-flotante-backdrop').addEventListener('click', () => {
            overlay.remove();
        });

        this._aplicarEstilosTour(overlay);
        document.body.appendChild(overlay);
    },

    /** Ejecuta acciones contextuales del tour */
    async _ejecutarAccionTour(metodo, contenedor) {
        const overlay = document.getElementById('tour-flotante-overlay');
        if (overlay) overlay.remove();
        if (contenedor) contenedor.remove();

        switch (metodo) {
            case 'cargarDemo':
                if (window.SeedData && typeof window.SeedData.run === 'function') {
                    if (!await Confirm.confirm("Cargar Demo", '¿Cargar la explotación de ejemplo "DEMO CHAMORRO"? Se añadirán datos de ejemplo en todos los módulos.', false)) return;
                    const msgDiv = document.createElement('div');
                    msgDiv.style.cssText = 'position:fixed; inset:0; z-index:9999; background:#000; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:15px;';
                    msgDiv.innerHTML = '<div style="font-size:2rem;">⏳</div><div style="color:#d97706; font-weight:700;">Cargando datos demo...</div><div style="color:#888; font-size:0.8rem;">Esto puede tardar unos segundos.</div>';
                    document.body.appendChild(msgDiv);
                    setTimeout(async () => {
                        try {
                            await window.SeedData.run(true);
                            window.location.reload();
                        } catch (e) {
                            await Confirm.alert("Error", 'Error: ' + e.message);
                            window.location.reload();
                        }
                    }, 300);
                } else {
                    await Confirm.alert("Error", 'Módulo de datos demo no disponible.');
                }
                break;

            case 'abrirManuales':
                window.location.hash = '#/ajustes';
                if (window.App && typeof window.App.renderAjustes === 'function') {
                    window.App.renderAjustes();
                    setTimeout(() => {
                        if (window.ManualesView && typeof window.ManualesView.render === 'function') {
                            window.ManualesView.render();
                        }
                    }, 500);
                }
                break;
        }
    },

    /**
     * Aplicar estilos al tour flotante
     */
    _aplicarEstilosTour(overlay) {
        const estilo = document.createElement('style');
        estilo.textContent = `
            #tour-flotante-overlay {
                position: fixed;
                inset: 0;
                z-index: 4000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .tour-flotante-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.75);
                backdrop-filter: blur(4px);
            }
            .tour-flotante-card {
                position: relative;
                background: #0d0d0d;
                border: 1px solid #222;
                border-radius: 24px;
                width: 90%;
                max-width: 420px;
                max-height: 90vh;
                box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,119,6,0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: tourEntrada 0.35s ease-out;
            }
            @keyframes tourEntrada {
                from { opacity: 0; transform: scale(0.92) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .tour-btn-cerrar {
                position: absolute;
                top: 12px;
                right: 14px;
                background: rgba(255,255,255,0.06);
                border: none;
                color: #888;
                font-size: 1.1rem;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            .tour-btn-cerrar:hover {
                background: rgba(255,255,255,0.15);
                color: #fff;
            }
            .tour-body {
                padding: 40px 28px 20px;
                text-align: center;
                flex: 1;
                overflow-y: auto;
            }
            .tour-icono {
                font-size: 3.2rem;
                margin-bottom: 16px;
                display: block;
            }
            .tour-titulo {
                color: #fff;
                font-size: 1.3rem;
                font-weight: 800;
                margin: 0 0 14px 0;
                letter-spacing: -0.3px;
            }
            .tour-texto {
                color: #aaa;
                font-size: 0.9rem;
                line-height: 1.65;
                margin: 0 0 18px 0;
            }
            .tour-accion {
                margin: 10px 0;
            }
            .tour-btn-accion {
                background: linear-gradient(135deg, #d97706, #b45309);
                color: #fff;
                border: none;
                padding: 14px 28px;
                border-radius: 14px;
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
                max-width: 260px;
                box-shadow: 0 4px 15px rgba(217,119,6,0.3);
            }
            .tour-btn-accion:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(217,119,6,0.5);
            }
            .tour-btn-accion:active {
                transform: scale(0.97);
            }
            .tour-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 24px 20px;
                border-top: 1px solid #1a1a1a;
            }
            .tour-btn {
                background: rgba(255,255,255,0.06);
                border: 1px solid #333;
                color: #ddd;
                padding: 10px 18px;
                border-radius: 12px;
                font-size: 0.82rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 90px;
            }
            .tour-btn:disabled {
                cursor: default;
            }
            .tour-btn:not(:disabled):hover {
                background: rgba(255,255,255,0.12);
                border-color: #d97706;
                color: #fff;
            }
            .tour-btn-fin {
                background: linear-gradient(135deg, #059669, #047857);
                border: none;
                color: #fff;
                box-shadow: 0 4px 15px rgba(5,150,105,0.3);
            }
            .tour-btn-fin:not(:disabled):hover {
                background: linear-gradient(135deg, #10b981, #059669);
                box-shadow: 0 6px 25px rgba(5,150,105,0.5);
            }
            .tour-dots {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .tour-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #333;
                transition: all 0.3s;
                cursor: pointer;
            }
            .tour-dot.activo {
                background: #d97706;
                box-shadow: 0 0 8px rgba(217,119,6,0.5);
                transform: scale(1.3);
            }
            @media (max-width: 480px) {
                .tour-flotante-card { width: 94%; border-radius: 20px; }
                .tour-body { padding: 32px 20px 16px; }
                .tour-icono { font-size: 2.6rem; }
                .tour-titulo { font-size: 1.15rem; }
                .tour-btn { padding: 8px 14px; min-width: 70px; font-size: 0.75rem; }
                .tour-btn-accion { padding: 12px 20px; font-size: 0.9rem; }
            }
        `;
        overlay.appendChild(estilo);
    },

    /**
     * Aplicar estilos al asistente
     */
    _aplicarEstilos(contenedor) {
        const estilo = document.createElement('style');
        estilo.textContent = `
            #asistente-configuracion-contenedor {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #000000;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }

            .asistente-configuracion {
                background: #0a0a0a;
                border-radius: 0;
                box-shadow: none;
                width: 100%;
                height: 100%;
                max-width: none;
                max-height: none;
                padding: 40px 25px;
                overflow-y: auto;
                border: none;
                color: #ffffff;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }

            .asistente-cabecera {
                text-align: center;
                margin-bottom: 35px;
            }

            .asistente-cabecera h1 {
                font-size: 26px;
                color: #ffffff;
                margin: 0 0 12px 0;
                font-weight: 800;
                letter-spacing: -0.5px;
            }

            .asistente-cabecera p {
                color: #888;
                margin: 0 0 16px 0;
                font-size: 15px;
            }

            .btn-tour {
                background: rgba(217,119,6,0.12);
                border: 1px solid rgba(217,119,6,0.3);
                color: #d97706;
                padding: 10px 24px;
                border-radius: 14px;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.25s ease;
            }
            .btn-tour:hover {
                background: rgba(217,119,6,0.22);
                border-color: #d97706;
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(217,119,6,0.2);
            }

            .asistente-opciones {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-bottom: 25px;
            }

            .asistente-opcion {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 20px;
                border: 1px solid #222;
                border-radius: 16px;
                background: #111;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
                width: 100%;
            }

            .asistente-opcion:hover {
                border-color: #d97706;
                background: #161616;
                transform: scale(1.02);
            }

            .asistente-icono {
                font-size: 32px;
                margin-right: 20px;
                background: #1a1a1a;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
            }

            .asistente-info-opcion {
                flex: 1;
            }

            .asistente-titulo {
                font-size: 17px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 4px;
            }

            .asistente-descripcion {
                font-size: 13px;
                color: #777;
                line-height: 1.4;
            }

            .asistente-seccion {
                margin-top: 20px;
                animation: fadeIn 0.3s ease-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .asistente-titulo-seccion {
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 20px;
                text-align: center;
            }

            .asistente-carga-zona {
                border: 2px dashed #333;
                border-radius: 16px;
                padding: 30px;
                text-align: center;
                margin-bottom: 20px;
                background: #0a0a0a;
                transition: border-color 0.3s;
            }

            .asistente-carga-zona:hover {
                border-color: #d97706;
            }

            .btn-carga {
                padding: 12px 24px;
                background: #d97706;
                color: white;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
            }

            .asistente-archivo-nombre {
                color: #fbbf24;
                font-size: 13px;
                margin-top: 15px;
                font-weight: 500;
            }

            .asistente-progreso {
                margin-bottom: 20px;
            }

            .asistente-barra-progreso {
                height: 6px;
                background: #222;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 12px;
            }

            .asistente-barra-lleno {
                height: 100%;
                background: linear-gradient(to right, #b45309, #f59e0b);
                animation: progreso 2s infinite ease-in-out;
                width: 30%;
            }

            @keyframes progreso {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(400%); }
            }

            .asistente-lista-fincas {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }

            .asistente-finca-item {
                padding: 18px;
                border: 1px solid #222;
                border-radius: 14px;
                background: #111;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
            }

            .asistente-finca-item:hover {
                background: #1a1a1a;
                border-color: #d97706;
            }

            .asistente-finca-nombre {
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 4px;
                font-size: 16px;
            }

            .asistente-finca-propietario {
                font-size: 13px;
                color: #888;
            }

            .asistente-botones {
                display: flex;
                gap: 12px;
                margin-top: 20px;
            }

            .btn-primario,
            .btn-secundario {
                flex: 1;
                padding: 14px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 700;
                font-size: 15px;
                transition: all 0.2s;
            }

            .btn-primario {
                background: #d97706;
                color: white;
            }

            .btn-primario:hover:not(:disabled) {
                background: #b45309;
                transform: translateY(-1px);
            }

            .btn-primario:disabled {
                background: #222;
                color: #555;
                cursor: not-allowed;
            }

            .btn-secundario {
                background: #1a1a1a;
                color: #eee;
                border: 1px solid #333;
            }

            .btn-secundario:hover {
                background: #222;
            }

            @media (max-width: 600px) {
                .asistente-configuracion {
                    width: 100%;
                    height: 100%;
                    max-height: 100vh;
                    border-radius: 0;
                    padding: 25px;
                }
            }
        `;
        contenedor.appendChild(estilo);
    }
};

window.AsistenteConfiguracion = AsistenteConfiguracion;
