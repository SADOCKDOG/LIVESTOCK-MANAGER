const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const wizardSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'wizards', 'wizard-guia-movimiento.js'), 'utf8');

async function createSpeciesStep({ species, animals }) {
  const window = {
    db: { async getAll(store) { return store === 'config_especies' ? species : []; } },
    ComunidadesService: { getMotivosMovimiento: () => [], getConfiguracionCCAA: () => null },
    WizardManager: { create(config) { window.wizard = config; } },
  };
  const Fincas = { async getActive() { return { id: 1, comunidad_autonoma: 'Andalucía', codigo_REGA: 'ES010000000001' }; } };
  const Animales = { async list() { return animals; } };
  const Transportistas = { async list() { return []; } };
  vm.runInNewContext(wizardSource, { window, Fincas, Animales, Transportistas, App: {}, console, Date, String, Number, Array, Map });
  await window.WizardGuiaMovimiento.abrir();
  return window.wizard;
}

test('la especie existente en el censo aparece aunque falte en config_especies', async () => {
  const config = await createSpeciesStep({
    species: [{ nombre: 'Vacas' }],
    animals: [{ id: 9, especie: 'Équidos', estado: 'activo', numero_identificacion: 'EQ-9' }],
  });
  const html = await config.steps[1].content({ especie: 'Équidos', crotales: [], num_animales: 0 });
  assert.match(html, /<option value="Équidos" selected>ÉQUIDOS<\/option>/);
});

test('el selector de crotales limita la lista a la especie elegida', async () => {
  const config = await createSpeciesStep({
    species: [{ nombre: 'Vacas' }, { nombre: 'Ovejas' }],
    animals: [
      { id: 9, especie: 'Équidos', estado: 'activo', numero_identificacion: 'EQ-9' },
      { id: 10, especie: 'Vacas', estado: 'activo', numero_identificacion: 'VA-10' },
    ],
  });
  const html = await config.steps[1].content({ especie: 'Équidos', crotales: [], num_animales: 0 });
  assert.match(html, /value="EQ-9"/);
  assert.doesNotMatch(html, /value="VA-10"/);
});

test('al cambiar la especie, oculta y desmarca crotales de otras especies', async () => {
  const config = await createSpeciesStep({
    species: [{ nombre: 'Vacas' }, { nombre: 'Équidos' }],
    animals: [
      { id: 9, especie: 'Équidos', estado: 'activo', numero_identificacion: 'EQ-9' },
      { id: 10, especie: 'Vacas', estado: 'activo', numero_identificacion: 'VA-10' },
    ],
  });
  const step = config.steps[1];
  const handlers = {};
  const count = { value: '2' };
  const rows = [
    { dataset: { especie: 'équidos' }, checked: true, label: { style: { display: '' } } },
    { dataset: { especie: 'vacas' }, checked: true, label: { style: { display: '' } } },
  ];
  rows.forEach((row) => { row.closest = () => row.label; row.addEventListener = () => {}; });
  const speciesSelect = {
    value: '',
    addEventListener(event, handler) { handlers[event] = handler; },
  };
  const stepElement = {
    querySelector(selector) { return selector === '#w-mv-especie' ? speciesSelect : count; },
    querySelectorAll(selector) {
      if (selector === '.mv-crotal-chk') return rows;
      if (selector === '.mv-crotal-chk:checked') return rows.filter((row) => row.checked);
      return [];
    },
  };

  step.onRender({}, stepElement);
  speciesSelect.value = 'Équidos';
  handlers.change();

  assert.equal(rows[0].label.style.display, '');
  assert.equal(rows[1].label.style.display, 'none');
  assert.equal(rows[0].checked, true);
  assert.equal(rows[1].checked, false);
  assert.equal(count.value, 1);
});
