/**
 * Wizard Albarán de Leche (Salida Láctea)
 * Extraído de app.js para modularización (Fase 3)
 */
window.AlbaranLecheWizard = {
  async open(borrador = null) {
    const App = window.App;
    if (!App) return console.error("App no disponible");

    const finca = await window.Fincas.getActive();
    const fincaId = await window.Fincas.getActiveId();
    const opcionesCCAA = window.ComunidadesService
      ? window.ComunidadesService.getOpcionesComunidad()
      : [{ value: 'andalucia', label: 'Andalucía' }, { value: 'extremadura', label: 'Extremadura' }];
    const refPrecios = window.ComunidadesService
      ? window.ComunidadesService.PRECIO_EXTRACTO_SECO_REF
      : { precio_base_referencia: 0.45, precio_por_punto_extracto: 0.045, tasa_INLAC_defecto: 0.0012 };

    // Definición de funciones de cálculo en el ámbito global del App para los onchange/oninput
    App._recalcularPrecioLeche = function() {
      const pbInput = document.getElementById('w-l-pb');
      const pexInput = document.getElementById('w-l-pex');
      const primInput = document.getElementById('w-l-prim');
      const cantInput = document.getElementById('w-l-cant');
      const esDisplay = document.getElementById('w-l-es-display');
      const precioDisplay = document.getElementById('w-l-precio-final-display');
      const importeDisplay = document.getElementById('w-l-importe-display');

      if (!pbInput || !pexInput || !primInput || !cantInput || !precioDisplay || !importeDisplay) return;

      const pb = parseFloat(pbInput.value) || 0;
      const pex = parseFloat(pexInput.value) || 0;
      const prim = parseFloat(primInput.value) || 0;
      const cant = parseFloat(cantInput.value) || 0;
      const es = esDisplay ? (parseFloat(esDisplay.textContent) || 0) : 0;
      const tasa = refPrecios.tasa_INLAC_defecto;

      const precioFinal = parseFloat((pb + (es * pex) - tasa + prim).toFixed(4));
      const importeTotal = parseFloat((cant * precioFinal).toFixed(2));

      precioDisplay.textContent = precioFinal.toFixed(4) + ' €/L';
      importeDisplay.textContent = importeTotal.toFixed(2) + ' €';
    };

    App._recalcularMOFA = function() {
      const costPerInput = document.getElementById('w-l-cost-per');
      const mofaDisplay = document.getElementById('w-l-resumen-mofa');
      const costeDisplay = document.getElementById('w-l-resumen-coste');
      const importeDisplay = document.getElementById('w-l-resumen-importe');

      if (!costPerInput || !mofaDisplay || !costeDisplay || !importeDisplay) return;

      const costeAlim = parseFloat(costPerInput.value) || 0;
      const importeTotal = parseFloat(importeDisplay.textContent) || 0;
      const mofa = parseFloat((importeTotal - costeAlim).toFixed(2));

      costeDisplay.textContent = costeAlim.toFixed(2) + ' €';
      mofaDisplay.innerHTML = mofa.toFixed(2) + ' € ' + (mofa >= 0 ? '✅' : '⚠️');
      mofaDisplay.style.color = mofa >= 0 ? '#10b981' : '#ef4444';
    };

    const wizardSteps = [
      // =====================================================
      // PASO 1: Datos Generales + CCAA + Contrato + ADSG
      // =====================================================
      {
        content: async (data) => {
          return `
          <div class="card card-accent card-accent-amber p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--p-gold)">IDENTIFICACIÓN Y ORIGEN</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">FECHA RECOGIDA</label>
              <input type="date" id="w-l-fecha" value="${data.fecha}" class="wizard-input font-800">
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">COMUNIDAD AUTÓNOMA</label>
              <select id="w-l-ccaa" class="wizard-input font-800">
                <option value="">— SELECCIONAR —</option>
                ${opcionesCCAA.map(o =>
                  `<option value="${o.value}" ${data.comunidad_autonoma === o.value ? 'selected' : ''}>${o.label.toUpperCase()}</option>`
                ).join('')}
              </select>
            </div>
            <div id="w-l-ccaa-info" class="text-[0.62rem] text-aaa rounded-sm p-10 bg-black border border-222 mb-12 d-none uppercase font-800 tracking-tight leading-relaxed"></div>

            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº CONTRATO</label>
                <input type="text" id="w-l-ctr" value="${data.contrato_numero || finca.contrato_lacteo_numero || ''}" placeholder="CT-000" class="wizard-input uppercase font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CÓDIGO ADSG</label>
                <input type="text" id="w-l-adsg" value="${data.adsg_codigo || finca.adsg_codigo || ''}" placeholder="ADSG-00" class="wizard-input uppercase font-800">
              </div>
            </div>
          </div>

          <div class="card card-accent card-accent-blue p-16 mb-16">
            <div class="section-header-theme mb-12" style="--theme-color: #3b82f6">TRAMITACIÓN INFOLAC</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">ESTADO DE DECLARACIÓN</label>
              <select id="w-l-estado-tramite" class="wizard-input font-900">
                <option value="borrador" ${data.estado_tramite_infolac === 'borrador' ? 'selected' : ''}>BORRADOR</option>
                <option value="presentado" ${data.estado_tramite_infolac === 'presentado' ? 'selected' : ''}>PRESENTADO</option>
                <option value="aceptado" ${data.estado_tramite_infolac === 'aceptado' ? 'selected' : ''}>ACEPTADO</option>
                <option value="rechazado" ${data.estado_tramite_infolac === 'rechazado' ? 'selected' : ''}>RECHAZADO</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA PRES.</label>
                <input type="date" id="w-l-fecha-pres" value="${data.fecha_presentacion_infolac || ''}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº REGISTRO</label>
                <input type="text" id="w-l-reg-of" value="${data.numero_registro_infolac || ''}" class="wizard-input uppercase font-800" placeholder="ASIENTO">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CÓDIGO ACUSE / JUSTIFICANTE</label>
              <input type="text" id="w-l-acuse" value="${data.acuse_infolac || ''}" class="wizard-input uppercase font-800" placeholder="CÓDIGO DE ACUSE">
            </div>
          </div>
        `;
        },
        onRender: (data, stepEl) => {
          const updateCCAAInfo = () => {
            const sel = stepEl.querySelector('#w-l-ccaa');
            const info = stepEl.querySelector('#w-l-ccaa-info');
            if (sel && info && sel.value && window.ComunidadesService) {
              const conf = window.ComunidadesService.getConfiguracionCCAA(sel.value);
              if (conf) {
                info.style.display = 'block';
                info.innerHTML = `📍 <strong>${conf.label}</strong> · Movimiento: ${conf.sistema_movimiento}
                  · Dist. REGA: ${conf.distancia_minima_REGA_m}m · PAC: ${conf.umbral_PAC_corderos_oveja} corderos/oveja/año
                  · ${conf.guia_automatica_si_saneada ? '✅ Guía automática 365d' : '⚠️ Guía requiere confirmación'}`;
              }
            } else if (info) {
              info.style.display = 'none';
            }
          };
          stepEl.querySelector('#w-l-ccaa')?.addEventListener('change', updateCCAAInfo);
          setTimeout(updateCCAAInfo, 50);
        },
        onChange: async (data) => {
          data.fecha = document.getElementById('w-l-fecha')?.value || data.fecha;
          data.comunidad_autonoma = document.getElementById('w-l-ccaa')?.value || data.comunidad_autonoma;
          data.contrato_numero = document.getElementById('w-l-ctr')?.value.trim() || data.contrato_numero;
          data.adsg_codigo = document.getElementById('w-l-adsg')?.value.trim() || data.adsg_codigo;
          data.estado_tramite_infolac = document.getElementById('w-l-estado-tramite')?.value || data.estado_tramite_infolac;
          data.fecha_presentacion_infolac = document.getElementById('w-l-fecha-pres')?.value || '';
          data.numero_registro_infolac = document.getElementById('w-l-reg-of')?.value.trim() || '';
          data.acuse_infolac = document.getElementById('w-l-acuse')?.value.trim() || '';
        },
        validate: async (data) => {
          if (!data.fecha) { App.toastError("La fecha de recogida es obligatoria"); return false; }
          if (!data.comunidad_autonoma) { App.toastError("Selecciona la comunidad autónoma"); return false; }
          if (!data.contrato_numero) { App.toastError("El nº de contrato lácteo es obligatorio"); return false; }
          if (!data.adsg_codigo) { App.toastError("El código ADSG es obligatorio"); return false; }
          if (data.estado_tramite_infolac !== 'borrador' && !data.fecha_presentacion_infolac) {
            App.toastError("La fecha de presentación INFOLAC es obligatoria.");
            return false;
          }
          if ((data.estado_tramite_infolac === 'aceptado' || data.estado_tramite_infolac === 'rechazado') &&
              (!data.numero_registro_infolac || !data.acuse_infolac)) {
            App.toastError("Número de registro y acuse INFOLAC son obligatorios para estado aceptado/rechazado.");
            return false;
          }
          return true;
        }
      },

      {
        content: async (data) => {
          // Check de supresión antibióticos
          const animales = await window.Animales.list();
          let bloqueadosHtml = "", totalBloqueados = 0;
          for (let a of animales) {
            if (a.estado !== 'activo' && a.estado !== 'Activo') continue;
            if (a.sexo !== 'H') continue;
            try {
              const control = await window.Trazabilidad.checkSupresion(window.db, a.id, data.fecha, "leche");
              if (!control.apto) {
                totalBloqueados++;
                bloqueadosHtml += `<div class="text-red uppercase font-900 text-[0.65rem] border-bottom-222 py-4">
                  ${a.numero_identificacion} — ${control.motivo.toUpperCase()}</div>`;
              }
            } catch (_) {}
          }
          let advHtml = totalBloqueados > 0
            ? `<div class="p-16 bg-red-900 border-red-500 border rounded-sm mt-15">
                <h4 class="text-white text-xs font-950 uppercase tracking-widest mb-8">${Icons.alerta()} ${totalBloqueados} HEMBRAS CON LECHE RETENIDA</h4>
                <p class="text-aaa text-[0.65rem] font-800 uppercase mb-8 leading-tight">VERIFICA QUE SU LECHE NO ENTRÓ EN EL TANQUE.</p>
                <div style="max-height:100px; overflow-y:auto;">${bloqueadosHtml}</div>
                <label class="flex items-center gap-10 text-xs text-white cursor-pointer bg-black border border-222 p-10 rounded-sm mt-10">
                  <input type="checkbox" id="w-l-confirm-separacion" required style="accent-color:#ef4444;">
                  <span class="uppercase font-950 text-[0.55rem] tracking-tight">CONFIRMO QUE LA LECHE FUE DESECHADA</span>
                </label>
              </div>`
            : `<div class="text-center mt-15 p-16 bg-black border border-green-500 rounded-sm">
                <h4 class="text-green text-xs font-950 uppercase tracking-widest m-0">${Icons.check()} 0 HEMBRAS RETENIDAS</h4>
                <p class="text-aaa text-[0.65rem] font-800 uppercase mt-4">REBAÑO LIBRE DE MEDICAMENTOS PROHIBIDOS.</p>
              </div>`;

          return `
          <div class="card card-accent card-accent-green p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #10b981">LOGÍSTICA DE RECOGIDA</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">MATRÍCULA CISTERNA</label>
              <input type="text" id="w-l-mat" value="${data.matricula}" placeholder="ABC-000" class="wizard-input uppercase font-900 text-lg">
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">NÚMERO MUESTRA LETRA Q</label>
              <input type="text" id="w-l-q" value="${data.q}" placeholder="CÓDIGO MUESTRA..." class="wizard-input uppercase font-800">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº INFOLAC</label>
                <input type="text" id="w-l-infolac" value="${data.numero_infolac || ''}" placeholder="INFOLAC-00" class="wizard-input uppercase font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">MUESTREO OFICIAL</label>
                <input type="text" id="w-l-muest" value="${data.numero_muestreo_oficial || ''}" placeholder="LIGAL-00" class="wizard-input uppercase font-800">
              </div>
            </div>
            ${advHtml}
          </div>`;
        },
        onChange: async (data) => {
          data.matricula = document.getElementById('w-l-mat')?.value.trim() || data.matricula;
          data.q = document.getElementById('w-l-q')?.value.trim() || data.q;
          data.numero_infolac = document.getElementById('w-l-infolac')?.value.trim() || data.numero_infolac;
          data.numero_muestreo_oficial = document.getElementById('w-l-muest')?.value.trim() || data.numero_muestreo_oficial;
          const confirmChk = document.getElementById('w-l-confirm-separacion');
          data.tieneRetenidas = !!confirmChk;
          data.confirmaSeparacion = confirmChk ? confirmChk.checked : true;
        },
        validate: async (data) => {
          if (data.tieneRetenidas && !data.confirmaSeparacion) {
            App.toastError("Debes confirmar que la leche retenida fue separada.");
            return false;
          }
          return true;
        }
      },

      {
        content: (data) => `
          <div class="card card-accent card-accent-blue p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #3b82f6">CONTROL DE CARGA</div>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">HORA ORDEÑO</label>
                <input type="time" id="w-l-hor" value="${data.hora_ordeno || ''}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">HORA CARGA</label>
                <input type="time" id="w-l-hcar" value="${data.hora_carga || ''}" class="wizard-input font-800">
              </div>
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">TEMPERATURA CARGA (ºC)</label>
              <input type="number" id="w-l-temp" value="${data.temp}" step="0.1" class="wizard-input font-950 text-2xl" style="color:${data.temp <= 4 ? '#10b981' : '#ef4444'};">
            </div>
            <div class="p-10 bg-black border border-222 rounded-sm mb-12">
              <p class="text-[0.6rem] text-aaa uppercase font-800 tracking-tight leading-relaxed m-0">
                ${Icons.info()} <strong>CADENA FRÍO:</strong> ENFRIAR DE 37°C A <4°C EN &lt; 2 HORAS.
                ${data.temp <= 4 ? `<span class="text-green block mt-4 font-950">ESTADO: CUMPLE</span>` : `<span class="text-red block mt-4 font-950">ESTADO: CRÍTICO</span>`}
              </p>
            </div>
            <label class="flex items-center gap-10 text-xs text-white cursor-pointer bg-black border border-222 p-10 rounded-sm mb-10">
              <input type="checkbox" id="w-l-frio" ${data.cadena_frio_cumplida ? 'checked' : ''} style="accent-color:#3b82f6;">
              <span class="uppercase font-900 text-[0.6rem] tracking-tight">CERTIFICO CADENA DE FRÍO CUMPLIDA</span>
            </label>
            <label class="flex items-center gap-10 text-xs text-white cursor-pointer bg-black border border-222 p-10 rounded-sm">
              <input type="checkbox" id="w-l-inh" ${data.inh ? 'checked' : ''} style="accent-color:#3b82f6;">
              <span class="uppercase font-950 text-[0.6rem] tracking-tight">AUSENCIA ABSOLUTA DE INHIBIDORES</span>
            </label>
          </div>
        `,
        onChange: async (data) => {
          data.hora_ordeno = document.getElementById('w-l-hor')?.value || data.hora_ordeno;
          data.hora_carga = document.getElementById('w-l-hcar')?.value || data.hora_carga;
          data.temp = parseFloat(document.getElementById('w-l-temp')?.value) || 0;
          data.cadena_frio_cumplida = document.getElementById('w-l-frio')?.checked || false;
          data.inh = document.getElementById('w-l-inh')?.checked || false;
        },
        validate: async (data) => {
          if (data.temp > 6) {
            App.toastError("⚠️ ALERTA SANITARIA: Temperatura > 6ºC detectada.");
          }
          if (!data.inh) {
            App.toastError("Debes certificar la ausencia de inhibidores.");
            return false;
          }
          return true;
        }
      },

      {
        content: (data) => {
          const esCalc = (data.grasa != null && data.proteina != null)
            ? parseFloat((parseFloat(data.grasa || 0) + parseFloat(data.proteina || 0)).toFixed(2))
            : '';
          return `
          <div class="card card-accent card-accent-purple p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #8b5cf6">DATOS ANALÍTICOS</div>
            <p class="text-aaa uppercase font-800 text-[0.6rem] mb-12 text-center opacity-80">EXTRACTO SECO (G+P) CALCULADO AUTOMÁTICAMENTE</p>

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">MATERIA GRASA (%)</label>
                <input type="number" id="w-l-grasa" value="${data.grasa || ''}" step="0.01" class="wizard-input font-900" oninput="document.getElementById('w-l-es-calc').value = ((parseFloat(this.value)||0)+(parseFloat(document.getElementById('w-l-prot')?.value)||0)).toFixed(2)">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">PROTEÍNA (%)</label>
                <input type="number" id="w-l-prot" value="${data.proteina || ''}" step="0.01" class="wizard-input font-900" oninput="document.getElementById('w-l-es-calc').value = ((parseFloat(document.getElementById('w-l-grasa')?.value)||0)+(parseFloat(this.value)||0)).toFixed(2)">
              </div>
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">${Icons.grafico()} EXTRACTO SECO TOTAL (%)</label>
              <input type="text" id="w-l-es-calc" value="${esCalc}" class="wizard-input text-green font-950 border-green bg-black" readonly>
            </div>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">GERMENES (UFC/ML)</label>
                <input type="number" id="w-l-ger" value="${data.germenes || ''}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">SOMÁTICAS (CEL/ML)</label>
                <input type="number" id="w-l-som" value="${data.somaticas || ''}" class="wizard-input font-800">
              </div>
            </div>
            <label class="flex items-center gap-10 text-sm text-white cursor-pointer bg-black border border-222 p-10 rounded-sm mb-12">
                <input type="checkbox" id="w-l-ant" ${data.antibioticos ? 'checked' : ''} style="accent-color:#ef4444;">
                <span class="${data.antibioticos ? 'text-red font-950' : 'text-aaa font-800'} uppercase text-[0.65rem]">${Icons.fitosanitario()} ANTIBIÓTICOS DETECTADOS</span>
            </label>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA ANÁLISIS</label>
                <input type="date" id="w-l-fec-an" value="${data.fecha_analisis || ''}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº BOLETÍN</label>
                <input type="text" id="w-l-bol" value="${data.nro_boletin || ''}" class="wizard-input uppercase font-800" placeholder="0000">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">LABORATORIO EMISOR</label>
              <select id="w-l-lab" class="wizard-input font-800">
                <option value="LIGAL" ${data.laboratorio_nombre === 'LIGAL' ? 'selected' : ''}>LIGAL (OFICIAL)</option>
                <option value="Otro" ${data.laboratorio_nombre === 'Otro' ? 'selected' : ''}>OTRO LABORATORIO</option>
              </select>
            </div>
          </div>`;
        },
        onChange: async (data) => {
          data.grasa = parseFloat(document.getElementById('w-l-grasa')?.value) || 0;
          data.proteina = parseFloat(document.getElementById('w-l-prot')?.value) || 0;
          data.germenes = parseFloat(document.getElementById('w-l-ger')?.value) || 0;
          data.somaticas = parseFloat(document.getElementById('w-l-som')?.value) || 0;
          data.antibioticos = document.getElementById('w-l-ant')?.checked || false;
          data.fecha_analisis = document.getElementById('w-l-fec-an')?.value || data.fecha_analisis;
          data.nro_boletin = document.getElementById('w-l-bol')?.value.trim() || data.nro_boletin;
          data.laboratorio_nombre = document.getElementById('w-l-lab')?.value || data.laboratorio_nombre;
        },
        validate: async (data) => {
          return true;
        }
      },

      {
        content: (data) => {
          const es = (parseFloat(data.grasa || 0) + parseFloat(data.proteina || 0)).toFixed(2);
          const pBase = parseFloat(data.pb) || refPrecios.precio_base_referencia;
          const pExt = parseFloat(data.precio_extracto_seco) || refPrecios.precio_por_punto_extracto;
          const tasa = refPrecios.tasa_INLAC_defecto;
          const primas = parseFloat(data.primas_penalizaciones) || 0;
          const precioFinal = parseFloat((pBase + (parseFloat(es) * pExt) - tasa + primas).toFixed(4));
          const vol = parseFloat(data.l) || 0;
          const importeTotal = parseFloat((vol * precioFinal).toFixed(2));

          return `
          <div class="card card-accent card-accent-green p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #10b981">LIQUIDACIÓN ESTIMADA</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">VOLUMEN RECOGIDO (LITROS)</label>
              <input type="number" id="w-l-cant" value="${data.l}" class="wizard-input border-green font-950 text-2xl text-green"
                onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
            </div>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">PRECIO BASE (€/L)</label>
                <input type="number" id="w-l-pb" value="${data.pb || refPrecios.precio_base_referencia}" step="0.001" class="wizard-input font-800"
                  onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">PRECIO ES (€/PTO)</label>
                <input type="number" id="w-l-pex" value="${data.precio_extracto_seco || refPrecios.precio_por_punto_extracto}" step="0.001" class="wizard-input font-800"
                  onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
              </div>
            </div>
            <div class="wizard-input-group mb-16">
              <label class="wizard-label">PRIMAS / PENALIZACIONES (€)</label>
              <input type="number" id="w-l-prim" value="${data.primas_penalizaciones || 0}" step="0.01" class="wizard-input font-800"
                onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
            </div>
            <div class="bg-black border border-222 rounded-sm p-14 mt-12">
              <div class="grid grid-cols-2 gap-8 text-[0.65rem] uppercase font-900 tracking-tight">
                <div>EXTRACTO SECO: <strong class="text-gold" id="w-l-es-display">${es}</strong>%</div>
                <div>TASA INLAC: <strong class="text-aaa">${tasa} €</strong></div>
                <div class="mt-4 border-top-222 pt-4">PRECIO FINAL:</div><div class="mt-4 border-top-222 pt-4 text-right"><strong id="w-l-precio-final-display" class="text-green text-sm">${precioFinal.toFixed(4)} €/L</strong></div>
                <div class="mt-2">IMPORTE TOTAL:</div><div class="mt-2 text-right"><strong id="w-l-importe-display" class="text-green text-lg">${importeTotal.toFixed(2)} €</strong></div>
              </div>
            </div>
          </div>`;
        },
        onChange: async (data) => {
          data.l = parseFloat(document.getElementById('w-l-cant')?.value) || 0;
          data.pb = parseFloat(document.getElementById('w-l-pb')?.value) || 0;
          data.precio_extracto_seco = parseFloat(document.getElementById('w-l-pex')?.value) || 0;
          data.primas_penalizaciones = parseFloat(document.getElementById('w-l-prim')?.value) || 0;
        },
        validate: async (data) => {
          if (data.l <= 0) { App.toastError("El volumen debe ser mayor a 0"); return false; }
          return true;
        }
      },

      {
        content: (data) => {
          const vol = parseFloat(data.l) || 0;
          const pBase = parseFloat(data.pb) || 0;
          const es = (parseFloat(data.grasa || 0) + parseFloat(data.proteina || 0)).toFixed(2);
          const pExt = parseFloat(data.precio_extracto_seco) || 0;
          const tasa = refPrecios.tasa_INLAC_defecto;
          const primas = parseFloat(data.primas_penalizaciones) || 0;
          const precioFinal = parseFloat((pBase + (parseFloat(es) * pExt) - tasa + primas).toFixed(4));
          const importeTotal = parseFloat((vol * precioFinal).toFixed(2));
          const costeAlim = parseFloat(data.coste_alimentacion_periodo) || 0;
          const mofa = parseFloat((importeTotal - costeAlim).toFixed(2));

          return `
          <div class="card card-accent card-accent-amber p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--p-gold)">${Icons.grafico()} ANÁLISIS DE RENTABILIDAD</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">COSTE ALIMENTACIÓN DIARIO (€/DÍA)</label>
              <input type="number" id="w-l-cost-dia" value="${data.coste_alimentacion_diario || ''}" step="0.01" class="wizard-input font-800">
            </div>
            <div class="wizard-input-group mb-16">
              <label class="wizard-label">COSTE ALIMENTACIÓN PERÍODO (€)</label>
              <input type="number" id="w-l-cost-per" value="${costeAlim || ''}" step="0.01" class="wizard-input font-900 text-lg"
                onchange="App._recalcularMOFA()" oninput="App._recalcularMOFA()">
            </div>

            <div class="p-16 bg-black border border-222 rounded-sm" style="margin-top:14px;">
              <div class="text-[0.6rem] text-gold font-950 uppercase tracking-widest mb-10 text-center border-bottom-222 pb-6">RESUMEN DE SALIDA LÁCTEA</div>
              <table class="text-[0.65rem] w-full uppercase font-900 tracking-tight" style="border-collapse:collapse;">
                <tr><td class="text-gray py-4">FECHA:</td><td class="text-right text-white py-4">${data.fecha}</td></tr>
                <tr><td class="text-gray py-4">CISTERNA:</td><td class="text-right text-white py-4">${data.matricula || '—'}</td></tr>
                <tr><td class="text-gray py-4">VOLUMEN:</td><td class="text-right text-white py-4">${vol.toLocaleString()} L</td></tr>
                <tr><td class="text-gray py-4">EXTRACTO SECO:</td><td class="text-right text-gold py-4">${es}%</td></tr>
                <tr><td class="text-gray py-4">PRECIO FINAL:</td><td class="text-right text-green py-4">${precioFinal.toFixed(4)} €/L</td></tr>
                <tr><td class="text-gray py-4">IMPORTE TOTAL:</td><td class="text-right text-green font-950 py-4" id="w-l-resumen-importe">${importeTotal.toFixed(2)} €</td></tr>
                <tr><td class="text-gray py-4">COSTE ALIM.:</td><td class="text-right text-red py-4" id="w-l-resumen-coste">${costeAlim.toFixed(2)} €</td></tr>
                <tr class="border-top-222"><td class="text-white font-950 pt-8">MOFA:</td>
                  <td class="font-950 pt-8 text-right" style="color:${mofa >= 0 ? '#10b981' : '#ef4444'}; font-size:1rem;" id="w-l-resumen-mofa">
                    ${mofa.toFixed(2)} € ${mofa >= 0 ? 'OK' : 'CRÍTICO'}</td></tr>
              </table>
              ${mofa < 0 ? '<div class="text-red text-[0.55rem] mt-10 text-center font-900 tracking-tighter uppercase">ALERTA: EL COSTE DE ALIMENTACIÓN SUPERA LOS INGRESOS</div>' : ''}
            </div>
          </div>`;
        },
        onChange: async (data) => {
          data.coste_alimentacion_diario = parseFloat(document.getElementById('w-l-cost-dia')?.value) || 0;
          data.coste_alimentacion_periodo = parseFloat(document.getElementById('w-l-cost-per')?.value) || 0;
        },
        validate: async (data) => {
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-leche-colectivo-container',
      title: 'SALIDA LÁCTEA',
      initialData: {
        id: borrador ? borrador.id : undefined,
        fecha: borrador ? borrador.fechaRecogida : new Date().toISOString().split("T")[0],
        comunidad_autonoma: borrador ? borrador.comunidad_autonoma : (finca.comunidad_autonoma || ''),
        contrato_numero: borrador ? borrador.contrato_numero : (finca.contrato_lacteo_numero || ''),
        adsg_codigo: borrador ? borrador.adsg_codigo : (finca.adsg_codigo || ''),
        matricula: borrador ? borrador.matriculaCisterna : "",
        q: borrador ? borrador.numero_Muestra_Letra_Q : "",
        numero_infolac: borrador ? borrador.numero_infolac : (finca.numero_infolac || ''),
        numero_muestreo_oficial: borrador ? borrador.numero_muestreo_oficial : '',
        hora_ordeno: borrador ? borrador.hora_ordeno : '',
        hora_carga: borrador ? borrador.hora_carga : '',
        temp: borrador ? borrador.temperatura : 4.5,
        cadena_frio_cumplida: borrador ? !!borrador.cadena_frio_cumplida : true,
        inh: borrador ? !!borrador.certificadoInhibidores : true,
        grasa: borrador ? borrador.laboratorio?.grasa : '',
        proteina: borrador ? borrador.laboratorio?.proteina : '',
        germenes: borrador ? borrador.laboratorio?.germenes : '',
        somaticas: borrador ? borrador.laboratorio?.somaticas : '',
        antibioticos: borrador ? !!borrador.laboratorio?.antibioticos : false,
        fecha_analisis: borrador ? borrador.laboratorio?.fecha_analisis : new Date().toISOString().split("T")[0],
        nro_boletin: borrador ? borrador.laboratorio?.nro_boletin : '',
        laboratorio_nombre: borrador ? borrador.laboratorio?.laboratorio_nombre : 'LIGAL',
        estado_tramite_infolac: borrador ? borrador.estado_tramite_infolac : 'borrador',
        fecha_presentacion_infolac: borrador ? borrador.fecha_presentacion_infolac : '',
        numero_registro_infolac: borrador ? borrador.numero_registro_infolac : '',
        acuse_infolac: borrador ? borrador.acuse_infolac : '',
        l: borrador ? borrador.cantidad : 0,
        pb: borrador ? borrador.precioBase : refPrecios.precio_base_referencia,
        precio_extracto_seco: borrador ? borrador.precio_extracto_seco : refPrecios.precio_por_punto_extracto,
        primas_penalizaciones: borrador ? borrador.primas_penalizaciones : 0,
        coste_alimentacion_diario: borrador ? borrador.coste_alimentacion_diario : 0,
        coste_alimentacion_periodo: borrador ? borrador.coste_alimentacion_periodo : 0,
      },
      steps: wizardSteps,
      onComplete: async (dataLeche) => {
        try {
          // Validación GAP 5: Bloquear venta de leche si prohibidoLeche está activo
          const sanitarios = await window.Sanitarios.list(null, fincaId);
          const prohibidoLecheActivo = sanitarios && sanitarios.some(s => s.prohibidoLeche === true);
          if (prohibidoLecheActivo) {
            const motivo = sanitarios.find(s => s.prohibidoLeche === true);
            App.toastError(`🚫 VENTA DE LECHE PROHIBIDA: Se ha detectado un tratamiento con restricción. Consultá con Inspección (${motivo.tipo_tratamiento || 'medicamento'}). Revisa SANEAMIENTOS.`);
            return;
          }

          // Calcular campos derivados
          const extractoSeco = parseFloat((parseFloat(dataLeche.grasa || 0) + parseFloat(dataLeche.proteina || 0)).toFixed(2));
          const pBase = parseFloat(dataLeche.pb) || 0;
          const pExt = parseFloat(dataLeche.precio_extracto_seco) || 0;
          const tasa = refPrecios.tasa_INLAC_defecto;
          const primas = parseFloat(dataLeche.primas_penalizaciones) || 0;
          const precioFinal = parseFloat((pBase + (extractoSeco * pExt) - tasa + primas).toFixed(4));
          const cantidad = parseFloat(dataLeche.l) || 0;
          const importeTotal = parseFloat((cantidad * precioFinal).toFixed(2));
          const costeAlim = parseFloat(dataLeche.coste_alimentacion_periodo) || 0;
          const mofa = parseFloat((importeTotal - costeAlim).toFixed(2));

          // Estado analítico basado en antibióticos
          const estadoAnalitica = dataLeche.antibioticos ? "Alerta Crítica" : (dataLeche.grasa ? "Validado" : "Pendiente");

          // Construir el registro completo
          const reg = {
            cantidad: cantidad,
            fechaRecogida: dataLeche.fecha,
            fincaId: fincaId,
            matriculaCisterna: dataLeche.matricula,
            numero_Muestra_Letra_Q: dataLeche.q,
            temperatura: dataLeche.temp,
            certificadoInhibidores: dataLeche.inh,
            precioBase: pBase,
            estadoAnalitica: estadoAnalitica,
            tasa_INLAC: tasa,
            antibioticos: dataLeche.antibioticos || false,
            comunidad_autonoma: dataLeche.comunidad_autonoma || null,
            contrato_numero: dataLeche.contrato_numero || '',
            adsg_codigo: dataLeche.adsg_codigo || '',
            estado_tramite_infolac: dataLeche.estado_tramite_infolac || 'borrador',
            fecha_presentacion_infolac: dataLeche.fecha_presentacion_infolac || null,
            numero_registro_infolac: dataLeche.numero_registro_infolac || '',
            acuse_infolac: dataLeche.acuse_infolac || '',
            rega_origen: finca.codigo_REGA || finca.rega || '',
            numero_infolac: dataLeche.numero_infolac || '',
            numero_muestreo_oficial: dataLeche.numero_muestreo_oficial || '',
            cadena_frio_cumplida: dataLeche.cadena_frio_cumplida || false,
            hora_ordeno: dataLeche.hora_ordeno || '',
            hora_carga: dataLeche.hora_carga || '',
            laboratorio: {
              grasa: dataLeche.grasa || 0,
              proteina: dataLeche.proteina || 0,
              somaticas: dataLeche.somaticas || 0,
              germenes: dataLeche.germenes || 0,
              antibioticos: dataLeche.antibioticos || false,
              fecha_analisis: dataLeche.fecha_analisis || '',
              extracto_seco: extractoSeco,
              recuento_bacterias: dataLeche.germenes || 0,
              antibioticos_positivos: dataLeche.antibioticos || false,
              laboratorio_nombre: dataLeche.laboratorio_nombre || 'LIGAL',
              nro_boletin: dataLeche.nro_boletin || '',
            },
            precio_extracto_seco: pExt,
            primas_penalizaciones: primas,
            precio_final_unitario: precioFinal,
            importe_total: importeTotal,
            coste_alimentacion_diario: dataLeche.coste_alimentacion_diario || 0,
            coste_alimentacion_periodo: costeAlim,
            mofa: mofa,
            creadoEn: borrador ? borrador.creadoEn : new Date().toISOString(),
          };

          let idL;
          if (dataLeche.id) {
            reg.id = Number(dataLeche.id);
            await window.db.put("comercializacion_leche", reg);
            idL = reg.id;
          } else {
            idL = await window.db.add("comercializacion_leche", reg);
          }
          const numeroDocInfolac = `INFOLAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${idL}`;
          
          const docsLegales = await window.db.getAll('documentos_legales').catch(() => []);
          const docPrevio = docsLegales.find(d => d.tipo === 'infolac_declaracion' && d.referencia_operacion_id === idL);
          const docData = {
            id: docPrevio ? docPrevio.id : undefined,
            tipo: 'infolac_declaracion',
            fincaId,
            numero: numeroDocInfolac,
            fecha_emision: dataLeche.fecha,
            estado_tramite: reg.estado_tramite_infolac,
            fecha_presentacion: reg.fecha_presentacion_infolac,
            numero_registro_oficial: reg.numero_registro_infolac,
            acuse_recibo: reg.acuse_infolac,
            referencia_operacion_id: idL,
            plataforma: window.ComunidadesService?.getConfiguracionCCAA?.(dataLeche.comunidad_autonoma || '')?.sistema_movimiento || '',
            created_at: docPrevio ? docPrevio.created_at : new Date().toISOString(),
            actualizadoEn: new Date().toISOString()
          };
          if (docData.id) {
            await window.db.put('documentos_legales', docData);
          } else {
            await window.db.add('documentos_legales', docData);
          }
          const est = await window.Trazabilidad.generarEstructuraAlbaran(
            window.db,
            { ...reg, id: idL },
            "leche"
          );

          // Registrar en el Libro Maestro de Eventos
          try {
            await window.Pesajes.registrar({
              entidad_id: Number(idL),
              tipo_entidad: 'tanque_leche',
              motivo_tarea: 'produccion_leche',
              fecha: dataLeche.fecha,
              valor_neto: cantidad,
              unidad: 'L',
              precio_unitario: pBase,
              matricula: dataLeche.matricula,
              calidad: {
                temperatura: dataLeche.temp,
                inhibidores: dataLeche.inh,
                extracto_seco: extractoSeco,
                antibioticos: dataLeche.antibioticos,
              },
              rol_contable: 'VENTA',
              snap_comunidad: dataLeche.comunidad_autonoma || null,
              snap_mofa: mofa,
              snap_contrato: dataLeche.contrato_numero || '',
            });
          } catch (regErr) {
            console.warn("[Leche] No se pudo registrar en evento maestro:", regErr);
          }

          App.toast("✅ Salida láctea registrada.");
          // Refrescar vista
          if (window.LecheView) {
            window.LecheView._cachedData = null;
            await window.LecheView.render();
          } else {
            App.renderLeche();
          }
          await App.imprimirAlbaran(est, "leche");
        } catch (e) {
          App.toastError(e.message);
        }
      }
    });
  }
};
