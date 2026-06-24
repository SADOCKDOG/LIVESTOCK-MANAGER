/**
 * Wizard Censo Anual SIGGAN — Livestock Manager Premium
 * Consolida el censo de la explotación a una fecha de referencia (por defecto
 * 1 de enero) por especie y categoría, y genera el documento de declaración
 * censal exigido por SIGGAN (Junta de Andalucía).
 */
window.WizardCenso = {
  async abrir() {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError("No hay finca activa"); return; }

    const year = new Date().getFullYear();
    const steps = [
      {
        content: (data) => `
          <div class="mt-10">
            <h3 class="text-green mb-15">📅 Fecha de Referencia</h3>
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA DEL CENSO</label>
              <input type="date" id="w-cs-fecha" value="${data.fecha}" class="wizard-input">
            </div>
            <div class="rounded-sm" style="background:rgba(16,185,129,0.1);padding:12px;margin-top:10px;border-left:3px solid #10b981;">
              <div class="text-xs text-aaa">
                📌 La declaración censal obligatoria se refiere normalmente al <strong>censo a 1 de enero</strong>.
                Se contabilizan los animales activos a la fecha indicada.
              </div>
            </div>
          </div>`,
        onChange: async (data) => {
          data.fecha = document.getElementById('w-cs-fecha')?.value || data.fecha;
        },
        validate: async (data) => {
          if (!data.fecha) { App.toastError("Indica la fecha de referencia"); return false; }
          return true;
        }
      },
      {
        content: async (data) => {
          const censo = await WizardCenso._calcularCenso(data.fecha);
          data._censo = censo;
          const filas = Object.entries(censo.porEspecie);
          return `
          <div class="mt-10">
            <h3 class="text-green mb-15">🐑 Censo a ${data.fecha}</h3>
            <div class="text-3xl font-black text-white mb-10">${censo.total} animales</div>
            ${filas.length === 0 ? '<p class="empty-state-text">No hay animales activos en la fecha indicada.</p>' : ''}
            ${filas.map(([esp, info]) => `
              <div class="rounded-sm p-10 mb-8 bg-dark">
                <div class="flex justify-between font-bold text-gold mb-6">
                  <span>${esp}</span><span>Total: ${info.total}</span>
                </div>
                <div class="text-gray text-82">♀ ${info.hembras} hembras · ♂ ${info.machos} machos</div>
                <div class="mt-4 text-gray-500 text-75">
                  ${Object.entries(info.categorias).map(([cat, cnt]) =>
                    `<span class="rounded-sm" style="background:#222;padding:2px 6px;margin-right:4px;">${cat}: ${cnt}</span>`).join('')}
                </div>
              </div>`).join('')}
          </div>`;
        },
        onChange: async () => {},
        validate: async (data) => {
          if (!data._censo || data._censo.total === 0) {
            App.toastError("No hay censo que declarar para esa fecha");
            return false;
          }
          return true;
        }
      },
      {
        content: (data) => `
          <div class="mt-10">
            <h3 class="text-green mb-15">🗂️ Tramitación Administrativa</h3>
            <div class="wizard-input-group">
              <label class="wizard-label">ESTADO DE TRÁMITE</label>
              <select id="w-cs-estado" class="wizard-input">
                <option value="borrador" ${data.estado_tramite === "borrador" ? "selected" : ""}>Borrador</option>
                <option value="presentado" ${data.estado_tramite === "presentado" ? "selected" : ""}>Presentado</option>
                <option value="aceptado" ${data.estado_tramite === "aceptado" ? "selected" : ""}>Aceptado</option>
                <option value="rechazado" ${data.estado_tramite === "rechazado" ? "selected" : ""}>Rechazado</option>
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA PRESENTACIÓN</label>
              <input type="date" id="w-cs-presentacion" value="${data.fecha_presentacion || ""}" class="wizard-input">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">NÚMERO REGISTRO OFICIAL</label>
              <input type="text" id="w-cs-registro" value="${data.numero_registro_oficial || ""}" class="wizard-input" placeholder="Ej: CENSO-2026-0001">
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ACUSE RECIBO</label>
              <textarea id="w-cs-acuse" class="wizard-input" style="min-height:70px;resize:none;">${data.acuse_recibo || ""}</textarea>
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.estado_tramite = document.getElementById("w-cs-estado")?.value || data.estado_tramite;
          data.fecha_presentacion = document.getElementById("w-cs-presentacion")?.value || "";
          data.numero_registro_oficial = document.getElementById("w-cs-registro")?.value.trim() || "";
          data.acuse_recibo = document.getElementById("w-cs-acuse")?.value.trim() || "";
        },
        validate: async (data) => {
          if (data.estado_tramite !== "borrador" && !data.fecha_presentacion) {
            App.toastError("Indica la fecha de presentación.");
            return false;
          }
          if ((data.estado_tramite === "aceptado" || data.estado_tramite === "rechazado") && !data.numero_registro_oficial) {
            App.toastError("Indica el número de registro oficial.");
            return false;
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-censo',
      title: 'DECLARACIÓN CENSAL',
      initialData: {
        fecha: `${year}-01-01`,
        _censo: null,
        estado_tramite: "borrador",
        fecha_presentacion: "",
        numero_registro_oficial: "",
        acuse_recibo: ""
      },
      steps,
      onComplete: async (data) => {
        const fechaHoy = new Date().toISOString().split("T")[0];
        const ahoraIso = new Date().toISOString();
        const fincaId = await Fincas.getActiveId().catch(() => null);
        const documentoId = await window.db.add("documentos_legales", {
          fincaId,
          tipo: "DECLARACION_CENSAL",
          fecha: data.fecha || fechaHoy,
          descripcion: `Declaración censal (${data._censo?.total || 0} animales)`,
          estado_tramite: data.estado_tramite || "borrador",
          fecha_presentacion: data.fecha_presentacion || null,
          numero_registro_oficial: data.numero_registro_oficial || null,
          acuse_recibo: data.acuse_recibo || null,
          payload: data._censo || null,
          creadoEn: ahoraIso,
          actualizadoEn: ahoraIso
        });
        await window.db.add("registro_eventos", {
          fincaId,
          tipo: "declaracion_censal",
          tipo_entidad: "finca",
          entidad_id: fincaId || 0,
          fecha: data.fecha || fechaHoy,
          descripcion: `Declaración censal registrada (${data._censo?.total || 0} animales)`,
          estado_tramite: data.estado_tramite || "borrador",
          fecha_presentacion: data.fecha_presentacion || null,
          numero_registro_oficial: data.numero_registro_oficial || null,
          acuse_recibo: data.acuse_recibo || null,
          documento_legal_id: documentoId,
          creadoEn: ahoraIso
        }).catch(() => {});
        WizardCenso.generarDocumento(finca, data.fecha, data._censo);
      }
    });
  },

  async _calcularCenso(fecha) {
    const animales = await window.db.getAll('animales').catch(() => []);
    const ref = fecha ? new Date(fecha) : new Date();
    const porEspecie = {};
    let total = 0;
    animales.forEach(a => {
      if (a?.anulado) return;
      // Activo a la fecha: dado de alta antes/igual y no dado de baja antes de la fecha
      const alta = a.fecha_alta ? new Date(a.fecha_alta) : (a.fecha_nacimiento ? new Date(a.fecha_nacimiento) : null);
      if (alta && alta > ref) return;
      const baja = (a.estado === 'baja' || a.estado === 'vendido') && a.fecha_baja ? new Date(a.fecha_baja) : null;
      if (baja && baja <= ref) return;
      // Si no hay fecha de baja pero está de baja/vendido, lo excluimos sólo si la fecha es "hoy o futura"
      if (!baja && (a.estado === 'baja' || a.estado === 'vendido')) return;

      const esp = a.especie || 'Sin especie';
      if (!porEspecie[esp]) porEspecie[esp] = { total: 0, hembras: 0, machos: 0, categorias: {} };
      porEspecie[esp].total++;
      total++;
      const sexo = (a.sexo || '').toString().toUpperCase();
      if (sexo === 'H' || sexo.startsWith('HEMBRA')) porEspecie[esp].hembras++;
      else if (sexo === 'M' || sexo.startsWith('MACHO')) porEspecie[esp].machos++;
      const cat = a.categoria || a.tipo || 'Sin categoría';
      porEspecie[esp].categorias[cat] = (porEspecie[esp].categorias[cat] || 0) + 1;
    });
    return { total, porEspecie };
  },

  generarDocumento(finca, fecha, censo) {
    const overlay = document.createElement('div');
    overlay.id = 'censo-overlay';
    overlay.className = 'wizard-full-screen';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:4000;background:white;color:black;display:flex;flex-direction:column;';
    const contentId = `censo-content-${Date.now()}`;
    const regaPropia = finca.codigo_REGA || finca.rega || '—';
    const filas = Object.entries(censo.porEspecie);
    overlay.innerHTML = `
      <div id="${contentId}" style="flex:1;width:100%;background:white;color:black;padding:40px;font-family:serif;box-sizing:border-box;overflow:auto;">
        <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px;">
          <h1 style="margin:0;font-size:1.4rem;text-transform:uppercase;">Declaración Censal de Explotación Ganadera</h1>
          <h3 style="margin:5px 0 0;color:#555;font-weight:normal;">Censo a fecha ${fecha}</h3>
        </div>
        <div style="font-size:0.9rem;margin-bottom:20px;">
          <p style="margin:0;"><strong>Explotación:</strong> ${finca.nombre || '—'} &nbsp;·&nbsp;
          <strong>REGA:</strong> ${regaPropia}<br>
          <strong>Titular:</strong> ${finca.propietario || '—'} &nbsp;·&nbsp;
          <strong>NIF/CIF:</strong> ${finca.nif_cif || finca.nif || '—'}<br>
          <strong>Provincia:</strong> ${finca.provincia || '—'} &nbsp;·&nbsp;
          <strong>Municipio:</strong> ${finca.municipio || '—'}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.88rem;">
          <thead>
            <tr style="background:#eee;">
              <th style="padding:8px;border:1px solid #ccc;text-align:left;">Especie</th>
              <th style="padding:8px;border:1px solid #ccc;text-align:center;">Hembras</th>
              <th style="padding:8px;border:1px solid #ccc;text-align:center;">Machos</th>
              <th style="padding:8px;border:1px solid #ccc;text-align:center;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${filas.map(([esp, info]) => `
              <tr>
                <td style="padding:8px;border:1px solid #ccc;">${esp}</td>
                <td style="padding:8px;border:1px solid #ccc;text-align:center;">${info.hembras}</td>
                <td style="padding:8px;border:1px solid #ccc;text-align:center;">${info.machos}</td>
                <td style="padding:8px;border:1px solid #ccc;text-align:center;font-weight:bold;">${info.total}</td>
              </tr>`).join('')}
            <tr style="background:#f4f4f4;font-weight:bold;">
              <td style="padding:8px;border:1px solid #ccc;">TOTAL</td>
              <td style="padding:8px;border:1px solid #ccc;"></td>
              <td style="padding:8px;border:1px solid #ccc;"></td>
              <td style="padding:8px;border:1px solid #ccc;text-align:center;">${censo.total}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:48px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="text-align:center;width:240px;">
            <p style="margin-bottom:50px;color:#555;">Firma del Titular:</p>
            <div style="border-top:1px solid #000;padding-top:4px;font-weight:bold;">${finca.propietario || finca.nombre}</div>
          </div>
          <div style="text-align:right;"><p>Emitida: <strong>${new Date().toLocaleDateString()}</strong></p></div>
        </div>
      </div>
      <div style="text-align:center;padding:16px;display:flex;gap:10px;justify-content:center;background:#eee;border-top:1px solid #ddd;flex-shrink:0;">
        <button class="btn btn-primary" id="btn-censo-print" style="width:auto;padding:0 30px;background:#10b981;">🖨 IMPRIMIR / GUARDAR PDF</button>
        <button class="btn btn-secondary" onclick="document.getElementById('censo-overlay').remove()" style="width:auto;padding:0 30px;">CERRAR</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-censo-print').onclick = () => {
      const el = document.getElementById(contentId);
      const filename = `Censo_${regaPropia}_${fecha}.pdf`;
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
