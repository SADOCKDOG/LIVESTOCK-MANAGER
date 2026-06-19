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
                titulo = "🥛 Control Lechero de Lote";
                subtitulo = `${rebano.nombre} | ${rebano.especie} (${rebano.tipo})`;
            } else {
                entidades = await Animales.list(rebanoId);
                titulo = motivo === 'expedicion' ? "📦 Expedición de Lote" : "⚖️ Pesaje de Lote";
                subtitulo = `${rebano.nombre} | ${rebano.especie} (${rebano.tipo})`;
            }
        } else if (animalId) {
            const animal = await Animales.get(animalId);
            entidades = [animal];
            if (esModoLeche) {
                titulo = "🥛 Control Lechero Individual";
                subtitulo = animal.numero_identificacion;
                // Para leche individual, filtrar si no es hembra lechera
                if (!['h','hembra'].includes((animal.sexo||'').toLowerCase()) || !['Vacas','Ovejas','Cabras'].includes(animal.especie)) {
                    window.App.toastError("El animal seleccionado no es una hembra lechera");
                    return;
                }
            } else {
                titulo = esAltaNueva ? "⚖️ Pesaje Inicial (Alta)" : "⚖️ Pesaje Individual";
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
            <div class="wizard-header-fixed" style="border-top: 5px solid ${unidadColor}; position:relative; text-align:center;">
                <button onclick="window._pesajesWizardActivo=false;document.getElementById('wizard-pesaje-overlay').remove();window.App.route()" class="text-zinc-200" style="background:#27272a; border:none; width:32px; height:32px; border-radius:50%; position:absolute; top:50%; transform:translateY(-50%); right:15px; z-index:5001; cursor:pointer; font-weight:bold;">✕</button>
                <h2 style="margin:0 0 4px 0; color:${unidadColor}; font-size:1.3rem; text-transform:uppercase; font-weight:900; letter-spacing:1px;">${titulo}</h2>
                <p class="text-gray-400" style="font-size:0.8rem; margin:0; font-weight:600;">${subtitulo}</p>
            </div>

            <div class="wizard-content-scrollable">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${necesitaAsignacion ? `
                    <div style="background:rgba(251,191,36,0.05); padding:12px; border-radius:10px; border:1px solid #fbbf24; flex-shrink: 0;" id="box-assign-rebano">
                        <label class="text-75 text-gold" style="font-weight:bold; display:block; margin-bottom:5px;">ASOCIAR A REBAÑO (OBLIGATORIO)</label>
                        <select id="w-assign-rebano" class="premium-input bg-card border-gold" style="height: 45px; width: 100%;">
                            <option value="">-- Seleccionar Destino --</option>
                            ${rebanosCompatibles.map(r => `<option value="${r.id}">${r.nombre} | 📍 ${r.zonaActual || 'S/N'}</option>`).join('')}
                        </select>
                    </div>
                    ` : `
                    <div class="bg-card" style="padding:10px; border-radius:8px; border:1px solid #222; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.7rem; flex-shrink: 0;">
                        <div><span class="text-gray-500">📍 ZONA ACTUAL:</span><br><span class="text-ccc font-bold" style="font-size:0.8rem;">${rebano ? (rebano.zonaActual || 'Finca') : 'Finca'}</span></div>
                        <div><span class="text-gray-500">🧬 TIPO EXP.:</span><br><span class="text-ccc font-bold" style="font-size:0.8rem;">${rebano ? rebano.tipo : 'Sin clasificar'}</span></div>
                    </div>
                    `}

                    <div style="text-align:center; padding: 20px 15px; background: #0a0a0a; border: 2px solid #333; border-radius: 12px; position:relative;">
                         <div class="text-75 text-gray" style="text-transform:uppercase; font-weight:bold; letter-spacing:1px; margin-bottom:5px;">${esModoLeche ? 'Vaca a Registrar' : 'Animal a Pesar'}</div>
                         <div id="w-current-crotal" style="font-size:2.8rem; font-weight:900; color:${unidadColor}; line-height:1; text-transform:uppercase;">--</div>
                         <div id="w-current-desc" class="text-gray-400" style="font-size:0.9rem; margin-top:5px;">--</div>

                         <div style="margin-top: 15px;">
                             <input type="number" id="w-peso-gigante" step="0.1" inputmode="decimal" placeholder="0.0"
                                    style="width: 100%; max-width: 200px; font-size: 3.5rem; font-weight: 900; text-align: center; background: #1a1a1a; border: 3px solid ${unidadColor}; color: white; border-radius: 16px; padding: 10px;">
                             <div style="color:${unidadColor}; font-weight:800; font-size:0.9rem; text-transform:uppercase; margin-top:5px;">${unidadLabel}</div>
                         </div>

                         ${esModoLeche ? `
                         <div style="margin-top: 10px; display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                             <div>
                                 <label class="text-gray" style="font-size:0.6rem;">GRASA (%)</label>
                                 <input type="number" id="w-leche-grasa" step="0.01" placeholder="3.5" class="premium-input" style="height:36px; font-size:0.9rem;">
                             </div>
                             <div>
                                 <label class="text-gray" style="font-size:0.6rem;">PROTEÍNA (%)</label>
                                 <input type="number" id="w-leche-proteina" step="0.01" placeholder="3.2" class="premium-input" style="height:36px; font-size:0.9rem;">
                             </div>
                         </div>
                         ` : ''}

                         <div style="margin-top: 20px;">
                             <button id="btn-guardar-peso" class="wizard-btn-action" style="width: 100%; max-width: 280px; margin: 0 auto; font-size: 1.1rem; padding: 15px; background: ${unidadColor}; color: #000; font-weight: 900; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">💾 ${esModoLeche ? 'GUARDAR REGISTRO' : 'GUARDAR PESADA'}</button>
                         </div>
                    </div>

                    ${isLogistico ? `
                    <div class="card bg-dark border-muted" style="padding:12px; flex-shrink: 0;">
                        <h3 class="text-85 text-gold" style="margin:0 0 10px 0;">🚛 Datos de Báscula (Logística)</h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            <div><label class="text-tiny text-gray">BRUTO (kg)</label>
                            <input type="number" id="w-bruto" class="premium-input" style="height:40px; font-size:1rem;"></div>
                            <div><label class="text-tiny text-gray">TARA (kg)</label>
                            <input type="number" id="w-tara" class="premium-input" style="height:40px; font-size:1rem;"></div>
                        </div>
                        <div style="margin-top:8px; display:grid; grid-template-columns: 1fr 1.5fr; gap:10px;">
                            <div><label class="text-tiny text-gray">MATRÍCULA</label>
                            <input type="text" id="w-matricula" class="premium-input" style="height:40px; text-transform:uppercase;"></div>
                            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-end; background:#000; padding: 5px 10px; border-radius: 8px;">
                                <span class="text-gray-500" style="font-size:0.6rem;">NETO REAL:</span>
                                <span id="w-neto-display" class="text-green" style="font-size:1.1rem; font-weight:bold;">0 kg</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <div class="rounded-10" style="background:#000; border:1px solid #222; overflow: hidden; display: flex; flex-direction: column; flex-shrink: 0; max-height: 250px;">
                        <div class="bg-card text-tiny text-555" style="padding:8px 12px; text-transform:uppercase; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 5px;">
                            <span>${esModoLeche ? 'Vaca' : 'Animal'}</span>
                            <span style="text-align:right;">Anterior</span>
                            <span style="text-align:right;">Actual</span>
                        </div>
                        <div id="w-table-body" style="overflow-y: auto; flex: 1;">
                        </div>
                    </div>

                    ${motivo === 'expedicion' && !esModoLeche ? `
                    <div style="background:rgba(16,185,129,0.1); padding:10px; border-radius:8px; border:1px solid #10b981; flex-shrink: 0;">
                        <label class="text-75 text-green" style="font-weight:bold;">PRECIO LIQUIDACIÓN (€/kg Canal)</label>
                        <input type="number" id="w-precio" value="5.50" step="0.01" class="premium-input border-green" style="height:40px; font-size:1.1rem;">
                    </div>
                    ` : ''}

                    <div style="display:grid; grid-template-columns: 1fr; gap:10px; flex-shrink: 0;">
                        <div><label class="text-tiny text-gray-500">${esModoLeche ? 'FECHA DEL CONTROL' : 'FECHA DE LA PESADA'}</label>
                        <input type="date" id="w-fecha" value="${new Date().toISOString().split('T')[0]}" class="premium-input" style="height:40px;"></div>
                    </div>
                </div>
            </div>

            <div class="wizard-footer-fixed" style="display:flex; gap:10px;">
                <button class="wizard-btn-action wizard-btn-success" id="btn-wizard-finish" style="flex:1;">${esModoLeche ? 'FINALIZAR CONTROL ✔' : 'FINALIZAR PESADAS ✔'}</button>
            </div>
            `;

            overlay.innerHTML = html;

            const renderTable = () => {
                const tbody = overlay.querySelector('#w-table-body');
                if (!tbody) return;
                tbody.innerHTML = entidades.map((a, idx) => `
                    <div class="batch-item" data-index="${idx}" style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap: 5px; padding:10px 12px; border-bottom:1px solid #111; background: ${idx === currentAnimalIndex ? '#1a1a1a' : 'transparent'}; border-left: 3px solid ${idx === currentAnimalIndex ? unidadColor : 'transparent'}; cursor:pointer;">
                        <div>
                            <div style="font-weight:bold; color:${idx === currentAnimalIndex ? unidadColor : '#ccc'}; font-size:0.85rem;">${a.numero_identificacion}</div>
                            <div class="text-gray-500" style="font-size:0.6rem;">${a.raza || a.especie}</div>
                        </div>
                        <div class="text-gray" style="text-align:right; font-size:0.9rem; align-self: center;">${a.pesoAnterior}</div>
                        <div style="text-align:right; font-weight:bold; color:${a.pesoActual ? unidadColor : '#444'}; font-size:0.9rem; align-self: center;">${a.pesoActual || '--'}</div>
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
                        window.App.toast(`✅ ${a.numero_identificacion || 'Registro'}  ${val} L`);
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
                        window.App.toast(`✅ ${a.numero_identificacion}  ${val} kg`);
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
                                window.App.toast("Lote completado ✓");
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
