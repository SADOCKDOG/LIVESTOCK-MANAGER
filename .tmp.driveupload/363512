/**
 * Wizard Albarán de Leche (Salida Láctea)
 * Extraído de app.js para modularización (Fase 3)
 */
window.AlbaranLecheWizard = {
  async open() {
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
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA RECOGIDA</label>
              <input type="date" id="w-l-fecha" value="${data.fecha}" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">COMUNIDAD AUTÓNOMA</label>
              <select id="w-l-ccaa" class="wizard-input wizard-select">
                <option value="">— Seleccionar —</option>
                ${opcionesCCAA.map(o =>
                  `<option value="${o.value}" ${data.comunidad_autonoma === o.value ? 'selected' : ''}>${o.label}</option>`
                ).join('')}
              </select>
            </div>
            <div id="w-l-ccaa-info" class="text-xs text-aaa rounded-sm p-10 bg-darker d-none border-left-blue" style="margin:8px 0;"></div>
            <div class="wizard-input-group">
              <label class="wizard-label">Nº CONTRATO LÁCTEO</label>
              <input type="text" id="w-l-ctr" value="${data.contrato_numero || finca.contrato_lacteo_numero || ''}" placeholder="Ej: CT-2026-001" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CÓDIGO ADSG</label>
              <input type="text" id="w-l-adsg" value="${data.adsg_codigo || finca.adsg_codigo || ''}" placeholder="Código ADSG" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ESTADO DECLARACIÓN INFOLAC</label>
              <select id="w-l-estado-tramite" class="wizard-input wizard-select">
                <option value="borrador" ${data.estado_tramite_infolac === 'borrador' ? 'selected' : ''}>Borrador</option>
                <option value="presentado" ${data.estado_tramite_infolac === 'presentado' ? 'selected' : ''}>Presentado</option>
                <option value="aceptado" ${data.estado_tramite_infolac === 'aceptado' ? 'selected' : ''}>Aceptado</option>
                <option value="rechazado" ${data.estado_tramite_infolac === 'rechazado' ? 'selected' : ''}>Rechazado</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA PRESENTACIÓN</label>
                <input type="date" id="w-l-fecha-pres" value="${data.fecha_presentacion_infolac || ''}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº REGISTRO OFICIAL</label>
                <input type="text" id="w-l-reg-of" value="${data.numero_registro_infolac || ''}" class="wizard-input" placeholder="Asiento oficial">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ACUSE / JUSTIFICANTE</label>
              <input type="text" id="w-l-acuse" value="${data.acuse_infolac || ''}" class="wizard-input" placeholder="Código de acuse">
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

      // =====================================================
      // PASO 2: Recogida — Cisterna, Letra Q, INFOLAC
      // =====================================================
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
                bloqueadosHtml += `<div class="text-red" style="background: rgba(239,68,68,0.1); border-left:3px solid #ef4444; padding:8px; margin-bottom:6px; border-radius:4px; font-size:0.82rem;">
                  <strong>${a.numero_identificacion}</strong> — ${control.motivo}</div>`;
              }
            } catch (_) {}
          }
          let advHtml = totalBloqueados > 0
            ? `<div style="background:#2a0808; border:1px solid #ef4444; padding:12px; border-radius:10px; margin-top:10px;">
                <h4 class="text-red text-sm" style="margin:0 0 8px;">⚠️ ${totalBloqueados} HEMBRAS CON LECHE RETENIDA</h4>
                <p style="font-size:0.8rem; color:#fca5a5; margin-bottom:8px;">Verifica que su leche <strong>no entró en el tanque</strong>.</p>
                <div style="max-height:130px; overflow-y:auto;">${bloqueadosHtml}</div>
                <label class="wizard-checkbox-container" style="margin-top:8px; background:rgba(0,0,0,0.5); padding:8px; border-radius:6px;">
                  <input type="checkbox" id="w-l-confirm-separacion" required>
                  <span class="text-red font-bold text-82">Confirmo que la leche contaminada fue desechada</span>
                </label>
              </div>`
            : `<div class="text-center" style="margin-top:10px; background:rgba(16,185,129,0.1); border:1px solid #10b981; padding:12px; border-radius:10px;">
                <h4 class="text-green text-sm" class="m-0">✅ 0 Hembras con leche retenida</h4>
                <p style="font-size:0.8rem; color:#a7f3d0; margin:4px 0 0;">Rebaño libre de medicamentos prohibidos.</p>
              </div>`;

          return `
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">MATRÍCULA CISTERNA</label>
              <input type="text" id="w-l-mat" value="${data.matricula}" placeholder="Placa del transporte..." class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">NÚMERO MUESTRA LETRA Q</label>
              <input type="text" id="w-l-q" value="${data.q}" placeholder="Código bote muestra..." class="wizard-input">
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº INFOLAC</label>
                <input type="text" id="w-l-infolac" value="${data.numero_infolac || ''}" placeholder="INFOLAC-..." class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº MUESTREO OFICIAL</label>
                <input type="text" id="w-l-muest" value="${data.numero_muestreo_oficial || ''}" placeholder="LIGAL..." class="wizard-input">
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

      // =====================================================
      // PASO 3: Cadena de Frío + Temperatura + Inhibidores
      // =====================================================
      {
        content: (data) => `
          <div class="mt-10">
            <div class="grid grid-cols-2 gap-8">
              <div class="wizard-input-group">
                <label class="wizard-label">HORA ORDEÑO</label>
                <input type="time" id="w-l-hor" value="${data.hora_ordeno || ''}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">HORA CARGA</label>
                <input type="time" id="w-l-hcar" value="${data.hora_carga || ''}" class="wizard-input">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">TEMPERATURA DE CARGA (ºC)</label>
              <input type="number" id="w-l-temp" value="${data.temp}" step="0.1" class="wizard-input">
            </div>
            <div class="text-xs text-aaa rounded-sm p-10 bg-darker border-left-blue" style="margin:8px 0;">
              ❄️ <strong>Cadena de frío legal:</strong> La leche debe enfriarse de 37°C a &lt;4°C en menos de 2 horas.
              ${data.temp <= 4 ? `<span class="text-green">✅ Actual: ${data.temp}°C — CUMPLE</span>` : `<span class="text-red">⚠️ Actual: ${data.temp}°C — REVISAR</span>`}
            </div>
            <label class="wizard-checkbox-container mt-6">
              <input type="checkbox" id="w-l-frio" ${data.cadena_frio_cumplida ? 'checked' : ''}>
              <span>Certifico cadena de frío cumplida (&lt;4°C en &lt;2h)</span>
            </label>
            <label class="wizard-checkbox-container mt-6">
              <input type="checkbox" id="w-l-inh" ${data.inh ? 'checked' : ''}>
              <span>Certifico ausencia absoluta de inhibidores / biocidas</span>
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

      // =====================================================
      // PASO 4: Laboratorio — Resultados Analíticos
      // =====================================================
      {
        content: (data) => {
          const esCalc = (data.grasa != null && data.proteina != null)
            ? parseFloat((parseFloat(data.grasa || 0) + parseFloat(data.proteina || 0)).toFixed(2))
            : '';
          return `
          <div class="mt-10">
            <p class="text-xs text-gray mb-12">Introduce los resultados del boletín analítico. El extracto seco (Grasa + Proteína) se calcula automáticamente.</p>
            <div class="grid grid-cols-2 gap-8">
              <div class="wizard-input-group">
                <label class="wizard-label">MATERIA GRASA (%)</label>
                <input type="number" id="w-l-grasa" value="${data.grasa || ''}" step="0.01" class="wizard-input" oninput="document.getElementById('w-l-es-calc').value = ((parseFloat(this.value)||0)+(parseFloat(document.getElementById('w-l-prot')?.value)||0)).toFixed(2)">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">PROTEÍNA (%)</label>
                <input type="number" id="w-l-prot" value="${data.proteina || ''}" step="0.01" class="wizard-input" oninput="document.getElementById('w-l-es-calc').value = ((parseFloat(document.getElementById('w-l-grasa')?.value)||0)+(parseFloat(this.value)||0)).toFixed(2)">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">${Icons.grafico()} EXTRACTO SECO CALCULADO (%)</label>
              <input type="text" id="w-l-es-calc" value="${esCalc}" class="wizard-input text-green font-bold border-green" readonly style="background:#222;">
            </div>
            <div class="grid grid-cols-2 gap-8 mt-12">
              <div class="wizard-input-group">
                <label class="wizard-label">RECUENTO BACTERIAS (UFC/mL)</label>
                <input type="number" id="w-l-ger" value="${data.germenes || ''}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CÉLULAS SOMÁTICAS (cel/mL)</label>
                <input type="number" id="w-l-som" value="${data.somaticas || ''}" class="wizard-input">
              </div>
            </div>
            <div class="flex items-center gap-12 mt-12 rounded-sm p-10 bg-darker">
              <label class="flex items-center gap-6 text-sm" class="cursor-pointer">
                <input type="checkbox" id="w-l-ant" ${data.antibioticos ? 'checked' : ''}>
                <span class="${data.antibioticos ? 'text-red' : 'text-gray'}">${Icons.fitosanitario()} Antibióticos detectados</span>
              </label>
            </div>
            <div class="grid grid-cols-2 gap-8 mt-12">
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA ANÁLISIS</label>
                <input type="date" id="w-l-fec-an" value="${data.fecha_analisis || ''}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº BOLETÍN</label>
                <input type="text" id="w-l-bol" value="${data.nro_boletin || ''}" class="wizard-input">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">LABORATORIO</label>
              <select id="w-l-lab" class="wizard-input wizard-select">
                <option value="LIGAL" ${data.laboratorio_nombre === 'LIGAL' ? 'selected' : ''}>LIGAL (Oficial)</option>
                <option value="Otro" ${data.laboratorio_nombre === 'Otro' ? 'selected' : ''}>Otro laboratorio</option>
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

      // =====================================================
      // PASO 5: Precio y Liquidación
      // =====================================================
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
          <div class="mt-10">
            <div class="wizard-input-group">
              <label class="wizard-label">VOLUMEN RECOGIDO (LITROS)</label>
              <input type="number" id="w-l-cant" value="${data.l}" class="wizard-input border-green" style="font-size:1rem;"
                onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div class="wizard-input-group">
                <label class="wizard-label">PRECIO BASE (€/L)</label>
                <input type="number" id="w-l-pb" value="${data.pb || refPrecios.precio_base_referencia}" step="0.001" class="wizard-input"
                  onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">PRECIO EXTRACTO SECO (€/pto)</label>
                <input type="number" id="w-l-pex" value="${data.precio_extracto_seco || refPrecios.precio_por_punto_extracto}" step="0.001" class="wizard-input"
                  onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">PRIMAS / PENALIZACIONES (€)</label>
              <input type="number" id="w-l-prim" value="${data.primas_penalizaciones || 0}" step="0.01" class="wizard-input"
                onchange="App._recalcularPrecioLeche()" oninput="App._recalcularPrecioLeche()">
            </div>
            <div class="bg-darker border-muted rounded-10 p-14 mt-12">
              <div class="grid grid-cols-2 gap-8 text-sm">
                <div>Extracto seco: <strong class="text-gold" id="w-l-es-display">${es}</strong>%</div>
                <div>Tasa INLAC: <strong class="text-gray">${tasa} €</strong></div>
                <div>Precio final unitario: <strong id="w-l-precio-final-display" class="text-green">${precioFinal.toFixed(4)} €/L</strong></div>
                <div>Importe total: <strong id="w-l-importe-display" class="text-green">${importeTotal.toFixed(2)} €</strong></div>
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

      // =====================================================
      // PASO 6: MOFA + Resumen Final
      // =====================================================
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
          <div class="mt-10">
            <h4 class="text-amber text-base mt-0 mb-12">${Icons.grafico()} MOFA — Margen sobre Coste de Alimentación</h4>
            <div class="wizard-input-group">
              <label class="wizard-label">COSTE ALIMENTACIÓN DIARIO (€/día)</label>
              <input type="number" id="w-l-cost-dia" value="${data.coste_alimentacion_diario || ''}" step="0.01" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">COSTE ALIMENTACIÓN PERÍODO (€)</label>
              <input type="number" id="w-l-cost-per" value="${costeAlim || ''}" step="0.01" class="wizard-input"
                onchange="App._recalcularMOFA()" oninput="App._recalcularMOFA()">
            </div>

            <div class="p-16 bg-darker border-muted rounded" style="margin-top:14px;">
              <h5 class="text-white text-sm" style="margin:0 0 12px;">${Icons.documento()} RESUMEN DE LA SALIDA LÁCTEA</h5>
              <table class="text-sm w-full" style="border-collapse:collapse;">
                <tr><td class="text-gray" class="py-4">Fecha</td><td class="text-right text-white" class="py-4">${data.fecha}</td></tr>
                <tr><td class="text-gray" class="py-4">CCAA</td><td class="text-right text-white" class="py-4">${data.comunidad_autonoma ? opcionesCCAA.find(o=>o.value===data.comunidad_autonoma)?.label || data.comunidad_autonoma : '—'}</td></tr>
                <tr><td class="text-gray" class="py-4">Cisterna</td><td class="text-right text-white" class="py-4">${data.matricula || '—'}</td></tr>
                <tr><td class="text-gray" class="py-4">Volumen</td><td class="text-right text-white" class="py-4">${vol.toLocaleString()} L</td></tr>
                <tr><td class="text-gray" class="py-4">Extracto seco</td><td class="text-right text-gold" class="py-4">${es}%</td></tr>
                <tr><td class="text-gray" class="py-4">Precio final</td><td class="text-right text-green" class="py-4">${precioFinal.toFixed(4)} €/L</td></tr>
                <tr><td class="text-gray" class="py-4">Importe total</td><td class="text-right text-green font-bold" class="py-4" id="w-l-resumen-importe">${importeTotal.toFixed(2)} €</td></tr>
                <tr><td class="text-gray" class="py-4">Coste alimentación</td><td class="text-right text-red" class="py-4" id="w-l-resumen-coste">${costeAlim.toFixed(2)} €</td></tr>
                <tr><td class="text-white font-bold" style="padding:6px 0 0; border-top:1px solid #333;">MOFA</td>
                  <td class="font-bold" style="text-align:right; border-top:1px solid #333; color:${mofa >= 0 ? '#10b981' : '#ef4444'}; font-size:1rem;" id="w-l-resumen-mofa">
                    ${mofa.toFixed(2)} € ${mofa >= 0 ? '✅' : '⚠️'}</td></tr>
              </table>
              ${mofa < 0 ? '<p class="text-red text-xs mt-8">⚠️ El MOFA es negativo — el coste de alimentación supera los ingresos. Revisa la ración o el precio de venta.</p>' : ''}
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
        fecha: new Date().toISOString().split("T")[0],
        comunidad_autonoma: finca.comunidad_autonoma || '',
        contrato_numero: finca.contrato_lacteo_numero || '',
        adsg_codigo: finca.adsg_codigo || '',
        matricula: "",
        q: "",
        numero_infolac: finca.numero_infolac || '',
        numero_muestreo_oficial: '',
        hora_ordeno: '',
        hora_carga: '',
        temp: 4.5,
        cadena_frio_cumplida: true,
        inh: true,
        grasa: '',
        proteina: '',
        germenes: '',
        somaticas: '',
        antibioticos: false,
        fecha_analisis: new Date().toISOString().split("T")[0],
        nro_boletin: '',
        laboratorio_nombre: 'LIGAL',
        estado_tramite_infolac: 'borrador',
        fecha_presentacion_infolac: '',
        numero_registro_infolac: '',
        acuse_infolac: '',
        l: 0,
        pb: refPrecios.precio_base_referencia,
        precio_extracto_seco: refPrecios.precio_por_punto_extracto,
        primas_penalizaciones: 0,
        coste_alimentacion_diario: 0,
        coste_alimentacion_periodo: 0,
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
            creadoEn: new Date().toISOString(),
          };

          const idL = await window.db.add("comercializacion_leche", reg);
          const numeroDocInfolac = `INFOLAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${idL}`;
          await window.db.add('documentos_legales', {
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
            created_at: new Date().toISOString()
          }).catch(() => {});
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
