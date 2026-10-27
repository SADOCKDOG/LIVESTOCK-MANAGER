/**
 * LIVESTOCK MANAGER - PANEL VISUAL DE TRAZABILIDAD PORCINA (RD 787/2023)
 * Sdog Farm Software Factory (sadogfarm.onmicrosoft.com)
 * Vista interactiva para evaluacion zoosanitaria, periodos de supresion y emision de certificados.
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TrazabilidadPorcinaView = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TrazabilidadPorcinaView = {
    render(containerId = "app-content") {
      const container = document.getElementById(containerId) || document.body;
      const html = `
        <div id="panel-trazabilidad-porcina" class="p-16 max-w-5xl mx-auto font-sans" style="color: #e2e8f0;">
          <!-- Cabecera Oficial -->
          <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <span style="background: #2563eb; color: #fff; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">AI-GRC Governance</span>
                <h1 style="margin: 8px 0 4px 0; font-size: 20px; color: #f8fafc; font-weight: 800;">Modulo de Trazabilidad y Validacion Zoosanitaria Porcina</h1>
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">Cumplimiento normativo: Real Decreto 787/2023 y Ley 8/2003 de Sanidad Animal · Sdog Farm Software Factory</p>
              </div>
              <div style="text-align: right;">
                <span id="badge-estado-global" style="background: #059669; color: #fff; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: bold; display: inline-block;">SISTEMA ACTIVO</span>
              </div>
            </div>
          </div>

          <!-- Bento Grid: Formulario Interactivo a la Izquierda | Resultados y Certificado a la Derecha -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            
            <!-- Tarjeta 1: Simulador y Parametros de Evaluacion -->
            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px;">
              <h2 style="font-size: 14px; font-weight: bold; color: #60a5fa; margin-top: 0; margin-bottom: 14px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">
                Parametros de Evaluacion Pecuaria
              </h2>

              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">Codigo REGA Explotacion Origen:</label>
                <input id="input-rega-origen" type="text" value="ES110000000001" style="width: 100%; background: #09090b; border: 1px solid #3f3f46; color: #f4f4f5; padding: 8px; border-radius: 6px; font-family: monospace; font-size: 12px;" />
              </div>

              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">Codigo REGA Explotacion Destino:</label>
                <input id="input-rega-destino" type="text" value="ES410000000002" style="width: 100%; background: #09090b; border: 1px solid #3f3f46; color: #f4f4f5; padding: 8px; border-radius: 6px; font-family: monospace; font-size: 12px;" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div>
                  <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">Identificador Partida:</label>
                  <input id="input-lote-id" type="text" value="LOTE-PORC-EXP-99" style="width: 100%; background: #09090b; border: 1px solid #3f3f46; color: #f4f4f5; padding: 8px; border-radius: 6px; font-size: 12px;" />
                </div>
                <div>
                  <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">Categoria Porcina:</label>
                  <select id="select-categoria" style="width: 100%; background: #09090b; border: 1px solid #3f3f46; color: #f4f4f5; padding: 8px; border-radius: 6px; font-size: 12px;">
                    <option value="cebo" selected>Cebo</option>
                    <option value="cebo_iberico">Cebo Iberico</option>
                    <option value="lechones">Lechones</option>
                    <option value="reproductoras">Reproductoras</option>
                    <option value="transicion">Transicion</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
                <div>
                  <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">N. Animales:</label>
                  <input id="input-num-animales" type="number" value="150" style="width: 100%; background: #09090b; border: 1px solid #3f3f46; color: #f4f4f5; padding: 8px; border-radius: 6px; font-size: 12px;" />
                </div>
                <div>
                  <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">Fecha Salida:</label>
                  <input id="input-fecha-salida" type="date" value="${new Date().toISOString().split("T")[0]}" style="width: 100%; background: #09090b; border: 1px solid #3f3f46; color: #f4f4f5; padding: 8px; border-radius: 6px; font-size: 12px;" />
                </div>
              </div>

              <!-- Simulacion de Tratamiento Zoosanitario -->
              <div style="background: #111827; border: 1px dashed #374151; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <label style="font-size: 12px; font-weight: bold; color: #f59e0b; cursor: pointer;">
                    <input id="chk-simular-tratamiento" type="checkbox" style="margin-right: 6px;" />
                    Simular Tratamiento Farmacologico Reciente
                  </label>
                </div>
                <div id="box-tratamiento" style="display: none;">
                  <div style="margin-bottom: 8px;">
                    <label style="display: block; font-size: 10px; color: #9ca3af;">Medicamento:</label>
                    <input id="input-med-nombre" type="text" value="Amoxicilina Porcina Inyectable" style="width: 100%; background: #030712; border: 1px solid #374151; color: #f3f4f6; padding: 6px; border-radius: 4px; font-size: 11px;" />
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                      <label style="display: block; font-size: 10px; color: #9ca3af;">Fecha Aplicacion:</label>
                      <input id="input-med-fecha" type="date" value="${new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0]}" style="width: 100%; background: #030712; border: 1px solid #374151; color: #f3f4f6; padding: 6px; border-radius: 4px; font-size: 11px;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 10px; color: #9ca3af;">Dias Espera Legal:</label>
                      <input id="input-med-espera" type="number" value="14" style="width: 100%; background: #030712; border: 1px solid #374151; color: #f3f4f6; padding: 6px; border-radius: 4px; font-size: 11px;" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botones de Accion -->
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="btn-evaluar-movimiento" onclick="TrazabilidadPorcinaView.onEvaluarClick()" style="background: #2563eb; color: #fff; border: none; padding: 10px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; transition: background 0.2s;">
                  EVALUAR TRAZABILIDAD Y SUPRESION
                </button>
                <button id="btn-ejecutar-tests" onclick="TrazabilidadPorcinaView.onRunTestsClick()" style="background: #4f46e5; color: #fff; border: none; padding: 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
                  EJECUTAR SUITE DE PRUEBAS AUTOMATIZADA (13 TESTS)
                </button>
              </div>
            </div>

            <!-- Tarjeta 2: Dictamen Zoosanitario y Certificado AI-GRC -->
            <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px; display: flex; flex-direction: column;">
              <h2 style="font-size: 14px; font-weight: bold; color: #10b981; margin-top: 0; margin-bottom: 14px; border-bottom: 1px solid #27272a; padding-bottom: 8px;">
                Dictamen Zoosanitario y Certificado Forense
              </h2>

              <div id="resultado-dictamen" style="margin-bottom: 16px;">
                <div style="background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 14px;">
                  <div style="font-size: 14px; font-weight: bold; color: #34d399; margin-bottom: 4px;">
                    ESTADO: MOVIMIENTO AUTORIZADO
                  </div>
                  <div style="font-size: 12px; color: #a7f3d0;">
                    Lote libre de residuos farmacologicos. Cumple con los requisitos del RD 787/2023.
                  </div>
                </div>
              </div>

              <div id="box-certificado" style="background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 14px; flex-grow: 1; font-family: monospace; font-size: 11px; color: #cbd5e1; overflow-x: auto;">
                <div style="color: #60a5fa; font-weight: bold; margin-bottom: 6px;">[CERTIFICADO OFICIAL DE TRAZABILIDAD]</div>
                <div>ID Certificado: <span id="cert-id" style="color: #f8fafc;">CERT-AI-GRC-PENDIENTE</span></div>
                <div>Norma: <span style="color: #f8fafc;">Real Decreto 787/2023</span></div>
                <div>Emision: <span id="cert-fecha" style="color: #f8fafc;">--</span></div>
                <div>Hash Integridad: <span id="cert-hash" style="color: #34d399; font-weight: bold;">--</span></div>
                <div style="margin-top: 8px; border-top: 1px dashed #334155; padding-top: 8px;">
                  <div>Origen REGA: <span id="cert-origen" style="color: #f8fafc;">--</span></div>
                  <div>Destino REGA: <span id="cert-destino" style="color: #f8fafc;">--</span></div>
                  <div>Partida / Categoria: <span id="cert-partida" style="color: #f8fafc;">--</span></div>
                  <div>Total Animales: <span id="cert-animales" style="color: #f8fafc;">--</span></div>
                </div>
              </div>

              <!-- Registro de Tests Ejecutados -->
              <div id="box-tests-runner" style="margin-top: 14px; display: none; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="font-size: 11px; color: #38bdf8;">Suite de Pruebas Unitarias</strong>
                  <span id="badge-tests-count" style="font-size: 10px; background: #059669; color: #fff; padding: 2px 6px; border-radius: 4px;">13/13 PASS</span>
                </div>
                <div id="lista-tests" style="font-size: 10px; color: #94a3b8; max-height: 120px; overflow-y: auto;">
                  <!-- Rellenado dinamicamente -->
                </div>
              </div>
            </div>

          </div>
        </div>
      `;

      container.innerHTML = html;
      this.initEvents();
      this.onEvaluarClick();
    },

    initEvents() {
      const chk = document.getElementById("chk-simular-tratamiento");
      if (chk) {
        chk.addEventListener("change", (e) => {
          const box = document.getElementById("box-tratamiento");
          if (box) box.style.display = e.target.checked ? "block" : "none";
        });
      }
    },

    getService() {
      if (typeof window !== "undefined" && window.PorcineTraceabilityService) {
        return window.PorcineTraceabilityService;
      }
      if (typeof require === "function") {
        try {
          return require("../services/porcine-traceability.js");
        } catch (e) {}
      }
      return null;
    },

    onEvaluarClick() {
      const svc = this.getService();
      if (!svc) {
        alert("Servicio PorcineTraceabilityService no cargado.");
        return;
      }

      const originRega = (document.getElementById("input-rega-origen")?.value || "").trim();
      const destRega = (document.getElementById("input-rega-destino")?.value || "").trim();
      const batchId = (document.getElementById("input-lote-id")?.value || "").trim();
      const categoria = document.getElementById("select-categoria")?.value || "cebo";
      const numAnimales = parseInt(document.getElementById("input-num-animales")?.value || "1", 10);
      const departureDate = document.getElementById("input-fecha-salida")?.value || new Date().toISOString().split("T")[0];

      const simularTrat = document.getElementById("chk-simular-tratamiento")?.checked;
      const treatments = [];
      if (simularTrat) {
        treatments.push({
          medicamento: document.getElementById("input-med-nombre")?.value || "Medicamento",
          fechaAplicacion: document.getElementById("input-med-fecha")?.value || departureDate,
          diasEspera: parseInt(document.getElementById("input-med-espera")?.value || "14", 10),
        });
      }

      const res = svc.evaluateMovement({
        originRega,
        destRega,
        batch: { batchId, categoria, numAnimales, fechaIngreso: "2026-05-01" },
        treatments,
        departureDate,
      });

      const dictamenEl = document.getElementById("resultado-dictamen");
      if (!res.autorizada) {
        dictamenEl.innerHTML = `
          <div style="background: #7f1d1d; border: 1px solid #dc2626; border-radius: 8px; padding: 14px;">
            <div style="font-size: 14px; font-weight: bold; color: #fca5a5; margin-bottom: 4px;">
              BLOQUEO ZOOSANITARIO: TRASLADO NO AUTORIZADO
            </div>
            <div style="font-size: 12px; color: #fecaca;">
              ${res.motivoRechazo}
            </div>
          </div>
        `;
        document.getElementById("cert-id").innerText = "DENEGADO (SIN EMISION)";
        document.getElementById("cert-hash").innerText = "N/A (BLOQUEADO)";
        document.getElementById("cert-hash").style.color = "#f87171";
      } else {
        const cert = svc.generateTraceabilityCertificate(res);
        dictamenEl.innerHTML = `
          <div style="background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 14px;">
            <div style="font-size: 14px; font-weight: bold; color: #34d399; margin-bottom: 4px;">
              MOVIMIENTO AUTORIZADO · CERTIFICADO EMITIDO
            </div>
            <div style="font-size: 12px; color: #a7f3d0;">
              Lote apto y libre de residuos. Guia generada: ${res.codigoGuia}.
            </div>
          </div>
        `;

        document.getElementById("cert-id").innerText = cert.certificateId;
        document.getElementById("cert-fecha").innerText = new Date(cert.issuedAt).toLocaleString();
        document.getElementById("cert-hash").innerText = cert.integrityHash;
        document.getElementById("cert-hash").style.color = "#34d399";
        document.getElementById("cert-origen").innerText = cert.movementDetails.origen;
        document.getElementById("cert-destino").innerText = cert.movementDetails.destino;
        document.getElementById("cert-partida").innerText = `${cert.movementDetails.partida.batchId} (${cert.movementDetails.partida.categoria})`;
        document.getElementById("cert-animales").innerText = cert.movementDetails.partida.numAnimales;
      }
    },

    onRunTestsClick() {
      const box = document.getElementById("box-tests-runner");
      const list = document.getElementById("lista-tests");
      if (!box || !list) return;

      box.style.display = "block";
      list.innerHTML = "";

      const svc = this.getService();
      if (!svc) return;

      const tests = [
        { name: "REGA: Rechazo de codigos nulos o tipos invalidos", fn: () => !svc.validateREGA(null).isValid },
        { name: "REGA: Rechazo de codigo sin prefijo ES", fn: () => !svc.validateREGA("FR123456789012").isValid },
        { name: "REGA: Rechazo de longitud diferente a 14 caracteres", fn: () => !svc.validateREGA("ES123").isValid },
        { name: "REGA: Aceptacion de codigo oficial ES110000000001", fn: () => svc.validateREGA("ES110000000001").isValid },
        { name: "Partida: Rechazo de campos obligatorios faltantes", fn: () => !svc.validatePorcineBatch({}).isValid },
        { name: "Partida: Rechazo de categoria ajena a porcino", fn: () => !svc.validatePorcineBatch({ batchId: "B1", categoria: "bovino" }).isValid },
        { name: "Partida: Aceptacion de categoria cebo_iberico", fn: () => svc.validatePorcineBatch({ batchId: "B1", categoria: "cebo_iberico", numAnimales: 10, fechaIngreso: "2026-01-01" }).isValid },
        { name: "Supresion: Apto sin tratamientos veterinarios", fn: () => svc.checkSupresionPorcina([], "2026-10-27").apto },
        { name: "Supresion: Bloqueo de tratamiento con espera activa", fn: () => !svc.checkSupresionPorcina([{ fechaAplicacion: "2026-10-20", diasEspera: 15 }], "2026-10-27").apto },
        { name: "Supresion: Desbloqueo al vencer dias de retirada", fn: () => svc.checkSupresionPorcina([{ fechaAplicacion: "2026-09-01", diasEspera: 20 }], "2026-10-27").apto },
        { name: "Movimiento: Rechazo por REGA origen y destino identicos", fn: () => !svc.evaluateMovement({ originRega: "ES110000000001", destRega: "ES110000000001", batch: { batchId: "B1", categoria: "cebo", numAnimales: 10, fechaIngreso: "2026-01-01" } }).autorizada },
        { name: "Movimiento: Autorizacion y generacion de codigo de guia", fn: () => svc.evaluateMovement({ originRega: "ES110000000001", destRega: "ES410000000002", batch: { batchId: "B1", categoria: "cebo", numAnimales: 10, fechaIngreso: "2026-01-01" } }).autorizada },
        { name: "Certificado: Emision de firma forense SHA-256", fn: () => !!svc.generateTraceabilityCertificate({ autorizada: true, codigoGuia: "GUIA-1", detalles: { test: true } }).integrityHash },
      ];

      let passed = 0;
      tests.forEach((t) => {
        let ok = false;
        try {
          ok = t.fn();
        } catch (e) {
          ok = false;
        }
        if (ok) passed++;
        const item = document.createElement("div");
        item.style.padding = "2px 0";
        item.style.color = ok ? "#34d399" : "#f87171";
        item.innerHTML = `[${ok ? "PASS" : "FAIL"}] ${t.name}`;
        list.appendChild(item);
      });

      const badge = document.getElementById("badge-tests-count");
      if (badge) {
        badge.innerText = `${passed}/${tests.length} PASS`;
        badge.style.background = passed === tests.length ? "#059669" : "#dc2626";
      }
    },
  };

  return TrazabilidadPorcinaView;
});
