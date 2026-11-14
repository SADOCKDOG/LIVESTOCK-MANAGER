const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function evaluate(relativeFile, window, extra = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativeFile), 'utf8');
  vm.runInNewContext(source, { window, console, Date, localStorage: extra.localStorage || { getItem: () => '1', setItem() {}, removeItem() {} }, CustomEvent: class {} });
}

test('ADSG omite codigo vacio para no colisionar en el indice unico', async () => {
  const records = [];
  const window = {
    Fincas: { async getActiveId() { return 1; } },
    db: {
      async add(_store, record) {
        if (Object.hasOwn(record, 'codigo') && records.some((item) => item.codigo === record.codigo)) {
          throw new Error("Unable to add key to index 'codigo'");
        }
        const saved = { ...record, id: records.length + 1 };
        records.push(saved);
        return saved.id;
      },
    },
  };
  evaluate('js/adsgs.js', window);

  await window.ADSGs.save({ nombre: 'ADSG Uno', codigo: '' });
  await window.ADSGs.save({ nombre: 'ADSG Dos', codigo: '   ' });

  assert.equal(records.length, 2);
  assert.ok(records.every((record) => !Object.hasOwn(record, 'codigo')));
});

test('fincas omite REGA vacio y conserva altas sucesivas', async () => {
  const records = [];
  const window = {
    PremiumManager: { isFree: () => false },
    db: {
      async add(_store, record) {
        if (Object.hasOwn(record, 'rega') && records.some((item) => item.rega === record.rega)) {
          throw new Error("Unable to add key to index 'rega'");
        }
        const saved = { ...record, id: records.length + 1 };
        records.push(saved);
        return saved.id;
      },
      async get(store, id) {
        if (store === 'fincas') {
          const record = records.find((item) => item.id === Number(id));
          return record ? { ...record } : null;
        }
        return null;
      },
      async getAll(store) { return store === 'fincas' ? records.slice() : []; },
      async put() {},
    },
  };
  const ErrorHandler = { async tryAsync(fn) { return fn(); } };
  evaluate('js/fincas.js', window, { localStorage: { getItem: () => '1', setItem() {}, removeItem() {} } });
  window.ErrorHandler = ErrorHandler;

  await window.Fincas.save({ nombre: 'Finca Uno', propietario: 'Titular', direccion: '', rega: '' });
  await window.Fincas.save({ nombre: 'Finca Dos', propietario: 'Titular', direccion: '', rega: '   ' });

  assert.equal(records.length, 2);
  assert.ok(records.every((record) => !Object.hasOwn(record, 'rega') && !Object.hasOwn(record, 'codigo_REGA')));
});

test('guardar una guia actualiza su documento legal en vez de insertar un duplicado', async () => {
  const records = [];
  const window = {
    db: {
      async getFromIndex(store, index, value) {
        assert.equal(store, 'documentos_legales');
        assert.equal(index, 'numero');
        const found = records.find((record) => record.numero === value);
        return found ? { ...found } : null;
      },
      async add(store, record) {
        assert.equal(store, 'documentos_legales');
        if (records.some((item) => item.numero === record.numero)) throw new Error('unique numero');
        const saved = { ...record, id: records.length + 1 };
        records.push(saved);
        return saved.id;
      },
      async put(store, record) {
        assert.equal(store, 'documentos_legales');
        const position = records.findIndex((item) => item.id === record.id);
        if (position < 0) throw new Error('document not found');
        records[position] = { ...record };
      },
    },
  };
  evaluate('js/views/wizards/wizard-guia-movimiento.js', window);
  const wizard = window.WizardGuiaMovimiento;
  const first = { numero_guia: 'G-12345', fecha: '2026-11-12', estado_tramite: 'borrador' };

  await wizard._guardarDocumentoLegalGuia(first, 1);
  await wizard._guardarDocumentoLegalGuia({ ...first, estado_tramite: 'presentada' }, 1);

  assert.equal(records.length, 1);
  assert.equal(records[0].estado_tramite, 'presentada');
});
