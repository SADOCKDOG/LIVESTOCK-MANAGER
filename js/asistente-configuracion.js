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
                    <p>Gestión ganadera profesional v3.2 Premium</p>
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
                        <button class="btn-primario" id="btn-importar-confirmar" disabled>
                            Importar Fincas
                        </button>
                        <button class="btn-secundario" id="btn-volver-importar">
                            Volver
                        </button>
                    </div>
                </div>

                <!-- Sección de Selección de Fincas Existentes -->
                <div id="asistente-seleccionar-finca" class="asistente-seccion" style="display: none;">
                    <div class="asistente-titulo-seccion">Seleccionar Finca Existente</div>
                    <div id="lista-fincas-existentes" class="asistente-lista-fincas"></div>
                    <div class="asistente-botones">
                        <button class="btn-secundario" id="btn-volver-seleccionar">
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
                if (!confirm('Se cargará la explotación de ejemplo "DEMO CHAMORRO" con datos en todos los módulos (animales, leche, ventas, gastos, sanidad, informes...).\n\n¿Continuar?')) return;

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

            const deseaSobrescribir = confirm("¿Deseas SOBRESCRIBIR completamente la base de datos con esta copia? \\n\\n[Aceptar] = Borrar los datos actuales y cargar el backup.\\n[Cancelar] = Mezclar los datos del backup con los datos actuales.");

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
                        alert("✅ Base de datos restaurada. Reiniciando...");
                        window.location.reload();
                    }
                } catch (err) {
                    alert("❌ Error crítico en restauración: " + err.message);
                    window.location.reload();
                }
            };
            reader.readAsText(archivo);

        } catch (error) {
            alert("❌ Error en Importación\n" + error.message);
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
        alert("✅ Finca seleccionada correctamente. Iniciando aplicación.");
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
                margin: 0;
                font-size: 15px;
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
