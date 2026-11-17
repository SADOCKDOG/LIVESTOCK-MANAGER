const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const dbSource = fs.readFileSync(require.resolve('../js/db.js'), 'utf8');
const animalsSource = fs.readFileSync(require.resolve('../js/animales.js'), 'utf8');

function evaluateFunction(source, signature, context) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `No se encontró ${signature}`);
  let depth = 0;
  let end = -1;
  const opening = source.indexOf('{', start);
  for (let index = opening; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }
  assert.notEqual(end, -1, `No se pudo extraer ${signature}`);
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
}

test('la migración v29 convierte el índice caravana en no único sin tocar los registros', () => {
  const helper = dbSource.match(/function migrarIndiceCaravanaCompartida\(database, transaction\)\s*\{[\s\S]*?\n\}/);
  assert.ok(helper, 'db.js debe declarar la migración del índice caravana');
  assert.match(dbSource, /const DB_VERSION = 31;/);

  const operations = [];
  const indexNames = {
    contains: (name) => name === 'caravana',
  };
  const store = {
    indexNames,
    index: () => ({ unique: true }),
    deleteIndex: (name) => operations.push(['deleteIndex', name]),
    createIndex: (name, keyPath, options) => operations.push(['createIndex', name, keyPath, options]),
  };
  const database = { objectStoreNames: { contains: (name) => name === 'animales' } };
  const transaction = { objectStore: (name) => {
    assert.equal(name, 'animales');
    return store;
  } };
  const context = { console };
  evaluateFunction(dbSource, 'function migrarIndiceCaravanaCompartida(database, transaction)', context);

  context.migrarIndiceCaravanaCompartida(database, transaction);
  assert.deepEqual(JSON.parse(JSON.stringify(operations)), [
    ['deleteIndex', 'caravana'],
    ['createIndex', 'caravana', 'numero_identificacion', { unique: false }],
  ]);
});

test('la marca REGA ordinaria porcina puede repetirse y los identificadores individuales no', () => {
  const context = {};
  evaluateFunction(animalsSource, 'function identificadorCompartido(data)', context);

  assert.equal(context.identificadorCompartido({ especieId: 2, tipoIdentificadorId: 16 }), true);
  assert.equal(context.identificadorCompartido({ especieId: '2', tipoIdentificadorId: '16' }), true);
  assert.equal(context.identificadorCompartido({ especieId: 1, tipoIdentificadorId: 16 }), false);
  assert.equal(context.identificadorCompartido({ especieId: 2, tipoIdentificadorId: 3 }), false);
});

test('al editar se revalida unicidad si el animal deja de usar la marca compartida', () => {
  const context = {};
  evaluateFunction(animalsSource, 'function identificadorCompartido(data)', context);
  evaluateFunction(animalsSource, 'function debeComprobarUnicidadIdentificador(data, esEdicion, actual, crotal)', context);

  const actualPig = { especieId: 2, tipoIdentificadorId: 16, numero_identificacion: 'ES219999999999' };
  assert.equal(context.debeComprobarUnicidadIdentificador(
    { especieId: 2, tipoIdentificadorId: 16 }, true, actualPig, 'ES219999999999'
  ), false);
  assert.equal(context.debeComprobarUnicidadIdentificador(
    { especieId: 1, tipoIdentificadorId: 16 }, true, actualPig, 'ES219999999999'
  ), true);
  assert.equal(context.debeComprobarUnicidadIdentificador(
    { especieId: 1, tipoIdentificadorId: 16 }, false, null, 'ES219999999999'
  ), true);
});


test('la migración v30 crea el almacén contextual equino con índices trazables', () => {
  const helper = dbSource.match(/function crearStoreContextosIdentificacion\(database\)\s*\{[\s\S]*?\n\}/);
  assert.ok(helper, 'db.js debe declarar la creación del almacén contextual');

  const operations = [];
  const database = {
    objectStoreNames: { contains: () => false },
    createObjectStore: (name, options) => {
      operations.push(['createObjectStore', name, options]);
      return { createIndex: (...args) => operations.push(['createIndex', ...args]) };
    },
  };
  const context = {};
  evaluateFunction(dbSource, 'function crearStoreContextosIdentificacion(database)', context);
  context.crearStoreContextosIdentificacion(database);

  assert.deepEqual(JSON.parse(JSON.stringify(operations)), [
    ['createObjectStore', 'contextos_identificacion', { keyPath: 'id', autoIncrement: true }],
    ['createIndex', 'animalId', 'animalId'],
    ['createIndex', 'fincaId', 'fincaId'],
    ['createIndex', 'tipo', 'tipo'],
    ['createIndex', 'estado', 'estado'],
  ]);
  assert.match(dbSource, /contextos_identificacion/);
  assert.match(dbSource, /const DB_VERSION = 31;/);
});
