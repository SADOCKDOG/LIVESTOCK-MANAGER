/**
 * LIVESTOCK MANAGER - SUITE DE PRUEBAS UNITARIAS: TRAZABILIDAD PORCINA
 * Sdog Farm Software Factory - sadogfarm.onmicrosoft.com
 * Validacion de reglas de negocio, codigos REGA, periodos de supresion y emision de certificados.
 */

const assert = require("assert");
const path = require("path");

const servicePath = path.join(__dirname, "..", "js", "services", "porcine-traceability.js");
const PorcineTraceabilityService = require(servicePath);

// Runner determinista independiente para ejecucion directa con node y sandbox
let testFn = (title, fn) => {
  try {
    fn();
    console.log(`  [PASS] ${title}`);
  } catch (err) {
    console.error(`  [FAIL] ${title}: ${err.message}`);
    throw err;
  }
};

let describeFn = (title, fn) => {
  console.log(`\n=== ${title} ===`);
  fn();
};

// Si se ejecuta mediante el test runner de Playwright
if (process.env.PW_TEST) {
  try {
    const pw = require("@playwright/test");
    if (pw && pw.test) {
      describeFn = pw.test.describe;
      testFn = pw.test;
    }
  } catch (e) {}
}

describeFn("PorcineTraceabilityService: Validacion de Codigos REGA", () => {
  testFn("Rechaza codigos nulos, vacios o tipos incorrectos", () => {
    assert.strictEqual(PorcineTraceabilityService.validateREGA(null).isValid, false);
    assert.strictEqual(PorcineTraceabilityService.validateREGA("").isValid, false);
    assert.strictEqual(PorcineTraceabilityService.validateREGA(123456789).isValid, false);
  });

  testFn("Rechaza codigos sin prefijo de pais ES", () => {
    const res = PorcineTraceabilityService.validateREGA("FR123456789012");
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error.includes("ES"));
  });

  testFn("Rechaza codigos con longitud diferente a 14 caracteres", () => {
    assert.strictEqual(PorcineTraceabilityService.validateREGA("ES123").isValid, false);
    assert.strictEqual(PorcineTraceabilityService.validateREGA("ES123456789012345").isValid, false);
  });

  testFn("Acepta codigo REGA reglamentario espanol de 14 caracteres", () => {
    const res = PorcineTraceabilityService.validateREGA("ES110000000001");
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.code, "ES110000000001");
  });
});

describeFn("PorcineTraceabilityService: Validacion de Partida Porcina", () => {
  testFn("Rechaza partidas con datos invalidos o faltantes", () => {
    const res = PorcineTraceabilityService.validatePorcineBatch({});
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.length >= 3);
  });

  testFn("Rechaza categoria zootecnica desconocida", () => {
    const res = PorcineTraceabilityService.validatePorcineBatch({
      batchId: "LOTE-2026-001",
      categoria: "bovino_cebo",
      numAnimales: 50,
      fechaIngreso: "2026-05-10",
    });
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes("Categoria zootecnica invalida")));
  });

  testFn("Acepta partida porcina reglamentaria con categoria valida", () => {
    const res = PorcineTraceabilityService.validatePorcineBatch({
      batchId: "LOTE-PORC-001",
      categoria: "cebo_iberico",
      numAnimales: 120,
      fechaIngreso: "2026-06-01",
      regaOrigen: "ES110000000001",
    });
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.batch.categoria, "cebo_iberico");
    assert.strictEqual(res.batch.numAnimales, 120);
  });
});

describeFn("PorcineTraceabilityService: Periodos de Supresion (RD 787/2023)", () => {
  testFn("Declara apto si no existen tratamientos farmacologicos", () => {
    const res = PorcineTraceabilityService.checkSupresionPorcina([], "2026-10-27");
    assert.strictEqual(res.apto, true);
    assert.strictEqual(res.diasRestantes, 0);
  });

  testFn("Bloquea traslado si un medicamento aun se encuentra en periodo de retirada", () => {
    const treatments = [
      {
        medicamento: "Amoxicilina Porcina Inyectable",
        fechaAplicacion: "2026-10-20",
        diasEspera: 15, // Fin de espera: 2026-11-04
      },
    ];

    const res = PorcineTraceabilityService.checkSupresionPorcina(treatments, "2026-10-27");
    assert.strictEqual(res.apto, false);
    assert.strictEqual(res.medicamentoCausal, "Amoxicilina Porcina Inyectable");
    assert.strictEqual(res.diasRestantes, 8);
    assert.ok(res.motivo.includes("periodo de supresion zoosanitaria"));
  });

  testFn("Autoriza traslado una vez superado el tiempo de espera legal", () => {
    const treatments = [
      {
        medicamento: "Tratamiento Antiparasitario",
        fechaAplicacion: "2026-09-01",
        diasEspera: 28, // Fin de espera: 2026-09-29
      },
    ];

    const res = PorcineTraceabilityService.checkSupresionPorcina(treatments, "2026-10-27");
    assert.strictEqual(res.apto, true);
    assert.strictEqual(res.diasRestantes, 0);
  });
});

describeFn("PorcineTraceabilityService: Evaluacion de Movimiento y Emision de Certificado", () => {
  testFn("Rechaza movimiento si origen y destino son identicos", () => {
    const res = PorcineTraceabilityService.evaluateMovement({
      originRega: "ES110000000001",
      destRega: "ES110000000001",
      batch: { batchId: "LOTE-01", categoria: "lechones", numAnimales: 40, fechaIngreso: "2026-08-01" },
    });
    assert.strictEqual(res.autorizada, false);
    assert.ok(res.motivoRechazo.includes("no puede ser identico"));
  });

  testFn("Rechaza movimiento si hay tratamientos en espera activa", () => {
    const res = PorcineTraceabilityService.evaluateMovement({
      originRega: "ES110000000001",
      destRega: "ES410000000002",
      batch: { batchId: "LOTE-01", categoria: "cebo", numAnimales: 80, fechaIngreso: "2026-05-01" },
      treatments: [{ medicamento: "Tilmicosina", fechaAplicacion: "2026-10-25", diasEspera: 14 }],
      departureDate: "2026-10-27",
    });
    assert.strictEqual(res.autorizada, false);
    assert.ok(res.motivoRechazo.includes("Tilmicosina"));
  });

  testFn("Autoriza movimiento pecuario conforme y genera certificado con hash forense", () => {
    const res = PorcineTraceabilityService.evaluateMovement({
      originRega: "ES110000000001",
      destRega: "ES410000000002",
      batch: { batchId: "LOTE-PORC-EXP-99", categoria: "cebo", numAnimales: 200, fechaIngreso: "2026-04-01" },
      treatments: [],
      departureDate: "2026-10-27",
    });

    assert.strictEqual(res.autorizada, true);
    assert.ok(res.codigoGuia.startsWith("GUIA-PORC-"));

    const cert = PorcineTraceabilityService.generateTraceabilityCertificate(res);
    assert.strictEqual(cert.status, "CERTIFIED_VALID");
    assert.ok(cert.certificateId.startsWith("CERT-AI-GRC-"));
    assert.ok(cert.integrityHash.startsWith("SHA256-SIM-"));
    assert.strictEqual(cert.complianceStandard, "Real Decreto 787/2023 y Ley 8/2003 de Sanidad Animal");
  });
});

describeFn("PorcineTraceabilityService: Calculo de FCR (Feed Conversion Ratio)", () => {
  testFn("Rechaza entradas no numéricas para feedKg/gainKg", () => {
    assert.throws(() => PorcineTraceabilityService.calculateFCR("100", 25), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR(100, "25"), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR(null, 25), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR(100, undefined), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR({}, []), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR(NaN, 25), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR(100, NaN), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR(Infinity, 25), Error);
    assert.throws(() => PorcineTraceabilityService.calculateFCR(100, -Infinity), Error);
  });

  testFn("Lanza error ante division por cero (gainKg === 0)", () => {
    assert.throws(() => PorcineTraceabilityService.calculateFCR(250, 0), Error);
  });

  testFn("Calcula correctamente feedKg / gainKg para valores numéricos válidos con gainKg > 0", () => {
    assert.strictEqual(PorcineTraceabilityService.calculateFCR(250, 50), 5);
    assert.strictEqual(PorcineTraceabilityService.calculateFCR(300, 75), 4);
    assert.strictEqual(PorcineTraceabilityService.calculateFCR(275.5, 55.1), 275.5 / 55.1);
    assert.strictEqual(PorcineTraceabilityService.calculateFCR(150, 30), 5);
  });
});

describeFn("MotorTrazabilidad: Integracion en el Ecosistema y Evaluacion Porcina", () => {
  const MotorTrazabilidad = require(path.join(__dirname, "..", "js", "trazabilidad.js"));

  testFn("MotorTrazabilidad expone el metodo evaluarMovimientoPorcino en el core", () => {
    assert.strictEqual(typeof MotorTrazabilidad.evaluarMovimientoPorcino, "function");
  });

  testFn("MotorTrazabilidad bloquea movimiento si REGA es invalido", async () => {
    const res = await MotorTrazabilidad.evaluarMovimientoPorcino(null, {
      origenREGA: "INVALID_REGA",
      destinoREGA: "ES410000000002",
      batch: { batchId: "LOTE-PORC-01", categoria: "cebo", numAnimales: 50 },
    });
    assert.strictEqual(res.isApto, false);
    assert.strictEqual(res.estado, "BLOQUEO_ZOOSANITARIO");
  });

  testFn("MotorTrazabilidad autoriza movimiento pecuario conforme a RD 787/2023", async () => {
    const res = await MotorTrazabilidad.evaluarMovimientoPorcino(null, {
      origenREGA: "ES110000000001",
      destinoREGA: "ES410000000002",
      batch: { batchId: "LOTE-PORC-01", categoria: "cebo", numAnimales: 50, fechaIngreso: "2026-05-01" },
      tratamientos: []
    });
    assert.strictEqual(res.isApto, true);
    assert.strictEqual(res.estado, "MOVIMIENTO_AUTORIZADO");
  });
});

console.log("\nTODAS LAS PRUEBAS DE TRAZABILIDAD PORCINA SUPERADAS SATISFACTORIAMENTE.\n");
