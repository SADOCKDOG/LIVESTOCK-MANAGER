/**
 * Wizard Guía de Movimiento SIGGAN — Livestock Manager Premium
 * Genera la guía de origen y sanidad pecuaria para movimientos
 * inter-explotación (entrada/salida) y la registra como movimiento oficial,
 * dirigida a la plataforma de la comunidad (SIGGAN / BADIGEX / PIMA).
 */
window.WizardGuiaMovimiento = {
  async abrir(borrador = null) {
    const finca = await Fincas.getActive();
    if (!finca) { App.toastError("No hay finca activa"); return; }

    const CS = window.ComunidadesService;
    const ccaa = finca.comunidad_autonoma || '';
    const motivos = CS ? CS.getMotivosMovimiento() : [];
    const conf = CS && ccaa ? CS.getConfiguracionCCAA(ccaa) : null;
    const regaPropia = finca.codigo_REGA || finca.rega || '';

    const especiesMaestras = await window.db.getAll("config_especies").catch(() => []);
    const animalesActivos = (await Animales.list()).filter(a => (a.estado || 'activo') === 'activo');

    let transportistas = [];
    try { transportistas = await Transportistas.list({ activo: true }); } catch (e) { transportistas = []; }

    const steps = [
      {
        content: (data) => `
          <div class="card card-accent card-accent-green p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #10b981">TIPO DE MOVIMIENTO</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">DIRECCIÓN</label>
              <select id="w-mv-tipo" class="wizard-input font-900">
                <option value="salida" ${data.tipo === 'salida' ? 'selected' : ''}>SALIDA (DESDE MI EXPLOTACIÓN)</option>
                <option value="entrada" ${data.tipo === 'entrada' ? 'selected' : ''}>ENTRADA (HACIA MI EXPLOTACIÓN)</option>
              </select>
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">MOTIVO OFICIAL</label>
              <select id="w-mv-motivo" class="wizard-input font-800">
                ${motivos.map(m => `<option value="${m.value}" ${data.motivo === m.value ? 'selected' : ''}>${m.label.toUpperCase()}</option>`).join('')}
              </select>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">FECHA DEL MOVIMIENTO</label>
              <input type="date" id="w-mv-fecha" value="${data.fecha}" class="wizard-input font-800">
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
          <div class="card card-accent card-accent-blue p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #3b82f6">EXPLOTACIONES Y CENSO</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">REGA ${esSalida ? 'ORIGEN (PROPIO)' : 'DESTINO (PROPIO)'}</label>
              <input type="text" id="w-mv-rega-propia" value="${esSalida ? data.rega_origen : data.rega_destino}" class="wizard-input font-900 input-rega-std" ${regaPropia ? 'readonly' : ''} maxlength="14">
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">REGA ${esSalida ? 'DESTINO' : 'ORIGEN'} (CONTRAPARTE)</label>
              <input type="text" id="w-mv-rega-contra" value="${esSalida ? data.rega_destino : data.rega_origen}" placeholder="ES000000000000" class="wizard-input font-800 uppercase input-rega-std" maxlength="14">
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">NOMBRE EXPLOTACIÓN CONTRAPARTE</label>
              <input type="text" id="w-mv-contra-nombre" value="${data.explotacion_contraparte}" placeholder="TITULAR O EXPLOTACIÓN" class="wizard-input uppercase font-800">
            </div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">TIPO OPERADOR DESTINO</label>
              <select id="w-mv-tipo-operador" class="wizard-input font-800">
                <option value="">— SELECCIONAR —</option>
                <option value="matadero" ${data.tipo_operador_destino === 'matadero' ? 'selected' : ''}>MATADERO</option>
                <option value="operador_comercial" ${data.tipo_operador_destino === 'operador_comercial' ? 'selected' : ''}>OPERADOR COMERCIAL</option>
                <option value="tratante" ${data.tipo_operador_destino === 'tratante' ? 'selected' : ''}>TRATANTE</option>
                <option value="cebadero" ${data.tipo_operador_destino === 'cebadero' ? 'selected' : ''}>CEBADERO</option>
                <option value="industria_lactea" ${data.tipo_operador_destino === 'industria_lactea' ? 'selected' : ''}>INDUSTRIA LÁCTEA</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">ESPECIE</label>
                <select id="w-mv-especie" class="wizard-input font-800">
                  <option value="">— SELECCIONAR —</option>
                  ${especiesMaestras.map(e => `<option value="${e.nombre}" ${data.especie === e.nombre ? 'selected' : ''}>${e.nombre.toUpperCase()}</option>`).join('')}
                </select>
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº ANIMALES</label>
                <input type="number" id="w-mv-num" value="${data.num_animales}" min="1" class="wizard-input font-900 text-lg" readonly>
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">SELECCIONAR CROTALES (CENSO ACTIVO)</label>
              <div id="w-mv-crotales-list" class="bg-black border border-222 rounded-sm p-10 mt-5" style="max-height: 180px; overflow-y: auto;">
                  ${animalesActivos.length > 0
                    ? animalesActivos.map(a => `
                      <label class="flex items-center gap-10 p-10 border-bottom-222 cursor-pointer">
                        <input type="checkbox" value="${a.numero_identificacion}" class="mv-crotal-chk" ${data.crotales.includes(a.numero_identificacion) ? 'checked' : ''}>
                        <span class="text-white font-900 text-xs uppercase">${a.numero_identificacion} <small class="text-aaa font-700 ml-4">${a.raza || ''}</small></span>
                      </label>
                    `).join('')
                    : '<div class="text-center text-gray p-20 uppercase font-900 text-xs">Sin animales activos para mover</div>'
                  }
              </div>
              <small class="text-aaa uppercase font-700 text-[0.55rem] mt-4 block">Marca los animales que formarán la expedición</small>
            </div>
          </div>`;
        },
        onRender: (data, stepEl) => {
          const updateCount = () => {
            const checks = stepEl.querySelectorAll('.mv-crotal-chk:checked');
            const numInput = stepEl.querySelector('#w-mv-num');
            if (numInput) numInput.value = checks.length;
          };
          stepEl.querySelectorAll('.mv-crotal-chk').forEach(cb => {
            cb.addEventListener('change', updateCount);
          });
        },
        onChange: async (data) => {
          const esSalida = data.tipo === 'salida';
          const propia = (document.getElementById('w-mv-rega-propia')?.value || '').trim();
          const contra = (document.getElementById('w-mv-rega-contra')?.value || '').trim();
          if (esSalida) { data.rega_origen = propia; data.rega_destino = contra; }
          else { data.rega_destino = propia; data.rega_origen = contra; }
          data.explotacion_contraparte = document.getElementById('w-mv-contra-nombre')?.value.trim() || '';
          data.tipo_operador_destino = document.getElementById('w-mv-tipo-operador')?.value || '';
          data.especie = document.getElementById('w-mv-especie')?.value || '';

          const checks = document.querySelectorAll('.mv-crotal-chk:checked');
          data.crotales = Array.from(checks).map(cb => cb.value);
          data.num_animales = data.crotales.length;
        },
        validate: async (data) => {
          if (data.num_animales <= 0) { App.toastError("Indica el nº de animales"); return false; }
          if (!data.especie) { App.toastError("Indica la especie del movimiento"); return false; }
          if (data.tipo === 'salida' && !data.tipo_operador_destino) {
            App.toastError("Selecciona el tipo de operador destino para la salida.");
            return false;
          }
          if (data.crotales.length === 0) {
            App.toastError("Debes informar todos los crotales del movimiento.");
            return false;
          }
          if (data.crotales.length !== data.num_animales) {
            App.toastError("El nº de crotales debe coincidir con el nº de animales.");
            return false;
          }
          for (const crotal of data.crotales) {
            if (window.ErrorHandler?.validateCaravana) {
              try {
                window.ErrorHandler.validateCaravana(crotal);
              } catch (err) {
                App.toastError(err.message || `Crotal inválido: ${crotal}`);
                return false;
              }
            }
          }
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
          <div class="card card-accent card-accent-amber p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: var(--p-gold)">${Icons.transportistas()} LOGÍSTICA Y SANIDAD</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">TRANSPORTISTA REGISTRADO</label>
               <select id="w-mv-transp" class="wizard-input font-800" onchange="WizardGuiaMovimiento._onSelectTransportista(this.value)">
                 <option value="">— MANUAL / SIN REGISTRAR —</option>
                 ${transportistas.map(t => `<option value="${t.id}" ${data.transportistaId == t.id ? 'selected' : ''}>${t.nombre.toUpperCase()} (${t.matricula || 'S/M'})</option>`).join('')}
               </select>
            </div>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">NOMBRE TRANSPORTISTA</label>
                <input type="text" id="w-mv-transp-nom" value="${data.transportista_nombre}" class="wizard-input uppercase font-800" placeholder="SI NO ESTÁ EN LISTA">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">MATRÍCULA</label>
                <input type="text" id="w-mv-matricula" value="${data.matricula}" class="wizard-input uppercase font-900" placeholder="0000AAA">
              </div>
            </div>
            <label class="flex items-center gap-10 text-xs text-white cursor-pointer bg-black border border-222 p-12 rounded-sm mb-12">
              <input type="checkbox" id="w-mv-desins" ${data.desinsectacion_certificada ? 'checked' : ''} style="accent-color:var(--p-gold);">
              <span class="uppercase font-900 text-[0.6rem] tracking-tight leading-tight">DESINSECTACIÓN CERTIFICADA (48H PREVIAS)</span>
            </label>
            ${conf && conf.requiere_desinsectacion_movimiento ? `
            <div class="p-10 bg-red-900 border border-red-500 rounded-sm mb-12">
              <div class="text-[0.55rem] text-white uppercase font-950 tracking-widest">${Icons.alerta()} ${conf.label} EXIGE CERTIFICADO DE DESINSECTACIÓN</div>
            </div>` : ''}
            <div class="wizard-input-group">
              <label class="wizard-label">OBSERVACIONES</label>
              <textarea id="w-mv-notas" class="wizard-input font-700 uppercase" rows="2" style="resize:none;">${data.notas}</textarea>
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
      },
      {
        content: (data) => `
          <div class="card card-accent card-accent-purple p-16 mt-10">
            <div class="section-header-theme mb-12" style="--theme-color: #8b5cf6">TRAMITACIÓN ADMINISTRATIVA</div>
            <div class="wizard-input-group mb-12">
              <label class="wizard-label">ESTADO DEL TRÁMITE</label>
              <select id="w-mv-estado" class="wizard-input font-950">
                <option value="borrador" ${data.estado_tramite === 'borrador' ? 'selected' : ''}>BORRADOR</option>
                <option value="presentado" ${data.estado_tramite === 'presentado' ? 'selected' : ''}>PRESENTADO</option>
                <option value="aceptado" ${data.estado_tramite === 'aceptado' ? 'selected' : ''}>ACEPTADO</option>
                <option value="rechazado" ${data.estado_tramite === 'rechazado' ? 'selected' : ''}>RECHAZADO</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="wizard-input-group">
                <label class="wizard-label">FECHA PRESENTACIÓN</label>
                <input type="date" id="w-mv-fecha-pres" value="${data.fecha_presentacion || ''}" class="wizard-input font-800">
              </div>
              <div class="wizard-input-group">
                <label class="wizard-label">Nº REGISTRO OFICIAL</label>
                <input type="text" id="w-mv-reg-of" value="${data.numero_registro_oficial || ''}" class="wizard-input uppercase font-800" placeholder="ASIENTO">
              </div>
            </div>
            <div class="wizard-input-group">
              <label class="wizard-label">ACUSE / JUSTIFICANTE</label>
              <input type="text" id="w-mv-acuse" value="${data.acuse_recibo || ''}" class="wizard-input uppercase font-800" placeholder="CÓDIGO DE ACUSE">
            </div>
          </div>
        `,
        onChange: async (data) => {
          data.estado_tramite = document.getElementById('w-mv-estado')?.value || data.estado_tramite;
          data.fecha_presentacion = document.getElementById('w-mv-fecha-pres')?.value || '';
          data.numero_registro_oficial = document.getElementById('w-mv-reg-of')?.value.trim() || '';
          data.acuse_recibo = document.getElementById('w-mv-acuse')?.value.trim() || '';
        },
        validate: async (data) => {
          if (data.estado_tramite !== 'borrador' && !data.fecha_presentacion) {
            App.toastError("La fecha de presentación es obligatoria.");
            return false;
          }
          if ((data.estado_tramite === 'aceptado' || data.estado_tramite === 'rechazado') &&
              (!data.numero_registro_oficial || !data.acuse_recibo)) {
            App.toastError("Registro oficial y acuse son obligatorios para estado aceptado/rechazado.");
            return false;
          }
          return true;
        }
      }
    ];

    window.WizardManager.create({
      id: 'wizard-guia-movimiento',
      title: 'GUÍA DE MOVIMIENTO',
      steps: steps,
      initialData: {
        id: borrador ? borrador.id : undefined,
        tipo: borrador ? borrador.tipo : 'salida',
        motivo: borrador ? borrador.motivo : (motivos[0] ? motivos[0].value : ''),
        fecha: borrador ? borrador.fecha : new Date().toISOString().split('T')[0],
        rega_origen: borrador ? borrador.rega_origen : regaPropia,
        rega_destino: borrador ? borrador.rega_destino : '',
        explotacion_contraparte: borrador ? borrador.explotacion_contraparte : '',
        especie: borrador ? borrador.especie : '',
        num_animales: borrador ? borrador.num_animales : 1,
        crotales: borrador ? borrador.crotales : [],
        tipo_operador_destino: borrador ? borrador.tipo_operador_destino : '',
        transportistaId: borrador ? borrador.transportistaId : '',
        transportista_nombre: borrador ? borrador.transportista_nombre : '',
        matricula: borrador ? borrador.matricula : '',
        desinsectacion_certificada: borrador ? !!borrador.desinsectacion_certificada : false,
        estado_tramite: borrador ? borrador.estado_tramite : 'borrador',
        fecha_presentacion: borrador ? borrador.fecha_presentacion : '',
        numero_registro_oficial: borrador ? borrador.numero_registro_oficial : '',
        acuse_recibo: borrador ? borrador.acuse_recibo : '',
        notas: borrador ? borrador.notas : '',
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
            id: data.id || undefined,
            fincaId: await Fincas.getActiveId(),
            tipo: data.tipo,
            numero_guia: borrador ? borrador.numero_guia : 'G-' + Date.now().toString().slice(-8),
            rega_origen: data.rega_origen,
            rega_destino: data.rega_destino,
            explotacion_contraparte: data.explotacion_contraparte,
            motivo: data.motivo,
            especie: data.especie,
            num_animales: data.num_animales,
            crotales: data.crotales,
            tipo_operador_destino: data.tipo_operador_destino || '',
            transportistaId: data.transportistaId || null,
            transportista_nombre: transpNombre,
            matricula,
            fecha: data.fecha,
            desinsectacion_certificada: data.desinsectacion_certificada,
            comunidad_autonoma: ccaa,
            estado_tramite: data.estado_tramite || 'borrador',
            fecha_presentacion: data.fecha_presentacion || '',
            numero_registro_oficial: data.numero_registro_oficial || '',
            acuse_recibo: data.acuse_recibo || '',
            notas: data.notas,
          });
          const mov = await Movimientos.get(movId);
          await window.db.add('documentos_legales', {
            tipo: 'guia_movimiento',
            fincaId: await Fincas.getActiveId(),
            numero: mov.numero_guia,
            fecha_emision: mov.fecha,
            estado_tramite: mov.estado_tramite || 'borrador',
            fecha_presentacion: mov.fecha_presentacion || null,
            numero_registro_oficial: mov.numero_registro_oficial || '',
            acuse_recibo: mov.acuse_recibo || '',
            plataforma: mov.plataforma || '',
            created_at: new Date().toISOString(),
          }).catch(() => {});
          App.toast("Guía de movimiento registrada " + Icons.check());
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
        <div style="margin-bottom:20px;font-size:0.9rem;">
          <h4 style="border-bottom:1px solid #ddd;padding-bottom:4px;">TRAMITACIÓN ADMINISTRATIVA</h4>
          <p style="margin:0;">
            <strong>Estado:</strong> ${(mov.estado_tramite || 'borrador').toUpperCase()}<br>
            <strong>Fecha presentación:</strong> ${mov.fecha_presentacion || '—'}<br>
            <strong>Nº registro oficial:</strong> ${mov.numero_registro_oficial || '—'}<br>
            <strong>Acuse:</strong> ${mov.acuse_recibo || '—'}
          </p>
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
      <div style="text-align:center;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));display:flex;gap:10px;justify-content:center;background:#eee;border-top:1px solid #ddd;flex-shrink:0;">
        <button class="btn btn-primary" id="btn-guia-print" style="width:auto;padding:0 30px;background:#10b981;">${Icons.exportar()} IMPRIMIR / GUARDAR PDF</button>
        <button class="btn btn-secondary" onclick="document.getElementById('guia-mov-overlay').remove()" style="width:auto;padding:0 30px;">CERRAR</button>
      </div>`;
    document.body.appendChild(overlay);    overlay.querySelector('#btn-guia-print').onclick = async () => {
      const el = document.getElementById(contentId);
      const filename = `Guia_Movimiento_${mov.numero_guia}.pdf`;

      if (window.InformesView && window.InformesView._exportarConCompartir) {
          await window.InformesView._exportarConCompartir(
            async () => {
              const opt = {
                margin: [12, 10, 12, 10], filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
              };
              return await html2pdf().set(opt).from(el).toPdf().output('blob');
            },
            'Guía de Movimiento', filename, 'application/pdf', 'guia_movimiento'
          );
          return;
      }

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
  },

  async _onSelectTransportista(transportistaId) {
    console.log("[WizardGuiaMovimiento] _onSelectTransportista seleccionado:", transportistaId);
    let transportistas = [];
    try { transportistas = await Transportistas.list({ activo: true }); } catch (e) { transportistas = []; }
    const t = transportistas.find(x => Number(x.id) === Number(transportistaId));

    const inputNombre = document.getElementById('w-mv-transp-nom');
    const inputMatricula = document.getElementById('w-mv-matricula');

    if (t) {
      if (inputNombre) inputNombre.value = t.nombre || '';
      if (inputMatricula) inputMatricula.value = t.matricula || '';
    } else {
      if (inputNombre) inputNombre.value = '';
      if (inputMatricula) inputMatricula.value = '';
    }
  }
};

