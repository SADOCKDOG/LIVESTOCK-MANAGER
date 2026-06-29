/**
 * Wizard Pedido de Crotales — generación de documento oficial ADSG
 * Extraído de app.js para modularización
 */
window.WizardCrotales = {
  async abrirPedido(borrador = null) {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError("No hay finca activa"); return; }

    // Validación previa del REGA de la explotación (SIGGAN)
    const CS = window.ComunidadesService;
    const regaFinca = finca.codigo_REGA || finca.rega || '';
    if (CS) {
      const ccaa = finca.comunidad_autonoma || null;
      if (!regaFinca) {
        App.toastError("La explotación no tiene código REGA. Complétalo antes de pedir crotales.");
        return;
      }
      const res = CS.validarFormatoREGA(regaFinca, ccaa);
      if (!res.valido) {
        App.toastError("REGA de la explotación inválido: " + res.mensaje);
        return;
      }
    }
    const especiesPedido = CS ? CS.getEspeciesAutorizables() : ['Bovino', 'Ovino', 'Caprino'];

    const wizardSteps = [
      {
        content: (data) => `
          <div class="card card-accent card-accent-green p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #10b981">${Icons.paquete()} MATERIAL SOLICITADO</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">ESPECIE</label>
              <select id="w-pd-especie" class="wizard-input font-800">
                ${especiesPedido.map(e => `<option value="${e}" ${data.especie === e ? "selected" : ""}>${e.toUpperCase()}</option>`).join("")}
              </select>
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">TIPO DE CROTAL / MATERIAL</label>
              <select id="w-pd-tipo" class="wizard-input font-800">
                <option value="Botón + Botón (EID)" ${data.tipo === "Botón + Botón (EID)" ? "selected" : ""}>BOTÓN + BOTÓN (ELECTRÓNICO)</option>
                <option value="Bandera + Botón (EID)" ${data.tipo === "Bandera + Botón (EID)" ? "selected" : ""}>BANDERA + BOTÓN (ELECTRÓNICO)</option>
                <option value="Bolo Ruminal + Botón Visual" ${data.tipo === "Bolo Ruminal + Botón Visual" ? "selected" : ""}>BOLO RUMINAL + BOTÓN VISUAL</option>
              </select>
            </div>
          <div class="card card-accent card-accent-gold p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--p-gold)">${Icons.animales()} DATOS DEL PEDIDO</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">TIPO DE CROTAL</label>
              <select id="w-pd-tipo" class="wizard-input">
                <option value="Bandera + Botón (EID)" ${data.tipo === 'Bandera + Botón (EID)' ? 'selected' : ''}>🏷️ Bandera + Botón (EID)</option>
                <option value="Bolo Ruminal (EID)" ${data.tipo === 'Bolo Ruminal (EID)' ? 'selected' : ''}>💊 Bolo Ruminal (EID)</option>
                <option value="Crotal Visual Clásico" ${data.tipo === 'Crotal Visual Clásico' ? 'selected' : ''}>👁️ Crotal Visual Clásico</option>
              </select>
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">ESPECIE DESTINO</label>
              <select id="w-pd-especie" class="wizard-input">
                ${especiesPedido.map(esp => `<option value="${esp}" ${data.especie === esp ? 'selected' : ''}>${esp}</option>`).join('')}
              </select>
            </div>
            <div class="wizard-input-group mb-10">
              <label class="wizard-label">CANTIDAD DE PARES</label>
              <input type="number" id="w-pd-cant" value="${data.cantidad}" class="wizard-input font-900" min="1" step="1">
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.tipo = document.getElementById('w-pd-tipo')?.value || data.tipo;
          data.especie = document.getElementById('w-pd-especie')?.value || data.especie;
          data.cantidad = parseInt(document.getElementById('w-pd-cant')?.value) || 0;
        },
        validate: async (data) => {
          if (data.cantidad <= 0) { App.toastError("Cantidad debe ser mayor a 0"); return false; }
          return true;
        }
      },
      {
        content: async (data) => {
          const adsgs = await window.ADSGs.list().catch(() => []);
          return `
            <div class="card card-accent card-accent-blue p-16 mt-10">
              <div class="section-header-theme mb-12" style="--theme-color: #3b82f6">${Icons.edificio()} DESTINO Y ADSG</div>
              
              ${adsgs.length > 0 ? `
              <div class="wizard-input-group mb-14">
                <label class="wizard-label">SELECCIONAR ADSG REGISTRADA</label>
                <select id="w-pd-adsg-select" class="wizard-input text-sm font-800" onchange="WizardCrotales._onSelectADSG(this.value)">
                  <option value="">-- Escribir manualmente --</option>
                  ${adsgs.map(a => `<option value="${a.id}" ${data.adsg_codigo === a.codigo ? 'selected' : ''}>${a.nombre} (${a.codigo})</option>`).join('')}
                </select>
              </div>
              ` : ''}

              <div class="wizard-input-group mb-12">
                <label class="wizard-label">DESTINATARIO (ADSG / OCA) *</label>
                <input type="text" id="w-pd-adsg" value="${data.adsg_nombre || ''}" placeholder="EJ: ADSG SIERRA NORTE" class="wizard-input uppercase font-800">
              </div>
              <div class="wizard-input-group mb-12">
                <label class="wizard-label">CÓDIGO ADSG</label>
                <input type="text" id="w-pd-adsg-cod" value="${data.adsg_codigo || ''}" placeholder="OPCIONAL" class="wizard-input uppercase font-800">
              </div>
              <div class="wizard-input-group mb-12">
                <label class="wizard-label">VETERINARIO RESPONSABLE</label>
                <input type="text" id="w-pd-vet" value="${data.adsg_veterinario || ''}" placeholder="NOMBRE DEL VETERINARIO" class="wizard-input uppercase font-800">
              </div>
              <div class="grid grid-cols-2 gap-10 mb-10">
                <div class="wizard-input-group">
                  <label class="wizard-label">Nº COLEGIADO</label>
                  <input type="text" id="w-pd-vet-col" value="${data.adsg_vet_colegiado || ''}" placeholder="0000" class="wizard-input font-800">
                </div>
                <div class="wizard-input-group">
                  <label class="wizard-label">NIF VET.</label>
                  <input type="text" id="w-pd-vet-nif" value="${data.adsg_vet_nif || ''}" placeholder="NIF" class="wizard-input font-800">
                </div>
              </div>
              ${finca.comunidad_autonoma ? `
              <div class="p-10 bg-black border border-222 rounded-sm">
                <p class="text-[0.6rem] text-aaa uppercase font-900 tracking-tight leading-relaxed m-0 text-center">
                  LA SOLICITUD SE DIRIGIRÁ A <strong>${finca.comunidad_autonoma.toLowerCase() === 'andalucia' ? 'SIGGAN' : 'BADIGEX'}</strong> PARA TRAMITACIÓN OFICIAL.
                </p>
              </div>` : ''}
            </div>
          `;
        },
        onChange: async (data) => {
          data.adsg_nombre = document.getElementById('w-pd-adsg')?.value.trim() || data.adsg_nombre;
          data.adsg_codigo = document.getElementById('w-pd-adsg-cod')?.value.trim() || '';
          data.adsg_veterinario = document.getElementById('w-pd-vet')?.value.trim() || '';
          data.adsg_vet_colegiado = document.getElementById('w-pd-vet-col')?.value.trim() || '';
          data.adsg_vet_nif = document.getElementById('w-pd-vet-nif')?.value.trim() || '';
        },
        validate: async (data) => {
          if (!data.adsg_nombre) { App.toastError("Indica a quién va dirigida la solicitud (ADSG u OCA)"); return false; }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-pedido-crotales',
      title: 'PEDIDO OFICIAL CROTALES',
      initialData: {
        id: borrador ? borrador.id : undefined,
        tipo: borrador ? borrador.tipo : "Bandera + Botón (EID)",
        especie: borrador ? borrador.especie : (especiesPedido[0] || "Ovino"),
        cantidad: borrador ? borrador.cantidad : 50,
        adsg_nombre: borrador ? borrador.adsg_nombre : (finca.adsg_nombre || ""),
        adsg_codigo: borrador ? borrador.adsg_codigo : (finca.adsg_codigo || ""),
        adsg_veterinario: borrador ? borrador.adsg_veterinario : (finca.adsg_veterinario || ""),
        adsg_vet_colegiado: borrador ? borrador.adsg_vet_colegiado : (finca.adsg_vet_colegiado || ""),
        adsg_vet_nif: borrador ? borrador.adsg_vet_nif : (finca.adsg_vet_nif || ""),
      },
      steps: wizardSteps,
      onComplete: async (data) => {
        console.log("[wizard-crotales] onComplete iniciado", data);
        try {
          if (!window.db) {
            alert("Error: Base de datos no disponible. Por favor, reinicia la aplicación.");
            return;
          }

          if (!window.db.objectStoreNames.contains('pedidos_crotales')) {
             alert("El sistema de pedidos requiere una actualización de base de datos (v12). Por favor, cierra y abre la aplicación.");
             return;
          }

          App.toast("Guardando pedido...");
          // Guardar pedido en BD ANTES de generar PDF
          const pedidoId = await PedidosCrotales.save({
            id: data.id || undefined,
            fincaId: finca.id,
            especie: data.especie,
            tipo: data.tipo,
            cantidad: data.cantidad,
            adsg_nombre: data.adsg_nombre,
            adsg_codigo: data.adsg_codigo || '',
            adsg_veterinario: data.adsg_veterinario || '',
            adsg_vet_colegiado: data.adsg_vet_colegiado || '',
            adsg_vet_nif: data.adsg_vet_nif || '',
            estado: 'pendiente',  // Al finalizar pasa a pendiente
            fecha_pedido: borrador ? borrador.fecha_pedido : new Date().toISOString(),
          });

          console.log(`[wizard-crotales] Pedido guardado en BD: id=${pedidoId}`);
          App.toast(`✅ Pedido guardado (nº ${pedidoId})`);
          
          // Generar PDF DESPUÉS de persistir
          await WizardCrotales.generarPDF(finca, data, pedidoId);
        } catch (e) {
          console.error('[wizard-crotales] Error al completar pedido:', e);
          alert("Error al procesar el pedido: " + e.message);

          // Fallback: Si el guardado falla, intentar al menos generar el PDF para que no se pierda el trámite
          await WizardCrotales.generarPDF(finca, data, "TEMP-" + Date.now());
        }
      }
    });
  },

  async generarPDF(finca, data, pedidoId = null) {
    App.toast("Generando documento oficial...");
    const overlay = document.createElement('div');
    overlay.id = "pedido-pdf-overlay";
    overlay.className = "wizard-full-screen";
    overlay.style.cssText = 'position:fixed;inset:0;z-index:4000;background:white;color:black;display:flex;flex-direction:column;';

    const ccaa = finca.comunidad_autonoma;
    const ccaaLabel = ccaa === 'andalucia' ? 'Andalucía' : ccaa === 'extremadura' ? 'Extremadura' : '—';
    const plataforma = ccaa === 'andalucia' ? 'SIGGAN' : ccaa === 'extremadura' ? 'BADIGEX' : 'SIA/PIGGAN';
    const contentId = `pdf-content-${Date.now()}`;
    overlay.innerHTML = `
          <div style="flex:1; width:100%; min-height:500px; margin:0; background:white; color:black; padding:40px; font-family:serif; box-sizing:border-box;" id="${contentId}">
              <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:20px; margin-bottom:30px;">
                  <h1 style="margin:0; font-size:1.5rem; text-transform:uppercase;">SOLICITUD DE MATERIAL DE IDENTIFICACIÓN ANIMAL</h1>
                  <h3 style="margin:5px 0 0 0; color:#555; font-weight:normal;">Documento de delegación para ADSG / Autoridad Competente</h3>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px; margin-bottom:20px; font-size: 0.9rem;">
                  <div>
                      <h4 style="border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:0;">DATOS DEL TITULAR</h4>
                      <p><strong>Nombre/Razón Social:</strong> ${finca.propietario || finca.nombre}<br>
                      <strong>NIF/CIF:</strong> ${finca.nif_cif || 'No especificado'}<br>
                      <strong>Dirección:</strong> ${finca.direccion || 'No especificada'}<br>
                      <strong>Teléfono:</strong> ${finca.telefonoContacto || 'No especificado'}<br>
                      <strong>Email:</strong> ${finca.email || 'No especificado'}</p>
                  </div>
                  <div>
                      <h4 style="border-bottom:1px solid #ddd; padding-bottom:5px; margin-top:0;">DATOS DE LA EXPLOTACIÓN</h4>
                      <p><strong>Nombre Finca:</strong> ${finca.nombre}<br>
                      <strong>Código REGA:</strong> ${finca.codigo_REGA || finca.rega || 'No especificado'}<br>
                      <strong>Comunidad Autónoma:</strong> ${ccaaLabel}<br>
                      <strong>Plataforma Destino:</strong> ${plataforma}<br>
                      <strong>Dirigido a (ADSG/OCA):</strong> ${data.adsg_nombre}</p>
                  </div>
              </div>

              ${data.adsg_codigo || data.adsg_veterinario ? `
              <div style="margin-bottom:20px; font-size:0.9rem;">
                  <h4 style="border-bottom:1px solid #ddd; padding-bottom:5px;">DATOS ADSG / VETERINARIO</h4>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <p class="m-0">
                      ${data.adsg_codigo ? `<strong>Código ADSG:</strong> ${data.adsg_codigo}<br>` : ''}
                      ${data.adsg_veterinario ? `<strong>Veterinario ADSG:</strong> ${data.adsg_veterinario}<br>` : ''}
                    </p>
                    <p class="m-0">
                      ${data.adsg_vet_colegiado ? `<strong>Nº Colegiado:</strong> ${data.adsg_vet_colegiado}<br>` : ''}
                      ${data.adsg_vet_nif ? `<strong>NIF Veterinario:</strong> ${data.adsg_vet_nif}` : ''}
                    </p>
                  </div>
              </div>` : ''}

              <div style="margin-bottom:30px;">
                  <h4 style="border-bottom:1px solid #ddd; padding-bottom:5px;">MATERIAL SOLICITADO</h4>
                  <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                      <thead>
                          <tr style="background:#eee;">
                              <th style="padding:10px; border:1px solid #ccc; text-align:left;">Tipo de Dispositivo (Visual + Electrónico)</th>
                              <th style="padding:10px; border:1px solid #ccc; text-align:center;">Cantidad (Pares)</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td style="padding:10px; border:1px solid #ccc;">${data.tipo}${data.especie ? ` · ${data.especie}` : ''}</td>
                              <td style="padding:10px; border:1px solid #ccc; text-align:center; font-weight:bold; font-size:1.2rem;">${data.cantidad}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              <div style="padding:20px; border:1px solid #ccc; background:#f9f9f9; font-size:0.85rem;">
                  <p style="margin-top:0;"><strong>DECLARACIÓN:</strong><br>
                  Por la presente, el titular de la explotación declara conocer la normativa vigente en materia de identificación animal y solicita la expedición de los crotales arriba indicados.
                  </p>
                  <div style="display:flex; justify-content:space-between; margin-top:40px;">
                    <div style="text-align:center; border-top:1px solid #000; width:40%;">Firma del Titular</div>
                    <div style="text-align:center; border-top:1px solid #000; width:40%;">Fecha: ${new Date().toLocaleDateString()}</div>
                  </div>
              </div>
          </div>
          <div style="text-align:center; padding:16px; padding-bottom:calc(16px + env(safe-area-inset-bottom)); display:flex; gap:10px; justify-content:center; background:#eee; border-top:1px solid #ddd; flex-shrink:0;">
              <button class="btn btn-primary" id="btn-descargar-adsg" style="width:auto; padding:0 30px; background:#10b981;">${Icons.exportar()} DESCARGAR O ENVIAR</button>
              <button class="btn btn-secondary" onclick="document.getElementById('pedido-pdf-overlay').remove()" style="width:auto; padding:0 30px;">CERRAR</button>
          </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("#btn-descargar-adsg").onclick = async () => {
      let loader;
      try {
        // Crear overlay de carga con barra de proceso
        loader = document.createElement('div');
        loader.id = 'pdf-loader-overlay';
        loader.style.cssText = `
          position:fixed; top:0; left:0; right:0; bottom:0; z-index:100000;
          background:rgba(0,0,0,0.85); display:flex; flex-direction:column;
          align-items:center; justify-content:center; color:#fff; font-family:sans-serif;
        `;
        loader.innerHTML = `
          <div class="pdf-loader">
            <div class="pdf-loader-emoji">${Icons.paquete()}</div>
            <div class="pdf-loader-title">Generando Solicitud</div>
            <div class="pdf-loader-desc">Pedido de Crotales</div>
            <div class="pdf-loader-bar">
              <div id="pdf-progress-bar" class="pdf-loader-fill"></div>
            </div>
            <div id="pdf-progress-text" class="pdf-loader-status">PROCESANDO...</div>
          </div>
        `;
        document.body.appendChild(loader);

        const updateProgress = (pct, text) => {
          const bar = loader.querySelector('#pdf-progress-bar');
          const txt = loader.querySelector('#pdf-progress-text');
          if (bar) bar.style.width = pct + '%';
          if (txt) txt.textContent = text.toUpperCase();
        };

        const el = document.getElementById(contentId);
        if (!el) {
          App.toastError("Error: contenido PDF no encontrado");
          loader.remove();
          return;
        }

        updateProgress(30, 'Preparando documento...');
        const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `position:absolute; left:0; top:${currentScroll}px; width:800px; z-index:9990; background:#fff; color:#000; padding:40px; font-family:serif;`;
        tempContainer.innerHTML = el.innerHTML;
        document.body.appendChild(tempContainer);

        const opt = {
          margin: [12, 10, 12, 10],
          filename: `Solicitud_Crotales_${finca.codigo_REGA || finca.rega}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 800,
            scrollX: 0,
            scrollY: currentScroll,
            height: tempContainer.scrollHeight,
            windowHeight: tempContainer.scrollHeight
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        if (typeof html2pdf === 'undefined') {
          loader.remove();
          WizardCrotales._fallbackPDF(el, opt.filename);
          return;
        }

        updateProgress(70, 'Rasterizando PDF...');
        const pdfBlob = await html2pdf().set(opt).from(tempContainer).output('blob');
        document.body.removeChild(tempContainer);
        updateProgress(100, '¡Listo!');
        await new Promise(r => setTimeout(r, 400));
        loader.remove();

        App.toast("Documento listo ✅");

        // 1️⃣ Capacitor Native Share
        try {
          const cap = window.Capacitor;
          const fsPlugin = cap?.Plugins?.Filesystem;
          const sharePlugin = cap?.Plugins?.Share;
          if (fsPlugin && sharePlugin) {
            const reader = new FileReader();
            const dataUri = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(pdfBlob);
            });
            const result = await fsPlugin.writeFile({
              path: opt.filename,
              data: dataUri.split(',')[1],
              directory: 'CACHE'
            });
            await sharePlugin.share({
              title: 'Pedido de Crotales',
              text: `Solicitud de material de identificación para ${finca.codigo_REGA || finca.rega}`,
              url: result.uri,
              files: [result.uri],
              dialogTitle: 'Compartir Pedido de Crotales con…'
            });
            return;
          }
        } catch (capErr) {
          console.warn("[Capacitor Share Crotales]", capErr?.message || capErr);
        }

        // 2️⃣ navigator.share con File
        try {
          if (navigator.share) {
            const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
            await navigator.share({
              title: 'Pedido de Crotales',
              text: `Solicitud de material de identificación para ${finca.codigo_REGA || finca.rega}`,
              files: [file]
            });
            return;
          }
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') console.warn("[navigator.share Crotales]", shareErr);
        }

        // 3️⃣ Fallback descarga
        html2pdf().set(opt).from(el).save(opt.filename);
      } catch (e) {
        console.warn("Error en generación PDF Crotales:", e);
        if (loader) loader.remove();
        WizardCrotales._fallbackPDF(document.getElementById(contentId), `Solicitud_Crotales_${finca.codigo_REGA || finca.rega}.pdf`);
      }
    };
  },

  _fallbackPDF(element, filename) {
    App.toast("Usando método alternativo de impresión...");
    try {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write('<html><head><title>' + filename + '</title>');
        win.document.write('<style>body{font-family:serif;padding:40px;color:#000;background:#fff;}</style>');
        win.document.write('</head><body>');
        win.document.write(element.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        win.print();
      } else {
        const blob = new Blob([element.innerHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.pdf', '.html');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      App.toastError("No se pudo generar el documento. Verifica tu conexión.");
    }
  },

  async _onSelectADSG(adsgId) {
    console.log("[WizardCrotales] _onSelectADSG seleccionado:", adsgId);
    const adsgs = await window.ADSGs.list().catch(() => []);
    const adsg = adsgs.find(a => Number(a.id) === Number(adsgId));
    
    const inputNombre = document.getElementById('w-pd-adsg');
    const inputCodigo = document.getElementById('w-pd-adsg-cod');
    const inputVet = document.getElementById('w-pd-vet');
    const inputCol = document.getElementById('w-pd-vet-col');
    const inputNif = document.getElementById('w-pd-vet-nif');

    if (adsg) {
      if (inputNombre) inputNombre.value = adsg.nombre || '';
      if (inputCodigo) inputCodigo.value = adsg.codigo || '';
      if (inputVet) inputVet.value = adsg.veterinario || '';
      if (inputCol) inputCol.value = adsg.colegiado || '';
      if (inputNif) inputNif.value = adsg.vet_nif || '';
    } else {
      if (inputNombre) inputNombre.value = '';
      if (inputCodigo) inputCodigo.value = '';
      if (inputVet) inputVet.value = '';
      if (inputCol) inputCol.value = '';
      if (inputNif) inputNif.value = '';
    }
  }
};

