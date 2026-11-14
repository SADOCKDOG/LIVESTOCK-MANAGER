const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const dbSource = fs.readFileSync(require.resolve('../js/db.js'), 'utf8');
const helperMatch = dbSource.match(/async function ejecutarMigracionesIdentificacion\(database\)\s*\{[\s\S]*?\n\}/);

test('la migración porcina se ejecuta aunque la migración equina ya esté marcada', async () => {
  assert.ok(helperMatch, 'db.js debe declarar el orquestador de migraciones de identificación');

  const calls = [];
  const context = {
    migrarEquinoMicrochip: async () => calls.push('equino'),
    migrarPorcinoRega: async () => calls.push('porcino'),
    console: { log() {}, warn() {} },
  };
  vm.createContext(context);
  vm.runInContext(helperMatch[0], context);

  await context.ejecutarMigracionesIdentificacion({
    get: async (_store, key) => key === 'migracion_equino_microchip' ? { value: true } : null,
  });

  assert.deepEqual(calls, ['porcino']);
});

test('el arranque de db.js invoca el orquestador de migraciones de identificación', () => {
  assert.match(dbSource, /await ejecutarMigracionesIdentificacion\(database\);/);
});
