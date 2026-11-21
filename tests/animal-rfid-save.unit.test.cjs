const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const animalesSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'animales.js'), 'utf8');

function createDB(animal) {
  const animals = new Map(animal ? [[Number(animal.id), { ...animal }]] : []);
  let nextId = 30;
  return {
    animals,
    async get(store, id) { return store === 'animales' ? animals.get(Number(id)) || null : null; },
    async getAllFromIndex(store, index, value) {
      if (store !== 'animales') return [];
      return [...animals.values()].filter((row) => row[index] === value);
    },
    async getAll(store) { return store === 'animales' ? [...animals.values()] : []; },
    async getFromIndex() { return null; },
    async put(store, row) { assert.equal(store, 'animales'); animals.set(Number(row.id), { ...row }); },
    async add(store, row) {
      assert.equal(store, 'animales');
      const id = row.id == null ? nextId++ : Number(row.id);
      animals.set(id, { ...row, id });
      return id;
    },
  };
}

function loadAnimales(animal = null) {
  const db = createDB(animal);
  const rfidValidation = [];
  const window = { db };
  const ErrorHandler = {
    async tryAsync(operation) { return operation(); },
    async validateCrotal(value, especieId, _tipoIdentificadorId, context = {}) {
      if (Number(especieId) === 1 && context.fecha_nacimiento >= '2025-06-30' && !context.rfid_codigo) {
        throw new Error('El bovino nacido desde el 30/06/2025 requiere el código electrónico ISO 11784 de 23 dígitos');
      }
      return value;
    },
    async validateBovinoRfid(value) {
      rfidValidation.push(value);
      if (!/^1[0-7]02\d{2}00724(?:22)(?:0[1-9]|1[0-9])\d{8}$/.test(String(value).replace(/[\s-]/g, ''))) {
        throw new Error('El identificador electrónico debe tener 23 dígitos ISO 11784 para bovino en España');
      }
    },
  };
  vm.runInNewContext(animalesSource, {
    window, ErrorHandler, console, Date, Number, String, Set, Array, Object,
  });
  window.Animales._registrarEventoCenso = async () => {};
  return { animales: window.Animales, db, rfidValidation };
}

const bovinoHeredado = (overrides = {}) => ({
  id: 16,
  numero_identificacion: 'ES123456789016',
  especie: 'Vacas',
  especieId: 1,
  tipoIdentificadorId: 16,
  fecha_nacimiento: '2022-01-01',
  rfid_codigo: 'chip-historico',
  estado: 'activo',
  ...overrides,
});

test('al cambiar el RFID de un bovino heredado, save valida el ISO aunque conserve el crotal', async () => {
  const original = bovinoHeredado();
  const { animales, db, rfidValidation } = loadAnimales(original);

  await assert.rejects(
    animales.save({ ...original, rfid_codigo: '12345678912345678912345' }),
    /ISO 11784/
  );

  assert.deepEqual(rfidValidation, ['12345678912345678912345']);
  assert.equal((await db.get('animales', original.id)).rfid_codigo, original.rfid_codigo);
});

test('un alta bovina con RFID informado debe respetar ISO aunque la fecha sea heredada', async () => {
  const { animales, db, rfidValidation } = loadAnimales();

  await assert.rejects(
    animales.save({
      numero_identificacion: 'ES123456789029',
      especie: 'Vacas',
      especieId: 1,
      tipoIdentificadorId: 16,
      fecha_nacimiento: '2022-01-01',
      rfid_codigo: '12345678912345678912345',
    }),
    /ISO 11784/
  );

  assert.deepEqual(rfidValidation, ['12345678912345678912345']);
  assert.equal((await db.getAll('animales')).length, 0);
});

test('al cambiar a un RFID bovino ISO válido en ficha heredada, save conserva el crotal y persiste el chip', async () => {
  const original = bovinoHeredado();
  const rfid = '10020000724220112345678';
  const { animales, db, rfidValidation } = loadAnimales(original);

  await animales.save({ ...original, rfid_codigo: rfid });

  assert.deepEqual(rfidValidation, [rfid]);
  assert.equal((await db.get('animales', original.id)).numero_identificacion, original.numero_identificacion);
  assert.equal((await db.get('animales', original.id)).rfid_codigo, rfid);
});

test('al guardar ficha heredada sin cambiar su RFID histórico, save no lo revalida', async () => {
  const original = bovinoHeredado();
  const { animales, db, rfidValidation } = loadAnimales(original);

  await animales.save({ ...original, notas: 'edición sin tocar identificadores' });

  assert.deepEqual(rfidValidation, []);
  assert.equal((await db.get('animales', original.id)).rfid_codigo, original.rfid_codigo);
});

test('un bovino moderno no puede guardar si se elimina el RFID obligatorio aunque el crotal no cambie', async () => {
  const original = bovinoHeredado({
    numero_identificacion: 'ES220112345678',
    fecha_nacimiento: '2025-06-30',
    tipo_identificacion: 'Completa (EID + Visual)',
    rfid_codigo: '10020000724220112345678',
  });
  const { animales, db } = loadAnimales(original);

  await assert.rejects(
    animales.save({ ...original, rfid_codigo: '' }),
    /requiere el código electrónico ISO 11784/
  );

  assert.equal((await db.get('animales', original.id)).rfid_codigo, original.rfid_codigo);
});
