/**
 * Wizard Pedido de Crotales — generación de documento oficial ADSG
 * Extraído de app.js para modularización
 */
window.WizardCrotales = {
  async abrirPedido() {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError("No hay finca activa"); return; }
    const wizardSteps = [
      {
        content: (data) => `
          <div class="mt-10">
            <h3 class="text-green mb-15">📦 Material Solicitado</h3>
            <div class="wizard-input-group">
              <label class="wizard-label">TIPO DE CROTAL / MATERIAL</label>
              <select id="w-pd-tipo" class="wizard-input wizard-select">
                <option value="Botón + Botón (EID)" ${data.tipo === "Botón + Botón (EID)" ? "selected" : ""}>Botón + Botón (Electrónico)</option>
                <option value="Bandera + Botón (EID)" ${data.tipo === "Bandera + Botón (EID)" ? "selected" : ""}>Bandera + Botón (Electrónico)</option>
                <option value="Bolo Ruminal + Botón Visual" ${data.tipo === "Bolo Ruminal + Botón Visual" ? "selected" : ""}>Bolo Ruminal + Botón visual</option>
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CANTIDAD (PARES SOLICITADOS)</label>
              <input type="number" id="w-pd-cant" value="${data.cantidad}" class="wizard-input text-xl border-green">
            </div>
            <div class="rounded-sm" style="background:rgba(16,185,129,0.1); padding:12px; margin-top:10px; border-left:3px solid #10b981;">
              <div class="text-xs text-aaa">
                📌 Crotal derecho (visual): código visible · Crotal izquierdo (RFID): lectura electrónica.<br>
                Real Decreto 787/2023 y 1307/2024.
              </div>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.tipo = document.getElementById('w-pd-tipo')?.value || data.tipo;
          data.cantidad = parseInt(document.getElementById('w-pd-cant')?.value) || 0;
        },
        validate: async (data) => {
          if (data.cantidad <= 0) { App.toastError("Cantidad debe ser mayor a 0"); return false; }
          return true;
        }
      },
      {
        content: (data) => `
          <div class="mt-10">
            <h3 class="text-green mb-15">🏢 Destino y ADSG</h3>
            <div class="wizard-input-group">
              <label class="wizard-label">DESTINATARIO (ADSG / OCA / ADMINISTRACIÓN)</label>
              <input type="text" id="w-pd-adsg" value="${data.adsg_nombre}" placeholder="Ej: ADSG Sierra Norte" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CÓDIGO ADSG (opcional)</label>
              <input type="text" id="w-pd-adsg-cod" value="${data.adsg_codigo}" placeholder="Código de la ADSG" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">VETERINARIO ADSG (opcional)</label>
              <input type="text" id="w-pd-vet" value="${data.adsg_veterinario}" placeholder="Nombre del veterinario" class="wizard-input">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">Nº COLEGIADO</label>
                <input type="text" id="w-pd-vet-col" value="${data.adsg_vet_colegiado}" placeholder="Ej: 28/12345" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">NIF VETERINARIO</label>
                <input type="text" id="w-pd-vet-nif" value="${data.adsg_vet_nif}" placeholder="NIF" class="wizard-input">
              </div>
            </div>
            ${finca.comunidad_autonoma ? `
            <div class="rounded-sm" style="background:rgba(139,92,246,0.1); padding:10px; margin-top:10px; border-left:3px solid #8b5cf6;">
              <div class="text-xs text-aaa">
                🌍 La solicitud se dirigirá a la plataforma <strong>${finca.comunidad_autonoma === 'andalucia' ? 'SIGGAN (Andalucía)' : 'BADIGEX (Extremadura)'}</strong>
                para su tramitación oficial.
              </div>
            </div>` : ''}
          </div>
        `,
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
        tipo: "Bandera + Botón (EID)",
        cantidad: 50,
        adsg_nombre: finca.adsg_nombre || "",
        adsg_codigo: finca.adsg_codigo || "",
        adsg_veterinario: finca.adsg_veterinario || "",
        adsg_vet_colegiado: finca.adsg_vet_colegiado || "",
        adsg_vet_nif: finca.adsg_vet_nif || "",
      },
      steps: wizardSteps,
      onComplete: async (data) => {
        await WizardCrotales.generarPDF(finca, data);
      }
    });
  },

  async generarPDF(finca, data) {
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
                              <td style="padding:10px; border:1px solid #ccc;">${data.tipo}</td>
                              <td style="padding:10px; border:1px solid #ccc; text-align:center; font-weight:bold; font-size:1.2rem;">${data.cantidad}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              <div style="padding:20px; border:1px solid #ccc; background:#f9f9f9; font-size:0.85rem;">
                  <p style="margin-top:0;"><strong>DECLARACIÓN:</strong><br>
                  El abajo firmante solicita la asignación y fabricación de los medios de identificación arriba descritos para los animales de su explotación, comprometiéndose a su correcta colocación y posterior comunicación a la base de datos oficial (${plataforma}) en los plazos legalmente establecidos por el Real Decreto 787/2023 y el Real Decreto 1307/2024.</p>
              </div>

              <div style="margin-top:60px; display:flex; justify-content:space-between; align-items:flex-end;">
                  <div style="text-align:center; width:250px;">
                      <p style="margin-bottom:60px; color:#555;">Firma del Titular:</p>
                      <div style="border-top:1px solid #000; padding-top:5px; font-weight:bold;">${finca.propietario || finca.nombre}</div>
                  </div>
                  <div style="text-align:right;">
                      <p>Fecha de Solicitud: <strong>${new Date().toLocaleDateString()}</strong></p>
                  </div>
              </div>
          </div>
          <div style="text-align:center; padding:20px; display:flex; gap:10px; justify-content:center; background:#eee; border-top:1px solid #ddd; flex-shrink:0;">
              <button class="btn btn-primary" id="btn-descargar-adsg" style="width:auto; padding:0 30px; background:#10b981;">📄 DESCARGAR O ENVIAR</button>
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
          <div style="width:280px; text-align:center;">
            <div style="font-size:3rem; margin-bottom:20px; animation: bounce 2s infinite;">🏷️</div>
            <div style="font-weight:800; font-size:1.1rem; margin-bottom:8px;">Generando Solicitud</div>
            <div style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">Pedido de Crotales</div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; position:relative;">
              <div id="pdf-progress-bar" style="position:absolute; left:0; top:0; height:100%; width:10%; background:#c9851f; transition:width 0.4s ease; border-radius:10px;"></div>
            </div>
            <div id="pdf-progress-text" style="font-size:0.7rem; color:#888; margin-top:8px; font-weight:700;">PROCESANDO...</div>
          </div>
          <style> @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-20px);} 60% {transform: translateY(-10px);} } </style>
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
  }
};
