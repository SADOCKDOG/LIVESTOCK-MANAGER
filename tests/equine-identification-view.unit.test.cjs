const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'animales-view.js'), 'utf8');

function createView(values = {}) {
  const elements = Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value }]));
  const window = { __testElements: elements };
  const document = { getElementById: (id) => elements[id] || null };
  vm.runInNewContext(source, { window, document, console, Date });
  return { view: window.AnimalesView, elements };
}

test('guarda UELN, lectura bruta del transpondedor y DIE en campos tipados separados', () => {
  const { view } = createView({
    'a-ueln': 'FRABC12345678901',
    'a-transpondedor-equino': '  985121012345678  ',
    'a-representacion-transpondedor-equino': 'iso_completa',
    'a-die-equino': 'DIE-2026-0042',
  });

  const result = view._construirIdentificacionEstructurada({}, 5);

  assert.deepEqual(JSON.parse(JSON.stringify(result.identificadores)), [
    { tipo: 'ueln', valor: 'FRABC12345678901', principal: false, estado: 'pendiente' },
    { tipo: 'transpondedor_iso', valor: '985121012345678', representacion: 'iso_completa', principal: false, estado: 'pendiente' },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.documentos_identificacion)), [
    { tipo: 'DIE', numero: 'DIE-2026-0042', estado: 'pendiente' },
  ]);
});

test('conserva los datos estructurados heredados cuando no se edita una ficha fuera de équidos', () => {
  const existing = {
    identificadores: [{ tipo: 'otro', valor: 'LEGACY-1', principal: false, estado: 'legado' }],
    documentos_identificacion: [{ tipo: 'PASAPORTE', numero: 'P-1' }],
  };
  const { view } = createView({});

  const result = view._construirIdentificacionEstructurada(existing, 1);

  assert.deepEqual(JSON.parse(JSON.stringify(result.identificadores)), existing.identificadores);
  assert.deepEqual(JSON.parse(JSON.stringify(result.documentos_identificacion)), existing.documentos_identificacion);
});

test('requiere declarar la representación de una lectura de transpondedor equino', () => {
  const { view } = createView({
    'a-transpondedor-equino': '985121012345678',
    'a-representacion-transpondedor-equino': '',
  });

  assert.throws(
    () => view._construirIdentificacionEstructurada({}, 5),
    /representación del transpondedor/,
  );
});

test('no crea colecciones estructuradas vacías ni migra los campos equinos heredados', () => {
  const { view } = createView({});
  const result = view._construirIdentificacionEstructurada({ rfid_codigo: 'RFID-OLD', dib: 'DIB-OLD' }, 5);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {});
});

test('conserva identificadores estructurados anteriores al añadir un valor nuevo', () => {
  const previous = { tipo: 'otro', valor: 'REF-9', principal: false, estado: 'legado' };
  const { view } = createView({ 'a-ueln': 'FRABC12345678901' });

  const result = view._construirIdentificacionEstructurada({ identificadores: [previous] }, 5);

  assert.deepEqual(JSON.parse(JSON.stringify(result.identificadores[0])), previous);
  assert.equal(result.identificadores[1].tipo, 'ueln');
});

test("al vaciar campos equinos archiva las entradas activas en vez de perderlas", () => {
  const existing = {
    identificadores: [
      { tipo: "ueln", valor: "FRABC12345678901", principal: false, estado: "vigente" },
      { tipo: "transpondedor_iso", valor: "985121012345678", representacion: "nacional", principal: false, estado: "vigente" },
    ],
    documentos_identificacion: [{ tipo: "DIE", numero: "DIE-2026-0042", estado: "vigente" }],
  };
  const { view } = createView({
    "a-ueln": "",
    "a-transpondedor-equino": "",
    "a-representacion-transpondedor-equino": "",
    "a-die-equino": "",
  });

  const result = view._construirIdentificacionEstructurada(existing, 5);

  assert.deepEqual(JSON.parse(JSON.stringify(result.identificadores.map((item) => item.estado))), ["historico", "historico"]);
  assert.equal(result.documentos_identificacion[0].estado, "historico");
});

test("al cambiar la representación archiva la anterior y mantiene una sola lectura activa", () => {
  const existing = {
    identificadores: [{ tipo: "transpondedor_iso", valor: "985121012345678", representacion: "nacional", principal: false, estado: "vigente" }],
  };
  const { view } = createView({
    "a-transpondedor-equino": "985121012345678",
    "a-representacion-transpondedor-equino": "iso_completa",
  });

  const result = view._construirIdentificacionEstructurada(existing, 5);

  assert.equal(result.identificadores.length, 2);
  assert.equal(result.identificadores[0].estado, "historico");
  assert.equal(result.identificadores[1].representacion, "iso_completa");
  assert.equal(result.identificadores[1].estado, "pendiente");
});
