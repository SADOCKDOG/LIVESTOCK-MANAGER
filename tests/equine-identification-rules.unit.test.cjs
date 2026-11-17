const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluarElegibilidadCrotalBoton } = require('../js/equine-identification-rules.js');

const base = {
  destinoDeclarado: 'produccion_carne',
  categoriaNacimiento: 'produccion_reproduccion',
  regaNacimiento: 'ES010000000001',
  regaOrigen: 'ES010000000001',
  regaDestinoMatadero: 'ES010000000002',
  trasladoDirecto: true,
  fechaNacimiento: '2026-01-15',
  fechaPrevistaLlegada: '2026-12-10',
  codigoVisual: 'ES210112345678',
  transpondedor: '10010000724210112345678',
};

test('permite evaluar el crotal de botón con declaración de carne, origen admisible y traslado directo', () => {
  const result = evaluarElegibilidadCrotalBoton(base);
  assert.equal(result.elegible, true);
  assert.deepEqual(result.condicionesPendientes, []);
});

test('explica cada dato ausente sin clasificar automáticamente el caso como elegible', () => {
  const result = evaluarElegibilidadCrotalBoton({});
  assert.equal(result.elegible, false);
  assert.equal(result.condicionesPendientes.length, 6);
});

test('rechaza destino declarado distinto de producción de carne', () => {
  const result = evaluarElegibilidadCrotalBoton({ ...base, destinoDeclarado: 'leche' });
  assert.equal(result.elegible, false);
  assert.match(result.condicionesPendientes.join(' '), /producción de carne/i);
});

test('rechaza categorías de nacimiento no enumeradas', () => {
  const result = evaluarElegibilidadCrotalBoton({ ...base, categoriaNacimiento: 'cebo' });
  assert.equal(result.elegible, false);
  assert.match(result.condicionesPendientes.join(' '), /categoría de nacimiento/i);
});

test('exige que el REGA de origen sea el de nacimiento declarado', () => {
  const result = evaluarElegibilidadCrotalBoton({ ...base, regaOrigen: 'ES010000000099' });
  assert.equal(result.elegible, false);
  assert.match(result.condicionesPendientes.join(' '), /origen.*nacimiento/i);
});

test('requiere traslado directo al matadero', () => {
  const result = evaluarElegibilidadCrotalBoton({ ...base, trasladoDirecto: false });
  assert.equal(result.elegible, false);
  assert.match(result.condicionesPendientes.join(' '), /directamente/i);
});

test('para origen silvestre exige llegada prevista antes de cumplir 12 meses', () => {
  const result = evaluarElegibilidadCrotalBoton({
    ...base,
    categoriaNacimiento: 'silvestre_semisilvestre',
    fechaNacimiento: '2026-01-15',
    fechaPrevistaLlegada: '2027-01-14',
  });
  assert.equal(result.elegible, true);
});

test('rechaza llegada prevista el día que cumple 12 meses', () => {
  const result = evaluarElegibilidadCrotalBoton({
    ...base,
    categoriaNacimiento: 'silvestre_semisilvestre',
    fechaNacimiento: '2026-01-15',
    fechaPrevistaLlegada: '2027-01-15',
  });
  assert.equal(result.elegible, false);
  assert.match(result.condicionesPendientes.join(' '), /antes de cumplir 12 meses/i);
});

test('valida la frontera de 12 meses para nacimientos el 29 de febrero', () => {
  const result = evaluarElegibilidadCrotalBoton({
    ...base,
    categoriaNacimiento: 'silvestre_semisilvestre',
    fechaNacimiento: '2024-02-29',
    fechaPrevistaLlegada: '2025-02-28',
  });
  assert.equal(result.elegible, false);
});

test('rechaza fechas previstas ausentes o inválidas para origen silvestre', () => {
  for (const fechaPrevistaLlegada of ['', '2026-13-40']) {
    const result = evaluarElegibilidadCrotalBoton({
      ...base,
      categoriaNacimiento: 'silvestre_semisilvestre',
      fechaPrevistaLlegada,
    });
    assert.equal(result.elegible, false);
    assert.match(result.condicionesPendientes.join(' '), /fecha prevista de llegada al matadero válidas/i);
  }
});


test('aplica el formato visual equino vigente desde el 30 de junio de 2025', () => {
  const { validarFormatoCrotalVisualEquino } = require('../js/equine-identification-rules.js');
  assert.equal(validarFormatoCrotalVisualEquino('ES210112345678', '2025-06-30').valido, true);
  assert.equal(validarFormatoCrotalVisualEquino('ES011234567890', '2025-06-29').valido, true);
  assert.equal(validarFormatoCrotalVisualEquino('ES011234567890', '2025-06-30').valido, false);
});

test('valida el código del transpondedor ISO con especie equina, país y región', () => {
  const { validarTranspondedorEquino } = require('../js/equine-identification-rules.js');
  assert.equal(validarTranspondedorEquino('10010000724210112345678'), true);
  assert.equal(validarTranspondedorEquino('10020000724210112345678'), false);
});
