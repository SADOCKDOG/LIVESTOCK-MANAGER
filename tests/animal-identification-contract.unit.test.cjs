const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../js/animales.js'), 'utf8');

function createAnimalModel() {
  const state = { saved: null, writes: 0 };
  const window = {
    db: {
      async get() { return null; },
      async getAllFromIndex() { return []; },
      async getFromIndex() { return null; },
      async add(_store, value) {
        state.writes += 1;
        state.saved = structuredClone(value);
        return 17;
      },
      async put(_store, value) {
        state.writes += 1;
        state.saved = structuredClone(value);
      },
    },
    ErrorHandler: {
      async tryAsync(operation) { return operation(); },
      async validateCrotal(value) { return String(value).trim().toUpperCase().replace(/[\s-]/g, ''); },
    },
  };

  vm.runInNewContext(source, { window, ErrorHandler: window.ErrorHandler, console, Date });
  window.Animales._registrarEventoCenso = async () => {};
  return { model: window.Animales, state };
}

const baseAnimal = {
  numero_identificacion: 'ES240100000001',
  especie: 'Ovejas',
  especieId: 3,
  tipoIdentificadorId: 4,
};

function structuredIdentification() {
  return {
    identificadores: [
      {
        tipo: 'codigo_nacional',
        valor: 'ES240100000001',
        valorLeido: 'es 240100000001',
        principal: true,
        estado: 'vigente',
      },
      {
        tipo: 'transpondedor_iso',
        valor: '009724000000000001',
        principal: false,
        estado: 'vigente',
        medio: 'electronico',
      },
    ],
    documentos_identificacion: [
      { tipo: 'OTRO', numero: 'DOC-0007', emisor: 'Autoridad de prueba' },
    ],
  };
}

test('rechaza un contrato estructurado si identificadores no es una lista', async () => {
  const { model, state } = createAnimalModel();

  await assert.rejects(
    model.save({ ...baseAnimal, identificadores: { tipo: 'ueln', valor: 'AAABBB000000001' } }),
    /identificadores debe ser una lista/
  );
  assert.equal(state.writes, 0);
});

test('rechaza tipos de identificador fuera del contrato', async () => {
  const { model, state } = createAnimalModel();

  await assert.rejects(
    model.save({
      ...baseAnimal,
      identificadores: [{ tipo: 'documento_die', valor: 'DIE-1', principal: true, estado: 'vigente' }],
    }),
    /tipo de identificador no admitido/
  );
  assert.equal(state.writes, 0);
});

test('rechaza mas de un identificador principal', async () => {
  const { model, state } = createAnimalModel();

  await assert.rejects(
    model.save({
      ...baseAnimal,
      identificadores: [
        { tipo: 'codigo_nacional', valor: baseAnimal.numero_identificacion, principal: true, estado: 'vigente' },
        { tipo: 'ueln', valor: baseAnimal.numero_identificacion, principal: true, estado: 'vigente' },
      ],
    }),
    /como máximo un identificador principal/
  );
  assert.equal(state.writes, 0);
});

test('permite persistir solo identificadores secundarios sin reclasificar una ficha heredada', async () => {
  const { model, state } = createAnimalModel();
  const secondary = [
    { tipo: 'ueln', valor: 'FRABC12345678901', principal: false, estado: 'pendiente' },
    { tipo: 'transpondedor_iso', valor: '009724000000000001', principal: false, estado: 'vigente', medio: 'electronico' },
  ];

  await model.save({ ...baseAnimal, identificadores: secondary });

  assert.deepEqual(JSON.parse(JSON.stringify(state.saved.identificadores)), secondary);
  assert.equal(state.saved.numero_identificacion, baseAnimal.numero_identificacion);
  assert.equal(state.writes, 1);
});

test('rechaza cuando la proyeccion principal difiere de numero_identificacion', async () => {
  const { model, state } = createAnimalModel();

  await assert.rejects(
    model.save({
      ...baseAnimal,
      identificadores: [{ tipo: 'codigo_nacional', valor: 'ES240100000002', principal: true, estado: 'vigente' }],
    }),
    /identificador principal debe coincidir/
  );
  assert.equal(state.writes, 0);
});

test('no persiste una proyeccion principal distinta tras normalizar el identificador', async () => {
  const { model, state } = createAnimalModel();
  const numero = 'es240100000001';

  await assert.rejects(
    model.save({
      ...baseAnimal,
      numero_identificacion: numero,
      identificadores: [{ tipo: 'codigo_nacional', valor: numero, principal: true, estado: 'vigente' }],
    }),
    /identificador principal debe coincidir/
  );
  assert.equal(state.writes, 0);
});

test('conserva los identificadores y documentos tipados, incluidos ceros iniciales', async () => {
  const { model, state } = createAnimalModel();
  const identification = structuredIdentification();

  await model.save({ ...baseAnimal, ...identification });

  assert.deepEqual(JSON.parse(JSON.stringify(state.saved.identificadores)), identification.identificadores);
  assert.deepEqual(JSON.parse(JSON.stringify(state.saved.documentos_identificacion)), identification.documentos_identificacion);
  assert.equal(state.saved.numero_identificacion, baseAnimal.numero_identificacion);
  assert.equal(state.saved.identificadores[0].valorLeido, 'es 240100000001');
  assert.equal(state.saved.identificadores[1].valor, '009724000000000001');
  assert.equal(state.writes, 1);
});


test('valida la representación declarada de lecturas de transpondedor', async () => {
  const { model, state } = createAnimalModel();
  await model.save({
    ...baseAnimal,
    identificadores: [{
      tipo: 'transpondedor_iso',
      valor: '009724000000000001',
      representacion: 'iso_completa',
      principal: false,
      estado: 'pendiente',
    }],
  });
  assert.equal(state.saved.identificadores[0].representacion, 'iso_completa');

  await assert.rejects(
    model.save({
      ...baseAnimal,
      identificadores: [{
        tipo: 'transpondedor_iso',
        valor: '009724000000000001',
        representacion: 'inventada',
        principal: false,
        estado: 'pendiente',
      }],
    }),
    /representacion no admitida/,
  );
});

test('mantiene el guardado heredado sin crear arreglos estructurados', async () => {
  const { model, state } = createAnimalModel();

  await model.save(baseAnimal);

  assert.equal(state.writes, 1);
  assert.equal(Object.hasOwn(state.saved, 'identificadores'), false);
  assert.equal(Object.hasOwn(state.saved, 'documentos_identificacion'), false);
});



test("acepta metadatos locales de verificación en identificadores y documentos", async () => {
  const { model, state } = createAnimalModel();
  const data = {
    identificadores: [{
      tipo: "ueln", valor: "FRABC12345678901", principal: false, estado: "vigente",
      verificadoPor: "Veterinaria Ana", fechaVerificacion: "2026-11-14", referenciaVerificacion: "DIE revisado",
    }],
    documentos_identificacion: [{
      tipo: "DIE", numero: "DIE-2026-0042", estado: "vigente",
      verificadoPor: "Veterinaria Ana", fechaVerificacion: "2026-11-14", referenciaVerificacion: "Copia del DIE",
    }],
  };

  await model.save({ ...baseAnimal, ...data });
  assert.equal(state.saved.identificadores[0].fechaVerificacion, "2026-11-14");
  assert.equal(state.saved.documentos_identificacion[0].referenciaVerificacion, "Copia del DIE");
});
