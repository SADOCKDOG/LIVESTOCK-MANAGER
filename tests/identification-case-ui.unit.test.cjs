const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const viewSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'animales-view.js'), 'utf8');

function createView({ association, selectedCase = '', fechaNacimiento = '' }) {
  const elements = {
    'a-especie': { selectedOptions: [{ dataset: { especieId: String(association.especieId) } }] },
    'a-tipo-crotal-oficial': { value: String(association.tipoIdentificadorId) },
    'a-fecha': { value: fechaNacimiento },
    'a-crotal': { value: '', style: {}, placeholder: '', maxLength: 32 },
    'a-rfid': { value: '', required: false, placeholder: '' },
    'a-rfid-hint': { textContent: '' },
    'crotal-format-hint': { textContent: '' },
    'crotal-length-counter': { textContent: '' },
    'a-caso-identificacion': { value: selectedCase, dataset: {} },
    'a-caso-identificacion-wrap': { style: {}, innerHTML: '' },
  };
  const window = {
    __testElements: elements,
    ErrorHandler: {
      resolverReglaCrotal(current, context) {
        if (!Array.isArray(current?.casos)) {
          if (current?.especieId === 1 && current?.formato === 'bovino_fisico') {
            return {
              formatoKey: context.fecha_nacimiento >= '2025-06-30'
                ? 'bovino_electronico_2025'
                : 'bovino_fisico',
              caso: null,
            };
          }
          return { formatoKey: current?.formato ?? null, caso: null };
        }
        const caso = current.casos.find((item) => item.id === context.casoIdentificacion);
        return { formatoKey: caso?.formato ?? null, caso: caso || null };
      },
      CROTAL_FORMATOS: {
        bovino_fisico: {
          regex: /^(?:ES)?\d{12}$/,
          descripcion: '12 dígitos',
          ayuda: 'Bovino heredado',
          placeholder: '12 dígitos',
          maxLength: 14,
          contador: 12,
        },
        bovino_electronico_2025: {
          regex: /^ES22(?:0[1-9]|1[0-9])\d{8}$/,
          descripcion: 'ES + 22 + región + 8 dígitos',
          ayuda: 'Bovino moderno: código visual y chip electrónico',
          placeholder: 'ES22 + región + 8 dígitos',
          maxLength: 14,
          contador: 14,
        },
        ovino_caprino_eid: {
          regex: /^ES24(?:0[1-9]|1[0-9])\d{8}$/,
          descripcion: 'ES + especie 24 + región + 8 dígitos',
          ayuda: 'Código visual ovino/caprino vigente',
          placeholder: 'ES24 + región + 8 dígitos',
          maxLength: 14,
          contador: 14,
        },
      },
    },
  };
  const document = { getElementById: (id) => elements[id] || null };
  vm.runInNewContext(viewSource, { window, document, console, Date });
  window.AnimalesView._especieTipoIdentificadorCache = [association];
  window.AnimalesView._testElements = elements;
  return window.AnimalesView;
}

test('la ficha resuelve el formato y la ayuda del caso elegido explícitamente', () => {
  const view = createView({
    association: {
      especieId: 3,
      tipoIdentificadorId: 2,
      casos: [{
        id: 'individual_vigente',
        nombre: 'Identificación individual vigente',
        descripcion: 'Código individual para nuevas identificaciones',
        formato: 'ovino_caprino_eid',
      }],
    },
    selectedCase: 'individual_vigente',
  });

  const result = view._getFormatoCrotalActual();

  assert.equal(result.key, 'ovino_caprino_eid');
  assert.equal(result.caso.id, 'individual_vigente');
  assert.match(result.config.ayuda, /Código individual para nuevas identificaciones/);
  assert.equal(result.config.maxLength, 14);
});

test('la ficha deja el formato sin resolver hasta que se seleccione un caso', () => {
  const view = createView({
    association: {
      especieId: 3,
      tipoIdentificadorId: 2,
      casos: [{ id: 'individual_vigente', formato: 'ovino_caprino_eid' }],
    },
  });

  const result = view._getFormatoCrotalActual();

  assert.equal(result.key, null);
  assert.equal(result.formato, null);
  assert.equal(result.requiereCaso, true);
});

test('la ficha muestra un selector de caso solo para asociaciones multicaso', () => {
  const view = createView({
    association: {
      especieId: 3,
      tipoIdentificadorId: 2,
      casos: [{ id: 'individual_vigente', nombre: 'Identificación individual vigente', formato: 'ovino_caprino_eid' }],
    },
  });
  view._actualizarSelectorCasoIdentificacion();
  const wrap = view._testElements['a-caso-identificacion-wrap'];
  assert.equal(wrap.style.display, 'block');
  assert.match(wrap.innerHTML, /CASO DE IDENTIFICACIÓN/);
  assert.match(wrap.innerHTML, /individual_vigente/);
  assert.match(wrap.innerHTML, /IDENTIFICACIÓN INDIVIDUAL VIGENTE/);
});

test('la fecha de nacimiento bovina actualiza formato y hace obligatorio el chip', () => {
  const view = createView({
    association: { especieId: 1, tipoIdentificadorId: 16, formato: 'bovino_fisico' },
    fechaNacimiento: '2026-01-01',
  });

  assert.equal(view._getFormatoCrotalActual().key, 'bovino_electronico_2025');
  view._actualizarAyudaCrotal();
  assert.equal(view._testElements['a-rfid'].required, true);
  assert.equal(view._testElements['a-rfid'].placeholder, '23 DÍGITOS ISO 11784');
  assert.match(view._testElements['a-rfid-hint'].textContent, /OBLIGATORIO/);
});
