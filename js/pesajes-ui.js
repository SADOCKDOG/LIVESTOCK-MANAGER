/**
 * LIFESTOCK MANAGER - INTERFAZ DEL GESTOR DE PESAJES (v2.0.0)
 * UI dinámica para captura de pesajes, expediciones y producción.
 * v2.0.0: Diseño Premium Neón unificado con el motor ExPro.
 */

const PesajesUI = {
    /**
     * Abre el Wizard de pesaje adaptado al motivo
     * @param {Object} config { motivo, modo, rebanoId, animalId, esAltaNueva }
     */
    async abrirWizard(config) {
        const modoStr = config.modo || config.motivo || '';
        const esModoLeche = modoStr.startsWith('leche_');

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
            entidades = await Animales.list(rebanoId);
            if (esModoLeche) {
                entidades = entidades.filter(a => ['h','hembra'].includes((a.sexo||'').toLowerCase()) && ['Vacas','Ovejas','Cabras'].includes(a.especie));
                titulo = `CONTROL LECHERO LOTE`;
                subtitulo = `${rebano.nombre} | ${rebano.especie} (${rebano.tipo})`;
            } else {
                titulo = motivo === 'expedicion' ? `EXPEDICIÓN LOTE` : `PESAJE DE LOTE`;
                subtitulo = `${rebano.nombre} | ${rebano.especie} (${rebano.tipo})`;
            }
        } else if (animalId) {
            const animal = await Animales.get(animalId);
            entidades = [animal];
            if (esModoLeche) {
                titulo = `CONTROL LECHERO INDIVIDUAL`;
                subtitulo = animal.numero_identificacion;
                if (!['h','hembra'].includes((animal.sexo||'').toLowerCase()) || !['Vacas','Ovejas','Cabras'].includes(animal.especie)) {
                    window.App.toastError("El animal seleccionado no es una hembra lechera");
                    return;
                }
            } else {
                titulo = esAltaNueva ? `PESAJE INICIAL (ALTA)` : `PESAJE INDIVIDUAL`;
                subtitulo = animal.numero_identificacion;
            }

            if (esAltaNueva || !animal.rebanoId) {
                const todosRebanos = await Rebanos.list();
                rebanosCompatibles = todosRebanos.filter(r => r.especie === animal.especie);
            } else {
                rebano = await Rebanos.get(animal.rebanoId);
            }
        }

        if (esModoLeche && entidades.length === 0) {
            window.App.toastError("No hay hembras lecheras en este rebaño");
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = "wizard-pesaje-overlay";
        overlay.className = "wizard-full-screen";
        overlay.style.zIndex = "5000";

        const _pesajesLote = [];
        const esModoLote = entidades.length > 1;

        const unidadLabel = esModoLeche ? "VOLUMEN (L)" : "PESO (KG)";
        const unidadAbreviada = esModoLeche ? "L" : "kg";
        const unidadColor = esModoLeche ? "#fbbf24" : "#10b981";

        const renderWizard = async () => {
            window._pesajesWizardActivo = true;
            const isLogistico = (motivo === 'expedicion' || motivo === 'entrada') && !esModoLeche;
            let necesitaAsignacion = (esAltaNueva || (animalId && !rebano)) && !esModoLeche;

            for (let a of entidades) {
                if (esModoLeche) {
                    try {
                        const hist = await Produccion.listLeche(await Fincas.getActiveId());
                        const regs = hist.filter(h => Number(h.vacaId) === Number(a.id));
                        a.pesoAnterior = regs.length > 0 ? regs.sort((x,y) => new Date(y.fecha)-new Date(x.fecha))[0].cantidad_litros + 'L' : '--';
                    } catch(e) { a.pesoAnterior = '--'; }
                } else {
                    const hist = await Pesajes.obtenerHistorial(a.id, 'animal');
                    const kgHist = hist.filter(h => h.unidad === 'kg' && h.motivo_tarea === 'control');
                    a.pesoAnterior = kgHist.length > 0 ? kgHist[0].valor_neto + 'kg' : '--';
                }
                a.pesoActual = '';
            }

            let currentAnimalIndex = 0;

            overlay.innerHTML = `
            <div class="wizard-header-fixed text-center" style="border-top: 5px solid ${unidadColor}; position:relative;">
                <button onclick="window._pesajesWizardActivo=false;document.getElementById('wizard-pesaje-overlay').remove();window.App.route()" class="text-zinc-200 btn-pesaje-close">✕</button>
                <h2 class="pesaje-titulo-h2 uppercase font-950 tracking-widest" style="color:${unidadColor};">${esModoLeche ? Icons.leche() : Icons.balanza()} ${titulo}</h2>
                <p class="text-gray-400 text-xs m-0 font-900 uppercase tracking-tight">${subtitulo}</p>
            </div>

            <div class="wizard-content-scrollable">
                <div class="flex flex-col gap-15">
                    ${necesitaAsignacion ? `
                    <div class="card card-accent card-accent-gold p-16" id="box-assign-rebano">
                        <label class="text-[0.65rem] text-gold font-950 uppercase tracking-widest d-block mb-12">${Icons.rebanos()} ASIGNAR REBAÑO (OBLIGATORIO)</label>
                        <select id="w-assign-rebano" class="wizard-input text-lg font-900 uppercase">
                            <option value="">-- SELECCIONAR LOTE DESTINO --</option>
                            ${rebanosCompatibles.map(r => `<option value="${r.id}">${r.nombre.toUpperCase()} | ${r.zonaActual?.toUpperCase() || 'GENERAL'}</option>`).join('')}
                        </select>
                    </div>
                    ` : `
                    <div class="bg-black border border-222 p-12 rounded-sm grid grid-cols-2 gap-10">
                        <div><span class="text-gray-500 uppercase font-900 text-[0.55rem] tracking-wider">${Icons.zonas()} ZONA ACTUAL</span><br><span class="text-white font-950 text-xs uppercase">${rebano ? (rebano.zonaActual?.toUpperCase() || 'FINCA GENERAL') : 'FINCA GENERAL'}</span></div>
                        <div><span class="text-gray-500 uppercase font-900 text-[0.55rem] tracking-wider">${Icons.info()} TIPO LOTE</span><br><span class="text-white font-950 text-xs uppercase">${rebano ? rebano.tipo?.toUpperCase() : 'SIN CLASIFICAR'}</span></div>
                    </div>
                    `}

                    <div class="card card-accent p-16" style="--accent-color: ${unidadColor}; border-top: 3px solid ${unidadColor};">
                         <div class="text-[0.6rem] text-aaa uppercase font-950 tracking-widest mb-15 opacity-80 text-center">${esModoLeche ? 'Vaca a Registrar' : 'Animal a Pesar'}</div>
                         <div id="w-current-crotal" class="pesaje-crotal font-black" style="color:${unidadColor} !important; text-shadow: 0 0 15px ${unidadColor}40;">--</div>
                         <div id="w-current-desc" class="text-aaa text-xs font-900 uppercase tracking-widest mt-8 text-center">--</div>

                         <div class="mt-20 py-12 bg-black border border-222 rounded-xl">
                             <input type="number" id="w-peso-gigante" step="0.1" inputmode="decimal" placeholder="0.0"
                                    class="pesaje-peso-input font-black" style="border: none !important; background: transparent; width: 100%; max-width: none; color:${unidadColor};">
                             <div class="pesaje-unidad-label font-950 uppercase tracking-widest" style="color:${unidadColor}; opacity: 0.8;">${unidadLabel}</div>
                         </div>

                         ${esModoLeche ? `
                         <div class="grid grid-cols-2 gap-10 mt-15">
                             <div>
                                 <label class="text-gray text-[0.55rem] font-950 uppercase tracking-widest mb-6 d-block">GRASA (%)</label>
                                 <input type="number" id="w-leche-grasa" step="0.01" placeholder="0.00" class="wizard-input font-900 text-lg">
                             </div>
                             <div>
                                 <label class="text-gray text-[0.55rem] font-950 uppercase tracking-widest mb-6 d-block">PROTEÍNA (%)</label>
                                 <input type="number" id="w-leche-proteina" step="0.01" placeholder="0.00" class="wizard-input font-900 text-lg">
                             </div>
                         </div>
                         ` : ''}

                         <div class="mt-20">
                             <button id="btn-guardar-peso" class="widget-link-btn widget-link-btn--neon ${esModoLeche ? 'neon-warning' : 'neon-success'} w-full">
                                ${Icons.guardar()}
                                <span class="widget-link-label font-950 uppercase">${esModoLeche ? 'GUARDAR REGISTRO' : 'GUARDAR PESADA'}</span>
                             </button>
                         </div>
                    </div>

                    ${isLogistico ? `
                    <div class="card card-accent card-accent-blue p-16 border-222 bg-black">
                        <div class="section-header-theme mb-12" style="--theme-color: #3b82f6">${Icons.transportistas()} LOGÍSTICA / BÁSCULA</div>
                        <div class="grid grid-cols-2 gap-12 mb-12">
                            <div><label class="text-[0.55rem] text-gray-500 uppercase font-950 tracking-widest mb-6 d-block">BRUTO (KG)</label>
                            <input type="number" id="w-bruto" class="wizard-input h-50 text-xl font-950 text-white"></div>
                            <div><label class="text-[0.55rem] text-gray-500 uppercase font-950 tracking-widest mb-6 d-block">TARA (KG)</label>
                            <input type="number" id="w-tara" class="wizard-input h-50 text-xl font-950 text-white"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-12 mt-12 items-end">
                            <div><label class="text-[0.55rem] text-gray-500 uppercase font-950 tracking-widest mb-6 d-block">MATRÍCULA</label>
                            <input type="text" id="w-matricula" class="wizard-input h-45 uppercase font-950"></div>
                            <div class="bg-black border border-222 p-10 rounded-sm text-right">
                                <span class="text-gray-500 uppercase font-950 text-[0.55rem] block mb-2 tracking-widest">NETO REAL:</span>
                                <span id="w-neto-display" class="text-green text-2xl font-black tracking-tighter">0 KG</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <div class="rounded-10 pesaje-lista-box border-222 bg-black-opacity-50">
                        <div class="bg-black text-[0.6rem] text-gray-500 font-950 uppercase tracking-widest p-12 grid grid-cols-[2fr_1fr_1fr] gap-5 border-bottom-222">
                            <span>ANIMAL / LOTE</span>
                            <span class="text-right">HISTÓRICO</span>
                            <span class="text-right">ACTUAL</span>
                        </div>
                        <div id="w-table-body" class="flex-1" style="overflow-y: auto;"></div>
                    </div>

                    ${motivo === 'expedicion' && !esModoLeche ? `
                    <div class="card card-accent card-accent-green p-16 border-222 bg-black">
                        <label class="text-[0.6rem] text-green font-950 uppercase tracking-widest d-block mb-12">${Icons.dinero()} PRECIO LIQUIDACIÓN (€/KG CANAL)</label>
                        <input type="number" id="w-precio" value="5.50" step="0.01" class="wizard-input h-50 text-2xl font-black text-green">
                    </div>
                    ` : ''}

                    <div class="p-12 bg-black border border-222 rounded-sm mb-20">
                        <label class="text-[0.55rem] text-gray-500 uppercase font-950 tracking-widest d-block mb-8 ml-4">${esModoLeche ? 'FECHA DEL CONTROL' : 'FECHA DE LA PESADA'}</label>
                        <input type="date" id="w-fecha" value="${new Date().toISOString().split('T')[0]}" class="wizard-input h-45 font-900 uppercase">
                    </div>
                </div>
            </div>

            <div class="wizard-footer-fixed flex gap-10">
                <button class="widget-link-btn widget-link-btn--neon neon-success flex-1" id="btn-wizard-finish">
                    ${Icons.check()}
                    <span class="widget-link-label font-950 uppercase tracking-wider">${esModoLeche ? 'FINALIZAR CONTROL' : 'FINALIZAR PESADAS'}</span>
                </button>
            </div>
            `;

            const renderTable = () => {
                const tbody = overlay.querySelector('#w-table-body');
                if (!tbody) return;
                tbody.innerHTML = entidades.map((a, idx) => `
                    <div class="batch-item" data-index="${idx}" style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap: 5px; padding:16px; border-bottom:1px solid #111; background: ${idx === currentAnimalIndex ? 'rgba(250, 204, 21, 0.05)' : 'transparent'}; border-left: 4px solid ${idx === currentAnimalIndex ? 'var(--p-gold)' : 'transparent'}; cursor:pointer;">
                        <div>
                            <div style="font-weight:950; color:${idx === currentAnimalIndex ? 'var(--p-gold)' : '#fff'}; font-size:0.95rem; text-transform:uppercase; letter-spacing:-0.5px;">${a.numero_identificacion}</div>
                            <div class="text-gray-500 uppercase font-800" style="font-size:0.55rem; letter-spacing:1px; margin-top:2px;">${a.raza || a.especie}</div>
                        </div>
                        <div class="text-gray-600 uppercase font-900" style="text-align:right; font-size:0.75rem; align-self: center;">${a.pesoAnterior}</div>
                        <div style="text-align:right; font-weight:950; color:${a.pesoActual ? unidadColor : '#222'}; font-size:1.1rem; align-self: center;">${a.pesoActual ? a.pesoActual + unidadAbreviada : '--'}</div>
                    </div>
                `).join('');
                tbody.querySelectorAll('.batch-item').forEach(item => {
                    item.onclick = () => selectAnimal(parseInt(item.dataset.index));
                });
            };

            const selectAnimal = (index) => {
                currentAnimalIndex = index;
                const a = entidades[index];
                const crotalDisplay = overlay.querySelector('#w-current-crotal');
                const descDisplay = overlay.querySelector('#w-current-desc');
                if (crotalDisplay) crotalDisplay.textContent = a.numero_identificacion;
                if (descDisplay) descDisplay.textContent = `${a.raza || ''} · ${a.especie || ''}`;
                const input = overlay.querySelector('#w-peso-gigante');
                if (input) { input.value = a.pesoActual || ''; input.focus(); }
                renderTable();
            };

            selectAnimal(0);
            setTimeout(() => { const i = overlay.querySelector('#w-peso-gigante'); if(i){ i.focus(); setTimeout(()=>i.focus(), 300); } }, 500);

            if (isLogistico) {
                const bIn = overlay.querySelector('#w-bruto');
                const tIn = overlay.querySelector('#w-tara');
                const nDisp = overlay.querySelector('#w-neto-display');
                const updateNeto = () => {
                    const neto = Math.max(0, (parseFloat(bIn.value) || 0) - (parseFloat(tIn.value) || 0));
                    nDisp.textContent = neto.toLocaleString() + " KG";
                };
                bIn.oninput = updateNeto; tIn.oninput = updateNeto;
            }

            overlay.querySelector('#btn-guardar-peso').onclick = async () => {
                const input = overlay.querySelector('#w-peso-gigante');
                const val = parseFloat(input.value);
                if (isNaN(val) || val <= 0) { App.toastError(esModoLeche ? "Introduce volumen válido" : "Introduce peso válido"); return; }
                try {
                    const a = entidades[currentAnimalIndex];
                    const fecha = overlay.querySelector('#w-fecha')?.value || new Date().toISOString().split('T')[0];
                    const activeFincaId = await Fincas.getActiveId();

                    if (esModoLeche) {
                        const grasa = parseFloat(overlay.querySelector('#w-leche-grasa')?.value) || null;
                        const proteina = parseFloat(overlay.querySelector('#w-leche-proteina')?.value) || null;
                        await Produccion.saveLeche({ vacaId: a.id, fecha, cantidad_litros: val, analisis_grasa_proteina: { grasa, proteina }, creadoEn: new Date().toISOString() }, activeFincaId);
                        await Pesajes.registrar({ entidad_id: a.id, tipo_entidad: 'animal', motivo_tarea: 'control_lechero', fecha, valor_neto: val, unidad: 'L', calidad: (grasa || proteina) ? { grasa, proteina } : null, rol_contable: 'INVENTARIO', snap_identificacion: a.numero_identificacion || 'S/N' });
                    } else {
                        const payload = {
                            entidad_id: a.id, tipo_entidad: 'animal', motivo_tarea: motivo || 'control', fecha, valor_neto: val,
                            precio_unitario: (motivo === 'expedicion') ? parseFloat(overlay.querySelector('#w-precio')?.value || 0) : 0,
                            matricula: isLogistico ? overlay.querySelector('#w-matricula')?.value.toUpperCase() : '',
                            rol_contable: motivo === 'expedicion' ? 'VENTA' : 'INVENTARIO',
                            snap_identificacion: a.numero_identificacion || 'S/N'
                        };
                        if (esModoLote) _pesajesLote.push({ animalId: a.id, crotal: a.numero_identificacion, peso: val, especie: a.especie, raza: a.raza });
                        else await Pesajes.registrar(payload);
                    }
                    a.pesoActual = val;
                    App.toast(`REGISTRADO: ${a.numero_identificacion} -> ${val}${unidadAbreviada}`);
                    if (entidades.length > 1 && currentAnimalIndex < entidades.length - 1) selectAnimal(currentAnimalIndex + 1);
                    else { input.value = ''; renderTable(); }
                } catch (e) { App.toastError("Error: " + e.message); }
            };

            overlay.querySelector('#w-peso-gigante').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); overlay.querySelector('#btn-guardar-peso').click(); } });

            overlay.querySelector('#btn-wizard-finish').onclick = async () => {
                window._pesajesWizardActivo = false;
                try {
                    if (esModoLote && !esModoLeche && _pesajesLote.length > 0) {
                        const fecha = overlay.querySelector('#w-fecha')?.value;
                        const precio = parseFloat(overlay.querySelector('#w-precio')?.value || 0);
                        const matricula = overlay.querySelector('#w-matricula')?.value || '';
                        const reb = await Rebanos.get(rebanoId);
                        for (const p of _pesajesLote) {
                            await Pesajes.registrar({
                                entidad_id: p.animalId, tipo_entidad: 'animal', motivo_tarea: motivo || 'control', fecha, valor_neto: p.peso,
                                precio_unitario: precio, matricula, rol_contable: motivo === 'expedicion' ? 'VENTA' : 'INVENTARIO',
                                snap_identificacion: p.crotal, snap_zona: reb?.zonaActual, snap_especie: reb?.especie, snap_tipo: reb?.tipo
                            });
                        }
                    }
                    overlay.remove();
                    await window.App.route();
                } catch (e) { App.toastError("Error al finalizar: " + e.message); }
            };
        };

        await renderWizard();
        document.body.appendChild(overlay);
    }
};

window.PesajesUI = PesajesUI;
