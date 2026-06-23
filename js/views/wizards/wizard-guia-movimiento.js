/**
 * Wizard Guía de Movimiento SIGGAN — Livestock Manager Premium
 * Genera la guía de origen y sanidad pecuaria para movimientos
 * inter-explotación (entrada/salida) y la registra como movimiento oficial,
 * dirigida a la plataforma de la comunidad (SIGGAN / BADIGEX / PIMA).
 */
window.WizardGuiaMovimiento = {
  async abrir() {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError("No hay finca activa"); return; }

    const CS = window.ComunidadesService;
    const ccaa = finca.comunidad_autonoma || '';
    const motivos = CS ? CS.getMotivosMovimiento() : [];
    const conf = CS && ccaa ? CS.getConfiguracionCCAA(ccaa) : null;
    const regaPropia = finca.codigo_REGA || finca.rega || '';

    let transportistas = [];
    try { transportistas = await Transportistas.list({ activo: true }); } catch (e) { transportistas = []; }

    const steps = [
      {
        content: (data) => `
          <div class="mt-10">
            <h3 class="text-green mb-15">🔄 Tipo de Movimiento</h3>
            <div class="wizard-input-group">
              <label class="wizard-label">DIRECCIÓN</label>
              <select id="w-mv-tipo" class="wizard-input wizard-select">
                <option value="salida" ${data.tipo === 'salida' ? 'selected' : ''}>Salida (desde mi explotación)</option>
                <option value="entrada" ${data.tipo === 'entrada' ? 'selected' : ''}>Entrada (hacia mi explotación)</option>
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">MOTIVO</label>
              <select id="w-mv-motivo" class="wizard-input wizard-select">
                ${motivos.map(m => `<option value="${m.value}" ${data.motivo === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA DEL MOVIMIENTO</label>
              <input type="date" id="w-mv-fecha" value="${data.fecha}" class="wizard-input">
            </div>
          </div>`,
        onChange: async (data) => {
          data.tipo = document.getElementById('w-mv-tipo')?.value || data.tipo;
          data.motivo = document.getElementById('w-mv-motivo')?.value || data.motivo;
          data.fecha = document.getElementById('w-mv-fecha')?.value || data.fecha;
        },
        validate: async (data) => {
          if (!data.fecha) { App.toastError("Indica la fecha del movimiento"); return false; }
          return true;
        }
      },
      {
        content: (data) => {
          const esSalida = data.tipo === 'salida';
          return `
          <div class="mt-10">
            <h3 class="text-green mb-15">🏢 Explotaciones</h3>
            <div class="wizard-input-group">
              <label class="wizard-label">REGA ${esSalida ? 'ORIGEN (mi explotación)' : 'DESTINO (mi explotación)'}</label>
              <input type="text" id="w-mv-rega-propia" value="${esSalida ? data.rega_origen : data.rega_destino}" class="wizard-input" ${regaPropia ? 'readonly' : ''}>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">REGA ${esSalida ? 'DESTINO' : 'ORIGEN'} (contraparte)</label>
              <input type="text" id="w-mv-rega-contra" value="${esSalida ? data.rega_destino : data.rega_origen}" placeholder="Ej: ES041230000123" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">NOMBRE EXPLOTACIÓN CONTRAPARTE</label>
              <input type="text" id="w-mv-contra-nombre" value="${data.explotacion_contraparte}" placeholder="Titular o explotación" class="wizard-input">
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">ESPECIE</label>
                <input type="text" id="w-mv-especie" value="${data.especie}" placeholder="Ovino, Bovino..." class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº ANIMALES</label>
                <input type="number" id="w-mv-num" value="${data.num_animales}" min="1" class="wizard-input">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">CROTALES (uno por línea, opcional)</label>
              <textarea id="w-mv-crotales" class="wizard-input" rows="3" placeholder="ES1409912345...">${(data.crotales || []).join('\n')}</textarea>
            </div>
          </div>`;
        },
        onChange: async (data) => {
          const esSalida = data.tipo === 'salida';
          const propia = (document.getElementById('w-mv-rega-propia')?.value || '').trim();
          const contra = (document.getElementById('w-mv-rega-contra')?.value || '').trim();
          if (esSalida) { data.rega_origen = propia; data.rega_destino = contra; }
          else { data.rega_destino = propia; data.rega_origen = contra; }
          data.explotacion_contraparte = document.getElementById('w-mv-contra-nombre')?.value.trim() || '';
          data.especie = document.getElementById('w-mv-especie')?.value.trim() || '';
          data.num_animales = parseInt(document.getElementById('w-mv-num')?.value) || 0;
          data.crotales = (document.getElementById('w-mv-crotales')?.value || '')
            .split('\n').map(s => s.trim().toUpperCase()).filter(Boolean);
        },
        validate: async (data) => {
          if (data.num_animales <= 0) { App.toastError("Indica el nº de animales"); return false; }
          const contraRega = data.tipo === 'salida' ? data.rega_destino : data.rega_origen;
          if (CS && contraRega) {
            const r = CS.validarFormatoREGA(contraRega, null);
            if (!r.valido) { App.toastError("REGA contraparte: " + r.mensaje); return false; }
          } else if (!contraRega) {
            App.toastError("Indica el REGA de la explotación contraparte"); return false;
          }
          return true;
        }
      },
      {
        content: (data) => `
          <div class="mt-10">
            <h3 class="text-green mb-15">🚚 Transporte y Sanidad</h3>
            <div class="wizard-input-group">
              <label class="wizard-label">TRANSPORTISTA</label>
              <select id="w-mv-transp" class="wizard-input wizard-select">
                <option value="">— Manual / sin registrar —</option>
                ${transportistas.map(t => `<option value="${t.id}" ${data.transportistaId == t.id ? 'selected' : ''}>${t.nombre} (${t.matricula || 's/m'})</option>`).join('')}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-10">
              <div class="wizard-input-group">
                <label class="wizard-label">NOMBRE (si manual)</label>
                <input type="text" id="w-mv-transp-nom" value="${data.transportista_nombre}" class="wizard-input">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">MATRÍCULA</label>
                <input type="text" id="w-mv-matricula" value="${data.matricula}" class="wizard-input">
              </div>
            </div>
            <label class="wizard-checkbox-container" style="margin-top:8px;">
              <input type="checkbox" id="w-mv-desins" ${data.desinsectacion_certificada ? 'checked' : ''}>
              <span>Desinsectación/desinfección certificada (48h previas)</span>
            </label>
            ${conf && conf.requiere_desinsectacion_movimiento ? `
            <div class="rounded-sm" style="background:rgba(245,158,11,0.1); padding:10px; margin-top:10px; border-left:3px solid #f59e0b;">
              <div class="text-xs text-aaa">⚠️ ${conf.label} exige certificar la desinsectación previa al movimiento.</div>
            </div>` : ''}
            <div class="wizard-input-group" style="margin-top:10px;">
              <label class="wizard-label">OBSERVACIONES</label>
              <textarea id="w-mv-notas" class="wizard-input" rows="2">${data.notas}</textarea>
            </div>
          </div>`,
        onChange: async (data) => {
          data.transportistaId = document.getElementById('w-mv-transp')?.value || '';
          data.transportista_nombre = document.getElementById('w-mv-transp-nom')?.value.trim() || '';
          data.matricula = document.getElementById('w-mv-matricula')?.value.trim() || '';
          data.desinsectacion_certificada = !!document.getElementById('w-mv-desins')?.checked;
          data.notas = document.getElementById('w-mv-notas')?.value.trim() || '';
        },
        validate: async (data) => {
          if (conf && conf.requiere_desinsectacion_movimiento && !data.desinsectacion_certificada) {
            App.toastError("Debes certificar la desinsectación para esta comunidad");
            return false;
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-guia-movimiento',
      title: 'GUÍA DE MOVIMIENTO',
      initialData: {
        tipo: 'salida',
        motivo: motivos[0] ? motivos[0].value : '',
        fecha: new Date().toISOString().split('T')[0],
        rega_origen: regaPropia,
        rega_destino: '',
        explotacion_contraparte: '',
        especie: '',
        num_animales: 1,
        crotales: [],
        transportistaId: '',
        transportista_nombre: '',
        matricula: '',
        desinsectacion_certificada: false,
        notas: '',
      },
      onComplete: async (data) => {
        try {
          let transpNombre = data.transportista_nombre;
          let matricula = data.matricula;
          if (data.transportistaId) {
            const t = await Transportistas.get(data.transportistaId).catch(() => null);
            if (t) { transpNombre = t.nombre; matricula = matricula || t.matricula; }
          }
          const movId = await Movimientos.save({
            fincaId: await Fincas.getActiveId(),
            tipo: data.tipo,
            numero_guia: 'G-' + Date.now().toString().slice(-8),
            rega_origen: data.rega_origen,
            rega_destino: data.rega_destino,
            explotacion_contraparte: data.explotacion_contraparte,
            motivo: data.motivo,
            especie: data.especie,
            num_animales: data.num_animales,
            crotales: data.crotales,
            transportistaId: data.transportistaId || null,
            transportista_nombre: transpNombre,
            matricula,
            fecha: data.fecha,
            desinsectacion_certificada: data.desinsectacion_certificada,
            comunidad_autonoma: ccaa,
            notas: data.notas,
          });
          const mov = await Movimientos.get(movId);
          App.toast("Guía de movimiento registrada ✅");
          WizardGuiaMovimiento.generarDocumento(finca, mov);
        } catch (e) {
          App.toastError(e.message || 'No se pudo registrar el movimiento');
        }
      }
    });
  },

  generarDocumento(finca, mov) {
    const CS = window.ComunidadesService;
    const conf = CS && finca.comunidad_autonoma ? CS.getConfiguracionCCAA(finca.comunidad_autonoma) : null;
    const plataforma = conf ? conf.sistema_movimiento : 'SIA';
    const overlay = document.createElement('div');
    overlay.id = 'guia-mov-overlay';
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:4000;background:white;color:black;display:flex;flex-direction:column;';
    const contentId = `guia-content-${Date.now()}`;
    const crotalesHtml = (mov.crotales || []).length
      ? `<div style="margin-top:8px;font-size:0.8rem;"><strong>Crotales:</strong> ${mov.crotales.join(', ')}</div>` : '';
    overlay.innerHTML = `
      <div id="${contentId}" style="flex:1;width:100%;background:white;color:black;padding:40px;font-family:serif;box-sizing:border-box;overflow:auto;">
        <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px;">
          <h1 style="margin:0;font-size:1.4rem;text-transform:uppercase;">Guía de Origen y Sanidad Pecuaria</h1>
          <h3 style="margin:5px 0 0;color:#555;font-weight:normal;">Movimiento de ${mov.tipo === 'salida' ? 'Salida' : 'Entrada'} · Plataforma ${plataforma}</h3>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;font-size:0.9rem;margin-bottom:20px;">
          <div>
            <h4 style="border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:0;">EXPLOTACIÓN ORIGEN</h4>
            <p><strong>REGA:</strong> ${mov.rega_origen || '—'}<br>
            ${mov.tipo === 'salida' ? `<strong>Titular:</strong> ${finca.propietario || finca.nombre}` : `<strong>Explotación:</strong> ${mov.explotacion_contraparte || '—'}`}</p>
          </div>
          <div>
            <h4 style="border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:0;">EXPLOTACIÓN DESTINO</h4>
            <p><strong>REGA:</strong> ${mov.rega_destino || '—'}<br>
            ${mov.tipo === 'entrada' ? `<strong>Titular:</strong> ${finca.propietario || finca.nombre}` : `<strong>Explotación:</strong> ${mov.explotacion_contraparte || '—'}`}</p>
          </div>
        </div>
        <div style="margin-bottom:20px;font-size:0.9rem;">
          <h4 style="border-bottom:1px solid #ddd;padding-bottom:4px;">DATOS DEL MOVIMIENTO</h4>
          <p style="margin:0;">
            <strong>Nº Guía:</strong> ${mov.numero_guia} &nbsp;·&nbsp;
            <strong>Fecha:</strong> ${mov.fecha} &nbsp;·&nbsp;
            <strong>Motivo:</strong> ${mov.motivo || '—'}<br>
            <strong>Especie:</strong> ${mov.especie || '—'} &nbsp;·&nbsp;
            <strong>Nº animales:</strong> ${mov.num_animales}
          </p>
          ${crotalesHtml}
        </div>
        <div style="margin-bottom:20px;font-size:0.9rem;">
          <h4 style="border-bottom:1px solid #ddd;padding-bottom:4px;">TRANSPORTE</h4>
          <p style="margin:0;"><strong>Transportista:</strong> ${mov.transportista_nombre || '—'} &nbsp;·&nbsp;
          <strong>Matrícula:</strong> ${mov.matricula || '—'}<br>
          <strong>Desinsectación certificada:</strong> ${mov.desinsectacion_certificada ? 'Sí' : 'No'}</p>
        </div>
        <div style="padding:16px;border:1px solid #ccc;background:#f9f9f9;font-size:0.82rem;">
          Documento generado para su tramitación en <strong>${plataforma}</strong>. El titular se responsabiliza de la
          veracidad de los datos y de su comunicación a la base de datos oficial en los plazos legales.
        </div>
        <div style="margin-top:48px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="text-align:center;width:240px;">
            <p style="margin-bottom:50px;color:#555;">Firma del Titular:</p>
            <div style="border-top:1px solid #000;padding-top:4px;font-weight:bold;">${finca.propietario || finca.nombre}</div>
          </div>
          <div style="text-align:right;"><p>Emitida: <strong>${new Date().toLocaleDateString()}</strong></p></div>
        </div>
      </div>
      <div style="text-align:center;padding:16px;display:flex;gap:10px;justify-content:center;background:#eee;border-top:1px solid #ddd;flex-shrink:0;">
        <button class="btn btn-primary" id="btn-guia-print" style="width:auto;padding:0 30px;background:#10b981;">🖨 IMPRIMIR / GUARDAR PDF</button>
        <button class="btn btn-secondary" onclick="document.getElementById('guia-mov-overlay').remove()" style="width:auto;padding:0 30px;">CERRAR</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-guia-print').onclick = () => {
      const el = document.getElementById(contentId);
      const filename = `Guia_Movimiento_${mov.numero_guia}.pdf`;
      if (typeof html2pdf !== 'undefined') {
        const opt = {
          margin: [12, 10, 12, 10], filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };
        html2pdf().set(opt).from(el).save(filename);
      } else if (window.WizardCrotales && WizardCrotales._fallbackPDF) {
        WizardCrotales._fallbackPDF(el, filename);
      } else {
        window.print();
      }
    };
  }
};
