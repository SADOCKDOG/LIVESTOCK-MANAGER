/**
 * LIFESTOCK MANAGER - INTERFAZ DEL GESTOR DE PESAJES (v1.1.0)
 * UI dinámica para captura de pesajes, expediciones y producción.
 * v1.1.0: Soportar modo leche (litros) correctamente
 */

const PesajesUI = {
    /**
     * Abre el Wizard de pesaje adaptado al motivo
     * @param {Object} config { motivo, modo, rebanoId, animalId, esAltaNueva }
     *   - motivo: 'control'|'expedicion'|'entrada'
     *   - modo: 'carne_ind'|'carne_lote'|'leche_ind'|'leche_lote'|'leche_tanque'
     */
    async abrirWizard(config) {
        // Detectar si es modo leche (tanto por config.modo como config.motivo)
        const modoStr = config.modo || config.motivo || '';
        const esModoLeche = modoStr.startsWith('leche_');

        // Si es expedición de tanque, redirigir al wizard específico de albarán leche
        if (modoStr === 'leche_tanque') {
            window._pesajesWizardActivo = false;
            const overlay = document.getElementById('wizard-pesaje-overlay');
            if (overlay) overlay.remove();
            if (window.App && window.App._abrirWizardAlbaranLeche) {
                window.App._abrirWizardAlbaranLeche();
            } else {
                window.App.toastError("Error: Wizard de leche no disponible");
            }
            return;
        }

        const { motivo, rebanoId, animalId, esAltaNueva } = config;

        let titulo = "Gestor de Pesajes";
        let subtitulo = "";
        let entidades = [];
        let rebano = null;
        let rebanosCompatibles = [];

        // Cargar datos según contexto
        if (rebanoId) {
            rebano = await Rebanos.get(rebanoId);
            if (esModoLeche) {
                entidades = await Animales.list(rebanoId);
                entidades = entidades.filter(a => ['h','hembra'].includes((a.sexo||'').toLowerCase()) && ['Vacas','Ovejas','Cabras'].includes(a.especie));
                titulo = `${Icons.leche()} CONTROL LECHERO LOTE`;
                subtitulo = `${rebano.nombre} | ${rebano.especie} (${rebano.tipo})`;
            } else {
                entidades = await Animales.list(rebanoId);
                titulo = motivo === 'expedicion' ? `${Icons.paquete()} EXPEDICIÓN LOTE` : `${Icons.balanza()} PESAJE DE LOTE`;
                subtitulo = `${rebano.nombre} | ${rebano.especie} (${rebano.tipo})`;
            }
        } else if (animalId) {
            const animal = await Animales.get(animalId);
            entidades = [animal];
            if (esModoLeche) {
                titulo = `${Icons.leche()} CONTROL LECHERO INDIVIDUAL`;
                subtitulo = animal.numero_identificacion;
                // Para leche individual, filtrar si no es hembra lechera
                if (!['h','hembra'].includes((animal.sexo||'').toLowerCase()) || !['Vacas','Ovejas','Cabras'].includes(animal.especie)) {
                    window.App.toastError("El animal seleccionado no es una hembra lechera");
                    return;
                }
            } else {
                titulo = esAltaNueva ? `${Icons.balanza()} PESAJE INICIAL (ALTA)` : `${Icons.balanza()} PESAJE INDIVIDUAL`;
                subtitulo = animal.numero_identificacion;
            }

            if (esAltaNueva || !animal.rebanoId) {
                const todosRebanos = await Rebanos.list();
                rebanosCompatibles = todosRebanos.filter(r => r.especie === animal.especie);
            } else {
                rebano = await Rebanos.get(animal.rebanoId);
            }
        }

        // Si modo leche y no hay entidades, mostrar error y salir
        if (esModoLeche && entidades.length === 0) {
            window.App.toastError("No hay hembras lecheras en este rebaño");
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = "wizard-pesaje-overlay";
        overlay.className = "wizard-full-screen";
        overlay.style.zIndex = "5000";

        // Acumulador de pesajes para modo lote
        const _pesajesLote = [];
        const esModoLote = entidades.length > 1;

        // Label y unidad según modo
        const unidadLabel = esModoLeche ? "VOLUMEN (L)" : "PESO (KG)";
        const unidadAbreviada = esModoLeche ? "L" : "kg";
        const unidadColor = esModoLeche ? "#fbbf24" : "#10b981";
        const tituloUnidad = esModoLeche ? "Litros" : "KG";

        const renderWizard = async () => {
            // Marcar que el wizard de pesajes está activo para evitar re-renders
            window._pesajesWizardActivo = true;
            const isLogistico = (motivo === 'expedicion' || motivo === 'entrada') && !esModoLeche;
            let necesitaAsignacion = (esAltaNueva || (animalId && !rebano)) && !esModoLeche;

            // Para leche, obtener historial de producción anterior
            for (let a of entidades) {
                if (esModoLeche) {
                    try {
                        const hist = await Produccion.listLeche(await Fincas.getActiveId());
                        const regs = hist.filter(h => Number(h.vacaId) === Number(a.id));
                        a.pesoAnterior = regs.length > 0 ? regs.sort((x,y) => new Date(y.fecha)-new Date(x.fecha))[0].cantidad_litros + 'L' : '--';
                    } catch(e) { a.pesoAnterior = '--'; }
                    a.pesoActual = '';
                } else {
                    const hist = await Pesajes.obtenerHistorial(a.id, 'animal');
                    const kgHist = hist.filter(h => h.unidad === 'kg' && h.motivo_tarea === 'control');
                    a.pesoAnterior = kgHist.length > 0 ? kgHist[0].valor_neto + 'kg' : '--';
                    a.pesoActual = '';
                }
            }

            let currentAnimalIndex = 0;
            const unidadLabelLower = esModoLeche ? 'litros' : 'kg';

            let html = `
            <div class="wizard-header-fixed text-center" style="border-top: 5px solid ${unidadColor}; position:relative;">
                <button onclick="window._pesajesWizardActivo=false;document.getElementById('wizard-pesaje-overlay').remove();window.App.route()" class="text-zinc-200 btn-pesaje-close">✕</button>
                <h2 class="pesaje-titulo-h2" style="color:${unidadColor};">${titulo}</h2>
                <p class="text-gray-400 text-sm m-0 font-semibold">${subtitulo}</p>
            </div>

            <div class="wizard-content-scrollable">
                <div class="flex flex-col gap-15">
                    ${necesitaAsignacion ? `
                    <div class="pesaje-rebano-box p-16" id="box-assign-rebano">
                        <label class="text-[0.65rem] text-gold font-900 uppercase tracking-widest d-block mb-10">${Icons.rebanos()} ASIGNAR REBAÑO (REQUERIDO)</label>
                        <select id="w-assign-rebano" class="wizard-input text-lg font-800">
                            <option value="">-- SELECCIONAR LOTE DESTINO --</option>
                            ${rebanosCompatibles.map(r => `<option value="${r.id}">${r.nombre} | ${r.zonaActual || 'GENERAL'}</option>`).join('')}
                        </select>
                    </div>
                    ` : `
                    <div class="bg-black border border-222 p-10 rounded-sm grid grid-cols-2 gap-10">
                        <div><span class="text-gray uppercase font-800 text-[0.55rem]">${Icons.zonas()} ZONA ACTUAL:</span><br><span class="text-white font-900 text-xs uppercase">${rebano ? (rebano.zonaActual || 'FINCA GENERAL') : 'FINCA GENERAL'}</span></div>
                        <div><span class="text-gray uppercase font-800 text-[0.55rem]">${Icons.info()} TIPO LOTE:</span><br><span class="text-white font-900 text-xs uppercase">${rebano ? rebano.tipo : 'SIN CLASIFICAR'}</span></div>
                    </div>
                    `}

                    <div class="pesaje-animal-box">
                         <div class="text-[0.65rem] text-aaa uppercase font-950 tracking-widest mb-10 opacity-70">${esModoLeche ? 'Vaca a Registrar' : 'Animal a Pesar'}</div>
                         <div id="w-current-crotal" class="pesaje-crotal" style="color:var(--p-gold) !important; text-shadow: 0 0 15px rgba(250, 204, 21, 0.3);">--</div>
                         <div id="w-current-desc" class="text-aaa text-base font-800 uppercase tracking-tight mt-6">--</div>

                         <div class="mt-20 py-10 bg-black-opacity-50 rounded-xl border border-222">
                             <input type="number" id="w-peso-gigante" step="0.1" inputmode="decimal" placeholder="0.0"
                                    class="pesaje-peso-input" style="border: none !important; background: transparent; width: 100%; max-width: none;">
                             <div class="pesaje-unidad-label font-950" style="color:${unidadColor}; letter-spacing: 4px; margin-top: -5px;">${unidadLabel}</div>
                         </div>

                         ${esModoLeche ? `
                         <div class="pesaje-leche-grid">
                             <div>
                                 <label class="text-gray text-[0.6rem] font-900 uppercase">GRASA (%)</label>
                                 <input type="number" id="w-leche-grasa" step="0.01" placeholder="3.5" class="premium-input text-lg font-800">
                             </div>
                             <div>
                                 <label class="text-gray text-[0.6rem] font-900 uppercase">PROTEÍNA (%)</label>
                                 <input type="number" id="w-leche-proteina" step="0.01" placeholder="3.2" class="premium-input text-lg font-800">
                             </div>
                         </div>
                         ` : ''}

                         <div class="mt-25">
                             <button id="btn-guardar-peso" class="widget-link-btn widget-link-btn--neon ${esModoLeche ? 'neon-warning' : 'neon-success'} w-full max-w-300 mx-auto">
                                ${Icons.guardar()}
                                <span class="widget-link-label">${esModoLeche ? 'GUARDAR REGISTRO' : 'GUARDAR PESADA'}</span>
                             </button>
                         </div>
                    </div>

                    ${isLogistico ? `
                    <div class="card bg-black border-222 p-16 flex-shrink-0">
                        <div class="section-header-theme mb-12" style="--theme-color: var(--p-gold)">${Icons.transportistas()} LOGÍSTICA / BÁSCULA</div>
                        <div class="grid grid-cols-2 gap-12">
                            <div><label class="text-[0.65rem] text-gray uppercase font-800">BRUTO (KG)</label>
                            <input type="number" id="w-bruto" class="premium-input h-50 text-xl font-900"></div>
                            <div><label class="text-[0.65rem] text-gray uppercase font-800">TARA (KG)</label>
                            <input type="number" id="w-tara" class="premium-input h-50 text-xl font-900"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-12 mt-12 items-end">
                            <div><label class="text-[0.65rem] text-gray uppercase font-800">MATRÍCULA</label>
                            <input type="text" id="w-matricula" class="premium-input h-45 uppercase font-900"></div>
                            <div class="bg-black border border-222 p-8 rounded-sm text-right">
                                <span class="text-gray uppercase font-900 text-[0.55rem] block mb-2">NETO REAL:</span>
                                <span id="w-neto-display" class="text-green text-2xl font-900 tracking-tighter">0 KG</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <div class="rounded-10 pesaje-lista-box border-222">
                        <div class="bg-black text-[0.65rem] text-gray font-900 uppercase tracking-widest p-10 grid grid-cols-[2fr_1fr_1fr] gap-5 border-bottom-222">
                            <span>ANIMAL / LOTE</span>
                            <span class="text-right">HISTÓRICO</span>
                            <span class="text-right">ACTUAL</span>
                        </div>
                        <div id="w-table-body" class="flex-1" style="overflow-y: auto;">
                        </div>
                    </div>

                    ${motivo === 'expedicion' && !esModoLeche ? `
                    <div class="card p-16 border-222 bg-black">
                        <label class="text-[0.65rem] text-green font-900 uppercase tracking-widest d-block mb-10">${Icons.dinero()} PRECIO LIQUIDACIÓN (€/KG CANAL)</label>
                        <input type="number" id="w-precio" value="5.50" step="0.01" class="premium-input h-50 text-2xl font-900 text-green">
                    </div>
                    ` : ''}

                    <div class="grid grid-cols-1 gap-10">
                        <div><label class="text-[0.65rem] text-gray uppercase font-900 tracking-widest ml-4">${esModoLeche ? 'FECHA DEL CONTROL' : 'FECHA DE LA PESADA'}</label>
                        <input type="date" id="w-fecha" value="${new Date().toISOString().split('T')[0]}" class="premium-input h-45 font-800"></div>
                    </div>
                </div>
            </div>

            <div class="wizard-footer-fixed flex gap-10">
                <button class="widget-link-btn widget-link-btn--neon neon-success flex-1" id="btn-wizard-finish">
                    ${Icons.check()}
                    <span class="widget-link-label">${esModoLeche ? 'FINALIZAR CONTROL' : 'FINALIZAR PESADAS'}</span>
                </button>
            </div>
            `;

            overlay.innerHTML = html;

            const renderTable = () => {
                const tbody = overlay.querySelector('#w-table-body');
                if (!tbody) return;
                tbody.innerHTML = entidades.map((a, idx) => `
                    <div class="batch-item" data-index="${idx}" style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap: 5px; padding:14px 16px; border-bottom:1px solid #111; background: ${idx === currentAnimalIndex ? 'rgba(250, 204, 21, 0.05)' : 'transparent'}; border-left: 4px solid ${idx === currentAnimalIndex ? 'var(--p-gold)' : 'transparent'}; cursor:pointer;">
                        <div>
                            <div style="font-weight:900; color:${idx === currentAnimalIndex ? 'var(--p-gold)' : '#fff'}; font-size:0.95rem; text-transform:uppercase;">${a.numero_identificacion}</div>
                            <div class="text-gray uppercase font-800" style="font-size:0.6rem; letter-spacing:0.5px;">${a.raza || a.especie}</div>
                        </div>
                        <div class="text-gray uppercase font-900" style="text-align:right; font-size:0.8rem; align-self: center;">${a.pesoAnterior}</div>
                        <div style="text-align:right; font-weight:900; color:${a.pesoActual ? unidadColor : '#333'}; font-size:1rem; align-self: center;">${a.pesoActual ? a.pesoActual + unidadAbreviada : '--'}</div>
                    </div>
                `).join('');

                tbody.querySelectorAll('.batch-item').forEach(item => {
                    item.onclick = () => {
                        selectAnimal(parseInt(item.dataset.index));
                    };
                });
            };

            const selectAnimal = (index) => {
                currentAnimalIndex = index;
                const a = entidades[index];
                const crotalDisplay = overlay.querySelector('#w-current-crotal');
                const descDisplay = overlay.querySelector('#w-current-desc');
                if (crotalDisplay) crotalDisplay.textContent = a.numero_identificacion;
                if (descDisplay) descDisplay.textContent = `${a.raza || ''} | ${a.especie || ''}`;

                const input = overlay.querySelector('#w-peso-gigante');
                if (input) {
                    input.value = a.pesoActual || '';
                    input.focus();
                }
                renderTable();

                const assignBox = overlay.querySelector('#box-assign-rebano');
                if (assignBox && !necesitaAsignacion) {
                    assignBox.style.display = 'none';
                }
            };

            selectAnimal(0);

            // AUTO-FOCUS: Poner foco en el input de peso al abrir
            setTimeout(() => {
                const giantInput = overlay.querySelector('#w-peso-gigante');
                if (giantInput) {
                    giantInput.focus();
                    // En móviles, a veces se necesita un segundo intento tras el render completo
                    setTimeout(() => giantInput.focus(), 300);
                }
            }, 500);

            // Lógica Bruto/Tara
            if (isLogistico) {
                const bIn = overlay.querySelector('#w-bruto');
                const tIn = overlay.querySelector('#w-tara');
                const nDisp = overlay.querySelector('#w-neto-display');
                const updateNeto = () => {
                    const neto = Math.max(0, (parseFloat(bIn.value) || 0) - (parseFloat(tIn.value) || 0));
                    nDisp.textContent = neto.toLocaleString() + " kg";
                    nDisp.dataset.neto = neto;
                };
                bIn.oninput = updateNeto; tIn.oninput = updateNeto;
            }

            // Acción Guardar
            overlay.querySelector('#btn-guardar-peso').onclick = async () => {
                const input = overlay.querySelector('#w-peso-gigante');
                const val = parseFloat(input.value);
                if (isNaN(val) || val <= 0) {
                    window.App.toastError(esModoLeche ? "Introduce un volumen válido en litros" : "Introduce un peso válido");
                    return;
                }

                try {
                    const a = entidades[currentAnimalIndex];
                    if (!a) throw new Error("No hay entidad seleccionada para guardar");

                    const fecha = overlay.querySelector('#w-fecha')?.value || new Date().toISOString().split('T')[0];
                    const activeFincaId = await Fincas.getActiveId();
                    if (!activeFincaId) throw new Error("No hay una finca activa seleccionada");

                    if (esModoLeche) {
                        const grasa = parseFloat(overlay.querySelector('#w-leche-grasa')?.value) || null;
                        const proteina = parseFloat(overlay.querySelector('#w-leche-proteina')?.value) || null;

                        // 1. Guardar en store cifrado
                        await Produccion.saveLeche({
                            vacaId: a.id,
                            fecha: fecha,
                            cantidad_litros: val,
                            analisis_grasa_proteina: { grasa, proteina },
                            creadoEn: new Date().toISOString(),
                        }, activeFincaId);

                        // 2. Registrar en Libro Maestro (registro_eventos)
                        await Pesajes.registrar({
                            entidad_id: a.id,
                            tipo_entidad: 'animal',
                            motivo_tarea: 'control_lechero',
                            fecha: fecha,
                            valor_neto: val,
                            unidad: 'L',
                            calidad: (grasa || proteina) ? { grasa, proteina } : null,
                            rol_contable: 'INVENTARIO',
                            snap_identificacion: a.numero_identificacion || a.nombre || 'S/N'
                        });

                        a.pesoActual = val;
                        window.App.toast(`REGISTRADO: ${a.numero_identificacion || 'Animal'}  ${val} L`);
                    } else {
                        // MODO CARNE
                        const payload = {
                            entidad_id: a.id,
                            tipo_entidad: 'animal',
                            motivo_tarea: motivo || 'control',
                            fecha: fecha,
                            valor_neto: val,
                            precio_unitario: (motivo === 'expedicion') ? parseFloat(overlay.querySelector('#w-precio')?.value || 0) : 0,
                            matricula: isLogistico ? overlay.querySelector('#w-matricula')?.value.toUpperCase() : '',
                            rol_contable: motivo === 'expedicion' ? 'VENTA' : 'INVENTARIO',
                            snap_identificacion: a.numero_identificacion || a.nombre || 'S/N'
                        };

                        if (esModoLote) {
                            // En modo lote: solo acumular. El registro real ocurre en FINALIZAR.
                            _pesajesLote.push({
                                animalId: a.id,
                                crotal: a.numero_identificacion,
                                peso: val,
                                especie: a.especie,
                                raza: a.raza
                            });
                        } else {
                            console.log('[DEBUG PesajesUI] Payload individual:', JSON.stringify(payload));
                            await Pesajes.registrar(payload);
                        }

                        a.pesoActual = val;
                        window.App.toast(`REGISTRADO: ${a.numero_identificacion}  ${val} kg`);
                    }

                    // Avanzar al siguiente si es lote
                    if (entidades.length > 1) {
                        let nextIndex = currentAnimalIndex + 1;
                        if (nextIndex < entidades.length) {
                            selectAnimal(nextIndex);
                        } else {
                            renderTable();
                            if (esModoLote && !esModoLeche) {
                                window.App.toast(`📦 Lote: ${_pesajesLote.length} animales pesados. Pulsa FINALIZAR para registrar.`);
                            } else {
                                window.App.toast("Lote completado OK");
                            }
                        }
                    } else {
                        input.value = '';
                        renderTable();
                    }
                } catch (e) {
                    console.error('[PesajesUI] Error al guardar:', e);
                    window.App.toastError("Error al guardar: " + e.message);
                }
            };

            overlay.querySelector('#w-peso-gigante').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    overlay.querySelector('#btn-guardar-peso').click();
                }
            });

            overlay.querySelector('#btn-wizard-finish').onclick = async () => {
                window._pesajesWizardActivo = false;
                try {
                    // Si es modo lote cárnico, generar registros individuales para cada animal
                    if (esModoLote && !esModoLeche && _pesajesLote.length > 0) {
                        const fecha = overlay.querySelector('#w-fecha')?.value || new Date().toISOString().split('T')[0];
                        const precio = (motivo === 'expedicion') ? parseFloat(overlay.querySelector('#w-precio')?.value || 0) : 0;
                        const matricula = isLogistico ? overlay.querySelector('#w-matricula')?.value.toUpperCase() : '';
                        const rolContable = motivo === 'expedicion' ? 'VENTA' : 'INVENTARIO';
                        const rebano = await Rebanos.get(rebanoId);

                        for (const p of _pesajesLote) {
                            const payload = {
                                entidad_id: p.animalId,
                                tipo_entidad: 'animal',
                                motivo_tarea: motivo || 'control',
                                fecha: fecha,
                                valor_neto: p.peso,
                                precio_unitario: precio,
                                matricula: matricula,
                                rol_contable: rolContable,
                                snap_identificacion: p.crotal,
                                snap_zona: rebano?.zonaActual || 'Finca',
                                snap_especie: rebano?.especie || 'General',
                                snap_tipo: rebano?.tipo || 'Sin clasificar',
                                // Metadatos del lote (opcional para trazabilidad)
                                lote_animales_count: _pesajesLote.length,
                                lote_peso_promedio: _pesajesLote.reduce((sum, item) => sum + item.peso, 0) / _pesajesLote.length,
                                lote_crotales: _pesajesLote.map(item => item.crotal).join(', ')
                            };

                            console.log('[DEBUG PesajesUI] Registrando lote individual:', JSON.stringify(payload));
                            await Pesajes.registrar(payload);
                        }

                        const pesoTotal = _pesajesLote.reduce((sum, p) => sum + p.peso, 0);
                        window.App.toast(`📦 Lote registrado: ${_pesajesLote.length} animales, ${pesoTotal.toFixed(1)} kg total`);
                    }

                    overlay.remove();
                    await window.App.route();
                } catch (e) {
                    console.error('[PesajesUI] Error al finalizar:', e);
                    window.App.toastError("Error al finalizar: " + e.message);
                }
            };
        };

        await renderWizard();
        document.body.appendChild(overlay);
    }
};

window.PesajesUI = PesajesUI;
