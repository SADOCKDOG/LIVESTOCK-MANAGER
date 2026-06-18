/**
 * Wizard Venta Masiva de Animales
 * Extraído de app.js para modularización (Fase 3)
 */
window.VentaMasivaWizard = {
  async open() {
    const App = window.App;
    if (!App) return console.error("App no disponible");

    // Cargar compradores para el selector (con fallback)
    const compradoresList = await window.Compradores.list({ activo: true }).catch(async () => {
      console.warn("[WizardVenta] Fallback: cargando compradores sin filtro activo");
      return await window.Compradores.list().catch(() => []);
    });

    const initialData = {
      fechaSacrificio: new Date().toISOString().split("T")[0],
      codigoMatadero: "Matadero Central",
      codigoICA: "",
      numeroGuia: "",
      confirmacionFitosanitarios: false,
      compradorId: null,
      nifComprador: "",
      razonSocial: "",
      ivaPct: 10,
      retencionPct: 0,
      pVivo: 0,
      pCanal: 0,
      gTrans: 0,
      gMata: 0,
      seleccionados: [],
      _compradores: compradoresList,
      _compradoresLoaded: true,
      // Transportista
      transportistaId: null,
      nombreTransportista: "",
      nifTransportista: "",
      matriculaTransportista: "",
      // Autorización veterinaria
      vet_nombre: "",
      vet_colegiado: "",
      vet_fecha_autorizacion: new Date().toISOString().split("T")[0],
      dimoe_generado: false,
    };

    App.toast("Analizando censo y estado sanitario...");

    const wizardSteps = [
      {
        content: async (data) => {
          const animales = await window.Animales.list();
          const rebanos = await window.Rebanos.list();
          const animalesActivos = animales.filter(
            (a) => a.estado === "activo" || a.estado === "Activo"
          );

          // Cargar eventos de reproducción para gestación
          let eventosRepro = [];
          try {
            eventosRepro = await window.db.getAll('reproduccion_eventos') || [];
          } catch(e) { /* store puede no existir */ }

          let tablaFilasHtml = "";
          let totalBloqueados = 0;

          const checkPromises = animalesActivos.map((animal) =>
            (async () => {
              const rebano = rebanos.find((r) => r.id === animal.rebanoId) || { nombre: "S/R" };
              try {
                const controlSanitario = await Promise.race([
                  window.Trazabilidad.checkSupresion(window.db, animal.id, data.fechaSacrificio, "carne"),
                  new Promise((resolve) => setTimeout(() => resolve({ apto: true, motivo: "timeout" }), 3000)),
                ]);
                // Gate: Edad mínima
                const hoy = new Date();
                const nac = animal.fecha_nacimiento ? new Date(animal.fecha_nacimiento) : null;
                let edadTexto = 'N/D', gateEdad = true, edadMeses = 0;
                if (nac && !isNaN(nac)) {
                  edadMeses = Math.floor((hoy - nac) / (1000 * 60 * 60 * 24 * 30.44));
                  const edadAnios = Math.floor(edadMeses / 12);
                  const edadMesesResto = edadMeses % 12;
                  edadTexto = edadAnios > 0 ? `${edadAnios}a ${edadMesesResto}m` : `${edadMeses}m`;
                  // Edad mínima por especie
                  const especie = (animal.especie || '').toLowerCase();
                  const minMeses = especie.includes('vaca') || especie.includes('bovino') ? 12
                    : especie.includes('ovej') || especie.includes('cabra') || especie.includes('caprino') || especie.includes('ovino') ? 6
                    : especie.includes('cerdo') || especie.includes('porcino') ? 3
                    : 0;
                  if (minMeses > 0 && edadMeses < minMeses) gateEdad = false;
                }
                // Gate: DIB obligatorio para bovinos
                const especie = (animal.especie || '').toLowerCase();
                const requiereDib = especie.includes('vaca') || especie.includes('bovino');
                const gateDib = !(requiereDib && !animal.dib);
                // Gate: Gestación (hembras con diagnóstico positivo)
                let gateGestacion = true, gestacionTexto = '';
                if ((animal.sexo || '').toLowerCase() === 'hembra') {
                  const gestEventos = eventosRepro.filter(e =>
                    Number(e.animalId) === Number(animal.id) && e.tipo_evento === 'gestacion'
                  );
                  const ultimaGestacion = gestEventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
                  if (ultimaGestacion && (ultimaGestacion.resultado || '').toLowerCase() === 'positivo') {
                    const fechaGest = new Date(ultimaGestacion.fecha);
                    const partosPosteriores = eventosRepro.filter(e =>
                      Number(e.animalId) === Number(animal.id) &&
                      (e.tipo_evento === 'parto' || e.tipo_evento === 'aborto') &&
                      new Date(e.fecha) > fechaGest
                    );
                    if (partosPosteriores.length === 0) {
                      const diasGestacion = Math.floor((hoy - fechaGest) / (1000 * 60 * 60 * 24));
                      gestacionTexto = `${diasGestacion}d`;
                      if (diasGestacion > 90) gateGestacion = false;
                    }
                  }
                }
                const gateKeep = { edadTexto, gateEdad, requiereDib, gateDib, gateGestacion, gestacionTexto };
                const bloqueado = !controlSanitario.apto || !gateEdad || !gateDib || !gateGestacion;
                return { animal, rebano, controlSanitario, gateKeep, bloqueado };
              } catch (err) {
                return { animal, rebano, controlSanitario: { apto: true, motivo: "error" }, gateKeep: { gateEdad: true, gateDib: true, gateGestacion: true }, bloqueado: false };
              }
            })()
          );

          const results = await Promise.all(checkPromises);

          for (let { animal, rebano, controlSanitario, gateKeep, bloqueado } of results) {
            if (bloqueado) {
              totalBloqueados++;
              const motivos = [];
              if (!controlSanitario.apto) motivos.push(`⚠️ ${controlSanitario?.diasRestantes ?? "X"}d`);
              if (!gateKeep.gateEdad) motivos.push('👶 JOVEN');
              if (!gateKeep.gateDib) motivos.push('📋 SIN DIB');
              if (!gateKeep.gateGestacion) motivos.push('🤰 GEST.');
              tablaFilasHtml += `
              <tr style="background: rgba(220, 38, 38, 0.1); color: #f87171; border-bottom: 1px solid #450a0a;">
                  <td class="text-center p-14"><input type="checkbox" disabled style="transform: scale(1.5); opacity: 0.3;"></td>
                  <td class="font-bold p-14" style="font-size:1.0rem;">${animal.numero_identificacion}</td>
                  <td class="p-14">${animal.raza}</td>
                  <td class="p-14">${gateKeep.edadTexto}</td>
                  <td class="p-14">${gateKeep.requiereDib ? (gateKeep.gateDib ? '✅' : '❌') : '—'}</td>
                  <td class="p-14">${gateKeep.gestacionTexto ? (gateKeep.gateGestacion ? `🤰${gateKeep.gestacionTexto}` : `❌ ${gateKeep.gestacionTexto}`) : '—'}</td>
                  <td class="p-14">${rebano.nombre}</td>
                  <td class="text-red font-bold p-14">${motivos.join(' | ')}</td>
              </tr>`;
            } else {
              tablaFilasHtml += `
              <tr style="border-bottom: 1px solid #222; color: #fff;">
                  <td class="text-center p-14"><input type="checkbox" name="animal-select" value="${animal.id}" ${data.seleccionados?.includes(animal.id) ? "checked" : ""} style="transform: scale(1.5); cursor: pointer;" class="batch-animal-chk"></td>
                  <td class="text-gold font-bold p-14" style="font-size:1.0rem;">${animal.numero_identificacion}</td>
                  <td class="p-14">${animal.raza}</td>
                  <td class="p-14">${gateKeep.edadTexto}</td>
                  <td class="p-14">${gateKeep.requiereDib ? '✅' : '—'}</td>
                  <td class="p-14">${gateKeep.gestacionTexto ? `🤰${gateKeep.gestacionTexto}` : '—'}</td>
                  <td class="p-14">${rebano.nombre}</td>
                  <td class="text-green font-bold p-14">✓ APTO</td>
              </tr>`;
            }
          }

          return `
              <div class="flex gap-15 mb-20">
                  <div class="text-center bg-darker" style="flex:1; border: 2px solid #27272a; padding:15px; border-radius:16px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);"><small class="wizard-label">APTOS</small><div class="text-green font-black" style="font-size:2.2rem; margin-top:5px;">${animalesActivos.length - totalBloqueados}</div></div>
                  <div class="text-center" style="flex:1; background:#2a0808; border: 2px solid #450a0a; padding:15px; border-radius:16px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);"><small class="wizard-label text-red">BLOQUEADOS</small><div class="text-red font-black" style="font-size:2.2rem; margin-top:5px;">${totalBloqueados}</div></div>
              </div>
              <div class="text-center text-xs text-gray mb-10">
                <span style="margin-right:12px;">👶 Edad mínima</span>
                <span style="margin-right:12px;">📋 DIB (bovinos)</span>
                <span style="margin-right:12px;">🤰 Gestación &gt;3 meses</span>
                <span>💉 Supresión sanitaria</span>
              </div>
              <div style="flex:1; overflow-y: auto; border: 2px solid #27272a; border-radius: 16px; background: #0a0a0a; min-height:300px;">
                  <table class="w-full text-base" style="border-collapse: collapse;">
                      <thead style="background: #111; position: sticky; top: 0; z-index: 10;">
                          <tr>
                              <th class="text-center p-12"><input type="checkbox" id="select-all-lote" style="transform: scale(1.5);"></th>
                              <th class="text-gray p-12">ID OFICIAL</th>
                              <th class="text-gray p-12">RAZA</th>
                              <th class="text-gray p-12">EDAD</th>
                              <th class="text-gray p-12">DIB</th>
                              <th class="text-gray p-12">GEST.</th>
                              <th class="text-gray p-12">REBAÑO</th>
                              <th class="text-gray p-12">ESTADO</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${tablaFilasHtml || '<tr><td colspan="8" class="text-center text-gray-500" style="padding:30px; font-size:1.2rem;">Sin animales activos.</td></tr>'}
                      </tbody>
                  </table>
              </div>
          `;
        },
        onRender: (data, stepEl) => {
          const selAll = stepEl.querySelector("#select-all-lote");
          if (selAll) {
            selAll.addEventListener('change', (e) => {
              stepEl.querySelectorAll('.batch-animal-chk').forEach(cb => cb.checked = e.target.checked);
            });
          }
        },
        onChange: async (data) => {
          const checks = document.querySelectorAll('.batch-animal-chk:checked');
          data.seleccionados = Array.from(checks).map(c => parseInt(c.value));
        },
        validate: async (data) => {
          if (!data.seleccionados || data.seleccionados.length === 0) {
            App.toastError("Selecciona al menos un animal apto");
            return false;
          }
          return true;
        }
      },
      {
        content: (data) => `
          <div class="mt-10">
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA SACRIFICIO</label>
                <input type="date" id="w-v-fecha" value="${data.fechaSacrificio}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CÓDIGO MATADERO</label>
                <input type="text" id="w-v-mata" value="${data.codigoMatadero}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">DOCUMENTO ICA</label>
                <input type="text" id="w-v-ica" value="${data.codigoICA}" placeholder="Código ICA..." class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">GUÍA SANITARIA</label>
                <input type="text" id="w-v-guia" value="${data.numeroGuia}" placeholder="Número de guía oficial..." class="wizard-input">
              </div>
              <label class="wizard-checkbox-container">
                  <input type="checkbox" id="w-v-fitos" ${data.confirmacionFitosanitarios ? 'checked' : ''}>
                  <span>Declaración jurada fitosanitaria colectiva (Ausencia de residuos 180 días).</span>
              </label>
          </div>
        `,
        onChange: async (data) => {
          data.fechaSacrificio = document.getElementById('w-v-fecha')?.value || data.fechaSacrificio;
          data.codigoMatadero = document.getElementById('w-v-mata')?.value || data.codigoMatadero;
          data.codigoICA = document.getElementById('w-v-ica')?.value || data.codigoICA;
          data.numeroGuia = document.getElementById('w-v-guia')?.value || data.numeroGuia;
          data.confirmacionFitosanitarios = document.getElementById('w-v-fitos')?.checked || false;
        },
        validate: async (data) => {
          if (!data.codigoICA || !data.numeroGuia || !data.confirmacionFitosanitarios) {
            App.toastError("Todos los campos de trazabilidad son obligatorios.");
            return false;
          }
          return true;
        }
      },
      {
        content: (data) => `
          <div class="mt-10">
              <div class="grid grid-cols-2 gap-15">
                  <div class="wizard-input-group">
                    <label class="wizard-label">PESO VIVO TOTAL (KG)</label>
                    <input type="number" id="w-v-pv" value="${data.pVivo}" class="wizard-input">
                  </div>
                  <div class="wizard-input-group">
                    <label class="wizard-label">PESO CANAL TOTAL (KG)</label>
                    <input type="number" id="w-v-pc" value="${data.pCanal}" class="wizard-input">
                  </div>
              </div>
              <div class="grid grid-cols-2 gap-15">
                  <div class="wizard-input-group">
                    <label class="wizard-label">TRANSPORTE TOTAL (€)</label>
                    <input type="number" id="w-v-gt" value="${data.gTrans}" class="wizard-input">
                  </div>
                  <div class="wizard-input-group">
                    <label class="wizard-label">MATANZA TOTAL (€)</label>
                    <input type="number" id="w-v-gm" value="${data.gMata}" class="wizard-input">
                  </div>
              </div>
          </div>
        `,
        onChange: async (data) => {
          data.pVivo = parseFloat(document.getElementById('w-v-pv')?.value) || 0;
          data.pCanal = parseFloat(document.getElementById('w-v-pc')?.value) || 0;
          data.gTrans = parseFloat(document.getElementById('w-v-gt')?.value) || 0;
          data.gMata = parseFloat(document.getElementById('w-v-gm')?.value) || 0;
        },
        validate: async (data) => {
          if (data.pCanal >= data.pVivo && data.pVivo > 0) {
            App.toastError("Regla 3: Peso Canal no puede ser >= Peso Vivo.");
            return false;
          }
          return true;
        }
      },
      {
        content: (data) => {
          const compradores = data._compradores || [];
          return `
          <div class="mt-10">
              <div class="wizard-input-group mb-12">
                <label class="wizard-label">COMPRADOR</label>
                ${compradores.length === 0 ? `
                <div class="text-sm text-gold mb-8" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); border-radius:10px; padding:10px 12px;">
                  ⚠️ No hay compradores activos registrados. Crea uno rápidamente con el botón "➕ Nuevo".
                </div>` : ''}
                <div class="flex gap-8">
                  <select id="w-v-comprador" class="flex-1 bg-card rounded border-muted" style="font-size:0.95rem; color:white; padding:11px;"
                    onchange="App._onCompradorChangeWizard(this)">
                    <option value="">${compradores.length === 0 ? 'No hay compradores disponibles...' : 'Seleccionar comprador...'}</option>
                    ${compradores.map(c =>
                      `<option value="${c.id}" ${data.compradorId === c.id ? 'selected' : ''}>${c.nombre} ${c.nif_cif ? '('+c.nif_cif+')' : ''} — ${c.tipo_comprador}</option>`
                    ).join('')}
                  </select>
                  <button type="button" onclick="App._abrirAltaCompradorRapida()" class="text-xs text-green font-extrabold" style="padding:11px 14px; border-radius:12px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); cursor:pointer; white-space:nowrap;">➕ Nuevo</button>
                </div>
              </div>
              <div id="w-v-comprador-info" class="p-12 mb-12 bg-dark rounded-10" style="display:${data.compradorId ? 'block' : 'none'};">
                <div class="text-white text-sm" id="w-v-comprador-nombre"><strong>${data.razonSocial || ''}</strong></div>
                <div class="text-gray text-xs mt-4" id="w-v-comprador-nif">NIF: ${data.nifComprador || ''}</div>
                <div class="text-gray text-xs" id="w-v-comprador-contrato"></div>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">NIF COMPRADOR</label>
                <input type="text" id="w-v-nif" value="${data.nifComprador}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">RAZÓN SOCIAL</label>
                <input type="text" id="w-v-rs" value="${data.razonSocial}" class="wizard-input">
              </div>
              <div class="grid grid-cols-2 gap-15">
                  <div class="wizard-input-group">
                    <label class="wizard-label">IVA (%)</label>
                    <input type="number" id="w-v-iva" value="${data.ivaPct}" class="wizard-input">
                  </div>
                  <div class="wizard-input-group">
                    <label class="wizard-label">RETENCIÓN (%)</label>
                    <input type="number" id="w-v-ret" value="${data.retencionPct}" class="wizard-input">
                  </div>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">CLASIFICACIÓN SEUROP LOTE</label>
                <input type="text" id="w-v-seurop" value="${data.seurop || ''}" placeholder="U-2, R, O..." class="wizard-input">
              </div>
          </div>
        `;
        },
        onRender: async (data, area) => {
          // Refrescar lista de compradores desde la BD (por si se creó uno rápido)
          try {
            const refreshed = await window.Compradores.list({ activo: true }).catch(() => []);
            if (refreshed.length > 0) {
              data._compradores = refreshed;
              const sel = document.getElementById('w-v-comprador');
              if (sel) {
                const currentVal = sel.value;
                sel.innerHTML = `
                  <option value="">Seleccionar comprador...</option>
                  ${refreshed.map(c =>
                    `<option value="${c.id}" ${data.compradorId === c.id ? 'selected' : ''}>${c.nombre} ${c.nif_cif ? '('+c.nif_cif+')' : ''} — ${c.tipo_comprador}</option>`
                  ).join('')}
                `;
                if (currentVal) sel.value = currentVal;
              }
            }
          } catch(e) { console.warn('[WizardVenta] Error refrescando compradores:', e); }

          if (data.compradorId) {
            try {
              const c = await window.Compradores.get(data.compradorId);
              if (c) {
                const contrato = await window.Contratos.getActivo(data.compradorId, 'carne');
                const infoDiv = document.getElementById('w-v-comprador-info');
                if (infoDiv) {
                  infoDiv.style.display = 'block';
                  const estadoBadge = c.activo !== false
                    ? '<span class="text-green">✅ Activo</span>'
                    : '<span class="text-red">❌ Inactivo</span>';
                  document.getElementById('w-v-comprador-nombre').innerHTML = '<strong>' + c.nombre + '</strong> ' + estadoBadge;
                  document.getElementById('w-v-comprador-nif').textContent = 'NIF: ' + (c.nif_cif || '');
                  if (contrato) {
                    let contratoHtml = '📄 Contrato: ' + contrato.numero_contrato + ' (IVA: ' + contrato.iva_pct + '%, Ret.: ' + contrato.retencion_pct + '%)';
                    if (contrato.fecha_fin) {
                      const diasRestantes = Math.ceil((new Date(contrato.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
                      if (diasRestantes > 0 && diasRestantes <= 30) {
                        contratoHtml += ' <span class="text-gold">⚠️ Vence en ' + diasRestantes + 'd</span>';
                      } else if (diasRestantes <= 0) {
                        contratoHtml += ' <span class="text-red">❌ VENCIDO</span>';
                      }
                    }
                    document.getElementById('w-v-comprador-contrato').innerHTML = contratoHtml;
                    document.getElementById('w-v-iva').value = contrato.iva_pct;
                    document.getElementById('w-v-ret').value = contrato.retencion_pct;
                  } else {
                    document.getElementById('w-v-comprador-contrato').innerHTML = '⚠️ <span class="text-red">Sin contrato activo. Crea uno en Compradores.</span>';
                  }
                }
              }
            } catch(e) { console.warn(e); }
          }
        },
        onChange: async (data) => {
          const sel = document.getElementById('w-v-comprador');
          if (sel) {
            data.compradorId = parseInt(sel.value) || null;
            if (data.compradorId) {
              const c = await window.Compradores.get(data.compradorId);
              if (c) {
                data.nifComprador = c.nif_cif || '';
                data.razonSocial = c.nombre || '';
                const contrato = await window.Contratos.getActivo(data.compradorId, 'carne');
                if (contrato) {
                  data.ivaPct = contrato.iva_pct;
                  data.retencionPct = contrato.retencion_pct;
                }
              }
            } else {
              data.nifComprador = document.getElementById('w-v-nif')?.value || '';
              data.razonSocial = document.getElementById('w-v-rs')?.value || '';
            }
          } else {
            data.nifComprador = document.getElementById('w-v-nif')?.value || data.nifComprador;
            data.razonSocial = document.getElementById('w-v-rs')?.value || data.razonSocial;
          }
          data.ivaPct = parseFloat(document.getElementById('w-v-iva')?.value) || 0;
          data.retencionPct = parseFloat(document.getElementById('w-v-ret')?.value) || 0;
          data.seurop = document.getElementById('w-v-seurop')?.value || data.seurop;
        },
        validate: async (data) => {
          if (!data.compradorId) {
            App.toastError("Selecciona un comprador registrado para la venta.");
            return false;
          }
          const c = await window.Compradores.get(data.compradorId).catch(() => null);
          if (!c || c.activo === false) {
            App.toastError("El comprador seleccionado no está activo.");
            return false;
          }
          const contrato = await window.Contratos.getActivo(data.compradorId, 'carne').catch(() => null);
          if (!contrato) {
            App.toastError("El comprador seleccionado no tiene un contrato activo para carne.");
            return false;
          }
          return true;
        }
      },
      // STEP 5: TRANSPORTISTA + AUTORIZACIÓN VETERINARIA
      {
        content: async (data) => {
          const transportistas = await window.Transportistas.list({ activo: true }).catch(() => []);
          data._transportistas = transportistas;
          return `
          <div class="mt-10">
              <h4 class="text-blue text-sm mb-12">🚛 TRANSPORTISTA</h4>
              <div class="wizard-input-group mb-12">
                <div class="flex gap-8">
                  <select id="w-v-transportista" class="flex-1 bg-card rounded border-muted" style="font-size:0.95rem; color:white; padding:11px;"
                    onchange="App._onTransportistaChangeWizard(this)">
                    <option value="">${transportistas.length === 0 ? 'No hay transportistas registrados...' : 'Seleccionar transportista...'}</option>
                    ${transportistas.map(t =>
                      `<option value="${t.id}" ${data.transportistaId === t.id ? 'selected' : ''}>${t.nombre} ${t.nif_cif ? '('+t.nif_cif+')' : ''} — ${t.matricula || 'sin matrícula'}</option>`
                    ).join('')}
                  </select>
                  <a href="#/transportistas" target="_blank" class="text-xs font-black text-blue flex items-center" style="padding:11px 14px; border-radius:12px; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); text-decoration:none; white-space:nowrap;">➕ Nuevo</a>
                </div>
              </div>
              <div id="w-v-transportista-info" class="p-12 mb-12 bg-dark rounded-10" style="display:${data.transportistaId ? 'block' : 'none'};">
                <div class="text-white text-sm" id="w-v-transportista-nombre"><strong>${data.nombreTransportista || ''}</strong></div>
                <div class="text-gray text-xs mt-4" id="w-v-transportista-nif">NIF: ${data.nifTransportista || ''}</div>
                <div class="text-gray text-xs" id="w-v-transportista-matricula">🚚 ${data.matriculaTransportista || ''}</div>
              </div>

              <h4 class="text-purple text-sm" style="margin:16px 0 12px;">🩺 AUTORIZACIÓN VETERINARIA</h4>
              <div class="grid grid-cols-2 gap-12 mb-12">
                <div class="wizard-input-group">
                  <label class="wizard-label">VETERINARIO RESPONSABLE</label>
                  <input type="text" id="w-v-vet-nombre" value="${data.vet_nombre}" class="wizard-input" placeholder="Nombre del veterinario">
                </div>
                <div class="wizard-input-group">
                  <label class="wizard-label">Nº COLEGIADO</label>
                  <input type="text" id="w-v-vet-colegiado" value="${data.vet_colegiado}" class="wizard-input" placeholder="Nº colegiado">
                </div>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA AUTORIZACIÓN</label>
                <input type="date" id="w-v-vet-fecha" value="${data.vet_fecha_autorizacion}" class="wizard-input">
              </div>
              <div class="text-xs text-purple-400" style="background:rgba(139,92,246,0.06); border:1px solid rgba(139,92,246,0.15); border-radius:10px; padding:10px 12px; margin-top:8px;">
                ℹ️ La autorización veterinaria es obligatoria para la expedición de animales vivos al matadero.
              </div>
          </div>
        `;
        },
        onRender: async (data, area) => {
          try {
            const refreshed = await window.Transportistas.list({ activo: true }).catch(() => []);
            if (refreshed.length > 0) {
              data._transportistas = refreshed;
              const sel = document.getElementById('w-v-transportista');
              if (sel) {
                const currentVal = sel.value;
                sel.innerHTML = `
                  <option value="">Seleccionar transportista...</option>
                  ${refreshed.map(t =>
                    `<option value="${t.id}" ${data.transportistaId === t.id ? 'selected' : ''}>${t.nombre} ${t.nif_cif ? '('+t.nif_cif+')' : ''} — ${t.matricula || 'sin matrícula'}</option>`
                  ).join('')}
                `;
                if (currentVal) sel.value = currentVal;
              }
            }
          } catch(e) { console.warn('[WizardVenta] Error refrescando transportistas:', e); }

          if (data.transportistaId) {
            App._showTransportistaInfo(data);
          }
        },
        onChange: async (data) => {
          const sel = document.getElementById('w-v-transportista');
          if (sel) {
            data.transportistaId = parseInt(sel.value) || null;
            if (data.transportistaId) {
              const t = await window.Transportistas.get(data.transportistaId);
              if (t) {
                data.nombreTransportista = t.nombre || '';
                data.nifTransportista = t.nif_cif || '';
                data.matriculaTransportista = t.matricula || '';
              }
            } else {
              data.nombreTransportista = '';
              data.nifTransportista = '';
              data.matriculaTransportista = '';
            }
          }
          data.vet_nombre = document.getElementById('w-v-vet-nombre')?.value || data.vet_nombre;
          data.vet_colegiado = document.getElementById('w-v-vet-colegiado')?.value || data.vet_colegiado;
          data.vet_fecha_autorizacion = document.getElementById('w-v-vet-fecha')?.value || data.vet_fecha_autorizacion;
        },
        validate: async (data) => {
          if (!data.vet_nombre || !data.vet_colegiado) {
            App.toastError("La autorización veterinaria es obligatoria. Indica nombre y nº colegiado.");
            return false;
          }
          if (!data.transportistaId) {
            App.toastError("Selecciona un transportista para la expedición.");
            return false;
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-venta-masiva',
      title: 'VENTA MASIVA DE ANIMALES',
      steps: wizardSteps,
      initialData,
      onComplete: async (finalData) => {
        try {
          const fId = await window.Fincas.getActiveId();
          let primerAlbaran = null;
          const N = finalData.seleccionados.length;
          const year = new Date().getFullYear();

          // Obtener contador de albarán
          let contador = 0;
          try {
            const metaContador = await window.db.get('meta', 'contador_albaran');
            contador = metaContador ? (metaContador.valor || 0) : 0;
          } catch(e) { /* primera vez */ }

          for (let aId of finalData.seleccionados) {
            contador++;
            const animal = await window.Animales.get(aId);
            if (!animal) continue;
            let rebano = animal.rebanoId ? await window.Rebanos.get(animal.rebanoId) : null;
            if (!rebano) rebano = { zonaActual:'Finca', especie:'General', tipo:'Sin clasificar' };
            const pVind = N > 0 ? finalData.pVivo / N : 0;
            const pCind = N > 0 ? finalData.pCanal / N : 0;
            let rendInd = 0;
            try { rendInd = window.Trazabilidad.calcularRendimiento(pVind, pCind); } catch(e) { rendInd = 0; }

            const numeroAlbaran = `${year}-${String(contador).padStart(4, '0')}`;

            const reg = {
              animalId: aId,
              compradorId: finalData.compradorId || null,
              contratoId: null,
              fechaSacrificio: finalData.fechaSacrificio,
              codigoMatadero: finalData.codigoMatadero,
              pesoVivo: pVind,
              pesoCanal: pCind,
              rendimientoCanal: rendInd,
              fincaId: fId,
              snap_zona: rebano.zonaActual || 'Finca',
              snap_especie: rebano.especie || 'General',
              snap_tipo: rebano.tipo || 'Sin clasificar',
              nifComprador: finalData.nifComprador,
              razonSocial: finalData.razonSocial,
              codigoDocumento_ICA: finalData.codigoICA,
              numero_Guia_Sanitaria: finalData.numeroGuia,
              IVA: finalData.ivaPct,
              retencionREAGP: finalData.retencionPct,
              Gasto_Transporte: N > 0 ? finalData.gTrans / N : 0,
              Gasto_Matanza: N > 0 ? finalData.gMata / N : 0,
              clasificacion: { seurop: finalData.seurop },
              transportistaId: finalData.transportistaId || null,
              nombreTransportista: finalData.nombreTransportista || '',
              nifTransportista: finalData.nifTransportista || '',
              matriculaTransportista: finalData.matriculaTransportista || '',
              numero_albaran: numeroAlbaran,
              autorizacion_veterinaria: {
                vet_nombre: finalData.vet_nombre || '',
                vet_colegiado: finalData.vet_colegiado || '',
                fecha_autorizacion: finalData.vet_fecha_autorizacion || ''
              }
            };
            // Asignar contrato activo si existe
            if (finalData.compradorId) {
              try {
                const cActivo = await window.Contratos.getActivo(finalData.compradorId, 'carne');
                if (cActivo) reg.contratoId = cActivo.id;
              } catch(e) { /* no hay contratos module */ }
            }
            const idV = await window.db.add("comercializacion_carne", reg);
            const est = await window.Trazabilidad.generarEstructuraAlbaran(
              window.db,
              { ...reg, id: idV },
              "carne"
            );
            if (!primerAlbaran) primerAlbaran = est;

            // POST-VENTA: Cambiar estado a "vendido"
            animal.estado = "vendido";
            await window.Animales.save(animal);

            // POST-VENTA: Registrar evento de expedición en registro_eventos
            try {
              if (window.EventBus) {
                window.EventBus.emit('animal:updated', { id: animal.id, estado: 'vendido' });
              }
              await window.db.add('registro_eventos', {
                fincaId: fId,
                entidad_id: aId,
                tipo_entidad: 'animal',
                motivo_tarea: 'expedicion',
                fecha: finalData.fechaSacrificio || new Date().toISOString().split('T')[0],
                valor_neto: pCind,
                unidad: 'kg',
                snap_zona: rebano.zonaActual || 'Finca',
                snap_especie: rebano.especie || 'General',
                snap_tipo: rebano.tipo || 'Sin clasificar',
                observaciones: `Venta a ${finalData.razonSocial || 'comprador'} | Albarán: ${numeroAlbaran} | Transportista: ${finalData.nombreTransportista || 'N/D'}`,
                creadoEn: new Date().toISOString()
              });
            } catch(e) { console.warn('[Venta] Error registro evento:', e); }

            // POST-VENTA: Generar DIMOE como documento legal
            try {
              const finca = await window.db.get('fincas', Number(fId));
              const dimoe = {
                tipo: 'dimoe',
                ventaId: idV,
                animalId: aId,
                fincaId: fId,
                numero: `DIMOE-${numeroAlbaran}`,
                fecha_emision: finalData.fechaSacrificio || new Date().toISOString().split('T')[0],
                origen_rega: finca?.codigo_REGA || finca?.rega || '',
                origen_nombre: finca?.nombre || '',
                destino: finalData.codigoMatadero || '',
                destino_nombre: finalData.razonSocial || '',
                motivo: 'sacrificio',
                transportista_nombre: finalData.nombreTransportista || '',
                transportista_nif: finalData.nifTransportista || '',
                transportista_matricula: finalData.matriculaTransportista || '',
                created_at: new Date().toISOString()
              };
              await window.db.add('documentos_legales', dimoe).catch(() => {});
            } catch(e) { console.warn('[Venta] Error generando DIMOE:', e); }
          }

          // Guardar contador de albarán actualizado
          try {
            await window.db.put('meta', { key: 'contador_albaran', valor: contador, actualizadoEn: new Date().toISOString() });
          } catch(e) { /* ignore */ }

          App.toast(`Lote de ${N} animales procesado con éxito.`);

          // Mostrar albarán
          let facturaGenerada = false;
          if (primerAlbaran) {
            await App.imprimirAlbaran(primerAlbaran, "carne");
          }

          // Generar Factura si hay datos económicos
          try {
            if (primerAlbaran && window.Liquidacion && window.PdfService) {
              const precioEstimado = finalData.precioUnitario || 5.5;
              const gastosTotal = (finalData.gTrans || 0) + (finalData.gMata || 0);
              const liq = window.Liquidacion.calcular({
                pesoCanal: finalData.pCanal || 0,
                precioUnitario: precioEstimado,
                gastos: gastosTotal,
                ivaPct: finalData.ivaPct || 10,
                retencionPct: finalData.retencionPct || 0
              });
              let facturaContador = 0;
              try {
                const metaFact = await window.db.get('meta', 'contador_factura');
                facturaContador = metaFact ? (metaFact.valor || 0) : 0;
              } catch(e) {}
              facturaContador++;
              const year = new Date().getFullYear();
              const numeroFactura = `F-${year}-${String(facturaContador).padStart(4, '0')}`;
              await window.db.put('meta', { key: 'contador_factura', valor: facturaContador, actualizadoEn: new Date().toISOString() }).catch(() => {});
              await App.imprimirFactura(primerAlbaran, liq, numeroFactura);
              facturaGenerada = true;
            }
          } catch(e) { console.warn('[Venta] Error generando factura:', e); }

          App.renderComercializacion(new URLSearchParams("tab=carne"));
        } catch (e) {
          App.toastError(e.message);
        }
      },
    });
  }
};
