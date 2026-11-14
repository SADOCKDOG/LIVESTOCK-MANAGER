const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'animales.js'), 'utf8');

function createAnimalModel(animal) {
  const state = { animal: { ...animal }, saved: null, validateCalls: 0 };
  const window = {
    db: {
      async get(_store, id) { return Number(id) === state.animal.id ? { ...state.animal } : null; },
      async getAllFromIndex(_store, _index) { return []; },
      async put(_store, value) { state.saved = { ...value }; state.animal = { ...value }; },
    },
    ErrorHandler: {
      async tryAsync(operation) { return operation(); },
      async validateCrotal() {
        state.validateCalls++;
        throw new Error('el formato heredado ya no está permitido para una identificación nueva');
      },
    },
  };
  vm.runInNewContext(source, { window, ErrorHandler: window.ErrorHandler, console, Date });
  window.Animales._registrarEventoCenso = async () => {};
  return { model: window.Animales, state };
}

test('guardar una ficha heredada sin cambiar su identificador conserva el valor sin revalidarlo', async () => {
  const actual = {
    id: 42,
    numero_identificacion: 'ES010123456789',
    especie: 'Ovejas',
    especieId: 3,
    tipoIdentificadorId: 4,
    rebanoId: 8,
    estado: 'activo',
  };
  const { model, state } = createAnimalModel(actual);

  await model.save({ ...actual, notas: 'edición de observaciones' });

  assert.equal(state.validateCalls, 0);
  assert.equal(state.saved.numero_identificacion, actual.numero_identificacion);
  assert.equal(state.saved.notas, 'edición de observaciones');
});

test('cambiar el identificador de una ficha sí ejecuta la validación vigente', async () => {
  const actual = {
    id: 42,
    numero_identificacion: 'ES010123456789',
    especie: 'Ovejas',
    especieId: 3,
    tipoIdentificadorId: 4,
    rebanoId: 8,
    estado: 'activo',
  };
  const { model, state } = createAnimalModel(actual);

  await assert.rejects(
    model.save({ ...actual, numero_identificacion: 'ES240101234567' }),
    /formato heredado/
  );

  assert.equal(state.validateCalls, 1);
  assert.equal(state.saved, null);
});

test('cambiar el tipo de identificador revalida aunque el texto sea igual', async () => {
  const actual = {
    id: 42,
    numero_identificacion: 'ES010123456789',
    especie: 'Ovejas',
    especieId: 3,
    tipoIdentificadorId: 4,
    rebanoId: 8,
    estado: 'activo',
  };
  const { model, state } = createAnimalModel(actual);

  await assert.rejects(
    model.save({ ...actual, tipoIdentificadorId: 2 }),
    /formato heredado/
  );

  assert.equal(state.validateCalls, 1);
  assert.equal(state.saved, null);
});

test('cambiar la especie revalida aunque el texto del identificador sea igual', async () => {
  const actual = {
    id: 42,
    numero_identificacion: 'ES010123456789',
    especie: 'Ovejas',
    especieId: 3,
    tipoIdentificadorId: 4,
    rebanoId: 8,
    estado: 'activo',
  };
  const { model, state } = createAnimalModel(actual);

  await assert.rejects(
    model.save({ ...actual, especie: 'Cabras', especieId: 4 }),
    /formato heredado/
  );

  assert.equal(state.validateCalls, 1);
  assert.equal(state.saved, null);
});
